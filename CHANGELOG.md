# Changelog

All notable changes to EvaBot Online will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned — v0.3.0
- [ ] Voice input/output (TTS/STT)
- [ ] Audio streaming
- [ ] Chat export (PDF, Markdown)
- [ ] Multi-language UI improvements

### Planned — v0.4.0
- [ ] Mobile app (PWA)
- [ ] OAuth2 authentication
- [ ] Multi-user sessions
- [ ] Usage analytics
- [ ] Billing dashboard

---

## [v0.2.1] - 2026-09-09 — GCP SSH Security Hardening

### Added — Security
- **SSH Hardening**: firewall rule `allow-iap-ssh` restricted from `0.0.0.0/0` → `35.235.240.0/20` (IAP only)
- **OS Login enabled** (`enable-oslogin=TRUE`) — replaces legacy project-level SSH keys
- **Legacy SSH keys purged** from project metadata; access now identity-based via IAM
- **IAM bindings**: `roles/compute.osAdminLogin` granted to `evabot.online@gmail.com` and `olegzai.server@gmail.com`
- **Network tags**: `allow-iap-ssh` applied to both `evabot-agent-vm` and `evaline-micro-vm`
- **Documentation**: `docs/security/AUDIT-2026-09-09.md`, `docs/ops/SECURE_SSH_ACCESS.md`

| Metric | Before | After |
|--------|--------|-------|
| SSH port 22 from internet | Open (0.0.0.0/0) | Blocked |
| SSH through IAP tunnel | Available | Available |
| Access management | SSH keys in metadata | IAM (per-user) |
| Audit trail | No | Yes (Google identity) |

---

## [v0.2.0] - 2026-09-08 — Modular Architecture & Security Hardening

### Added
- **12 modular repos**: eva-brain, eva-voice, eva-face, eva-db, eva-history, eva-memory, evaline-consilium, evabot-server, eva-server, evaline-server, eva-docs, eva-reports
- **eva-docs**: unified documentation hub (architecture, ops, agents, domains, models, roadmap, security)
- **eva-reports**: chronological session reports with indexing
- **Branch protection** on all active repos' main branches (PR required + 1 approval)
- **GitHub Actions CI/CD**: automated build → sync-modules → deploy → smoke test
- **sync-modules.sh**: keeps monorepo and module repos in sync
- **Watchdog timer**: crash-loop detection with threshold alerting via systemd timer (5 min interval)
- **Uptime monitor**: cron-based health checks logging to `/var/log/evabot-uptime.log`

### Changed / Fixed
- **GitHub token hygiene**: removed embedded tokens (ghp_*) from all git remote URLs; switched to `gh auth` credential helper
- **GCP key redaction**: removed leaked API key from REPORT.md (GitHub Push Protection)
- **google-calendar MCP port conflict**: PORT 3000 → 3800 in opencode/kilo configs, resolves brain crash-loop
- **Removed release tarballs** from git history; added `backups/` to .gitignore
- **CompanyKnowledge sources** → `../eva-reports/reports/` (single source of truth)
- **docs-site/content** → symlink → eva-docs (eliminated content duplication)
- **MANIFESTO.md** → symlink (deduplicated from public/)
- **Single-viewport dashboard**: evaline.network zero-scroll layout (mobile-first 320px → desktop)

---

## [v0.1.0] - 2026-09-07 — Cyber-Terminal TUI, Frontier 3.8 Fleet, Accounting & Agent Factory

### Cyber-Terminal & TUI Isomorphism
- **Pure CRT Monospace TUI**: eliminated bloated cards and borders; strict 16px monospace layout in dark theme (`#0a0a0a`)
- **5-Line System Header**: Line 1 (Online + 1s Real-time Ping + Mesh RTT + Pulse Wave), Line 2 (Active Model + Mode + 78 Models Pool), Line 3 (Commands Bar), Line 4 (Databases OK), Line 5 (ASCII Load Bars CPU/RAM + Heartbeat)
- **Parity Across All Interfaces**: Browser, Node.js CLI (`terminal-chat.ts`), text browsers (Lynx/w3m), and `curl http://127.0.0.1:3000/`
- **Autoscroll Support**: automatic smooth scrolling to bottom during streaming chunks and message additions

### Frontier Fleet & Google Ecosystem
- **Gemini 3.8 Flash as Default #1**: Frontier 1M-context model with 100% Free Quota as primary engine
- **Search Grounding Guaranteed**: direct live web fact retrieval via Vertex AI Google Search Grounding with zero extra cost
- **Cascading Fallback Chain**: `gemini-3.8-flash` → `gemini-3.1-pro` → `gemini-3.1-flash` → `deepseek-r1:free` → `qwen-2.5-coder-32b:free`

### Accounting & Financial Ledger (`/cost`)
- **AccountingEngine**: tracks live token consumption, input/output cost, and calculated savings vs commercial flagships ($0.2250–$0.3000 saved per task)
- **Hardware OpEx Itemization**: Frankfurt Compute Core ($178.40), Iowa Edge Ingress ($7.14), Disks ($12.00), Mesh ($5.00), Subscriptions (Google AI Pro $20, Colab Pro $10, OpenRouter $25) = $257.54/mo ($0.3577/h)
- **Zero-Cost Unit Economics**: autonomous agents on Gemini 3.8 Flash / 3.1 Pro verified at $0.00

### Agent Constructor (`/company [free|paid]`)
- **AgentBuilder**: generates 10-agent autonomous corporations with defined missions, assigned models, and required MCP/LSP tools
- **100% Free Fleet**: 10 specialized agents on 100% free models
- **Commercial Frontier Fleet**: 10 specialized agents on Claude 3.7 Sonnet, OpenAI o1, GPT-4o, Codestral 2501, etc.
- **Model Technical Passports (`/info <model>`)**: full specifications, token costs, context limits, composite benchmark ratings

### MCP (21 Servers) & LSP (4 Servers) Integration
- **Commands `/mcp` & `/lsp`**: live status reporting of all 21 MCP servers and 4 Language Servers in PATH (TypeScript, Python, HTML/CSS/JSON, Markdown)

### Plugin System
- **Plugin Architecture**: autonomous plugins with dynamic loading; `PluginManager` (singleton, enable/disable, dependencies, health checks); `PluginEventBus` (pub/sub); `Plugin` interface with `manifest`, `initialize()`, `shutdown()`, `healthCheck()`; per-plugin API routes and CLI commands
- **LLMProvidersPlugin**: single gateway for 5 providers — Google AI (Gemini, free quota), OmniRoute (Internal LiteLLM Proxy), OpenRouter (78 models, free tier), OpenCode Go, KiloCode (free models aggregator)
- **ConsiliumPlugin**: Multi-Agent Engine (4 modes: solo, broadcast, dialogue, consilium)
- **KnowledgeBasePlugin**: EvaLine KB (178 documents, 6 languages)
- **API endpoints**: `/api/plugins`, `/api/plugins/health`, `/api/plugins/:id`, `/api/plugins/:id/enable|disable`, `/api/llm/providers`, `/api/llm/chat`, `/api/llm/test`

### Visualizer
- **`/visualize.html`**: interactive visualization of the whole system with live metrics, plugins, models, security, logs, architecture diagrams, and real-time updates every 10 seconds

### Tests
- **13 test suites, 100% pass rate** (ModelTests, ChatTests, ServerTests, CoreEngineTests, UniversalClientTests, ConsiliumTests, RolesTests, AnsiStreamEngineTests, PluginManagerTests, EventBusTests, LLMProvidersTests, KnowledgeBaseTests, ConsiliumNewTests, AccountingAndBuilderTests)
- 0 TypeScript errors (clean compile)

---

## [v0.0.2] - 2026-09-07 — Refactored & Hardened

### Added — Security
- **IP blocking system** with 8 pre-blocked malicious IPs (45.148.10.9, 43.157.188.74, etc.)
- **Rate limiting** middleware (100 req/min per IP)
- **17 regex patterns** for suspicious path detection (WordPress/.env/admin/etc)
- **Auto-block** mechanism: 20 suspicious requests → 24h ban
- **Security endpoints**: `GET/POST /api/security/{status,report,block,unblock}`

### Added — Knowledge Base
- **EvaLine Knowledge Base integration**: 182 documents loaded from `evaline-com-ua`
- **6 languages supported**: EN, UK, RU, PL, RO, DE
- **4 backend types**: memory (active), json, sqlite, vector
- **Full-text search** with relevance scoring
- **`/kb` command** and KB endpoints: `GET/POST /api/kb/{status,search,list,backend,command}`

### Added — Alerting System
- **Multi-channel alerts**: console, file, webhook, email, syslog, desktop
- **4 severity levels**: low, medium, high, critical
- **Rate limiting** (60s cooldown per alert type)
- **Alert endpoints**: `GET/POST /api/alerts/{stats,send,channel,config}`
- **Auto-integration** with Security module
- **Environment config**: `ALERT_WEBHOOK_URL`, `ALERT_EMAIL_TO`, `SYSLOG_HOST`

### Added — Comprehensive Logging
- **12 log categories**: SYSTEM, HTTP, USER, LLM, MODEL, KB, STORAGE, AUTH, PROCESS, DIAG, CLI, BROWSER
- **3 log files**: `evabot.log`, `user-actions-{date}.log`, `errors-{date}.log`
- **HTTP request logging** with IP, User-Agent, duration
- **In-memory buffer** (1000 entries)
- **Log endpoints**: `GET /api/logs/{files,read,recent}`

### Changed — Refactoring
- **server.ts refactored** from 815 → 211 lines (-74%)
- **Modular router architecture**: 7 separate route files on a `Router.ts` base class with `RouteContext` + `withErrorHandling`
- ChatRouter (89 lines), ModelsRouter (55), KbRouter (70), LogsRouter (30), SecurityRouter (39), AlertsRouter (41)

### Fixed — Critical Bugs
- **ConsiliumEngine.ts** fixed (12 TypeScript errors → 0): added `ModelRegistry.estimateTokens()`, `ModelRegistry.calculateCost()`, `ModelRegistry.getTop10FreeModels()`, `ModelRegistry.getTop10PaidSmartestModels()`, `TokenCostEstimate` interface
- **UniversalLlmClient.ts**: removed invalid `tier === 'OpenRouter Paid'` check
- **KB JSON.stringify** crash on Set serialization: replaced recursive `getBackendDescription()` with static lookup; `Set` → `Array.from()`

### Removed
- **`dist/` from Git** (1.3 MB, 114 files), **`legacy_archive/`** (17 MB, 32 files), **`src/plugins/voice/`**, **`src/web/voice/`**, **`.env.bak`** with potential secrets

### Added — Ops
- **`config/Caddyfile`** — production reverse proxy with WAF, rate limits, security headers
- **`config/fail2ban-filter.conf`** + **`fail2ban-jail.conf`** (2 jails: attack + rate)
- **`.github/workflows/deploy.yml`** — CI/CD for 2-server monorepo deploy
- Docs: `docs/security/SECURITY_AUDIT.md`, `docs/models/MODELS_CATALOG.md`, `docs/deployment/MONOREPO.md`, `docs/development/v0.0.1-IMPLEMENTATION.md`

### Security
- Detected and blocked **432 WordPress exploit attempts** from IP 45.148.10.9 (Techoff SRV, NL)
- Blocked CVE-2024-31210 (Batch RCE, CVSS 9.8) and CVE-2024-32336 (Gravity SMTP LFI, CVSS 7.5)
- **0 successful attacks** (WordPress not installed)

---

## [v0.0.1] - 2026-09-03 — MVP Release

### Added
- Initial cyber-terminal interface (TUI + Web)
- UniversalLlmClient with 78 models
- Google Gemini, OmniRoute, OpenRouter, OpenCode providers
- Basic ModelRegistry with 78 models
- Chat endpoint (POST /api/chat)
- Streaming chat (POST /api/chat/stream)
- Consilium engine (4 modes: solo, broadcast, dialogue, consilium)
- Boot diagnostics
- Cluster monitor (Frankfurt + Iowa)
- Health check endpoint
- Worklog API (TSV/LOG/TXT/MD formats)

---

**Format:** [Keep a Changelog](https://keepachangelog.com/)  
**Versioning:** [Semantic Versioning](https://semver.org/)  
**Status:** Active development