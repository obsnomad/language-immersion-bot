from collections.abc import Sequence
from datetime import datetime, timedelta

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
