.PHONY: setup-backend start-backend start-frontend

setup-backend:
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

start-backend:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

start-frontend:
	cd frontend && npm run dev


