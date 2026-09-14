# EVABOT ONLINE // MD-UI MARKDOWN INTERFACE ENGINE

## [1] GEMINI CHAT & VOICE
### SESSION: EVABOT_GEMINI_CORE_v0.0.1
**STATUS:** ONLINE (ACTIVE) | **PROTOCOL:** WSS/TLS1.3

[● LIVE GEMINI VOICE](action:toggleVoiceInput)

> [!NOTE]
> Compute core connected to Google Gemini models under Google AI Pro subscription ($20.00 / month).

**PROMPT:** [input:term-input "enter prompt for EvaBot..."] [EXECUTE](action:submitPrompt)

## [2] SERVER TELEMETRY
### NODE 1: evabot-agent-vm (FRANKFURT c3-standard-8)
**LOCATION:** Frankfurt europe-west3-a | **IP:** 34.179.253.183 (VPC 10.156.0.2)

| RESOURCE | SPECIFICATION | LOAD | STATUS |
| CPU Cores | 8 vCPU Intel Sapphire Rapids | 3.2% load | [ONLINE] HEALTHY |
| System Memory | 32 GB DDR5 RAM | 5.8 GB / 32 GB | [ONLINE] HEALTHY |
| NVMe Disk | 50 GB NVMe SSD | 12.4 GB / 50 GB | [ONLINE] HEALTHY |

### NODE 2: evaline-micro-vm (IOWA e2-micro ALWAYS FREE)
**LOCATION:** Iowa us-central1-a | **IP:** 136.114.26.252 (VPC 10.128.0.2)

| RESOURCE | SPECIFICATION | LOAD | STATUS |
| CPU Cores | 2 vCPU burstable | 1.4% load | [ONLINE] ALWAYS FREE ($0/mo) |
| System Memory | 1 GB RAM | 412 MB / 1 GB | [ONLINE] HEALTHY |
| Boot Disk | 20 GB Standard HDD | 4.8 GB / 20 GB | [ONLINE] HEALTHY |

## [3] EXPENSES & ACCOUNTING
### FINANCIAL OVERVIEW & BALANCES (USD $ / EUR € ONLY)
- **TOTAL OPEX:** ~$315.00 – $345.00 / mo (~€291.00 – €319.00 / mo)
- **ALWAYS FREE SAVINGS:** $0.00 / mo (€0.00 / mo) for micro-node ingress
- **LOAD BALANCER SAVINGS:** ~$28.50 – $35.00 / mo saved vs Cloud ALB
- **GOOGLE AI PRO RATE:** $20.00 / mo (€18.50 / mo)

### GCP INFRASTRUCTURE COST BREAKDOWN
| COMPONENT | RESOURCE TYPE | PRICING TIER | HOURLY COST | MONTHLY COST (USD $) | MONTHLY COST (EUR €) | STATUS |
| evaline-micro-vm | Compute Engine e2-micro | GCP Always Free | $0.0000 / hr | $0.00 / mo | €0.00 / mo | [FREE TIER] ACTIVE |
| evabot-agent-vm | c3-standard-8 (Frankfurt) | On-Demand Tier | ~$0.42 / hr | ~$300.00 / mo | ~€277.00 / mo | [ACTIVE] PAID |
| Google AI Pro | Gemini 2.0 Pro Subscription | Fixed Monthly | N/A | $20.00 / mo | €18.50 / mo | [ACTIVE] SUBSCRIPTION |

## [7] KANBAN BOARD
### KANBAN WORKFLOW GRID
- **BACKLOG:** Multi-region failover, Messenger webhooks
- **IN PROGRESS:** Markdown md-ui engine, Financial ledger P&L
- **REVIEW:** 3-Way Git/GCP Deployment Script
- **DONE:** Iowa e2-micro Always Free, Frankfurt c3-std-8 Node
