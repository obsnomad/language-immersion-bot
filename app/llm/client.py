from collections.abc import Sequence

from mistralai.client import Mistral

from app.infra import settings
from app.llm.base import LLMClient, MessagePayload


class MistralLLMClient(LLMClient):
    def __init__(self, api_key: str, model: str) -> None:
        self._client = Mistral(api_key=api_key)
        self._model = model

    async def complete(
        self,
        *,
        messages: Sequence[MessagePayload],
        temperature: float = 0.3,
    ) -> str:
        response = await self._client.chat.complete_async(
            model=self._model,
            messages=list(messages),
            temperature=temperature,
        )
        return response.choices[0].message.content or ""


llm_client: LLMClient = MistralLLMClient(
    api_key=settings.mistral_api_key,
    model=settings.mistral_model,
)
