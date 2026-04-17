# language-immersion-bot

Telegram bot and Mini App backend for language practice with Mistral-backed specialist agents, PostgreSQL persistence, and aiogram polling.

## What it does

- Routes each user message into a learning mode such as conversation, grammar, writing, vocabulary, review, scenario
  roleplay, or interview practice.
- Supports English, Spanish, and Serbian.
- Uses specialist agents for conversation, teaching, exam simulation, review, and feedback.
- Stores users, profiles, learning sessions, message turns, and detected mistakes in PostgreSQL.
- Adds delayed feedback summaries when the user profile is configured for delayed correction.
- Exposes FastAPI endpoints for Telegram Mini App authentication, profile access, review queues, and guided practice.
- Ships a Create React App Mini App under `miniapp/` and serves its production build from the same FastAPI process.

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
- `MINIAPP_URL`
- `MISTRAL_API_KEY`

Default local infrastructure values already match `docker-compose.yml`.

## Local setup

Install dependencies:

```bash
uv sync --dev
```

Start PostgreSQL, Redis, and pgAdmin:

```bash
docker compose up -d
```

Open pgAdmin at `http://localhost:5050` and sign in with the credentials defined in `docker-compose.yml`. To
register the local Postgres container inside pgAdmin, use:

- Host: `postgres`
- Port: `5432`
- Database: `POSTGRES_DB`
- Username: `POSTGRES_USER`
- Password: `POSTGRES_PASSWORD`

Run database migrations:

```bash
uv run alembic upgrade head
```

Start the bot:

```bash
uv run python main.py
```

Start the API:

```bash
uv run uvicorn app.api.main:app --reload --port 8000
```

For frontend hot reload during development, run the React dev server from `miniapp/`:

```bash
cd miniapp
npm install
npm start
```

This serves the mini app at `http://127.0.0.1/` on port `80` and proxies `/api` requests to the
FastAPI backend on `http://127.0.0.1:8000`.

The frontend dev server uses `DANGEROUSLY_DISABLE_HOST_CHECK=true` in `miniapp/.env.development` so CRA
can accept the ngrok host during local Mini App development.

To open the Mini App from Telegram during local development, expose the frontend dev server with ngrok:

```bash
ngrok http 80
```

Then update `.env` to use the ngrok HTTPS origin:

```bash
MINIAPP_URL=https://your-subdomain.ngrok-free.dev/
MINIAPP_CORS_ORIGINS=https://your-subdomain.ngrok-free.dev
```

Use that same HTTPS URL in BotFather for the bot's Mini App or menu button. If you change the ngrok
subdomain, update both `.env` and the BotFather configuration.

Build the Mini App only when you want FastAPI to serve the production bundle:

```bash
cd miniapp
npm run build
```

The FastAPI app serves:

- `GET /health`
- `POST /api/auth/telegram-mini-app`
- `GET /api/me`
- `GET/PATCH /api/profile`
- `POST /api/learning/session/message`
- `GET /api/learning/review/today`
- `GET /api/progress/summary`
- `GET /miniapp/`

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
  api/            FastAPI app and Mini App auth endpoints
  application/    orchestration and use-case services
  bot/            Telegram handlers and router
  domain/         enums and schemas
  infra/          settings and database wiring
  llm/            Mistral client
  main.py         aiogram application entry point
alembic/          database migrations
miniapp/          CRA source for the Telegram Mini App
tests/            pytest suite
main.py           top-level launcher
docker-compose.yml
```

## Notes

- The app currently runs as a polling Telegram bot, not a webhook deployment.
- The bot can expose an `Open App` menu button and `/start` launch button when `MINIAPP_URL` is configured.
- Set the same HTTPS `MINIAPP_URL` in BotFather for the bot's menu button or Web App button.
- Redis is provisioned in `docker-compose.yml`, but the current request flow is centered on PostgreSQL-backed session
  and mistake storage.
- pgAdmin is provisioned in `docker-compose.yml` for local database inspection and admin tasks.
