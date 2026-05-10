from app.agents.specialists import ConversationAgent, FeedbackAgent, TeacherAgent
from app.domain.enums import AgentRole, CorrectionMode, LanguageCode, LearningMode
from app.domain.schemas import RouteDecision


def _route(**overrides) -> RouteDecision:
    payload = {
        "language": LanguageCode.ENGLISH,
        "support_language": "ru",
        "mode": LearningMode.CONVERSATION,
        "agent": AgentRole.CONVERSATION,
        "correction_mode": CorrectionMode.DELAYED,
        "save_memory": True,
        "scenario_hint": None,
    }
    payload.update(overrides)
    return RouteDecision(**payload)


def test_conversation_agent_prompt_separates_target_and_support_languages() -> None:
    agent = ConversationAgent(llm_client=None)  # type: ignore[arg-type]

    messages = agent.build_messages(route=_route(), user_text="Hi", history=[])

    prompt = messages[0]["content"]
    assert "Target language for the main dialogue: en." in prompt
    assert "User support language for explanations, corrections, labels, and meta guidance: ru." in prompt


def test_teacher_agent_prompt_uses_support_language_for_explanations() -> None:
    agent = TeacherAgent(llm_client=None)  # type: ignore[arg-type]

    messages = agent.build_messages(
        route=_route(mode=LearningMode.GRAMMAR, agent=AgentRole.TEACHER),
        user_text="Explain present perfect",
        history=[],
    )

    prompt = messages[0]["content"]
    assert "Target language for examples and learner output: en." in prompt
    assert "User support language for explanations and instructions: ru." in prompt


async def test_feedback_agent_prompt_requests_support_language_explanations() -> None:
    class FakeLLM:
        async def complete(self, *, messages, temperature=0.3):
            return messages[0]["content"]

    agent = FeedbackAgent(llm_client=FakeLLM())

    reply = await agent.respond(
        route=_route(agent=AgentRole.FEEDBACK),
        user_text="I goed there yesterday",
        history=[],
    )

    assert "User support language for summary and explanations: ru." in reply.text
    assert "Keep the correction text in the target language." in reply.text
