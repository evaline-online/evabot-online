import { Router, withErrorHandling } from './Router.js';
import { knowledgeBase, KnowledgeBackend } from '../../core/KnowledgeBase.js';
import { KnowledgeBaseCommand } from '../../core/KnowledgeBaseCommand.js';
import { AddCommand } from '../../core/AddCommand.js';

export function createKbRouter(): Router {
  const router = new Router();

  const handleKbRoot = withErrorHandling(async (ctx) => {
    const stats = knowledgeBase.getStats();
    ctx.sendJson(200, {
      name: 'EvaBot Knowledge Base API',
      version: '1.0.0',
      stats,
      endpoints: {
        'GET /api/kb': 'This endpoint',
        'GET /api/kb/status': 'Backend status & stats',
        'GET /api/kb/search?q=<query>&limit=<n>&language=<lang>&category=<cat>': 'Search documents',
        'GET /api/kb/list?language=<lang>&category=<cat>': 'List all documents',
        'POST /api/kb/backend {backend}': 'Switch backend (memory|json|sqlite|vector)',
        'POST /api/kb/command {command}': 'Execute KB command',
        'POST /api/kb/documents {title, content, source?, tags?}': 'Add document',
        'POST /api/kb/link {url}': 'Fetch URL & add to KB',
      },
    });
  });

  // Handle both /api/kb and /api/kb/ (trailing slash)
  router.get('/api/kb', handleKbRoot);
  router.get('/api/kb/', handleKbRoot);

  router.get('/api/kb/status', withErrorHandling(async (ctx) => {
    const stats = knowledgeBase.getStats();
    const backends = knowledgeBase.getAvailableBackends();
    ctx.sendJson(200, {
      active: stats,
      available: backends,
      totalDocuments: stats.documentCount,
    });
  }));

  router.get('/api/kb/search', withErrorHandling(async (ctx) => {
    const query = ctx.query.get('q') || '';
    const limit = parseInt(ctx.query.get('limit') || '5', 10);
    const language = ctx.query.get('language') || undefined;
    const category = ctx.query.get('category') || undefined;
    if (!query) {
      ctx.sendJson(400, { error: 'Missing "q" query parameter' });
      return;
    }
    const results = knowledgeBase.search(query, { limit, language: language as any, category });
    ctx.sendJson(200, {
      query,
      count: results.length,
      results: results.map((d) => ({
        id: d.id, title: d.title, category: d.category, language: d.language,
        tags: d.tags, source: d.source, preview: d.content.substring(0, 300),
      })),
    });
  }));

  router.get('/api/kb/list', withErrorHandling(async (ctx) => {
    const language = ctx.query.get('language') || undefined;
    const category = ctx.query.get('category') || undefined;
    const docs = knowledgeBase.listDocuments({ language, category });
    ctx.sendJson(200, {
      count: docs.length,
      documents: docs.map((d) => ({
        id: d.id, title: d.title, category: d.category, language: d.language,
        tags: d.tags, source: d.source, contentLength: d.content.length,
      })),
    });
  }));

  router.post('/api/kb/backend', withErrorHandling(async (ctx) => {
    const body = await ctx.parseJsonBody();
    const backend = body.backend as KnowledgeBackend;
    if (!['memory', 'json', 'sqlite', 'vector'].includes(backend)) {
      ctx.sendJson(400, { error: 'Invalid backend. Use: memory, json, sqlite, vector' });
      return;
    }
    knowledgeBase.setBackend(backend);
    ctx.sendJson(200, { backend, message: `Backend switched to ${backend}` });
  }));

  router.post('/api/kb/command', withErrorHandling(async (ctx) => {
    const body = await ctx.parseJsonBody();
    const command = body.command || '';
    const result = KnowledgeBaseCommand.execute(command);
    ctx.sendJson(200, { result });
  }));

  router.post('/api/kb/documents', withErrorHandling(async (ctx) => {
    const body = await ctx.parseJsonBody();
    const title = typeof body.title === 'string' ? body.title : '';
    const content = typeof body.content === 'string' ? body.content : '';
    const source = typeof body.source === 'string' ? body.source : undefined;
    const tags = Array.isArray(body.tags) ? body.tags.filter((t: unknown): t is string => typeof t === 'string') : undefined;
    const result = await AddCommand.addDocument(title, content, source, tags);
    if (!result.ok) {
      ctx.sendJson(400, result);
      return;
    }
    ctx.sendJson(200, result);
  }));

  router.post('/api/kb/link', withErrorHandling(async (ctx) => {
    const body = await ctx.parseJsonBody();
    const url = typeof body.url === 'string' ? body.url : '';
    const result = await AddCommand.addLink(url);
    if (!result.ok) {
      ctx.sendJson(400, result);
      return;
    }
    ctx.sendJson(200, result);
  }));

  return router;
}
