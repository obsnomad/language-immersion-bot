from fastapi import APIRouter

from app.api.dependencies import CurrentUserDep, ServicesDep
from app.api.schemas import ProgressSummaryResponse, RecentSessionResponse

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/summary", response_model=ProgressSummaryResponse)
async def get_progress_summary(
    context: CurrentUserDep,
    services: ServicesDep,
) -> ProgressSummaryResponse:
    sessions_total = await services.session_service.count_for_user(
        user_id=context.user.id,
        language=context.learning_language,
    )
    open_mistakes = await services.mistake_service.count_open(
        user_id=context.user.id,
        language=context.learning_language,
    )
    review_due_now = len(
        await services.mistake_service.list_due_for_review(
            user_id=context.user.id,
            language=context.learning_language,
        )
    )
    recent_sessions = await services.session_service.list_recent(
        user_id=context.user.id,
        language=context.learning_language,
    )
    return ProgressSummaryResponse(
        sessions_total=sessions_total,
        open_mistakes=open_mistakes,
        review_due_now=review_due_now,
        recent_sessions=[
            RecentSessionResponse(
                id=item.id,
                language=item.language,
                mode=item.mode,
                started_at=item.started_at,
                status=item.status,
            )
            for item in recent_sessions
        ],
    )
