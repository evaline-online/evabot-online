import { Router, withErrorHandling } from './Router.js';
import { ModelRegistry } from '../../models/ModelRegistry.js';
import { ModelRatings, ModelCommand } from '../../models/ModelRatings.js';
import { I18nEngine } from '../../core/I18nEngine.js';
import { Config } from '../../core/Config.js';
import { logger, LogCategory } from '../../core/Logger.js';
import { DeveloperMode } from '../../core/DeveloperMode.js';

export function createModelsRouter(): Router {
  const router = new Router();

  router.get('/api/models', withErrorHandling(async (ctx) => {
    const smartestFree = ModelRatings.getSmartestFreeModel();
    const allModels = ModelRegistry.getAllModels().map((m) => ({
      ...m,
      rating: ModelRatings.computeRating(m),
    }));

    // Prioritize: 100% Free models first, sorted by composite score (Recency 35% + Quality 35% + Context 15% + Speed 10% + Cost 5%)
    allModels.sort((a, b) => {
      const aFree = a.pricing.freeTierStatus === '100% Free Quota Available' ? 1 : 0;
      const bFree = b.pricing.freeTierStatus === '100% Free Quota Available' ? 1 : 0;
      if (aFree !== bFree) return bFree - aFree;
      return (b.rating?.composite || 0) - (a.rating?.composite || 0);
    });

    ctx.sendJson(200, {
      models: allModels,
      categories: ModelRegistry.getCategories(),
      // Reliable interactive default = Config.defaultModel (openrouter/free
      // meta-router). The "smartest" free model (nemotron-super) sometimes
      // returns reasoning-only empty content and hangs interactive chat.
      defaultModel: Config.defaultModel,
      smartestFreeModel: smartestFree,
      fallbackChain: ModelRatings.getFallbackChain(smartestFree.id),
      stats: {
        total: allModels.length,
        free: ModelRegistry.getFreeModels().length,
        paid: ModelRegistry.getPaidOnlyModels().length,
      },
    });
  }));

  router.get('/api/models/free', withErrorHandling(async (ctx) => {
    const models = ModelRegistry.getFreeModels();
    ctx.sendJson(200, {
      count: models.length,
      models: models.map((m) => ({ ...m, rating: ModelRatings.computeRating(m) })),
    });
  }));

  router.get('/api/models/paid', withErrorHandling(async (ctx) => {
    const models = ModelRegistry.getPaidOnlyModels();
    ctx.sendJson(200, {
      count: models.length,
      models: models.map((m) => ({ ...m, rating: ModelRatings.computeRating(m) })),
    });
  }));

  router.get('/api/models/top', withErrorHandling(async (ctx) => {
    const dimension = (ctx.query.get('dimension') || 'quality') as 'quality' | 'speed' | 'context' | 'cost';
    const limit = parseInt(ctx.query.get('limit') || '10', 10);
    const freeOnly = ctx.query.get('free') === 'true';
    const entries = ModelRatings.rankByDimension(dimension, limit, freeOnly);
    ctx.sendJson(200, { dimension, freeOnly, limit, count: entries.length, entries });
  }));

  router.post('/api/models/command', withErrorHandling(async (ctx) => {
    const body = await ctx.parseJsonBody();
    const command = body.command || '';
    if (body.lang && typeof body.lang === 'string') {
      I18nEngine.setLocale(body.lang);
    }
    // Bind /developer unlock to the chat session that sent the command
    // (ChatRouter uses the same sessionId for the developer prompt block).
    DeveloperMode.setActiveSession(typeof body.sessionId === 'string' ? body.sessionId : undefined);
    const result = await ModelCommand.executeAsync(command);
    DeveloperMode.clearActiveSession();
    // The raw password never reaches the operation log either.
    logger.info(LogCategory.USER, 'MODEL_COMMAND', DeveloperMode.maskPasswordIn(command), { ip: ctx.clientIp });
    ctx.sendJson(200, { result });
  }));

  return router;
}
