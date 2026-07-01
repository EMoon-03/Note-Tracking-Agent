#!/usr/bin/env node
/**
 * cli.js — Command-line interface for the Notes Agent (Node.js)
 *
 * Usage:
 *   node src/cli.js lecture.pdf
 *   node src/cli.js notes.txt --style academic
 *   node src/cli.js diagram.png --model llama3.2-vision
 *   node src/cli.js slides.pptx --output my_notes.md
 *   node src/cli.js report.pdf --instructions "Focus on the conclusion"
 */

import { Command } from "commander";
import { existsSync } from "fs";
import { generateNotes, saveNotes } from "./agent.js";

const program = new Command();

program
  .name("notes-agent")
  .description("Convert documents, images, and presentations into structured notes using a local AI")
  .version("1.0.0")
  .argument("<file>", "Path to the file to convert to notes")
  .option("-s, --style <style>", "Note style: auto, academic, professional, technical", "auto")
  .option("-o, --output <file>", "Save notes to this .md file")
  .option("-i, --instructions <text>", "Extra instructions for the AI", "")
  .option("-m, --model <name>", "Ollama model to use", "llava")
  .addHelpText("after", `
file types supported:
  text          .txt  .md  .csv  .py  .js  .html
  images        .jpg  .jpeg  .png  .gif  .webp
  documents     .pdf
  presentations .pptx

examples:
  node src/cli.js lecture.pdf
  node src/cli.js diagram.png --style professional
  node src/cli.js slides.pptx --output notes.md
  node src/cli.js report.pdf --style academic --instructions "Focus on methodology"
  node src/cli.js notes.txt --model mistral
  `)
  .action(async (file, options) => {
    if (!existsSync(file)) {
      console.error(`❌ Error: File not found: '${file}'`);
      process.exit(1);
    }

    try {
      const notes = await generateNotes(file, {
        noteStyle: options.style,
        extraInstructions: options.instructions,
        model: options.model,
      });

      if (options.output) {
        await saveNotes(notes, options.output);
      }
    } catch (err) {
      console.error(`❌ ${err.message}`);
      process.exit(1);
    }
  });

program.parse();
