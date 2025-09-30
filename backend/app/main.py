from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

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


@app.post("/api/upload")
async def upload(file: UploadFile = File(...)):
    # Placeholder: save file and trigger ingestion
    content = await file.read()
    num_bytes = len(content)
    return {"filename": file.filename, "bytes": num_bytes}


@app.post("/api/chat")
async def chat(query: dict):
    # Placeholder: perform retrieval + generation
    user_message = query.get("message", "")
    return {"answer": f"Echo: {user_message}", "sources": []}


