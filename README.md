# language-immersion-bot

Project scaffold for a language immersion bot.

## Structure

```text
app/
  bot/
    handlers/
    router.py
  application/
  agents/
  domain/
  infra/
    db/
  llm/
  memory/
  api/
  main.py
tests/
.env
.env.example
.gitignore
docker-compose.yml
README.md
```

## Local setup

```bash
cp .env.example .env
docker --context default compose up -d
python -m app.main
```

Если `desktop-linux` context недоступен в Docker Desktop, используйте:

```bash
docker context use default
docker compose up -d
```
