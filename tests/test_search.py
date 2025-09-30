import os
import json
from backend.app.index_store import add_embeddings_with_metadata, save_index, load_or_init_index, connect_db
from backend.app.embeddings import embed_texts


def test_similarity_flow(tmp_path, monkeypatch):
  # Build a tiny index for test
  texts = ["solar panel efficiency", "wind turbine", "battery storage"]
  embs = embed_texts(texts)
  metas = [{"content": t, "file_name": "test.txt", "file_type": "text", "page_number": None, "timestamp": None, "filepath": "/tmp/test.txt"} for t in texts]
  added = add_embeddings_with_metadata(embs, metas)
  assert added == 3

  # simple check: embedding the same text should retrieve itself at top
  from backend.app.rag import similarity_search
  res = similarity_search("solar panel", 3)
  assert res and any("solar" in r["content"] for r in res)


