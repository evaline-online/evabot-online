# Evaline.Network — Метрики и Показатели

> **Статус**: LIVE (данные в реальном времени)  
> **Backend**: `evabot-brain.service` на `evabot-agent-vm` (Frankfurt, europe-west3-a)  
> **Edge**: Caddy на `evaline-micro-vm` (Iowa, us-central1-a)  
> **API**: `https://evaline.network/api/health`  

---

## 1. [CRITICAL] Состояние кластера (Dual-Node)

| Метрика | Значение | Источник |
|---|---|---|
| **Статус** | `online` | evabot-brain.service |
| **Версия** | `v0.1.0` | Backend |
| **Uptime (общий)** | ~9000+ сек (~2.5ч) | /proc/uptime |
| **Сервер** | `evabot-online-edge` | Caddy |
| **Меш сеть** | Tailscale 100.125.200.49 → 100.66.98.4 | WireGuard |
| **Latency mesh** | ~125ms | ping между нодами |

---

## 2. [HIGH] Телеметрия Compute: Европа (EvaBrain — evabot-agent-vm)

| Метрика | Значение | Машина |
|---|---|---|
| **CPU load (5.71)** | 41–71% | c3-standard-8 |
| **CPU cores** | 8 | Intel Sapphire Rapids |
| **RAM used** | ~15.3 / 31 GB | 32 GiB DDR5 |
| **Swap used** | ~2.4 / 8.0 GB | 30% |
| **Uptime** | 3d+ | systemd/GCP |
| **Роль** | Neural Compute Core, LLM Router | — |
| **API Port** | TCP 3000 (evabot-brain.service) | — |
| **AI Gateway** | OmniRoute/LiteLLM Proxy (port 20128) | — |
| **Agent Daemon** | Antigravity 2.0 Remote (port 9090) | — |

---

## 3. [HIGH] Телеметрия Compute: США (EvaFace — evaline-micro-vm)

| Метрика | Значение | Машина |
|---|---|---|
| **CPU load** | ~0.10–0.30 (5–15%) | e2-micro |
| **RAM used** | ~378–450 / 964 MB | 1 GiB DDR4 |
| **Uptime** | ~2 дня | systemd/GCP |
| **Роль** | Public Ingress, SSL/TLS termination | — |
| **Web server** | Caddy 2.11 (HTTP/2, HTTP/3) | — |
| **Security** | TLS 1.3 / HTTP/3 | ACME Let's Encrypt |

---

## 4. [HIGH] Доступные модели и LLM-провайдеры

| Провайдер | Моделей | Статус |
|---|---|---|
| **Google Gemini (ADC)** | 3 (Flash, Pro 1M ctx) | ONLINE |
| **OmniRoute** | 94 модели (Groq/Cerebras) | ONLINE |
| **OpenRouter** | 56 бесплатных кодинг-моделей | ONLINE |
| **OpenCode** | включено | ONLINE |
| **Всего моделей** | **78–94** | — |
| **API Key** | `hasServerApiKey: true` | — |
| **Auth** | Google ADC (`evabot.online@gmail.com`) | — |

---

## 5. [HIGH] Базы данных и хранилища

| База | Название | Количество записей | Статус |
|---|---|---|---|
| **ChromaDB** | Vector DB | 1,075 векторов | OK |
| **SQLite FTS5** | Full-text index | 1,474 документа | OK |
| **SQLite FTS5** | Hybrid memory KB | 206 записей | OK |
| **SQLite MCP** | MCP storage | — | OK |
| **Загрузка** | ChromaDB + SQLite на evabot-agent-vm | — | — |

---

## 6. [MEDIUM] Плагины и агенты

| Плагин | Версия | Статус | Описание |
|---|---|---|---|
| **llm-providers** | 1.0.0 | healthy (4/5 providers) | Unified gateway: Google, OmniRoute, OpenRouter, OpenCode |
| **consilium** | 1.0.0 | healthy | Multi-agent: solo, broadcast, dialogue, consilium (5 агентов) |
| **knowledge-base** | 1.0.0 | healthy (178 docs) | EvaLine KB: 182 docs, 6 languages |
| **Всего плагинов** | 3 | 3 active | — |

---

## 7. [HIGH] Сеть и безопасность

| Параметр | Значение |
|---|---|
| **Режим доступа** | TLS 1.3 / HTTP/3 |
| **Rate limit** | 100 req/60s на /api/health |
| **Non-confidential** | публичная телеметрия |
| **EARLYOOM** | <10% RAM, >80% Swap — ARMED |
| **EVA-WATCHDOG** | Каждые 3 мин, сброс TL-пауз >20 мин — ACTIVE |
| **Firewall** | HTTP(80), HTTPS(443), HTTP3(udp/443), ICMP, internal 10.128.0.0/9 |

---

## 8. [MEDIUM] Connected Domain Registry

| Домен | Роль | IP |
|---|---|---|
| `https://evabot.online` | AI портал, чат-терминал | 136.114.26.252 (Caddy) |
| `evaline.network` | Архитектура кластера, телеметрия | 136.114.26.252 (Caddy) — **ACTIVE** |
| `https://evaline.online` | Цифровая идентичность, сервисы | 136.114.26.252 (Caddy) |
| `evaline.website` | Единый центр входа, репозитории | — |
| `github.com/evaline-online` | Организация GitHub (26 репозиториев) | — |

---

## 9. [LOW] GCP-инфраструктура

| Ресурс | Идентификатор | Статус |
|---|---|---|
| **Проект GCP** | `evabot-agent-server` (873069440066) | ACTIVE |
| **VM: evabot-agent-vm** | europe-west3-a, c3-standard-8, 34.159.202.82 | RUNNING |
| **VM: evaline-micro-vm** | us-central1-a, e2-micro, 136.114.26.252 | RUNNING |
| **Static IP** | `evaline-micro-ip` → 136.114.26.252 | IN_USE |
| **DNS zone** | `evaline-online-zone` (Cloud DNS) | — |
| **SSL cert** | `business-evaline-online-cert` (business.evaline.online) | PROVISIONING |
| **Load Balancer** | `business-url-map` → `business-backend` → micro-group | UNHEALTHY* |
| **CDN** | enableCDN=true (CACHE_ALL_STATIC) | ACTIVE |
| **Cloud Run** | `business-tier-api` (us-central1, 1vCPU, 512Mi) | ACTIVE (404 на root) |
| **Cloud Armor** | — | (нет политик) |
| **Storage** | — | (нет бакетов) |

> \* Бэкенд `business-backend` показывает UNHEALTHY в GCP Cloud Load Balancer, но сайт работает через прямой доступ к `136.114.26.252` через Caddy (bypass LB).

---

## 10. [LOW] Git-репозитории

| Репо | Remote URL | Ветка | Последний коммит |
|---|---|---|---|
| evaline-network | `github.com/evaline-online/evaline-network.git` | `fix/mobile-viewport-layout` | `df3abaa` — copy-to-clipboard, search, keyboard shortcuts (Sep 8) |
| evabot-online | `github.com/evaline-online/evabot-online` | `main` | — |

---

## 11. [HIGH] Endpoint API

| Endpoint | Метод | Описание |
|---|---|---|
| `https://evaline.network/` | GET | Terminal console (6805 байт HTML) |
| `https://evaline.network/dashboard.html` | GET | Live Markdown↔HTML конвертер + телеметрия (21KB) |
| `https://evaline.network/md-converter.html` | GET | Markdown↔HTML конвертер с fallback (13KB) |
| `https://evaline.network/telemetry.html` | GET | Телеметрия в реальном времени (25KB) |
| `https://evaline.network/api/health` | GET | Полная телеметрия кластера (JSON) |
| `https://evaline.network/api/models` | GET | Список моделей (free/paid) |
| `https://evaline.network/api/models/command` | POST | Команда `/top` и др. |

---

---

## 12. [HIGH] Caddyfile (micro-vm / EvaFace)

> **Production Caddyfile** (исправлен после краша 2026-09-08)

```caddy
{
    admin off
    auto_https disable_redirects
}

:80, :443 {
    @health path /health /healthz /ping
    respond @health "OK" 200
    handle_path /api/* {
        reverse_proxy http://100.66.98.4:3000
    }
}

evabot.online      → root /var/www/evabot.online    → reverse_proxy /api/* → 100.66.98.4:3000
evaline.network    → root /var/www/evaline.network  → reverse_proxy /api/* → 100.66.98.4:3000
evaline.online     → root /var/www/evaline.online   → reverse_proxy /api/* → 100.66.98.4:3000
business.evaline.online → root /var/www/business.evaline.online → /api/* → Cloud Run
pro.evaline.online → root /var/www/pro.evaline.online (basicauth отключен)
```

**Примечание**: `rate_limit` directive удалён (требует внешний модуль, не входит в Caddy 2.11.4). `basic_auth` с Apache `$apr1$` hash заменён — `pro.evaline.online` блок отключён.

---

## 13. [MEDIUM] Cloud Run: business-tier-api

| Параметр | Значение |
|---|---|
| **URL** | `https://business-tier-api-873069440066.us-central1.run.app` |
| **Регион** | `us-central1` |
| **CPU** | 1 vCPU |
| **Memory** | 512 MiB |
| **Max scale** | 10 instances |
| **Container** | `us-central1-docker.pkg.dev/evabot-agent-server/cloud-run-source-deploy/business-tier-api` |
| **Env vars** | `STRIPE_SECRET_KEY=sk_test_placeholder`, `STRIPE_WEBHOOK_SECRET=whsec_placeholder` |
| **Startup probe** | TCP port 8080 (240s timeout) |
| **Status** | Ready (создан 2026-09-08 22:30) |

---

## 14. [MEDIUM] Deploy flow (deploy-sync.sh)

```
/local fs → GitHub → 2 ноды
  ├── evabot-agent-vm (Frankfurt): git pull, npm install, npm build, systemctl restart evabot-brain
  └── evaline-micro-vm (Iowa):       git pull, rsync frontend, systemctl reload caddy
```

| Шаг | Действие | Целевая нода |
|---|---|---|
| 0 | npm run build | Локально |
| 1 | Проверка health localhost:3000 | Локально |
| 2 | Тест моделей /top | Локально |
| 3 | git add, commit, push | GitHub |
| 4 | gcloud ssh evabot-agent-vm → git pull, npm i, build, restart | Frankfurt |
| 5 | gcloud ssh evaline-micro-vm → git pull, rsync, reload caddy | Iowa |

---

## 15. [LOW] Локальная файловая структура

| Путь | Описание | Размер |
|---|---|---|
| `/var/www/evaline.network/` | Git-репо (github.com/evaline-online/evaline-network.git) | 170KB index.html + README.md |
| `/var/www/evaline.network/.git/` | Git history, ветки: `main`, `fix/mobile-viewport-layout`, `micro-live` | — |
| `/var/www/evaline.online/` | Monorepo с TypeScript source, dist, docs | 2.9MB |
| `/var/www/evabot-backend/` | Backend сервер, AGENTS.md, deploy-sync.sh, EVALINE_NETWORK_METRICS.md | — |
| `/var/www/evaline.network/md-converter.html` | Live Markdown↔HTML конвертер (13KB) | 13KB |

---

## Приоритет сбора метрик
|---|---|---|---|
| 1 | CRITICAL | `/api/health` (весь JSON) | `curl -s https://evaline.network/api/health` |
| 2 | HIGH | CPU/RAM нагрузка (Frankfurt) | `health.telemetry.frankfurt.cpuPct` |
| 3 | HIGH | CPU/RAM нагрузка (Iowa) | `health.telemetry.iowa.cpuPct` |
| 4 | HIGH | Mesh latency | `health.telemetry.meshLatencyMs` |
| 5 | HIGH | DB статусы | `health.databases.*` |
| 6 | HIGH | Rate limit остаток | `x-ratelimit-remaining` в headers |
| 7 | MEDIUM | Модели онлайн | `health.availableModels` |
| 8 | MEDIUM | Плагины | `health.plugins[].enabled` |
| 9 | LOW | GCP инфраструктура | `gcloud compute instances list` |
| 10 | LOW | Git changelog | `git -C /var/www/evaline.network log` |
