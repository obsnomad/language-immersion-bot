import base64
import hashlib
import hmac
import json
import logging
import time
from collections.abc import Callable
from datetime import UTC, datetime

from pydantic import BaseModel, ValidationError
from telegram_init_data import parse as parse_init_data
from telegram_init_data import validate as validate_init_data
from telegram_init_data.exceptions import (
    AuthDateInvalidError,
    ExpiredError,
    SignatureInvalidError,
    SignatureMissingError,
    TelegramInitDataError,
)

logger = logging.getLogger(__name__)


class MiniAppAuthError(ValueError):
    pass


class AuthorizationCredentials(BaseModel):
    scheme: str
    value: str


class TelegramMiniAppUser(BaseModel):
    id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    language_code: str | None = None


class VerifiedMiniAppInitData(BaseModel):
    auth_date: datetime
    query_id: str | None = None
    start_param: str | None = None
    user: TelegramMiniAppUser


class SessionClaims(BaseModel):
    user_id: int
    telegram_id: int
    exp: int

    @property
    def expires_at(self) -> datetime:
        return datetime.fromtimestamp(self.exp, tz=UTC)


class TelegramInitDataValidator:
    def __init__(
        self,
        *,
        bot_token: str,
        max_age_seconds: int,
        now_provider: Callable[[], int] | None = None,
    ) -> None:
        self._bot_token = bot_token
        self._max_age_seconds = max_age_seconds
        self._now_provider = now_provider or (lambda: int(time.time()))

    def validate(self, init_data: str) -> VerifiedMiniAppInitData:
        try:
            validate_init_data(
                init_data,
                self._bot_token,
                {"expires_in": self._max_age_seconds},
            )
            parsed = parse_init_data(init_data)
        except SignatureMissingError as error:
            raise MiniAppAuthError("Missing Telegram init data hash.") from error
        except AuthDateInvalidError as error:
            raise MiniAppAuthError("Missing Telegram auth_date.") from error
        except ExpiredError as error:
            raise MiniAppAuthError("Telegram init data expired.") from error
        except SignatureInvalidError as error:
            logger.warning(
                "Telegram init data signature mismatch: %s init_data=%r",
                error,
                init_data[:400],
            )
            raise MiniAppAuthError("Telegram init data signature mismatch.") from error
        except TelegramInitDataError as error:
            raise MiniAppAuthError("Invalid Telegram init data.") from error

        auth_date_int = parsed.get("auth_date")
        if auth_date_int is None:
            raise MiniAppAuthError("Missing Telegram auth_date.")

        user_payload = parsed.get("user")
        if user_payload is None:
            raise MiniAppAuthError("Missing Telegram user payload.")

        try:
            user = TelegramMiniAppUser.model_validate(user_payload)
        except ValidationError as error:
            raise MiniAppAuthError("Invalid Telegram user payload.") from error

        return VerifiedMiniAppInitData(
            auth_date=datetime.fromtimestamp(auth_date_int, tz=UTC),
            query_id=parsed.get("query_id"),
            start_param=parsed.get("start_param"),
            user=user,
        )


class SessionTokenSigner:
    def __init__(
        self,
        *,
        secret: str,
        ttl_seconds: int,
        now_provider: Callable[[], int] | None = None,
    ) -> None:
        self._secret = secret.encode("utf-8")
        self._ttl_seconds = ttl_seconds
        self._now_provider = now_provider or (lambda: int(time.time()))

    def issue(self, *, user_id: int, telegram_id: int) -> SessionClaims:
        expires_at = self._now_provider() + self._ttl_seconds
        return SessionClaims(user_id=user_id, telegram_id=telegram_id, exp=expires_at)

    def dumps(self, claims: SessionClaims) -> str:
        payload = json.dumps(claims.model_dump(), separators=(",", ":"), sort_keys=True).encode(
            "utf-8"
        )
        signature = hmac.new(self._secret, payload, hashlib.sha256).digest()
        return f"{self._b64encode(payload)}.{self._b64encode(signature)}"

    def loads(self, token: str) -> SessionClaims:
        try:
            encoded_payload, encoded_signature = token.split(".", 1)
        except ValueError as error:
            raise MiniAppAuthError("Invalid session token format.") from error

        payload = self._b64decode(encoded_payload)
        received_signature = self._b64decode(encoded_signature)
        expected_signature = hmac.new(self._secret, payload, hashlib.sha256).digest()
        if not hmac.compare_digest(expected_signature, received_signature):
            raise MiniAppAuthError("Invalid session token signature.")

        try:
            claims = SessionClaims.model_validate_json(payload)
        except ValidationError as error:
            raise MiniAppAuthError("Invalid session token payload.") from error

        if self._now_provider() >= claims.exp:
            raise MiniAppAuthError("Session token expired.")
        return claims

    @staticmethod
    def _b64encode(value: bytes) -> str:
        return base64.urlsafe_b64encode(value).decode("utf-8").rstrip("=")

    @staticmethod
    def _b64decode(value: str) -> bytes:
        padding = "=" * (-len(value) % 4)
        return base64.urlsafe_b64decode(f"{value}{padding}")


def parse_authorization_header(header_value: str | None) -> AuthorizationCredentials | None:
    if header_value is None:
        return None

    parts = header_value.strip().split(None, 1)
    if len(parts) != 2 or not parts[1].strip():
        raise MiniAppAuthError("Invalid authorization header.")

    scheme, value = parts[0].lower(), parts[1].strip()
    if scheme not in {"bearer", "tma"}:
        raise MiniAppAuthError("Unsupported authorization scheme.")

    return AuthorizationCredentials(scheme=scheme, value=value)
