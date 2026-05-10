from sqlalchemy import select

from app.domain.enums import CorrectionMode, LanguageCode
from app.infra.db import LanguageProfile, SessionLocal


class ProfileService:
    async def get_by_user_id(
        self,
        user_id: int,
        *,
        language: LanguageCode,
    ) -> LanguageProfile | None:
        async with SessionLocal() as session:
            result = await session.execute(
                select(LanguageProfile).where(
                    LanguageProfile.user_id == user_id,
                    LanguageProfile.language == language.value,
                )
            )
            return result.scalar_one_or_none()

    async def get_or_create_profile(
        self,
        user_id: int,
        *,
        language: LanguageCode,
    ) -> LanguageProfile:
        async with SessionLocal() as session:
            result = await session.execute(
                select(LanguageProfile).where(
                    LanguageProfile.user_id == user_id,
                    LanguageProfile.language == language.value,
                )
            )
            profile = result.scalar_one_or_none()

            if profile:
                return profile

            profile = LanguageProfile(
                user_id=user_id,
                language=language.value,
                native_language="ru",
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
        language: LanguageCode,
        native_language: str | None = None,
        current_level: str | None = None,
        preferred_mode: str | None = None,
        feedback_style: str | None = None,
        goals: str | None = None,
    ) -> LanguageProfile:
        async with SessionLocal() as session:
            result = await session.execute(
                select(LanguageProfile).where(
                    LanguageProfile.user_id == user_id,
                    LanguageProfile.language == language.value,
                )
            )
            profile = result.scalar_one_or_none()

            if profile is None:
                profile = LanguageProfile(
                    user_id=user_id,
                    language=language.value,
                    native_language=native_language or "ru",
                    current_level=current_level,
                    preferred_mode=preferred_mode,
                    feedback_style=feedback_style or CorrectionMode.DELAYED.value,
                    goals=goals,
                )
                session.add(profile)
            else:
                if native_language is not None:
                    profile.native_language = native_language
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
