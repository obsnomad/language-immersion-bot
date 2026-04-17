from fastapi import APIRouter, Body, HTTPException, Request, status

from app.api.dependencies import (
    InitDataValidatorDep,
    ServicesDep,
    TokenSignerDep,
)
from app.api.schemas import AuthResponse, ProfileResponse, TelegramMiniAppAuthRequest, UserResponse
from app.api.security import MiniAppAuthError, parse_authorization_header

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram-mini-app", response_model=AuthResponse)
async def authenticate_telegram_mini_app(
        request: Request,
        validator: InitDataValidatorDep,
        signer: TokenSignerDep,
        services: ServicesDep,
        payload: TelegramMiniAppAuthRequest | None = Body(default=None),
) -> AuthResponse:
    try:
        verified = validator.validate(_extract_init_data(request, payload))
    except MiniAppAuthError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error

    user = await services.user_service.get_or_create_user(
        telegram_id=verified.user.id,
        username=verified.user.username,
        first_name=verified.user.first_name,
    )
    profile = await services.profile_service.get_or_create_profile(user.id)
    claims = signer.issue(user_id=user.id, telegram_id=user.telegram_id)
    access_token = signer.dumps(claims)
    return AuthResponse(
        access_token=access_token,
        expires_at=claims.expires_at,
        user=UserResponse.model_validate(user, from_attributes=True),
        profile=ProfileResponse(
            native_language=profile.native_language,
            target_languages=_split_languages(profile.target_languages),
            current_level=profile.current_level,
            preferred_mode=profile.preferred_mode,
            feedback_style=profile.feedback_style,
            goals=profile.goals,
        ),
    )


def _split_languages(raw_value: str) -> list[str]:
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _extract_init_data(
        request: Request,
        payload: TelegramMiniAppAuthRequest | None,
) -> str:
    credentials = parse_authorization_header(request.headers.get("Authorization"))
    if credentials is not None:
        if credentials.scheme != "tma":
            raise MiniAppAuthError("Use Telegram Mini App authorization for this endpoint.")
        return credentials.value

    if payload is None:
        raise MiniAppAuthError("Missing Telegram init data.")
    return payload.init_data
