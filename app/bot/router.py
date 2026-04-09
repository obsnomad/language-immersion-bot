from aiogram import Router

from app.bot.handlers import start_router

router = Router()
router.include_router(start_router)
