from app.index_store import rebuild_from_db

if __name__ == "__main__":
    # MiniLM-L6-v2 embedding size
    res = rebuild_from_db(384)
    print(res)


