from collections.abc import Sequence

from app.domain.schemas import AgentReply, RouteDecision
from app.llm.base import LLMClient, MessagePayload


class BaseAgent:
    system_prompt: str = "You are a language immersion coach."

    def __init__(self, llm_client: LLMClient) -> None:
        self._llm_client = llm_client

    async def respond(
        self,
        *,
        route: RouteDecision,
        user_text: str,
        history: Sequence[MessagePayload],
    ) -> AgentReply:
        prompt = self.build_messages(route=route, user_text=user_text, history=history)
        text = await self._llm_client.complete(messages=prompt)
        return AgentReply(text=text.strip())

    def build_messages(
        self,
        *,
        route: RouteDecision,
        user_text: str,
        history: Sequence[MessagePayload],
    ) -> list[MessagePayload]:
        return [
            {"role": "system", "content": self.system_prompt},
            *history,
            {"role": "user", "content": user_text},
        ]
