#!/usr/bin/env python3
"""
translate_csv.py — Renames CSV column headers according to column_mapping.json.

Usage:
    python translate_csv.py <input_folder> <output_folder>

The script reads column_mapping.json from the same directory as this script.
All CSV files in <input_folder> are translated and written to <output_folder>
with the same filenames. Unmapped headers are left unchanged.

Output files are written as UTF-8 with BOM (utf-8-sig) for Excel compatibility.
"""

import csv
import json
import sys
from pathlib import Path


def load_mapping(mapping_path: Path) -> dict[str, str]:
    with open(mapping_path, encoding="utf-8") as f:
        return json.load(f)


def translate_file(input_path: Path, output_path: Path, mapping: dict[str, str]) -> None:
    with open(input_path, encoding="utf-8-sig", newline="") as infile:
        reader = csv.reader(infile)
        rows = list(reader)

    if not rows:
        output_path.write_text("", encoding="utf-8-sig")
        return

    original_headers = rows[0]
    translated_headers = [mapping.get(h, h) for h in original_headers]

    with open(output_path, encoding="utf-8-sig", newline="") as _:
        pass  # ensure file is writable before starting

    with open(output_path, "w", encoding="utf-8-sig", newline="") as outfile:
        writer = csv.writer(outfile)
        writer.writerow(translated_headers)
        writer.writerows(rows[1:])


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: python translate_csv.py <input_folder> <output_folder>")
        sys.exit(1)

    script_dir = Path(__file__).parent
    mapping_path = script_dir / "column_mapping.json"

    if not mapping_path.exists():
        print(f"Error: column_mapping.json not found at {mapping_path}")
        sys.exit(1)

    mapping = load_mapping(mapping_path)

    input_folder = Path(sys.argv[1])
    output_folder = Path(sys.argv[2])

    if not input_folder.is_dir():
        print(f"Error: input folder does not exist: {input_folder}")
        sys.exit(1)

    output_folder.mkdir(parents=True, exist_ok=True)

    csv_files = sorted(input_folder.glob("*.csv"))
    if not csv_files:
        print(f"No CSV files found in {input_folder}")
        sys.exit(0)

    translated_count = 0
    for csv_path in csv_files:
        output_path = output_folder / csv_path.name
        translate_file(csv_path, output_path, mapping)
        print(f"  {csv_path.name}  →  {output_path}")
        translated_count += 1

    print(f"\nDone. {translated_count} file(s) written to {output_folder}")


if __name__ == "__main__":
    main()
