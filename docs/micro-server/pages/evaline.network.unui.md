---
domain: evaline.network
badge: EDGE MESH & ARCHITECTURE
role: Визуализатор Архитектуры Кластера, Нод, Консилиума Агентов & Метрик Серверов
infra: evaline-micro-vm (США) ⟷ evabot-agent-vm (ФРГ) · WireGuard Mesh Backbone
target: Интерактивный дэшборд узлов, мониторинг ОЗУ, SWAP, CPU, бэкенда, микросервисов и агентов.
theme: dark
---

┌── EVALINE CONSOLE // evaline.network [EDGE MESH & ARCHITECTURE] ── ● LIVE ── [◐ ТЕМА] ──┐
│                                                                                          │
> УЗЕЛ         : evaline.network [EDGE MESH, DUAL-NODE ARCHITECTURE & AGENT CONSILIUM]
> РОЛЬ         : Визуализатор Архитектуры Кластера, Нод, Консилиума Агентов & Метрик Серверов
> ИНФРА        : evaline-micro-vm (США / Айова) ⟷ evabot-agent-vm (ФРГ / Франкфурт) · Mesh: 122ms
> НАЗНАЧЕНИЕ   : Интерактивный дэшборд узлов, мониторинг ОЗУ, SWAP, CPU, бэкенда и процессов.
────────────────────────────────────────────────────────────────────────────────────────────
[ СЕТЬ EVALINE MESH // КЛАСТЕРНЫЕ УЗЛЫ ]:
  [->] https://evabot.online   :: AI Вычислительное Ядро & Чат-терминал
  [*] evaline.network          :: Визуализатор Архитектуры, Нод & Процессов [ТЕКУЩИЙ УЗЕЛ]
  [->] https://evaline.online  :: Манифест Компании, Периметр Безопасности & Консилиум
  [->] https://evaline.website :: Единый Центр Входа, Репозитории & Инженерный Ворклог
  [->] https://github.com/evaline-online :: Официальная Организация GitHub (26 Репозиториев)
────────────────────────────────────────────────────────────────────────────────────────────
<!-- SLOT:TELEMETRY -->
[ РЕАЛЬНАЯ ТЕЛЕМЕТРИЯ ДВУХ СЕРВЕРОВ // REALTIME DUAL-NODE TELEMETRY ]:
  • EVABRAIN (Compute Core / ФРГ): CPU: 8.5 (100%) [■■■■■■■■■■] | RAM: 21.4/32 GB (67%) | SWAP: 3.1/8.0 GB (39%) | Uptime: 2d 19h | [HEALTHY] 🟢
  • EVAFACE  (Edge Ingress / США): Load: 0.25 (13%) [■□□□□□□□□□] | RAM: 440/964 MB (46%) | SWAP: 353 MB/2 GB | Uptime: 2 days | [Caddy HTTP/3 OK] 🟢
  • WIREGUARD MESH BACKBONE:       100.125.200.49 (US) ⟷ 100.66.98.4 (EU) | Latency: 122 ms RTT | Потери: [0.0%] 🟢
  • КОНСИЛИУМ И ПУЛ МОДЕЛЕЙ:       5 Агентов (Antigravity, OpenCode, Serena, KiloCode, Eva) | 94 модели онлайн | 21 MCP инструмент [ONLINE] 🟢
<!-- /SLOT:TELEMETRY -->
────────────────────────────────────────────────────────────────────────────────────────────
<!-- SLOT:LLM_MATRIX -->
[ МАТРИЦА LLM-ПРОВАЙДЕРОВ И МОДЕЛЕЙ // LLM & MULTI-AGENT STATUS ]:
  • GOOGLE GEMINI (ADC):   Gemini 2.5 Flash, 3.8 Flash, Pro (1M ctx)     | [ONLINE] 🟢
  • OMNIROUTE (Port 20128): 94 модели · LPU Groq/Cerebras (800 t/s)      | [ONLINE] 🟢
  • OPENROUTER HUB:        56 бесплатных кодинг-моделей (DeepSeek, Qwen)  | [ONLINE] 🟢
  • CONSILIUM AGENTS:      Antigravity CLI (agy), OpenCode, Serena, Kilo | [ONLINE] 🟢
<!-- /SLOT:LLM_MATRIX -->
────────────────────────────────────────────────────────────────────────────────────────────
<!-- SLOT:SECURITY_SHIELD -->
[ КОНТУР БЕЗОПАСНОСТИ И ЗАЩИТЫ // SECURITY & AUTO-REAP SHIELD ]:
  • EARLYOOM DAEMON:       Active (Пороги: <10% RAM, >80% Swap)          | [ARMED] 🟢
  • EVA-WATCHDOG TIMER:    Каждые 3 мин (Сброс Tl-пауз > 20 мин)         | [ACTIVE] 🟢
  • FAIL2BAN SSH JAIL:     Активен · Мониторинг брутфорса и ботнетов     | [ARMED] 🟢
  • WIREGUARD ENCRYPTION:  ChaCha20-Poly1305 · Закрытый контур           | [SECURE] 🟢
<!-- /SLOT:SECURITY_SHIELD -->
────────────────────────────────────────────────────────────────────────────────────────────
<!-- SLOT:PROCESS_WATCHER -->
[ РЕАЛЬНЫЕ ПРОЦЕССЫ КЛАСТЕРА // LIVE PROCESS WATCHER ]:
  PID     УЗЕЛ             КАТЕГОРИЯ   ПРОЦЕСС / СЛУЖБА             CPU    ОЗУ      СТАТУС
  32403   evaline-micro-vm [WEB]       caddy (Edge Ingress HTTP/3)  0.3%   54 MB    [HEALTHY] 🟢
  1850746 evabot-agent-vm  [WEB]       evabot-brain (Node.js :3000) 0.1%   128 MB   [HEALTHY] 🟢
  1095108 evabot-agent-vm  [WEB]       omniroute (LiteLLM 94 models)0.1%   967 MB   [HEALTHY] 🟢
  389265  evabot-agent-vm  [WEB]       evabot-voice (FastAPI :8000) 0.2%   42 MB    [HEALTHY] 🟢
  427660  evabot-agent-vm  [WEB]       evabot-face (3D Matrix :8093)0.1%   35 MB    [HEALTHY] 🟢
  169534  cluster-mesh     [SYSTEM]    tailscaled (WireGuard Mesh)  0.2%   82 MB    [OPERATIONAL] 🟢
  1871428 evabot-agent-vm  [AGENT]     agy (Antigravity CLI Agent)  1.2%   302 MB   [ACTIVE] 🟢
  1733732 evabot-agent-vm  [AGENT]     opencode (Parallel Dev Agent)4.5%   1280 MB  [ACTIVE] 🟢
  1870462 evabot-agent-vm  [AGENT]     serena-mcp (Codebase Agent)  0.2%   85 MB    [ACTIVE] 🟢
<!-- /SLOT:PROCESS_WATCHER -->
────────────────────────────────────────────────────────────────────────────────────────────
<!-- SLOT:LOG_STREAM -->
[ РЕАЛЬНЫЙ ЖУРНАЛ ЗАПРОСОВ И ЛОГИ СЕТИ // LIVE ACCESS & SYSTEM LOGS ]:
  [17:48:21] [OK] 200 GET  evaline.network  /api/logs (HTTP/3.0 122ms) ip:100.66.98.4
  [17:48:18] [OK] 200 GET  evabot.online    /api/health (HTTP/2.0 123ms) ip:100.125.200.49
  [17:48:15] [OK] 200 GET  evaline.online   /manifesto (HTTP/3.0 122ms) ip:34.159.202.82
<!-- /SLOT:LOG_STREAM -->
────────────────────────────────────────────────────────────────────────────────────────────
evabot@evaline-mesh:~$ █
