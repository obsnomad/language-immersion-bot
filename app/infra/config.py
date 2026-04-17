from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "local"
    log_level: str = "INFO"

    bot_token: str
    miniapp_url: str | None = None
    miniapp_session_secret: str | None = None
    miniapp_session_ttl_seconds: int = 86400
    miniapp_auth_max_age_seconds: int = 3600
    miniapp_cors_origins: str = ""

    mistral_api_key: str
    mistral_model: str = "mistral-small-latest"

    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "ai_language_bot"
    postgres_user: str = "postgres"
    postgres_password: str = "postgres"

    redis_host: str = "localhost"
    redis_port: int = 6379
    redis_db: int = 0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def redis_url(self) -> str:
        return f"redis://{self.redis_host}:{self.redis_port}/{self.redis_db}"

    @property
    def session_secret(self) -> str:
        return self.miniapp_session_secret or self.bot_token

    @property
    def cors_origins(self) -> list[str]:
        return [item.strip() for item in self.miniapp_cors_origins.split(",") if item.strip()]


settings = Settings()
