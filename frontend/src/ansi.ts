/**
 * ansi.ts — Browser port of the terminal "AnsiStreamEngine" (src/core/AnsiStreamEngine.ts)
 * plus the exact content builders used by terminal-chat.ts.
 *
 * Purpose: 1:1 parity between the Terminal CLI and the Web UI. Every chat entry,
 * banner, diagnostics line, status bar, catalog table and consilium box below is
 * generated from the SAME ANSI strings the terminal prints, then rendered to HTML
 * via `toHtml()`. Strict financial standard: USD ($) & EUR (€) only.
 */

// ============================================================================
// ANSI Color and Style Codes
// ============================================================================

export const ANSI = {
  reset: '\u001b[0m',
  bold: '\u001b[1m',
  dim: '\u001b[2m',
  italic: '\u001b[3m',
  underline: '\u001b[4m',
  inverse: '\u001b[7m',

  black: '\u001b[30m',
  red: '\u001b[31m',
  green: '\u001b[32m',
  yellow: '\u001b[33m',
  blue: '\u001b[34m',
  magenta: '\u001b[35m',
  cyan: '\u001b[36m',
  white: '\u001b[37m',

  gray: '\u001b[90m',
  brightRed: '\u001b[91m',
  brightGreen: '\u001b[92m',
  brightYellow: '\u001b[93m',
  brightBlue: '\u001b[94m',
  brightMagenta: '\u001b[95m',
  brightCyan: '\u001b[96m',
  brightWhite: '\u001b[97m',

  bgBlack: '\u001b[40m',
  bgRed: '\u001b[41m',
  bgGreen: '\u001b[42m',
  bgYellow: '\u001b[43m',
  bgBlue: '\u001b[44m',
  bgMagenta: '\u001b[45m',
  bgCyan: '\u001b[46m',
  bgWhite: '\u001b[47m',
} as const;

// ============================================================================
// ANSI & String Width Utilities (1:1 parity Terminal / Plain / Web)
// ============================================================================

const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  'g',
);

export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

export function visibleWidth(text: string): number {
  const clean = stripAnsi(text);
  let width = 0;
  for (const char of clean) {
    const code = char.codePointAt(0) || 0;
    if (
      (code >= 0x1f300 && code <= 0x1f9ff) ||
      (code >= 0x2600 && code <= 0x27bf) ||
      (code >= 0x1fa00 && code <= 0x1faff) ||
      (code >= 0x2e80 && code <= 0x9fff)
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

export function padEndVisible(text: string, targetWidth: number, padChar = ' '): string {
  const current = visibleWidth(text);
  if (current >= targetWidth) return text;
  return text + padChar.repeat(targetWidth - current);
}

export function padStartVisible(text: string, targetWidth: number, padChar = ' '): string {
  const current = visibleWidth(text);
  if (current >= targetWidth) return text;
  return padChar.repeat(targetWidth - current) + text;
}

// ============================================================================
// ANSI -> HTML (inline styles), identical hex palette to the terminal engine
// ============================================================================

const HTML_COLOR_MAP: Record<string, string> = {
  '30': 'color:#000000',
  '31': 'color:#ef4444',
  '32': 'color:#22c55e',
  '33': 'color:#eab308',
  '34': 'color:#3b82f6',
  '35': 'color:#a855f7',
  '36': 'color:#06b6d4',
  '37': 'color:#e4e4e7',
  '90': 'color:#71717a',
  '91': 'color:#f87171',
  '92': 'color:#4ade80',
  '93': 'color:#fde047',
  '94': 'color:#60a5fa',
  '95': 'color:#c084fc',
  '96': 'color:#22d3ee',
  '97': 'color:#ffffff',
  '1': 'font-weight:bold',
  '2': 'opacity:0.6',
  '3': 'font-style:italic',
  '4': 'text-decoration:underline',
};

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function toHtml(ansiText: string): string {
  let escaped = escapeHtml(ansiText);

  escaped = escaped.replace(/\u001b\[([0-9;]+)m/g, (_match, p1: string) => {
    if (p1 === '0') {
      return '</span>';
    }
    const codes = p1.split(';');
    const styles: string[] = [];
    for (const code of codes) {
      if (HTML_COLOR_MAP[code]) {
        styles.push(HTML_COLOR_MAP[code]);
      }
    }
    if (styles.length > 0) {
      return `<span style="${styles.join(';')}">`;
    }
    return '';
  });

  return escaped;
}

// ============================================================================
// Badges, Dividers, Headers, Prompts
// ============================================================================

export type TrafficLightStatus = 'green' | 'yellow' | 'red' | 'ok' | 'warn' | 'error' | 'online' | 'standby' | 'offline' | 'free' | 'paid';

export function trafficLightIcon(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
    case 'ok':
    case 'online':
    case 'free':
      return '🟢';
    case 'yellow':
    case 'warn':
    case 'standby':
    case 'paid':
      return '🟡';
    case 'red':
    case 'error':
    case 'offline':
      return '🔴';
    default:
      return '⚪';
  }
}

export function trafficLightColor(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
    case 'ok':
    case 'online':
    case 'free':
      return ANSI.green;
    case 'yellow':
    case 'warn':
    case 'standby':
    case 'paid':
      return ANSI.yellow;
    case 'red':
    case 'error':
    case 'offline':
      return ANSI.red;
    default:
      return ANSI.white;
  }
}

export function statusBadge(status: TrafficLightStatus, customLabel?: string): string {
  const icon = trafficLightIcon(status);
  const color = trafficLightColor(status);
  let label = customLabel;
  if (!label) {
    switch (status) {
      case 'green':
      case 'ok':
      case 'online':
        label = 'ONLINE';
        break;
      case 'yellow':
      case 'warn':
      case 'standby':
        label = 'STANDBY';
        break;
      case 'red':
      case 'error':
      case 'offline':
        label = 'OFFLINE';
        break;
      case 'free':
        label = '100% FREE QUOTA';
        break;
      case 'paid':
        label = 'PAID / METERED';
        break;
      default:
        label = String(status).toUpperCase();
    }
  }
  return `${icon} ${color}${ANSI.bold}[${label}]${ANSI.reset}`;
}

export function badge(text: string, color: string = ANSI.cyan): string {
  return `${ANSI.gray}[${ANSI.reset}${color}${text}${ANSI.reset}${ANSI.gray}]${ANSI.reset}`;
}

export function divider(char = '─', width = 78, color = ANSI.gray): string {
  return `${color}${char.repeat(width)}${ANSI.reset}`;
}

export function sectionHeader(title: string, tag = '', width = 78): string {
  const cleanTitle = ` ${title.toUpperCase()} `;
  const cleanTag = tag ? ` [ ${tag} ] ` : '';
  const remaining = Math.max(4, width - visibleWidth(cleanTitle) - visibleWidth(cleanTag) - 2);
  const left = '──';
  const right = '─'.repeat(remaining);
  return `${ANSI.gray}┌${left}${ANSI.reset}${ANSI.bold}${ANSI.white}${cleanTitle}${ANSI.reset}${cleanTag ? `${ANSI.cyan}${cleanTag}${ANSI.reset}` : ''}${ANSI.gray}${right}┐${ANSI.reset}`;
}

export function sectionFooter(width = 78): string {
  return `${ANSI.gray}└${'─'.repeat(width - 2)}┘${ANSI.reset}`;
}

export function formatBanner(lines: string[], title = 'EVABOT ONLINE v0.0.1 MVP', width = 78): string {
  const contentWidth = width - 4;
  const out: string[] = [`${ANSI.gray}┌${'─'.repeat(width - 2)}┐${ANSI.reset}`];
  out.push(
    `${ANSI.gray}│${ANSI.reset} ${ANSI.bold}${ANSI.brightWhite}${padEndVisible(title, contentWidth - 1)}${ANSI.reset} ${ANSI.gray}│${ANSI.reset}`,
  );
  out.push(`${ANSI.gray}├${'─'.repeat(width - 2)}┤${ANSI.reset}`);
  for (const line of lines) {
    const padded = padEndVisible(line, contentWidth - 1);
    out.push(`${ANSI.gray}│${ANSI.reset} ${padded} ${ANSI.gray}│${ANSI.reset}`);
  }
  out.push(`${ANSI.gray}└${'─'.repeat(width - 2)}┘${ANSI.reset}`);
  return out.join('\n');
}

export function promptSymbol(mode = 'solo'): string {
  switch (mode.toLowerCase()) {
    case 'consilium':
      return `${ANSI.green}👥 ❯${ANSI.reset}`;
    case 'dialogue':
      return `${ANSI.cyan}💬 ❯${ANSI.reset}`;
    case 'broadcast':
      return `${ANSI.yellow}📡 ❯${ANSI.reset}`;
    default:
      return `${ANSI.brightGreen}❯${ANSI.reset}`;
  }
}

export function formatPrompt(options: { model?: string; mode?: string; role?: string }): string {
  const mode = (options.mode || 'solo').toUpperCase();
  const model = options.model ? ` (${options.model})` : '';
  const role = options.role && options.role !== 'general_assistant' ? ` [${options.role}]` : '';
  const symbol = promptSymbol(options.mode);
  return `${ANSI.bold}${ANSI.white}eva${ANSI.reset}${ANSI.gray}${model}${role} ${ANSI.cyan}[${mode}]${ANSI.reset} ${symbol} `;
}

// ============================================================================
// Terminal Table Engine
// ============================================================================

export interface TerminalColumn<T = Record<string, unknown>> {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  maxWidth?: number;
  format?: (value: unknown, row: T) => string;
}

export interface TerminalTableOptions<T = Record<string, unknown>> {
  columns: TerminalColumn<T>[];
  headerColor?: string;
  borderColor?: string;
  padding?: number;
}

export function renderTerminalTable<T extends Record<string, unknown>>(
  rows: T[],
  options: TerminalTableOptions<T>,
): string {
  const {
    columns,
    headerColor = `${ANSI.bold}${ANSI.white}`,
    borderColor = ANSI.gray,
    padding = 1,
  } = options;
  const pad = ' '.repeat(padding);
  const chars = { tl: '┌', tm: '┬', tr: '┐', ml: '├', mm: '┼', mr: '┤', bl: '└', bm: '┴', br: '┘', h: '─', v: '│' };

  const colWidths: number[] = columns.map((col) => {
    let max = visibleWidth(col.header);
    if (col.minWidth) max = Math.max(max, col.minWidth);
    for (const row of rows) {
      const val = col.format ? col.format(row[col.key as string], row) : String(row[col.key as string] ?? '');
      max = Math.max(max, visibleWidth(val));
    }
    if (col.maxWidth) max = Math.min(max, col.maxWidth);
    return max;
  });

  const formatCell = (content: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string => {
    const vWidth = visibleWidth(content);
    if (vWidth >= width) return content;
    const diff = width - vWidth;
    if (align === 'right') return ' '.repeat(diff) + content;
    if (align === 'center') {
      const leftPad = Math.floor(diff / 2);
      return ' '.repeat(leftPad) + content + ' '.repeat(diff - leftPad);
    }
    return content + ' '.repeat(diff);
  };

  const out: string[] = [];
  const topParts = colWidths.map((w) => chars.h.repeat(w + padding * 2));
  out.push(`${borderColor}${chars.tl}${topParts.join(chars.tm)}${chars.tr}${ANSI.reset}`);

  const headerCells = columns.map((col, idx) => {
    const aligned = formatCell(col.header, colWidths[idx], col.align || 'left');
    return `${pad}${headerColor}${aligned}${ANSI.reset}${pad}`;
  });
  out.push(`${borderColor}${chars.v}${ANSI.reset}${headerCells.join(`${borderColor}${chars.v}${ANSI.reset}`)}${borderColor}${chars.v}${ANSI.reset}`);

  const midParts = colWidths.map((w) => chars.h.repeat(w + padding * 2));
  out.push(`${borderColor}${chars.ml}${midParts.join(chars.mm)}${chars.mr}${ANSI.reset}`);

  for (const row of rows) {
    const dataCells = columns.map((col, idx) => {
      const raw = col.format ? col.format(row[col.key as string], row) : String(row[col.key as string] ?? '');
      const aligned = formatCell(raw, colWidths[idx], col.align || 'left');
      return `${pad}${aligned}${pad}`;
    });
    out.push(`${borderColor}${chars.v}${ANSI.reset}${dataCells.join(`${borderColor}${chars.v}${ANSI.reset}`)}${borderColor}${chars.v}${ANSI.reset}`);
  }

  const botParts = colWidths.map((w) => chars.h.repeat(w + padding * 2));
  out.push(`${borderColor}${chars.bl}${botParts.join(chars.bm)}${chars.br}${ANSI.reset}`);

  return out.join('\n');
}

// ============================================================================
// Content builders — EXACT copies of the strings terminal-chat.ts prints
// ============================================================================

export interface TerminalModelSpan {
  id: string;
  provider: string;
  tier: string;
  category?: string;
  contextWindow: number;
  pricing: {
    freeTierStatus: string;
    inputPer1MTokensUSD: string;
    outputPer1MTokensUSD: string;
  };
}

function tierSpan(isFree: boolean): string {
  return isFree ? `${ANSI.green}[FREE]${ANSI.reset}` : `${ANSI.yellow}[PAID]${ANSI.reset}`;
}

function usdPrice(raw: string): string {
  let p = raw;
  if (p.includes('(')) p = p.split('/')[0].trim();
  return p;
}

export function renderBootBanner(): string {
  return (
    `${ANSI.gray}┌${'─'.repeat(78)}┐${ANSI.reset}\n` +
    `${ANSI.gray}│${ANSI.reset} ${ANSI.bold}${ANSI.brightWhite}[>>] EVABOT ONLINE v0.0.1 MVP // LINEAR CYBER-TERMINAL${ANSI.reset}${' '.repeat(26)}${ANSI.gray}│${ANSI.reset}\n` +
    `${ANSI.gray}│${ANSI.reset} ${ANSI.gray}Hybrid Topology: Web Edge Gateway (Face) ◄──► Agent Server (Brain)${ANSI.reset}          ${ANSI.gray}│${ANSI.reset}\n` +
    `${ANSI.gray}│${ANSI.reset} ${ANSI.brightCyan}Base: Chernomorsk, Ukraine (UA) │ Bratislava (EU) │ Zero-Trust Cloud${ANSI.reset}${' '.repeat(9)}${ANSI.gray}│${ANSI.reset}\n` +
    `${ANSI.gray}└${'─'.repeat(78)}┘${ANSI.reset}`
  );
}

export function renderDiagnosticsProbe(): string {
  return `${ANSI.gray}[BOOT DIAGNOSTICS] Probing dual-server infrastructure & model garden...${ANSI.reset}`;
}

export interface DiagnosticStep {
  status: string;
  name: string;
  latencyMs: number;
  details: string;
}

export function renderDiagnostics(steps: DiagnosticStep[]): string {
  const lines: string[] = [];
  for (const step of steps) {
    const icon = step.status === 'success' ? `${ANSI.green}[OK]${ANSI.reset}` : `${ANSI.red}[ERR]${ANSI.reset}`;
    lines.push(`  ${icon} ${ANSI.bold}${step.name}${ANSI.reset} ${ANSI.gray}(${step.latencyMs}ms)${ANSI.reset}`);
    lines.push(`     ${ANSI.gray}└─ ${step.details}${ANSI.reset}`);
  }
  return lines.join('\n');
}

export interface StatusBarOptions {
  model: string;
  isFree: boolean;
  mode: string;
  role: string;
  tokens: number;
  costUSD: number;
  costEUR: number;
  modelCount: number;
}

export function renderStatusBar(opts: StatusBarOptions): string {
  const tierBadge = opts.isFree ? `${ANSI.green}[FREE]${ANSI.reset}` : `${ANSI.yellow}[PAID]${ANSI.reset}`;
  return (
    `${divider('─', 80, ANSI.gray)}\n` +
    `  ${ANSI.bold}${ANSI.white}EVABOT${ANSI.reset} ${ANSI.green}[ONLINE]${ANSI.reset} │ ` +
    `${ANSI.bold}${ANSI.cyan}${opts.model}${ANSI.reset} [${tierBadge}] │ ` +
    `${ANSI.bold}${ANSI.brightYellow}${opts.mode.toUpperCase()}${ANSI.reset} │ ` +
    `${ANSI.bold}${ANSI.white}${opts.role}${ANSI.reset}\n` +
    `  ${ANSI.gray}Session Tokens: ${opts.tokens.toLocaleString()} │ ` +
    `Session Cost: $${opts.costUSD.toFixed(4)} / €${opts.costEUR.toFixed(4)} │ ` +
    `USD ($) & EUR (€) │ ${opts.modelCount} Models │ /help for commands${ANSI.reset}\n` +
    `${divider('─', 80, ANSI.gray)}`
  );
}

export function renderModelsTable(models: TerminalModelSpan[], filterCategory?: string): string {
  const filtered = filterCategory
    ? models.filter(
        (m) =>
          m.category?.toLowerCase().includes(filterCategory.toLowerCase()) ||
          m.provider?.toLowerCase().includes(filterCategory.toLowerCase()),
      )
    : models;

  const rows = filtered.map((m) => ({
    id: m.id,
    provider: m.provider || '-',
    context: `${((m.contextWindow ?? 0) / 1024).toFixed(0)}k`,
    tier: tierSpan(m.pricing?.freeTierStatus === '100% Free Quota Available'),
    inputPrice: usdPrice(m.pricing?.inputPer1MTokensUSD ?? '-'),
    outputPrice: usdPrice(m.pricing?.outputPer1MTokensUSD ?? '-'),
  }));

  return (
    `\n${ANSI.bold}${ANSI.white}MODEL CATALOG — ${filtered.length} of ${models.length} MODELS${ANSI.reset}\n` +
    `${ANSI.gray}USD ($) & EUR (€) only │ Type /model <id> to switch${ANSI.reset}\n\n` +
    renderTerminalTable(rows, {
      columns: [
        { key: 'id', header: 'MODEL ID', minWidth: 28 },
        { key: 'provider', header: 'PROVIDER', minWidth: 16 },
        { key: 'context', header: 'CTX', minWidth: 6, align: 'right' },
        { key: 'tier', header: 'TIER', minWidth: 10 },
        { key: 'inputPrice', header: 'IN / 1M', minWidth: 14 },
        { key: 'outputPrice', header: 'OUT / 1M', minWidth: 14 },
      ],
      borderColor: ANSI.gray,
      headerColor: `${ANSI.bold}${ANSI.brightWhite}`,
    }) +
    `\n\n${ANSI.gray}Use /model <id> to switch to any model above.${ANSI.reset}\n`
  );
}

export interface CompareModelSpan {
  id: string;
  contextWindow: number;
  pricing: { inputPer1MTokensUSD: string; outputPer1MTokensUSD: string };
}

export function renderCompareTable(models: CompareModelSpan[]): string {
  const sweScores: Record<string, string> = {
    'anthropic/claude-opus-5': '96%',
    'anthropic/claude-fable-5': '95%',
    'anthropic/claude-sonnet-5': '85.2%',
    'openai/gpt-6-astra': '—',
    'gemini-3.8-flash': '—',
    'gemini-3.1-pro': '—',
  };
  const terminalScores: Record<string, string> = {
    'openai/gpt-6-astra': '57.7%',
    'anthropic/claude-fable-5.1': '55.8%',
    'gemini-3.8-flash': '19.1%',
  };

  const rows = models.map((m, i) => ({
    rank: `#${i + 1}`,
    id: m.id,
    swe: sweScores[m.id] || '—',
    terminal: terminalScores[m.id] || '—',
    context: `${(m.contextWindow / 1024).toFixed(0)}k`,
    inPrice: usdPrice(m.pricing?.inputPer1MTokensUSD ?? '-'),
    outPrice: usdPrice(m.pricing?.outputPer1MTokensUSD ?? '-'),
  }));

  return (
    `\n${ANSI.bold}${ANSI.white}TOP-10 CODING MODELS — SEPT 2026 LEADERS${ANSI.reset}\n` +
    `${ANSI.gray}USD ($) & EUR (€) pricing │ SWE-bench Verified & Terminal-Bench 4.0 scores${ANSI.reset}\n\n` +
    renderTerminalTable(rows, {
      columns: [
        { key: 'rank', header: '#', minWidth: 3, align: 'right' },
        { key: 'id', header: 'MODEL', minWidth: 30 },
        { key: 'swe', header: 'SWE-bench', minWidth: 10, align: 'right' },
        { key: 'terminal', header: 'Term-Bench', minWidth: 12, align: 'right' },
        { key: 'context', header: 'CTX', minWidth: 6, align: 'right' },
        { key: 'inPrice', header: 'IN / 1M', minWidth: 14 },
        { key: 'outPrice', header: 'OUT / 1M', minWidth: 14 },
      ],
      borderColor: ANSI.gray,
      headerColor: `${ANSI.bold}${ANSI.brightWhite}`,
    }) +
    `\n\n${ANSI.gray}Use /model <id> to switch to any model above.${ANSI.reset}\n`
  );
}

export function renderAbout(): string {
  const lines: string[] = [
    `\n${ANSI.bold}${ANSI.brightCyan}EVA-BOT ONLINE // SYSTEM & CLUSTER PASSPORT${ANSI.reset}`,
    divider('─', 80, ANSI.gray),
    `  ${ANSI.bold}${ANSI.white}Product:${ANSI.reset}       EvaBot Online (v0.0.1 Cyber-Terminal & Multi-Agent Swarm)`,
    `  ${ANSI.bold}${ANSI.white}Gateway:${ANSI.reset}       ${ANSI.cyan}https://evabot.online${ANSI.reset}`,
    `  ${ANSI.bold}${ANSI.white}Company:${ANSI.reset}       EvaLine Group (Chernomorsk, Ukraine & Bratislava, Slovakia)`,
    `  ${ANSI.bold}${ANSI.white}Production:${ANSI.reset}    Premier EVA polymer solutions (car mats, tatami, livestock mats)`,
    `  ${ANSI.bold}${ANSI.white}GCP Project:${ANSI.reset}   ${ANSI.green}evabot-agent-server${ANSI.reset} (#873069440066)`,
    `  ${ANSI.bold}${ANSI.white}Dual Cluster:${ANSI.reset}  Brain: ${ANSI.brightWhite}evabot-agent-vm${ANSI.reset} (Frankfurt, c3-standard-8, 34.159.202.82)`,
    `                 Edge:  ${ANSI.brightWhite}evaline-micro-vm${ANSI.reset} (Iowa, e2-micro, 136.114.26.252, HTTP/3 QUIC)`,
    `  ${ANSI.bold}${ANSI.white}Personas:${ANSI.reset}      Eva (Frontend/UX/Diplomacy) & Adam (Cloud/Backend/Security)`,
    `  ${ANSI.bold}${ANSI.white}Engine Core:${ANSI.reset}   Multi-Agent Consilium, Sephirot Council, 21 MCPs, 4 LSPs, STT/TTS`,
    `  ${ANSI.bold}${ANSI.white}Commands:${ANSI.reset}      /about, /mode, /consilium, /clear, /models, /compare, /boot, /help`,
    divider('─', 80, ANSI.gray),
  ];
  return lines.join('\n');
}

export function renderHelp(): string {
  const commands = [
    { cmd: '/about', desc: 'About EvaBot Online, EvaLine company & cloud architecture' },
    { cmd: '/models [filter]', desc: 'Model catalog with free/paid status & USD/EUR pricing' },
    { cmd: '/compare', desc: 'Top-10 coding models side-by-side with SWE-bench & Terminal-Bench' },
    { cmd: '/model <id>', desc: 'Switch active model' },
    { cmd: '/mode <mode>', desc: 'Switch mode: solo | broadcast | dialogue | consilium' },
    { cmd: '/role <id>', desc: 'Switch role: architect, devops, security_auditor, general_assistant' },
    { cmd: '/dialogue <prompt>', desc: '2-model debate on specified topic' },
    { cmd: '/consilium <prompt>', desc: '3-10 model deliberation with consensus synthesis' },
    { cmd: '/boot', desc: 'Re-run infrastructure diagnostics' },
    { cmd: '/clear', desc: 'Clear session and screen' },
    { cmd: '/help', desc: 'This reference' },
    { cmd: '/exit', desc: 'Terminate session' },
  ];
  const lines: string[] = [`\n${ANSI.bold}${ANSI.white}EVA-BOT CYBER-TERMINAL COMMAND REFERENCE${ANSI.reset}`, divider('─', 80, ANSI.gray)];
  for (const c of commands) {
    lines.push(`  ${ANSI.bold}${ANSI.cyan}${c.cmd.padEnd(22)}${ANSI.reset} ${ANSI.gray}│${ANSI.reset} ${c.desc}`);
  }
  lines.push(`\n${ANSI.brightCyan}Mouse: Click any model row to switch. Click commands in status bar.${ANSI.reset}`);
  lines.push(divider('─', 80, ANSI.gray) + '\n');
  return lines.join('\n');
}

export function chatBoxHeader(model: string): string {
  return `\n${ANSI.gray}┌─ [EVABOT] (${model}) ${'─'.repeat(45)}${ANSI.reset}`;
}

export function chatBoxFooter(): string {
  return `${ANSI.gray}└${'─'.repeat(70)}${ANSI.reset}`;
}

export function renderChatBoxContent(text: string, model = 'EVABOT'): string {
  const lines = text.split('\n');
  const body = lines.map((line) => `${ANSI.gray}│${ANSI.reset} ${line}`).join('\n');
  return `${chatBoxHeader(model)}\n${body}\n${chatBoxFooter()}`;
}

export function renderChatBoxWithCost(text: string, model: string, cost: string, tip?: string): string {
  const out = [renderChatBoxContent(text, model)];
  if (cost) out.push(cost);
  if (tip) out.push(`${ANSI.gray}  ⚡ TIP: ${tip}${ANSI.reset}\n`);
  return out.join('\n');
}

export interface CostLineOptions {
  model: string;
  isFreeTier: boolean;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  formattedUSD: string;
  formattedEUR: string;
  commercialValueUSD?: number;
  commercialValueEUR?: number;
}

export function renderCostLine(opts: CostLineOptions): string {
  const freeBadge = opts.isFreeTier ? `${ANSI.green}[FREE QUOTA]${ANSI.reset}` : `${ANSI.yellow}[PAID]${ANSI.reset}`;
  let out =
    `  ${ANSI.gray}MODEL:${ANSI.reset} ${ANSI.bold}${ANSI.white}${opts.model}${ANSI.reset} ${freeBadge} │ ` +
    `${ANSI.gray}TOKENS:${ANSI.reset} ${ANSI.bold}${ANSI.cyan}${opts.totalTokens.toLocaleString()}${ANSI.reset} (In: ${opts.promptTokens}, Out: ${opts.completionTokens}) │ ` +
    `${ANSI.gray}COST:${ANSI.reset} ${ANSI.bold}${ANSI.green}${opts.formattedUSD}${ANSI.reset} / ${ANSI.bold}${ANSI.green}${opts.formattedEUR}${ANSI.reset}`;
  if (opts.isFreeTier && opts.commercialValueUSD !== undefined) {
    out +=
      `\n  ${ANSI.gray}COMMERCIAL VALUATION:${ANSI.reset} ${ANSI.gray}$${opts.commercialValueUSD.toFixed(6)} USD │ €${opts.commercialValueEUR?.toFixed(6) ?? '0'} EUR${ANSI.reset}`;
  }
  return out + `\n${ANSI.gray}${'─'.repeat(78)}${ANSI.reset}\n`;
}

export interface ConsiliumTurnSpan {
  name: string;
  model: string;
  content: string;
  isFreeTier?: boolean;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  formattedUSD?: string;
  formattedEUR?: string;
}

export function renderConsiliumTurn(turn: ConsiliumTurnSpan): string {
  const freeTag = turn.isFreeTier ? `${ANSI.green}[FREE]${ANSI.reset}` : `${ANSI.yellow}[PAID]${ANSI.reset}`;
  const lines: string[] = [
    `${ANSI.gray}┌─${ANSI.reset} ${ANSI.bold}${ANSI.cyan}[${turn.name.toUpperCase()}]${ANSI.reset} ${ANSI.gray}(${turn.model})${ANSI.reset} ${freeTag} ${'─'.repeat(25)}`,
  ];
  for (const line of turn.content.split('\n')) {
    lines.push(`${ANSI.gray}│${ANSI.reset} ${line}`);
  }
  if (turn.totalTokens !== undefined) {
    lines.push(
      `${ANSI.gray}├─ TOKENS: In: ${turn.promptTokens || 0} + Out: ${turn.completionTokens || 0} = ${turn.totalTokens} │ ` +
        `COST: ${turn.formattedUSD || ''} / ${turn.formattedEUR || ''}${ANSI.reset}`,
    );
  }
  lines.push(`${ANSI.gray}└${'─'.repeat(70)}${ANSI.reset}\n`);
  return lines.join('\n');
}

export function renderConsensusBox(synthesis: string): string {
  const lines: string[] = [
    `${ANSI.gray}┌${'─'.repeat(78)}┐${ANSI.reset}`,
    `${ANSI.gray}│${ANSI.reset} ${ANSI.bold}${ANSI.green}[*] FINAL EXECUTIVE CONSENSUS REPORT${ANSI.reset}${' '.repeat(42)}${ANSI.gray}│${ANSI.reset}`,
    `${ANSI.gray}├${'─'.repeat(78)}┤${ANSI.reset}`,
  ];
  for (const sLine of synthesis.split('\n')) {
    lines.push(`${ANSI.gray}│${ANSI.reset} ${sLine}`);
  }
  lines.push(`${ANSI.gray}└${'─'.repeat(78)}┘${ANSI.reset}`);
  lines.push(`${ANSI.gray}Deliberated by frontier models & synthesized via consensus arbiter.${ANSI.reset}\n`);
  return lines.join('\n');
}

export interface AuditModelSpan {
  model: string;
  tokens: number;
  formattedUSD: string;
  formattedEUR: string;
}

export interface AuditSummarySpan {
  totalTokens: number;
  totalCostUSD: number;
  totalCostEUR: number;
  formattedUSD: string;
  formattedEUR: string;
  models?: AuditModelSpan[];
}

export function renderAuditBox(summary: AuditSummarySpan): string {
  const lines: string[] = [
    `${ANSI.gray}┌${'─'.repeat(78)}┐${ANSI.reset}`,
    `${ANSI.gray}│${ANSI.reset} ${ANSI.bold}${ANSI.white}[AUDIT] CONSILIUM PARTICIPATION & COST SUMMARY${ANSI.reset}${' '.repeat(32)}${ANSI.gray}│${ANSI.reset}`,
    `${ANSI.gray}├${'─'.repeat(78)}┤${ANSI.reset}`,
  ];
  for (const m of summary.models || []) {
    lines.push(
      `${ANSI.gray}│${ANSI.reset}  • ${ANSI.bold}${m.model.padEnd(26)}${ANSI.reset} │ Tokens: ${m.tokens.toLocaleString().padEnd(7)} │ Cost: ${m.formattedUSD} / ${m.formattedEUR}`,
    );
  }
  lines.push(`${ANSI.gray}├${'─'.repeat(78)}┤${ANSI.reset}`);
  lines.push(
    `${ANSI.gray}│${ANSI.reset}  ${ANSI.bold}TOTAL AUDIT:${ANSI.reset} ${summary.totalTokens.toLocaleString()} tokens │ ` +
      `Cost: ${ANSI.bold}${ANSI.green}${summary.formattedUSD} / ${summary.formattedEUR}${ANSI.reset}`,
  );
  lines.push(`${ANSI.gray}└${'─'.repeat(78)}┘${ANSI.reset}\n`);
  return lines.join('\n');
}

export function renderUserLine(prompt: string, text: string): string {
  return `${prompt}${text}`;
}

export function renderError(err: string): string {
  return `\n${ANSI.red}[X] Generation Error: ${err}${ANSI.reset}\n`;
}

export function renderNotice(msg: string): string {
  return `${ANSI.gray}[!] ${msg}${ANSI.reset}`;
}

// ============================================================================
// Onboarding + Developer Mode content builders (universal ANSI)
// ============================================================================

export interface DevModeSpan {
  clientDev: boolean;
  serverDev: boolean;
  authSource: string;
  hasServerKey: boolean;
  modelCount: number;
  version: string;
}

export const ANSI_WHISPER_COMMANDS = ['/dev', '/ansi', '/config', '/onboarding'];

export function renderDevModeBlock(d: DevModeSpan): string {
  const on = `${ANSI.green}[ON]${ANSI.reset}`;
  const off = `${ANSI.red}[OFF]${ANSI.reset}`;
  const cred = d.hasServerKey
    ? `${ANSI.green}[HAS SERVER KEY]${ANSI.reset}`
    : `${ANSI.yellow}[NO KEY — CATALOG / DIAGNOSTICS / VOICE CONFIG STILL WORK]${ANSI.reset}`;
  return (
    `\n${sectionHeader('DEVELOPER MODE // RUNTIME STATUS', 'DEV', 80)}\n` +
    `  ${ANSI.gray}CLIENT DEV MODE:${ANSI.reset} ${d.clientDev ? on : off}  (localStorage \`evabot_dev_mode\`, whisper commands: ${ANSI_WHISPER_COMMANDS.join(' ')})${ANSI.reset}\n` +
    `  ${ANSI.gray}SERVER DEV MODE:${ANSI.reset} ${d.serverDev ? on : off}  (backend runtime toggle: POST /api/config/dev-mode)${ANSI.reset}\n` +
    `  ${ANSI.gray}AUTH SOURCE:${ANSI.reset} ${d.authSource} ${cred}\n` +
    `  ${ANSI.gray}MODEL GARDEN:${ANSI.reset} ${d.modelCount} models │ version: ${d.version}\n` +
    `  ${ANSI.gray}RAW ANSI:${ANSI.reset} ${ANSI.brightCyan}/ansi${ANSI.reset} shows the exact ANSI stream the terminal prints\n` +
    `${divider('─', 80)}`
  );
}

export function renderConfigBlock(cfg: Record<string, any>): string {
  const lines: string[] = [`\n${sectionHeader('BACKEND CONFIG // GET /api/config', 'SYS', 80)}`];
  lines.push(`  ${ANSI.bold}${ANSI.white}${cfg.productName || 'EvaBot Online'}${ANSI.reset} ${ANSI.gray}${cfg.version || ''}${ANSI.reset} │ node: ${cfg.server || '-'}`);
  const loc = cfg.localePolicy as Record<string, any> | undefined;
  lines.push(
    `  ${ANSI.gray}Locale:${ANSI.reset} ${cfg.base || 'Chernomorsk, Ukraine (UA) & Bratislava, Slovakia'} │ ${(loc?.currencies || ['USD', 'EUR']).join(' / ')} │ ${loc?.financialStandard || 'USD ($) & EUR (€) only'}`,
  );
  lines.push(
    `  ${ANSI.gray}Dev Mode (server):${ANSI.reset} ${cfg.devMode ? ANSI.green + '[ON]' + ANSI.reset : ANSI.red + '[OFF]' + ANSI.reset}` +
      ` │ default model: ${cfg.defaultModel || '-'} │ ${cfg.availableModels ?? 0} models`,
  );
  lines.push(
    `  ${ANSI.gray}Voice:${ANSI.reset} ${cfg.voice?.enabled ? 'enabled' : 'disabled'} │ persona: ${cfg.voice?.activePersona || 'auto'}`,
  );
  lines.push(`  ${ANSI.gray}Providers:${ANSI.reset} ${(cfg.supportedProviders || []).join(', ')}`);
  const run = (cfg.dev?.runtime?.env || {}) as Record<string, any>;
  lines.push(
    `  ${ANSI.gray}Dev runtime:${ANSI.reset} GEMINI_API_KEY_SET=${String(run.GEMINI_API_KEY_SET)} │ DEV_MODE=${String(run.DEV_MODE)} │ OMNIROUTE=${run.OMNIROUTE_ENDPOINT || '-'}`,
  );
  lines.push(divider('─', 80));
  return lines.join('\n');
}

export function renderRawAnsiBlock(content: string): string {
  const esc = content.replace(/\u001b/g, '\\x1b');
  const body = esc
    .split('\n')
    .map((l) => `  ${l}`)
    .join('\n');
  return `\n${divider('─', 80)}\n${ANSI.gray}${body}${ANSI.reset}\n${divider('─', 80)}\n${ANSI.brightCyan}  RAW ANSI ABOVE — paste into any terminal to redraw the exact boot frame.${ANSI.reset}`;
}

export function renderOnboardingStep(step: number, total: number, title: string, bodyLines: string[]): string {
  const header = sectionHeader(`ONBOARDING // STEP ${step}/${total} /* ${title} */`, 'SELF-SETUP', 80);
  const body = bodyLines.map((l) => `  ${ANSI.gray}│${ANSI.reset} ${l}`).join('\n');
  return `\n${header}\n${body}\n${divider('─', 80)}`;
}

export const ONBOARDING_TIPS: string[] = [
  'Everything hides under the [=] MENU button — Screen 2 is the full System Deck.',
  'Type /help any time for the command palette, or /onboarding to replay setup.',
  'The voice orb is a live-chat mic: tap it, speak, and your prompt is transmitted.',
  'Consilium mode lets 3-10 frontier models deliberate and vote on your prompt.',
  'All pricing is strictly USD ($) and EUR (€) — zero-trust, based in Chernomorsk (UA) & Bratislava (EU).',
  'Developer Mode (/dev) reveals whisper commands: /ansi, /config, /dev.',
  'Use /model <id> to hot-swap the neural engine without touching the menu.',
  'The terminal stream is the same ANSI art in the CLI, web and mobile — no stubs.',
];