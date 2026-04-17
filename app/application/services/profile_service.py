from sqlalchemy import select

from app.domain.enums import CorrectionMode
from app.infra.db import SessionLocal, UserProfile


class ProfileService:
    async def get_by_user_id(self, user_id: int) -> UserProfile | None:
        async with SessionLocal() as session:
            result = await session.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
            return result.scalar_one_or_none()

    async def get_or_create_profile(self, user_id: int) -> UserProfile:
        async with SessionLocal() as session:
            result = await session.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()

            if profile:
                return profile

            profile = UserProfile(
                user_id=user_id,
                native_language="ru",
                target_languages="en",
                feedback_style=CorrectionMode.DELAYED.value,
            )
            session.add(profile)
            await session.commit()
            await session.refresh(profile)
            return profile

    async def update_profile(
        self,
        user_id: int,
        *,
        native_language: str | None = None,
        target_languages: str | None = None,
        current_level: str | None = None,
        preferred_mode: str | None = None,
        feedback_style: str | None = None,
        goals: str | None = None,
    ) -> UserProfile:
        async with SessionLocal() as session:
            result = await session.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
            profile = result.scalar_one_or_none()

            if profile is None:
                profile = UserProfile(
                    user_id=user_id,
                    native_language=native_language or "ru",
                    target_languages=target_languages or "en",
                    current_level=current_level,
                    preferred_mode=preferred_mode,
                    feedback_style=feedback_style or CorrectionMode.DELAYED.value,
                    goals=goals,
                )
                session.add(profile)
            else:
                if native_language is not None:
                    profile.native_language = native_language
                if target_languages is not None:
                    profile.target_languages = target_languages
                if current_level is not None:
                    profile.current_level = current_level
                if preferred_mode is not None:
                    profile.preferred_mode = preferred_mode
                if feedback_style is not None:
                    profile.feedback_style = feedback_style
                if goals is not None:
                    profile.goals = goals

            await session.commit()
            await session.refresh(profile)
            return profile
