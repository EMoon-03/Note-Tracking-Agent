"""
agent.py — Generates notes using a local Ollama AI model (no API key needed!)

CONCEPT: Instead of sending your files to Anthropic's servers, we use Ollama —
a tool that runs AI models directly on your own computer. The model lives on
your machine and processes everything locally. No internet required after setup,
no API key, and your files stay private.

Ollama exposes a local server at http://localhost:11434 that our code talks to.
The Python `ollama` library handles that communication for us.
"""

import ollama
from file_processor import process_file


# ─── Configuration ────────────────────────────────────────────────────────────

# llava is a vision model — it understands BOTH text and images.
# This means one model handles all our file types.
# Other good options: "llama3.2-vision", "moondream", "mistral" (text only)
DEFAULT_MODEL = "llava"

# ─── System Prompt ────────────────────────────────────────────────────────────
# CONCEPT: Even with local models, a system prompt works the same way —
# it's a set of instructions given to the AI before your actual request.

SYSTEM_PROMPT = """You are an expert note-taker for academic and professional use.

When given content from documents, images, slides, or any file, your job is to:
1. Extract the most important information
2. Organize it into clear, well-structured notes
3. Make it easy to review, study, or reference later

Always format your notes using this structure:

# [Title based on the content]

## Summary
2–3 sentence overview of what this material covers.

## Key Concepts
- **Term/Concept**: Definition or explanation

## Main Points
- Bullet-pointed key ideas and arguments

## Details & Examples
- Supporting evidence, data, quotes, or examples

## Action Items / Follow-up Questions
- Things to research further (if applicable)

Adapt your style:
- Academic content: emphasize theories, arguments, evidence
- Professional/business: emphasize decisions, action items, metrics
- Technical: emphasize processes, steps, architecture
- Images/diagrams: describe what you see, then extract key information

Write in clear, concise language using markdown formatting."""


# ─── Main function ────────────────────────────────────────────────────────────


def generate_notes(
    file_path: str,
    note_style: str = "auto",
    extra_instructions: str = "",
    model: str = DEFAULT_MODEL,
) -> str:
    """
    Generate structured notes from any supported file using a local Ollama model.

    Args:
        file_path:          Path to the file (PDF, image, .txt, .pptx, etc.)
        note_style:         "auto", "academic", "professional", or "technical"
        extra_instructions: Extra guidance to give the model
        model:              Ollama model name (default: "llava")

    Returns:
        Generated notes as a markdown string.
    """

    # STEP 1 — Check Ollama is running
    # CONCEPT: Ollama runs as a background server on your computer.
    # If it's not running, we get a connection error here.
    try:
        ollama.list()  # Simple ping to check if Ollama is up
    except Exception:
        raise RuntimeError(
            "Cannot connect to Ollama. Make sure it's running:\n"
            "  sudo systemctl start ollama\n"
            "Or in a separate terminal: ollama serve"
        )

    # STEP 2 — Process the file
    print(f"📄 Processing file: {file_path}")
    result = process_file(file_path)

    # STEP 3 — Build the user message
    if note_style != "auto":
        instruction = f"Please generate {note_style}-style notes from this content."
    else:
        instruction = "Please generate well-structured notes from this content."

    if extra_instructions:
        instruction += f"\n\nAdditional instructions: {extra_instructions}"

    # Combine the file content with the instruction
    full_prompt = result["text"] + "\n\n" + instruction

    # Build the message Ollama expects
    message = {"role": "user", "content": full_prompt}

    # If there's an image, attach it
    if result["images"]:
        message["images"] = result["images"]

    # STEP 4 — Stream the response from Ollama
    # CONCEPT: Streaming works the same as with cloud APIs — we get the
    # response piece by piece and print each chunk as it arrives.
    print(f"🤖 Generating notes with {model}...\n")
    print("=" * 60)

    notes = ""

    stream = ollama.chat(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            message,
        ],
        stream=True,
    )

    for chunk in stream:
        text_piece = chunk["message"]["content"]
        print(text_piece, end="", flush=True)
        notes += text_piece

    print("\n" + "=" * 60)
    return notes


def save_notes(notes: str, output_path: str) -> None:
    """Save the generated notes to a markdown file."""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(notes)
    print(f"\n✅ Notes saved to: {output_path}")
