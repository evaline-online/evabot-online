---
title: Gemini Quota & Billing Verification
date: 2026-09-07
tags:
  - gemini
  - vertex-ai
  - quota
  - billing
  - research
description: Жива верификация фактического пути авторизации EvaBot к Gemini (ADC → Vertex AI), состояния биллинга проекта evabot-agent-server, лимитов free tier Gemini API и связи с подпиской Google AI Pro. Проверено live-пробами 2026-09-07.
---

# Gemini Quota & Billing Verification

> Исследование (без изменений `src/`). Live-пробы выполнены **2026-09-07** на VM `evabot-agent-vm` (europe-west3-a).
> Источники кода: `src/core/GoogleAuthProvider.ts`, `src/core/GeminiClient.ts`, `src/core/Config.ts`, `/opt/omniroute/omniroute.env`.

**Back to [[index]]**

---

## 1. Вердикт по пути аутентификации (какой credential реально используется)

Цепочка в `GoogleAuthProvider.getCredentials()` (src/core/GoogleAuthProvider.ts:27) — по приоритету:

| # | Источник | Состояние на VM | Используется? |
|---|----------|-----------------|---------------|
| 1 | `process.env.GEMINI_API_KEY` | В `evabot-brain.service` **EnvironmentFile нет** → переменная не задана. В `/opt/omniroute/omniroute.env` задана, но это **другой сервис**, и значение — OAuth-токен `AQ.Ab8RN6I...` (НЕ `AIza...` API-ключ), который **протух** (live-проба → HTTP 401) | ❌ |
| 2 | ADC refresh-token exchange (`~/.config/gcloud/legacy_credentials/evabot.online@gmail.com/adc.json`, client `32555940559-...` = gcloud CLI) | Файл существует, exchange успешен → Bearer `ya29.` токен, scope `cloud-platform`, аккаунт `evabot.online@gmail.com` | ✅ **АКТИВНЫЙ ПУТЬ** |
| 3 | GCE metadata server | Достижим, но не вызывается (шаг 2 отрабатывает раньше) | — |
| 4 | `gcloud auth print-access-token` | Работает, тот же аккаунт | fallback |

⚠️ Нюанс: в коде зашит «blacklist» ключа `AIzaSyBmgELFPYjax4lWcFIZd183EpqQwVqAVlA` (GoogleAuthProvider.ts:37, GeminiClient.ts:34, Config.ts:56) — если `GEMINI_API_KEY` равен этому ключу, он игнорируется и используется ADC.

**Куда уходят запросы:** в `GeminiClient` разделение жёсткое (GeminiClient.ts:116, 174):

- `type === 'bearer'` (наш случай) → **ТОЛЬКО Vertex AI**: `https://{europe-west3|us-central1}-aiplatform.googleapis.com/v1/projects/evabot-agent-server/locations/{loc}/publishers/google/models/{model}:generateContent` (GeminiClient.ts:92-95). На `generativelanguage.googleapis.com` bearer-токен **никогда не отправляется**.
- `type === 'api_key'` → `generativelanguage.googleapis.com/v1beta` (Gemini API).
- 404 → перебор локаций → fallback на `gemini-2.5-flash` (дефолт из Config.ts:57).
- **`X-Goog-User-Project` в GeminiClient НЕ отправляется** (в отличие от `Translator.ts:160`, `CloudSTT.ts:209`, `CloudTTS.ts:322`, где он есть). Для Vertex это не критично — проект уже в URL; для `generativelanguage` с user-ADC квота без этого заголовка не определена (см. пробу №2).

## 2. Live-пробы (2026-09-07)

| # | Проба | Результат |
|---|-------|-----------|
| 1 | Vertex AI `gemini-2.5-flash:generateContent`, project `evabot-agent-server`, europe-west3, Bearer ADC | **HTTP 200**, `usageMetadata`, `trafficType: ON_DEMAND` |
| 2 | `generativelanguage/v1beta/models` + Bearer ADC (cloud-platform scope), **без** `X-Goog-User-Project` | **HTTP 403 `ACCESS_TOKEN_SCOPE_INSUFFICIENT`** |
| 3 | То же **с** `X-Goog-User-Project: evabot-agent-server` | Тот же HTTP 403 — заголовок не спасает: Gemini API требует scope `generative-language` либо API-ключ |
| 4 | `generativelanguage` + omniroute `AQ.` токен как Bearer | **HTTP 401 UNAUTHENTICATED** — токен мёртв (`tokeninfo` пуст) |
| 5 | `gcloud services list` | `generativelanguage.googleapis.com` + `aiplatform.googleapis.com` — включены |
| 6 | `gcloud alpha services quota list --consumer=projects/evabot-agent-server --service=generativelanguage.googleapis.com` | Бакеты free-tier есть (см. §3) |

**К какому проекту идёт квота:** Vertex — однозначно `evabot-agent-server` (в URL). `X-Goog-User-Project` для generativelanguage корректен, но требует отдельного scope — текущий ADC его не даёт.

## 3. Состояние биллинга и лимиты

- **Проект `evabot-agent-server`: billing ENABLED** (billing account `016725-23E254-FD499D`).
  → Vertex AI usage (`ON_DEMAND`) — **ПЛАТНЫЙ**, тарифицируется per-token, не free tier.
- Квоты `generativelanguage` на проекте (service quota list) содержат **free-tier бакеты**, например `gemini-2.5-flash`: `generate_content_free_tier_input_token_count = 250 000`; а также нестандартные first-party размеры (`antigravity`, `chat-bard`, `gemini-2.5-pro-1p-freebie`) — проект имеет спец-квоты. Актуальные RPM/RPD — только через AI Studio.

**Free tier Gemini API (актуальные ориентиры 2026; Google больше не публикует единую таблицу — смотрите AI Studio):**

| Модель | RPM | TPM (input) | RPD |
|--------|-----|-------------|-----|
| Gemini 2.5 Flash | ~10–15 | 250K–1M | ~1 500 |
| Gemini 2.5 Flash-Lite | ~15–30 | 250K–1M | ~1 500 |
| Gemini 2.5 Pro | 5 | — | **50** (по сути платный с 2026) |
| Gemini 3 Flash | 10 | 250K | 1 500 |

Источники: [rate-limits](https://ai.google.dev/gemini-api/docs/rate-limits), [pricing](https://ai.google.dev/gemini-api/docs/pricing). Квота — **per project**, не per key; RPD сброс в полночь Pacific. Free tier = «Active project», биллинг подключать не нужно; при подключении биллинга проект уходит в Tier 1 (cap $250).

**Vertex AI цены (путь, который реально используем мы):**

| Модель | Input / 1M | Output / 1M |
|--------|-----------|-------------|
| gemini-2.5-flash | $0.30 | $2.50 |
| gemini-2.5-pro | $1.25 (<200K ctx) / $2.50 (>200K) | $10.00 |
| gemini-2.5-flash-lite | $0.075 | $0.30 |

Цены выросли 02.07.2026; thinking-токены тарифицируются как output.

## 4. Связь с Google AI Pro (ответ: **НЕТ**, не влияет на API)

- **AI Pro/Ultra** ($19.99/$99.99) — потребительские подписки: Gemini app, NotebookLM, Code Assist, 5 TB, Flow credits.
- Официально: «Google AI plan benefits for developer usage apply **only within the Google AI Studio web interface**. Direct use of the Gemini API … is billed and managed **separately**» ([google-ai-plans](https://ai.google.dev/gemini-api/docs/google-ai-plans)).
- Подтверждение на форуме: consumer-подписки **не дают** API rate limits/квот; AI Pro даёт $10/мес Developer Program credits (нужен prepay $10, чтобы их применить) ([forum](https://discuss.ai.google.dev/t/inquiry-regarding-gemini-api-limits-fixed-subscriptions-third-party-integration-and-estimated-daily-costs/176212)).

## 5. Рекомендуемая стратегия квоты

1. **Оставить основной путь как есть**: ADC Bearer → Vertex AI (`evabot-agent-server`) — платно, но стабильно, без 429-лимитов free tier, с data-not-for-training. Стоимость при текущих нагрузках (тысячи запросов × сотни токенов) — единицы центов/день на 2.5-flash.
2. **Fallback-цепочка**: Vertex (europe-west3 → us-central1) → (опционально) Gemini API через отдельный **AI Studio API-ключ** (`AIza...`) в отдельном *free* проекте (без биллинга) для дешёвых фоновых задач, mindful: free-tier данные могут использоваться для обучения (для EEA/CH/UK — нет).
3. **Не полагаться** на `AQ.`-токен omniroute (мёртв, 401) — либо обновлять его, либо удалить путь.
4. Для generativelanguage с user-ADC добавить scope `generative-language` + заголовок `X-Goog-User-Project: evabot-agent-server` (по аналогии с Translator/CloudSTT/CloudTTS), если захотим единый проект квоты.
5. Живые лимиты смотреть в AI Studio (per project), не в коде; spend-cap Tier 1 = $250 — выставить budget alert в GCP.
