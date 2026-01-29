#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Deduplicate questions by keeping only the longest question_text per similarity group.
"""

import json
from pathlib import Path


def process_category_file(file_path: Path) -> tuple[int, int]:
    """Process a single category JSON file, keeping longest question per group.

    Returns (original_count, new_count) tuple.
    """
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    original_count = sum(len(group) for group in data["groups"])

    new_groups = []
    for group in data["groups"]:
        if not group:
            continue

        # Find the question with the longest question_text
        longest = max(
            group,
            key=lambda q: len(q.get("data", {}).get("question_text", ""))
        )
        new_groups.append([longest])

    data["groups"] = new_groups
    new_count = sum(len(group) for group in new_groups)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    return original_count, new_count


def main():
    categories_dir = Path(__file__).parent.parent / "public" / "categories"

    if not categories_dir.exists():
        print(f"Error: Categories directory not found: {categories_dir}")
        return 1

    json_files = list(categories_dir.glob("*.json"))

    if not json_files:
        print("No JSON files found in categories directory")
        return 1

    total_original = 0
    total_new = 0

    print(f"Processing {len(json_files)} category files...\n")

    for file_path in sorted(json_files):
        original, new = process_category_file(file_path)
        total_original += original
        total_new += new
        removed = original - new
        print(f"{file_path.stem}: {original} -> {new} (removed {removed})")

    print(f"\nTotal: {total_original} -> {total_new} (removed {total_original - total_new})")
    return 0


if __name__ == "__main__":
    exit(main())
