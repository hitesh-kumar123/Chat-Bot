import time
from backend.app.rag import answer_query
import os

CFG = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'config.yaml'))

EXAMPLES = [
  ("What improves solar panel efficiency?", "solar"),
  ("What converts kinetic energy into electricity?", "Wind turbines"),
]

def run():
  print("Evaluating RAG pipeline...")
  for q, kw in EXAMPLES:
    t0 = time.time()
    out = answer_query(CFG, q)
    dt = (time.time() - t0) * 1000
    ok = (kw.lower() in (out.get('answer') or '').lower()) or any(kw.lower() in (s.get('snippet') or '').lower() for s in out.get('sources', []))
    print(f"Q: {q}\n  ok={ok} time_ms={dt:.1f}\n  answer: {out.get('answer')[:200]}...\n  sources: {[s.get('file_name') for s in out.get('sources', [])]}")

if __name__ == '__main__':
  run()


