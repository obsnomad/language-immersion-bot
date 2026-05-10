from dataclasses import dataclass
from functools import lru_cache
from typing import Annotated

from fastapi import Depends, Header, HTTPException, Request, status

from app.api.security import (
    MiniAppAuthError,
    SessionClaims,
    SessionTokenSigner,
    TelegramInitDataValidator,
    VerifiedMiniAppInitData,
    parse_authorization_header,
)
from app.application.container import ServiceContainer, get_service_container
from app.domain.enums import LanguageCode
from app.infra import settings
from app.infra.db import LanguageProfile, User


@dataclass(frozen=True)
class CurrentUserContext:
    user: User
    profile: LanguageProfile
    learning_language: LanguageCode
    claims: SessionClaims | None = None
    telegram_auth: VerifiedMiniAppInitData | None = None


def get_services() -> ServiceContainer:
    return get_service_container()


@lru_cache
def get_init_data_validator() -> TelegramInitDataValidator:
    return TelegramInitDataValidator(
        bot_token=settings.bot_token,
        max_age_seconds=settings.miniapp_auth_max_age_seconds,
    )


@lru_cache
def get_session_token_signer() -> SessionTokenSigner:
    return SessionTokenSigner(
        secret=settings.session_secret,
        ttl_seconds=settings.miniapp_session_ttl_seconds,
    )


def get_learning_language(
    x_language: Annotated[str | None, Header(alias="X-Language")] = None,
) -> LanguageCode:
    if x_language is None:
        return LanguageCode.ENGLISH

    normalized = x_language.strip().lower()
    try:
        return LanguageCode(normalized)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported X-Language value.",
        ) from error


TokenSignerDep = Annotated[SessionTokenSigner, Depends(get_session_token_signer)]
ServicesDep = Annotated[ServiceContainer, Depends(get_services)]
InitDataValidatorDep = Annotated[TelegramInitDataValidator, Depends(get_init_data_validator)]
LearningLanguageDep = Annotated[LanguageCode, Depends(get_learning_language)]


async def get_current_user_context(
    request: Request,
    signer: TokenSignerDep,
    validator: InitDataValidatorDep,
    services: ServicesDep,
    learning_language: LearningLanguageDep,
) -> CurrentUserContext:
    try:
        credentials = parse_authorization_header(request.headers.get("Authorization"))
    except MiniAppAuthError as error:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(error),
        ) from error

    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header.",
        )

    if credentials.scheme == "bearer":
        try:
            claims = signer.loads(credentials.value)
        except MiniAppAuthError as error:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=str(error),
            ) from error

        user = await services.user_service.get_by_id(claims.user_id)
        if user is None or user.telegram_id != claims.telegram_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User session is no longer valid.",
            )

        profile = await services.profile_service.get_or_create_profile(
            user.id,
            language=learning_language,
        )
        return CurrentUserContext(
            user=user,
            profile=profile,
            learning_language=learning_language,
            claims=claims,
        )

    try:
        verified = validator.validate(credentials.value)
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
    profile = await services.profile_service.get_or_create_profile(
        user.id,
        language=learning_language,
    )
    return CurrentUserContext(
        user=user,
        profile=profile,
        learning_language=learning_language,
        telegram_auth=verified,
    )


CurrentUserDep = Annotated[CurrentUserContext, Depends(get_current_user_context)]
