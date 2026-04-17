from dataclasses import dataclass
from functools import lru_cache

from app.agents.registry import AgentRegistry
from app.application.orchestrator import LearningOrchestrator
from app.application.services import (
    FeedbackService,
    MistakeService,
    PracticeService,
    ProfileService,
    SessionService,
    TurnService,
    UserService,
)
from app.llm import llm_client


@dataclass(frozen=True)
class ServiceContainer:
    agent_registry: AgentRegistry
    user_service: UserService
    profile_service: ProfileService
    session_service: SessionService
    turn_service: TurnService
    feedback_service: FeedbackService
    mistake_service: MistakeService
    practice_service: PracticeService


@lru_cache
def get_service_container() -> ServiceContainer:
    agent_registry = AgentRegistry(llm_client)
    user_service = UserService()
    profile_service = ProfileService()
    session_service = SessionService()
    turn_service = TurnService()
    feedback_service = FeedbackService(agent_registry)
    mistake_service = MistakeService()
    practice_service = PracticeService(
        user_service=user_service,
        profile_service=profile_service,
        session_service=session_service,
        turn_service=turn_service,
        orchestrator=LearningOrchestrator(),
        agent_registry=agent_registry,
        feedback_service=feedback_service,
        mistake_service=mistake_service,
    )
    return ServiceContainer(
        agent_registry=agent_registry,
        user_service=user_service,
        profile_service=profile_service,
        session_service=session_service,
        turn_service=turn_service,
        feedback_service=feedback_service,
        mistake_service=mistake_service,
        practice_service=practice_service,
    )
