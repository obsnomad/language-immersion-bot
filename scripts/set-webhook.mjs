import { readFileSync } from 'fs';

const envFile = readFileSync('.env', 'utf-8');
const env = Object.fromEntries(
  envFile
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('=').map((s) => s.trim()))
    .filter(([k]) => k),
);

const token = env.BOT_TOKEN;
const url = env.MINIAPP_URL;

if (!token || !url) {
  console.error('BOT_TOKEN and MINIAPP_URL must be set in .env');
  process.exit(1);
}

const webhookUrl = `${url}/api/bot/webhook`;
const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url: webhookUrl }),
});

const data = await res.json();
console.log('Webhook result:', data);
