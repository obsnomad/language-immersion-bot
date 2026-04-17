from aiohttp import ClientError
from fastapi import APIRouter, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError

from app.api.dependencies import CurrentUserDep, ServicesDep
from app.api.schemas import (
    PracticeMessageRequest,
    PracticeMessageResponse,
    ReviewItemResponse,
    ReviewListResponse,
)

router = APIRouter(prefix="/learning", tags=["learning"])


@router.post("/session/message", response_model=PracticeMessageResponse)
async def post_practice_message(
    payload: PracticeMessageRequest,
    context: CurrentUserDep,
    services: ServicesDep,
) -> PracticeMessageResponse:
    try:
        result = await services.practice_service.handle_message(
            telegram_id=context.user.telegram_id,
            username=context.user.username,
            first_name=context.user.first_name,
            text=payload.text,
        )
    except (SQLAlchemyError, ClientError, ConnectionError, TimeoutError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Practice flow is temporarily unavailable.",
        ) from error

    return PracticeMessageResponse(
        reply_text=result.reply_text,
        session_id=result.session.session_id,
        language=result.session.language,
        mode=result.session.mode,
        agent=result.session.agent,
        correction_mode=result.session.correction_mode,
        feedback_summary=result.feedback.summary,
        mistakes_detected=len(result.feedback.mistakes),
    )


@router.get("/review/today", response_model=ReviewListResponse)
async def get_today_review(
    context: CurrentUserDep,
    services: ServicesDep,
) -> ReviewListResponse:
    items = await services.mistake_service.list_due_for_review(user_id=context.user.id)
    return ReviewListResponse(
        items=[
            ReviewItemResponse(
                id=item.id,
                language=item.language,
                category=item.type,
                source_text=item.source_text,
                correction=item.correction,
                explanation=item.explanation,
                severity=item.severity,
                next_review_at=item.next_review_at,
            )
            for item in items
        ]
    )
