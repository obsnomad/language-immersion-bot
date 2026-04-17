import logging

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo
from aiohttp import ClientError
from sqlalchemy.exc import SQLAlchemyError

from app.application.container import get_service_container
from app.infra import settings
from app.message_formatting import render_markdown

router = Router()
logger = logging.getLogger(__name__)
practice_service = get_service_container().practice_service


def _build_infra_error_reply(error: Exception) -> str:
    if isinstance(error, SQLAlchemyError):
        return render_markdown(
            "Storage is unavailable right now. Check that PostgreSQL is running and try again."
        )
    if isinstance(error, ClientError | ConnectionError | TimeoutError | OSError):
        return render_markdown(
            "The external language service is unavailable right now. Try again in a moment."
        )
    return render_markdown("Something went wrong while processing your message. Try again.")


@router.message(CommandStart())
async def start_handler(message: Message) -> None:
    await message.answer(
        render_markdown(
            "Hello. I am your language immersion bot.\n"
            "I currently support English, Spanish, and Serbian.\n"
            "Ask for conversation practice, roleplay, grammar explanations, "
            "interviews, or writing feedback.\n"
            "If the Mini App is configured, use Open App for dashboard, "
            "review, and guided practice."
        ),
        reply_markup=build_launch_keyboard(),
    )


@router.message()
async def chat_handler(message: Message) -> None:
    if not message.text:
        await message.answer(render_markdown("Please send a text message."))
        return

    tg_user = message.from_user
    try:
        result = await practice_service.handle_message(
            telegram_id=tg_user.id if tg_user else 0,
            username=tg_user.username if tg_user else None,
            first_name=tg_user.first_name if tg_user else None,
            text=message.text,
        )
    except (SQLAlchemyError, ClientError, ConnectionError, TimeoutError, OSError) as error:
        logger.exception("Failed to process message due to infrastructure error")
        await message.answer(_build_infra_error_reply(error))
        return

    await message.answer(result.reply_text)


def build_launch_keyboard() -> InlineKeyboardMarkup | None:
    if not settings.miniapp_url:
        return None

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Open App",
                    web_app=WebAppInfo(url=settings.miniapp_url),
                )
            ]
        ]
    )
