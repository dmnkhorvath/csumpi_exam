#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "google-genai",
# ]
# ///
"""
Retry failed image parsing.
Reads failed_images.json and reprocesses those images, updating parsed.json files.
"""

import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from google import genai
from google.genai import types


SYSTEM_PROMPT = """You are an exam question parser. Analyze the image of a Hungarian medical exam question WITH ITS SOLUTION KEY.

CRITICAL: This is a SOLVED exam. RED/underlined TEXT shows the CORRECT ANSWERS from the solution key.

How to interpret:
- BLACK text = original exam question and options
- RED text or UNDERLINED text = CORRECT ANSWER marked by solution key

Extract with EXACT text (preserve Hungarian characters: á, é, í, ó, ö, ő, ú, ü, ű):

1. question_number: e.g., "1.", "2.*", "19."
2. points: integer from "X pont"
3. question_text: the question text (BLACK text only, NO red answers)
4. question_type: "multiple_choice", "fill_in", "matching", or "open"
5. correct_answer: ONLY the correct answers (red/underlined text), each on a new line
6. options: list of ALL answer options for multiple choice questions

IMPORTANT RULES:

1. For "Húzza alá" (underline) questions:
   - question_text: include the question AND list ALL options (one per line)
   - correct_answer: list ONLY the underlined/red options (the correct ones)
   - options: array of ALL option texts

2. For fill-in/open questions where the answer is a simple list of words or short sentences:
   - question_text: ONLY the black question text, DO NOT include red answer text
   - correct_answer: the red text (the filled-in answers)
   - options: empty array

Parse this exam question image and return structured JSON."""


RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "question_number": {"type": "string"},
        "points": {"type": "integer"},
        "question_text": {"type": "string"},
        "question_type": {"type": "string", "enum": ["multiple_choice", "fill_in", "matching", "open"]},
        "correct_answer": {"type": "string"},
        "options": {"type": "array", "items": {"type": "string"}}
    },
    "required": ["question_number", "points", "question_text", "question_type", "correct_answer"]
}


def parse_single_image(image_path: Path, client: genai.Client, model: str, max_retries: int = 5) -> dict:
    """Parse a single question image with retries."""

    for attempt in range(max_retries):
        try:
            with open(image_path, "rb") as f:
                image_data = f.read()

            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[
                            types.Part.from_bytes(data=image_data, mime_type="image/png"),
                            types.Part.from_text(text=SYSTEM_PROMPT)
                        ]
                    )
                ],
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=2048,
                    response_mime_type="application/json",
                    response_schema=RESPONSE_SCHEMA,
                )
            )

            parsed = json.loads(response.text)
            return {
                "file": image_path.name,
                "success": True,
                "data": parsed
            }

        except json.JSONDecodeError as e:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            return {
                "file": image_path.name,
                "success": False,
                "error": f"JSON parse error: {e}"
            }
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                time.sleep((attempt + 1) * 3)
                continue
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            return {
                "file": image_path.name,
                "success": False,
                "error": str(e)
            }

    return {"file": image_path.name, "success": False, "error": "Max retries exceeded"}


def main():
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GOOGLE_API_KEY not set")
        sys.exit(1)

    # Load failed images
    with open("failed_images.json", "r") as f:
        failed_items = json.load(f)

    print(f"Retrying {len(failed_items)} failed images...\n")

    client = genai.Client(api_key=api_key)
    model = "gemini-2.0-flash"  # Use stable model for retries

    # Group by folder
    folders = {}
    for item in failed_items:
        folder = item['folder']
        if folder not in folders:
            folders[folder] = []
        folders[folder].append(item)

    total_fixed = 0
    total_still_failed = 0

    for folder_name, items in folders.items():
        folder_path = Path("extracted_questions") / folder_name
        parsed_file = folder_path / "parsed.json"

        # Load existing parsed.json
        with open(parsed_file, 'r', encoding='utf-8') as f:
            parsed_data = json.load(f)

        # Create lookup by filename
        parsed_lookup = {p['file']: i for i, p in enumerate(parsed_data)}

        fixed_count = 0
        for item in items:
            image_path = folder_path / item['file']
            if not image_path.exists():
                continue

            print(f"  Retrying: {folder_name}/{item['file']}...", end=" ", flush=True)
            result = parse_single_image(image_path, client, model)

            # Update in parsed_data
            if item['file'] in parsed_lookup:
                idx = parsed_lookup[item['file']]
                parsed_data[idx] = result

            if result['success']:
                print("✓")
                fixed_count += 1
                total_fixed += 1
            else:
                print(f"✗ {result.get('error', '')[:50]}")
                total_still_failed += 1

            time.sleep(0.2)  # Rate limiting

        # Save updated parsed.json
        with open(parsed_file, 'w', encoding='utf-8') as f:
            json.dump(parsed_data, f, indent=2, ensure_ascii=False)

        if fixed_count > 0:
            print(f"  Updated {parsed_file}: {fixed_count} fixed\n")

    print(f"\n{'=' * 50}")
    print(f"Fixed: {total_fixed}")
    print(f"Still failed: {total_still_failed}")


if __name__ == '__main__':
    main()
