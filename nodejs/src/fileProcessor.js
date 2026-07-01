/**
 * fileProcessor.js — Reads files and prepares content for the local Ollama AI
 *
 * Returns objects shaped like: { text: string, images: string[] }
 *   - text:   the text content or prompt to send
 *   - images: base64-encoded image strings (empty array if no image)
 *
 * The Ollama JS client expects images as base64 strings (without the
 * "data:image/..." prefix — just the raw base64 data).
 */

import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { extname, basename } from "path";
import officeParser from "officeparser";

// ─── Supported file types ─────────────────────────────────────────────────────

const SUPPORTED_EXTENSIONS = {
  ".txt": "text",
  ".md": "text",
  ".csv": "text",
  ".py": "text",
  ".js": "text",
  ".html": "text",
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".gif": "image",
  ".webp": "image",
  ".pdf": "pdf",
  ".pptx": "pptx",
};

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * @param {string} filePath
 * @returns {Promise<{text: string, images: string[]}>}
 */
export async function processFile(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const ext = extname(filePath).toLowerCase();
  const fileType = SUPPORTED_EXTENSIONS[ext];

  if (!fileType) {
    throw new Error(
      `Unsupported file type: '${ext}'\n` +
      `Supported: ${Object.keys(SUPPORTED_EXTENSIONS).join(", ")}`
    );
  }

  const fileName = basename(filePath);

  switch (fileType) {
    case "text":  return processText(filePath, fileName);
    case "image": return processImage(filePath, fileName);
    case "pdf":   return processDocument(filePath, fileName);
    case "pptx":  return processDocument(filePath, fileName);
  }
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function processText(filePath, fileName) {
  const text = await readFile(filePath, "utf-8");
  return {
    text: `Here is the content of '${fileName}':\n\n${text}`,
    images: [],
  };
}

async function processImage(filePath, fileName) {
  /**
   * CONCEPT: We read the image as a binary Buffer, then convert it to a
   * base64 string. Base64 turns binary data into regular text characters
   * so it can be sent as part of a JSON message.
   *
   * The Ollama JS client expects the raw base64 string — no "data:image/..."
   * prefix, just the encoded bytes.
   */
  const buffer = await readFile(filePath);
  const base64 = buffer.toString("base64");

  return {
    text: `The image is named '${fileName}'. Generate notes from its content.`,
    images: [base64],
  };
}

async function processDocument(filePath, fileName) {
  /**
   * officeparser extracts text from PDFs, .pptx, .docx, and .xlsx files.
   * It returns a Promise that resolves to the extracted plain text.
   *
   * CONCEPT: Local models like llava work with plain text — they can't
   * read the raw binary format of PDFs or Office files directly. We extract
   * the text first, then send that text to the model.
   */
  const text = await officeParser.parseOfficeAsync(filePath);

  if (!text || text.trim().length === 0) {
    throw new Error(
      `No text could be extracted from '${fileName}'. ` +
      `It may be an image-only/scanned file.`
    );
  }

  return {
    text: `Here is the text extracted from '${fileName}':\n\n${text}`,
    images: [],
  };
}
