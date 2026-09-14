# EvaBot Online // Monorepo

**Универсальный мульти-модельный AI терминал с рейтингами и командой `/top`**

---

## 🏗️ Архитектура Monorepo

Проект использует **monorepo** стратегию с одним репозиторием и четким разделением логики:

```
evabot-online/                   # GitHub: evaline-network/evabot-online
├── src/                         # Backend код (TypeScript)
│   ├── server/                  # Node.js HTTP сервер
│   ├── core/                    # UniversalLlmClient, ConsiliumEngine
│   ├── models/                  # ModelRegistry + ModelRatings
│   ├── web/                     # Frontend (TypeScript)
│   └── cli/                     # CLI клиент
├── public/                      # Frontend статика (HTML/CSS/JS)
│   └── index.html               # Web Terminal UI
├── dist/                        # Скомпилированный JS (TypeScript -> JS)
├── docs/                        # Документация
├── tests/                       # Тесты
├── deploy-sync.sh               # Скрипт деплоя
├── package.json                 # Зависимости
├── tsconfig.json                # TypeScript конфиг
└── index.html                   # Main HTML (для evabot.online)
```

---

## 🚀 Деплой на 2 GCP сервера

### EvaBrain (Backend / Compute Core)
- **VM:** `evabot-agent-vm` (Frankfurt, `europe-west3-a`)
- **IP:** `34.159.202.82` (внешний), `100.66.98.4` (Tailscale)
- **Specs:** c3-standard-8, 8 vCPU, 32 GB RAM
- **Запуск:** `node dist/server/server.js` (порт 3000)
- **Что деплоится:** `src/`, `dist/`, `package.json`

### EvaFace (Frontend / Edge Gateway)
- **VM:** `evaline-micro-vm` (Iowa, `us-central1-a`)
- **IP:** `136.114.26.252` (внешний), `100.125.200.49` (Tailscale)
- **Specs:** e2-micro, 2 vCPU, 1 GB RAM (Always Free)
- **Запуск:** Caddy (порт 443 / HTTP/3 QUIC)
- **Домены:** `evabot.online`, `evaline.online`, `evaline.network`, `evaline.website`
- **Что деплоится:** `public/`, `index.html`

### Связь
```
User -> evabot.online (443) -> Caddy (Iowa) -> WireGuard Mesh -> Backend (3000, Frankfurt)
```

---

## 📊 Модели и рейтинги

### Сводка
- **78 моделей** всего
- **46 бесплатных** (FREE)
- **32 платные** (PAID)

### Команды терминала
| Команда | Описание |
|---------|----------|
| `/top` | Топ-5 free + топ-5 paid |
| `/top free 10` | Топ-10 бесплатных |
| `/top paid 10` | Топ-10 платных |
| `/top speed 5` | 5 самых быстрых |
| `/top context 5` | 5 с самым большим контекстом |
| `/free` | Все 46 бесплатных |
| `/paid` | Все 32 платные |
| `/models` | Сводка |
| `/help` | Справка |
| `/clear` | Очистить экран |

### API Endpoints
| Endpoint | Method | Описание |
|----------|--------|----------|
| `/api/models` | GET | Все 78 моделей |
| `/api/models/free` | GET | 46 бесплатных с рейтингами |
| `/api/models/paid` | GET | 32 платные с рейтингами |
| `/api/models/top?dimension=quality&limit=10&free=true` | GET | Топ-N моделей |
| `/api/models/command` | POST | Выполнить команду `/top`, `/free`, `/paid` |
| `/api/chat` | POST | Чат (non-streaming) |
| `/api/chat/stream` | POST | Чат (SSE streaming) |
| `/api/health` | GET | Статус кластера |

---

## 🔧 Локальная разработка

```bash
# Установка
cd /var/www/evabot-backend
npm install

# Запуск dev сервера
npm run start

# Сборка
npm run build

# Тесты
npm test

# CLI клиент
python3 evabot-cli.py
```

---

## 🌐 Деплой

```bash
# Полный деплой (build + commit + push + sync to GCP)
./deploy-sync.sh "feat: my changes"

# Только билд
npm run build
```

---

## 🐛 Git Workflow

```bash
# Клонирование
git clone https://github.com/evaline-online/evabot-online.git

# Создание ветки
git checkout -b feature/new-feature

# Коммит
git add .
git commit -m "feat: description"

# Push
git push origin feature/new-feature

# Создание PR
gh pr create --base main --title "New feature"
```

---

## 📦 Стек

- **Backend:** Node.js 22, TypeScript 5.7, Express
- **AI Providers:** Google Gemini, OmniRoute, OpenRouter, OpenCode
- **Models:** 78 LLM (Gemini, Claude, Llama, Mistral, DeepSeek, etc.)
- **Frontend:** Vanilla HTML/CSS/JS (no framework)
- **Server:** Caddy (TLS 1.3 / HTTP/3 QUIC)
- **Mesh:** WireGuard (Tailscale)
- **Deploy:** GitHub Actions + gcloud compute ssh

---

**© 2026 EvaBot Ecosystem**  
**GitHub:** `evaline-network/evabot-online`  
**Status:** ✅ Production Ready
