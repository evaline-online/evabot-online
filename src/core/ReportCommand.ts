import fs from 'node:fs';
import path from 'node:path';
import { alertManager, AlertEvent } from './AlertManager.js';
import { logger } from './Logger.js';

const MAX_DESC = 500;
const MAX_LIST = 20;

interface ErrorLine {
  ts: number; // epoch ms (for sorting)
  time: string; // HH:MM
  sev: string;
  msg: string;
}

function hhmm(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return d.toTimeString().slice(0, 5);
}

function shortDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export class ReportCommand {
  public static usage(kind: 'error' | 'bug'): string {
    return kind === 'bug'
      ? '[ERROR] Usage: /bug <description> — register a bug report.'
      : '[ERROR] Usage: /error <description> — register an error report.';
  }

  /**
   * /error <desc> | /bug <desc> | /errors
   */
  public static async execute(command: string): Promise<string> {
    const raw = (command || '').trim();
    const lower = raw.toLowerCase();

    if (lower === '/errors' || lower.startsWith('/errors ')) {
      return this.listErrors();
    }
    if (lower.startsWith('/bug')) {
      const desc = raw.slice(4).trim();
      if (!desc) return this.usage('bug');
      return this.raise('bug-report', 'User bug report', desc);
    }
    if (lower.startsWith('/error')) {
      const desc = raw.slice(6).trim();
      if (!desc) return this.usage('error');
      return this.raise('error-report', 'User error report', desc);
    }
    return `[ERROR] Unknown command for ReportCommand: ${raw.split(/\s+/)[0] || raw}. Use /error <desc>, /bug <desc> or /errors.`;
  }

  private static async raise(type: 'error-report' | 'bug-report', title: string, desc: string): Promise<string> {
    try {
      // Unique per-report id appended to the title: keeps the AlertManager
      // rate-limit key (title) distinct so consecutive user reports are
      // never swallowed by the 60s cooldown.
      const reportId = `rep-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
      const event: AlertEvent = await alertManager.medium(`${title} ${reportId}`, desc.slice(0, MAX_DESC), 'web-cli', {
        source: 'web-cli',
        type,
        ts: new Date().toISOString(),
      });
      const id = event?.id && event.id !== 'rate-limited' ? event.id : reportId;
      return `[OK] Report #${id} registered. Thank you! / Спасибо!`;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.warn('ReportCommand', `report raise failed: ${msg}`);
      return `[ERROR] Failed to register report: ${msg}`;
    }
  }

  /**
   * /errors — last 20 system errors merged from:
   *   1) AlertManager in-memory list (medium and above),
   *   2) logs/alerts.log (JSON lines, persists across restarts),
   *   3) logs/errors-<today>.log (Logger ERROR-level lines).
   */
  public static listErrors(): string {
    const collected: ErrorLine[] = [];
    const seen = new Set<string>();

    const push = (iso: string, sev: string, msg: string): void => {
      const clean = (msg || '').replace(/\s+/g, ' ').trim().slice(0, 160);
      if (!clean) return;
      const key = `${sev}|${clean}`;
      if (seen.has(key)) return;
      seen.add(key);
      const t = new Date(iso).getTime();
      collected.push({ ts: Number.isNaN(t) ? 0 : t, time: hhmm(iso), sev: sev.toUpperCase(), msg: clean });
    };

    // 1) In-memory alerts (medium and above count as system errors)
    try {
      for (const a of alertManager.getRecentAlerts(50)) {
        if (a.severity === 'low') continue;
        push(a.timestamp, a.severity, `${a.title}: ${a.message}`);
      }
    } catch { /* best effort */ }

    // 2) logs/alerts.log (JSON lines)
    try {
      const alertsPath = path.resolve(process.cwd(), 'logs', 'alerts.log');
      if (fs.existsSync(alertsPath)) {
        const lines = fs.readFileSync(alertsPath, 'utf8').split('\n').filter(Boolean).slice(-50);
        for (const line of lines) {
          try {
            const ev = JSON.parse(line) as { timestamp?: string; severity?: string; title?: string; message?: string };
            if (!ev.severity || ev.severity === 'low') continue;
            push(ev.timestamp || '', ev.severity, `${ev.title || ''}${ev.title ? ': ' : ''}${ev.message || ''}`);
          } catch { /* skip malformed line */ }
        }
      }
    } catch { /* best effort */ }

    // 3) errors-<today>.log — Logger ERROR-level lines
    try {
      const errPath = path.resolve(process.cwd(), 'logs', `errors-${shortDate(new Date())}.log`);
      if (fs.existsSync(errPath)) {
        const lines = fs.readFileSync(errPath, 'utf8').split('\n').filter(Boolean).slice(-50);
        for (const line of lines) {
          const m = /^\[([^\]]+)\] \[ERROR\] \[([^\]]+)\](?: \[[^\]]+\])? \[([^\]]+)\] (.*)$/.exec(line);
          if (!m) continue;
          const [, iso, , tag, message] = m;
          push(iso, 'error', `${tag}: ${message}`);
        }
      }
    } catch { /* best effort */ }

    if (collected.length === 0) {
      return '[OK] No system errors. All clear.';
    }

    const lines = collected
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_LIST)
      .map((e) => `[${e.time}] [${e.sev}] ${e.msg}`);
    return `System errors (last ${lines.length}):\n${lines.join('\n')}`;
  }
}
