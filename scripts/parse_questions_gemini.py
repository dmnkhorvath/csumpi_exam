#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "google-genai",
# ]
# ///
"""
Question Parser using Google Gemini Vision (Parallel)

Parses extracted question images using Gemini with parallel processing.
Supports processing multiple folders with nested parallelism.

Usage:
    export GOOGLE_API_KEY="your-api-key"
    uv run parse_questions_gemini.py <folder_with_subfolders> [options]
"""

import argparse
import json
import logging
import os
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from google import genai
from google.genai import types


SYSTEM_PROMPT = """Parse this Hungarian medical exam image. RED TEXT = correct answers filled in by solution key.

Extract these fields:
- question_number: e.g. "1.", "2.*", "19."
- points: integer from "X pont"
- question_text: ALL BLACK text. For tables, use markdown format with empty cells where red answers appear.
- question_type: "multiple_choice" or "fill_in" or "matching" or "open"
- correct_answer: RED text only. For tables, use markdown format showing the filled answers.
- options: list of all choices for multiple choice, empty [] otherwise

TABLE FORMATTING (use markdown):
- question_text table: show structure with EMPTY cells where red answers would go
  | Header1 | Header2 |
  |---------|---------|
  | black text |  |

- correct_answer table: show the RED answers in their positions
  | Header1 | Header2 |
  |---------|---------|
  | | red answer |

RULES:
- Tables MUST be markdown format in both question_text and correct_answer
- question_text: include all BLACK text, leave answer cells EMPTY
- correct_answer: show only RED text (answers), can be markdown table or plain text
- If no red text visible, set correct_answer to ""
- Keep Hungarian characters exact (á, é, í, ó, ö, ő, ú, ü, ű)"""


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


def setup_logging(log_file: Path) -> logging.Logger:
    """Setup logging to file and console."""
    logger = logging.getLogger("gemini_parser")
    logger.setLevel(logging.DEBUG)

    # Clear existing handlers
    logger.handlers = []

    fh = logging.FileHandler(log_file, mode='w', encoding='utf-8')
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(logging.Formatter('%(asctime)s - %(levelname)s - %(message)s'))

    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter('%(message)s'))

    logger.addHandler(fh)
    logger.addHandler(ch)

    return logger


def parse_single_image(
    image_path: Path,
    client: genai.Client,
    model: str,
    max_retries: int = 3
) -> dict:
    """Parse a single question image using Gemini with structured output."""

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
            return {
                "file": image_path.name,
                "success": False,
                "error": f"JSON parse error: {e}",
                "error_type": "json_parse_error",
                "raw_response": response.text if 'response' in dir() else None
            }
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                time.sleep((attempt + 1) * 2)
                continue
            return {
                "file": image_path.name,
                "success": False,
                "error": str(e),
                "error_type": "api_error"
            }

    return {"file": image_path.name, "success": False, "error": "Max retries exceeded", "error_type": "max_retries"}


def process_folder(
    folder_path: Path,
    client: genai.Client,
    model: str,
    image_workers: int,
    logger: logging.Logger,
    json_errors_list: list,
    json_errors_lock: threading.Lock
) -> dict:
    """Process all images in a single folder."""

    image_files = sorted(
        list(folder_path.glob("*.png")) +
        list(folder_path.glob("*.jpg")) +
        list(folder_path.glob("*.jpeg"))
    )

    if not image_files:
        return {
            "folder": folder_path.name,
            "success": True,
            "question_count": 0,
            "questions": []
        }

    results = [None] * len(image_files)

    with ThreadPoolExecutor(max_workers=image_workers) as executor:
        future_to_idx = {
            executor.submit(parse_single_image, img, client, model): i
            for i, img in enumerate(image_files)
        }

        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                results[idx] = future.result()
                # Collect JSON parse errors
                if results[idx].get("error_type") == "json_parse_error":
                    with json_errors_lock:
                        json_errors_list.append({
                            "folder": folder_path.name,
                            "file": results[idx]["file"],
                            "error": results[idx]["error"],
                            "raw_response": results[idx].get("raw_response")
                        })
            except Exception as e:
                results[idx] = {
                    "file": image_files[idx].name,
                    "success": False,
                    "error": str(e),
                    "error_type": "exception"
                }

    # Save results to folder
    output_file = folder_path / "parsed.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    successful = sum(1 for r in results if r and r.get("success"))
    logger.info(f"✓ {folder_path.name}: {successful}/{len(results)} questions")

    return {
        "folder": folder_path.name,
        "success": True,
        "question_count": len(results),
        "successful": successful,
        "output_file": str(output_file)
    }


def process_folders_parallel(
    folders: list[Path],
    client: genai.Client,
    model: str,
    folder_workers: int,
    image_workers: int,
    logger: logging.Logger,
    json_errors_list: list,
    json_errors_lock: threading.Lock
) -> list[dict]:
    """Process multiple folders in parallel."""

    results = [None] * len(folders)

    logger.info(f"Processing {len(folders)} folders with {folder_workers} folder workers, {image_workers} image workers each\n")

    with ThreadPoolExecutor(max_workers=folder_workers) as executor:
        future_to_idx = {
            executor.submit(process_folder, folder, client, model, image_workers, logger, json_errors_list, json_errors_lock): i
            for i, folder in enumerate(folders)
        }

        completed = 0
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                results[idx] = future.result()
            except Exception as e:
                results[idx] = {
                    "folder": folders[idx].name,
                    "success": False,
                    "error": str(e)
                }
            completed += 1
            logger.debug(f"Folder progress: {completed}/{len(folders)}")

    return results


def main():
    parser = argparse.ArgumentParser(
        description='Parse exam question images using Google Gemini Vision (nested parallel).',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  %(prog)s extracted_questions/
  %(prog)s extracted_questions/ --folder-workers 5 --image-workers 10
  %(prog)s extracted_questions/ -fw 5 -iw 10 -o results.json
        '''
    )

    parser.add_argument('input', type=Path, help='Folder containing subfolders with images')
    parser.add_argument('-m', '--model', default='gemini-2.0-flash', help='Gemini model')
    parser.add_argument('-o', '--output', type=Path, help='Save combined results to JSON')
    parser.add_argument('-fw', '--folder-workers', type=int, default=5, help='Parallel folder workers (default: 5)')
    parser.add_argument('-iw', '--image-workers', type=int, default=10, help='Parallel image workers per folder (default: 10)')
    parser.add_argument('-l', '--log', type=Path, default=Path('gemini_parser.log'), help='Log file')

    args = parser.parse_args()

    logger = setup_logging(args.log)

    # Check API key
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GOOGLE_API_KEY not set. Get key at: https://aistudio.google.com/apikey")
        sys.exit(1)

    client = genai.Client(api_key=api_key)

    logger.info(f"Model: {args.model}")
    logger.info(f"Folder workers: {args.folder_workers}")
    logger.info(f"Image workers: {args.image_workers}")
    logger.info(f"Log: {args.log}")

    # Get folders to process
    if not args.input.is_dir():
        logger.error(f"{args.input} is not a directory")
        sys.exit(1)

    # Find all subfolders with images
    folders = []
    for item in sorted(args.input.iterdir()):
        if item.is_dir():
            # Check if folder has images
            has_images = any(item.glob("*.png")) or any(item.glob("*.jpg"))
            if has_images:
                folders.append(item)

    if not folders:
        logger.error(f"No folders with images found in {args.input}")
        sys.exit(1)

    logger.info(f"Found {len(folders)} folders to process\n")

    # Thread-safe list for collecting JSON parse errors
    json_errors_list = []
    json_errors_lock = threading.Lock()

    # Process
    results = process_folders_parallel(
        folders, client, args.model,
        args.folder_workers, args.image_workers, logger,
        json_errors_list, json_errors_lock
    )

    # Summary
    total_questions = sum(r.get('question_count', 0) for r in results if r)
    total_successful = sum(r.get('successful', 0) for r in results if r)
    successful_folders = len([r for r in results if r and r.get('success')])

    logger.info(f"\n{'=' * 50}")
    logger.info(f"Folders: {successful_folders}/{len(folders)} completed")
    logger.info(f"Questions: {total_successful}/{total_questions} parsed successfully")

    # Save combined results
    if args.output:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        logger.info(f"Results: {args.output}")

    # Save JSON parse errors to separate file
    if json_errors_list:
        errors_file = Path("json_parse_errors.json")
        with open(errors_file, 'w', encoding='utf-8') as f:
            json.dump(json_errors_list, f, indent=2, ensure_ascii=False)
        logger.info(f"JSON parse errors: {len(json_errors_list)} saved to {errors_file}")
    else:
        logger.info(f"No JSON parse errors encountered")

    logger.info(f"Individual results saved to each folder as 'parsed.json'")


if __name__ == '__main__':
    main()
