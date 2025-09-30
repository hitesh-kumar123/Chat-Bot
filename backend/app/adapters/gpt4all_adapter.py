from __future__ import annotations

from .base import LLMAdapter


class GPT4AllAdapter(LLMAdapter):
    def __init__(self, model_path: str):
        try:
            from gpt4all import GPT4All
        except Exception as e:
            raise RuntimeError("gpt4all is not installed. pip install gpt4all") from e
        self.model = GPT4All(model_path)

    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.2) -> str:
        return self.model.generate(prompt, max_tokens=max_tokens, temp=temperature)


