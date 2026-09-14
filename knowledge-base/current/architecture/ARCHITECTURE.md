# EvaBot Online — Architecture

**Last Updated:** 2026-09-07  
**Version:** v0.0.2

---

## 🏗️ System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                          EVABOT ONLINE ECOSYSTEM                            │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│   User Browser          Public IP              Google Cloud               │
│   ┌─────────┐           ┌────────┐            ┌──────────────┐             │
│   │  Web UI │ ─HTTPS─>  │ EvaFace│ ─HTTPS─>  │ EvaBrain     │             │
│   │  TUI    │           │ 443    │            │ :3000        │             │
│   └─────────┘           └────────┘            └──────────────┘             │
│                              │                       │                     │
│                              │                       │                     │
│                              ▼                       ▼                     │
│                       ┌──────────────┐         ┌──────────────┐          │
│                       │ Caddy (Iowa) │ ──────> │ Node.js      │          │
│                       │ TLS 1.3      │  Wg     │ EvaBot Brain │          │
│                       │ HTTP/3 QUIC  │ <─────  │ Frankfurt    │          │
│                       └──────────────┘         └──────────────┘          │
│                              │                       │                     │
│                              │                       │                     │
│                              ▼                       ▼                     │
│                       ┌──────────────┐         ┌──────────────┐          │
│                       │ Tailscale    │         │ Google AI    │          │
│                       │ 100.125.200.49│        │ Gemini 2.5   │          │
│                       └──────────────┘         │ Claude 3.7   │          │
│                                                  │ GPT-4o       │          │
│                                                  │ DeepSeek R1  │          │
│                                                  │ Llama 3.3    │          │
│                                                  │ 78 models... │          │
│                                                  └──────────────┘          │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🖥️ Components

### 1. EvaFace (Edge Gateway) - Iowa
**VM:** `evaline-micro-vm`  
**Type:** `e2-micro` (2 vCPU, 1 GB RAM)  
**Region:** `us-central1-a`  
**Cost:** $0.00/mo (Always Free Tier)

**Role:**
- TLS termination (Caddy 2.11)
- HTTP/3 QUIC support
- Reverse proxy to EvaBrain
- Static file serving
- Domain management

**Domains:**
- `evabot.online`
- `evaline.online`
- `evaline.network`
- `evaline.website`

**Software:**
- Caddy 2.11
- Linux 6.12 (Debian 13 Trixie)
- Tailscale daemon

### 2. EvaBrain (Compute Core) - Frankfurt
**VM:** `evabot-agent-vm`  
**Type:** `c3-standard-8` (8 vCPU, 32 GB RAM)  
**Region:** `europe-west3-a`  
**Cost:** ~$357.80/mo (on-demand)

**Role:**
- LLM orchestration
- Multi-agent deliberation (Consilium)
- Knowledge Base server
- API backend
- WebSocket server (planned)

**Software:**
- Node.js 22
- TypeScript 5.7
- esbuild
- Google AI SDK
- LiteLLM (OmniRoute)
- Tailscale daemon

### 3. WireGuard Mesh
**Network:** Tailscale 100.x  
**Encryption:** ChaCha20-Poly1305  
**Latency:** ~120ms (Frankfurt ↔ Iowa)  
**Tunnels:**
- `100.66.98.4` (Frankfurt)
- `100.125.200.49` (Iowa)

---

## 📁 Code Architecture

### Monorepo Structure
```
evabot-online/                       # GitHub: evaline-network/evabot-online
├── src/                             # TypeScript source (11,272 lines)
│   ├── server/                      # HTTP server
│   │   ├── server.ts               # 211 lines - main entry
│   │   └── routes/                 # 7 modular routers
│   │       ├── Router.ts           # Base Router class
│   │       ├── ChatRouter.ts       # /api/chat, /api/chat/stream, /api/consilium
│   │       ├── ModelsRouter.ts     # /api/models/* (6 endpoints)
│   │       ├── KbRouter.ts         # /api/kb/* (5 endpoints)
│   │       ├── LogsRouter.ts        # /api/logs/* (3 endpoints)
│   │       ├── SecurityRouter.ts   # /api/security/* (4 endpoints)
│   │       └── AlertsRouter.ts     # /api/alerts/* (5 endpoints)
│   ├── core/                        # Business logic
│   │   ├── Logger.ts               # 12 categories, 3 files
│   │   ├── Security.ts             # IP blocking, rate limiting
│   │   ├── AlertManager.ts         # 6 channels, 4 severities
│   │   ├── KnowledgeBase.ts        # 182 documents
│   │   ├── KnowledgeBaseCommand.ts # /kb command
│   │   ├── ConsiliumEngine.ts      # Multi-agent deliberation
│   │   ├── UniversalLlmClient.ts   # Multi-provider chat
│   │   ├── GeminiClient.ts         # Google Gemini
│   │   ├── GoogleAuthProvider.ts   # ADC authentication
│   │   ├── ChatSession.ts          # Session management
│   │   ├── ClusterMonitor.ts       # GCP node monitoring
│   │   ├── BootDiagnostics.ts      # Startup checks
│   │   ├── Config.ts               # Configuration
│   │   ├── TuiRenderer.ts          # Terminal UI
│   │   ├── AnsiStreamEngine.ts     # Streaming TUI
│   │   ├── LocalePolicy.ts         # i18n rules
│   │   ├── CorporateRoles.ts       # 8 personas
│   │   └── ...
│   ├── models/                      # Model registry
│   │   ├── ModelRegistry.ts        # 78 models catalog
│   │   └── ModelRatings.ts         # Quality/Speed/Context/Cost ratings
│   ├── web/                         # Frontend TypeScript
│   │   └── app.ts                   # Web UI
│   ├── cli/                         # CLI
│   │   └── terminal-chat.ts         # TUI client
│   └── index.ts                     # Public API exports
├── public/                          # Static files (HTML/CSS/JS)
├── knowledge-base/                  # EvaLine KB (182 docs, 19MB)
├── config/                          # Caddy, fail2ban
├── .github/workflows/               # CI/CD
├── docs/                            # Technical docs
└── dist/                            # Build output (gitignored)
```

### Router Pattern
Each router is self-contained:

```typescript
// ModelsRouter.ts
export function createModelsRouter(): Router {
  const router = new Router();
  router.get('/api/models', withErrorHandling(async (ctx) => {
    // Handler logic
  }));
  return router;
}
```

**Benefits:**
- Modular (each file < 100 lines)
- Testable (independent)
- Hot-reloadable
- Type-safe (TypeScript)

---

## 🔌 API Architecture

### REST API (30+ endpoints)

| Category | Endpoints | Router |
|----------|----------|--------|
| **System** | `/health`, `/roles`, `/logs`, `/worklog/*` | server.ts + LogsRouter |
| **Models** | `/models`, `/models/free`, `/models/paid`, `/models/top`, `/models/command` | ModelsRouter |
| **Chat** | `/chat`, `/chat/stream`, `/consilium` | ChatRouter |
| **Knowledge Base** | `/kb/status`, `/kb/search`, `/kb/list`, `/kb/backend`, `/kb/command` | KbRouter |
| **Security** | `/security/status`, `/security/report`, `/security/block`, `/security/unblock` | SecurityRouter |
| **Alerts** | `/alerts`, `/alerts/stats`, `/alerts/send`, `/alerts/channel`, `/alerts/config` | AlertsRouter |

### Request Flow
```
1. HTTP request arrives at EvaFace (Caddy)
2. TLS termination (Caddy)
3. Security middleware:
   - Check blocked IPs
   - Apply rate limiting
   - Detect suspicious paths
4. Route to EvaBrain (via WireGuard)
5. EvaBrain matches route in Router
6. withErrorHandling wrapper catches exceptions
7. Route handler executes
8. Response streamed back
9. HTTP request logged with IP, duration
```

---

## 🤖 AI Model Architecture

### Multi-Provider Strategy
```
┌────────────────────────────────────────────┐
│           UniversalLlmClient               │
│  ┌──────────────────────────────────────┐  │
│  │  resolveProvider(modelId)            │  │
│  │  → google | omniroute | openrouter   │  │
│  └──────────────────────────────────────┘  │
└─────────┬──────────┬──────────────┬─────────┘
          │          │              │
          ▼          ▼              ▼
    ┌─────────┐ ┌──────────┐ ┌──────────┐
    │ Google  │ │OmniRoute │ │OpenRouter│
    │ Gemini  │ │LiteLLM   │ │  API     │
    │  via    │ │  Proxy   │ │          │
    │  ADC    │ │  :20128  │ │          │
    └─────────┘ └──────────┘ └──────────┘
```

### Model Registry
- **78 models** across 12 categories
- **46 free** (zero cost, quotas)
- **32 paid** (PAYG, USD/EUR pricing)
- **6 tiers**: Free Quota+Paid, Vertex AI, Open Weights, Free Community, OmniRoute, OpenCode

### Rating System
- **Quality** (40%): based on model name and category
- **Speed** (25%): based on RPM quota and model type
- **Context** (20%): based on context window size
- **Cost** (15%): based on input price

---

## 📚 Knowledge Base Architecture

### Data Flow
```
knowledge-base/evaline-com-ua/
├── README.{en,ru,uk}.md
├── REPORT.{en,ru,uk}.md
└── site/
    ├── en/ (b2b/, b2c/, about.md, etc.)
    ├── uk/
    ├── ru/
    ├── pl/
    ├── ro/
    └── de/
        ↓ (loaded on startup)
┌─────────────────────────────────────┐
│  KnowledgeBase.initialize()         │
│  ↓                                  │
│  182 documents in memory            │
│  ↓                                  │
│  search(query) → top-5 results      │
└─────────────────────────────────────┘
```

### Search Algorithm
- Keyword matching with frequency scoring
- Title boost (+0.5)
- Tag boost (+0.2 per tag)
- Score: `min(0.99, 0.55 + (matches/tokens) * 0.44)`

### Future: Vector Search (v0.1.0)
- Embedding model: Gemini embedding-004
- Vector DB: ChromaDB
- Semantic search instead of keyword

---

## 🛡️ Security Architecture

### Defense in Depth
```
Layer 1: Network (GCP Firewall)
  ↓
Layer 2: TLS (Caddy)
  ↓
Layer 3: WireGuard Mesh (private network)
  ↓
Layer 4: Rate Limiting (EvaBrain)
  ↓
Layer 5: IP Blocking (in-memory)
  ↓
Layer 6: Path Pattern Detection (17 regex)
  ↓
Layer 7: Auto-Block (after 20 suspicious)
  ↓
Layer 8: fail2ban (planned)
  ↓
Layer 9: Cloud Armor (planned for v0.5.0)
```

### Alerting Flow
```
Suspicious Activity
  ↓
Security.recordSuspicious()
  ↓
Security.checkRateLimit() → BLOCK
  ↓
AlertManager.high('IP Auto-Blocked')
  ↓
Channels:
  - Console (red blink)
  - File (logs/alerts.log)
  - Webhook (Slack/Discord/n8n)
  - Email (SMTP)
  - Syslog (UDP 514)
```

---

## 📊 Observability Architecture

### Logging Pipeline
```
App Event
  ↓
Logger.write(category, tag, message)
  ↓
  ├─→ console (with colors)
  ├─→ evabot.log (all events)
  ├─→ user-actions-{date}.log (USER category)
  ├─→ errors-{date}.log (ERROR level)
  └─→ in-memory buffer (1000 entries)
       ↓
       /api/logs/recent endpoint
```

### Metrics
- HTTP request rate
- Response time (p50, p95, p99)
- Error rate by endpoint
- Model usage by provider
- KB search queries
- Security events per hour

### Planned (v0.5.0)
- Prometheus exporter
- Grafana dashboards
- OpenTelemetry tracing

---

## 🚀 Deployment Architecture

### CI/CD Pipeline
```
GitHub Push (main branch)
  ↓
GitHub Actions
  ├─ Test (npm test)
  ├─ Build (npm run build)
  ├─ Deploy to EvaBrain (Frankfurt)
  │   └─ gcloud compute ssh evabot-agent-vm
  │       └─ git pull && npm install && npm run build
  │       └─ systemctl restart evabot-brain
  └─ Deploy to EvaFace (Iowa)
      └─ gcloud compute ssh evaline-micro-vm
          └─ git pull && rsync to /var/www/evabot.online
          └─ systemctl reload caddy
```

### Manual Deploy
```bash
./deploy-sync.sh "commit message"
# = build + commit + push + sync to GCP
```

---

## 🔮 Future Architecture (v1.0.0)

```
┌─────────────────────────────────────────────────────────────┐
│                  Multi-Region Active-Active                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │
│  │ EU-WEST3 │  │ US-CENT1 │  │ ASIA-1   │  │ ASIA-2   │     │
│  │ Frankfurt│  │ Iowa     │  │ Singapore│  │ Tokyo    │     │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │
│         ↓              ↓              ↓              ↓    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Global Load Balancer (Cloudflare)                │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Microservices:                                      │   │
│  │  - chat-service    - kb-service                      │   │
│  │  - model-router    - security-service                │   │
│  │  - alert-service   - analytics-service               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Data Layer:                                         │   │
│  │  - PostgreSQL (pgvector)  - ChromaDB cluster        │   │
│  │  - Redis (cache)          - S3 (KB storage)         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

**Last Review:** 2026-09-07  
**Next Review:** After v0.1.0 release
