# EvaBot Modular Architecture & Technical Specification

**Version:** 0.2.0  
**Status:** Active  
**Pricing Standards:** Strictly USD ($) and EUR (€)  

---

## 1. System Overview

EvaBot is a modular TypeScript application designed to provide conversational AI capabilities powered by Google Gemini (under Google AI Pro subscription). The system is engineered to run seamlessly across both terminal environments (CLI) and web browsers.

```
                  ┌─────────────────────────────────┐
                  │       Universal Chat Layer       │
                  │   (Terminal CLI & Web Browser)  │
                  └────────────────┬────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              ▼                                         ▼
   ┌──────────────────────┐                  ┌──────────────────────┐
   │ Interactive CLI REPL │                  │   Web Browser UI     │
   │ (src/cli/terminal)   │                  │   (public/ & app.ts) │
   └──────────┬───────────┘                  └──────────┬───────────┘
              │                                         │
              │                               ┌─────────┴──────────┐
              │                               ▼                    ▼
              │                     ┌──────────────────┐ ┌──────────────────┐
              │                     │ Direct Client    │ │ Edge Daemon SSE  │
              │                     │ (Browser Storage)│ │ (src/server)     │
              │                     └─────────┬────────┘ └────────┬─────────┘
              │                               │                   │
              └───────────────────────────────┼───────────────────┘
                                              ▼
                                   ┌────────────────────┐
                                   │    GeminiClient    │
                                   │  (Unary & Stream)  │
                                   └──────────┬─────────┘
                                              ▼
                                   ┌────────────────────┐
                                   │   ModelRegistry    │
                                   │ (2.5-flash, 2.5-pro│
                                   │  2.0-flash, 1.5-pro│
                                   └──────────┬─────────┘
                                              ▼
                               ┌─────────────────────────────┐
                               │ Google Generative AI API     │
                               │ (Google AI Pro Subscription)│
                               └─────────────────────────────┘
```

---

## 2. Core Modules

### 2.1 `src/models/ModelRegistry.ts`
Centralized catalog of supported Google Gemini models with metadata, token boundaries, and tier classifications:
- `gemini-2.5-flash`: Default recommended model for responsive conversational throughput.
- `gemini-2.5-pro`: Flagship model for in-depth reasoning, code generation, and complex analysis.
- `gemini-2.0-flash`: Low-latency high-throughput engine.
- `gemini-1.5-pro`: Deep context window support.
- `gemini-1.5-flash`: Resource-efficient query engine.

### 2.2 `src/core/GeminiClient.ts`
Native zero-dependency HTTP client communicating directly with Google Generative Language REST APIs:
- Unary generation via `/v1beta/models/{model}:generateContent`.
- Real-time Server-Sent Events (SSE) streaming via `/v1beta/models/{model}:streamGenerateContent?alt=sse`.
- Works identically in Node.js 18+ and browser runtimes.

### 2.3 `src/core/ChatSession.ts`
Encapsulates conversation memory, turn history tracking, automated history trimming to avoid context overrun, dynamic model switching, and persona instruction injection.

### 2.4 `src/core/Logger.ts`
Dual-destination structured logger writing clean ANSI color outputs to console and structured timestamped logs to `logs/evabot.log`.

### 2.5 `src/server/server.ts`
Lightweight HTTP daemon built on Node.js built-ins:
- Serves static assets for the web chat frontend.
- Exposes `/api/health`, `/api/models`, `/api/chat`, and `/api/chat/stream`.
- Operates under 25 MB RAM, fitting comfortably within the 1 GB footprint of GCP `e2-micro`.

---

## 3. Deployment Topology

1. **`evaline-micro-vm` (`e2-micro`, Iowa):**
   - Caddy acts as edge TLS terminator on ports 80/443.
   - Proxies `/api/*` to `localhost:3000` where `evabot-chat.service` runs.
   - Serves static compiled bundle and UI assets with zero cache penalty.
   - 2 GB Swap enabled to provide buffer memory stability.

2. **`evabot-agent-vm` (`c3-standard-8`, Frankfurt):**
   - Reserved for heavy computational routines, code-server workspace, and persistent volume storage (`/data`).
