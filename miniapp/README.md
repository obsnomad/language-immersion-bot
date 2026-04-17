# Language Immersion Mini App

This frontend is a Vite + React project for the Telegram mini app client.

## Scripts

`npm run dev`

Runs the Vite development server on port `80`. API calls to `/api` proxy to `http://127.0.0.1:8000`.

`npm run build`

Builds the production bundle into `miniapp/dist`. The backend should serve that directory at `/miniapp/`.

`npm run preview`

Serves the production build locally for a final verification pass.

## Local development

Run the backend separately on port `8000`:

`uv run uvicorn app.api.main:app --reload --port 8000`

Then start the frontend from `miniapp/`:

`npm run dev`

The frontend will be available at `http://127.0.0.1/` with hot reload enabled, without rebuilding `miniapp/dist`.

If you need a custom API origin instead of the built-in Vite proxy, set:

`VITE_API_BASE_URL=https://your-api-host.example/api`

To use the Mini App inside Telegram while keeping hot reload, expose port `80` with ngrok:

`ngrok http 80`

Then point the backend settings at the ngrok HTTPS origin:

`MINIAPP_URL=https://your-subdomain.ngrok-free.dev/`

`MINIAPP_CORS_ORIGINS=https://your-subdomain.ngrok-free.dev`

The Vite dev server reads `server.allowedHosts` from `MINIAPP_URL`, `MINIAPP_CORS_ORIGINS`, and
optionally `VITE_ALLOWED_HOSTS`. It checks both `miniapp/.env*` and the repo root `.env*`, so the
same ngrok hostname is accepted without editing `vite.config.js`.

Use the same HTTPS URL in BotFather for the Mini App entrypoint.
