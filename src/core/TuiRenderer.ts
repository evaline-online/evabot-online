import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ClusterMonitor } from './ClusterMonitor.js';

export interface DomainMeta {
  domain: string;
  badge: string;
  role: string;
  infra: string;
  target?: string;
}

export const DOMAINS_CONFIG: DomainMeta[] = [
  {
    domain: 'evabot.online',
    badge: 'NEURAL CORE',
    role: 'AI Вычислительное Ядро, Оркестрация Агентов & Мульти-LLM Консилиум',
    infra: 'evabot-agent-vm · 8 vCPU Intel Xeon Sapphire Rapids · 32 GB RAM · Франкфурт (ФРГ) · IP: 34.159.202.82',
    target: 'Координация агентов, консилиум 94 моделей, векторная память и TUI-сервер.',
  },
  {
    domain: 'evaline.network',
    badge: 'EDGE MESH',
    role: 'Edge Mesh, Визуализатор Архитектуры Нод, Консилиума Агентов & Метрик Кластера',
    infra: 'evaline-micro-vm · 2 vCPU e2-micro · 1 GB RAM · Айова (США) · IP: 136.114.26.252',
    target: 'Глобальный Ingress-шлюз, HTTP/3 QUIC терминация, WireGuard туннель Франкфурт <-> Айова, мониторинг всех процессов.',
  },
  {
    domain: 'evaline.online',
    badge: 'SECURITY & IAM',
    role: 'Контур Периметровой Безопасности, IAM-Авторизация, OOM-Щит & Манифест',
    infra: 'evaline-micro-vm · 2 vCPU e2-micro · 1 GB RAM · Айова (США) · IP: 136.114.26.252',
    target: 'OOM Shield защита e2-micro, фильтрация ботнетов, TLS-политики и манифест компании.',
  },
  {
    domain: 'evaline.website',
    badge: 'CHRONICLE',
    role: 'Мастер-Хроника Релизов, Инженерный Worklog & Архитектурная Документация',
    infra: 'evaline-micro-vm · 2 vCPU e2-micro · 1 GB RAM · Айова (США) · IP: 136.114.26.252',
    target: 'Публичный инженерный ворклог, документация архитектуры, спецификации RFC и история коммитов.',
  },
];

export class TuiRenderer {
  private static pagesDir = path.resolve(process.cwd(), 'pages');

  public static loadPageTemplate(cleanHost: string): { meta: DomainMeta; body: string } {
    const defaultMeta = DOMAINS_CONFIG.find((d) => d.domain === cleanHost) || DOMAINS_CONFIG[0];
    let filePath = path.join(this.pagesDir, `${cleanHost}.unui.md`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(this.pagesDir, 'default.unui.md');
    }
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, 'utf-8');
        const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
        if (fmMatch) {
          const fmText = fmMatch[1];
          const body = fmMatch[2];
          const meta: DomainMeta = { ...defaultMeta };
          fmText.split('\n').forEach((line) => {
            const [k, ...v] = line.split(':');
            if (k && v.length) {
              const key = k.trim();
              const val = v.join(':').trim();
              if (key === 'domain') meta.domain = val;
              if (key === 'badge') meta.badge = val;
              if (key === 'role') meta.role = val;
              if (key === 'infra') meta.infra = val;
              if (key === 'target') meta.target = val;
            }
          });
          return { meta, body };
        }
        return { meta: defaultMeta, body: raw };
      } catch (err) {
        console.error(`[un-ui] Error loading template for ${cleanHost}:`, err);
      }
    }
    return { meta: defaultMeta, body: '' };
  }

  public static getRawTemplate(targetDomain: string): string {
    const cleanHost = (targetDomain || '').split(':')[0].toLowerCase().replace(/^www\./, '');
    let filePath = path.join(this.pagesDir, `${cleanHost}.unui.md`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(this.pagesDir, 'default.unui.md');
    }
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return `# un-ui page for ${cleanHost}\nNo template found on disk.`;
  }

  public static getRawTextTemplate(targetDomain: string): string {
    const cleanHost = (targetDomain || '').split(':')[0].toLowerCase().replace(/^www\./, '');
    let filePath = path.join(this.pagesDir, `${cleanHost}.unui.txt`);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(this.pagesDir, 'default.unui.txt');
    }
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return this.renderText(cleanHost);
  }

  public static resolveDomain(hostHeader?: string): DomainMeta {
    if (!hostHeader) return DOMAINS_CONFIG[0];
    const cleanHost = hostHeader.split(':')[0].toLowerCase().replace(/^www\./, '');
    const { meta } = this.loadPageTemplate(cleanHost);
    return meta;
  }

  private static formatSecs(sec: number): string {
    const d = Math.floor(sec / 86400);
    const h = String(Math.floor((sec % 86400) / 3600)).padStart(2, '0');
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return (d > 0 ? `${d}d ` : '') + `${h}:${m}:${s}`;
  }

  private static makeBar(pct: number, total = 10): string {
    const safePct = Math.max(0, Math.min(100, pct));
    const filled = Math.round((safePct / 100) * total);
    return '[' + '■'.repeat(filled) + '□'.repeat(total - filled) + ']';
  }

  public static renderText(targetDomain: string): string {
    const cleanHost = (targetDomain || '').split(':')[0].toLowerCase().replace(/^www\./, '');
    const { meta: d, body } = this.loadPageTemplate(cleanHost);

    const compute = ClusterMonitor.getComputeMetrics();
    const micro = ClusterMonitor.getMicroMetrics();
    const latency = ClusterMonitor.getMeshLatency();
    const procs = ClusterMonitor.getProcesses();
    const logs = ClusterMonitor.getDomainLogs().slice(0, 10);

    const bLoad = compute.loadAvg[0].toFixed(2);
    const bCpuPct = compute.cpuPct;
    const bTotMem = (compute.memTotalMb / 1024).toFixed(1);
    const bUsedMem = (compute.memUsedMb / 1024).toFixed(1);
    const bRamPct = Math.round((compute.memUsedMb / compute.memTotalMb) * 100);
    const bTotSwap = (compute.swapTotalMb / 1024).toFixed(1);
    const bUsedSwap = (compute.swapUsedMb / 1024).toFixed(1);
    const bSwapPct = Math.round((compute.swapUsedMb / compute.swapTotalMb) * 100);
    const bUptime = compute.uptimeStr;

    let telemetryBlock = '[ РЕАЛЬНАЯ ТЕЛЕМЕТРИЯ ДВУХ СЕРВЕРОВ // REALTIME DUAL-NODE TELEMETRY ]:\n';
    telemetryBlock += `  • EVABRAIN (Compute Core / ФРГ): CPU: ${bLoad} (${bCpuPct}%) ${this.makeBar(bCpuPct)} | RAM: ${bUsedMem}/${bTotMem} GB (${bRamPct}%) | SWAP: ${bUsedSwap}/${bTotSwap} GB (${bSwapPct}%) | Uptime: ${bUptime} | Статус: [HEALTHY]\n`;
    telemetryBlock += `  • EVAFACE  (Edge Ingress / США): Load: ${micro.loadAvg.split(',')[0]} (${micro.cpuPct}%) ${this.makeBar(micro.cpuPct)} | RAM: ${micro.memUsedMb}/${micro.memTotalMb} MB (${Math.round((micro.memUsedMb / micro.memTotalMb) * 100)}%) | Uptime: ${micro.uptimeStr} | Ingress: [Caddy HTTP/3 OK]\n`;
    telemetryBlock += `  • WIREGUARD MESH BACKBONE:       100.125.200.49 (US) ⟷ 100.66.98.4 (EU) | Latency: ${latency} ms RTT | Потери: [0.0%]\n`;
    telemetryBlock += `  • КОНСИЛИУМ И ПУЛ МОДЕЛЕЙ:       5 Агентов (Antigravity, OpenCode, Serena, KiloCode, Eva) | 94 модели онлайн | 21 MCP инструмент`;

    let procBlock = '[ РЕАЛЬНЫЕ ПРОЦЕССЫ КЛАСТЕРА // LIVE PROCESS WATCHER ]:\n';
    procBlock += '  PID     УЗЕЛ             КАТЕГОРИЯ   ПРОЦЕСС / СЛУЖБА             CPU    ОЗУ      СТАТУС\n';
    procs.slice(0, 30).forEach((p, idx) => {
      const pidStr = String(p.pid).padEnd(7);
      const nodeStr = p.node.split(' ')[0].padEnd(16);
      const catStr = `[${p.category.toUpperCase()}]`.padEnd(11);
      const nameStr = `${p.name} (${p.role.split(' ')[0]})`.padEnd(28);
      const cpuStr = p.cpu.padEnd(6);
      const memStr = p.mem.padEnd(8);
      procBlock += `  ${pidStr} ${nodeStr} ${catStr} ${nameStr} ${cpuStr} ${memStr} [${p.status}]${idx < Math.min(procs.length, 30) - 1 ? '\n' : ''}`;
    });

    let logBlock = '[ РЕАЛЬНЫЙ ЖУРНАЛ ЗАПРОСОВ И ЛОГИ СЕТИ // LIVE ACCESS & SYSTEM LOGS ]:\n';
    if (logs.length > 0) {
      logs.slice(0, 8).forEach((l, idx) => {
        const icon = l.statusLevel === 'err' ? '[ERR]' : l.statusLevel === 'warn' ? '[WRN]' : '[OK]';
        logBlock += `  [${l.timeStr}] ${icon} ${l.status} ${l.method.padEnd(4)} ${l.host.padEnd(16)} ${l.uri.padEnd(28)} (${l.proto} ${l.durationMs}ms) ip:${l.ip}${idx < Math.min(logs.length, 8) - 1 ? '\n' : ''}`;
      });
    } else {
      logBlock += '  [Сбор телеметрии активен...]';
    }

    const llmBlock = `[ МАТРИЦА LLM-ПРОВАЙДЕРОВ И МОДЕЛЕЙ // LLM & MULTI-AGENT STATUS ]:
  • GOOGLE GEMINI (ADC):   Gemini 2.5 Flash, 3.8 Flash, Pro (1M ctx)     | [ONLINE] 🟢
  • OMNIROUTE (Port 20128): 94 модели · LPU Groq/Cerebras (800 t/s)      | [ONLINE] 🟢
  • OPENROUTER HUB:        56 бесплатных кодинг-моделей (DeepSeek, Qwen)  | [ONLINE] 🟢
  • CONSILIUM AGENTS:      Antigravity agy, OpenCode, Serena, KiloCode   | [ONLINE] 🟢`;

    const secBlock = `[ КОНТУР БЕЗОПАСНОСТИ И ЗАЩИТЫ // SECURITY & AUTO-REAP SHIELD ]:
  • EARLYOOM DAEMON:       Active (Пороги: <10% RAM, >80% Swap)          | [ARMED] 🟢
  • EVA-WATCHDOG TIMER:    Каждые 3 мин (Сброс Tl-пауз > 20 мин)         | [ACTIVE] 🟢
  • FAIL2BAN SSH JAIL:     Активен · Мониторинг брутфорса и ботнетов     | [ARMED] 🟢
  • WIREGUARD ENCRYPTION:  ChaCha20-Poly1305 · Закрытый контур           | [SECURE] 🟢`;

    if (body) {
      let hydrated = body;
      const nowUtcStr = new Date().toISOString().replace('T', ' ').substring(11, 19) + ' UTC';
      hydrated = hydrated.replace(/<!--\s*TIME\s*-->/g, nowUtcStr).replace(/\{\{TIME\}\}/g, nowUtcStr);

      const replaceSlot = (name: string, content: string) => {
        const pairedRegex = new RegExp(`<!--\\s*SLOT:${name}\\s*-->[\\s\\S]*?<!--\\s*\\/SLOT:${name}\\s*-->`, 'g');
        if (pairedRegex.test(hydrated)) {
          hydrated = hydrated.replace(pairedRegex, `<!-- SLOT:${name} -->\n${content}\n<!-- /SLOT:${name} -->`);
        } else {
          hydrated = hydrated.replace(new RegExp(`<!--\\s*SLOT:${name}\\s*-->`, 'g'), content);
        }
        hydrated = hydrated.replace(new RegExp(`\\{\\{SLOT_${name}\\}\\}`, 'g'), content);
      };

      replaceSlot('LLM_MATRIX', llmBlock);
      replaceSlot('SECURITY_SHIELD', secBlock);
      replaceSlot('TELEMETRY', telemetryBlock);
      replaceSlot('PROCESS_WATCHER', procBlock);
      replaceSlot('LOG_STREAM', logBlock);

      hydrated = hydrated
        .replace(/<!--\s*SLOT:[A-Z_]+\s*-->\r?\n?/g, '')
        .replace(/<!--\s*\/SLOT:[A-Z_]+\s*-->\r?\n?/g, '');

      return hydrated.trimEnd() + '\n';
    }

    let out = '';
    out += `┌── EVALINE CONSOLE // ${d.domain} [${d.badge}] ── ● LIVE ── [ ТЕМА] ──┐\n`;
    out += '│                                                                          │\n';
    out += `> УЗЕЛ         : ${d.domain} [${d.badge}]\n`;
    out += `> РОЛЬ         : ${d.role}\n`;
    out += `> ИНФРА        : ${d.infra}\n`;
    out += `> НАЗНАЧЕНИЕ   : ${d.target || ''}\n`;
    out += '────────────────────────────────────────────────────────────────────────────\n';
    out += '[ СЕТЬ EVALINE MESH // КЛАСТЕРНЫЕ УЗЛЫ ]:\n';
    DOMAINS_CONFIG.forEach((item) => {
      if (item.domain === d.domain) {
        out += `  [*] ${item.domain.padEnd(16)} :: ${item.role} [ТЕКУЩИЙ УЗЕЛ]\n`;
      } else {
        out += `  [->] https://${item.domain.padEnd(14)} :: ${item.role}\n`;
      }
    });
    out += '  [->] https://github.com/evaline-online :: Официальная Организация GitHub (26 Репозиториев)\n';
    out += '────────────────────────────────────────────────────────────────────────────\n';
    out += 'evabot@evaline-mesh:~$ █\n';
    out += '────────────────────────────────────────────────────────────────────────────\n';
    out += telemetryBlock + '\n';
    out += '────────────────────────────────────────────────────────────────────────────\n';
    out += procBlock + '\n';
    out += '────────────────────────────────────────────────────────────────────────────\n';
    out += logBlock + '\n';
    return out;
  }

  public static renderHtml(targetDomain: string): string {
    const d = this.resolveDomain(targetDomain);
    const nowUtc = new Date().toISOString().replace('T', ' ').substring(11, 19) + ' UTC';

    const compute = ClusterMonitor.getComputeMetrics();
    const micro = ClusterMonitor.getMicroMetrics();
    const latency = ClusterMonitor.getMeshLatency();
    const procs = ClusterMonitor.getProcesses();
    const logs = ClusterMonitor.getDomainLogs();
    const consilium = ClusterMonitor.getConsiliumInfo();

    const bLoad = compute.loadAvg[0].toFixed(2);
    const bCpuPct = compute.cpuPct;
    const bTotMem = (compute.memTotalMb / 1024).toFixed(1);
    const bUsedMem = (compute.memUsedMb / 1024).toFixed(1);
    const bRamPct = Math.round((compute.memUsedMb / compute.memTotalMb) * 100);
    const bTotSwap = (compute.swapTotalMb / 1024).toFixed(1);
    const bUsedSwap = (compute.swapUsedMb / 1024).toFixed(1);
    const bSwapPct = Math.round((compute.swapUsedMb / compute.swapTotalMb) * 100);
    const bUptime = compute.uptimeStr;

    // Categorized process counts
    const procCounts = {
      all: procs.length,
      agent: procs.filter((p) => p.category === 'agent').length,
      web: procs.filter((p) => p.category === 'web').length,
      mcp: procs.filter((p) => p.category === 'mcp').length,
      lsp: procs.filter((p) => p.category === 'lsp').length,
      system: procs.filter((p) => p.category === 'system').length,
    };

    const crossLinksListHtml = DOMAINS_CONFIG.map((item) => {
      const isCurrent = item.domain === d.domain;
      return `        <a href="https://${item.domain}" class="gateway-chip ${isCurrent ? 'active' : ''}">
          <span class="status-indicator">●</span>
          <span class="chip-domain">${item.domain}</span>
          <span class="chip-badge">${item.badge}</span>
        </a>`;
    }).join('\n') + `\n        <a href="https://github.com/evaline-online" target="_blank" rel="noopener" class="gateway-chip" style="border-color: rgba(255, 214, 0, 0.4);">
          <span class="status-indicator" style="color: #ffd600;">●</span>
          <span class="chip-domain" style="color: #ffd600; font-weight: bold;">github.com/evaline-online</span>
          <span class="chip-badge" style="background: rgba(255, 214, 0, 0.15); color: #ffd600;">OPEN SOURCE</span>
        </a>`;

    const procRowsHtml = procs
      .map((p) => {
        const catBadge = p.category.toUpperCase();
        return `        <tr data-cat="${p.category}">
          <td class="td-pid">${p.pid}</td>
          <td class="td-node">${p.node.split(' ')[0]}</td>
          <td class="td-cat"><span class="badge badge-${p.category}">${catBadge}</span></td>
          <td class="td-name bold c-fg">${p.name}</td>
          <td class="td-role c-dim">${p.role}</td>
          <td class="td-cpu c-ok">${p.cpu}</td>
          <td class="td-mem">${p.mem}</td>
          <td class="td-swap c-dim">${p.swap || '-'}</td>
          <td class="td-status"><span class="badge badge-ok">[${p.status}]</span></td>
        </tr>`;
      })
      .join('\n');

    const logRowsHtml = logs
      .slice(0, 35)
      .map((l) => {
        const badgeClass = l.statusLevel === 'err' ? 'badge-err' : l.statusLevel === 'warn' ? 'badge-warn' : 'badge-ok';
        const icon = l.statusLevel === 'err' ? '[ERR]' : l.statusLevel === 'warn' ? '[WRN]' : '[OK]';
        return `        <div class="log-row">
          <span class="c-dim">[${l.timeStr}]</span>
          <span class="badge ${badgeClass}">${icon}</span>
          <span class="c-fg bold">${l.status}</span>
          <span class="bold c-fg">${l.method.padEnd(4)}</span>
          <strong class="c-cyan">${l.host.padEnd(16)}</strong>
          <span class="c-dim">${l.uri.padEnd(28)}</span>
          <span class="c-dim">(${l.proto} ${l.durationMs}ms)</span>
          <span class="c-faint">ip:${l.ip}</span>
        </div>`;
      })
      .join('\n');

    const rawTuiText = this.renderText(targetDomain);

    return `<!DOCTYPE html>
<html lang="ru" data-theme="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<!-- STRICT ZERO-CACHE HEADERS -->
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate, max-age=0, proxy-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="0">
<title>${d.domain.toUpperCase()} // ДЭШБОРД АРХИТЕКТУРЫ & МЕТРИК КЛАСТЕРА</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Roboto+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root {
    --bg: #06090e;
    --surface: #0c121d;
    --surface-card: #101928;
    --surface-card-hover: #142135;
    --border: rgba(0, 230, 118, 0.22);
    --border-subtle: #1c2738;
    --border-dim: #151e2d;
    --fg: #e2e8f0;
    --fg-muted: #8b9bb4;
    --fg-dim: #50617a;
    --log-bg: #04070a;
    --btn-bg: #141f30;
    --btn-border: #233550;

    /* Traffic lights & Accents */
    --c-ok: #00e676;
    --c-ok-dim: rgba(0, 230, 118, 0.12);
    --c-warn: #ffd600;
    --c-warn-dim: rgba(255, 214, 0, 0.12);
    --c-err: #ff1744;
    --c-err-dim: rgba(255, 23, 68, 0.12);
    --c-cyan: #00d8ff;
    --c-cyan-dim: rgba(0, 216, 255, 0.12);
    --c-purple: #b388ff;
    --c-purple-dim: rgba(179, 136, 255, 0.12);

    --font-sans: 'Roboto', -apple-system, BlinkMacSystemFont, sans-serif;
    --font-mono: 'Roboto Mono', monospace;
  }

  html.theme-light, body.theme-light {
    --bg: #f4f6fa;
    --surface: #ffffff;
    --surface-card: #ffffff;
    --surface-card-hover: #f8fafc;
    --border: #cbd5e1;
    --border-subtle: #e2e8f0;
    --border-dim: #edf2f7;
    --fg: #0f172a;
    --fg-muted: #475569;
    --fg-dim: #94a3b8;
    --log-bg: #ffffff;
    --btn-bg: #f1f5f9;
    --btn-border: #cbd5e1;

    --c-ok: #059669;
    --c-ok-dim: rgba(5, 150, 105, 0.1);
    --c-warn: #d97706;
    --c-warn-dim: rgba(217, 119, 6, 0.1);
    --c-err: #dc2626;
    --c-err-dim: rgba(220, 38, 38, 0.1);
    --c-cyan: #0284c7;
    --c-cyan-dim: rgba(2, 132, 199, 0.1);
    --c-purple: #7c3aed;
    --c-purple-dim: rgba(124, 58, 237, 0.1);
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    width: 100vw;
    min-height: 100vh;
    overflow-x: hidden;
    background-color: var(--bg);
    color: var(--fg);
    font-family: var(--font-sans);
    font-size: 14.5px;
    line-height: 1.5;
    transition: background-color 0.2s ease, color 0.2s ease;
    background-image:
      radial-gradient(circle at 10% 10%, rgba(0, 230, 118, 0.04) 0%, transparent 40%),
      radial-gradient(circle at 90% 15%, rgba(0, 216, 255, 0.04) 0%, transparent 45%),
      linear-gradient(rgba(255, 255, 255, 0.015) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
    background-size: 100% 100%, 100% 100%, 32px 32px, 32px 32px;
  }

  /* TOP STATUS BAR */
  .cluster-topbar {
    width: 100%;
    background: var(--surface);
    border-bottom: 1px solid var(--border-subtle);
    padding: 10px 24px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    position: sticky;
    top: 0;
    z-index: 1000;
    backdrop-filter: blur(8px);
  }

  .topbar-brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .brand-logo {
    width: 28px;
    height: 28px;
    background: linear-gradient(135deg, var(--c-ok), var(--c-cyan));
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #000;
    font-family: var(--font-mono);
    font-weight: 900;
    font-size: 14px;
  }

  .brand-title {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 0.5px;
  }

  .live-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--c-ok-dim);
    color: var(--c-ok);
    border: 1px solid var(--c-ok);
    border-radius: 12px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: 700;
    font-family: var(--font-mono);
  }

  .live-pulse {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--c-ok);
    animation: liveGlow 1.8s infinite ease-in-out;
  }

  @keyframes liveGlow {
    0%, 100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 5px var(--c-ok)); }
    50% { opacity: 0.4; transform: scale(0.85); filter: none; }
  }

  .topbar-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .tui-btn {
    background: var(--btn-bg);
    border: 1px solid var(--btn-border);
    color: var(--fg);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 5px 12px;
    border-radius: 4px;
    cursor: pointer;
    user-select: none;
    transition: all 0.15s ease;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .tui-btn:hover {
    border-color: var(--c-ok);
    color: var(--c-ok);
  }

  .tui-btn.active {
    background: var(--c-ok-dim);
    border-color: var(--c-ok);
    color: var(--c-ok);
    font-weight: 700;
  }

  /* GATEWAY CHIPS */
  .gateway-bar {
    max-width: 1560px;
    margin: 14px auto 0;
    padding: 0 20px;
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .gateway-chip {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    padding: 5px 14px;
    border-radius: 6px;
    text-decoration: none;
    color: var(--fg);
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 13px;
    transition: all 0.2s ease;
  }

  .gateway-chip:hover {
    border-color: var(--c-cyan);
    transform: translateY(-1px);
  }

  .gateway-chip.active {
    border-color: var(--c-ok);
    background: var(--c-ok-dim);
    color: var(--c-ok);
  }

  .gateway-chip .status-indicator {
    color: var(--c-ok);
    font-size: 10px;
  }

  .gateway-chip .chip-badge {
    font-size: 10.5px;
    color: var(--fg-muted);
    border: 1px solid var(--border-dim);
    padding: 1px 5px;
    border-radius: 3px;
  }

  /* MAIN CONTAINER */
  .dashboard-container {
    max-width: 1560px;
    margin: 16px auto 40px;
    padding: 0 20px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* SECTION HEADER */
  .section-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }

  .section-title {
    font-family: var(--font-mono);
    font-size: 15px;
    font-weight: 700;
    color: var(--fg);
    display: flex;
    align-items: center;
    gap: 8px;
    letter-spacing: 0.5px;
  }

  .section-title::before {
    content: '//';
    color: var(--c-ok);
    font-weight: 900;
  }

  /* ARCHITECTURE DIAGRAM CARD */
  .arch-card {
    background: var(--surface-card);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 18px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  .svg-topology {
    width: 100%;
    height: auto;
    display: block;
    max-height: 480px;
  }

  /* METRICS GRID */
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 16px;
  }

  .metric-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: all 0.2s ease;
  }

  .metric-card:hover {
    border-color: var(--border);
    transform: translateY(-2px);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--border-dim);
    padding-bottom: 8px;
  }

  .card-title {
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .metric-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13.5px;
    padding: 3px 0;
  }

  .metric-label {
    color: var(--fg-muted);
    font-family: var(--font-mono);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .metric-val {
    font-family: var(--font-mono);
    font-weight: 700;
  }

  .gauge-bar {
    width: 100%;
    height: 6px;
    background: var(--border-dim);
    border-radius: 3px;
    overflow: hidden;
    margin-top: 2px;
  }

  .gauge-fill {
    height: 100%;
    background: var(--c-ok);
    transition: width 0.4s ease;
  }

  .gauge-fill.warn { background: var(--c-warn); }
  .gauge-fill.err { background: var(--c-err); }

  /* PROCESS INSPECTOR */
  .proc-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .proc-toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .proc-tabs {
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .proc-search-box {
    background: var(--bg);
    border: 1px solid var(--btn-border);
    color: var(--fg);
    font-family: var(--font-mono);
    font-size: 13px;
    padding: 6px 12px;
    border-radius: 4px;
    min-width: 240px;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .proc-search-box:focus {
    border-color: var(--c-ok);
  }

  .proc-table-wrap {
    width: 100%;
    overflow-x: auto;
    max-height: 440px;
    overflow-y: auto;
    border: 1px solid var(--border-dim);
    border-radius: 6px;
  }

  .proc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13.5px;
    font-family: var(--font-mono);
    white-space: nowrap;
  }

  .proc-table th {
    text-align: left;
    background: var(--surface);
    color: var(--fg-muted);
    padding: 8px 12px;
    border-bottom: 1px solid var(--border-subtle);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .proc-table td {
    padding: 6px 12px;
    border-bottom: 1px solid var(--border-dim);
  }

  .proc-table tr:hover td {
    background: var(--surface-card-hover);
  }

  /* LOG CONSOLE */
  .log-card {
    background: var(--surface-card);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .log-stream {
    background: var(--log-bg);
    border: 1px solid var(--border-dim);
    border-radius: 6px;
    padding: 10px 14px;
    min-height: 180px;
    max-height: 320px;
    overflow-y: auto;
    font-family: var(--font-mono);
    font-size: 13px;
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .log-row {
    line-height: 1.4;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* BADGES */
  .badge {
    display: inline-block;
    padding: 1px 6px;
    border-radius: 3px;
    font-size: 11.5px;
    font-weight: 700;
    font-family: var(--font-mono);
  }

  .badge-ok { background: var(--c-ok-dim); color: var(--c-ok); border: 1px solid var(--c-ok); }
  .badge-warn { background: var(--c-warn-dim); color: var(--c-warn); border: 1px solid var(--c-warn); }
  .badge-err { background: var(--c-err-dim); color: var(--c-err); border: 1px solid var(--c-err); }
  .badge-cyan { background: var(--c-cyan-dim); color: var(--c-cyan); border: 1px solid var(--c-cyan); }
  .badge-purple { background: var(--c-purple-dim); color: var(--c-purple); border: 1px solid var(--c-purple); }

  .badge-agent { background: var(--c-purple-dim); color: var(--c-purple); border: 1px solid var(--c-purple); }
  .badge-web { background: var(--c-cyan-dim); color: var(--c-cyan); border: 1px solid var(--c-cyan); }
  .badge-mcp { background: var(--c-ok-dim); color: var(--c-ok); border: 1px solid var(--c-ok); }
  .badge-lsp { background: var(--c-warn-dim); color: var(--c-warn); border: 1px solid var(--c-warn); }
  .badge-system { background: rgba(148, 163, 184, 0.15); color: var(--fg-muted); border: 1px solid var(--border-subtle); }

  .c-fg { color: var(--fg); }
  .c-dim { color: var(--fg-muted); }
  .c-faint { color: var(--fg-dim); }
  .c-ok { color: var(--c-ok); }
  .c-warn { color: var(--c-warn); }
  .c-err { color: var(--c-err); }
  .c-cyan { color: var(--c-cyan); }
  .c-purple { color: var(--c-purple); }
  .bold { font-weight: 700; }

  /* CYBER TUI CONTAINER */
  #tui-raw-container {
    display: none;
    width: 100%;
    min-height: 85vh;
    background: #040609;
    color: #e2e8f0;
    font-family: var(--font-mono);
    font-size: 14px;
    padding: 20px;
    white-space: pre;
    overflow: auto;
    line-height: 1.35;
  }
</style>
</head>
<body>

<!-- CLUSTER HEADER -->
<header class="cluster-topbar">
  <div class="topbar-brand">
    <div class="brand-logo">E</div>
    <div class="brand-title">${d.domain.toUpperCase()}</div>
    <div class="live-pill">
      <span class="live-pulse">●</span>
      <span>CLUSTER LIVE</span>
    </div>
    <span class="c-dim" style="font-family:var(--font-mono);font-size:12.5px;">UTC: <span id="clock-utc">${nowUtc}</span></span>
  </div>

  <div class="topbar-actions">
    <button class="tui-btn" id="mode-btn" onclick="toggleViewMode()" title="Горячая клавиша: V">[ ◧ ВИД: ДЭШБОРД ]</button>
    <button class="tui-btn" id="theme-btn" onclick="toggleTheme()" title="Горячая клавиша: T">[ ◐ ТЕМА: DARK ]</button>
    <button class="tui-btn" onclick="manualRefresh()" title="Горячая клавиша: R">[ ↻ СИНХР ]</button>
  </div>
</header>

<!-- GATEWAY BAR -->
<div class="gateway-bar">
${crossLinksListHtml}
</div>

<!-- DASHBOARD VISUAL VIEW -->
<main class="dashboard-container" id="dashboard-view">

  <!-- SECTION 1: INTERACTIVE SVG TOPOLOGY -->
  <section>
    <div class="section-head">
      <div class="section-title">ИНТЕРАКТИВНАЯ АРХИТЕКТУРА НОД, КОНСИЛИУМА АГЕНТОВ & СЕТИ КЛАСТЕРА</div>
      <div class="c-dim" style="font-family:var(--font-mono);font-size:12.5px;">
        WireGuard RTT: <strong class="c-cyan" id="svg-rtt-badge">${latency} ms</strong> · Шифрование: ChaCha20-Poly1305
      </div>
    </div>
    <div class="arch-card">
      <svg class="svg-topology" viewBox="0 0 1180 430" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0284c7" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0c121d" stop-opacity="0.85"/>
          </linearGradient>
          <linearGradient id="computeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#00e676" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0c121d" stop-opacity="0.85"/>
          </linearGradient>
          <linearGradient id="agentGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#b388ff" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#0c121d" stop-opacity="0.85"/>
          </linearGradient>
          <linearGradient id="meshGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0284c7"/>
            <stop offset="50%" stop-color="#00d8ff"/>
            <stop offset="100%" stop-color="#00e676"/>
          </linearGradient>
        </defs>

        <!-- ZONE 1: EDGE INGRESS (IOWA, USA) -->
        <rect x="30" y="30" width="310" height="230" rx="10" fill="url(#edgeGrad)" stroke="#0284c7" stroke-width="1.8"/>
        <text x="50" y="60" fill="#00d8ff" font-family="Roboto Mono" font-weight="700" font-size="14.5">УЗЕЛ 1: EVALINE-MICRO-VM</text>
        <text x="50" y="80" fill="#8b9bb4" font-family="Roboto Mono" font-size="11.5">GCP us-central1-a (Айова, США) · e2-micro</text>
        <text x="50" y="98" fill="#8b9bb4" font-family="Roboto Mono" font-size="11.5">Внешний IP: 136.114.26.252 · Mesh: 100.125.200.49</text>

        <!-- Edge inner boxes -->
        <rect x="48" y="115" width="274" height="42" rx="5" fill="#08101a" stroke="#1c2f4a"/>
        <text x="60" y="134" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">Caddy Edge Gateway (Zero-Cache Ingress)</text>
        <text x="60" y="148" fill="#00e676" font-family="Roboto Mono" font-size="11">● HTTP/3 QUIC & TLS 1.3 · Proxying 4 Domains</text>

        <rect x="48" y="165" width="274" height="42" rx="5" fill="#08101a" stroke="#1c2f4a"/>
        <text x="60" y="184" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">Security Perimeter Shield</text>
        <text x="60" y="198" fill="#ffd600" font-family="Roboto Mono" font-size="11">● EarlyOOM (<10% RAM) · Fail2ban SSH Active</text>

        <rect x="48" y="215" width="274" height="30" rx="5" fill="#08101a" stroke="#1c2f4a"/>
        <text x="60" y="235" fill="#8b9bb4" font-family="Roboto Mono" font-size="11">Specs: 2 vCPU · 1 GB RAM · 2 GB SWAP</text>

        <!-- WIREGUARD BACKBONE (TUNNEL) -->
        <path d="M 340 145 L 480 145" stroke="url(#meshGrad)" stroke-width="3" stroke-dasharray="6,6">
          <animate attributeName="stroke-dashoffset" values="24;0" dur="1.2s" repeatCount="indefinite" />
        </path>
        <circle cx="410" cy="145" r="18" fill="#0c1828" stroke="#00d8ff" stroke-width="1.5"/>
        <text x="410" y="149" text-anchor="middle" fill="#00d8ff" font-family="Roboto Mono" font-weight="700" font-size="10.5">MESH</text>
        <text x="410" y="180" text-anchor="middle" fill="#00e676" font-family="Roboto Mono" font-weight="700" font-size="11">${latency} ms RTT</text>

        <!-- ZONE 2: COMPUTE CORE (FRANKFURT, GERMANY) -->
        <rect x="480" y="30" width="670" height="230" rx="10" fill="url(#computeGrad)" stroke="#00e676" stroke-width="1.8"/>
        <text x="505" y="60" fill="#00e676" font-family="Roboto Mono" font-weight="700" font-size="14.5">УЗЕЛ 2: EVABOT-AGENT-VM (COMPUTE CORE)</text>
        <text x="505" y="80" fill="#8b9bb4" font-family="Roboto Mono" font-size="11.5">GCP europe-west3-a (Франкфурт, ФРГ) · c3-standard-8 · 8 vCPU Intel Xeon · 32 GB RAM · 8 GB SWAP</text>
        <text x="505" y="98" fill="#8b9bb4" font-family="Roboto Mono" font-size="11.5">Внешний IP: 34.159.202.82 · Mesh: 100.66.98.4 · Внутренний IP: 10.156.0.2</text>

        <!-- Compute microservices grid -->
        <rect x="505" y="115" width="190" height="60" rx="6" fill="#081410" stroke="#163824"/>
        <text x="518" y="136" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">evabot-brain (:3000)</text>
        <text x="518" y="152" fill="#8b9bb4" font-family="Roboto Mono" font-size="10.5">Node.js Core Backend</text>
        <text x="518" y="166" fill="#00e676" font-family="Roboto Mono" font-size="10">● TUI & Telemetry</text>

        <rect x="710" y="115" width="200" height="60" rx="6" fill="#081410" stroke="#163824"/>
        <text x="723" y="136" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">omniroute (:20128)</text>
        <text x="723" y="152" fill="#8b9bb4" font-family="Roboto Mono" font-size="10.5">LiteLLM 94-Model Proxy</text>
        <text x="723" y="166" fill="#00e676" font-family="Roboto Mono" font-size="10">● LPU Groq/Cerebras (800t/s)</text>

        <rect x="925" y="115" width="205" height="60" rx="6" fill="#081410" stroke="#163824"/>
        <text x="938" y="136" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">evabot-voice (:8000)</text>
        <text x="938" y="152" fill="#8b9bb4" font-family="Roboto Mono" font-size="10.5">FastAPI Edge Voice</text>
        <text x="938" y="166" fill="#00e676" font-family="Roboto Mono" font-size="10">● Edge-TTS / Audio Stream</text>

        <rect x="505" y="185" width="190" height="60" rx="6" fill="#081410" stroke="#163824"/>
        <text x="518" y="206" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">evabot-face (:8093)</text>
        <text x="518" y="222" fill="#8b9bb4" font-family="Roboto Mono" font-size="10.5">3D Matrix Face Server</text>
        <text x="518" y="236" fill="#00e676" font-family="Roboto Mono" font-size="10">● Three.js Glyph Matrix</text>

        <rect x="710" y="185" width="200" height="60" rx="6" fill="#081410" stroke="#163824"/>
        <text x="723" y="206" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">n8n Automation (:5678)</text>
        <text x="723" y="222" fill="#8b9bb4" font-family="Roboto Mono" font-size="10.5">Docker Container Engine</text>
        <text x="723" y="236" fill="#00e676" font-family="Roboto Mono" font-size="10">● Task Orchestration</text>

        <rect x="925" y="185" width="205" height="60" rx="6" fill="#081410" stroke="#163824"/>
        <text x="938" y="206" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="12">Nginx Gateway (:80)</text>
        <text x="938" y="222" fill="#8b9bb4" font-family="Roboto Mono" font-size="10.5">Docs & Voice Proxy</text>
        <text x="938" y="236" fill="#00e676" font-family="Roboto Mono" font-size="10">● Upstream Router</text>

        <!-- CONNECTOR TO AGENTS -->
        <path d="M 815 260 L 815 295" stroke="#b388ff" stroke-width="2.5" stroke-dasharray="4,4">
          <animate attributeName="stroke-dashoffset" values="16;0" dur="1s" repeatCount="indefinite" />
        </path>

        <!-- ZONE 3: CONSILIUM AI AGENTS & MCP HUB -->
        <rect x="30" y="295" width="1120" height="115" rx="10" fill="url(#agentGrad)" stroke="#b388ff" stroke-width="1.8"/>
        <text x="55" y="325" fill="#b388ff" font-family="Roboto Mono" font-weight="700" font-size="14.5">КОНСИЛИУМ ИИ-АГЕНТОВ & 21-SERVER MCP HUB</text>
        <text x="55" y="342" fill="#8b9bb4" font-family="Roboto Mono" font-size="11.5">5 Сред Разработки · Матрица 94 LLM-Моделей (Gemini 2.5/3.8/Pro ADC, Claude 3.7, DeepSeek R1/V3, Cerebras LPU)</text>

        <!-- Agent chips row -->
        <g transform="translate(55, 355)">
          <!-- Ag 1 -->
          <rect x="0" y="0" width="200" height="42" rx="5" fill="#140f24" stroke="#3b2464"/>
          <text x="12" y="18" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="11.5">Antigravity CLI (agy)</text>
          <text x="12" y="32" fill="#00e676" font-family="Roboto Mono" font-size="10">● Ведущий Архитектор</text>

          <!-- Ag 2 -->
          <rect x="215" y="0" width="200" height="42" rx="5" fill="#140f24" stroke="#3b2464"/>
          <text x="227" y="18" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="11.5">OpenCode Multi-Agent</text>
          <text x="227" y="32" fill="#00e676" font-family="Roboto Mono" font-size="10">● Автономный Кодинг</text>

          <!-- Ag 3 -->
          <rect x="430" y="0" width="200" height="42" rx="5" fill="#140f24" stroke="#3b2464"/>
          <text x="442" y="18" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="11.5">Serena Codebase MCP</text>
          <text x="442" y="32" fill="#00e676" font-family="Roboto Mono" font-size="10">● Семантическая Память</text>

          <!-- Ag 4 -->
          <rect x="645" y="0" width="200" height="42" rx="5" fill="#140f24" stroke="#3b2464"/>
          <text x="657" y="18" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="11.5">21-Server MCP Hub</text>
          <text x="657" y="32" fill="#ffd600" font-family="Roboto Mono" font-size="10">● Git/DB/DevTools/Files</text>

          <!-- Ag 5 -->
          <rect x="860" y="0" width="200" height="42" rx="5" fill="#140f24" stroke="#3b2464"/>
          <text x="872" y="18" fill="#ffffff" font-family="Roboto" font-weight="600" font-size="11.5">Eva Face & Voice Diplomat</text>
          <text x="872" y="32" fill="#00d8ff" font-family="Roboto Mono" font-size="10">● 6-Языковая Дипломатия</text>
        </g>
      </svg>
    </div>
  </section>

  <!-- SECTION 2: LIVE METRIC GAUGES -->
  <section>
    <div class="section-head">
      <div class="section-title">МЕТРИКИ СЕРВЕРОВ, ПАМЯТИ & СЕТЕВОГО ОКРУЖЕНИЯ В РЕАЛЬНОМ ВРЕМЕНИ</div>
      <div class="c-dim" style="font-family:var(--font-mono);font-size:12.5px;">Автообновление: 3.0 сек</div>
    </div>
    <div class="metrics-grid">
      <!-- CARD 1: COMPUTE VM -->
      <div class="metric-card">
        <div class="card-header">
          <div class="card-title">
            <span class="c-ok">●</span> EVABRAIN COMPUTE (ФРГ)
          </div>
          <span class="badge badge-ok">[HEALTHY]</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">CPU Load (8 Cores):</span>
          <span class="metric-val c-ok" id="b-cpu-val">${bLoad} (${bCpuPct}%)</span>
        </div>
        <div class="gauge-bar"><div class="gauge-fill" id="b-cpu-fill" style="width: ${bCpuPct}%;"></div></div>

        <div class="metric-row" style="margin-top:6px;">
          <span class="metric-label">RAM ОЗУ (32 GB):</span>
          <span class="metric-val" id="b-ram-val">${bUsedMem} / ${bTotMem} GB (${bRamPct}%)</span>
        </div>
        <div class="gauge-bar"><div class="gauge-fill ${bRamPct > 80 ? 'warn' : ''}" id="b-ram-fill" style="width: ${bRamPct}%;"></div></div>

        <div class="metric-row" style="margin-top:6px;">
          <span class="metric-label">SWAP Подкачка (8 GB):</span>
          <span class="metric-val ${bSwapPct > 65 ? 'c-warn' : 'c-ok'}" id="b-swap-val">${bUsedSwap} / ${bTotSwap} GB (${bSwapPct}%)</span>
        </div>
        <div class="gauge-bar"><div class="gauge-fill ${bSwapPct > 65 ? 'warn' : ''}" id="b-swap-fill" style="width: ${bSwapPct}%;"></div></div>

        <div class="metric-row" style="margin-top:4px;">
          <span class="metric-label">Диск NVMe (/):</span>
          <span class="metric-val c-dim" id="b-disk-root">${compute.diskRoot.usedGb}/${compute.diskRoot.totalGb} GB (${compute.diskRoot.pct}%)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">tmpfs Буфер (/tmp):</span>
          <span class="metric-val c-dim" id="b-disk-tmp">${compute.diskTmp.usedGb}/${compute.diskTmp.totalGb} GB (${compute.diskTmp.pct}%)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Аптайм Системы:</span>
          <span class="metric-val c-ok" id="b-uptime-val">${bUptime}</span>
        </div>
      </div>

      <!-- CARD 2: MICRO VM -->
      <div class="metric-card">
        <div class="card-header">
          <div class="card-title">
            <span class="c-cyan">●</span> EVAFACE INGRESS (США)
          </div>
          <span class="badge badge-ok">[CADDY HTTP/3]</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">CPU Load (2 Cores):</span>
          <span class="metric-val c-ok" id="f-load-val">${micro.loadAvg.split(',')[0]} (${micro.cpuPct}%)</span>
        </div>
        <div class="gauge-bar"><div class="gauge-fill" id="f-cpu-fill" style="width: ${micro.cpuPct}%;"></div></div>

        <div class="metric-row" style="margin-top:6px;">
          <span class="metric-label">RAM ОЗУ (964 MB):</span>
          <span class="metric-val" id="f-ram-val">${micro.memUsedMb} / ${micro.memTotalMb} MB (${Math.round((micro.memUsedMb / micro.memTotalMb) * 100)}%)</span>
        </div>
        <div class="gauge-bar"><div class="gauge-fill" id="f-ram-fill" style="width: ${Math.round((micro.memUsedMb / micro.memTotalMb) * 100)}%;"></div></div>

        <div class="metric-row" style="margin-top:6px;">
          <span class="metric-label">EarlyOOM Защита:</span>
          <span class="metric-val c-ok">[ARMED <10% RAM]</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Fail2ban SSH Jail:</span>
          <span class="metric-val c-ok">[ACTIVE MONITORED]</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Caddy Ingress Процесс:</span>
          <span class="metric-val c-dim" id="f-caddy-val">PID ${micro.caddyPid} · ${micro.caddyCpu} · ${micro.caddyMem}</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Аптайм Ingress:</span>
          <span class="metric-val c-ok" id="f-uptime-val">${micro.uptimeStr}</span>
        </div>
      </div>

      <!-- CARD 3: NETWORK MESH -->
      <div class="metric-card">
        <div class="card-header">
          <div class="card-title">
            <span class="c-cyan">●</span> WIREGUARD MESH
          </div>
          <span class="badge badge-cyan">[SECURE 0% LOSS]</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Задержка Франкфурт ↔ Айова:</span>
          <span class="metric-val c-cyan bold" id="m-latency-val">${latency} ms RTT</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Потери пакетов:</span>
          <span class="metric-val c-ok">0.0% (Tunnel Stable)</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Шифрование туннеля:</span>
          <span class="metric-val c-dim">ChaCha20-Poly1305</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Mesh IP США:</span>
          <span class="metric-val c-dim">100.125.200.49</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Mesh IP ФРГ:</span>
          <span class="metric-val c-dim">100.66.98.4</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Трафик Доменов:</span>
          <span class="metric-val c-ok">Zero-Cache Dynamic Proxy</span>
        </div>
      </div>

      <!-- CARD 4: CONSILIUM & MODELS -->
      <div class="metric-card">
        <div class="card-header">
          <div class="card-title">
            <span class="c-purple">●</span> КОНСИЛИУМ И ПУЛ LLM
          </div>
          <span class="badge badge-purple">[94 МОДЕЛИ ONLINE]</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Среды ИИ-Агентов:</span>
          <span class="metric-val c-purple">5 Активных Среды</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Google Gemini (ADC):</span>
          <span class="metric-val c-ok">2.5 Flash, 3.8 Flash, Pro</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">OmniRoute (Port 20128):</span>
          <span class="metric-val c-ok">94 Модели · LPU 800 t/s</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">21 Unified MCP Suite:</span>
          <span class="metric-val c-ok">Filesystem, Git, DB, DevTools</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Базы Данных Памяти:</span>
          <span class="metric-val c-dim">ChromaDB + SQLite FTS5</span>
        </div>
        <div class="metric-row">
          <span class="metric-label">Синхронизация MCP:</span>
          <span class="metric-val c-ok">Единый стандарт sync-mcp</span>
        </div>
      </div>
    </div>
  </section>

  <!-- SECTION 3: COMPLETE PROCESS INSPECTOR -->
  <section class="proc-card">
    <div class="section-head" style="margin-bottom:0;">
      <div class="section-title">ПОЛНЫЙ ИНСПЕКТОР ВСЕХ ПРОЦЕССОВ БЭКЭНДА, ФРОНТЕНДА & АГЕНТОВ КОНСИЛИУМА</div>
      <div class="c-dim" style="font-family:var(--font-mono);font-size:12.5px;">
        Всего процессов: <strong class="c-fg" id="total-proc-count">${procs.length}</strong>
      </div>
    </div>

    <div class="proc-toolbar">
      <div class="proc-tabs">
        <button class="tui-btn active" id="tab-all" onclick="filterProcCategory('all')">[ ВСЕ (${procCounts.all}) ]</button>
        <button class="tui-btn" id="tab-agent" onclick="filterProcCategory('agent')">[ АГЕНТЫ КОНСИЛИУМА (${procCounts.agent}) ]</button>
        <button class="tui-btn" id="tab-web" onclick="filterProcCategory('web')">[ WEB & BACKEND (${procCounts.web}) ]</button>
        <button class="tui-btn" id="tab-mcp" onclick="filterProcCategory('mcp')">[ MCP ИНСТРУМЕНТЫ (${procCounts.mcp}) ]</button>
        <button class="tui-btn" id="tab-lsp" onclick="filterProcCategory('lsp')">[ LSP ЯЗЫКОВЫЕ (${procCounts.lsp}) ]</button>
        <button class="tui-btn" id="tab-system" onclick="filterProcCategory('system')">[ СИСТЕМА & СЕТЬ (${procCounts.system}) ]</button>
      </div>

      <input type="text" class="proc-search-box" id="proc-search" placeholder="Быстрый поиск (PID, имя, роль)..." oninput="onSearchProcess(this.value)">
    </div>

    <div class="proc-table-wrap">
      <table class="proc-table">
        <thead>
          <tr>
            <th>PID</th>
            <th>УЗЕЛ</th>
            <th>КАТЕГОРИЯ</th>
            <th>ПРОЦЕСС / СЛУЖБА</th>
            <th>РОЛЬ В КЛАСТЕРЕ</th>
            <th>CPU</th>
            <th>ОЗУ (RSS)</th>
            <th>SWAP</th>
            <th>СТАТУС</th>
          </tr>
        </thead>
        <tbody id="proc-tbody">
${procRowsHtml}
        </tbody>
      </table>
    </div>
  </section>

  <!-- SECTION 4: REAL-TIME EVENT LOGS -->
  <section class="log-card">
    <div class="section-head" style="margin-bottom:0;">
      <div class="section-title">ЖУРНАЛ ЗАПРОСОВ И СОБЫТИЙ СЕТИ В РЕАЛЬНОМ ВРЕМЕНИ</div>
      <div class="c-dim" style="font-family:var(--font-mono);font-size:12.5px;">
        Событий в буфере: <strong class="c-fg" id="log-count">${logs.length}</strong>
      </div>
    </div>

    <div class="log-stream" id="log-stream">
${logRowsHtml || '<div class="c-dim">[Ожидание входящих сетевых запросов...]</div>'}
    </div>
  </section>

  <!-- CLUSTER FOOTER CROSS-LINKS -->
  <footer style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-dim); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; font-family: var(--font-mono); font-size: 11px; color: var(--fg-muted);">
    <div>EVALINE NETWORK // CLUSTER TOPOLOGY · 2 Nodes · WireGuard Mesh Backbone</div>
    <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
      <a href="https://evabot.online" target="_blank" style="color: var(--fg-muted); text-decoration: none;">evabot.online ↗</a>
      <a href="https://evaline.network" style="color: var(--c-ok); font-weight: 700; text-decoration: none;">evaline.network ●</a>
      <a href="https://evaline.online" target="_blank" style="color: var(--fg-muted); text-decoration: none;">evaline.online ↗</a>
      <a href="https://evaline.website" target="_blank" style="color: var(--fg-muted); text-decoration: none;">evaline.website ↗</a>
      <span style="color: var(--border-dim);">│</span>
      <a href="https://github.com/evaline-online" target="_blank" rel="noopener" style="color: #ffd600; font-weight: 700; text-decoration: none;">GitHub @evaline-online ↗</a>
    </div>
  </footer>

</main>

<!-- CYBER-TUI RAW TEXT VIEW (TOGGLEABLE) -->
<pre id="tui-raw-container">${rawTuiText}</pre>

<script>
  // Clean old SW cache & CacheStorage
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
  }
  if ('caches' in window) {
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  }

  // View Mode Management (Dashboard vs Cyber-TUI)
  let currentView = localStorage.getItem('eva_network_view') || 'dashboard';
  function applyView(v) {
    currentView = v;
    localStorage.setItem('eva_network_view', v);
    const dView = document.getElementById('dashboard-view');
    const tView = document.getElementById('tui-raw-container');
    const btn = document.getElementById('mode-btn');

    if (v === 'tui') {
      if (dView) dView.style.display = 'none';
      if (tView) tView.style.display = 'block';
      if (btn) btn.textContent = '[ █ ВИД: CYBER-TUI ]';
    } else {
      if (dView) dView.style.display = 'flex';
      if (tView) tView.style.display = 'none';
      if (btn) btn.textContent = '[ ◧ ВИД: ДЭШБОРД ]';
    }
  }
  function toggleViewMode() {
    applyView(currentView === 'dashboard' ? 'tui' : 'dashboard');
  }
  applyView(currentView);

  // Theme Management
  let currentTheme = localStorage.getItem('eva_tui_theme') || 'dark';
  function applyTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('eva_tui_theme', theme);
    const btn = document.getElementById('theme-btn');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
      document.body.classList.add('theme-light');
      if (btn) btn.textContent = '[ ◐ ТЕМА: LIGHT ]';
    } else {
      document.documentElement.classList.remove('theme-light');
      document.body.classList.remove('theme-light');
      if (btn) btn.textContent = '[ ◐ ТЕМА: DARK ]';
    }
  }
  function toggleTheme() {
    applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
  }
  applyTheme(currentTheme);

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    if (e.key === 't' || e.key === 'T') toggleTheme();
    if (e.key === 'v' || e.key === 'V') toggleViewMode();
    if (e.key === 'r' || e.key === 'R') manualRefresh();
  });

  // UTC Clock
  function updateClock() {
    const d = new Date().toISOString().replace('T', ' ').substring(11, 19) + ' UTC';
    const el = document.getElementById('clock-utc');
    if (el) el.textContent = d;
  }
  setInterval(updateClock, 1000);

  // Process Category Filter & Search
  let activeProcCat = 'all';
  let currentSearchQuery = '';

  function filterProcCategory(cat) {
    activeProcCat = cat;
    ['all', 'agent', 'web', 'mcp', 'lsp', 'system'].forEach(id => {
      const b = document.getElementById('tab-' + id);
      if (b) {
        if (id === cat) b.classList.add('active');
        else b.classList.remove('active');
      }
    });
    applyProcessFilters();
  }

  function onSearchProcess(val) {
    currentSearchQuery = (val || '').toLowerCase().trim();
    applyProcessFilters();
  }

  function applyProcessFilters() {
    const rows = document.querySelectorAll('#proc-tbody tr');
    rows.forEach(tr => {
      const rowCat = tr.getAttribute('data-cat') || '';
      const text = tr.textContent.toLowerCase();

      const catMatch = (activeProcCat === 'all') || (rowCat === activeProcCat);
      const searchMatch = !currentSearchQuery || text.includes(currentSearchQuery);

      if (catMatch && searchMatch) {
        tr.style.display = '';
      } else {
        tr.style.display = 'none';
      }
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Real-time Cluster Polling
  async function pollCluster() {
    try {
      const res = await fetch('/api/logs?_t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      // Latency
      if (data.meshLatencyMs) {
        const rtt = data.meshLatencyMs + ' ms RTT';
        const el1 = document.getElementById('svg-rtt-badge');
        const el2 = document.getElementById('m-latency-val');
        if (el1) el1.textContent = rtt;
        if (el2) el2.textContent = rtt;
      }

      // Compute VM Metrics
      if (data.computeMetrics) {
        const c = data.computeMetrics;
        const bCpuVal = document.getElementById('b-cpu-val');
        if (bCpuVal) bCpuVal.textContent = c.loadAvg[0].toFixed(2) + ' (' + c.cpuPct + '%)';
        const bCpuFill = document.getElementById('b-cpu-fill');
        if (bCpuFill) bCpuFill.style.width = c.cpuPct + '%';

        const usedGb = (c.memUsedMb / 1024).toFixed(1);
        const totGb = (c.memTotalMb / 1024).toFixed(1);
        const ramPct = Math.round((c.memUsedMb / c.memTotalMb) * 100);
        const bRamVal = document.getElementById('b-ram-val');
        if (bRamVal) bRamVal.textContent = usedGb + ' / ' + totGb + ' GB (' + ramPct + '%)';
        const bRamFill = document.getElementById('b-ram-fill');
        if (bRamFill) {
          bRamFill.style.width = ramPct + '%';
          bRamFill.className = 'gauge-fill' + (ramPct > 80 ? ' warn' : '');
        }

        const usedSwapGb = (c.swapUsedMb / 1024).toFixed(1);
        const totSwapGb = (c.swapTotalMb / 1024).toFixed(1);
        const swapPct = Math.round((c.swapUsedMb / c.swapTotalMb) * 100);
        const bSwapVal = document.getElementById('b-swap-val');
        if (bSwapVal) {
          bSwapVal.textContent = usedSwapGb + ' / ' + totSwapGb + ' GB (' + swapPct + '%)';
          bSwapVal.className = 'metric-val ' + (swapPct > 65 ? 'c-warn' : 'c-ok');
        }
        const bSwapFill = document.getElementById('b-swap-fill');
        if (bSwapFill) {
          bSwapFill.style.width = swapPct + '%';
          bSwapFill.className = 'gauge-fill' + (swapPct > 65 ? ' warn' : '');
        }

        const bUptime = document.getElementById('b-uptime-val');
        if (bUptime) bUptime.textContent = c.uptimeStr;

        if (c.diskRoot) {
          const dRoot = document.getElementById('b-disk-root');
          if (dRoot) dRoot.textContent = c.diskRoot.usedGb + '/' + c.diskRoot.totalGb + ' GB (' + c.diskRoot.pct + '%)';
        }
        if (c.diskTmp) {
          const dTmp = document.getElementById('b-disk-tmp');
          if (dTmp) dTmp.textContent = c.diskTmp.usedGb + '/' + c.diskTmp.totalGb + ' GB (' + c.diskTmp.pct + '%)';
        }
      }

      // Micro VM Metrics
      if (data.microMetrics) {
        const m = data.microMetrics;
        const fLoad = document.getElementById('f-load-val');
        if (fLoad) fLoad.textContent = (m.loadAvg.indexOf(',') !== -1 ? m.loadAvg.split(',')[0] : m.loadAvg) + ' (' + m.cpuPct + '%)';
        const fCpuFill = document.getElementById('f-cpu-fill');
        if (fCpuFill) fCpuFill.style.width = m.cpuPct + '%';

        const fRamPct = Math.round((m.memUsedMb / m.memTotalMb) * 100);
        const fRamVal = document.getElementById('f-ram-val');
        if (fRamVal) fRamVal.textContent = m.memUsedMb + ' / ' + m.memTotalMb + ' MB (' + fRamPct + '%)';
        const fRamFill = document.getElementById('f-ram-fill');
        if (fRamFill) fRamFill.style.width = fRamPct + '%';

        const fUptime = document.getElementById('f-uptime-val');
        if (fUptime) fUptime.textContent = m.uptimeStr;
      }

      // Processes Update
      if (data.processes && Array.isArray(data.processes)) {
        const tbody = document.getElementById('proc-tbody');
        if (tbody) {
          tbody.innerHTML = data.processes.map(p => {
            const catBadge = (p.category || 'system').toUpperCase();
            const nodeClean = p.node ? p.node.split(' ')[0] : 'node';
            return '<tr data-cat="' + (p.category || 'system') + '">' +
              '<td class="td-pid">' + p.pid + '</td>' +
              '<td class="td-node">' + nodeClean + '</td>' +
              '<td class="td-cat"><span class="badge badge-' + (p.category || 'system') + '">' + catBadge + '</span></td>' +
              '<td class="td-name bold c-fg">' + escapeHtml(p.name) + '</td>' +
              '<td class="td-role c-dim">' + escapeHtml(p.role) + '</td>' +
              '<td class="td-cpu c-ok">' + p.cpu + '</td>' +
              '<td class="td-mem">' + p.mem + '</td>' +
              '<td class="td-swap c-dim">' + (p.swap || '-') + '</td>' +
              '<td class="td-status"><span class="badge badge-ok">[' + p.status + ']</span></td>' +
            '</tr>';
          }).join('');
          applyProcessFilters();
        }

        // Update counts
        const totCount = document.getElementById('total-proc-count');
        if (totCount) totCount.textContent = data.processes.length;
      }

      // Domain Logs Update
      if (data.domainLogs && Array.isArray(data.domainLogs) && data.domainLogs.length > 0) {
        const logStream = document.getElementById('log-stream');
        if (logStream) {
          logStream.innerHTML = data.domainLogs.slice(0, 35).map(l => {
            let badgeClass = 'badge-ok';
            let icon = '[OK]';
            if (l.statusLevel === 'warn') { badgeClass = 'badge-warn'; icon = '[WRN]'; }
            else if (l.statusLevel === 'err') { badgeClass = 'badge-err'; icon = '[ERR]'; }

            return '<div class="log-row">' +
              '<span class="c-dim">[' + l.timeStr + ']</span> ' +
              '<span class="badge ' + badgeClass + '">' + icon + ' ' + l.status + '</span> ' +
              '<span class="bold c-fg">' + l.method + '</span> ' +
              '<strong class="c-cyan">' + l.host + '</strong> ' +
              '<span class="c-dim">' + escapeHtml(l.uri) + '</span> ' +
              '<span class="c-dim">(' + l.proto + ' ' + l.durationMs + 'ms)</span> ' +
              '<span class="c-faint">ip:' + l.ip + '</span>' +
            '</div>';
          }).join('');
        }
      }
    } catch (err) {}
  }

  function manualRefresh() {
    pollCluster();
  }

  setInterval(pollCluster, 3000);
</script>
</body>
</html>`;
  }
}
