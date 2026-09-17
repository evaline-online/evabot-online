import { Router, withErrorHandling } from './Router.js';
import { getTelegramBotSingleton } from '../../telegram/TelegramBot.js';
import { logger, LogCategory } from '../../core/Logger.js';

export function createTelegramWebhookRouter(): Router {
  const router = new Router();

  // POST /api/telegram/webhook - Telegram webhook endpoint
  router.post('/api/telegram/webhook', withErrorHandling(async (ctx) => {
    const bot = getTelegramBotSingleton();
    if (!bot) {
      ctx.sendJson(503, { error: 'Telegram bot not initialized' });
      return;
    }

    try {
      const update = await ctx.parseJsonBody();
      if (!update || typeof update !== 'object') {
        ctx.sendJson(400, { error: 'Invalid update payload' });
        return;
      }

      // Process the update asynchronously
      bot.processUpdate(update);
      ctx.sendJson(200, { ok: true });
    } catch (err: any) {
      logger.error(LogCategory.SYSTEM, 'TelegramWebhook', `Webhook error: ${err.message}`);
      ctx.sendJson(500, { error: 'Internal server error' });
    }
  }));

  // GET /api/telegram/webhook - for verification
  router.get('/api/telegram/webhook', withErrorHandling(async (ctx) => {
    ctx.sendJson(200, { status: 'Telegram webhook endpoint active' });
  }));

  return router;
}
