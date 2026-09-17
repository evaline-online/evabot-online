/**
 * AnsiStreamEngine.ts
 * EvaBot Online v0.0.1 MVP — Reactive ANSI Terminal Stream Engine
 *
 * Features:
 * - Line-by-line reactive streaming and chunk buffering
 * - Traffic light badges ([OK] [MED] [HIGH]) and status indicators
 * - Clean headers, banners, dividers, and prompt symbols
 * - Robust monospace table formatter with auto-column width and border styles
 * - 1:1 parity across ANSI Terminal, Plain Text files, and Web HTML
 * - Strict financial standard: USD ($) & EUR (€) only
 */

import { EventEmitter } from 'node:events';

// ============================================================================
// ANSI Color and Style Codes
// ============================================================================

export const AnsiColors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',

  // Standard Foreground
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Bright / Zinc Foreground
  gray: '\x1b[90m',
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',

  // Standard Background
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
} as const;

export type ColorName = keyof typeof AnsiColors;

// ============================================================================
// ANSI & String Width Utilities (1:1 Parity Terminal / Plain / Web)
// ============================================================================

const ANSI_REGEX = new RegExp(
  '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)|(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))',
  'g'
);

/**
 * Strips all ANSI escape sequences from a string to produce clean plain text
 */
export function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '');
}

/**
 * Calculates visible terminal character width.
 * Accounts for 2-column emojis ([OK], [MED], [HIGH], etc.) and wide characters.
 */
export function visibleWidth(text: string): number {
  const clean = stripAnsi(text);
  let width = 0;
  for (const char of clean) {
    const code = char.codePointAt(0) || 0;
    // Common 2-width emojis (traffic lights, checkmarks, sparkles, etc.)
    if (
      (code >= 0x1f300 && code <= 0x1f9ff) || // Misc Symbols & Pictographs, Supplemental Symbols
      (code >= 0x2600 && code <= 0x27bf) ||   // Misc symbols, Dingbats
      (code >= 0x1fa00 && code <= 0x1faff) || // Chess, Symbols & Pictographs Extended-A
      (code >= 0x2e80 && code <= 0x9fff)     // CJK
    ) {
      width += 2;
    } else {
      width += 1;
    }
  }
  return width;
}

/**
 * Pads a string to a target visible width, taking ANSI escapes into account
 */
export function padEndVisible(text: string, targetWidth: number, padChar = ' '): string {
  const current = visibleWidth(text);
  if (current >= targetWidth) return text;
  return text + padChar.repeat(targetWidth - current);
}

/**
 * Pads start of a string to a target visible width
 */
export function padStartVisible(text: string, targetWidth: number, padChar = ' '): string {
  const current = visibleWidth(text);
  if (current >= targetWidth) return text;
  return padChar.repeat(targetWidth - current) + text;
}

/**
 * Converts ANSI colored text into sanitized HTML with inline CSS or classes
 * for 1:1 rendering in browser cyber-terminals.
 */
export function toHtml(ansiText: string): string {
  const colorMap: Record<string, string> = {
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

  // Escape basic HTML characters
  let escaped = ansiText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Replace ANSI SGR codes with spans
  escaped = escaped.replace(/\x1b\[([0-9;]+)m/g, (_match, p1: string) => {
    if (p1 === '0') {
      return '</span>';
    }
    const codes = p1.split(';');
    const styles: string[] = [];
    for (const code of codes) {
      if (colorMap[code]) {
        styles.push(colorMap[code]);
      }
    }
    if (styles.length > 0) {
      return `<span style="${styles.join(';')}">`;
    }
    return '';
  });

  return escaped;
}

/**
 * Converts ANSI text directly to plain text (strips ANSI codes)
 */
export function toPlainText(ansiText: string): string {
  return stripAnsi(ansiText);
}

// ============================================================================
// Traffic Light Badges & Status Indicators
// ============================================================================

export type TrafficLightStatus =
  | 'green'
  | 'yellow'
  | 'red'
  | 'ok'
  | 'warn'
  | 'error'
  | 'online'
  | 'standby'
  | 'offline'
  | 'free'
  | 'paid';

export function trafficLightIcon(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
    case 'ok':
    case 'online':
    case 'free':
      return '[OK]';
    case 'yellow':
    case 'warn':
    case 'standby':
    case 'paid':
      return '[MED]';
    case 'red':
    case 'error':
    case 'offline':
      return '[HIGH]';
    default:
      return '[--]';
  }
}

export function trafficLightColor(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
    case 'ok':
    case 'online':
    case 'free':
      return AnsiColors.green;
    case 'yellow':
    case 'warn':
    case 'standby':
    case 'paid':
      return AnsiColors.yellow;
    case 'red':
    case 'error':
    case 'offline':
      return AnsiColors.red;
    default:
      return AnsiColors.white;
  }
}

/**
 * Generates standard cyber-terminal traffic light badge:
 * e.g. "[OK] ONLINE", "[MED] STANDBY", "[HIGH] OFFLINE", "[OK] FREE QUOTA"
 */
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

  return `${icon} ${color}${AnsiColors.bold}[${label}]${AnsiColors.reset}`;
}

/**
 * Minimal inline badge
 */
export function badge(text: string, color: string = AnsiColors.cyan): string {
  return `${AnsiColors.gray}[${AnsiColors.reset}${color}${text}${AnsiColors.reset}${AnsiColors.gray}]${AnsiColors.reset}`;
}

// ============================================================================
// Clean Headers, Dividers, and Prompt Symbols
// ============================================================================

export function divider(char = '─', width = 78, color = AnsiColors.gray): string {
  return `${color}${char.repeat(width)}${AnsiColors.reset}`;
}

export function sectionHeader(title: string, tag = '', width = 78): string {
  const cleanTitle = ` ${title.toUpperCase()} `;
  const cleanTag = tag ? ` [ ${tag} ] ` : '';
  const remaining = Math.max(4, width - visibleWidth(cleanTitle) - visibleWidth(cleanTag) - 2);
  const left = '──';
  const right = '─'.repeat(remaining);

  return `${AnsiColors.gray}┌${left}${AnsiColors.reset}${AnsiColors.bold}${AnsiColors.white}${cleanTitle}${AnsiColors.reset}${cleanTag ? `${AnsiColors.cyan}${cleanTag}${AnsiColors.reset}` : ''}${AnsiColors.gray}${right}┐${AnsiColors.reset}`;
}

export function sectionFooter(width = 78): string {
  return `${AnsiColors.gray}└${'─'.repeat(width - 2)}┘${AnsiColors.reset}`;
}

export function formatBanner(lines: string[], title = 'EVABOT ONLINE v0.0.1 MVP', width = 78): string {
  const contentWidth = width - 4;
  const top = `${AnsiColors.gray}┌${'─'.repeat(width - 2)}┐${AnsiColors.reset}`;
  const bottom = `${AnsiColors.gray}└${'─'.repeat(width - 2)}┘${AnsiColors.reset}`;

  const renderedLines: string[] = [top];
  renderedLines.push(
    `${AnsiColors.gray}│${AnsiColors.reset} ${AnsiColors.bold}${AnsiColors.brightWhite}${padEndVisible(title, contentWidth - 1)}${AnsiColors.reset} ${AnsiColors.gray}│${AnsiColors.reset}`
  );
  renderedLines.push(`${AnsiColors.gray}├${'─'.repeat(width - 2)}┤${AnsiColors.reset}`);

  for (const line of lines) {
    const padded = padEndVisible(line, contentWidth - 1);
    renderedLines.push(`${AnsiColors.gray}│${AnsiColors.reset} ${padded} ${AnsiColors.gray}│${AnsiColors.reset}`);
  }

  renderedLines.push(bottom);
  return renderedLines.join('\n');
}

export function promptSymbol(mode: string = 'solo'): string {
  switch (mode.toLowerCase()) {
    case 'consilium':
      return `${AnsiColors.green}[TEAM] ❯${AnsiColors.reset}`;
    case 'dialogue':
      return `${AnsiColors.cyan}❯${AnsiColors.reset}`;
    case 'broadcast':
      return `${AnsiColors.yellow}[NET] ❯${AnsiColors.reset}`;
    default:
      return `${AnsiColors.brightGreen}❯${AnsiColors.reset}`;
  }
}

export function formatPrompt(options: {
  model?: string;
  mode?: string;
  role?: string;
}): string {
  const mode = (options.mode || 'solo').toUpperCase();
  const model = options.model ? ` (${options.model})` : '';
  const role = options.role && options.role !== 'general_assistant' ? ` [${options.role}]` : '';
  const symbol = promptSymbol(options.mode);

  return `${AnsiColors.bold}${AnsiColors.white}eva${AnsiColors.reset}${AnsiColors.gray}${model}${role} ${AnsiColors.cyan}[${mode}]${AnsiColors.reset} ${symbol} `;
}

// ============================================================================
// Formatted Monospace Table Engine
// ============================================================================

export interface TableColumn<T = any> {
  key: keyof T | string;
  header: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  maxWidth?: number;
  format?: (value: any, row: T) => string;
}

export interface TableOptions<T = any> {
  columns: TableColumn<T>[];
  borderStyle?: 'unicode' | 'ascii' | 'minimal' | 'none';
  headerColor?: string;
  borderColor?: string;
  padding?: number;
  maxWidth?: number;
}

export class TableFormatter {
  /**
   * Formats rows into a clean, perfectly aligned monospace table
   */
  public static render<T extends Record<string, any>>(
    rows: T[],
    options: TableOptions<T>
  ): string {
    const {
      columns,
      borderStyle = 'unicode',
      headerColor = `${AnsiColors.bold}${AnsiColors.white}`,
      borderColor = AnsiColors.gray,
      padding = 1,
    } = options;

    const pad = ' '.repeat(padding);

    // 1. Calculate column widths
    const colWidths: number[] = columns.map((col) => {
      let max = visibleWidth(col.header);
      if (col.minWidth) max = Math.max(max, col.minWidth);

      for (const row of rows) {
        const val = col.format
          ? col.format(row[col.key], row)
          : String(row[col.key] ?? '');
        max = Math.max(max, visibleWidth(val));
      }

      if (col.maxWidth) max = Math.min(max, col.maxWidth);
      return max;
    });

    // 2. Borders definition
    const chars = {
      unicode: {
        tl: '┌',
        tm: '┬',
        tr: '┐',
        ml: '├',
        mm: '┼',
        mr: '┤',
        bl: '└',
        bm: '┴',
        br: '┘',
        h: '─',
        v: '│',
      },
      ascii: {
        tl: '+',
        tm: '+',
        tr: '+',
        ml: '+',
        mm: '+',
        mr: '+',
        bl: '+',
        bm: '+',
        br: '+',
        h: '-',
        v: '|',
      },
      minimal: {
        tl: '',
        tm: '',
        tr: '',
        ml: '',
        mm: '',
        mr: '',
        bl: '',
        bm: '',
        br: '',
        h: '─',
        v: ' ',
      },
      none: {
        tl: '',
        tm: '',
        tr: '',
        ml: '',
        mm: '',
        mr: '',
        bl: '',
        bm: '',
        br: '',
        h: '',
        v: ' ',
      },
    }[borderStyle];

    const formatCell = (content: string, width: number, align: 'left' | 'center' | 'right' = 'left'): string => {
      const vWidth = visibleWidth(content);
      if (vWidth >= width) return content;
      const diff = width - vWidth;

      if (align === 'right') {
        return ' '.repeat(diff) + content;
      }
      if (align === 'center') {
        const leftPad = Math.floor(diff / 2);
        const rightPad = diff - leftPad;
        return ' '.repeat(leftPad) + content + ' '.repeat(rightPad);
      }
      return content + ' '.repeat(diff);
    };

    const out: string[] = [];

    // Top border
    if (borderStyle === 'unicode' || borderStyle === 'ascii') {
      const topParts = colWidths.map((w) => chars.h.repeat(w + padding * 2));
      out.push(
        `${borderColor}${chars.tl}${topParts.join(chars.tm)}${chars.tr}${AnsiColors.reset}`
      );
    }

    // Header row
    const headerCells = columns.map((col, idx) => {
      const aligned = formatCell(col.header, colWidths[idx], col.align || 'left');
      return `${pad}${headerColor}${aligned}${AnsiColors.reset}${pad}`;
    });
    out.push(
      `${borderColor}${chars.v}${AnsiColors.reset}${headerCells.join(`${borderColor}${chars.v}${AnsiColors.reset}`)}${borderColor}${chars.v}${AnsiColors.reset}`
    );

    // Separator border
    if (borderStyle !== 'none') {
      const midParts = colWidths.map((w) => chars.h.repeat(w + padding * 2));
      const midLeft = borderStyle === 'minimal' ? '' : chars.ml;
      const midRight = borderStyle === 'minimal' ? '' : chars.mr;
      const midJoint = borderStyle === 'minimal' ? ' ' : chars.mm;
      out.push(
        `${borderColor}${midLeft}${midParts.join(midJoint)}${midRight}${AnsiColors.reset}`
      );
    }

    // Data rows
    for (const row of rows) {
      const dataCells = columns.map((col, idx) => {
        const raw = col.format
          ? col.format(row[col.key], row)
          : String(row[col.key] ?? '');
        const aligned = formatCell(raw, colWidths[idx], col.align || 'left');
        return `${pad}${aligned}${pad}`;
      });
      out.push(
        `${borderColor}${chars.v}${AnsiColors.reset}${dataCells.join(`${borderColor}${chars.v}${AnsiColors.reset}`)}${borderColor}${chars.v}${AnsiColors.reset}`
      );
    }

    // Bottom border
    if (borderStyle === 'unicode' || borderStyle === 'ascii') {
      const botParts = colWidths.map((w) => chars.h.repeat(w + padding * 2));
      out.push(
        `${borderColor}${chars.bl}${botParts.join(chars.bm)}${chars.br}${AnsiColors.reset}`
      );
    }

    return out.join('\n');
  }
}

// ============================================================================
// SGR Mouse Tracking (Mode 1006)
// ============================================================================

export interface SgrMouseEvent {
  button: number;       // 0=left, 1=middle, 2=right, 64=scroll-up, 65=scroll-down, 3=release
  pressed: boolean;     // true = press, false = release
  col: number;          // 1-based column
  row: number;          // 1-based row
  isRelease: boolean;
}

export interface ClickableArea {
  id: string;
  row: number;          // 1-based row (viewport)
  startCol: number;     // 1-based inclusive
  endCol: number;       // 1-based inclusive
  label: string;
  action: () => void | Promise<void>;
}

export class MouseTracker {
  private clickables: ClickableArea[] = [];
  private enabled = false;
  private onData?: (event: SgrMouseEvent) => void;

  constructor(onData?: (event: SgrMouseEvent) => void) {
    this.onData = onData;
  }

  /**
   * Enable SGR mouse mode 1003 (all events) + mode 1006 (SGR coordinates)
   */
  public enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    process.stdout.write('\x1b[?1003h\x1b[?1006h');
  }

  /**
   * Disable SGR mouse tracking and restore terminal
   */
  public disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    process.stdout.write('\x1b[?1003l\x1b[?1006l');
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Parse raw input bytes for SGR mouse events.
   * SGR format: ESC [ < Cb ; Cc ; Cd M / m
   *   Cb = button (0-3 normal, 64=scroll up, 65=scroll down)
   *   Cc = column (1-based)
   *   Cd = row (1-based)
   *   M = press, m = release
   */
  public parseBuffer(data: Buffer): SgrMouseEvent[] {
    const events: SgrMouseEvent[] = [];
    const str = data.toString('utf-8');

    let i = 0;
    while (i < str.length) {
      // Look for ESC [ <
      if (str[i] === '\x1b' && i + 2 < str.length && str[i + 1] === '[' && str[i + 2] === '<') {
        i += 3;
        let cbStr = '';
        let ccStr = '';
        let cdStr = '';
        let phase = 0;

        while (i < str.length) {
          const ch = str[i];
          if (ch === ';') {
            phase++;
            i++;
            continue;
          }
          if (ch === 'M' || ch === 'm') {
            const isRelease = ch === 'm';
            const cb = parseInt(cbStr, 10) || 0;
            const cc = parseInt(ccStr, 10) || 0;
            const cd = parseInt(cdStr, 10) || 0;

            const event: SgrMouseEvent = {
              button: cb,
              pressed: !isRelease,
              col: cc,
              row: cd,
              isRelease,
            };

            events.push(event);
            this.onData?.(event);
            this.checkClickable(event);
            i++;
            break;
          }
          if (ch >= '0' && ch <= '9') {
            if (phase === 0) cbStr += ch;
            else if (phase === 1) ccStr += ch;
            else if (phase === 2) cdStr += ch;
          }
          i++;
        }
      } else {
        i++;
      }
    }

    return events;
  }

  /**
   * Register a clickable area
   */
  public registerClickable(area: ClickableArea): void {
    this.clickables.push(area);
  }

  /**
   * Clear all registered clickables (call on each render cycle)
   */
  public clearClickables(): void {
    this.clickables = [];
  }

  /**
   * Check if a mouse event hits a registered clickable
   */
  private checkClickable(event: SgrMouseEvent): void {
    if (event.isRelease) return;

    const hit = this.clickables.find(
      (c) => event.row === c.row && event.col >= c.startCol && event.col <= c.endCol
    );

    if (hit) {
      hit.action();
    }
  }

  /**
   * Setup raw mode stdin listener for mouse events
   */
  public attachStdin(stdin: NodeJS.ReadStream): void {
    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }
    stdin.resume();
    stdin.on('data', (data: Buffer) => {
      this.parseBuffer(data);
    });
  }

  /**
   * Detach stdin listener
   */
  public detachStdin(stdin: NodeJS.ReadStream): void {
    stdin.removeAllListeners('data');
    if (stdin.isTTY) {
      stdin.setRawMode(false);
    }
  }
}

/**
 * Helper: render a clickable text span that registers coordinates for mouse hit-testing.
 * Returns the plain text (for screen output) and registers the clickable area.
 */
export function clickableText(
  tracker: MouseTracker,
  text: string,
  row: number,
  startCol: number,
  id: string,
  action: () => void | Promise<void>
): string {
  tracker.registerClickable({
    id,
    row,
    startCol,
    endCol: startCol + visibleWidth(text) - 1,
    label: text,
    action,
  });
  return text;
}

// ============================================================================
// Reactive Stream Engine (Line-by-line & progressive streaming)
// ============================================================================

export interface AnsiStreamWriterOptions {
  prefix?: string;
  writeToStdout?: boolean;
  onChunk?: (chunk: string) => void;
  onLine?: (line: string) => void;
}

export class AnsiStreamWriter extends EventEmitter {
  private lineBuffer: string = '';
  private fullAnsiBuffer: string = '';
  private lines: string[] = [];
  private prefix: string;
  private writeToStdout: boolean;
  private onChunkCallback?: (chunk: string) => void;
  private onLineCallback?: (line: string) => void;
  private isStartOfLine: boolean = true;

  constructor(options: AnsiStreamWriterOptions = {}) {
    super();
    this.prefix = options.prefix ?? '';
    this.writeToStdout = options.writeToStdout ?? false;
    this.onChunkCallback = options.onChunk;
    this.onLineCallback = options.onLine;
  }

  /**
   * Set dynamic prefix for streamed lines (e.g. `│ ` or ` `)
   */
  public setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * Appends a chunk to the stream, processing complete lines reactively
   */
  public write(chunk: string): void {
    this.fullAnsiBuffer += chunk;
    this.lineBuffer += chunk;

    if (this.onChunkCallback) {
      this.onChunkCallback(chunk);
    }
    this.emit('chunk', chunk);

    // Process newlines
    let nlIdx = this.lineBuffer.indexOf('\n');
    while (nlIdx !== -1) {
      const line = this.lineBuffer.slice(0, nlIdx);
      this.lineBuffer = this.lineBuffer.slice(nlIdx + 1);
      this.lines.push(line);

      if (this.writeToStdout) {
        if (this.isStartOfLine && this.prefix) {
          process.stdout.write(this.prefix);
        }
        process.stdout.write(line + '\n');
        this.isStartOfLine = true;
      }

      if (this.onLineCallback) {
        this.onLineCallback(line);
      }
      this.emit('line', line);

      nlIdx = this.lineBuffer.indexOf('\n');
    }

    // Output partial line to stdout if enabled
    if (this.writeToStdout && this.lineBuffer.length > 0) {
      if (this.isStartOfLine && this.prefix) {
        process.stdout.write(this.prefix);
        this.isStartOfLine = false;
      }
    }
  }

  /**
   * Writes a complete line
   */
  public writeLine(line: string = ''): void {
    this.write(line + '\n');
  }

  /**
   * Flushes any remaining content in the buffer
   */
  public flush(): void {
    if (this.lineBuffer.length > 0) {
      const line = this.lineBuffer;
      this.lineBuffer = '';
      this.lines.push(line);

      if (this.writeToStdout) {
        if (this.isStartOfLine && this.prefix) {
          process.stdout.write(this.prefix);
        }
        process.stdout.write(line + '\n');
        this.isStartOfLine = true;
      }

      if (this.onLineCallback) {
        this.onLineCallback(line);
      }
      this.emit('line', line);
    }
  }

  /**
   * Signals the end of the stream and flushes remaining content
   */
  public end(): void {
    this.flush();
    this.emit('end', this.fullAnsiBuffer);
  }

  /**
   * Returns complete accumulated text formatted for ANSI, Plain Text, or HTML
   */
  public getFullText(format: 'ansi' | 'plain' | 'html' = 'ansi'): string {
    switch (format) {
      case 'plain':
        return toPlainText(this.fullAnsiBuffer);
      case 'html':
        return toHtml(this.fullAnsiBuffer);
      default:
        return this.fullAnsiBuffer;
    }
  }

  /**
   * Returns all processed lines
   */
  public getLines(format: 'ansi' | 'plain' = 'ansi'): string[] {
    if (format === 'plain') {
      return this.lines.map(toPlainText);
    }
    return [...this.lines];
  }

  /**
   * Clears all internal buffers
   */
  public clear(): void {
    this.lineBuffer = '';
    this.fullAnsiBuffer = '';
    this.lines = [];
    this.isStartOfLine = true;
  }
}

// ============================================================================
// Default Export
// ============================================================================

export const AnsiStreamEngine = {
  colors: AnsiColors,
  stripAnsi,
  visibleWidth,
  padEndVisible,
  padStartVisible,
  toHtml,
  toPlainText,
  trafficLightIcon,
  trafficLightColor,
  statusBadge,
  badge,
  divider,
  sectionHeader,
  sectionFooter,
  formatBanner,
  promptSymbol,
  formatPrompt,
  formatTable: TableFormatter.render,
  TableFormatter,
  AnsiStreamWriter,
  MouseTracker,
  clickableText,
};

export default AnsiStreamEngine;
