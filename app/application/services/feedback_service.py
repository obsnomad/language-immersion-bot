from app.agents.registry import AgentRegistry
from app.domain.enums import AgentRole, MistakeType
from app.domain.schemas import FeedbackResult, MistakeRecord, RouteDecision


class FeedbackService:
    def __init__(self, agent_registry: AgentRegistry) -> None:
        self._agent_registry = agent_registry

    async def analyze(self, *, route: RouteDecision, user_text: str) -> FeedbackResult:
        agent = self._agent_registry.get(AgentRole.FEEDBACK)
        raw = await agent.respond(route=route, user_text=user_text, history=[])
        return self._parse_feedback(raw.text, user_text=user_text)

    def _parse_feedback(self, raw_text: str, *, user_text: str) -> FeedbackResult:
        summary = None
        mistakes: list[MistakeRecord] = []
        for line in raw_text.splitlines():
            stripped = line.strip()
            if not stripped:
                continue
            if stripped.lower().startswith("summary:"):
                summary = stripped.split(":", 1)[1].strip()
                continue
            if not stripped.lower().startswith("mistake"):
                continue
            payload = stripped.split(":", 1)[1].strip()
            if payload.lower() == "none":
                continue
            parts = [part.strip() for part in payload.split("|")]
            if len(parts) != 3:
                continue
            category, correction, explanation = parts
            mistakes.append(
                MistakeRecord(
                    category=self._map_category(category),
                    source_text=user_text,
                    correction=correction,
                    explanation=explanation,
                    severity=2,
                )
            )
        return FeedbackResult(mistakes=mistakes, summary=summary)

    def _map_category(self, category: str) -> MistakeType:
        normalized = category.strip().lower().replace(" ", "_")
        try:
            return MistakeType(normalized)
        except ValueError:
            return MistakeType.GRAMMAR
