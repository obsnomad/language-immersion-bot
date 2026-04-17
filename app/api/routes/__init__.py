from fastapi import APIRouter

from app.api.routes.auth import router as auth_router
from app.api.routes.learning import router as learning_router
from app.api.routes.profile import router as profile_router
from app.api.routes.progress import router as progress_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(profile_router)
api_router.include_router(learning_router)
api_router.include_router(progress_router)

__all__ = ["api_router"]
