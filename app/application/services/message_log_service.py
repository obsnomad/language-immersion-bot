from app.infra.db import MessageLog, SessionLocal


class MessageLogService:
    async def save(self, telegram_id: int, role: str, text: str) -> None:
        async with SessionLocal() as session:
            row = MessageLog(
                telegram_id=telegram_id,
                role=role,
                text=text,
            )
            session.add(row)
            await session.commit()
