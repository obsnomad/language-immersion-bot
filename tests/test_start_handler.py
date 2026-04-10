from aiohttp import ClientError
from sqlalchemy.exc import OperationalError

from app.bot.handlers.start import _build_infra_error_reply


def test_build_infra_error_reply_for_network_errors() -> None:
    reply = _build_infra_error_reply(ClientError("boom"))

    assert "external language service" in reply.lower()


def test_build_infra_error_reply_for_database_errors() -> None:
    reply = _build_infra_error_reply(
        OperationalError("select 1", params=None, orig=ConnectionRefusedError("refused"))
    )

    assert "postgresql" in reply.lower()
