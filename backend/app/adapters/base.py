from __future__ import annotations

from abc import ABC, abstractmethod


class LLMAdapter(ABC):
    @abstractmethod
    def generate(self, prompt: str, max_tokens: int = 512, temperature: float = 0.2) -> str:
        ...


