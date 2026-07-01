#!/usr/bin/env python3
"""
cli.py — Command-line interface for the Notes Agent

Usage:
    python cli.py lecture.pdf
    python cli.py notes.txt --style academic
    python cli.py diagram.png --model llama3.2-vision
    python cli.py slides.pptx --output my_notes.md
    python cli.py report.pdf --instructions "Focus on the methodology section"
"""

import argparse
import sys
from pathlib import Path

from agent import generate_notes, save_notes


def main() -> None:
    parser = argparse.ArgumentParser(
        prog="notes-agent",
        description="Convert documents, images, and presentations into structured notes using a local AI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
file types supported:
  text          .txt  .md  .csv  .py  .js  .html
  images        .jpg  .jpeg  .png  .gif  .webp
  documents     .pdf
  presentations .pptx

examples:
  python cli.py lecture.pdf
  python cli.py diagram.png --style professional
  python cli.py slides.pptx --output notes.md
  python cli.py report.pdf --style academic --instructions "Focus on methodology"
  python cli.py notes.txt --model mistral
        """,
    )

    parser.add_argument("file", help="Path to the file to convert to notes")
    parser.add_argument(
        "--style", "-s",
        choices=["auto", "academic", "professional", "technical"],
        default="auto",
        help="Note-taking style (default: auto)",
    )
    parser.add_argument(
        "--output", "-o",
        metavar="FILE",
        help="Save notes to this .md file",
    )
    parser.add_argument(
        "--instructions", "-i",
        default="",
        metavar="TEXT",
        help='Extra instructions, e.g. "Focus on chapter 3 only"',
    )
    parser.add_argument(
        "--model", "-m",
        default="llava",
        help="Ollama model to use (default: llava)",
    )

    args = parser.parse_args()

    if not Path(args.file).exists():
        print(f"❌ Error: File not found: '{args.file}'", file=sys.stderr)
        sys.exit(1)

    try:
        notes = generate_notes(
            file_path=args.file,
            note_style=args.style,
            extra_instructions=args.instructions,
            model=args.model,
        )
        if args.output:
            save_notes(notes, args.output)

    except RuntimeError as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)
    except (FileNotFoundError, ValueError) as e:
        print(f"❌ {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
