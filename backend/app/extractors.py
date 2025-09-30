from __future__ import annotations

import os
import subprocess
import tempfile
from dataclasses import dataclass
from typing import List, Optional, Tuple

from PIL import Image
from .image_utils import get_image_size
import fitz  # PyMuPDF
from docx import Document


@dataclass
class Chunk:
    content: str
    file_name: str
    file_type: str
    page_number: Optional[int] = None
    timestamp: Optional[str] = None
    filepath: Optional[str] = None


def _split_text(text: str, min_size: int = 400, max_size: int = 700, overlap_ratio: float = 0.2) -> List[str]:
    text = (text or "").strip()
    if not text:
        return []
    chunks: List[str] = []
    start = 0
    overlap = int(max_size * overlap_ratio)
    while start < len(text):
        end = min(start + max_size, len(text))
        # try to end at sentence boundary
        boundary = max(text.rfind(". ", start, end), text.rfind("\n", start, end))
        if boundary != -1 and boundary + 1 - start >= min_size:
            end = boundary + 1
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start = max(0, end - overlap)
    return chunks


def extract_pdf(path: str, file_name: str) -> List[Chunk]:
    doc = fitz.open(path)
    chunks: List[Chunk] = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text("text")
        for ch in _split_text(text):
            chunks.append(Chunk(content=ch, file_name=file_name, file_type="pdf", page_number=i, filepath=path))
    doc.close()
    return chunks


def extract_docx(path: str, file_name: str) -> List[Chunk]:
    doc = Document(path)
    text = "\n".join(p.text for p in doc.paragraphs)
    chunks = [Chunk(content=ch, file_name=file_name, file_type="docx", filepath=path) for ch in _split_text(text)]
    return chunks


def extract_image(path: str, file_name: str) -> List[Chunk]:
    # For images, return one chunk; embedding will use the image itself
    try:
        w, h = get_image_size(path)
    except Exception:
        w, h = None, None
    ch = Chunk(content=f"Image: {file_name}", file_name=file_name, file_type="image", filepath=path)
    # temporarily store dimensions in unused fields via setattr during metadata stage
    setattr(ch, "width", w)
    setattr(ch, "height", h)
    return [ch]


def transcribe_audio_with_whisper_cpp(path: str):
    """
    Invoke local whisper.cpp binary and return (full_transcript, segments).
    segments is a list of tuples (start_ms, end_ms, text).
    Configure via env:
      WHISPER_CPP_BIN=./models/whisper/main
      WHISPER_CPP_MODEL=./models/whisper/ggml-base.en.bin
    """
    binary = os.getenv("WHISPER_CPP_BIN", "./models/whisper/main")
    model = os.getenv("WHISPER_CPP_MODEL", "./models/whisper/ggml-base.en.bin")
    try:
        with tempfile.TemporaryDirectory() as td:
            out_prefix = os.path.join(td, "out")
            out_json = out_prefix + ".json"
            cmd = [binary, "-m", model, "-f", path, "-oj", "-of", out_prefix]
            subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if os.path.exists(out_json):
                import json
                data = json.load(open(out_json, "r", encoding="utf-8"))
                parts = []
                segments = []
                for seg in data.get("segments", []):
                    text = (seg.get("text") or "").strip()
                    if not text:
                        continue
                    parts.append(text)
                    segments.append((seg.get("t0"), seg.get("t1"), text))
                return " ".join(parts), segments
    except Exception:
        pass
    return "", []


def extract_audio(path: str, file_name: str) -> List[Chunk]:
    transcript, segments = transcribe_audio_with_whisper_cpp(path)
    chunks: List[Chunk] = []
    split = _split_text(transcript)
    for ch in split:
        c = Chunk(content=ch, file_name=file_name, file_type="audio", filepath=path)
        setattr(c, "segments", segments)
        chunks.append(c)
    return chunks


def extract_any(path: str, file_name: str, mime: str) -> List[Chunk]:
    lower = file_name.lower()
    if lower.endswith(".pdf"):
        return extract_pdf(path, file_name)
    if lower.endswith(".docx"):
        return extract_docx(path, file_name)
    if lower.endswith(('.png', '.jpg', '.jpeg', '.webp', '.bmp')):
        return extract_image(path, file_name)
    if lower.endswith(('.mp3', '.wav', '.m4a', '.flac', '.ogg')):
        return extract_audio(path, file_name)
    # Fallback: treat as plain text
    try:
        with open(path, "r", encoding="utf-8", errors="ignore") as f:
            text = f.read()
        return [Chunk(content=ch, file_name=file_name, file_type="text", filepath=path) for ch in _split_text(text)]
    except Exception:
        return []


