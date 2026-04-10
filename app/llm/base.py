from collections.abc import Sequence
from typing import Protocol

MessagePayload = dict[str, str]


class LLMClient(Protocol):
    async def complete(
        self,
        *,
        messages: Sequence[MessagePayload],
        temperature: float = 0.3,
    ) -> str: ...
