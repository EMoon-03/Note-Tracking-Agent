# Notes-Agent

What it does is that it converts documents, images, and presentations into structured notes using the Ollama AI — so we don't need any API key.

## What it does

We simply drop into the agent a file, which returns markdown notes with a summary, key concepts, main points, and small editable comments.

**Supported file types:** `.txt` `.md` `.csv` `.pdf` `.pptx` `.jpg` `.png` `.gif` `.webp`

## Requirements

- [Ollama](https://ollama.com) (runs the AI locally on your machine)
- Python 3 or Node.js

## Setup

**1. Install Ollama and pull the model**
```bash
sudo pacman -S ollama        # or download from ollama.com
sudo systemctl enable --now ollama
ollama pull llava            # ~4.5 GB, one-time download
```

**2a. Python**
```bash
cd python
pip install -r requirements.txt
```

**2b. Node.js**
```bash
cd nodejs
npm install
```

## Usage

**Python**
```bash
cd python
python cli.py lecture.pdf
python cli.py diagram.png --style professional
python cli.py slides.pptx --output notes.md
python cli.py report.pdf --style academic --instructions "Focus on methodology"
```

**Node.js**
```bash
cd nodejs
node src/cli.js lecture.pdf
node src/cli.js report.pdf --style academic --output notes.md
```

## Options

| Flag | Description | Default |
|---|---|---|
| `--style` | `auto` `academic` `professional` `technical` | `auto` |
| `--output` | Save notes to a `.md` file | prints to terminal |
| `--instructions` | Extra guidance for the AI | — |
| `--model` | Ollama model to use | `llava` |
