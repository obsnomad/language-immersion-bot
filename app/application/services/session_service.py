from datetime import datetime

from sqlalchemy import desc, func, select

from app.domain.enums import AgentRole, CorrectionMode, LanguageCode, LearningMode, SessionStatus
from app.infra.db import LearningSession, SessionLocal


class SessionService:
    async def create_or_update_active_session(
        self,
        *,
        user_id: int,
        language: LanguageCode,
        mode: LearningMode,
        agent_role: AgentRole,
        correction_mode: CorrectionMode,
        scenario_hint: str | None,
    ) -> LearningSession:
        async with SessionLocal() as session:
            result = await session.execute(
                select(LearningSession).where(
                    LearningSession.user_id == user_id,
                    LearningSession.language == language.value,
                    LearningSession.status == SessionStatus.ACTIVE.value,
                )
            )
            active_session = result.scalar_one_or_none()

            if active_session:
                active_session.mode = mode.value
                active_session.agent_role = agent_role.value
                active_session.correction_mode = correction_mode.value
                active_session.scenario_hint = scenario_hint
                await session.commit()
                await session.refresh(active_session)
                return active_session

            learning_session = LearningSession(
                user_id=user_id,
                language=language.value,
                mode=mode.value,
                agent_role=agent_role.value,
                correction_mode=correction_mode.value,
                scenario_hint=scenario_hint,
                status=SessionStatus.ACTIVE.value,
                started_at=datetime.utcnow(),
            )
            session.add(learning_session)
            await session.commit()
            await session.refresh(learning_session)
            return learning_session

    async def list_recent(
        self,
        *,
        user_id: int,
        language: LanguageCode,
        limit: int = 5,
    ) -> list[LearningSession]:
        async with SessionLocal() as session:
            result = await session.execute(
                select(LearningSession)
                .where(
                    LearningSession.user_id == user_id,
                    LearningSession.language == language.value,
                )
                .order_by(desc(LearningSession.started_at))
                .limit(limit)
            )
            return list(result.scalars().all())

    async def count_for_user(
        self,
        *,
        user_id: int,
        language: LanguageCode,
    ) -> int:
        async with SessionLocal() as session:
            result = await session.execute(
                select(func.count(LearningSession.id)).where(
                    LearningSession.user_id == user_id,
                    LearningSession.language == language.value,
                )
            )
            return int(result.scalar_one())
