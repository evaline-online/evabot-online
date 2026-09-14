import fs from 'node:fs';
import path from 'node:path';
import { knowledgeBase, type KnowledgeDocument } from './KnowledgeBase.js';
import { ChatHistoryStore } from './ChatHistoryStore.js';
import { logger, LogCategory } from './Logger.js';
import { McpLspSelectionStore } from '../models/ModelRatings.js';

export interface AddFilePayload {
  name: string;
  mime: string;
  data: Buffer;
}

export interface AddRosterFile {
  bots: string[];
  humans: string[];
  agents: Array<{ name: string; prompt?: string }>;
  media: Array<{ name: string; mime: string; size: number; ts: number }>;
}

export interface AddDocumentResult {
  ok: boolean;
  id?: string;
  error?: string;
}

const ROSTER_PATH_CANDIDATES = [
  path.resolve(process.cwd(), 'data', 'add-roster.json'),
  '/var/www/evabot-backend/data/add-roster.json',
];

const TEXTUAL_MIME_RE = /^(text\/|application\/(json|xml|javascript|xhtml\+xml|yaml))/i;
const TEXTUAL_EXT_RE = /\.(md|txt|csv|json|xml|yaml|yml|html?|log|ts|js|py)$/i;

const MAX_FETCH_BYTES = 5 * 1024 * 1024;

function rosterPath(): string {
  for (const candidate of ROSTER_PATH_CANDIDATES) {
    if (fs.existsSync(path.dirname(candidate))) return candidate;
  }
  return ROSTER_PATH_CANDIDATES[0];
}

function readRoster(): AddRosterFile {
  const empty: AddRosterFile = { bots: [], humans: [], agents: [], media: [] };
  try {
    const raw = fs.readFileSync(rosterPath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<AddRosterFile>;
    return {
      bots: Array.isArray(parsed.bots) ? parsed.bots : [],
      humans: Array.isArray(parsed.humans) ? parsed.humans : [],
      agents: Array.isArray(parsed.agents) ? parsed.agents : [],
      media: Array.isArray(parsed.media) ? parsed.media : [],
    };
  } catch {
    return empty;
  }
}

function writeRoster(roster: AddRosterFile): void {
  try {
    fs.writeFileSync(rosterPath(), JSON.stringify(roster, null, 2), 'utf8');
  } catch (err: unknown) {
    logger.warn(LogCategory.USER, 'ADD', `roster write failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function isTextual(name: string, mime: string): boolean {
  return TEXTUAL_MIME_RE.test(mime) || TEXTUAL_EXT_RE.test(name);
}

/** Strip HTML tags: drop script/style, remove tags, decode common entities. */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export class AddCommand {
  public static async execute(command: string, opts?: { file?: AddFilePayload }): Promise<string> {
    const parts = (command || '').trim().split(/\s+/);
    const head = parts[0]?.toLowerCase();
    const sub = parts[1]?.toLowerCase();

    if (head !== '/add' && head !== '/file' && head !== '/media') {
      return `[ERROR] Unknown command for AddCommand: ${head}. Use /add <subcommand>.`;
    }

    switch (sub) {
      case 'db':
      case 'kb':
        return this.handleDb(parts.slice(2).join(' '));
      case 'link':
        return this.handleLink(parts.slice(2).join(' ').trim());
      case 'context':
        return this.handleContext(parts.slice(2).join(' ').trim());
      case 'bot':
        return this.handleParticipant('bots', parts.slice(2).join(' ').trim());
      case 'human':
        return this.handleParticipant('humans', parts.slice(2).join(' ').trim());
      case 'agent':
        return this.handleAgent(parts.slice(2).join(' ').trim());
      case 'file':
        return this.handleFile(opts?.file, 'file');
      case 'media':
        return this.handleFile(opts?.file, 'media');
      case 'mcp':
        return this.handleMcp(parts.slice(2).join(' ').trim());
      case 'lsp':
        return this.handleLsp(parts.slice(2).join(' ').trim());
      case 'help':
      case undefined:
        return this.helpText();
      default:
        return `[ERROR] Unknown /add subcommand: ${sub}. Use /add help.`;
    }
  }

  public static helpText(): string {
    return [
      '',
      '═'.repeat(78),
      '  [ADD] UNIVERSAL ADD COMMAND — add content, links, files, participants, MCP/LSP',
      '═'.repeat(78),
      '  /add db <title> | <content>   - Add document to Knowledge Base (FTS5 index)',
      '  /add kb <title> | <content>   - Alias for /add db',
      '  /add link <url>               - Fetch URL, extract text, add to KB',
      '  /add context <text>           - Inject text into conversation context (system)',
      '  /add bot <name>               - Register bot participant in session roster',
      '  /add human <name>             - Register human participant in roster',
      '  /add agent <name> [prompt]    - Register agent with optional system prompt',
      '  /add file / /add media        - POST /api/upload (multipart) — text → KB,',
      '                                  binary → media metadata roster entry',
      '  /add mcp <name|номер>         - Добавить MCP сервер в выбор (alias: /mcp select)',
      '  /add lsp <name|номер>         - Добавить LSP сервер в выбор (alias: /lsp select)',
      '  /add help                     - This help',
      '',
      '  RU: /add добаляє документи (db/kb), лінки, файли, учасників та MCP/LSP сервери.',
      '  Примеры: /add db Цена | Плитка EVA — от $25/м²',
      '           /add link https://evacom.ua/en/about',
      '           /add agent Analyst Focus on market data.',
      '           /add mcp notebooklm',
      '           /add lsp typescript',
      '═'.repeat(78),
    ].join('\n');
  }

  private static async handleDb(args: string): Promise<string> {
    const sepIdx = args.indexOf('|');
    const title = (sepIdx === -1 ? args : args.slice(0, sepIdx)).trim();
    const content = sepIdx === -1 ? '' : args.slice(sepIdx + 1).trim();
    if (!title || !content) {
      return `[ERROR] Usage: /add db <title> | <content>`;
    }
    const doc = this.buildDocument(title, content, 'user-command');
    await this.applyDocument(doc);
    return `[ADD] Document added: "${doc.title}" (id=${doc.id}, lang=${doc.language.toUpperCase()}, chars=${content.length}), FTS5 index updated`;
  }

  public static buildDocument(title: string, content: string, source: string, tags: string[] = ['user', 'add-command']): KnowledgeDocument {
    const id = `user-${Date.now()}`;
    return {
      id,
      title,
      content,
      category: 'user',
      language: this.detectLanguage(`${title}\n${content}`),
      tags,
      source,
    };
  }

  public static detectLanguage(text: string): 'uk' | 'ru' | 'en' {
    if (/[іїєґ]/i.test(text)) return 'uk';
    if (/[а-яё]/i.test(text)) return 'ru';
    return 'en';
  }

  public static async addDocument(title: string, content: string, source?: string, tags?: string[]): Promise<AddDocumentResult> {
    if (!title.trim() || !content.trim()) {
      return { ok: false, error: 'Missing "title" or "content".' };
    }
    try {
      const doc = this.buildDocument(title.trim(), content.trim(), source || 'user-command', tags);
      await this.applyDocument(doc);
      return { ok: true, id: doc.id };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn(LogCategory.USER, 'ADD', `addDocument failed: ${msg}`);
      return { ok: false, error: msg };
    }
  }

  private static async applyDocument(doc: KnowledgeDocument): Promise<boolean> {
    try {
      // initialize() is idempotent; ensures the SQLite FTS5 handle is open so
      // persistDocument() actually lands rows on disk (survives restart).
      await knowledgeBase.initialize();
      knowledgeBase.addDocument(doc);
      knowledgeBase.persistDocument(doc);
      return true;
    } catch (err: unknown) {
      logger.warn(LogCategory.USER, 'ADD', `document apply failed: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }

  public static async addLink(url: string): Promise<{ ok: boolean; id?: string; chars?: number; error?: string }> {
    const trimmed = url.trim();
    if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
      return { ok: false, error: 'Usage: /add link <http(s)://url>' };
    }
    try {
      const res = await fetch(trimmed, {
        signal: AbortSignal.timeout(10_000),
        headers: { 'User-Agent': 'EvaBot/1.0 (+/add link)' },
        redirect: 'follow',
      });
      if (!res.ok) {
        return { ok: false, error: `Fetch failed: HTTP ${res.status}` };
      }
      const html = await res.text();
      if (html.length > MAX_FETCH_BYTES) {
        return { ok: false, error: 'Response too large (>5MB)' };
      }
      const text = stripHtml(html);
      if (!text) {
        return { ok: false, error: 'No extractable text content at URL' };
      }
      let host = trimmed;
      try { host = new URL(trimmed).host; } catch { /* keep raw */ }
      const doc = this.buildDocument(host, text, trimmed, ['user', 'link', 'web']);
      this.applyDocument(doc);
      return { ok: true, id: doc.id, chars: text.length };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ok: false, error: `Fetch failed: ${msg}` };
    }
  }

  private static async handleLink(args: string): Promise<string> {
    if (!args) {
      return `[ERROR] Usage: /add link <url>`;
    }
    const result = await this.addLink(args);
    if (!result.ok) {
      return `[ERROR] /add link failed: ${result.error}`;
    }
    return `[ADD] Link ingested: ${args} → document id=${result.id}, ${result.chars} chars extracted`;
  }

  private static handleContext(text: string): string {
    if (!text) {
      return `[ERROR] Usage: /add context <text>`;
    }
    const rowId = ChatHistoryStore.getInstance().appendMessage({
      sessionId: 'default',
      role: 'system',
      content: text,
    });
    logger.info(LogCategory.USER, 'ADD', `Context injected (row=${rowId ?? 'n/a'}): ${text.slice(0, 80)}`);
    return `[ADD] Context injected into session 'default' (role=system, row=${rowId ?? 'n/a'}).`;
  }

  private static handleParticipant(kind: 'bots' | 'humans', name: string): string {
    if (!name) {
      return `[ERROR] Usage: /add ${kind === 'bots' ? 'bot' : 'human'} <name>`;
    }
    const roster = readRoster();
    if (!roster[kind].includes(name)) roster[kind].push(name);
    writeRoster(roster);
    const size = roster.bots.length + roster.humans.length + roster.agents.length;
    const label = kind === 'bots' ? 'Bot' : 'Human';
    return `[ADD] ${label} "${name}" registered in session roster. Roster size: ${size} (bots=${roster.bots.length}, humans=${roster.humans.length}, agents=${roster.agents.length}).`;
  }

  private static handleAgent(args: string): string {
    if (!args) {
      return `[ERROR] Usage: /add agent <name> [prompt]`;
    }
    const name = args.split(/\s+/)[0];
    const prompt = args.slice(name.length).trim() || undefined;
    const roster = readRoster();
    const existing = roster.agents.find((a) => a.name === name);
    if (existing) {
      existing.prompt = prompt ?? existing.prompt;
    } else {
      roster.agents.push({ name, prompt });
    }
    writeRoster(roster);
    const size = roster.bots.length + roster.humans.length + roster.agents.length;
    return `[ADD] Agent "${name}" registered${prompt ? ` with prompt (${prompt.length} chars)` : ''}. Roster size: ${size} (bots=${roster.bots.length}, humans=${roster.humans.length}, agents=${roster.agents.length}).`;
  }

  private static async handleFile(file: AddFilePayload | undefined, kind: 'file' | 'media'): Promise<string> {
    if (!file || !file.data || file.data.length === 0) {
      return `[ERROR] No file payload. Use POST /api/upload (multipart/form-data) with /add file or /add media.`;
    }
    if (isTextual(file.name, file.mime)) {
      const content = file.data.toString('utf8').trim();
      if (!content) {
        return `[ERROR] File "${file.name}" is empty after text extraction.`;
      }
      const doc = this.buildDocument(file.name, content, `upload:${file.name}`, ['user', 'upload', kind]);
      await this.applyDocument(doc);
      return `[ADD] File "${file.name}" (${file.mime}, ${file.data.length} bytes) ingested into Knowledge Base as id=${doc.id} (${content.length} chars).`;
    }
    const roster = readRoster();
    roster.media.push({
      name: file.name || `upload-${Date.now()}`,
      mime: file.mime || 'application/octet-stream',
      size: file.data.length,
      ts: Date.now(),
    });
    writeRoster(roster);
    return `[ADD] Binary ${kind} "${file.name}" (${file.mime}, ${file.data.length} bytes) stored as media metadata in session roster (${roster.media.length} media entries). Multimodal parts not yet wired.`;
  }

  private static handleMcp(args: string): string {
    if (!args) return '[ERROR] Usage: /add mcp <имя_сервера|номер>';
    const store = McpLspSelectionStore.getInstance();
    const allServers = ['notebooklm', 'chrome-devtools', 'fetch', 'context7', 'filesystem', 'sqlite', 'memory', 'git', 'github', 'docker', 'google-cloud', 'sequential-thinking', 'markdownlint', 'firebase'];
    const idx = parseInt(args, 10);
    const name = (idx >= 1 && idx <= allServers.length) ? allServers[idx - 1] : args;
    if (!allServers.includes(name)) return `[ERROR] Неизвестный MCP сервер: ${name}. Доступные: ${allServers.join(', ')}`;
    if (store.select('mcp', name)) return `[ADD] MCP "${name}" добавлен в выбор.`;
    return `[ERROR] Не удалось добавить "${name}".`;
  }

  private static handleLsp(args: string): string {
    if (!args) return '[ERROR] Usage: /add lsp <имя_языка|номер>';
    const store = McpLspSelectionStore.getInstance();
    const allServers = ['TypeScript / JS', 'Python 3.11', 'HTML / CSS / JSON', 'Markdown / Docs'];
    const idx = parseInt(args, 10);
    const name = (idx >= 1 && idx <= allServers.length) ? allServers[idx - 1] : allServers.find(s => s.toLowerCase().includes(args.toLowerCase()));
    if (!name) return `[ERROR] Неизвестный LSP сервер: ${args}. Доступные: ${allServers.map((s, i) => `${i+1}. ${s}`).join(', ')}`;
    if (store.select('lsp', name)) return `[ADD] LSP "${name}" добавлен в выбор.`;
    return `[ERROR] Не удалось добавить "${name}".`;
  }
}
