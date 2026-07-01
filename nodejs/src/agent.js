/**
 * agent.js — Generates notes using a local Ollama AI model (no API key needed!)
 *
 * CONCEPT: Ollama runs AI models directly on your computer as a local server
 * at http://localhost:11434. The `ollama` npm package talks to that server.
 * Your files never leave your machine — everything is processed locally.
 */

import ollama from "ollama";
import { writeFile } from "fs/promises";
import { processFile } from "./fileProcessor.js";

// ─── Configuration ────────────────────────────────────────────────────────────

// llava understands both text AND images — one model for all file types.
// Other options: "llama3.2-vision", "moondream", "mistral" (text only)
const DEFAULT_MODEL = "llava";

// ─── System Prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert note-taker for academic and professional use.

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

Write in clear, concise language using markdown formatting.`;

// ─── Main function ────────────────────────────────────────────────────────────

/**
 * Generate structured notes from any supported file.
 *
 * @param {string} filePath
 * @param {Object} options
 * @param {string} options.noteStyle   - "auto" | "academic" | "professional" | "technical"
 * @param {string} options.extraInstructions
 * @param {string} options.model       - Ollama model name
 * @returns {Promise<string>}          - Generated notes as markdown
 */
export async function generateNotes(
  filePath,
  { noteStyle = "auto", extraInstructions = "", model = DEFAULT_MODEL } = {}
) {
  // STEP 1 — Check Ollama is reachable
  // CONCEPT: Ollama must be running as a background service on your machine.
  // We do a quick check before processing the file to give a clear error
  // message if it's not started yet.
  try {
    await ollama.list();
  } catch {
    throw new Error(
      "Cannot connect to Ollama. Make sure it's running:\n" +
      "  sudo systemctl start ollama\n" +
      "Or in a separate terminal: ollama serve"
    );
  }

  // STEP 2 — Process the file into text (and optionally an image)
  console.log(`📄 Processing file: ${filePath}`);
  const result = await processFile(filePath);

  // STEP 3 — Build the instruction
  const instruction =
    noteStyle !== "auto"
      ? `Please generate ${noteStyle}-style notes from this content.`
      : "Please generate well-structured notes from this content.";

  const fullPrompt = result.text + "\n\n" +
    instruction +
    (extraInstructions ? `\n\nAdditional instructions: ${extraInstructions}` : "");

  // Build the Ollama message — attach images if we have them
  const userMessage = { role: "user", content: fullPrompt };
  if (result.images.length > 0) {
    userMessage.images = result.images; // base64 strings
  }

  // STEP 4 — Stream the response
  // CONCEPT: "for await...of" iterates over an async stream of chunks.
  // Each chunk contains a small piece of the model's output. Printing
  // each piece immediately gives the "typing" effect in the terminal.
  console.log(`🤖 Generating notes with ${model}...\n`);
  console.log("=".repeat(60));

  let notes = "";

  const stream = await ollama.chat({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      userMessage,
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    const piece = chunk.message.content;
    process.stdout.write(piece);
    notes += piece;
  }

  console.log("\n" + "=".repeat(60));
  return notes;
}

/**
 * Save generated notes to a markdown file.
 * @param {string} notes
 * @param {string} outputPath
 */
export async function saveNotes(notes, outputPath) {
  await writeFile(outputPath, notes, "utf-8");
  console.log(`\n✅ Notes saved to: ${outputPath}`);
}
