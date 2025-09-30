from __future__ import annotations

import os
from typing import List, Tuple

import numpy as np
import torch
from PIL import Image
from sentence_transformers import SentenceTransformer
import open_clip


_text_model: SentenceTransformer | None = None
_clip_model: torch.nn.Module | None = None
_clip_preprocess = None


def get_text_model() -> SentenceTransformer:
    global _text_model
    if _text_model is None:
        _text_model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    return _text_model


def get_clip() -> tuple[torch.nn.Module, any]:
    global _clip_model, _clip_preprocess
    if _clip_model is None:
        model, _, preprocess = open_clip.create_model_and_transforms(
            "ViT-B-32", pretrained="openai"
        )
        model.eval()
        _clip_model = model
        _clip_preprocess = preprocess
    return _clip_model, _clip_preprocess


def embed_texts(texts: List[str]) -> np.ndarray:
    model = get_text_model()
    embs = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True, batch_size=64, show_progress_bar=False)
    return embs.astype(np.float32)


def embed_image_paths(paths: List[str]) -> np.ndarray:
    model, preprocess = get_clip()
    images = [preprocess(Image.open(p).convert("RGB")) for p in paths]
    batch = torch.stack(images)
    with torch.no_grad():
        feats = model.encode_image(batch)
        feats = feats / feats.norm(dim=-1, keepdim=True)
    return feats.cpu().numpy().astype(np.float32)


