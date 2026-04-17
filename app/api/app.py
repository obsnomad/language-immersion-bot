from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import api_router
from app.infra import settings


def create_api_app() -> FastAPI:
    app = FastAPI(
        title="Language Immersion Bot API",
        version="0.1.0",
    )
    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    app.include_router(api_router, prefix="/api")

    @app.get("/health")
    async def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    miniapp_dir = Path(__file__).resolve().parents[2] / "miniapp" / "dist"
    if miniapp_dir.exists():
        app.mount("/miniapp", StaticFiles(directory=miniapp_dir, html=True), name="miniapp")

        @app.get("/", include_in_schema=False)
        async def root() -> RedirectResponse:
            return RedirectResponse(url="/miniapp/")

    return app
