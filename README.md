# language-immersion-bot

Telegram bot and Mini App for language practice. The app is now a unified Next.js stack: Telegram Mini App UI, API
routes, bot webhook, persistence, and LLM orchestration all run from the same TypeScript codebase.

## What It Does

- Provides a Telegram Mini App for conversation practice, review, progress, and profile settings.
- Supports English, Spanish, and Serbian learning profiles.
- Routes messages into conversation, scenario, grammar, vocabulary, writing, exam, and review modes.
- Uses Mistral-backed specialist prompts for tutoring, feedback, review drills, and exam-style practice.
- Supports voice input via a mic button in the Practice page — audio is transcribed by a local Whisper container and post-processed by Mistral.
- Stores users, language profiles, sessions, message history, mistakes, and audio transcription logs in PostgreSQL.
- Authenticates Mini App users with Telegram init data and issues JWT session tokens.
- Exposes a grammY webhook endpoint for Telegram bot messages.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- MUI 7 + Emotion
- grammY
- Drizzle ORM + drizzle-kit
- PostgreSQL
- Vercel AI SDK + Mistral provider
- Whisper (via `onerahmet/openai-whisper-asr-webservice`) for local speech-to-text
- jose for JWT sessions
- Zod for request validation

## Configuration

Copy the example environment file and fill in the real values:

```bash
cp .env.example .env
```

Required values:

- `BOT_TOKEN`
- `MINIAPP_URL`
- `SESSION_SECRET`
- `MISTRAL_API_KEY`
- `DATABASE_URL`, or the individual `POSTGRES_*` values
- `WHISPER_URL` (defaults to `http://localhost:9000` — set if Whisper runs elsewhere)

For local Docker Postgres, these defaults match `docker-compose.yml`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_language_bot
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=ai_language_bot
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
```

## Local Development

Install dependencies:

```bash
npm install
```

Start local infrastructure (PostgreSQL, Redis, and Whisper):

```bash
docker compose up -d
```

The Whisper container (`ai_language_bot_whisper`) downloads the `base` model on first start (~140 MB) and exposes a transcription API on port 9000. This may take a few minutes. Check readiness with:

```bash
docker logs ai_language_bot_whisper
```

Apply the Drizzle schema:

```bash
npm run db:push
```

Start the Next dev server:

```bash
npm run dev
```

The app runs at:

```text
http://localhost:3000
```

Useful scripts:

```bash
npm run build
npm run start
npm run db:generate
npm run db:migrate
npm run db:studio
```

## Telegram Mini App Development

Expose the local Next dev server with ngrok:

```bash
ngrok http 3000
```

Set the HTTPS ngrok origin in `.env`:

```env
MINIAPP_URL=https://your-subdomain.ngrok-free.dev
```

Use that same HTTPS URL in BotFather for the bot's Mini App or menu button.

Next dev mode allows the configured ngrok host through `allowedDevOrigins` in `next.config.ts`, including HMR websocket
requests.

## Telegram Webhook

The bot webhook endpoint is:

```text
POST /api/bot/webhook
```

Set it with:

```bash
npm run bot:set-webhook
```

The script reads:

- `BOT_TOKEN`
- `MINIAPP_URL`

## API Routes

- `POST /api/auth/telegram-mini-app`
- `GET /api/me`
- `GET /api/profile`
- `PATCH /api/profile`
- `POST /api/learning/session/message`
- `POST /api/learning/session/transcribe`
- `GET /api/learning/session/history`
- `GET /api/learning/review/today`
- `GET /api/learning/mistakes`
- `GET /api/progress/summary`
- `POST /api/bot/webhook`
- `GET /api/health`

Protected API routes expect:

```http
Authorization: Bearer <jwt>
X-Language: en | es | sr
```

Mini App authentication expects Telegram init data:

```http
Authorization: tma <telegram init data>
```

## Project Layout

```text
src/
  app/                 Next App Router pages and API routes
  components/          Mini App UI, layout, providers, page components
  lib/
    agents/            specialist prompt builders
    auth/              Telegram init-data validation and JWT sessions
    bot/               grammY bot setup
    db/                Drizzle database client and schema
    services/          profile, practice, session, turn, mistake services
    llm.ts             Mistral provider integration
    orchestrator.ts    mode and agent routing
  types/               shared TypeScript domain types
scripts/
  set-webhook.mjs      Telegram webhook setup
docker-compose.yml     local PostgreSQL, Redis, and Whisper
drizzle.config.ts      Drizzle Kit configuration
```

## Notes

- Redis is still provisioned by Docker Compose, but the current request flow uses PostgreSQL-backed sessions and mistakes.
- Whisper runs the `base` model by default. Change `ASR_MODEL` in `docker-compose.yml` to `medium` for better accuracy (~1.5 GB download, ~2 GB RAM).
- Voice transcription timing and errors are logged to the `audio_logs` table for observability.
- Telegram injects theme CSS variables into the root document. The root layout suppresses hydration warnings for those
  expected Telegram-side mutations.
