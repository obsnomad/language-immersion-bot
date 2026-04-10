from sqlalchemy import select

from app.infra.db import MessageTurn, SessionLocal


class TurnService:
    async def save(self, *, session_id: int, role: str, text: str) -> MessageTurn:
        async with SessionLocal() as session:
            turn = MessageTurn(
                session_id=session_id,
                role=role,
                text=text,
            )
            session.add(turn)
            await session.commit()
            await session.refresh(turn)
            return turn

    async def get_history(self, *, session_id: int, limit: int = 8) -> list[dict[str, str]]:
        async with SessionLocal() as session:
            result = await session.execute(
                select(MessageTurn)
                .where(MessageTurn.session_id == session_id)
                .order_by(MessageTurn.id.desc())
                .limit(limit)
            )
            turns = list(reversed(result.scalars().all()))
        return [{"role": turn.role, "content": turn.text} for turn in turns]
