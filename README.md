RAG Offline Chatbot

An offline-first Retrieval-Augmented Generation (RAG) chatbot scaffold with a Python FastAPI backend and a React + Tailwind frontend. The goal is to run locally, without depending on external online model APIs once models and data are downloaded.

Features

- FastAPI backend scaffold with ingest and search stubs
- React + Tailwind frontend with a minimal chat UI
- Scripts and placeholders for future offline model downloads
- Makefile targets to quickly set up and start services

Project Structure

- `backend/`: FastAPI app, requirements, Dockerfile, and scripts
- `frontend/`: Vite + React + Tailwind app scaffold
- `.gitignore`, `LICENSE`, `Makefile`: repo-level utilities

Run locally

1. Backend (FastAPI)

```
cd backend
python -m venv .venv
# Windows PowerShell
. .venv/Scripts/Activate.ps1
# macOS/Linux bash/zsh
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

2. Frontend (React + Tailwind via Vite)

```
cd frontend
npm install
npm run dev
```

Docker (offline-friendly)

- Build backend image:

```
docker build -t rag-backend ./backend
```

- Prepare local folders for persistent data and models:

```
mkdir -p backend/app/storage backend/models
```

- Run backend with volumes mounted for storage and models:

```
docker run --rm -p 8000:8000 \
  -v %cd%/backend/app/storage:/app/app/storage \
  -v %cd%/backend/models:/app/models \
  -e WHISPER_CPP_BIN=/app/models/whisper/main \
  -e WHISPER_CPP_MODEL=/app/models/whisper/ggml-base.en.bin \
  rag-backend
```

On macOS/Linux replace `%cd%` with `$(pwd)`.

Docker Compose

```
docker-compose up --build
```

This starts the backend on port 8000 and a frontend preview on 5173. Mounts:

- `/app/app/storage` ← `backend/app/storage`
- `/app/models` ← `backend/models` (place large local models here)

Offline goals

- All inference should work locally once you implement model loading in `backend/` and use local embeddings. The `backend/scripts/download_models.sh` is a placeholder to fetch required models/checkpoints ahead of time.
- No cloud dependencies are required for development.

Next steps

- Implement `backend/app/ingest.py` to chunk and embed local documents into a vector store (e.g., FAISS).
- Implement `backend/app/search.py` to perform semantic retrieval.
- Add a local LLM or a small distilled model and wire up a RAG chain.

License
MIT. See `LICENSE`.
