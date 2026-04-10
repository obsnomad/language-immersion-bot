from app.application.services.feedback_service import FeedbackService
from app.domain.enums import AgentRole, CorrectionMode, LanguageCode, LearningMode
from app.domain.schemas import AgentReply, RouteDecision


class StubFeedbackAgent:
    async def respond(self, *, route, user_text, history):
        del route, user_text, history
        return AgentReply(
            text=(
                "Summary: The learner needs past tense consistency.\n"
                "Mistake 1: tense | spoke | Use the past form after yesterday.\n"
                "Mistake 2: grammar | went | Use past simple for completed actions."
            )
        )


class StubRegistry:
    def get(self, role: AgentRole):
        assert role is AgentRole.FEEDBACK
        return StubFeedbackAgent()


async def test_feedback_parser_extracts_mistakes() -> None:
    service = FeedbackService(StubRegistry())
    route = RouteDecision(
        language=LanguageCode.ENGLISH,
        mode=LearningMode.CONVERSATION,
        agent=AgentRole.CONVERSATION,
        correction_mode=CorrectionMode.DELAYED,
        save_memory=True,
    )

    result = await service.analyze(route=route, user_text="Yesterday I speak with my manager.")

    assert result.summary == "The learner needs past tense consistency."
    assert len(result.mistakes) == 2
    assert result.mistakes[0].correction == "spoke"
