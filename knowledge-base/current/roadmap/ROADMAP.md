# EvaBot Online — Roadmap

**Last Updated:** 2026-09-07  
**Current Version:** v0.0.2  
**Status:** ✅ Production Ready (MVP + Security)

---

## 🎯 Стратегические цели

1. **Universal Cyber-Terminal** - работает в браузере и CLI одинаково
2. **Multi-Model Architecture** - 78 LLM моделей с единым интерфейсом
3. **Corporate Knowledge Integration** - EvaLine KB на 182 документа
4. **Zero-Trust Security** - автоматическая защита от атак
5. **Production Observability** - полное логирование и алертинг

---

## 📅 Timeline

```
2026-09-03 ────────────────────────── 2027-Q1 ──────────────────── 2027-Q4
       v0.0.1 (MVP)        v0.0.2 ✅ Current
                              │
                              ├─ v0.1.0 (Sept 2026)
                              │  └─ Vector embeddings + Mobile UI
                              │
                              ├─ v0.2.0 (Oct 2026)
                              │  └─ Consilium v2 + WebSocket
                              │
                              ├─ v0.3.0 (Nov 2026)
                              │  └─ Voice + Export
                              │
                              └─ v0.4.0 (Dec 2026)
                                 └─ Mobile PWA + Auth
```

---

## ✅ v0.0.2 — COMPLETED (2026-09-07)

### Security
- [x] IP blocking system
- [x] Rate limiting middleware
- [x] 17 regex patterns for attack detection
- [x] Auto-block mechanism
- [x] Security endpoints

### Knowledge Base
- [x] EvaLine KB integration (182 documents)
- [x] 6 languages support
- [x] Multi-backend (memory/json/sqlite/vector)
- [x] /kb commands
- [x] KB search & list

### Alerting
- [x] Multi-channel alerts (6 channels)
- [x] 4 severity levels
- [x] Rate limiting
- [x] Auto-integration with Security
- [x] Alert endpoints

### Logging
- [x] 12 log categories
- [x] 3 log files (main/user/error)
- [x] HTTP request logging
- [x] In-memory buffer
- [x] Log endpoints

### Refactoring
- [x] server.ts: 815 → 211 lines (-74%)
- [x] 7 modular routers
- [x] Fixed ConsiliumEngine (12 errors → 0)
- [x] Removed dist/ from Git (1.3MB)
- [x] Removed legacy_archive/ (17MB)

---

## 🚧 v0.1.0 — Vector Embeddings & Mobile UI (Sept 2026)

### High Priority
- [ ] **Vector embeddings** via Gemini embedding-004
- [ ] **ChromaDB integration** (local + remote)
- [ ] **Real semantic search** in KB (replace keyword matching)
- [ ] **Mobile-optimized UI** (responsive design, touch-friendly)
- [ ] **Chat history** (localStorage + server-side sync)
- [ ] **Code highlighting** (highlight.js or prism.js)
- [ ] **Copy buttons** on code blocks

### Medium Priority
- [ ] Streaming improvements (token-by-token display)
- [ ] Better error messages
- [ ] Loading states
- [ ] Markdown rendering improvements

### Estimated: 2-3 weeks

---

## 🎯 v0.2.0 — Consilium v2 + WebSocket (Oct 2026)

### Consilium Engine v2
- [ ] **10+ agent deliberation** (currently max 4)
- [ ] **Voting system** for consensus
- [ ] **Improved arbiter** with better synthesis
- [ ] **Persona-based deliberation** (CEO, CTO, CISO, etc.)
- [ ] **Parallel rounds** for speed

### Real-time
- [ ] **WebSocket** server (replace SSE for chat)
- [ ] **Live typing indicators**
- [ ] **Multi-user sessions** (collaborative chat)
- [ ] **Live KB search** in chat

### Estimated: 3-4 weeks

---

## 🎤 v0.3.0 — Voice & Export (Nov 2026)

### Voice
- [ ] **Voice input** (Web Speech API)
- [ ] **Voice output** (TTS via Gemini Live)
- [ ] **Audio streaming**
- [ ] **Voice commands** ("Hey EvaBot, search EVA")

### Export
- [ ] **PDF export** of conversations
- [ ] **Markdown export** with formatting
- [ ] **JSON export** for developers
- [ ] **Share links** (read-only chat snapshots)

### UI Improvements
- [ ] **Dark/Light theme toggle**
- [ ] **Font customization**
- [ ] **Custom color schemes**
- [ ] **Accessibility** (ARIA, keyboard nav)

### Estimated: 4-5 weeks

---

## 📱 v0.4.0 — Mobile PWA + Auth (Dec 2026)

### Mobile
- [ ] **Progressive Web App** (PWA)
- [ ] **Offline mode** (service worker)
- [ ] **Push notifications**
- [ ] **Touch gestures**
- [ ] **Install prompts**

### Authentication
- [ ] **OAuth2** (Google, Microsoft)
- [ ] **Multi-user sessions**
- [ ] **Per-user history**
- [ ] **Usage analytics**
- [ ] **Billing dashboard**

### Estimated: 5-6 weeks

---

## 🏢 v0.5.0 — Enterprise Features (Q1 2027)

### Compliance
- [ ] **GDPR compliance** tools
- [ ] **Audit logging** (immutable)
- [ ] **Data residency** controls
- [ ] **Encryption at rest**

### Integration
- [ ] **n8n workflows** integration
- [ ] **Webhook subscriptions**
- [ ] **REST API** documentation (OpenAPI)
- [ ] **GraphQL** endpoint
- [ ] **SDK** (Python, JS, Go)

### Estimated: 8-10 weeks

---

## 🔮 v1.0.0 — Stable Release (Q2 2027)

### Final Features
- [ ] **100% test coverage**
- [ ] **Performance benchmarks** (p95 < 200ms)
- [ ] **Multi-region deployment**
- [ ] **Auto-scaling**
- [ ] **Production SLA** (99.9%)

### Documentation
- [ ] **Full API reference**
- [ ] **Architecture deep-dive**
- [ ] **Operations manual**
- [ ] **Security whitepaper**

---

## 🛑 Не в планах (Out of Scope)

- ❌ Image generation (use external DALL-E/Imagen)
- ❌ Video processing
- ❌ Real-time translation
- ❌ Email automation
- ❌ CRM integration
- ❌ Direct competitor models training

---

## 📊 Success Metrics

| Metric | v0.0.2 | v0.1.0 Target | v1.0.0 Target |
|--------|--------|--------------|---------------|
| Uptime | 99.5% | 99.9% | 99.95% |
| P95 Latency | 500ms | 300ms | 200ms |
| Concurrent Users | 10 | 100 | 1000 |
| Models | 78 | 100 | 150 |
| KB Documents | 182 | 500 | 2000 |
| Daily Messages | 1K | 50K | 500K |
| Languages | 6 | 10 | 20 |

---

## 🤝 Contributing

См. [CONTRIBUTING.md](https://github.com/evaline-online/evabot-online/blob/main/CONTRIBUTING.md) (в планах)

---

**Last Review:** 2026-09-07  
**Next Review:** 2026-10-01  
**Owner:** EvaBot Engineering Team
