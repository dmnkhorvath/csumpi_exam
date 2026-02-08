#!/usr/bin/env python3
"""
Extract questions containing 'latin' (case-insensitive) in question_text field.
Creates a Latin category file following the existing category JSON format.
"""

import json
import re
from pathlib import Path
from typing import Any


def load_questions(input_file: Path) -> list[dict[str, Any]]:
    """Load questions from JSON file."""
    with open(input_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def contains_latin(question: dict[str, Any]) -> bool:
    """Check if question_text contains 'latin' (case-insensitive)."""
    question_text = question.get('data', {}).get('question_text', '')
    return bool(re.search(r'latin', question_text, re.IGNORECASE))


def create_latin_category_file(questions: list[dict[str, Any]], output_file: Path) -> None:
    """
    Create a category JSON file for Latin questions.

    Structure matches existing category files:
    {
        "category_name": "Latin",
        "groups": [[question1, question2], [question3], ...]
    }

    Since these are cross-category questions, we treat each as its own group.
    """
    # Filter questions containing 'latin'
    latin_questions = [q for q in questions if contains_latin(q)]

    # Create groups - each question is its own group since they're from different categories
    # Sort by similarity_group_id to keep similar questions together if they exist
    groups = []
    for question in latin_questions:
        groups.append([question])

    # Create output structure
    output_data = {
        "category_name": "Latin",
        "groups": groups
    }

    # Write to file
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

    print(f"✓ Created {output_file}")
    print(f"✓ Found {len(latin_questions)} questions containing 'latin'")
    print(f"✓ Created {len(groups)} groups")


def main():
    """Main entry point."""
    # Paths
    input_file = Path('public/categorized_questions_with_similarity.json')
    output_file = Path('public/categories/latin.json')

    # Verify input exists
    if not input_file.exists():
        print(f"✗ Input file not found: {input_file}")
        return 1

    # Load questions
    print(f"Loading questions from {input_file}...")
    questions = load_questions(input_file)
    print(f"✓ Loaded {len(questions)} total questions")

    # Create Latin category file
    create_latin_category_file(questions, output_file)

    return 0


if __name__ == '__main__':
    exit(main())
