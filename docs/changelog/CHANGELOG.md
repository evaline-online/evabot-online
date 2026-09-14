# Changelog

All notable changes to EvaBot Online will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.1.0] - 2026-09-07 — Cyber-Terminal TUI, Frontier 3.8 Fleet, Accounting & Agent Factory

### 🖥️ Cyber-Terminal & TUI Isomorphism
- **Pure CRT Monospace TUI**: Eliminated bloated cards and borders; strict 16px monospace layout in dark theme (`#0a0a0a`).
- **5-Line System Header**: Line 1 (Online + 1s Real-time Ping + Mesh RTT + Pulse Wave), Line 2 (Active Model + Mode + 78 Models Pool), Line 3 (Commands Bar), Line 4 (Databases OK), Line 5 (ASCII Load Bars CPU/RAM + Heartbeat).
- **Parity Across All Interfaces**: Browser, Node.js CLI (`terminal-chat.ts`), text browsers (Lynx/w3m), and `curl http://127.0.0.1:3000/`.
- **Autoscroll Support**: Automatic smooth scrolling to bottom during streaming chunks and message additions.

### 🤖 Frontier Fleet & Google Ecosystem
- **Gemini 3.8 Flash as Default #1**: Frontier 1M-context model with 100% Free Quota set as primary engine.
- **Search Grounding Guaranteed**: Direct live web fact retrieval via Vertex AI Google Search Grounding with zero extra cost.
- **Cascading Fallback Chain**: Strict ranked fallback: `gemini-3.8-flash` ➔ `gemini-3.1-pro` ➔ `gemini-3.1-flash` ➔ `deepseek-r1:free` ➔ `qwen-2.5-coder-32b:free`.

### 💰 Accounting & Financial Ledger (`/cost`)
- **AccountingEngine**: Tracks live token consumption, input/output cost, and calculated savings against commercial flagships ($0.2250 - $0.3000 saved per task).
- **Hardware OpEx Itemization**: Frankfurt Compute Core ($178.40), Iowa Edge Ingress ($7.14), Disks ($12.00), Mesh ($5.00), Subscriptions (Google AI Pro $20, Colab Pro $10, OpenRouter $25) = $257.54/mo ($0.3577/h).
- **Zero-Cost Unit Economics**: Creation of autonomous agents on Gemini 3.8 Flash / 3.1 Pro is verified at $0.00.

### 🏢 Agent Constructor (`/company [free|paid]`)
- **AgentBuilder**: Generates 10-agent autonomous corporations with defined missions, assigned models, and required MCP/LSP tools.
- **100% Free Fleet**: 10 specialized agents running on 100% free models.
- **Commercial Frontier Fleet**: 10 specialized agents running on Claude 3.7 Sonnet, OpenAI o1, GPT-4o, Codestral 2501, etc.
- **Model Technical Passports (`/info <model>`)**: Full specifications, token costs, context limits, and composite benchmark ratings.

### 🔌 MCP (21 Servers) & LSP (4 Servers) Integration
- **Commands `/mcp` & `/lsp`**: Live status reporting of all 21 MCP servers and 4 Language Servers in PATH (TypeScript, Python, HTML/CSS/JSON, Markdown).

### 🧪 100% Test Coverage
- **13 Test Suites**: All 13 suites (`npm test`) pass with 100% success (ModelTests, ChatTests, ServerTests, CoreEngineTests, UniversalClientTests, ConsiliumTests, RolesTests, AnsiStreamEngineTests, PluginManagerTests, EventBusTests, LLMProvidersTests, KnowledgeBaseTests, ConsiliumNewTests, AccountingAndBuilderTests).

---

## [v0.0.2] - 2026-09-07 — Refactored & Hardened

### 🛡️ Added - Security
- **IP blocking system** with 8 pre-blocked malicious IPs (45.148.10.9, 43.157.188.74, etc.)
- **Rate limiting** middleware (100 req/min per IP)
- **17 regex patterns** for suspicious path detection (WordPress/.env/admin/etc)
- **Auto-block** mechanism: 20 suspicious requests → 24h ban
- **Security endpoints**: `GET/POST /api/security/{status,report,block,unblock}`

### 📚 Added - Knowledge Base
- **EvaLine Knowledge Base integration**: 182 documents loaded from `evaline-com-ua`
- **6 languages supported**: EN, UK, RU, PL, RO, DE
- **4 backend types**: memory (active), json, sqlite, vector
- **Full-text search** with relevance scoring
- **/kb command** for terminal-style control
- **KB endpoints**: `GET/POST /api/kb/{status,search,list,backend,command}`

### 🚨 Added - Alerting System
- **Multi-channel alerts**: console, file, webhook, email, syslog, desktop
- **4 severity levels**: low, medium, high, critical
- **Rate limiting** (60s cooldown per alert type)
- **Alert endpoints**: `GET/POST /api/alerts/{stats,send,channel,config}`
- **Auto-integration** with Security module
- **Environment variable config**: `ALERT_WEBHOOK_URL`, `ALERT_EMAIL_TO`, `SYSLOG_HOST`

### 📊 Added - Comprehensive Logging
- **12 log categories**: SYSTEM, HTTP, USER, LLM, MODEL, KB, STORAGE, AUTH, PROCESS, DIAG, CLI, BROWSER
- **3 log files**: `evabot.log`, `user-actions-{date}.log`, `errors-{date}.log`
- **HTTP request logging** with IP, User-Agent, duration
- **In-memory buffer** (1000 entries) for fast access
- **Log endpoints**: `GET /api/logs/{files,read,recent}`

### 🏗️ Changed - Refactoring
- **server.ts refactored** from 815 → 211 lines (-74%)
- **Modular router architecture**: 7 separate route files
- **Router.ts base class** with RouteContext + withErrorHandling wrapper
- **ChatRouter** (89 lines) - chat, stream, consilium, roles
- **ModelsRouter** (55 lines) - models, top, free, paid
- **KbRouter** (70 lines) - KB endpoints
- **LogsRouter** (30 lines) - logs endpoints
- **SecurityRouter** (39 lines) - security endpoints
- **AlertsRouter** (41 lines) - alerts endpoints

### 🐛 Fixed - Critical Bugs
- **ConsiliumEngine.ts** was BROKEN (12 TypeScript errors)
  - Added `ModelRegistry.estimateTokens()` method
  - Added `ModelRegistry.calculateCost()` method
  - Added `ModelRegistry.getTop10FreeModels()` method
  - Added `ModelRegistry.getTop10PaidSmartestModels()` method
  - Added `TokenCostEstimate` interface
  - **Result: 0 TypeScript errors** (was 12)
- **UniversalLlmClient.ts** - removed invalid `tier === 'OpenRouter Paid'` check
- **KB JSON.stringify** was crashing on Set serialization
  - Replaced recursive `getBackendDescription()` with static lookup
  - Fixed `Set` → `Array.from()` conversion

### 🗑️ Removed
- **`dist/` from Git** (1.3MB, 114 files) - now in .gitignore
- **`legacy_archive/`** (17MB, 32 files) - old code, now in .gitignore
- **`src/plugins/voice/`** (5 files) - unused voice plugin code
- **`src/web/voice/`** (5 files) - unused voice UI code
- **`.env.bak`** - backup file with potential secrets

### 📁 Added
- **`config/Caddyfile`** - production reverse proxy with WAF, rate limits, security headers
- **`config/fail2ban-filter.conf`** - fail2ban filter for EvaBot logs
- **`config/fail2ban-jail.conf`** - 2 jails (attack + rate)
- **`.github/workflows/deploy.yml`** - CI/CD for 2-server monorepo deploy
- **`docs/security/SECURITY_AUDIT.md`** - full security audit report
- **`docs/models/MODELS_CATALOG.md`** - separated free/paid models
- **`docs/deployment/MONOREPO.md`** - monorepo documentation
- **`docs/development/v0.0.1-IMPLEMENTATION.md`** - v0.0.1 implementation report

### 🔒 Security
- Detected and blocked **432 WordPress exploit attempts** from IP 45.148.10.9 (Techoff SRV, NL)
- Blocked CVE-2024-31210 (Batch RCE, CVSS 9.8)
- Blocked CVE-2024-32336 (Gravity SMTP LFI, CVSS 7.5)
- 8 unique attacker IPs identified from NL, BR, US, DE, TH, SG
- **0 successful attacks** (WordPress not installed)

---

## [v0.1.0] - 2026-09-07 — Plugin Architecture & Multi-Provider Gateway

### 🆕 Added - Plugin System
- **Plugin Architecture** - автономные плагины с динамической загрузкой
- **PluginManager** - singleton с поддержкой enable/disable, dependencies, health checks
- **PluginEventBus** - pub/sub для межплагинного взаимодействия
- **Plugin interface** - `manifest`, `initialize()`, `shutdown()`, `healthCheck()`
- **Plugin routes & commands** - каждый плагин может регистрировать API routes и CLI commands

### 🆕 Added - Plugins
- **LLMProvidersPlugin** - единый gateway для 5 провайдеров:
  - Google AI (Gemini) - default, free quota
  - OmniRoute (Internal LiteLLM Proxy) - daemon cluster
  - OpenRouter - 78 моделей, free tier
  - OpenCode Go - код-инференс
  - KiloCode - free models aggregator
- **ConsiliumPlugin** - Multi-Agent Engine (4 режима: solo, broadcast, dialogue, consilium)
- **KnowledgeBasePlugin** - EvaLine KB (178 документов, 6 языков)

### 🆕 Added - API Endpoints
- `GET /api/plugins` - список всех плагинов
- `GET /api/plugins/health` - health check всех плагинов
- `GET /api/plugins/:id` - информация о плагине
- `POST /api/plugins/:id/enable` - включить плагин
- `POST /api/plugins/:id/disable` - выключить плагин
- `GET /api/llm/providers` - статус всех LLM провайдеров
- `POST /api/llm/chat` - чат через любой провайдер
- `POST /api/llm/test` - тест провайдера

### 🆕 Added - Visualizer
- **`/visualize.html`** - интерактивная визуализация всей системы
- Live метрики, plugins, models, security, logs
- Архитектурные диаграммы (User → EvaFace → EvaBrain → 4 Providers)
- Flow diagrams (request, consilium, KB)
- Real-time updates каждые 10 секунд

### 🆕 Added - Tests
- **13 test suites, 100% pass rate**
- `tests/plugin-manager.test.ts` - 12 tests for PluginManager + EventBus
- `tests/llm-providers.test.ts` - 19 tests for LLMProvidersPlugin
- `tests/knowledge-base.test.ts` - 20 tests for KnowledgeBasePlugin
- `tests/consilium-new.test.ts` - 12 tests for ConsiliumPlugin
- Total: 60+ test assertions, all passing

### 🔧 Changed
- **server.ts** - интегрирован PluginManager, plugin routes в router
- **TypeScript errors** - 0 (clean compile)
- **Endpoints** - все /api/kb/* переехали в KnowledgeBasePlugin
- **Endpoints** - все /api/consilium/* переехали в ConsiliumPlugin

### 📦 Plugin Architecture Benefits
- Modularity - каждый компонент в своем плагине
- Hot-swap - enable/disable без перезапуска
- Dependencies - автоматическая проверка зависимостей
- Health monitoring - каждый плагин имеет healthCheck
- Easy testing - каждый плагин тестируется отдельно
- Extensibility - легко добавить новый плагин

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

## [Unreleased] - Planned

### v0.1.0
- [ ] Vector embeddings (Gemini embedding-004)
- [ ] ChromaDB integration
- [ ] Real semantic search
- [ ] Frontend mobile-optimized UI
- [ ] localStorage chat history
- [ ] Code highlighting
- [ ] Copy buttons

### v0.2.0
- [ ] Consilium v2 with 10+ agents
- [ ] Voting system
- [ ] Consensus arbiter improvement
- [ ] WebSocket real-time chat

### v0.3.0
- [ ] Voice input/output
- [ ] Audio streaming
- [ ] Chat export (PDF, Markdown)
- [ ] Multi-language UI improvements

### v0.4.0
- [ ] Mobile app (PWA)
- [ ] OAuth2 authentication
- [ ] Multi-user sessions
- [ ] Usage analytics
- [ ] Billing dashboard

---

**Format:** [Keep a Changelog](https://keepachangelog.com/)  
**Versioning:** [Semantic Versioning](https://semver.org/)  
**Status:** Active development

## [v0.2.0] - 2026-09-08 — Modular Architecture & Security Hardening

### 🏗️ Added
- **12 modular repos**: eva-brain, eva-voice, eva-face, eva-db, eva-history, eva-memory, evaline-consilium, evabot-server, eva-server, evaline-server, eva-docs, eva-reports
- **eva-docs**: unified documentation hub (architecture, ops, agents, domains, models, roadmap, security)
- **eva-reports**: chronological session reports with indexing
- **Branch protection** on all active repos' main branches (PR required + 1 approval)
- **GitHub Actions CI/CD**: automated build → sync-modules → deploy → smoke test
- **sync-modules.sh**: keeps monorepo and module repos in sync
- **Watchdog timer**: crash-loop detection with threshold alerting via systemd timer (5min interval)
- **Uptime monitor**: cron-based health checks logging to /var/log/evabot-uptime.log

### 🔒 Changed / Fixed
- **GitHub token hygiene**: removed embedded tokens from all git remote URLs (ghp_*); switched to `gh auth` credential helper
- **GCP key redaction**: removed leaked API key from REPORT.md (GitHub Push Protection)
- **google-calendar MCP port conflict**: changed PORT 3000 → 3800 in opencode/kilo configs, resolves brain crash-loop
- **Removed release tarballs** from git history; added backups/ to .gitignore
- **CompanyKnowledge sources** → `../eva-reports/reports/` (single source of truth)
- **docs-site/content** → symlink → eva-docs (eliminated content duplication)
- **MANIFESTO.md** → symlink (deduplicated from public/)
- **Single-viewport dashboard**: evaline.network zero-scroll layout (mobile-first 320px → desktop)
