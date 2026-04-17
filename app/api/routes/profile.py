from fastapi import APIRouter

from app.api.dependencies import CurrentUserDep, ServicesDep
from app.api.schemas import ProfileResponse, UpdateProfileRequest, UserResponse

router = APIRouter(tags=["profile"])


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    context: CurrentUserDep,
) -> UserResponse:
    return UserResponse.model_validate(context.user, from_attributes=True)


@router.get("/profile", response_model=ProfileResponse)
async def get_profile(
    context: CurrentUserDep,
) -> ProfileResponse:
    return _serialize_profile(context.profile)


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    payload: UpdateProfileRequest,
    context: CurrentUserDep,
    services: ServicesDep,
) -> ProfileResponse:
    profile = await services.profile_service.update_profile(
        context.user.id,
        native_language=payload.native_language,
        target_languages=_join_languages(payload.target_languages),
        current_level=payload.current_level,
        preferred_mode=payload.preferred_mode.value if payload.preferred_mode else None,
        feedback_style=payload.feedback_style.value if payload.feedback_style else None,
        goals=payload.goals,
    )
    return _serialize_profile(profile)


def _serialize_profile(profile) -> ProfileResponse:
    target_languages = [
        item.strip() for item in profile.target_languages.split(",") if item.strip()
    ]
    return ProfileResponse(
        native_language=profile.native_language,
        target_languages=target_languages,
        current_level=profile.current_level,
        preferred_mode=profile.preferred_mode,
        feedback_style=profile.feedback_style,
        goals=profile.goals,
    )


def _join_languages(languages) -> str | None:
    if languages is None:
        return None
    return ",".join(language.value for language in languages)
