import logging

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message
from aiohttp import ClientError
from sqlalchemy.exc import SQLAlchemyError

from app.agents.registry import AgentRegistry
from app.application.orchestrator import LearningOrchestrator
from app.application.services import (
    FeedbackService,
    MistakeService,
    PracticeService,
    ProfileService,
    SessionService,
    TurnService,
    UserService,
)
from app.llm import llm_client
from app.message_formatting import render_markdown

router = Router()
logger = logging.getLogger(__name__)

agent_registry = AgentRegistry(llm_client)
practice_service = PracticeService(
    user_service=UserService(),
    profile_service=ProfileService(),
    session_service=SessionService(),
    turn_service=TurnService(),
    orchestrator=LearningOrchestrator(),
    agent_registry=agent_registry,
    feedback_service=FeedbackService(agent_registry),
    mistake_service=MistakeService(),
)


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
            "interviews, or writing feedback."
        ),
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
