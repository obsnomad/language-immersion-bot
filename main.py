import asyncio

from aiogram import Bot, Dispatcher
from aiogram.types import BotCommand

from app.bot.router import router
from app.infra.config import settings


async def main() -> None:
    bot = Bot(token=settings.bot_token)
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
