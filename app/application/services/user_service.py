from sqlalchemy import select

from app.infra.db import SessionLocal, User


class UserService:
    async def get_or_create_user(
        self,
        telegram_id: int,
        username: str | None,
        first_name: str | None,
    ) -> User:
        async with SessionLocal() as session:
            result = await session.execute(select(User).where(User.telegram_id == telegram_id))
            user = result.scalar_one_or_none()

            if user:
                return user

            user = User(
                telegram_id=telegram_id,
                username=username,
                first_name=first_name,
            )
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return user
