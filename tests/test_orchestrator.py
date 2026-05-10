from app.application.orchestrator import LearningOrchestrator
from app.domain.enums import AgentRole, CorrectionMode, LanguageCode, LearningMode


async def test_routes_interview_request() -> None:
    orchestrator = LearningOrchestrator()

    decision = await orchestrator.route(
        user_text="Do a stress interview in Spanish and correct every mistake.",
    )

    assert decision.language is LanguageCode.SPANISH
    assert decision.mode is LearningMode.EXAM
    assert decision.agent is AgentRole.EXAMINER
    assert decision.correction_mode is CorrectionMode.INLINE


async def test_routes_roleplay_request() -> None:
    orchestrator = LearningOrchestrator()

    decision = await orchestrator.route(
        user_text="I want an airport roleplay in English.",
    )

    assert decision.language is LanguageCode.ENGLISH
    assert decision.mode is LearningMode.SCENARIO
    assert decision.agent is AgentRole.CONVERSATION


async def test_routes_serbian_request() -> None:
    orchestrator = LearningOrchestrator()

    decision = await orchestrator.route(
        user_text="Let's do conversation practice in Serbian.",
    )

    assert decision.language is LanguageCode.SERBIAN
    assert decision.mode is LearningMode.CONVERSATION
    assert decision.agent is AgentRole.CONVERSATION


async def test_respects_explicit_learning_language_override() -> None:
    orchestrator = LearningOrchestrator()

    decision = await orchestrator.route(
        user_text="Let's do conversation practice in Serbian.",
        learning_language=LanguageCode.SPANISH,
    )

    assert decision.language is LanguageCode.SPANISH
