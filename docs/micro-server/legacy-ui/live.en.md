# EVABOT ONLINE // PURE LIVE-MARKDOWN COMMAND CENTER

## [1] REAL-TIME CLOUD TELEMETRY & CLUSTER NODES
### NODE 1: evabot-agent-vm (FRANKFURT PRIMARY COMPUTE NODE)
- **LOCATION:** Frankfurt europe-west3-a | **IP:** 34.179.253.183 (VPC 10.156.0.2)
- **SYSTEM UPTIME:** `[metric:uptime]` | **HARDWARE:** 8 vCPU Intel Sapphire Rapids, 32GB RAM
- **LIVE CPU LOAD:** **[metric:frankfurt_cpu]**
[progress:frankfurt_cpu]
- **LIVE RAM USAGE:** **[metric:frankfurt_ram]**
[progress:frankfurt_ram]

| COMPONENT | SPECIFICATION | REAL-TIME STATUS | LIVE METRIC |
| CPU Cores | 8 vCPU Intel Sapphire Rapids | [ONLINE] STREAMING | [metric:frankfurt_cpu] |
| RAM Load | 32 GB DDR5 RAM | [ONLINE] STREAMING | [metric:frankfurt_ram] |
| Persistent Disk | 50 GB NVMe SSD | [ONLINE] MOUNTED | 12.4 GB / 50 GB |

### NODE 2: evaline-micro-vm (IOWA EDGE MICRO NODE)
- **LOCATION:** Iowa us-central1-a | **IP:** 136.114.26.252 (VPC 10.128.0.2)
- **PRICING TIER:** GCP Always Free ($0.00 / mo) | **OS:** Debian 13 (Trixie)
- **LIVE CPU LOAD:** **[metric:iowa_cpu]**
[progress:iowa_cpu]
- **LIVE RAM USAGE:** **[metric:iowa_ram]**
[progress:iowa_ram]

| COMPONENT | SPECIFICATION | PRICING TIER | STATUS |
| CPU Cores | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| System Memory | 1 GB RAM | $0.00 / mo (€0.00 / mo) | [metric:iowa_ram] |
| Caddy Reverse Proxy | Caddy 2.11.4 | TLS 1.3 Let's Encrypt | [metric:caddy_status] |

## [2] LIVE INTERACTIVE GEMINI CHAT
### GEMINI 2.0 PRO CORE CONSOLE
**STATUS:** [metric:gemini_status] | **PROTOCOL:** WSS/TLS1.3

[block:live_chat]

> [!NOTE]
> Compute core connected to Google Gemini models under Google AI Pro subscription ($20.00 / month).

**INPUT PROMPT:** [input:term-input "type your query for EvaBot..."] [SEND PROMPT](action:submitPrompt)

## [3] FINANCIAL OPEX & ACCOUNTING LEDGER (USD $ / EUR €)
### REAL-TIME MONTHLY COST BREAKDOWN & BALANCE
- **ESTIMATED MONTHLY OPEX:** **[metric:opex_usd]** (**[metric:opex_eur]**)
- **ALWAYS FREE SAVINGS:** $0.00 / mo (€0.00 / mo)
- **GOOGLE AI PRO SUBSCRIPTION:** $20.00 / mo (€18.50 / mo)

[block:live_accounting]

## [4] INTERACTIVE KANBAN TASK BOARD
### CLUSTER WORKFLOW GRID

[block:live_kanban]
