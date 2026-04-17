from sqlalchemy import select

from app.infra.db import SessionLocal, User


class UserService:
    async def get_by_id(self, user_id: int) -> User | None:
        async with SessionLocal() as session:
            return await session.get(User, user_id)

    async def get_by_telegram_id(self, telegram_id: int) -> User | None:
        async with SessionLocal() as session:
            result = await session.execute(select(User).where(User.telegram_id == telegram_id))
            return result.scalar_one_or_none()

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
                if user.username != username or user.first_name != first_name:
                    user.username = username
                    user.first_name = first_name
                    await session.commit()
                    await session.refresh(user)
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
