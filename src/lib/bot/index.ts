import { Bot, InlineKeyboard } from 'grammy';
import { getOrCreateUser } from '@/lib/services/user.service';
import { handleMessage } from '@/lib/services/practice.service';

if (!process.env.BOT_TOKEN) throw new Error('BOT_TOKEN is not set');

export const bot = new Bot(process.env.BOT_TOKEN);

bot.command('start', async (ctx) => {
  const name = ctx.from?.first_name ?? 'there';
  const miniappUrl = process.env.MINIAPP_URL;

  if (miniappUrl) {
    const keyboard = new InlineKeyboard().webApp('Open App', miniappUrl);
    await ctx.reply(
      `Hello ${name}!\n\nI'm your language immersion companion. Open the app to start practising!`,
      { reply_markup: keyboard },
    );
  } else {
    await ctx.reply(
      `Hello ${name}!\n\nSend me a message in the language you're learning and I'll help you practise.`,
    );
  }
});

bot.on('message:text', async (ctx) => {
  const { id, username, first_name } = ctx.from;
  const user = await getOrCreateUser(String(id), username, first_name);

  try {
    const result = await handleMessage(user.id, 'en', ctx.message.text);
    let response = result.reply;
    if (result.feedback) response += `\n\n*Feedback:* ${result.feedback}`;
    await ctx.reply(response, { parse_mode: 'Markdown' });
  } catch {
    await ctx.reply('Something went wrong. Please try again.');
  }
});
