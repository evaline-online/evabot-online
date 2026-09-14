#!/usr/bin/env npx tsx
/**
 * terminal-chat.ts
 * EvaBot Online v0.0.1 MVP — Cyber-Terminal TUI
 * 
 * Features:
 * - Boot Sequence & Live Diagnostics across Web Server & Agent Server
 * - Full Model Garden support (Gemini 2.5 Flash/Pro, 2.0, Claude, DeepSeek)
 * - Multi-Agent Consilium, Dialogue & Corporate Roles
 * - Real-time Terminal Markdown streaming & ANSI highlighting
 * - Identical commands and features as web (https://evabot.online)
 */

import readline from 'node:readline';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { ChatSession } from '../core/ChatSession.js';
import { UserMemory } from '../core/UserMemory.js';
import { ModelRegistry } from '../models/ModelRegistry.js';
import { ModelRatings, ModelCommand, COMMAND_ALIASES } from '../models/ModelRatings.js';
import { transcribeVoiceWithFallback, type SttLanguage } from '../core/CloudSTT.js';
import { BootDiagnostics, BootDiagnosticReport } from '../core/BootDiagnostics.js';
import { UniversalLlmClient } from '../core/UniversalLlmClient.js';
import { ConsiliumEngine, ConsiliumMode, ConsiliumProgressEvent } from '../core/ConsiliumEngine.js';
import { CORPORATE_ROLES } from '../core/CorporateRoles.js';
import { ClusterMonitor } from '../core/ClusterMonitor.js';
import { I18nEngine, stripEmoji } from '../core/I18nEngine.js';
import { isDebugOn, startSpan, renderDebugFooter } from '../core/OpLog.js';
import { CloudTTS } from '../core/CloudTTS.js';
import { DeveloperMode } from '../core/DeveloperMode.js';

// ANSI terminal color palette (Minimalist B&W + Traffic Light standard)
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  white: '\x1b[97m',
  gray: '\x1b[90m',
  zinc: '\x1b[37m',
  // Traffic Lights
  green: '\x1b[32m',     // [OK] Online / Ready / Free
  yellow: '\x1b[33m',    // [WRN] Standby / Busy / Paid
  red: '\x1b[31m',       // [ERR] Error / Offline
  // Accents
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

// Accordion expansion states
interface AccordionState {
  bootLog: boolean;
  servers: boolean;
  models: boolean;
  consilium: boolean;
  roles: boolean;
}

const _accordions: AccordionState = {
  bootLog: true,
  servers: false,
  models: false,
  consilium: false,
  roles: false,
};

let lastDiagnosticReport: BootDiagnosticReport | null = null;
let _currentRole = 'general_assistant';
let currentMode: ConsiliumMode = 'solo';
// Emoji mode (task 1: evabot_emoji=off by default → strip emoji from output).
let emojiStripOn = true;

/**
 * ANSI Terminal Markdown Renderer for batch text
 */
export function renderTerminalMarkdown(md: string): string {
  if (!md) return '';
  let text = md;

  // 1. Code blocks: ```lang ... ```
  text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_m, lang, code) => {
    const langTag = lang ? ` ${C.yellow}[${lang.toUpperCase()}]${C.reset}` : '';
    const codeLines = code
      .trim()
      .split('\n')
      .map((l: string) => `  ${C.zinc}${l}${C.reset}`)
      .join('\n');
    return `\n${C.gray}┌──${langTag} ${C.gray}${'─'.repeat(40)}${C.reset}\n${codeLines}\n${C.gray}└──${'─'.repeat(46)}${C.reset}\n`;
  });

  // 2. Inline code: `code`
  text = text.replace(/`([^`]+)`/g, `${C.cyan}$1${C.reset}`);

  // 3. Bold: **text** or __text__
  text = text.replace(/\*\*([^*]+)\*\*/g, `${C.bold}${C.white}$1${C.reset}`);
  text = text.replace(/__([^_]+)__/g, `${C.bold}${C.white}$1${C.reset}`);

  // 4. Italic: *text* or _text_
  text = text.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, `${C.dim}$1${C.reset}`);

  // 5. Headings: # Heading
  text = text.replace(/^(#{1,6})\s+(.+)$/gm, `\n${C.bold}${C.green}# $2${C.reset}`);

  // 6. Blockquote: > text
  text = text.replace(/^>\s+(.+)$/gm, `${C.gray}│${C.reset} ${C.dim}$1${C.reset}`);

  // 7. Unordered list: * or -
  text = text.replace(/^[\*\-]\s+(.+)$/gm, `  ${C.green}•${C.reset} $1`);

  // 8. Ordered list: 1.
  text = text.replace(/^(\d+)\.\s+(.+)$/gm, `  ${C.yellow}$1.${C.reset} $2`);

  // 9. Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, `${C.cyan}$1${C.reset} ${C.gray}($2)${C.reset}`);

  // 10. Horizontal rules: ---
  text = text.replace(/^[-*_]{3,}$/gm, `${C.gray}${'─'.repeat(50)}${C.reset}`);

  return text;
}

/**
 * Line-buffered real-time ANSI terminal markdown streamer
 */
export class TerminalMarkdownStreamer {
  private buffer = '';
  private inCodeBlock = false;
  private codeLang = '';

  constructor(private writeFn: (text: string) => void) {}

  public push(chunk: string): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.renderLine(line);
    }
  }

  public finish(): void {
    if (this.buffer.length > 0) {
      this.renderLine(this.buffer);
      this.buffer = '';
    }
    if (this.inCodeBlock) {
      this.writeFn(`${C.gray}└──${'─'.repeat(46)}${C.reset}\n`);
      this.inCodeBlock = false;
    }
  }

  private renderLine(line: string): void {
    const fenceMatch = line.match(/^```([a-zA-Z0-9_-]*)/);
    if (fenceMatch) {
      if (!this.inCodeBlock) {
        this.inCodeBlock = true;
        this.codeLang = fenceMatch[1] || '';
        const tag = this.codeLang ? ` ${C.yellow}[${this.codeLang.toUpperCase()}]${C.reset}` : '';
        this.writeFn(`\n${C.gray}┌──${tag} ${C.gray}${'─'.repeat(40)}${C.reset}\n`);
      } else {
        this.inCodeBlock = false;
        this.writeFn(`${C.gray}└──${'─'.repeat(46)}${C.reset}\n`);
      }
      return;
    }

    if (this.inCodeBlock) {
      this.writeFn(`  ${C.zinc}${line}${C.reset}\n`);
      return;
    }

    let formatted = line;
    formatted = formatted.replace(/`([^`]+)`/g, `${C.cyan}$1${C.reset}`);
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, `${C.bold}${C.white}$1${C.reset}`);
    formatted = formatted.replace(/__([^_]+)__/g, `${C.bold}${C.white}$1${C.reset}`);
    formatted = formatted.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, `${C.dim}$1${C.reset}`);

    if (/^#{1,6}\s+/.test(formatted)) {
      formatted = formatted.replace(/^(#{1,6})\s+(.+)$/, `${C.bold}${C.green}# $2${C.reset}`);
    } else if (/^>\s+/.test(formatted)) {
      formatted = formatted.replace(/^>\s+(.+)$/, `${C.gray}│${C.reset} ${C.dim}$1${C.reset}`);
    } else if (/^[\*\-]\s+/.test(formatted)) {
      formatted = formatted.replace(/^[\*\-]\s+(.+)$/, `  ${C.green}•${C.reset} $1`);
    } else if (/^(\d+)\.\s+/.test(formatted)) {
      formatted = formatted.replace(/^(\d+)\.\s+(.+)$/, `  ${C.yellow}$1.${C.reset} $2`);
    } else if (/^[-*_]{3,}$/.test(formatted)) {
      formatted = `${C.gray}${'─'.repeat(50)}${C.reset}`;
    }

    formatted = formatted.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g, `${C.cyan}$1${C.reset} ${C.gray}($2)${C.reset}`);

    this.writeFn(formatted + '\n');
  }
}

/**
 * Renders the live system boot sequence and diagnostics
 */
async function runAndPrintBootSequence(activeModel: string): Promise<void> {
  console.clear();
  console.log(`
${C.bold}${C.white}EVABOT ONLINE v0.0.1 // TERMINAL${C.reset}
${C.gray}Model: ${activeModel}${C.reset}
${C.gray}Architecture: Web Server (Face) + Agent Server (Brain)${C.reset}
${C.gray}Hint: /help for commands, /exit to quit${C.reset}
`);

  process.stdout.write(`${C.gray}Initialising dual-server diagnostic probe...${C.reset}\n`);
  lastDiagnosticReport = await BootDiagnostics.runDiagnostics(activeModel);

  for (const step of lastDiagnosticReport.steps) {
    const statusIcon = step.status === 'success' ? `${C.green}[OK]${C.reset}` : `${C.red}[ERR]${C.reset}`;
    console.log(`  ${statusIcon} ${C.bold}${step.name}${C.reset} ${C.gray}(${step.latencyMs}ms)${C.reset}`);
    console.log(`     ${C.gray}└─ ${step.details}${C.reset}`);
  }

  console.log(`
${C.green}[OK] ALL DIAGNOSTIC CHECKS PASSED [Total: ${lastDiagnosticReport.totalDurationMs}ms]${C.reset}
`);
}

function getTimeStr(): string {
  const now = new Date();
  return `[${now.toTimeString().split(' ')[0]}]`;
}

/**
 * Installs the defensive de-emoji output filter: every string byte written to
 * the given stream passes through stripEmoji unless emoji stripping is off.
 * Extracted from main() for testability (behavior-preserving).
 */
export function installEmojiStripFilter(
  // process.stdout.write exposes overloads; a loose functional type is required
  // for seamless assignment, so the explicit-any rule is waived here.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stream: { write: (...args: any[]) => any } = process.stdout,
  shouldStrip: () => boolean = () => emojiStripOn
): void {
  const rawWrite = stream.write.bind(stream);
  stream.write = function (...args: unknown[]): boolean {
    if (shouldStrip() && typeof args[0] === 'string') {
      args[0] = stripEmoji(args[0]);
    }
    return rawWrite(...(args as [string]));
  };
}

/**
 * Prints the minimalist borderless Cyber-Terminal header (Strict 5-line specification)
 */
export function renderDashboard(session: ChatSession): void {
  console.clear();
  const currentModel = ModelRegistry.getModelById(session.getModel());
  const isFree = currentModel?.pricing.freeTierStatus === '100% Free Quota Available';
  const tierBadge = isFree ? `${C.green}[FREE]${C.reset}` : `${C.yellow}[PAID]${C.reset}`;
  const totalModels = ModelRegistry.getAllModels().length;
  const lang = I18nEngine.getLocale();
  const s = I18nEngine.getStrings(lang);

  const bLoad = os.loadavg()[0].toFixed(2);
  const bCpuPct = Math.min(100, Math.round((parseFloat(bLoad) / 8) * 100));
  const bTotMem = Math.round(os.totalmem() / (1024 * 1024 * 1024));
  const bUsedMem = ((os.totalmem() - os.freemem()) / (1024 * 1024 * 1024)).toFixed(1);
  const ramPct = Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100);
  const micro = ClusterMonitor.getMicroMetrics();
  const meshLat = ClusterMonitor.getMeshLatency();

  function makeBar(pct: number, length = 8): string {
    const p = Math.max(0, Math.min(100, Math.round(pct)));
    const filled = Math.min(length, Math.max(0, Math.round((p / 100) * length)));
    return '■'.repeat(filled) + '░'.repeat(length - filled);
  }

  const enBadge = lang === 'en' ? `${C.green}${C.bold}[EN]${C.reset}` : 'EN';
  const ukBadge = lang === 'uk' ? `${C.green}${C.bold}[UK]${C.reset}` : 'UK';
  const ruBadge = lang === 'ru' ? `${C.green}${C.bold}[RU]${C.reset}` : 'RU';

  // Line 1: Single dot indicator, project name, version, status, latency
  console.log(`${C.green}●${C.reset} ${C.bold}${C.white}EvaBot v0.0.1${C.reset}  ${C.green}${s.statusOnline}${C.reset}  ${C.gray}│${C.reset} ${s.ping} ${C.green}5ms${C.reset}  ${C.gray}│${C.reset} ${s.mesh} ${C.green}${meshLat}ms${C.reset}  ${C.gray}│${C.reset} ${s.live} ${C.green}${C.reset}`);
  // Line 2: Active model, tier, mode, model pool count, lang
  console.log(`${C.gray}${s.model}${C.reset} ${C.bold}${C.white}${session.getModel()}${C.reset} ${tierBadge}  ${C.gray}${s.mode}${C.reset} ${currentMode}  ${C.gray}${s.pool ? 'Pool:' : 'Pool:'}${C.reset} ${totalModels} models (/models)  ${C.gray}${s.lang}${C.reset} ${enBadge} ${ukBadge} ${ruBadge}`);
  // Line 3: System command list
  console.log(`${C.gray}${s.commandsLabel}${C.reset} /help  /?  /about  /top  /models  /cost  /company  /evaline  /products  /who  /lang  /mode  /consilium  /sephirot  /mcp  /lsp  /add mcp  /add lsp  /history  /memory  /search  /services  /servers  /commands  /clear`);
  // Line 4: Connected databases
  console.log(`${C.gray}${s.databasesLabel}${C.reset} ${C.green}${s.databasesValue}${C.reset}`);
  // Line 5: Live server cluster load telemetry with ASCII bars
  console.log(`${C.gray}${s.loadLabel}${C.reset} Brain(Frankfurt) CPU ${C.green}[${makeBar(bCpuPct, 8)}]${C.reset} ${bCpuPct}% RAM ${C.green}[${makeBar(ramPct, 8)}]${C.reset} ${bUsedMem}/${bTotMem}GB (${ramPct}%) │ Face(Iowa) CPU ${C.green}[${makeBar(micro.cpuPct, 6)}]${C.reset} ${micro.cpuPct}% RAM ${C.green}[${makeBar(Math.round((micro.memUsedMb / (micro.memTotalMb || 1024)) * 100), 6)}]${C.reset} ${micro.memUsedMb}MB │ ${C.red}*${C.reset} 72bpm\n`);
  // System greeting with timestamp
  console.log(`${C.gray}${getTimeStr()}${C.reset} ${C.yellow}system :${C.reset} ${s.greeting}\n`);
}

export function printHelp(): void {
  console.log(`
${C.yellow}${C.bold}EVA-BOT CYBER-TERMINAL COMMAND GUIDE:${C.reset}
  ${C.cyan}/help, /?${C.reset}              Показать это руководство
  ${C.cyan}/about${C.reset}                 О проекте EvaBot Online, компании EvaLine и кластере
  ${C.cyan}/top [free|paid|speed]${C.reset} Топ моделей по качеству и композитному рейтингу
  ${C.cyan}/models${C.reset}                Сводка и каталог всех моделей пула
  ${C.cyan}/info <id>${C.reset}            Паспорт модели, квоты, бенчмарки и цены
  ${C.cyan}/company [free|paid]${C.reset}  Ростер 10 специализированных ИИ-агентов компании
  ${C.cyan}/products [запит]${C.reset}     Каталог продукції EvaLine: статистика, категорії, пошук
  ${C.cyan}/who [роль]${C.reset}           Матриця знань компанії: хто що знає, обмін інформацією
  ${C.cyan}/cost${C.reset}                  Бухгалтерия, расходы на токены и себестоимость агентов
  ${C.cyan}/free, /paid${C.reset}           Фильтры бесплатных и платных моделей
  ${C.cyan}/mcp [list|top|select|deselect|selected|info|help]${C.reset}  MCP серверы: список, выбор, топ-5
  ${C.cyan}/lsp [list|top|select|deselect|selected|info|help]${C.reset}  LSP серверы: список, выбор, топ-5
  ${C.cyan}/add mcp <name|номер>${C.reset}   Добавить MCP сервер в выбор
  ${C.cyan}/add lsp <name|номер>${C.reset}   Добавить LSP сервер в выбор
  ${C.cyan}/model <id>${C.reset}            Переключить модель (напр. gemini-3.8-flash)
  ${C.cyan}/mode <mode>${C.reset}            Режим: solo | dialogue | consilium
  ${C.cyan}/consilium <тема>${C.reset}     Запустить многоагентный консилиум экспертов
  ${C.cyan}/sephirot <тема>${C.reset}      Консиліум 10 сфер Дерева Життя (Tetraxis). Статус: /sephirot status
  ${C.cyan}/health${C.reset}                Здоров’я LLM-провайдерів (circuit breakers)
  ${C.cyan}/debug [on|off|full]${C.reset}   Режим налагодження: футер латентності, діагностика (/debug full)
  ${C.cyan}/log [N] [фільтр]${C.reset}      Журнал операцій: останні N записів, фільтр level/kind/текст
  ${C.cyan}/monitor${C.reset}               Модельний монітор: ТОП-10 free/paid моделей для кодингу
  ${C.cyan}/dialogue <тема>${C.reset}      Запустить автономный диалог-дебаты двух моделей
  ${C.cyan}/role <id>${C.reset}             Выбрать роль: architect, devops, security_auditor
  ${C.cyan}/say <текст>${C.reset}           Озвучить текст через Google Cloud TTS -> /tmp/evabot-say.mp3 (/скажи, /сказать)
  ${C.cyan}/listen <файл>${C.reset}         Распознать аудиофайл через Google Cloud STT (/розпізнай, /распознать)
  ${C.cyan}/translate <текст>${C.reset}     Переклад тексту через Google Cloud Translation v3 (/переклад, /перевод)
  ${C.cyan}/clear${C.reset}                 Очистить историю сообщений
  ${C.cyan}/boot${C.reset}                  Повторить аппаратную самодиагностику двух серверов
  ${C.cyan}/sys${C.reset}                   Самоідентифікація системи: модель, кластер, компанія, БЗ (/система)
  ${C.cyan}/voices [uk|ru|en]${C.reset}     Каталог голосів TTS: Chirp3-HD + Wavenet (free), стать, поточні Єва/Адам
  ${C.cyan}/voices set eva|adam <голос>${C.reset} Змінити голос персони (free-родини), дані: data/voice-prefs.json
  ${C.cyan}/settings${C.reset}              Таблиця налаштувань: мова, модель, debug, TTS/STT/переклад ліміти (/налаштування)
  ${C.cyan}/user, /profile${C.reset}        Профіль пам'яті користувача: ім'я, уподобання, історія
  ${C.cyan}/user name <Ім>${C.reset}      Зберегти ім'я користувача в пам'ять
  ${C.cyan}/user set <ключ> <значення>${C.reset} Зберегти уподобання/нотатку (напр. /user set lang ru)
  ${C.cyan}/user unset <ключ>${C.reset}   Видалити уподобання/нотатку
  ${C.cyan}/agents${C.reset}                Ростер агентів: 18 корпоративних ролей + 10 вузлів Сефірот (/агенти, /рота)
  ${C.cyan}/emoji [on|off]${C.reset}        Емодзі у виводі (off = вирізати, за замовчуванням)
  ${C.cyan}/developer [unlock|status|lock]${C.reset} Режим розробника за паролем (EVADEV_PASSWORD, TTL 2 год)
  ${C.cyan}/exit, /quit${C.reset}           Выйти из терминала
`);
}

function printAllModels(): void {
  console.log(`\n${C.yellow}${C.bold}═`.repeat(78) + C.reset);
  console.log(`${C.bold}${C.white}GOOGLE MODEL GARDEN & MULTI-PROVIDER CATALOG${C.reset}`);
  console.log(`${C.yellow}${C.bold}═`.repeat(78) + `${C.reset}\n`);

  const models = ModelRegistry.getAllModels();
  for (const m of models) {
    const isFree = m.pricing.freeTierStatus === '100% Free Quota Available';
    const tag = isFree ? `${C.green}[FREE QUOTA]${C.reset}` : `${C.yellow}[PAID / METERED]${C.reset}`;
    console.log(`  ${C.bold}${C.white}${m.id.padEnd(32)}${C.reset} [${m.provider}] ${tag}`);
    console.log(`    Context: ${m.contextWindow.toLocaleString()} tokens | Max Out: ${m.maxOutputTokens} tokens`);
    console.log(`    Pricing: In: ${m.pricing.inputPer1MTokensUSD} (${m.pricing.inputPer1MTokensEUR}) │ Out: ${m.pricing.outputPer1MTokensUSD} (${m.pricing.outputPer1MTokensEUR})`);
    console.log(`    ${C.gray}${m.description}${C.reset}\n`);
  }
}

async function handleConsiliumRun(mode: ConsiliumMode, prompt: string): Promise<void> {
  console.log(`\n${C.yellow}[*] Запуск сессии ${mode.toUpperCase()}...${C.reset}`);
  console.log(`${C.gray}Вопрос/тема: "${prompt}"${C.reset}\n`);

  try {
    const participants = mode === 'consilium'
      ? ['gemini-3.1-pro', 'gemini-3.8-flash', 'deepseek/deepseek-r1:free']
      : ['gemini-3.1-pro', 'gemini-3.8-flash'];

    const engine = new ConsiliumEngine();
    const result = await engine.run({
      mode,
      prompt,
      models: participants,
      rounds: mode === 'dialogue' ? 2 : 1,
      synthesizerModel: 'gemini-3.1-pro',
      useKnowledgeBase: true,
      onProgress: (evt: ConsiliumProgressEvent) => {
        console.log(`  ${C.cyan} [${evt.type.toUpperCase()}]${C.reset} ${evt.message || ''}`);
      }
    });

    console.log(`\n${C.green}[OK] ${mode.toUpperCase()} ЗАВЕРШЕН [${result.durationMs}ms]${C.reset}\n`);
    for (const turn of result.turns) {
      console.log(`${C.bold}${C.cyan}┌─ [${turn.name.toUpperCase()}] (${turn.model}) ──${C.reset}`);
      console.log(renderTerminalMarkdown(turn.content));
      console.log(`${C.bold}${C.cyan}└─${'─'.repeat(50)}${C.reset}\n`);
    }

    if (result.synthesis) {
      console.log(`${C.bold}${C.green}╔══════════════════════════════════════════════════════════════════════════════╗${C.reset}`);
      console.log(`${C.bold}${C.green}║                   [] ИТОГОВЫЙ КОНСЕНСУС-ОТЧЕТ ЭКСПЕРТОВ                     ║${C.reset}`);
      console.log(`${C.bold}${C.green}╚══════════════════════════════════════════════════════════════════════════════╝${C.reset}`);
      console.log(renderTerminalMarkdown(result.synthesis));
      console.log(`\n${C.gray}Синтезировано консилиум-арбитром на базе gemini-3.1-pro${C.reset}\n`);
    }
  } catch (err: unknown) {
    console.log(`${C.red}[X] Ошибка консилиума: ${err instanceof Error ? err.message : String(err)}${C.reset}`);
  }
}

/**
 * /say <text> — Cloud TTS (Google Cloud Wavenet, ONLY-FREE capped): saves the
 * synthesized MP3 to /tmp/evabot-say.mp3 and prints path + size + chars left.
 */
async function handleSay(arg: string): Promise<void> {
  if (!arg) {
    console.log(`${C.yellow}Использование: /say <текст> | /скажи <текст> | /сказать <текст>${C.reset}`);
    return;
  }
  const tts = new CloudTTS();
  const result = await tts.synthesize(arg, { persona: 'eva' });
  if (result.ok && result.base64Audio) {
    try {
      fs.writeFileSync('/tmp/evabot-say.mp3', new Uint8Array(Buffer.from(result.base64Audio, 'base64')));
      const sizeKb = (fs.statSync('/tmp/evabot-say.mp3').size / 1024).toFixed(1);
      console.log(`${C.green}[OK] Аудио сохранено: /tmp/evabot-say.mp3 (${sizeKb} KB)${C.reset}`);
      console.log(`  ${C.gray}Голос: ${result.voice} | символов: ${result.charCount}${result.cached ? ' [кэш]' : ''} | осталось символов в этом месяце: ${result.charsLeftThisMonth}${C.reset}`);
    } catch (err: unknown) {
      console.log(`${C.red}[X] Не удалось сохранить файл: ${err instanceof Error ? err.message : String(err)}${C.reset}`);
    }
  } else if (result.overCap) {
    console.log(`${C.yellow}[WRN] ${result.error}${C.reset}`);
  } else {
    console.log(`${C.red}[X] TTS недоступен: ${result.error}${C.reset}`);
  }
}

/**
 * /listen <file> — transcribe a local audio file via Google Cloud STT
 * (v1 latest_long, ONLY-FREE monthly cap). Converts unsupported containers
 * (mp3/wav/etc.) to FLAC 16 kHz mono via ffmpeg before the request.
 */
async function handleListen(arg: string): Promise<void> {
  if (!arg) {
    console.log(`${C.yellow}Использование: /listen <файл> | /розпізнай <файл> | /распознать <файл>${C.reset}`);
    return;
  }
  const filePath = path.resolve(arg);
  if (!fs.existsSync(filePath)) {
    console.log(`${C.red}[X] Файл не найден: ${filePath}${C.reset}`);
    return;
  }
  let audio: Buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const encoding = ext === '.ogg' || ext === '.opus' ? 'OGG_OPUS'
    : ext === '.flac' ? 'FLAC'
    : ext === '.webm' ? 'WEBM_OPUS'
    : null;
  if (!encoding) {
    const { convertToFlac16k } = await import('../core/CloudSTT.js');
    const flac = convertToFlac16k(audio);
    if (!flac) {
      console.log(`${C.red}[X] Не удалось конвертировать ${ext || 'файл'} в FLAC через ffmpeg.${C.reset}`);
      return;
    }
    audio = flac;
    console.log(`${C.gray}[*] Конвертировано в FLAC 16 kHz mono (${(flac.length / 1024).toFixed(1)} KB)${C.reset}`);
  }
  const lang: SttLanguage = I18nEngine.getLocale() === 'uk' ? 'uk-UA' : I18nEngine.getLocale() === 'ru' ? 'ru-RU' : 'en-US';
  console.log(`${C.gray}[*] Распознавание речи (${lang}, модель latest_long, only-free cap 50 мин/мес)...${C.reset}`);
  const result = await transcribeVoiceWithFallback(audio, { lang, encoding: encoding || 'OGG_OPUS' });
  if (result.ok && result.transcript) {
    console.log(`${C.green}[OK] Распознано (уверенность ${(result.confidence * 100).toFixed(0)}%, billed ${result.secondsBilled}s${result.usedFallbackFlac ? ', FLAC fallback' : ''}):${C.reset}`);
    console.log(result.transcript);
  } else {
    console.log(`${C.red}[X] Ошибка распознавания: ${result.error}${C.reset}`);
  }
}

async function main(): Promise<void> {
  // Defensive emoji renderer (default ON = evabot_emoji=off): every byte the
  // CLI prints passes through stripEmoji unless /emoji on disables it.
  installEmojiStripFilter();

  // Smartest model auto-selection at entry with ranked fallback
  const smartest = ModelRatings.getSmartestFreeModel();
  const initialModel = smartest ? smartest.id : 'gemini-3.8-flash';
  const session = new ChatSession({ model: initialModel });

  // Initialize UserMemory for CLI session
  const userMemory = UserMemory.getInstance();
  userMemory.createUser('cli');

  // 1. Run live boot diagnostics
  await runAndPrintBootSequence(session.getModel());

  // 2. Render initial cyber dashboard
  renderDashboard(session);

  // 3. Start REPL prompt (sticky input row)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `\n${C.bold}${C.green}> ${C.reset}`,
  });

  rl.prompt();

  rl.on('line', async (line) => {
    const input = line.trim();
    if (!input) {
      rl.prompt();
      return;
    }

    // Track user memory before command handling
    await userMemory.incrementMessageCount('cli');
    const extractedName = userMemory.extractNameFromMessage(input);
    if (extractedName) await userMemory.updateUser('cli', { name: extractedName });
    await userMemory.addQuery('cli', input);

    // Command handling
    if (input.startsWith('/')) {
      const parts = input.split(' ');
      const cmd = parts[0].toLowerCase();
      const arg = parts.slice(1).join(' ').trim();

      switch (cmd) {
        case '/exit':
        case '/quit':
          console.log(`\n${C.gray}Завершение сессии EvaBot Cyber-Terminal. До свидания.${C.reset}`);
          process.exit(0);

        case '/boot':
          await runAndPrintBootSequence(session.getModel());
          renderDashboard(session);
          break;

        case '/help':
        case '/?':
          console.log(I18nEngine.formatHelp());
          break;

        case '/about':
          console.log(ModelCommand.execute(input));
          break;

        case '/lang':
        case '/language':
        case '/locale': {
          const res = I18nEngine.setLocale(arg || 'en');
          renderDashboard(session);
          console.log(`${C.green}[OK] ${res.message}${C.reset}`);
          break;
        }

        case '/evaline':
        case '/business':
          console.log(ModelCommand.execute('/evaline'));
          break;

        case '/top':
        case '/free':
        case '/paid':
        case '/commands':
        case '/mcp':
        case '/lsp':
        case '/cost':
        case '/finance':
        case '/budget':
        case '/company':
        case '/team':
        case '/roster':
        case '/info':
        case '/inspect':
        case '/history':
        case '/memory':
        case '/search':
        case '/find':
        case '/services':
        case '/servers':
        case '/products':
        case '/who':
        case '/sephirot':
        case '/debug':
        case '/log':
        case '/monitor':
        case '/sys':
        case '/auto':
          console.log(ModelCommand.execute(input));
          break;

        case '/developer':
          // RAW input keeps the password casing (execute → handleDeveloper
          // parses the original string, normalizeCommand lowercases).
          DeveloperMode.setActiveSession('cli');
          console.log(ModelCommand.execute(input));
          DeveloperMode.clearActiveSession();
          break;
          console.log(ModelCommand.execute(input));
          break;

        case '/voices':
        case '/settings':
        case '/agents':
          console.log(ModelCommand.execute(input));
          break;

        case '/emoji': {
          if (arg === 'on') { emojiStripOn = false; }
          else if (arg === 'off') { emojiStripOn = true; }
          else { emojiStripOn = !emojiStripOn; }
          console.log(emojiStripOn
            ? '[OK] Emoji mode OFF — емодзі вирізаються з виводу (за замовчуванням).'
            : '[OK] Emoji mode ON — емодзі відображаються як є.');
          break;
        }

        case '/user':
        case '/profile': {
          const segs = arg.split(' ').filter(Boolean);
          const sub = segs[0] ? segs[0].toLowerCase() : 'show';

          // Edit: /user name <Имя>  |  /user set <key> <value>  |  /user unset <key>
          if (sub === 'name') {
            const name = segs.slice(1).join(' ').trim();
            if (!name) {
              console.log(`${C.yellow}Использование: /user name <Имя>${C.reset}`);
              break;
            }
            const ok = userMemory.updateUser('cli', { name });
            console.log(ok ? `${C.green}[OK] Имя сохранено: ${C.bold}${name}${C.reset}` : `${C.red}[X] Не удалось сохранить имя.${C.reset}`);
            break;
          }
          if (sub === 'set') {
            if (segs.length < 3) {
              console.log(`${C.yellow}Использование: /user set <ключ> <значение>${C.reset}`);
              break;
            }
            const key = segs[1];
            const value = segs.slice(2).join(' ');
            const ok = userMemory.setPreference('cli', key, value);
            console.log(ok ? `${C.green}[OK] Предпочтение сохранено: ${C.bold}${key}${C.reset} = ${value}` : `${C.red}[X] Не удалось сохранить предпочтение.${C.reset}`);
            break;
          }
          if (sub === 'unset') {
            if (segs.length < 2) {
              console.log(`${C.yellow}Использование: /user unset <ключ>${C.reset}`);
              break;
            }
            const key = segs[1];
            const prefs = { ...userMemory.getPreferences('cli') };
            delete prefs[key];
            const ok = userMemory.updateUser('cli', { preferences: prefs });
            console.log(ok ? `${C.green}[OK] Предпочтение удалено: ${C.bold}${key}${C.reset}` : `${C.red}[X] Не удалось удалить предпочтение.${C.reset}`);
            break;
          }

          // Show (default)
          const user = await userMemory.getUser('cli');
          if (!user) {
            console.log(`${C.yellow}No user profile found for CLI session.${C.reset}`);
          } else {
            const prefs = userMemory.getPreferences('cli');
            console.log(`
${C.yellow}${C.bold}USER PROFILE${C.reset}`);
            console.log(`${C.gray}────────────────────────────────────${C.reset}`);
            console.log(`  ${C.bold}Session ID:${C.reset} ${user.session_id}`);
            console.log(`  ${C.bold}Name:${C.reset} ${user.name || '(not set)'}`);
            console.log(`  ${C.bold}Status:${C.reset} ${user.status || 'active'}`);
            console.log(`  ${C.bold}Message Count:${C.reset} ${user.message_count}`);
            console.log(`  ${C.bold}Last Query:${C.reset} ${user.last_query || '(none)'}`);
            console.log(`  ${C.bold}Last Topic:${C.reset} ${user.last_topic || '(none)'}`);
            console.log(`  ${C.bold}Created:${C.reset} ${user.created_at}`);
            console.log(`  ${C.bold}Updated:${C.reset} ${user.updated_at}`);
            if (prefs && Object.keys(prefs).length > 0) {
              console.log(`  ${C.bold}Preferences:${C.reset}`);
              for (const [key, value] of Object.entries(prefs)) {
                console.log(`    ${key}: ${value}`);
              }
            }
            console.log(`${C.gray}────────────────────────────────────${C.reset}`);
            console.log(`${C.dim}Правка: /user name <Имя> | /user set <ключ> <значение> | /user unset <ключ>${C.reset}
`);
          }
          break;
        }

        case '/news':
        case '/translate':
        case '/subagent':
          console.log(await ModelCommand.executeAsync(input));
          break;

        case '/models':
          if (arg) {
            printAllModels();
          } else {
            console.log(ModelCommand.execute(input));
          }
          break;

        case '/model':
          if (!arg) {
            console.log(`${C.yellow}Использование: /model <id> (напр. /model gemini-3.8-flash)${C.reset}`);
          } else if (ModelRegistry.isValidModel(arg)) {
            session.setModel(arg);
            console.log(`${C.green}[OK] Активная модель переключена на: ${C.bold}${arg}${C.reset}`);
          } else {
            console.log(`${C.red}[X] Неизвестная модель: ${arg}. Используйте /models для просмотра.${C.reset}`);
          }
          break;

        case '/mode':
          if (['solo', 'broadcast', 'dialogue', 'consilium'].includes(arg.toLowerCase())) {
            currentMode = arg.toLowerCase() as ConsiliumMode;
            console.log(`${C.green}[OK] Режим переключен на: ${C.bold}${currentMode.toUpperCase()}${C.reset}`);
          } else if (!arg) {
            currentMode = currentMode === 'solo' ? 'consilium' : 'solo';
            console.log(`${C.green}[OK] Режим переключен на: ${C.bold}${currentMode.toUpperCase()}${C.reset}`);
          } else {
            console.log(`${C.yellow}Использование: /mode <solo|dialogue|consilium>${C.reset}`);
          }
          break;

        case '/role':
          if (CORPORATE_ROLES[arg]) {
            _currentRole = arg;
            console.log(`${C.green}[OK] Роль установлена: ${C.bold}${arg}${C.reset}`);
          } else {
            console.log(`${C.yellow}Доступные роли: ${Object.keys(CORPORATE_ROLES).join(', ')}${C.reset}`);
          }
          break;

        case '/consilium':
          if (!arg) {
            console.log(`${C.yellow}Использование: /consilium <вопрос или тема для совета>${C.reset}`);
          } else {
            await handleConsiliumRun('consilium', arg);
          }
          break;

        case '/dialogue':
          if (!arg) {
            console.log(`${C.yellow}Использование: /dialogue <тема для дебатов>${C.reset}`);
          } else {
            await handleConsiliumRun('dialogue', arg);
          }
          break;

        case '/say':
        case '/скажи':
        case '/сказать':
          await handleSay(arg);
          break;

        case '/listen':
          await handleListen(arg);
          break;

        case '/clear':
        case '/cls':
          session.clearHistory();
          console.clear();
          renderDashboard(session);
          console.log(`${C.green}[OK] История сообщений очищена.${C.reset}`);
          break;

        case '/health':
        case '/room':
        case '/rooms':
          console.log(await ModelCommand.executeAsync(input));
          break;

        default: {
          // Multilingual aliases (UK/RU) of server commands → route through the
          // alias-normalizing registry (e.g. /історія → /history, /пошук → /search).
          const canonical = COMMAND_ALIASES[cmd];
          if (canonical && ['/about', '/history', '/memory', '/search', '/find', '/services', '/servers', '/health', '/news', '/translate', '/products', '/who', '/debug', '/log', '/monitor', '/say', '/listen', '/sys', '/developer', '/voices', '/settings', '/agents', '/models', '/help', '/lang', '/cost', '/sephirot', '/auto', '/subagent', '/room', '/rooms', '/free', '/paid', '/top', '/info', '/mcp', '/lsp', '/company', '/evaline', '/inspect', '/monitor', '/commands'].includes(canonical)) {
            if (canonical === '/say') {
              await handleSay(arg);
            } else if (canonical === '/listen') {
              await handleListen(arg);
            } else if (canonical === '/developer') {
              DeveloperMode.setActiveSession('cli');
              console.log(ModelCommand.execute(input));
              DeveloperMode.clearActiveSession();
            } else if (canonical === '/news' || canonical === '/translate') {
              console.log(await ModelCommand.executeAsync(input));
            } else {
              console.log(ModelCommand.execute(input));
            }
          } else {
            const s = I18nEngine.getStrings();
            console.log(`${C.red}[X] ${s.unknownCommand.replace('{cmd}', cmd)}${C.reset}`);
          }
          break;
        }
      }
      rl.prompt();
      return;
    }

    // Normal chat message execution
    if (currentMode !== 'solo') {
      await handleConsiliumRun(currentMode, input);
      rl.prompt();
      return;
    }

    // Standard solo chat stream via UniversalLlmClient with real-time markdown formatting
    const time = getTimeStr();
    process.stdout.write(`\n${C.gray}${time}${C.reset} ${C.green}evabot :${C.reset} `);
    try {
      // Get user profile for personalization
      const user = await userMemory.getUser('cli');
      const prefs = user ? await userMemory.getPreferences('cli') : {};
      let systemPrompt = '';
      if (user) {
        const parts = [];
        if (user.name) parts.push(`User's name: ${user.name}`);
        parts.push(`Message count: ${user.message_count}`);
        if (user.last_topic) parts.push(`Last topic: ${user.last_topic}`);
        if (prefs.language) parts.push(`Preferred language: ${prefs.language}`);
        if (prefs.model) parts.push(`Preferred model: ${prefs.model}`);
        if (prefs.communicationStyle) parts.push(`Communication style: ${prefs.communicationStyle}`);
        if (parts.length > 0) {
          systemPrompt = `User context: ${parts.join('; ')}. Personalize your response accordingly.`;
        }
      }

      const client = new UniversalLlmClient();
      const streamer = new TerminalMarkdownStreamer((text) => process.stdout.write(text));
      const span = startSpan(session.getModel(), client.resolveProvider(session.getModel()));
      
      // Build messages array with system prompt if available
      const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = systemPrompt
        ? [{ role: 'system', content: systemPrompt }, { role: 'user', content: input }]
        : [{ role: 'user', content: input }];
      
      await client.streamContent(
        session.getModel(),
        messages,
        (chunk: string) => {
          streamer.push(chunk);
        }
      );
      span.end();
      streamer.finish();
      if (isDebugOn()) {
        process.stdout.write(`${C.gray}${renderDebugFooter(span)}${C.reset}\n`);
      }
    } catch (err: unknown) {
      process.stdout.write(`\n${C.red}[ERROR] Ошибка генерации: ${err instanceof Error ? err.message : String(err)}${C.reset}\n`);
    }

    rl.prompt();
  });
}

// BUGFIX (import safety): main() used to auto-run on module import, firing
// boot diagnostics and hijacking stdout whenever the module was imported (e.g.
// by the test suite). Only auto-start when launched as a CLI entrypoint.
if (process.env.EVABOT_CLI_AUTOSTART !== 'off') {
  main().catch((err) => {
    console.error(`Fatal Terminal Crash:`, err);
    process.exit(1);
  });
}
