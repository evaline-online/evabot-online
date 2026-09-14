---
title: "Cloud Translation Basic v3 — Google Translate integration"
date: "2026-09-07"
tags:
  - "ops"
  - "google-cloud"
  - "i18n"
  - "translate"
---

Back to [[index]]

# Cloud Translation (Basic v3) — EvaBot

Google Cloud Translation **Basic (v3)** wired into the EvaBot command surface as
`/translate` (aliases: `/переклад`, `/перевод`, `/переклади`, `/перевести`).

- Module: `src/core/Translator.ts` (zero new npm deps — plain `fetch`)
- Token: `src/core/GoogleAuthProvider.ts` (ADC refresh-token exchange → GCE metadata → gcloud)
- Command: `src/models/ModelRatings.ts` (`parseTranslateCommand` / `handleTranslate` / `handleTranslateSync`)
- Tests: `tests/translate.test.ts` (mockable fetch + token, no live calls)
- Usage counter: `data/translate-usage.json`

## Free tier (ONLY-FREE rule)

The **first 500,000 characters per month are free** (applied as a $10 credit that
does not roll over; beyond that $20 / 1M characters for NMT):

> Source: <https://cloud.google.com/translate/pricing> — "First 500,000 characters
> sent to the API to process (Basic and Advanced combined) per month are free."
> Verified 2026-09 (web search `Cloud Translation API pricing free 500000 characters 2026`).

To guarantee zero billing, `Translator` enforces a soft cap of **480,000 chars/month**
(persistent counter `data/translate-usage.json`, `{ month: 'YYYY-MM', chars }`,
auto-resets on month rollover). A request that would cross the cap is **refused
before any network call** with a clear Ukrainian message; nothing is ever spent.

## Endpoint & auth

```
POST https://translation.googleapis.com/v3/projects/evabot-agent-server/locations/global:translateText
Authorization: Bearer <access-token>          # GoogleAuthProvider.getCredentials()
X-Goog-User-Project: evabot-agent-server      # REQUIRED (billing/quota project)
Content-Type: application/json

{ "targetLanguageCode": "en", "contents": ["..."], "mimeType": "text/plain" }
```

- Source language is omitted → **auto-detect** (`detectedLanguageCode` in response).
- Max **128 fragments** per request (`contents[]`); larger inputs are auto-batched.
- Hard deadline **10 s** (`Resilience.withTimeout` + `AbortSignal.timeout`).

## Command usage

```
/translate <target-lang> <text>     # source auto-detected
/translate uk Привіт світ
/translate en какой прогноз цен на EVA
```

Target lang accepts any ISO code the API knows (uk, en, ru, pl, ro, de, ...).
The reply includes the translation + a usage footer:
`📡 Переклад-лічильник: N/480000 символів цього місяця (free tier: 500 000/міс)`.

## Sync vs async paths (follows the /news pattern)

- **CLI** (`src/cli/terminal-chat.ts`): `/translate` and its aliases route through
  `ModelCommand.executeAsync` → awaits the live call → prints the translation.
- **Web** (`POST /api/models/command` → `ModelCommand.execute`, sync): returns
  `⏳ Переклад у процесі...` immediately and runs the translation in the
  background; the result (or error) is appended to the operation log
  (`OpLog`, kind `command`) and is visible via `/log translate`.

## Never-throw guarantee

`Translator.translate()` never throws into the command path — missing
credentials, network failures, timeouts and API errors all come back as
`{ ok: false, error }` and are rendered as friendly `🌐 ...` messages.

## Bonus: auto-translation of /news titles (documented, not implemented)

Auto-translating `/news` titles into the active UI locale (ru/en while titles
are uk) was evaluated and **skipped**: it needs locale-aware cache keys in
`NewsEngine` (per-locale caches + doubled char usage on every feed refresh —
~30× the /translate volume), which risks burning the free tier and is too
invasive for the current news cache. If needed later: hook
`NewsEngine.formatNews` → `Translator.translate(titles[], locale)` and key the
news cache by `locale`, respecting the same `translate-usage.json` cap.

## Live verification (2026-09-07)

```
AUTH SOURCE: Google ADC (evabot.online@gmail.com)
LATENCY_MS: 165
OK: true | DETECTED: uk
TRANSLATION: EVA foam plant in Chornomorsk
USAGE: {"month":"2026-09","chars":29}
```
Log: `/tmp/translate-verify.log`.
