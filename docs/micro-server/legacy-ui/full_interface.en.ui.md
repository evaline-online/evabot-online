# ⚡ EVABOT ONLINE v0.0.1 // FULL LIVE-MARKDOWN INTERFACE SPECIFICATION

## 👤 [SCREEN 1: 3D CYBER MESH FACE & LLM PROMPT CHAT CONSOLE]
### 📍 BLOCK 1.1: INTERACTIVE 3D WIREFRAME MESH FACE BUTTON
[block:3d_cyber_face]

### 📍 BLOCK 1.2: LLM PROMPT COMMAND LINE INPUT BAR
**TYPE PROMPT FOR EVABOT (v0.0.1):** [input:term-input "type prompt for LLM agent..."] [SEND PROMPT](action:submitPrompt)

### 📍 BLOCK 1.3: LIVE INTERACTIVE GEMINI CORE CHAT STREAM
[block:live_chat]

---

## 🖥️ [SCREEN 2: REAL-TIME CLOUD TELEMETRY & CLUSTER NODES]
### 📍 BLOCK 2.1: PRIMARY COMPUTE NODE (FRANKFURT c3-standard-8)
[source:gcloud "34.179.253.183 (VPC 10.156.0.2)"]
- **LOCATION:** Frankfurt europe-west3-a | **SYSTEM UPTIME:** `[metric:uptime]`
- **HARDWARE SPEC:** 8 vCPU Intel Sapphire Rapids, 32 GB DDR5 RAM, 50 GB NVMe SSD
- **LIVE CPU LOAD:** **[metric:frankfurt_cpu]**
[progress:frankfurt_cpu]
- **LIVE RAM USAGE:** **[metric:frankfurt_ram]**
[progress:frankfurt_ram]

| COMPONENT | SPECIFICATION | REAL-TIME STATUS | LIVE METRIC |
| CPU Cores | 8 vCPU Intel Sapphire Rapids | [ONLINE] STREAMING | [metric:frankfurt_cpu] |
| RAM Load | 32 GB DDR5 RAM | [ONLINE] STREAMING | [metric:frankfurt_ram] |
| NVMe Array | 50 GB NVMe SSD | [ONLINE] MOUNTED | 12.4 GB / 50 GB |

### 📍 BLOCK 2.2: EDGE MICRO NODE (IOWA e2-micro ALWAYS FREE)
[source:gcloud "136.114.26.252 (VPC 10.128.0.2)"]
- **LOCATION:** Iowa us-central1-a | **PRICING TIER:** GCP Always Free ($0.00 / mo)
- **LIVE CPU LOAD:** **[metric:iowa_cpu]**
[progress:iowa_cpu]
- **LIVE RAM USAGE:** **[metric:iowa_ram]**
[progress:iowa_ram]

| COMPONENT | SPECIFICATION | PRICING TIER | STATUS |
| CPU Cores | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| System Memory | 1 GB RAM | $0.00 / mo (€0.00 / mo) | [metric:iowa_ram] |
| Caddy Reverse Proxy | Caddy 2.11.4 | TLS 1.3 Let's Encrypt | [metric:caddy_status] |

---

## 💰 [SCREEN 3: EXPENSES & FINANCIAL ACCOUNTING LEDGER]
### 📍 BLOCK 3.1: OPEX OVERVIEW & BALANCES (USD $ / EUR € ONLY)
- **ESTIMATED MONTHLY OPEX:** **[metric:opex_usd]** (**[metric:opex_eur]**)
- **ALWAYS FREE SAVINGS:** $0.00 / mo (€0.00 / mo) for micro-node ingress
- **GOOGLE AI PRO RATE:** $20.00 / mo (€18.50 / mo)

[block:live_accounting]

---

## 📊 [SCREEN 4: INTERACTIVE KANBAN TASK BOARD]
### 📍 BLOCK 4.1: CLUSTER WORKFLOW GRID

[block:live_kanban]
