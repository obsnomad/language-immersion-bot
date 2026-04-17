import time
from datetime import UTC, datetime

import pytest
from telegram_init_data import sign

from app.api.security import (
    MiniAppAuthError,
    SessionTokenSigner,
    TelegramInitDataValidator,
    parse_authorization_header,
)


def _build_init_data(*, bot_token: str, auth_date: int, user: dict[str, object]) -> str:
    return sign(
        {
            "query_id": "AAEAAAE",
            "user": user,
        },
        bot_token,
        datetime.fromtimestamp(auth_date, tz=UTC),
    )


def test_validator_accepts_signed_init_data() -> None:
    bot_token = "123456:ABCDEF"
    auth_date = int(time.time())
    validator = TelegramInitDataValidator(
        bot_token=bot_token,
        max_age_seconds=3600,
    )

    init_data = _build_init_data(
        bot_token=bot_token,
        auth_date=auth_date,
        user={
            "id": 42,
            "username": "learner",
            "first_name": "Anna",
        },
    )
    verified = validator.validate(init_data)

    assert verified.user.id == 42
    assert verified.user.username == "learner"


def test_validator_rejects_expired_init_data() -> None:
    bot_token = "123456:ABCDEF"
    auth_date = 1_700_000_000
    validator = TelegramInitDataValidator(
        bot_token=bot_token,
        max_age_seconds=60,
        now_provider=lambda: auth_date + 61,
    )
    init_data = _build_init_data(
        bot_token=bot_token,
        auth_date=auth_date,
        user={"id": 7, "first_name": "Stale"},
    )

    with pytest.raises(MiniAppAuthError, match="expired"):
        validator.validate(init_data)


def test_session_token_signer_rejects_tampering() -> None:
    signer = SessionTokenSigner(secret="secret", ttl_seconds=60, now_provider=lambda: 100)
    token = signer.dumps(signer.issue(user_id=1, telegram_id=2))
    tampered = f"{token[:-1]}A"

    with pytest.raises(MiniAppAuthError):
        signer.loads(tampered)


def test_parse_authorization_header_accepts_tma_scheme() -> None:
    credentials = parse_authorization_header("tma init-data-value")

    assert credentials is not None
    assert credentials.scheme == "tma"
    assert credentials.value == "init-data-value"


def test_parse_authorization_header_rejects_unknown_scheme() -> None:
    with pytest.raises(MiniAppAuthError, match="Unsupported"):
        parse_authorization_header("basic abc123")
