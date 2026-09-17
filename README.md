# EvaBot Online v0.1.0 // Cyber-Terminal

**Universal Multi-Model AI Terminal with Plugin Architecture & EvaLine KB**

---

## 🎯 Quick Start

```bash
cd /var/www/evabot-backend
npm install && npm run build && npm run start
```

**Production:** [https://evabot.online](https://evabot.online)
**Local:** http://localhost:3000
**External IP:** http://34.159.202.82:3000
**Visualizer:** http://localhost:3000/visualize.html

---

## ✨ Features v0.1.0

### 🔌 Plugin Architecture
- 3 autoloaded plugins: LLMProviders, Consilium, KnowledgeBase
- Each plugin is independent and can be enabled/disabled via API
- Plugin routes and commands registered dynamically
- Health checks for each plugin

### 🤖 5 LLM Providers (unified gateway)
- **Google AI (Gemini)** - default, free quota
- **OmniRoute** - internal LiteLLM proxy
- **OpenRouter** - 78 models
- **OpenCode Go** - code inference
- **KiloCode** - free models aggregator

### 🧠 Consilium Multi-Agent
- 4 modes: solo, broadcast, dialogue, consilium
- Cross-evaluating deliberation
- Auto-synthesis of consensus

### 📚 EvaLine Knowledge Base
- 178 documents, 6 languages (EN/UK/RU/PL/RO/DE)
- Full-text search with relevance scoring
- /kb command in terminal

### 🛡️ Security
- IP blocking (8 blocked), rate limiting, 17 attack patterns
- 0 successful attacks (432 WP exploit attempts blocked)

### 📊 Observability
- 12 log categories, 3 log files
- Live monitoring via /visualize.html
- /api/logs/recent for real-time logs

### 🧪 Tests
- 13 test suites, 100% pass rate
- Plugin manager, LLM providers, KB, Consilium, etc.

- 🛡️ **Security** — IP blocking, rate limiting, 8 malicious IPs blocked, 17 attack patterns
- 📚 **Knowledge Base** — 182 EvaLine documents, 6 languages, /kb command
- 🤖 **78 AI Models** — 46 free + 32 paid, with Quality/Speed/Context/Cost ratings
- 🚨 **Alerts** — 6 channels (console, file, webhook, email, syslog, desktop)
- 📊 **Logging** — 12 categories, 3 files, HTTP request tracking
- 💬 **Chat** — streaming, consilium (multi-agent), 8 corporate roles

### Terminal Commands
```
/top              - Top models
/kb status        - Knowledge base
/kb search EVA    - Search KB
/free             - All free models
/paid             - All paid models
/models           - Summary
/help             - All commands
```

---

## 🔌 API (30+ endpoints)

| Module | Endpoints |
|--------|-----------|
| **System** | `/api/health`, `/api/roles` |
| **Models** | `/api/models`, `/models/free`, `/models/paid`, `/models/top` |
| **Chat** | `/api/chat`, `/api/chat/stream`, `/api/consilium` |
| **Knowledge** | `/api/kb/{status,search,list,backend,command}` |
| **Security** | `/api/security/{status,report,block,unblock}` |
| **Logs** | `/api/logs/{files,read,recent}` |
| **Alerts** | `/api/alerts`, `/api/alerts/send`, `/api/alerts/channel` |

---

## 📚 Documentation

**👉 [docs/DOCUMENTATION_INDEX.md](docs/DOCUMENTATION_INDEX.md) — полный индекс документации**

| Документ | Описание |
|----------|----------|
| [CHANGELOG.md](docs/changelog/CHANGELOG.md) | История версий |
| [docs/changelog/](docs/changelog/) | Changelog details |
| [docs/worklog/](docs/worklog/) | Журнал событий по датам |
| [docs/architecture/](docs/architecture/) | Архитектура системы |
| [docs/security/](docs/security/) | Аудит безопасности |
| [docs/models/](docs/models/) | Каталог моделей |
| [docs/roadmap/](docs/roadmap/) | Планы развития |
| [docs/kanban/](docs/kanban/) | Канбан доска |
| [docs/deployment/](docs/deployment/) | Деплой и CI/CD |
| [docs/development/](docs/development/) | Development docs |

---

## 🏗️ Architecture

```
src/
├── server/                    # HTTP server
│   ├── server.ts             # 211 lines (main entry)
│   └── routes/               # 7 modular routers
│       ├── Router.ts         # Base Router class
│       ├── ChatRouter.ts     # /api/chat/*
│       ├── ModelsRouter.ts   # /api/models/*
│       ├── KbRouter.ts       # /api/kb/*
│       ├── LogsRouter.ts     # /api/logs/*
│       ├── SecurityRouter.ts # /api/security/*
│       └── AlertsRouter.ts   # /api/alerts/*
├── core/                      # Business logic
│   ├── Logger.ts             # 12 log categories
│   ├── Security.ts           # IP blocking + rate limiting
│   ├── AlertManager.ts       # Multi-channel alerts
│   ├── KnowledgeBase.ts      # 182 documents
│   ├── ConsiliumEngine.ts    # Multi-agent
│   ├── UniversalLlmClient.ts # Multi-provider
│   └── ...
├── models/                    # ModelRegistry (78 models)
└── web/                       # Frontend TypeScript
```

**Deployment:**
- **EvaBrain (Backend)**: Frankfurt `evabot-agent-vm` c3-standard-8
- **EvaFace (Frontend)**: Iowa `evaline-micro-vm` e2-micro (Always Free)
- **WireGuard Mesh**: 100.66.98.4 ↔ 100.125.200.49

---

## 🛡️ Security

**Blocked IPs (8):** 45.148.10.9, 43.157.188.74, 159.195.17.105, 67.205.2.98, 43.166.136.202, 43.165.2.110, 43.164.1.211, 43.156.232.154

**Attack Detection:** 432 WordPress exploit attempts (CVE-2024-31210, CVE-2024-32336) blocked automatically.

**Configure alerts:**
```bash
export ALERT_WEBHOOK_URL=https://hooks.slack.com/...
export ALERT_EMAIL_TO=admin@evaline.online
export SYSLOG_HOST=logs.evaline.online
```

📄 [docs/security/SECURITY_AUDIT.md](docs/security/SECURITY_AUDIT.md)

---

## 📊 Stats

| Metric | Value |
|--------|-------|
| Version | v0.0.2 |
| TypeScript files | 37 |
| Lines of code | 11,272 |
| API endpoints | 30+ |
| AI Models | 78 (46 free + 32 paid) |
| KB documents | 182 (6 languages) |
| Routers | 7 modular |
| TypeScript errors | 0 |
| Security status | ✅ 8 IPs blocked |
| Uptime | ✅ Online |

---

## 🛠️ Development

```bash
npm install              # Install deps
npm run build           # Build TypeScript
npm run start           # Start server
npm run cli             # TypeScript CLI
npm test                # Run tests
./deploy-sync.sh "msg"  # Build + commit + push + deploy
```

**GitHub:** https://github.com/evaline-online/evabot-online

---

**© 2026 Evaline Corporation (Chernomorsk, Ukraine & Bratislava, Slovakia)**
**Status:** ✅ Production Ready
