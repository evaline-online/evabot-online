# EvaBot Online — Pure Live-Markdown Core Engine Documentation (`evabot_full_documentation.en.md`)

> **System Version:** v2.7.0 (Pure Live-Markdown Architecture)  
> **Production Live URL:** [https://evabot.online](https://evabot.online)  
> **GitHub Repository:** [`evabot-online/evaline-online`](https://github.com/evabot-online/evaline-online)  

---

## 1. System Overview

EvaBot Online has been completely rebuilt from a clean slate on a **100% Pure Live-Markdown Architecture**. The system uses plain Markdown as the single source of truth for both web and CLI interfaces, featuring real-time 1-second telemetry polling, ASCII progress bars, live chat, interactive Kanban, and financial accounting.

---

## 2. Infrastructure & Compute Nodes

| Node Name | Cloud Provider | Machine Type | Region & Zone | Internal / External IP | Pricing Tier | Purpose |
|---|---|---|---|---|---|---|
| `evaline-micro-vm` | Google Cloud | `e2-micro` | `us-central1-a` (Iowa) | `10.128.0.2` / `136.114.26.252` | GCP Always Free ($0.00/mo) | Caddy TLS 1.3 Edge Proxy & Web Root |
| `evabot-agent-vm` | Google Cloud | `c3-standard-8` | `europe-west3-a` (Frankfurt) | `10.156.0.2` / `34.179.253.183` | On-Demand (~$300.00/mo) | High-performance AI compute core |

---

## 3. Financial OpEx & Accounting Ledger

- **Strict Currency Policy:** All monetary balances, infrastructure costs, and ledger transactions strictly adhere to **USD ($)** and **EUR (€)** currencies. No RUB/₽ currency references are used.
- **Estimated Total OpEx:** ~$325.00 / mo (~€300.00 / mo)
- **Always Free Savings:** $0.00 / mo for micro-node ingress
- **Google AI Pro Rate:** $20.00 / mo (€18.50 / mo)

---

## 4. Real-Time Telemetry & Live Markdown Engine

- **`LiveMarkdownEngine` (`src/core/LiveMarkdownEngine.ts`)**:
  - Ticks every 1000ms to calculate live CPU load, memory usage, uptime seconds, and financial totals.
  - Replaces metric tokens (`[metric:frankfurt_cpu]`, `[metric:iowa_ram]`, `[metric:uptime]`) dynamically.
  - Renders dynamic ASCII progress bars (`[progress:frankfurt_cpu]`).
  - Compiles Markdown source directly into high-density line-by-line NO-CSS HTML TUI table grids and collapsible `<details><summary>` accordions.

---

## 5. Automated CI Test Suite (`npm test`)

```text
================================================================================
RUNNING LIVE-MARKDOWN AUTOMATED TEST SUITE FOR CI VERIFICATION
================================================================================
[PASS] Telemetry Frankfurt CPU load active
[PASS] Telemetry Iowa memory specification verified
[PASS] Strict Currency compliance (No RUB/₽)
[PASS] USD ($) and EUR (€) OpEx telemetry formatted correctly
[PASS] ASCII progress bar generation verified
[PASS] Heading 1 compiled
[PASS] Collapsible accordion compiled
[PASS] Pure NO-CSS HTML grid table compiled
================================================================================
TEST SUMMARY: 8 PASSED, 0 FAILED
================================================================================
```
