from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from app.application import ChatService, MessageLogService, UserService

router = Router()
user_service = UserService()
chat_service = ChatService()
message_log_service = MessageLogService()


@router.message(CommandStart())
async def start_handler(message: Message) -> None:
    tg_user = message.from_user
    if tg_user:
        await user_service.get_or_create_user(
            telegram_id=tg_user.id,
            username=tg_user.username,
            first_name=tg_user.first_name,
        )

    await message.answer(
        "Hi! I am your AI language immersion bot. Send me a message in English or Spanish."
    )


@router.message()
async def chat_handler(message: Message) -> None:
    if not message.text:
        await message.answer("Please send a text message.")
        return

    tg_user = message.from_user
    telegram_id = tg_user.id if tg_user else 0

    await message_log_service.save(
        telegram_id=telegram_id,
        role="user",
        text=message.text,
    )

    reply = await chat_service.reply(message.text)

    await message_log_service.save(
        telegram_id=telegram_id,
        role="assistant",
        text=reply,
    )

    await message.answer(reply)
