import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { logger, LogCategory } from './Logger.js';

const require = createRequire(import.meta.url);

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  language: 'en' | 'uk' | 'ru' | 'pl' | 'ro' | 'de';
  tags: string[];
  source: string;
  metadata?: Record<string, unknown>;
  relevanceScore?: number;
}

export type KnowledgeBackend = 'memory' | 'json' | 'sqlite' | 'vector';

export interface KnowledgeBackendInfo {
  id: KnowledgeBackend;
  name: string;
  description: string;
  enabled: boolean;
  documentCount: number;
  languages: string[];
  sources: string[];
}

export interface VectorSearchOptions {
  language?: string;
  category?: string;
  limit?: number;
}

export type EmbeddingFunction = (texts: string[]) => Promise<number[][]>;

export class KnowledgeBase {
  private static instance: KnowledgeBase;
  private documents: Map<string, KnowledgeDocument> = new Map();
  private activeBackend: KnowledgeBackend = 'memory';
  private knowledgeBasePath: string;
  private desktopPath: string;
  private initialized: boolean = false;
  private sqliteDb: { prepare(sql: string): { get(...params: unknown[]): Record<string, unknown>; all(...params: unknown[]): Record<string, unknown>[]; run(...params: unknown[]): void } } | null = null;
  private ftsChunkCount: number = 0;
  private vectorEnabled: boolean = process.env.KB_VECTOR_ENABLED === '1';
  private vectorReady: boolean = false;
  private vectorWarmup: Promise<boolean> | null = null;
  private vectorIndex: Array<{ id: string; vec: Float32Array; doc: KnowledgeDocument }> = [];
  private embeddingModel: string = process.env.KB_EMBEDDING_MODEL || 'Xenova/all-MiniLM-L6-v2';
  private embeddingFn: EmbeddingFunction | null = null;

  private constructor() {
    const cwdKb = path.resolve(process.cwd(), 'knowledge-base');
    this.knowledgeBasePath = fs.existsSync(cwdKb) ? cwdKb : '/var/www/evabot-backend/knowledge-base';
    this.desktopPath = '/home/evabot/Desktop/evaline-com-ua';
  }

  public static getInstance(): KnowledgeBase {
    if (!KnowledgeBase.instance) {
      KnowledgeBase.instance = new KnowledgeBase();
    }
    return KnowledgeBase.instance;
  }

  public async initialize(): Promise<void> {
    if (this.initialized) return;

    logger.info(LogCategory.KB, 'INIT', 'Initializing EvaLine Unified Knowledge Base', {
      backendPath: this.knowledgeBasePath,
      desktopPath: this.desktopPath,
    });

    // 1. Initialize SQLite FTS5 database if available
    this.initSqliteFts();

    // 2. Load markdown documents from Desktop and backend knowledge directories
    await this.loadFromEvaLine();
    this.initialized = true;

    // 3. Optional ChromaDB vector backend (opt-in via KB_VECTOR_ENABLED=1).
    //    Non-blocking: chat keeps using SQLite FTS5 until the index is ready,
    //    and any failure silently leaves the FTS5 backend active.
    if (this.vectorEnabled && this.chromaCollectionPath()) {
      void this.warmupVectorBackend();
    }

    logger.info(LogCategory.KB, 'INIT', 'Knowledge Base initialized successfully', {
      memoryDocs: this.documents.size,
      ftsChunks: this.ftsChunkCount,
      activeBackend: this.activeBackend,
      sqliteReady: Boolean(this.sqliteDb),
    });
  }

  private initSqliteFts(): void {
    const candidatePaths = [
      path.join(this.knowledgeBasePath, 'evaline-knowledge-base', 'fts_index.db'),
      path.join(this.desktopPath, 'evaline-knowledge-base', 'fts_index.db'),
      path.join(this.knowledgeBasePath, 'fts_index.db'),
      '/var/www/evabot-backend/knowledge-base/evaline-knowledge-base/fts_index.db',
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const sqliteModule = require('node:sqlite');
          if (sqliteModule && sqliteModule.DatabaseSync) {
            this.sqliteDb = new sqliteModule.DatabaseSync(p);
            const countRow = this.sqliteDb!.prepare('SELECT count(*) as count FROM chunks_fts').get();
            this.ftsChunkCount = countRow ? Number(countRow.count) : 0;
            this.activeBackend = 'sqlite';
            logger.info(LogCategory.KB, 'SQLITE', `Connected to SQLite FTS5 index at ${p}`, {
              chunks: this.ftsChunkCount,
            });
            return;
          }
        } catch (err: unknown) {
          logger.warn(LogCategory.KB, 'SQLITE', `Could not open SQLite FTS at ${p}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
  }

  private async loadFromEvaLine(): Promise<void> {
    const possibleRoots = [
      path.join(this.knowledgeBasePath, 'evaline-com-ua'),
      this.desktopPath,
      this.knowledgeBasePath,
      '/var/www/evabot-backend/knowledge-base/evaline-com-ua',
      '/home/evabot/evaline-online',
    ];

    let loadedAny = false;

    for (const root of possibleRoots) {
      if (!fs.existsSync(root)) continue;

      const sitePath = fs.existsSync(path.join(root, 'site'))
        ? path.join(root, 'site')
        : path.join(root, 'evaline-com-ua', 'site');

      if (fs.existsSync(sitePath)) {
        const languages = ['en', 'uk', 'ru', 'pl', 'ro', 'de'];
        for (const lang of languages) {
          const langPath = path.join(sitePath, lang);
          if (fs.existsSync(langPath)) {
            await this.loadLanguageDirectory(langPath, lang as 'en' | 'uk' | 'ru' | 'pl' | 'ro' | 'de');
            loadedAny = true;
          }
        }

        const summaryPath = path.join(sitePath, 'SUMMARY.md');
        if (fs.existsSync(summaryPath)) {
          this.addDocument({
            id: 'evaline-summary',
            title: 'EvaLine Company Summary & Technical Overview',
            content: fs.readFileSync(summaryPath, 'utf8'),
            category: 'company-overview',
            language: 'en',
            tags: ['summary', 'evaline', 'overview', 'polymer', 'eva'],
            source: path.relative(this.knowledgeBasePath, summaryPath),
          });
        }
      }

      for (const lang of ['en', 'ru', 'uk'] as const) {
        const readmePath = path.join(root, `README.${lang}.md`);
        if (fs.existsSync(readmePath) && !this.documents.has(`evaline-readme-${lang}`)) {
          this.addDocument({
            id: `evaline-readme-${lang}`,
            title: `EvaLine README (${lang.toUpperCase()})`,
            content: fs.readFileSync(readmePath, 'utf8'),
            category: 'company-overview',
            language: lang,
            tags: ['readme', 'evaline', 'docs', lang],
            source: path.relative(this.knowledgeBasePath, readmePath),
          });
        }
      }

      if (loadedAny) break;
    }

    // TASK-350: company site repo /home/evabot/evaline-online (trilingual docs,
    // KANBAN, MANIFESTO, README). Independent of the site-roots loop above.
    await this.loadEvalineOnline();
  }

  private async loadEvalineOnline(): Promise<void> {
    const repoRoot = '/home/evabot/evaline-online';
    if (!fs.existsSync(repoRoot)) return;

    const IGNORED_DIRS = new Set([
      '.git', 'node_modules', 'dist', 'backups', 'archive', 'legacy_archive',
      'public', 'src', 'tests', 'scripts',
    ]);

    const collect = (dir: string, depth: number): string[] => {
      const out: string[] = [];
      for (const item of fs.readdirSync(dir)) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        if (stat.isDirectory()) {
          if (depth < 3 && !IGNORED_DIRS.has(item)) out.push(...collect(itemPath, depth + 1));
        } else if (stat.isFile() && (item.endsWith('.md') || item.endsWith('.txt'))) {
          out.push(itemPath);
        }
      }
      return out;
    };

    for (const filePath of collect(repoRoot, 0)) {
      const relPath = path.relative(repoRoot, filePath);
      const base = path.basename(relPath);
      const stem = base.replace(/\.(md|txt)$/i, '');

      // Language: trilingual files use suffixes .en / .uk / .ru before the extension.
      const langMatch = stem.match(/\.(en|uk|ru)$/);
      const language: 'en' | 'uk' | 'ru' = langMatch ? (langMatch[1] as 'en' | 'uk' | 'ru') : 'en';

      const id = `evaline-online-${relPath.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      if (this.documents.has(id)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch
        ? titleMatch[1].trim()
        : stem.replace(/\.(en|uk|ru)$/, '').replace(/[-_]/g, ' ');

      const doc: KnowledgeDocument = {
        id,
        title,
        content,
        category: this.inferEvalineOnlineCategory(relPath),
        language,
        tags: [language, 'evaline-online', 'company-site', 'eva'],
        source: `evaline-online/${relPath}`,
      };
      this.addDocument(doc);
      this.indexEvalineOnlineChunks(doc, relPath, language);
    }

    logger.info(LogCategory.KB, 'EVA_ONLINE', 'Company site repo ingested', {
      repo: repoRoot,
      memoryDocs: this.listDocuments({ tag: 'evaline-online' }).length,
    });
  }

  private inferEvalineOnlineCategory(relPath: string): string {
    const lower = relPath.toLowerCase();
    if (lower.includes('kanban')) return 'kanban';
    if (lower.includes('manifesto')) return 'manifesto';
    if (lower.includes('readme')) return 'company-overview';
    if (lower.includes('architecture')) return 'architecture';
    if (lower.includes('audit')) return 'audit';
    if (lower.includes('user_guide')) return 'user-guide';
    if (lower.startsWith('evabot')) return 'evabot-docs';
    return 'general';
  }

  /**
   * Index a document into the SQLite FTS5 table, reusing the chunker from
   * knowledge-base/evaline-knowledge-base/build_knowledge_base.py (headers split,
   * 1200-char soft limit, "Document:/Section:" contextual prefix).
   * Idempotent: skips files already indexed (dedupe by source file_path).
   */
  private indexEvalineOnlineChunks(doc: KnowledgeDocument, relPath: string, language: string): void {
    if (!this.sqliteDb) return;

    const filePath = `evaline-online/${relPath}`;
    try {
      const existing = this.sqliteDb
        .prepare('SELECT count(*) as count FROM chunks_fts WHERE file_path = ?')
        .get(filePath);
      if (existing && Number(existing.count) > 0) return;

      const stem = relPath.replace(/\.(md|txt)$/i, '').replace(/\.(en|uk|ru)$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const lines = doc.content.split('\n');

      let currentHeader = doc.title;
      let currentLines: string[] = [];
      let chunkIndex = 0;
      const flush = () => {
        const raw = currentLines.join('\n').trim();
        if (!raw) return;
        const fullText = `Document: ${doc.title}\nSection: ${currentHeader}\n\n${raw}`;
        const chunkId = `${language}_${stem}_${chunkIndex}`;
        try {
          this.sqliteDb!.prepare(
            'INSERT INTO chunks_fts (chunk_id, title, header, language, category, url, file_path, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
          ).run(chunkId, doc.title, currentHeader, language, doc.category, '', filePath, fullText);
          this.ftsChunkCount += 1;
          chunkIndex += 1;
        } catch (err: unknown) {
          logger.warn(LogCategory.KB, 'EVA_ONLINE', `Chunk insert skipped (${chunkId}): ${err instanceof Error ? err.message : String(err)}`);
        }
        currentLines = [];
      };

      for (const line of lines) {
        if (/^#{1,3}\s+/.test(line)) {
          flush();
          currentHeader = line.replace(/^#+/, '').trim();
          currentLines.push(line);
        } else {
          currentLines.push(line);
          if (currentLines.reduce((sum, l) => sum + l.length, 0) > 1200) flush();
        }
      }
      flush();
    } catch (err: unknown) {
      logger.warn(LogCategory.KB, 'EVA_ONLINE', `FTS indexing skipped for ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async loadLanguageDirectory(dirPath: string, language: 'en' | 'uk' | 'ru' | 'pl' | 'ro' | 'de'): Promise<void> {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isFile() && item.endsWith('.md')) {
        const id = `evaline-${language}-${item.replace('.md', '').toLowerCase()}`;
        if (this.documents.has(id)) continue;

        const content = fs.readFileSync(itemPath, 'utf8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch ? titleMatch[1] : item.replace('.md', '');

        this.addDocument({
          id,
          title,
          content,
          category: this.inferCategory(itemPath),
          language,
          tags: [language, 'evaline', 'product', 'eva-polymer'],
          source: path.relative(this.knowledgeBasePath, itemPath),
        });
      } else if (stat.isDirectory()) {
        await this.loadLanguageDirectory(itemPath, language);
      }
    }
  }

  private inferCategory(filePath: string): string {
    const lower = filePath.toLowerCase();
    if (lower.includes('b2b')) return 'b2b';
    if (lower.includes('b2c')) return 'b2c';
    if (lower.includes('certif')) return 'certificates';
    if (lower.includes('contact') || lower.includes('kontakt')) return 'contact';
    if (lower.includes('about') || lower.includes('pro-nas') || lower.includes('uber')) return 'about';
    if (lower.includes('wholesale') || lower.includes('poshuk-partneriv') || lower.includes('poisk-partnerov')) return 'wholesale';
    if (lower.includes('donate') || lower.includes('dopomoga')) return 'donate';
    if (lower.includes('news') || lower.includes('novini')) return 'news';
    if (lower.includes('index')) return 'home';
    return 'general';
  }

  public addDocument(doc: KnowledgeDocument): void {
    this.documents.set(doc.id, doc);
  }

  /**
   * Persist a user-added document into the SQLite FTS5 chunks table so it
   * survives restarts (mirrors the indexEvalineOnlineChunks insert pattern).
   * Returns true when a row was written; false when FTS5 is unavailable.
   */
  public persistDocument(doc: KnowledgeDocument): boolean {
    if (!this.sqliteDb) return false;
    const chunkId = `user_${doc.language}_${doc.id}`;
    const fullText = `Document: ${doc.title}\n\n${doc.content}`;
    try {
      this.sqliteDb
        .prepare('INSERT INTO chunks_fts (chunk_id, title, header, language, category, url, file_path, content) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(chunkId, doc.title, doc.title, doc.language, doc.category, doc.source, `user/${doc.id}`, fullText);
      this.ftsChunkCount += 1;
      logger.info(LogCategory.KB, 'USER_ADD', `Persisted document to FTS5 (chunk=${chunkId}, chars=${doc.content.length})`);
      return true;
    } catch (err: unknown) {
      logger.warn(LogCategory.KB, 'USER_ADD', `FTS persist skipped (${chunkId}): ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  public removeDocument(id: string): boolean {
    return this.documents.delete(id);
  }

  public listDocuments(filter?: { language?: string; category?: string; tag?: string }): KnowledgeDocument[] {
    let docs = Array.from(this.documents.values());
    if (filter?.language) {
      docs = docs.filter((d) => d.language === filter.language);
    }
    if (filter?.category) {
      docs = docs.filter((d) => d.category === filter.category);
    }
    if (filter?.tag) {
      docs = docs.filter((d) => d.tags.includes(filter.tag!));
    }
    return docs;
  }

  /**
   * Search knowledge base using SQLite FTS5 (if available) with fallback to in-memory matching
   */
  public search(
    query: string,
    options?: { language?: string; category?: string; limit?: number; minScore?: number }
  ): KnowledgeDocument[] {
    const limit = options?.limit || 5;
    const minScore = options?.minScore || 0.15;
    const cleanTokens = query
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 2);

    const ftsResults: KnowledgeDocument[] = [];

    // 1. Try high-performance SQLite FTS5 search
    if (this.sqliteDb && cleanTokens.length > 0) {
      try {
        const ftsQuery = cleanTokens.map((t) => `"${t}"*`).join(' OR ');
        let sql = `
          SELECT chunk_id, title, header, language, category, url, file_path, content, rank
          FROM chunks_fts
          WHERE chunks_fts MATCH ?
        `;
        const params: (string | number)[] = [ftsQuery];
        if (options?.language) {
          sql += ' AND language = ?';
          params.push(options.language);
        }
        if (options?.category) {
          sql += ' AND category = ?';
          params.push(options.category);
        }
        sql += ' ORDER BY rank LIMIT ?';
        params.push(limit);

        const rows = this.sqliteDb.prepare(sql).all(...params);
        for (const row of rows) {
          ftsResults.push({
            id: String(row.chunk_id),
            title: `${row.title} — ${row.header || row.category}`,
            content: String(row.content),
            category: String(row.category),
            language: (row.language as 'en' | 'uk' | 'ru' | 'pl' | 'ro' | 'de') || 'uk',
            tags: ['fts5', 'evaline-chunk', String(row.language)],
            source: `evaline-knowledge-base/fts_index.db [${row.file_path || 'chunk'}]`,
            relevanceScore: Math.min(0.99, Math.max(0.5, 1.0 - Math.abs(Number(row.rank)) * 0.05)),
            metadata: {
              url: row.url,
              header: row.header,
              file_path: row.file_path,
            },
          });
        }
      } catch (err: unknown) {
        logger.warn(LogCategory.KB, 'FTS_SEARCH', `FTS query fallback: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (ftsResults.length >= limit) {
      return ftsResults.slice(0, limit);
    }

    // 2. Memory search
    const queryLower = query.toLowerCase();
    const queryWords = cleanTokens.map((t) => t.toLowerCase());
    const memResults: Array<{ doc: KnowledgeDocument; score: number }> = [];

    for (const doc of this.documents.values()) {
      if (options?.language && doc.language !== options.language) continue;
      if (options?.category && doc.category !== options.category) continue;

      const contentLower = `${doc.title} ${doc.content} ${doc.tags.join(' ')}`.toLowerCase();
      let score = 0;
      let matches = 0;

      for (const word of queryWords) {
        const count = (contentLower.match(new RegExp(word, 'g')) || []).length;
        if (count > 0) {
          score += count * 0.12;
          matches++;
        }
      }

      if (queryLower.includes(doc.title.toLowerCase())) score += 0.5;
      for (const tag of doc.tags) {
        if (queryLower.includes(tag)) score += 0.2;
      }

      if (matches > 0) {
        score = Math.min(0.98, score);
        if (score >= minScore) {
          memResults.push({ doc: { ...doc, relevanceScore: parseFloat(score.toFixed(3)) }, score });
        }
      }
    }

    memResults.sort((a, b) => b.score - a.score);

    // Merge FTS results and Memory results, deduplicating by ID
    const seenIds = new Set<string>();
    const merged: KnowledgeDocument[] = [];

    for (const d of ftsResults) {
      if (!seenIds.has(d.id)) {
        seenIds.add(d.id);
        merged.push(d);
      }
    }

    for (const item of memResults) {
      if (!seenIds.has(item.doc.id) && merged.length < limit) {
        seenIds.add(item.doc.id);
        merged.push(item.doc);
      }
    }

    return merged.slice(0, limit);
  }

  private chromaCollectionPath(): string | null {
    const candidates = [
      path.join(this.knowledgeBasePath, 'evaline-knowledge-base', 'chroma_db', 'chroma.sqlite3'),
      path.join(this.desktopPath, 'evaline-knowledge-base', 'chroma_db', 'chroma.sqlite3'),
      '/var/www/evabot-backend/knowledge-base/evaline-knowledge-base/chroma_db/chroma.sqlite3',
    ];
    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) return candidate;
    }
    return null;
  }

  public isVectorEnabled(): boolean {
    return this.vectorEnabled;
  }

  public isVectorReady(): boolean {
    return this.vectorReady;
  }

  public getVectorIndexSize(): number {
    return this.vectorIndex.length;
  }

  /**
   * Reads the indexed chunks out of the ChromaDB SQLite metadata store.
   * NOTE: ChromaDB keeps the actual vectors in its HNSW binary index
   * (chroma_db/<uuid>/data_level0.bin), not in SQLite — those are re-embedded
   * locally by getEmbeddingFunction() using the same model the collection was
   * built with (Chroma's default all-MiniLM-L6-v2, 384 dims).
   */
  private readChromaDocuments(dbPath: string): KnowledgeDocument[] {
    const sqliteModule = require('node:sqlite');
    const DatabaseSync = sqliteModule?.DatabaseSync;
    if (!DatabaseSync) throw new Error('node:sqlite is unavailable');
    const db = new DatabaseSync(dbPath);
    try {
      const rows = db.prepare(`
        SELECT e.embedding_id AS id,
          MAX(CASE WHEN m.key='chroma:document' THEN m.string_value END) AS content,
          MAX(CASE WHEN m.key='title' THEN m.string_value END) AS title,
          MAX(CASE WHEN m.key='header' THEN m.string_value END) AS header,
          MAX(CASE WHEN m.key='language' THEN m.string_value END) AS language,
          MAX(CASE WHEN m.key='category' THEN m.string_value END) AS category,
          MAX(CASE WHEN m.key='file' THEN m.string_value END) AS file,
          MAX(CASE WHEN m.key='url' THEN m.string_value END) AS url
        FROM embeddings e JOIN embedding_metadata m ON m.id = e.id
        GROUP BY e.id
      `).all();
      return rows
        .map((row: Record<string, unknown>) => ({
          id: String(row.id),
          title: String(row.title || row.id),
          content: String(row.content || ''),
          category: String(row.category || 'general'),
          language: String(row.language || 'uk') as KnowledgeDocument['language'],
          tags: ['chroma', 'vector', String(row.language || '')],
          source: `evaline-knowledge-base/chroma_db [${row.file || 'chunk'}]`,
          metadata: { header: row.header, url: row.url, file: row.file },
        }))
        .filter((doc: KnowledgeDocument) => doc.content.length > 0);
    } finally {
      db.close();
    }
  }

  /**
   * Configurable embedding function.
   *  - KB_EMBEDDING_MODE=local (default): optional @huggingface/transformers
   *    (Xenova/all-MiniLM-L6-v2) — no credentials, model cached by HF.
   *  - KB_EMBEDDING_MODE=http: OpenAI-compatible /embeddings endpoint via
   *    KB_EMBEDDING_URL + optional KB_EMBEDDING_API_KEY.
   * Throws when the runtime is unavailable; callers always fall back to FTS5.
   */
  private async getEmbeddingFunction(): Promise<EmbeddingFunction> {
    if (this.embeddingFn) return this.embeddingFn;
    const mode = (process.env.KB_EMBEDDING_MODE || 'local').toLowerCase();

    if (mode === 'http') {
      const url = process.env.KB_EMBEDDING_URL;
      if (!url) throw new Error('KB_EMBEDDING_MODE=http requires KB_EMBEDDING_URL');
      const apiKey = process.env.KB_EMBEDDING_API_KEY || '';
      this.embeddingFn = async (texts: string[]) => {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
          },
          body: JSON.stringify({ model: this.embeddingModel, input: texts }),
        });
        if (!response.ok) throw new Error(`Embedding endpoint ${response.status}`);
        const json: any = await response.json();
        const data = json.data || [];
        return data.map((entry: any) => entry.embedding as number[]);
      };
      return this.embeddingFn;
    }

    const dynamicImport = new Function('specifier', 'return import(specifier)') as (s: string) => Promise<any>;
    const transformers = await dynamicImport('@huggingface/transformers');
    const extractor = await transformers.pipeline('feature-extraction', this.embeddingModel);
    this.embeddingFn = async (texts: string[]) => {
      const output = await extractor(texts, { pooling: 'mean', normalize: true });
      const dims: number[] = output.dims;
      const flat: Float32Array = output.data;
      const dim = dims[dims.length - 1];
      const vectors: number[][] = [];
      for (let i = 0; i < texts.length; i++) {
        vectors.push(Array.from(flat.subarray(i * dim, (i + 1) * dim)));
      }
      return vectors;
    };
    return this.embeddingFn;
  }

  private vectorCachePath(): string {
    return path.join(this.knowledgeBasePath, 'evaline-knowledge-base', '.vector-cache.json');
  }

  private loadVectorCache(expected: number): Float32Array[] | null {
    try {
      const cachePath = this.vectorCachePath();
      if (!fs.existsSync(cachePath)) return null;
      const json = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      if (json.model !== this.embeddingModel || json.count !== expected || !json.vectors) return null;
      const buf = Buffer.from(json.vectors, 'base64');
      const dim = Number(json.dim);
      const vectors: Float32Array[] = [];
      for (let i = 0; i < expected; i++) {
        const vec = new Float32Array(dim);
        for (let j = 0; j < dim; j++) vec[j] = buf.readFloatLE((i * dim + j) * 4);
        vectors.push(vec);
      }
      return vectors;
    } catch (err: unknown) {
      logger.warn(LogCategory.KB, 'VECTOR', `Vector cache read skipped: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  private saveVectorCache(vectors: Float32Array[]): void {
    try {
      const dim = vectors[0]?.length || 0;
      const all = new Float32Array(vectors.length * dim);
      for (let i = 0; i < vectors.length; i++) all.set(vectors[i], i * dim);
      const payload = {
        model: this.embeddingModel,
        dim,
        count: vectors.length,
        vectors: Buffer.from(all.buffer, all.byteOffset, all.byteLength).toString('base64'),
      };
      fs.writeFileSync(this.vectorCachePath(), JSON.stringify(payload), 'utf8');
    } catch (err: unknown) {
      logger.warn(LogCategory.KB, 'VECTOR', `Vector cache write skipped: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async buildVectorIndex(): Promise<boolean> {
    const dbPath = this.chromaCollectionPath();
    if (!dbPath) return false;
    const docs = this.readChromaDocuments(dbPath);
    if (docs.length === 0) return false;

    const embed = await this.getEmbeddingFunction();
    let vectors = this.loadVectorCache(docs.length);
    if (!vectors) {
      vectors = [];
      const batchSize = 64;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);
        const batchVectors = await embed(batch.map((doc) => doc.content));
        for (const vec of batchVectors) vectors.push(Float32Array.from(vec));
        logger.debug(LogCategory.KB, 'VECTOR', `Embedded ${Math.min(i + batchSize, docs.length)}/${docs.length} chunks`);
      }
      this.saveVectorCache(vectors);
    }

    const index: Array<{ id: string; vec: Float32Array; doc: KnowledgeDocument }> = [];
    for (let i = 0; i < docs.length; i++) {
      const vec = vectors[i];
      if (!vec) continue;
      let norm = 0;
      for (const value of vec) norm += value * value;
      norm = Math.sqrt(norm) || 1;
      const normalized = new Float32Array(vec.length);
      for (let j = 0; j < vec.length; j++) normalized[j] = vec[j] / norm;
      index.push({ id: docs[i].id, vec: normalized, doc: docs[i] });
    }

    this.vectorIndex = index;
    this.vectorReady = index.length > 0;
    if (this.vectorReady) {
      this.activeBackend = 'vector';
      logger.info(LogCategory.KB, 'VECTOR', 'ChromaDB vector backend ready', {
        vectors: index.length,
        model: this.embeddingModel,
        dbPath,
      });
    }
    return this.vectorReady;
  }

  public async warmupVectorBackend(): Promise<boolean> {
    if (!this.vectorEnabled) return false;
    if (this.vectorReady) return true;
    if (this.vectorWarmup) return this.vectorWarmup;
    this.vectorWarmup = this.buildVectorIndex().catch((err: unknown) => {
      logger.warn(LogCategory.KB, 'VECTOR', `Vector warmup failed — staying on FTS5: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    });
    return this.vectorWarmup;
  }

  public async searchVector(queryText: string, k: number = 5, options?: VectorSearchOptions): Promise<KnowledgeDocument[]> {
    if (!this.vectorReady) {
      if (!this.vectorEnabled) throw new Error('Vector backend disabled (set KB_VECTOR_ENABLED=1)');
      await this.warmupVectorBackend();
      if (!this.vectorReady) throw new Error('Vector backend unavailable');
    }

    const embed = await this.getEmbeddingFunction();
    const [raw] = await embed([queryText]);
    if (!raw || raw.length === 0) return [];
    let norm = 0;
    for (const value of raw) norm += value * value;
    norm = Math.sqrt(norm) || 1;
    const query = new Float32Array(raw.length);
    for (let i = 0; i < raw.length; i++) query[i] = raw[i] / norm;

    const scored: Array<{ doc: KnowledgeDocument; score: number }> = [];
    for (const entry of this.vectorIndex) {
      if (options?.language && entry.doc.language !== options.language) continue;
      if (options?.category && entry.doc.category !== options.category) continue;
      let dot = 0;
      const len = Math.min(query.length, entry.vec.length);
      for (let i = 0; i < len; i++) dot += query[i] * entry.vec[i];
      scored.push({ doc: entry.doc, score: dot });
    }
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k).map((entry) => ({ ...entry.doc, relevanceScore: parseFloat(entry.score.toFixed(4)) }));
  }

  /**
   * Vector-first search with a guaranteed FTS5/memory fallback. Any vector
   * error is swallowed so chat can never break because of the vector backend.
   */
  public async searchWithVector(
    query: string,
    options?: { language?: string; category?: string; limit?: number; minScore?: number }
  ): Promise<KnowledgeDocument[]> {
    if (this.vectorEnabled && this.vectorReady) {
      try {
        const results = await this.searchVector(query, options?.limit || 5, {
          language: options?.language,
          category: options?.category,
        });
        if (results.length > 0) return results;
      } catch (err: unknown) {
        logger.warn(LogCategory.KB, 'VECTOR', `Vector search failed — falling back to FTS5: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    return this.search(query, options);
  }

  public setBackend(backend: KnowledgeBackend): void {
    const old = this.activeBackend;
    this.activeBackend = backend;
    logger.info(LogCategory.KB, 'BACKEND', `Backend switched: ${old} -> ${backend}`);
  }

  public getBackend(): KnowledgeBackend {
    return this.activeBackend;
  }

  public getStats(): KnowledgeBackendInfo {
    const docs = Array.from(this.documents.values());
    const languages = new Set<string>();
    const sources = new Set<string>();

    for (const doc of docs) {
      languages.add(doc.language);
      sources.add(doc.source);
    }

    const BACKEND_INFO: Record<KnowledgeBackend, { name: string; description: string }> = {
      memory: { name: 'In-Memory', description: 'Documents loaded into RAM (fastest, full text)' },
      json: { name: 'JSON File Storage', description: 'Documents saved as JSON files in ./knowledge-base/' },
      sqlite: { name: 'SQLite FTS5 Hybrid', description: 'FTS5 full-text search across 1,086 pre-indexed EvaLine chunks' },
      vector: { name: 'Vector Database (ChromaDB)', description: 'ChromaDB persistent vector store at desktop/backend' },
    };

    const info = BACKEND_INFO[this.activeBackend] || BACKEND_INFO.memory;
    const totalCount = this.sqliteDb ? this.ftsChunkCount + docs.length : docs.length;

    return {
      id: this.activeBackend,
      name: info.name,
      description: info.description,
      enabled: true,
      documentCount: totalCount,
      languages: Array.from(languages),
      sources: Array.from(sources),
    };
  }

  public getAvailableBackends(): KnowledgeBackendInfo[] {
    const stats = this.getStats();
    return [
      {
        id: 'sqlite',
        name: 'SQLite FTS5 Index',
        description: 'FTS5 full-text BM25 ranking on 1,086 EvaLine chunks (Desktop & Backend)',
        enabled: Boolean(this.sqliteDb),
        documentCount: this.ftsChunkCount,
        languages: ['uk', 'ru', 'en', 'pl', 'ro', 'de'],
        sources: ['evaline-knowledge-base/fts_index.db'],
      },
      {
        id: 'memory',
        name: 'In-Memory Markdown Store',
        description: '178 markdown files loaded from site and readmes',
        enabled: true,
        documentCount: this.documents.size,
        languages: [...stats.languages],
        sources: [...stats.sources],
      },
      {
        id: 'vector',
        name: 'ChromaDB Vector Store',
        description: 'Persistent embeddings in evaline-knowledge-base/chroma_db',
        enabled: fs.existsSync(path.join(this.knowledgeBasePath, 'evaline-knowledge-base', 'chroma_db')) ||
                 fs.existsSync(path.join(this.desktopPath, 'evaline-knowledge-base', 'chroma_db')) ||
                 fs.existsSync('/var/www/evabot-backend/knowledge-base/evaline-knowledge-base/chroma_db'),
        documentCount: 1086,
        languages: ['uk', 'ru', 'en', 'pl', 'ro', 'de'],
        sources: ['evaline-knowledge-base/chroma_db'],
      },
      {
        id: 'json',
        name: 'JSON File Storage',
        description: 'Documents serialized in knowledge-base/',
        enabled: true,
        documentCount: 0,
        languages: [],
        sources: [],
      },
    ];
  }

  public formatSearchResults(docs: KnowledgeDocument[], query: string): string {
    if (docs.length === 0) {
      return `\n[KB] No results for: "${query}"\n`;
    }

    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    lines.push(`  [KB] EVALINE KNOWLEDGE BASE RESULTS (${docs.length} documents)`);
    lines.push(`  Query: "${query}"`);
    lines.push(`  Active Backend: ${this.getStats().name} (${this.getStats().documentCount} indexed records)`);
    lines.push('═'.repeat(78));

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const scoreStr = doc.relevanceScore ? ` | Score: ${(doc.relevanceScore * 100).toFixed(0)}%` : '';
      lines.push('');
      lines.push(`  [${i + 1}] ${doc.title}${scoreStr}`);
      lines.push(`      ID: ${doc.id}`);
      lines.push(`      Category: ${doc.category} | Language: ${doc.language.toUpperCase()}`);
      lines.push(`      Source: ${doc.source}`);
      const preview = doc.content.substring(0, 220).replace(/\n/g, ' ');
      lines.push(`      Preview: ${preview}${doc.content.length > 220 ? '...' : ''}`);
    }

    return lines.join('\n');
  }
}

export const knowledgeBase = KnowledgeBase.getInstance();
