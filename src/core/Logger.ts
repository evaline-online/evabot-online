import fs from 'node:fs';
import path from 'node:path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export enum LogCategory {
  SYSTEM = 'SYSTEM',
  HTTP = 'HTTP',
  USER = 'USER',
  LLM = 'LLM',
  MODEL = 'MODEL',
  KB = 'KB',
  STORAGE = 'STORAGE',
  AUTH = 'AUTH',
  PROCESS = 'PROCESS',
  DIAG = 'DIAG',
  CLI = 'CLI',
  BROWSER = 'BROWSER',
}

const LEVEL_NAMES: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: '\x1b[90m',
  [LogLevel.INFO]: '\x1b[36m',
  [LogLevel.WARN]: '\x1b[33m',
  [LogLevel.ERROR]: '\x1b[31m\x1b[1m',
};

const RESET_COLOR = '\x1b[0m';

export interface LogEntry {
  timestamp: string;
  level: string;
  category: string;
  tag: string;
  message: string;
  meta?: unknown;
  sessionId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  durationMs?: number;
}

export class Logger {
  private static instance: Logger;
  private logsDir: string | null = null;
  private mainLogPath: string | null = null;
  private userLogPath: string | null = null;
  private errorLogPath: string | null = null;
  private minLevel: LogLevel = LogLevel.DEBUG;
  private inMemoryBuffer: LogEntry[] = [];
  private maxBufferSize: number = 1000;
  private sessionId: string = '';

  private constructor() {
    try {
      this.logsDir = path.resolve(process.cwd(), 'logs');
      if (!fs.existsSync(this.logsDir)) {
        fs.mkdirSync(this.logsDir, { recursive: true });
      }
      const date = new Date().toISOString().split('T')[0];
      this.mainLogPath = path.join(this.logsDir, 'evabot.log');
      this.userLogPath = path.join(this.logsDir, `user-actions-${date}.log`);
      this.errorLogPath = path.join(this.logsDir, `errors-${date}.log`);
    } catch {
      this.logsDir = null;
    }
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setMinLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  public setSession(sessionId: string): void {
    this.sessionId = sessionId;
  }

  public getSession(): string {
    return this.sessionId;
  }

  public getRecentLogs(limit: number = 100, level?: LogLevel, category?: string): LogEntry[] {
    let entries = [...this.inMemoryBuffer];
    if (level !== undefined) {
      entries = entries.filter(e => e.level === LEVEL_NAMES[level]);
    }
    if (category !== undefined) {
      entries = entries.filter(e => e.category === category);
    }
    return entries.slice(-limit).reverse();
  }

  public getLogFiles(): { main: string; user: string; errors: string; dir: string } {
    return {
      main: this.mainLogPath || '',
      user: this.userLogPath || '',
      errors: this.errorLogPath || '',
      dir: this.logsDir || '',
    };
  }

  public readLogFile(filename: string, lines: number = 200): string {
    if (!this.logsDir) return '';
    const filePath = path.join(this.logsDir, filename);
    if (!fs.existsSync(filePath)) return '';
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const allLines = content.split('\n');
      return allLines.slice(-lines).join('\n');
    } catch (e: unknown) {
      return `[ERROR] Cannot read log: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  public listLogFiles(): string[] {
    if (!this.logsDir) return [];
    try {
      return fs.readdirSync(this.logsDir).filter(f => f.endsWith('.log'));
    } catch {
      return [];
    }
  }

  private formatMessage(level: LogLevel, category: string, tag: string, message: string, meta?: unknown): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LEVEL_NAMES[level],
      category,
      tag,
      message,
      meta,
      sessionId: this.sessionId || undefined,
    };
  }

  private write(level: LogLevel, category: string, tag: string, message: string, meta?: unknown): void {
    if (level < this.minLevel) return;

    const entry = this.formatMessage(level, category, tag, message, meta);

    this.inMemoryBuffer.push(entry);
    if (this.inMemoryBuffer.length > this.maxBufferSize) {
      this.inMemoryBuffer.shift();
    }

    const sessionStr = this.sessionId ? ` [${this.sessionId}]` : '';
    const line = `[${entry.timestamp}] [${entry.level}] [${category}]${sessionStr} [${tag}] ${message}`;
    const metaStr = meta !== undefined ? ` ${JSON.stringify(meta)}` : '';
    const fullLine = line + metaStr;
    const color = LEVEL_COLORS[level] || '';

    console.log(`${color}${line}${RESET_COLOR}${meta ? ` ${color}${JSON.stringify(meta)}${RESET_COLOR}` : ''}`);

    if (this.mainLogPath) {
      try {
        fs.appendFileSync(this.mainLogPath, fullLine + '\n', 'utf8');
      } catch {}
    }
    if (category === LogCategory.USER && this.userLogPath) {
      try {
        fs.appendFileSync(this.userLogPath, fullLine + '\n', 'utf8');
      } catch {}
    }
    if (level === LogLevel.ERROR && this.errorLogPath) {
      try {
        fs.appendFileSync(this.errorLogPath, fullLine + '\n', 'utf8');
      } catch {}
    }
  }

  public debug(tag: string, message: string, meta?: unknown): void;
  public debug(category: LogCategory, tag: string, message: string, meta?: unknown): void;
  public debug(arg1: string | LogCategory, arg2: string, arg3?: string | unknown, arg4?: unknown): void {
    if (typeof arg1 === 'string') {
      this.write(LogLevel.DEBUG, LogCategory.SYSTEM, arg1, arg2, arg3);
    } else {
      this.write(LogLevel.DEBUG, arg1, arg2, arg3 as string, arg4);
    }
  }

  public info(tag: string, message: string, meta?: unknown): void;
  public info(category: LogCategory, tag: string, message: string, meta?: unknown): void;
  public info(arg1: string | LogCategory, arg2: string, arg3?: string | unknown, arg4?: unknown): void {
    if (typeof arg1 === 'string') {
      this.write(LogLevel.INFO, LogCategory.SYSTEM, arg1, arg2, arg3);
    } else {
      this.write(LogLevel.INFO, arg1, arg2, arg3 as string, arg4);
    }
  }

  public warn(tag: string, message: string, meta?: unknown): void;
  public warn(category: LogCategory, tag: string, message: string, meta?: unknown): void;
  public warn(arg1: string | LogCategory, arg2: string, arg3?: string | unknown, arg4?: unknown): void {
    if (typeof arg1 === 'string') {
      this.write(LogLevel.WARN, LogCategory.SYSTEM, arg1, arg2, arg3);
    } else {
      this.write(LogLevel.WARN, arg1, arg2, arg3 as string, arg4);
    }
  }

  public error(tag: string, message: string, meta?: unknown): void;
  public error(category: LogCategory, tag: string, message: string, meta?: unknown): void;
  public error(arg1: string | LogCategory, arg2: string, arg3?: string | unknown, arg4?: unknown): void {
    if (typeof arg1 === 'string') {
      this.write(LogLevel.ERROR, LogCategory.SYSTEM, arg1, arg2, arg3);
    } else {
      this.write(LogLevel.ERROR, arg1, arg2, arg3 as string, arg4);
    }
  }

  public logUserAction(action: string, details: Record<string, unknown>, ip?: string, userAgent?: string): void {
    this.write(LogLevel.INFO, LogCategory.USER, 'USER_ACTION', action, {
      ...details,
      ip,
      userAgent,
    });
  }

  public logHttpRequest(method: string, path: string, status: number, durationMs: number, ip?: string, userAgent?: string): void {
    this.write(LogLevel.INFO, LogCategory.HTTP, 'REQUEST', `${method} ${path}`, {
      method, path, status, durationMs, ip, userAgent,
    });
  }

  public logLlmCall(model: string, provider: string, promptTokens: number, responseTokens: number, durationMs: number, cost?: number): void {
    this.write(LogLevel.INFO, LogCategory.LLM, 'LLM_CALL', `${model} via ${provider}`, {
      model, provider, promptTokens, responseTokens, durationMs, cost,
    });
  }

  public startTimer(label: string): () => number {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(LogCategory.PROCESS, label, `Completed in ${duration}ms`);
      return duration;
    };
  }
}

export const logger = Logger.getInstance();
