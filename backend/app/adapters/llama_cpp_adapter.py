from __future__ import annotations

from .base import LLMAdapter


class LlamaCppAdapter(LLMAdapter):
    def __init__(self, model_path: str):
        try:
            from llama_cpp import Llama
        except Exception as e:
            raise RuntimeError("llama-cpp-python is not installed. pip install llama-cpp-python") from e
        self.llm = Llama(model_path=model_path, n_ctx=4096)

    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.2) -> str:
        out = self.llm(prompt=prompt, max_tokens=max_tokens, temperature=temperature)
        return out.get("choices", [{}])[0].get("text", "")


