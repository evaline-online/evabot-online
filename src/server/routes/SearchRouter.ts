import { Router, withErrorHandling } from './Router.js';
import { knowledgeBase } from '../../core/KnowledgeBase.js';
import { UserMemory } from '../../core/UserMemory.js';
import { ProductCatalog } from '../../core/ProductCatalog.js';
import { ChatHistoryStore } from '../../core/ChatHistoryStore.js';
import { logger, LogCategory } from '../../core/Logger.js';

interface SearchResult {
  type: 'kb' | 'chat' | 'memory' | 'product' | 'command';
  id: string;
  title: string;
  snippet: string;
  score: number;
  highlights: Array<{ field: string; matched: string }>;
  metadata: Record<string, any>;
}

interface SearchOptions {
  query: string;
  types?: ('kb' | 'chat' | 'memory' | 'product' | 'command')[];
  limit?: number;
  language?: string;
  dateFrom?: number;
  dateTo?: number;
  fuzzy?: boolean;
}

function fuzzyMatch(text: string, query: string): { match: boolean; score: number; positions: number[] } {
  if (!text || !query) return { match: false, score: 0, positions: [] };
  const t = text.toLowerCase();
  const q = query.toLowerCase();
  if (t.includes(q)) return { match: true, score: 1.0, positions: [t.indexOf(q)] };
  
  // Simple fuzzy: subsequence match
  let ti = 0, qi = 0, positions: number[] = [];
  while (ti < t.length && qi < q.length) {
    if (t[ti] === q[qi]) {
      positions.push(ti);
      qi++;
    }
    ti++;
  }
  if (qi === q.length) {
    return { match: true, score: 0.7 * (q.length / t.length), positions };
  }
  return { match: false, score: 0, positions: [] };
}

function highlightText(text: string, positions: number[], queryLen: number): string {
  if (positions.length === 0) return text;
  let result = '';
  let lastEnd = 0;
  for (const pos of positions) {
    result += text.slice(lastEnd, pos);
    result += '<mark>';
    result += text.slice(pos, pos + queryLen);
    result += '</mark>';
    lastEnd = pos + queryLen;
  }
  result += text.slice(lastEnd);
  return result;
}

function searchKB(query: string, opts: SearchOptions): SearchResult[] {
  const results = knowledgeBase.search(query, { 
    limit: opts.limit || 10, 
    language: opts.language 
  });
  return results.map((doc, idx) => {
    const match = fuzzyMatch(doc.content, query);
    return {
      type: 'kb' as const,
      id: doc.id,
      title: doc.title,
      snippet: doc.content.slice(0, 200),
      score: match.score * (1 - idx * 0.05),
      highlights: match.match 
        ? [{ field: 'content', matched: highlightText(doc.content.slice(0, 200), match.positions, query.length) }]
        : [],
      metadata: { category: doc.category, language: doc.language, source: doc.source },
    };
  }).filter(r => r.highlights.length > 0 || query.length < 3);
}

function searchChats(query: string, opts: SearchOptions): SearchResult[] {
  try {
    const store = ChatHistoryStore.getInstance();
    const results = store.searchMessages(query, opts.limit || 20);
    return results.map((msg: any, idx: number) => {
      const match = fuzzyMatch(msg.content, query);
      return {
        type: 'chat' as const,
        id: msg.id.toString(),
        title: `Chat ${new Date(msg.ts).toLocaleString()}`,
        snippet: msg.content.slice(0, 200),
        score: match.score * (1 - idx * 0.03),
        highlights: match.match
          ? [{ field: 'content', matched: highlightText(msg.content.slice(0, 200), match.positions, query.length) }]
          : [],
        metadata: { sessionId: msg.sessionId, role: msg.role, timestamp: msg.ts },
      };
    }).filter((r: any) => r.highlights.length > 0);
  } catch {
    return [];
  }
}


function getProductName(product: any, lang: string = 'uk'): string {
  return product.name?.[lang] || product.name?.en || product.name?.uk || product.name?.ru || 'Unknown';
}

function getProductDescription(product: any, lang: string = 'uk'): string {
  const parts = [];
  if (product.category) parts.push(`Категория: ${product.category}`);
  if (product.sizes?.length) parts.push(`Размеры: ${product.sizes.join(', ')}`);
  if (product.thickness) parts.push(`Толщина: ${product.thickness}`);
  if (product.colors?.length) parts.push(`Цвета: ${product.colors.join(', ')}`);
  if (product.materials) parts.push(`Материалы: ${product.materials}`);
  return parts.join('; ');
}

function searchProducts(query: string, opts: SearchOptions): SearchResult[] {
  try {
    const lang = opts.language || 'uk';
    const results = ProductCatalog.search(query);
    return results.map((prod: any, idx: number) => {
      const name = getProductName(prod, lang);
      const desc = getProductDescription(prod, lang);
      const searchText = `${name} ${desc}`;
      const match = fuzzyMatch(searchText, query);
      return {
        type: 'product' as const,
        id: prod.id,
        title: name,
        snippet: desc.slice(0, 200),
        score: match.score * (1 - idx * 0.05),
        highlights: match.match
          ? [{ field: 'description', matched: highlightText(desc.slice(0, 200), match.positions, query.length) }]
          : [],
        metadata: { category: prod.category, price: prod.price, unit: prod.unit, sku: prod.sku },
      };
    }).filter((r: any) => r.highlights.length > 0);
  } catch {
    return [];
  }
}

function searchCommands(query: string, opts: SearchOptions): SearchResult[] {
  const commands = [
    { cmd: '/help', desc: 'Полный список команд системы' },
    { cmd: '/models', desc: 'Каталог AI-моделей' },
    { cmd: '/products', desc: 'Каталог продукции EvaLine' },
    { cmd: '/lang', desc: 'Смена языка (uk, ru, en)' },
    { cmd: '/search', desc: 'Полнотекстовый поиск по чатам и базе знаний' },
    { cmd: '/kb', desc: 'База знаний: статус, поиск, документы' },
    { cmd: '/cost', desc: 'Бухгалтерия, витраты токенів' },
    { cmd: '/company', desc: 'Ростер агентов компании' },
    { cmd: '/news', desc: 'Кураторские новины' },
    { cmd: '/sys', desc: 'Самоидентификация системы' },
    { cmd: '/developer', desc: 'Режим разработчика' },
    { cmd: '/translate', desc: 'Перевод текста' },
    { cmd: '/say', desc: 'Озвучить текст (TTS)' },
    { cmd: '/voices', desc: 'Каталог голосов' },
    { cmd: '/consilium', desc: 'Мульти-агентный консилиум' },
    { cmd: '/sephirot', desc: 'Консилиум Сефирот' },
  ];
  
  return commands
    .map((c, idx) => {
      const match = fuzzyMatch(`${c.cmd} ${c.desc}`, query);
      return {
        type: 'command' as const,
        id: c.cmd,
        title: c.cmd,
        snippet: c.desc,
        score: match.score * (1 - idx * 0.01),
        highlights: match.match
          ? [{ field: 'desc', matched: highlightText(c.desc, match.positions, query.length) }]
          : [],
        metadata: { cmd: c.cmd },
      };
    })
    .filter((r: any) => r.highlights.length > 0);
}

export function createSearchRouter(): Router {
  const router = new Router();

  router.post('/api/search', withErrorHandling(async (ctx) => {
    const body = await ctx.parseJsonBody();
    const query = typeof body.query === 'string' ? body.query.trim() : '';
    if (!query) {
      ctx.sendJson(400, { error: 'Missing "query" parameter' });
      return;
    }

    const opts: SearchOptions = {
      query,
      types: Array.isArray(body.types) ? body.types : ['kb', 'chat', 'memory', 'product', 'command'],
      limit: typeof body.limit === 'number' ? body.limit : 20,
      language: typeof body.language === 'string' ? body.language : undefined,
      dateFrom: typeof body.dateFrom === 'number' ? body.dateFrom : undefined,
      dateTo: typeof body.dateTo === 'number' ? body.dateTo : undefined,
      fuzzy: body.fuzzy !== false,
    };

    const allResults: SearchResult[] = [];
    
    if (opts.types?.includes('kb')) allResults.push(...searchKB(query, opts));
    if (opts.types?.includes('chat')) allResults.push(...searchChats(query, opts));
    // if (opts.types?.includes('memory')) allResults.push(...searchMemory(query, opts)); // UserMemory has no search method
    if (opts.types?.includes('product')) allResults.push(...searchProducts(query, opts));
    if (opts.types?.includes('command')) allResults.push(...searchCommands(query, opts));

    // Sort by score descending
    allResults.sort((a, b) => b.score - a.score);

    // Apply global limit
    const limited = allResults.slice(0, opts.limit || 20);

    ctx.sendJson(200, {
      query,
      total: allResults.length,
      results: limited,
      tookMs: 0,
    });
  }));

  // GET /api/search?q=... for simple usage
  router.get('/api/search', withErrorHandling(async (ctx) => {
    const query = ctx.query.get('q') || '';
    if (!query) {
      ctx.sendJson(400, { error: 'Missing "q" query parameter' });
      return;
    }

    const opts: SearchOptions = {
      query,
      types: ctx.query.get('types')?.split(',') as any || ['kb', 'chat', 'memory', 'product', 'command'],
      limit: parseInt(ctx.query.get('limit') || '20', 10),
      language: ctx.query.get('language') || undefined,
      fuzzy: ctx.query.get('fuzzy') !== 'false',
    };

    const allResults: SearchResult[] = [];
    
    if (opts.types?.includes('kb')) allResults.push(...searchKB(query, opts));
    if (opts.types?.includes('chat')) allResults.push(...searchChats(query, opts));
    // if (opts.types?.includes('memory')) allResults.push(...searchMemory(query, opts)); // UserMemory has no search method
    if (opts.types?.includes('product')) allResults.push(...searchProducts(query, opts));
    if (opts.types?.includes('command')) allResults.push(...searchCommands(query, opts));

    allResults.sort((a, b) => b.score - a.score);
    const limited = allResults.slice(0, opts.limit || 20);

    ctx.sendJson(200, {
      query,
      total: allResults.length,
      results: limited,
    });
  }));

  return router;
}
