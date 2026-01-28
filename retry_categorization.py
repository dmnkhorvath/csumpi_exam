#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.9"
# dependencies = [
#     "google-genai",
# ]
# ///
"""
Retry failed categorizations from categorized_questions.json

Usage:
    export GOOGLE_API_KEY="your-api-key"
    uv run retry_categorization.py [options]
"""

import argparse
import json
import logging
import os
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from google import genai
from google.genai import types


CATEGORIES = [
    "Általános anatómia és kortan",
    "A mozgás szerv rendszere",
    "Keringés",
    "Légzőrendszer",
    "Idegrendszer",
    "Kiválasztás szervrendszere",
    "Szaporodás szervrendszere",
    "A neuroendokrin rendszer",
    "Az érzékszervek és emlő",
    "Elsősegélynyújtás",
    "Emésztés",
]

SYSTEM_PROMPT = f"""You are a medical exam question categorizer. Your task is to categorize Hungarian medical exam questions into exactly one of these categories:

{chr(10).join(f'{i+1}. {cat}' for i, cat in enumerate(CATEGORIES))}

Rules:
- Choose the SINGLE most appropriate category based on the question content
- Return ONLY a JSON object with "category" and "reasoning" fields
- If a question spans multiple topics, choose the PRIMARY topic

Category guidelines:
- "Általános anatómia és kortan": General anatomy, body types, cell biology, health factors, pathology basics
- "A mozgás szerv rendszere": Bones, muscles, joints, spine, limbs, musculoskeletal diseases
- "Keringés": Heart, blood vessels, blood, circulation, cardiovascular diseases
- "Légzőrendszer": Lungs, respiratory tract, breathing, respiratory diseases
- "Idegrendszer": Brain, spinal cord, nerves, neurological diseases, reflexes
- "Kiválasztás szervrendszere": Kidneys, urinary system, urine, excretion
- "Szaporodás szervrendszere": Reproductive organs, pregnancy, sexual development
- "A neuroendokrin rendszer": Hormones, glands (thyroid, pituitary, adrenal), endocrine diseases
- "Az érzékszervek és emlő": Eyes, ears, skin sensation, breast anatomy and diseases
- "Elsősegélynyújtás": First aid, emergency care, resuscitation, trauma care
- "Emésztés": Digestive system, stomach, intestines, liver, nutrition, vitamins
"""


def setup_logging() -> logging.Logger:
    logger = logging.getLogger("retry_categorizer")
    logger.setLevel(logging.DEBUG)
    logger.handlers = []

    ch = logging.StreamHandler()
    ch.setLevel(logging.INFO)
    ch.setFormatter(logging.Formatter('%(message)s'))
    logger.addHandler(ch)

    return logger


def extract_json_from_response(text: str) -> dict:
    """Extract JSON from response, handling markdown code blocks."""
    if not text:
        raise ValueError("Empty response")

    # Try direct JSON parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try to extract from markdown code block
    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', text)
    if json_match:
        return json.loads(json_match.group(1).strip())

    # Try to find JSON object in text
    json_match = re.search(r'\{[\s\S]*\}', text)
    if json_match:
        return json.loads(json_match.group(0))

    raise ValueError(f"Could not extract JSON from: {text[:100]}")


def categorize_question(
    question: dict,
    client: genai.Client,
    model: str,
    max_retries: int = 3
) -> dict:
    """Categorize a single question using Gemini."""

    data = question.get("data", {})
    question_text = data.get("question_text", "")
    correct_answer = data.get("correct_answer", "")

    prompt = f"""Categorize this Hungarian medical exam question:

Question: {question_text}

Correct Answer: {correct_answer}

Return ONLY a JSON object with "category" and "reasoning" fields. No markdown, no explanation."""

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=[
                    types.Content(
                        role="user",
                        parts=[types.Part.from_text(text=prompt)]
                    )
                ],
                config=types.GenerateContentConfig(
                    system_instruction=SYSTEM_PROMPT,
                    temperature=0.1,
                    max_output_tokens=1024,
                )
            )

            result = extract_json_from_response(response.text)

            # Validate category
            category = result.get("category", "")
            if category not in CATEGORIES:
                for cat in CATEGORIES:
                    if cat.lower() in category.lower() or category.lower() in cat.lower():
                        category = cat
                        break

            return {
                "success": True,
                "category": category,
                "reasoning": result.get("reasoning", "")
            }

        except (json.JSONDecodeError, ValueError) as e:
            if attempt < max_retries - 1:
                time.sleep(0.5)
                continue
            return {
                "success": False,
                "error": f"JSON parse error: {e}",
                "raw_response": response.text if 'response' in locals() else None
            }
        except Exception as e:
            if "429" in str(e) and attempt < max_retries - 1:
                time.sleep((attempt + 1) * 2)
                continue
            return {
                "success": False,
                "error": str(e)
            }

    return {"success": False, "error": "Max retries exceeded"}


def main():
    parser = argparse.ArgumentParser(description='Retry failed categorizations.')
    parser.add_argument('-i', '--input', type=Path, default=Path('categorized_questions.json'),
                        help='Input file (default: categorized_questions.json)')
    parser.add_argument('-m', '--model', default='gemini-3-flash-preview', help='Gemini model')
    parser.add_argument('-w', '--workers', type=int, default=10, help='Parallel workers')

    args = parser.parse_args()
    logger = setup_logging()

    # Load existing data
    with open(args.input, 'r', encoding='utf-8') as f:
        all_questions = json.load(f)

    # Find failed items
    failed_indices = []
    for i, q in enumerate(all_questions):
        cat = q.get("categorization", {})
        if not cat.get("success", False):
            failed_indices.append(i)

    logger.info(f"Found {len(failed_indices)} failed categorizations to retry")

    if not failed_indices:
        logger.info("Nothing to retry!")
        return

    # Check API key
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        logger.error("GOOGLE_API_KEY not set")
        sys.exit(1)

    client = genai.Client(api_key=api_key)
    save_lock = threading.Lock()

    def save_results():
        with save_lock:
            with open(args.input, 'w', encoding='utf-8') as f:
                json.dump(all_questions, f, indent=2, ensure_ascii=False)

    # Retry failed items
    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        future_to_idx = {
            executor.submit(categorize_question, all_questions[i], client, args.model): i
            for i in failed_indices
        }

        completed = 0
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                result = future.result()
                all_questions[idx]["categorization"] = result
            except Exception as e:
                all_questions[idx]["categorization"] = {"success": False, "error": str(e)}

            completed += 1
            if completed % 10 == 0 or completed == len(failed_indices):
                save_results()
                logger.info(f"Progress: {completed}/{len(failed_indices)} retried (saved)")

    # Final summary
    still_failed = sum(1 for i in failed_indices if not all_questions[i].get("categorization", {}).get("success"))
    logger.info(f"\nRetry complete!")
    logger.info(f"Fixed: {len(failed_indices) - still_failed}/{len(failed_indices)}")
    logger.info(f"Still failing: {still_failed}")


if __name__ == '__main__':
    main()
