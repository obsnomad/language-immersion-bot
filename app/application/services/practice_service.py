from app.agents.registry import AgentRegistry
from app.application.orchestrator import LearningOrchestrator
from app.application.services.feedback_service import FeedbackService
from app.application.services.mistake_service import MistakeService
from app.application.services.profile_service import ProfileService
from app.application.services.session_service import SessionService
from app.application.services.turn_service import TurnService
from app.application.services.user_service import UserService
from app.domain.enums import CorrectionMode
from app.domain.schemas import PracticeResult, SessionSnapshot
from app.message_formatting import render_feedback_quote, render_markdown


class PracticeService:
    def __init__(
        self,
        *,
        user_service: UserService,
        profile_service: ProfileService,
        session_service: SessionService,
        turn_service: TurnService,
        orchestrator: LearningOrchestrator,
        agent_registry: AgentRegistry,
        feedback_service: FeedbackService,
        mistake_service: MistakeService,
    ) -> None:
        self._user_service = user_service
        self._profile_service = profile_service
        self._session_service = session_service
        self._turn_service = turn_service
        self._orchestrator = orchestrator
        self._agent_registry = agent_registry
        self._feedback_service = feedback_service
        self._mistake_service = mistake_service

    async def handle_message(
        self,
        *,
        telegram_id: int,
        username: str | None,
        first_name: str | None,
        text: str,
    ) -> PracticeResult:
        user = await self._user_service.get_or_create_user(
            telegram_id=telegram_id,
            username=username,
            first_name=first_name,
        )
        profile = await self._profile_service.get_or_create_profile(user.id)
        route = await self._orchestrator.route(
            user_text=text,
            preferred_correction_mode=CorrectionMode(profile.feedback_style),
        )
        session = await self._session_service.create_or_update_active_session(
            user_id=user.id,
            language=route.language,
            mode=route.mode,
            agent_role=route.agent,
            correction_mode=route.correction_mode,
            scenario_hint=route.scenario_hint,
        )

        await self._turn_service.save(session_id=session.id, role="user", text=text)
        history = await self._turn_service.get_history(session_id=session.id)
        agent = self._agent_registry.get(route.agent)
        reply = await agent.respond(route=route, user_text=text, history=history[:-1])
        await self._turn_service.save(session_id=session.id, role="assistant", text=reply.text)

        feedback = await self._feedback_service.analyze(route=route, user_text=text)
        if route.save_memory:
            await self._mistake_service.save_many(
                user_id=user.id,
                language=route.language.value,
                mistakes=feedback.mistakes,
            )

        snapshot = SessionSnapshot(
            session_id=session.id,
            language=route.language,
            mode=route.mode,
            agent=route.agent,
            correction_mode=route.correction_mode,
            started_at=session.started_at,
        )
        return PracticeResult(
            reply_text=self._compose_reply(reply.text, feedback.summary, route.correction_mode),
            route=route,
            feedback=feedback,
            session=snapshot,
        )

    def _compose_reply(
        self,
        agent_reply: str,
        summary: str | None,
        correction_mode: CorrectionMode,
    ) -> str:
        if correction_mode is CorrectionMode.DELAYED and summary:
            return f"{render_markdown(agent_reply)}\n\n{render_feedback_quote(summary)}"
        return render_markdown(agent_reply)
