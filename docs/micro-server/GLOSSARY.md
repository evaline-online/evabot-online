# EvaBot Ecosystem — Glossary of Terms / Глоссарий терминов

> Project `evabot-online` · GCP project `evabot-agent-server` · All ecosystem terms are exactly **6 letters**, built on the `Eva*` prefix (as `EvaBot`, `EvaNet`).

## RU — Глоссарий

| Термин | Слой | Описание |
|---|---|---|
| **EvaBot** | Ядро | Главный AI-агент платформы; репозиторий `evabot-online` (v0.0.1 MVP) |
| **EvaNet** | Сеть | Tailscale-mesh: `EvaBrain` ↔ ноутбук ↔ `EvaCell` ↔ `EvaPalm` |
| **EvaFace** | Edge | Айова-шлюз `evaline-micro-vm` (e2-micro) — Caddy, https://evabot.online |
| **EvaBrain** | Compute | Вычислительное ядро `evabot-agent-vm` (c3-standard-8, europe-west3-a) |
| **EvaCell** | Мобильный | Pixel 10 Pro XL — беспроводной узел (Tailscale `100.80.216.27`, ADB :5555) |
| **EvaPalm** | Ретро-мост | Oppo A5 Pro 5G — второй карманный узел (USB через macbook) |
| **EvaLink** | Мосты | `~/ssh-bridge/` + `~/eva-link/` — SSH/ADB туннели, скрипты, ключи |
| **EvaVoice** | Голос | Голосовой контур: ассистент на `EvaCell`, Reef-интерфейс EN/RU/UK |
| **EvaHub** | Центр | Точка управления на `EvaBrain` (:3000), телеметрия и команды |
| **EvaDeck** | UI | Кибер-терминал, 6 экранов (чат, телеметрия, OpEx, модели, гейты, аудит) |
| **EvaGate** | Каналы | Омниканальные мессенджеры: Telegram / WhatsApp / Viber / Messenger |
| **EvaOps** | Деплой | `deploy-sync.sh` : Local → GitHub → `EvaFace` (rsync + systemd + Caddy) |
| **EvaKeys** | Security | SSH-ключи, Tailscale, ADC-аутентификация, API-ключи |
| **EvaRig** | Инфраструктура | GCP-проект `evabot-agent-server` (№873069440066), аккаунт `evabot.online@gmail.com` |
| **EvaModel** | AI | Каталог Google Model Garden gemini-роутера (20 моделей, Gemini 2.0/1.5) |
| **EvaConsilium** — *не 6-букв., доуступный термин* | AI | Consilium Engine — мультиагентная консилиум-система |

### Карта устройств EvaNet
| Узел | Tailscale IP | Статус |
|---|---|---|
| `EvaBrain` (evabot-agent-vm) | `100.66.98.4` | активен |
| `EvaFace` (evaline-micro-vm) | `100.125.200.49` | активен |
| macbook-air-2018 | `100.102.22.45` | активен |
| `EvaCell` (pixel-10-pro-xl) | `100.80.216.27` | активен |
| `EvaPalm` (oppo-a5-pro-5g) | `100.126.165.5` | периодически офлайн |

## EN — Glossary

| Term | Layer | Description |
|---|---|---|
| **EvaBot** | Core | The main AI agent; repository `evabot-online` |
| **EvaNet** | Network | Tailscale mesh: `EvaBrain` ↔ laptop ↔ `EvaCell` ↔ `EvaPalm` |
| **EvaFace** | Edge | Iowa edge gateway `evaline-micro-vm` serving https://evabot.online |
| **EvaBrain** | Compute | Frankfurt compute core `evabot-agent-vm` |
| **EvaCell** | Mobile | Pixel 10 Pro XL — wireless node (Tailscale + ADB over Wi-Fi) |
| **EvaLink** | Bridges | SSH/ADB tunnels, scripts and keys in `~/ssh-bridge/`, `~/eva-link/` |
| **EvaVoice** | Voice | Voice loop: assistant on `EvaCell`, neural voice EN/RU/UK |
| **EvaHub** | Control | Control point on `EvaBrain` (:3000) for telemetry & commands |
| **EvaDeck** | UI | 6-screen cyber terminal (chat, telemetry, costs, models, gates, audit) |

## UK — Глосарій

| Термін | Шар | Опис |
|---|---|---|
| **EvaBot** | Ядро | Головний AI-агент; репозиторій `evabot-online` |
| **EvaNet** | Мережа | Tailscale-mesh: `EvaBrain` ↔ ноутбук ↔ `EvaCell` ↔ `EvaPalm` |
| **EvaFace** | Edge | Шлюз в Айові `evaline-micro-vm` — https://evabot.online |
| **EvaBrain** | Compute | Обчислювальне ядро `evabot-agent-vm` у Франкфурті |
| **EvaCell** | Мобільний | Pixel 10 Pro XL — бездротовий вузол (Tailscale + ADB) |
| **EvaLink** | Мости | SSH/ADB тунелі та ключі (`~/ssh-bridge/`, `~/eva-link/`) |
| **EvaVoice** | Голос | Голосовий контур (EvaCell + нейроголос EN/RU/UK) |
| **EvaHub** | Центр | Пункт керування на `EvaBrain` (:3000) |

---
*Status: draft v1 · Дата создания: 2026-09-06 · Naming rule: все термины — ровно 6 латинских букв, префикс `Eva`.*
