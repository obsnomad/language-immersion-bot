from sqlalchemy import select

from app.domain.enums import CorrectionMode
from app.infra.db import SessionLocal, UserProfile


class ProfileService:
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
