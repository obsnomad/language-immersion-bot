import asyncio

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand

from app.bot import router
from app.infra import settings


async def main() -> None:
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher()

    dp.include_router(router)

    await bot.set_my_commands(
        [
            BotCommand(command="start", description="Start the bot"),
        ]
    )

    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
