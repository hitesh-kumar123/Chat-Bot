import os
from typing import List

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from .extractors import extract_any
from .embeddings import embed_texts, embed_image_paths
from .index_store import add_embeddings_with_metadata, status as index_status, rebuild_from_db, ensure_storage
import faiss
import numpy as np
from .rag import answer_query

app = FastAPI(title="RAG Offline Chatbot Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    ensure_storage()
    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))
    os.makedirs(storage_dir, exist_ok=True)
    # mount static if not mounted yet
    if not any(r.path == "/storage" for r in app.router.routes):
        app.mount("/storage", StaticFiles(directory=storage_dir), name="storage")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    dest_path = os.path.join(storage_dir, file.filename)
    data = await file.read()
    with open(dest_path, "wb") as f:
        f.write(data)

    # Extract chunks
    chunks = extract_any(dest_path, file.filename, file.content_type or "")
    # Separate text chunks vs image entries
    text_chunks = [c for c in chunks if c.file_type in ("pdf", "docx", "text", "audio")]
    image_chunks = [c for c in chunks if c.file_type == "image"]

    vectors_added = 0
    total_chunks = 0

    if text_chunks:
        texts = [c.content for c in text_chunks]
        embs = embed_texts(texts)
        meta = [
            {
                "content": c.content,
                "file_name": c.file_name,
                "file_type": c.file_type,
                "page_number": c.page_number,
                "timestamp": c.timestamp,
                "filepath": c.filepath,
            }
            for c in text_chunks
        ]
        vectors_added += add_embeddings_with_metadata(embs, meta)
        total_chunks += len(texts)

    if image_chunks:
        paths = [c.filepath for c in image_chunks if c.filepath]
        if paths:
            embs = embed_image_paths(paths)
            meta = [
                {
                    "content": c.content,
                    "file_name": c.file_name,
                    "file_type": c.file_type,
                    "page_number": c.page_number,
                    "timestamp": c.timestamp,
                    "filepath": c.filepath,
                    "width": getattr(c, "width", None),
                    "height": getattr(c, "height", None),
                    "bbox": None,
                }
                for c in image_chunks
            ]
            vectors_added += add_embeddings_with_metadata(embs, meta)
            total_chunks += len(paths)

    return {"chunks_added": total_chunks, "vectors_indexed": vectors_added, "file": file.filename}


@app.post("/api/chat")
async def chat(query: dict):
    # Placeholder: perform retrieval + generation
    user_message = query.get("message", "")
    return {"answer": f"Echo: {user_message}", "sources": []}


@app.post("/query")
def query(payload: dict):
    q = payload.get("query", "")
    if not q:
        raise HTTPException(status_code=400, detail="Missing query")
    cfg_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "config.yaml"))
    return answer_query(cfg_path, q)


@app.get("/status")
def status():
    return index_status()


@app.post("/index/rebuild")
def rebuild():
    # Assume text embedding dimension 384 for MiniLM-L6-v2
    return rebuild_from_db(384)


@app.post("/ingest/audio")
async def ingest_audio(file: UploadFile = File(...)):
    ensure_storage()
    storage_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "storage"))
    os.makedirs(storage_dir, exist_ok=True)
    if not any(r.path == "/storage" for r in app.router.routes):
        app.mount("/storage", StaticFiles(directory=storage_dir), name="storage")
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")
    dest_path = os.path.join(storage_dir, file.filename)
    data = await file.read()
    with open(dest_path, "wb") as f:
        f.write(data)

    # extract audio -> transcript chunks with segments stored on chunk objects
    from .extractors import extract_audio
    chunks = extract_audio(dest_path, file.filename)

    texts = [c.content for c in chunks]
    embs = embed_texts(texts)
    meta = []
    for c in chunks:
        # find first segment overlap as a simple heuristic (timestamp string)
        ts = None
        segs = getattr(c, "segments", []) or []
        if segs:
            # use the first segment timestamp
            s0, s1, _ = segs[0]
            ts = f"{s0}-{s1}"
        meta.append({
            "content": c.content,
            "file_name": c.file_name,
            "file_type": c.file_type,
            "page_number": c.page_number,
            "timestamp": ts,
            "filepath": c.filepath,
        })

    added = add_embeddings_with_metadata(embs, meta)
    return {"chunks_added": len(texts), "vectors_indexed": added, "file": file.filename}


@app.post("/search/similarity")
async def similarity(payload: dict = None, mode: str = "text", file: UploadFile | None = None):
    k = 5
    query_emb = None
    from .index_store import INDEX_PATH, connect_db
    if not os.path.exists(INDEX_PATH):
        return {"results": []}

    if mode == "text":
        query = (payload or {}).get("query", "")
        k = int((payload or {}).get("k", 5))
        if not query:
            raise HTTPException(status_code=400, detail="Missing query")
        query_emb = embed_texts([query])
    elif mode == "image":
        if file is None:
            raise HTTPException(status_code=400, detail="Missing image file")
        data = await file.read()
        tmp_path = os.path.join(os.path.dirname(__file__), "..", "storage", f"_query_{file.filename}")
        os.makedirs(os.path.dirname(tmp_path), exist_ok=True)
        with open(tmp_path, "wb") as f:
            f.write(data)
        query_emb = embed_image_paths([os.path.abspath(tmp_path)])
        try:
            os.remove(tmp_path)
        except Exception:
            pass
        k = int((payload or {}).get("k", 5))
    else:
        # cross-modal defaults to text embedding of query string
        query = (payload or {}).get("query", "")
        k = int((payload or {}).get("k", 5))
        if not query:
            raise HTTPException(status_code=400, detail="Missing query for cross mode")
        query_emb = embed_texts([query])

    index = faiss.read_index(INDEX_PATH)
    D, I = index.search(query_emb, k)
    ids = I[0].tolist()
    scores = D[0].tolist()
    placeholders = ",".join(["?"] * len(ids)) if ids else ""
    results = []
    if ids:
        conn = connect_db()
        cur = conn.cursor()
        cur.execute(
            f"SELECT vector_id, content, file_name, file_type, page_number, timestamp, filepath, width, height, bbox FROM vectors WHERE vector_id IN ({placeholders})",
            ids,
        )
        metas = cur.fetchall()
        conn.close()
        meta_map = {row[0]: row for row in metas}
        for vid, score in zip(ids, scores):
            row = meta_map.get(vid)
            if row:
                results.append(
                    {
                        "vector_id": row[0],
                        "content": row[1],
                        "file_name": row[2],
                        "file_type": row[3],
                        "page_number": row[4],
                        "timestamp": row[5],
                        "filepath": row[6],
                        "width": row[7],
                        "height": row[8],
                        "bbox": row[9],
                        "score": float(score),
                    }
                )
    return {"results": results}


