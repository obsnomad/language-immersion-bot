from collections.abc import Sequence
from datetime import datetime, timedelta

from sqlalchemy import func, or_, select

from app.domain.schemas import MistakeRecord
from app.infra.db import Mistake, SessionLocal


class MistakeService:
    async def save_many(
        self,
        *,
        user_id: int,
        language: str,
        mistakes: Sequence[MistakeRecord],
    ) -> None:
        if not mistakes:
            return

        async with SessionLocal() as session:
            rows = [
                Mistake(
                    user_id=user_id,
                    language=language,
                    type=item.category.value,
                    source_text=item.source_text,
                    correction=item.correction,
                    explanation=item.explanation,
                    severity=item.severity,
                    status="open",
                    next_review_at=datetime.utcnow() + timedelta(days=1),
                )
                for item in mistakes
            ]
            session.add_all(rows)
            await session.commit()

    async def list_due_for_review(self, *, user_id: int, limit: int = 20) -> list[Mistake]:
        async with SessionLocal() as session:
            result = await session.execute(
                select(Mistake)
                .where(
                    Mistake.user_id == user_id,
                    Mistake.status == "open",
                    or_(
                        Mistake.next_review_at.is_(None),
                        Mistake.next_review_at <= datetime.utcnow(),
                    ),
                )
                .order_by(Mistake.next_review_at.asc().nullsfirst(), Mistake.created_at.desc())
                .limit(limit)
            )
            return list(result.scalars().all())

    async def count_open(self, *, user_id: int) -> int:
        async with SessionLocal() as session:
            result = await session.execute(
                select(func.count(Mistake.id)).where(
                    Mistake.user_id == user_id,
                    Mistake.status == "open",
                )
            )
            return int(result.scalar_one())
