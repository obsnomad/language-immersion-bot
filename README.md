# language-immersion-bot

Telegram bot for language practice with Mistral-backed specialist agents, PostgreSQL persistence, and aiogram polling.

## What it does

- Routes each user message into a learning mode such as conversation, grammar, writing, vocabulary, review, scenario
  roleplay, or interview practice.
- Supports English, Spanish, and Serbian.
- Uses specialist agents for conversation, teaching, exam simulation, review, and feedback.
- Stores users, profiles, learning sessions, message turns, and detected mistakes in PostgreSQL.
- Adds delayed feedback summaries when the user profile is configured for delayed correction.

## Stack

- Python 3.14+
- aiogram 3
- Mistral API
- SQLAlchemy async + asyncpg
- Alembic
- PostgreSQL
- Redis

## Configuration

Copy the example environment file and fill in your secrets:

```bash
cp .env.example .env
```

Required values:

- `BOT_TOKEN`
- `MISTRAL_API_KEY`

Default local infrastructure values already match `docker-compose.yml`.

## Local setup

Install dependencies:

```bash
uv sync --dev
```

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Run database migrations:

```bash
uv run alembic upgrade head
```

Start the bot:

```bash
uv run python main.py
```

If Docker Desktop is pointing at the wrong context, switch back to `default` first:

```bash
docker context use default
docker compose up -d
```

## Development

Run tests:

```bash
uv run pytest
```

Run linting and formatting:

```bash
uv run ruff check .
uv run ruff format .
```

## Project layout

```text
app/
  agents/         specialist LLM agents
  application/    orchestration and use-case services
  bot/            Telegram handlers and router
  domain/         enums and schemas
  infra/          settings and database wiring
  llm/            Mistral client
  main.py         aiogram application entry point
alembic/          database migrations
tests/            pytest suite
main.py           top-level launcher
docker-compose.yml
```

## Notes

- The app currently runs as a polling Telegram bot, not a webhook deployment.
- Redis is provisioned in `docker-compose.yml`, but the current request flow is centered on PostgreSQL-backed session
  and mistake storage.
