---
title: Cloud TTS (Google Cloud Text-to-Speech)
tags: [ops, tts, google-cloud, only-free]
created: 2026-09-07
status: implemented
---

# Cloud TTS (Google Cloud Text-to-Speech)

Back to [[index]]

## Voice chain (2026-09-08, TASK-351): Edge-TTS primary, Google fallback

Decision (2026 reviews): the previous Google-only chain "sounds terrible"
compared to Azure Neural voices. The synthesis chain is now:

1. **PRIMARY — Microsoft Edge-TTS (Azure Neural)**, `src/core/EdgeTTS.ts`.
   Free/unlimited, no keys, no quota. Shells out to the `edge-tts` python
   package already installed on the server
   (`python3 -m edge_tts --voice <V> --text <T> --write-media <tmp.mp3>`,
   20 s deadline, output validated > 1 KB before it enters the cache).
   Verified on this host: uk-UA-PolinaNeural ~1 s, ru-RU-DmitryNeural ~3 s
   for short phrases.
2. **FALLBACK — Google Cloud TTS (Chirp3-HD)**, `src/core/CloudTTS.ts`
   (everything below in this document still applies to this fallback chain).
   Used only when the `edge_tts` subprocess fails (module missing, timeout,
   invalid output) — `EdgeTTS.synthesize()` THROWS and
   `VoiceRouter /api/tts` catches it and calls `cloudTts.synthesize`.

Persona voices:

| Persona | Edge-TTS primary (unlimited) | Google fallback (1M/mo free) |
|---------|------------------------------|------------------------------|
| Ева (female) | `uk-UA-PolinaNeural` | `uk-UA-Chirp3-HD-Aoede` |
| Адам (male)  | `ru-RU-DmitryNeural` | `ru-RU-Chirp3-HD-Fenrir` |

Runtime override: the existing `data/voice-prefs.json` file (`/voices set`)
also applies to the Edge chain, but ONLY for Edge-Neural voice names
(`uk-UA-PolinaNeural`, `uk-UA-OstapNeural`, `ru-RU-DmitryNeural`,
`ru-RU-SvetlanaNeural`) — Google catalog names in the prefs file never leak
into the Edge chain.

Limits: Edge-TTS = unlimited free (no cap, informational counter at
`data/edge-tts-usage.json`); Google fallback = 1M chars/month free with the
hard 900k cap described below.

## What it is (Google fallback)

Server-side speech synthesis for EvaBot (Ева / Адам personas) via
`POST https://texttospeech.googleapis.com/v1/text:synthesize`, reusing the
existing `GoogleAuthProvider` credentials chain (user-ADC refresh-token
exchange). Every request sends:

```
Authorization: Bearer <token>
X-Goog-User-Project: evabot-agent-server   ← REQUIRED for user-ADC auth
```

## ONLY-FREE rule & pricing verification (2026-09)

Verified against the official pricing page
**https://cloud.google.com/text-to-speech/pricing** (retrieved 2026-09-07):

| Family      | Free allowance / month | Price after free tier |
|-------------|------------------------|-----------------------|
| Standard    | 4,000,000 chars        | $4 / 1M chars         |
| **WaveNet** | **1,000,000 chars**    | $16 / 1M chars        |
| Neural2     | 1,000,000 chars        | $16 / 1M chars        |
| Chirp 3: HD | 1,000,000 chars        | $30 / 1M chars        |
| Studio      | 100,000 chars          | $160 / 1M chars       |

Key finding: the earlier assumption that **Chirp 3: HD has no free tier was
wrong** — it has 1M chars/month free like WaveNet/Neural2. However, after the
allowance it is the most expensive conversational family ($30/1M), and the
initial hypothesis was that uk/ru existed only as Chirp3-HD. **Live check of
`GET /v1/voices` (2066 voices total) proved otherwise:**

- **uk-UA**: Chirp3-HD (30 voices) **+ Standard-B (F) + Wavenet-B (F)**
- **ru-RU**: Chirp3-HD (8) **+ Standard A–E (F/M/F/M/F) + Wavenet A–E (F/M/F/M/F)**

Therefore the whole feature runs on the **WaveNet free family** — no Chirp3-HD
is used, and the ONLY-FREE rule is satisfied with a comfortable margin.

## Hard free-safety cap

`CloudTTS` enforces `MAX_CHARS_FREE_PER_MONTH` = **900,000 chars** (default,
Wavenet-family safety margin under the 1M free allowance; override via env
`TTS_MONTHLY_CHAR_CAP`). Behavior:

- Monthly counter persisted at `data/tts-usage.json` → `{ "month": "2026-09", "chars": N }`
  (resets automatically on month rollover).
- A synthesis request whose `charCount` would exceed the cap is **refused
  before any API call** — it never silently spends money. The refusal result
  carries `overCap: true` + a clear `PAY-PER-CHAR after cap: US$16 per 1M
  chars (WaveNet)` label, and callers fall back to browser TTS.
- Chirp3-HD / paid-family voices are never selected by defaults; if someone
  explicitly configures one via `TTS_VOICE_EVA` / `TTS_VOICE_ADAM`, the same
  cap logic applies and the pay-per-char note is included in errors/status.

## Chosen voices (verified from live /v1/voices, genders confirmed)

| Persona | Voice | Gender | Family / free tier |
|---------|-------|--------|--------------------|
| Ева (eva) | `uk-UA-Wavenet-B` | FEMALE | WaveNet — 1M chars/mo free |
| Адам (adam) | `ru-RU-Wavenet-D` | MALE | WaveNet — 1M chars/mo free |

Env overrides: `TTS_VOICE_EVA`, `TTS_VOICE_ADAM`, `TTS_MONTHLY_CHAR_CAP`
(see `src/core/Config.ts`).

## Architecture

- `src/core/EdgeTTS.ts` — PRIMARY chain: Edge-TTS (Azure Neural),
  free/unlimited, subprocess `python3 -m edge_tts` with a 20 s deadline,
  MP3 cache in the same `data/tts-cache/` directory (sha1 of
  `voice::text`), throws on failure so the router falls back.
- `src/core/CloudTTS.ts` — FALLBACK synthesis, monthly counter, disk cache
  (`data/tts-cache/<sha1(text+voice)>.mp3`), 10 s timeout via
  `Resilience.withTimeout`, never throws into the chat flow (failures resolve
  `{ ok: false, error }`). Also hosts the shared ONLY-FREE voice catalog
  (`VOICE_CATALOG`) with the `edge-neural` family ranked BEFORE
  `chirp3-hd` so `/voices` renders Edge-Neural voices first with an
  unlimited free allowance.
- `src/server/routes/VoiceRouter.ts` — HTTP surface, registered in
  `src/server/server.ts` sub-routers.
- `public/index.html` `VoiceEngine.speak()` — tries cloud TTS first
  (persona persisted in `evabot_tts_persona`), falls back to the existing
  browser `speechSynthesis` on failure/over-cap; persona pitch/rate tuning
  applies only to the browser fallback.
- `src/cli/terminal-chat.ts` — `/say` command.

## Endpoints

### POST /api/tts

Request: `{ "text": "...", "persona": "eva" | "adam", "lang": "uk-UA" }`

Chain: Edge-TTS first, Google fallback. The response carries the actual
`provider` used (`"edge-tts"` | `"google-tts"`).

Success (200):

```json
{ "ok": true, "audioBase64": "//OE…", "mimeType": "audio/mp3",
  "voice": "uk-UA-PolinaNeural", "charCount": 14, "cached": false,
  "provider": "edge-tts", "overCap": false }
```

Google-fallback success looks identical except `voice` is a Chirp3-HD name
and `provider` is `"google-tts"`.

Failure / over-cap (still HTTP 200, so the web client falls back cleanly):

```json
{ "ok": false, "voice": "…", "charCount": 30, "overCap": true,
  "payPerCharAfterCap": true, "charsLeftThisMonth": 0,
  "fallback": "browser-tts", "error": "Monthly free cap (900000 chars) reached. …" }
```

### GET /api/tts/status

```json
{ "voicesReady": true, "monthChars": 14, "cap": 900000, "remainingChars": 899986,
  "evaVoice": "uk-UA-Wavenet-B", "adamVoice": "ru-RU-Wavenet-D",
  "family": "wavenet",
  "freeTier": "WaveNet: 1,000,000 chars/month free (verified 2026-09, cloud.google.com/text-to-speech/pricing)",
  "payPerCharNote": "PAY-PER-CHAR after cap: US$16 per 1M chars (WaveNet)" }
```

## CLI usage

```
/say <text>      # synthesize → /tmp/evabot-say.mp3, prints path + size + chars left
/скажи <текст>   # alias (uk)
/сказать <текст> # alias (ru)
```

Output example:

```
✔ Аудио сохранено: /tmp/evabot-say.mp3 (12.4 KB)
  Голос: uk-UA-Wavenet-B | символов: 30 | осталось символов в этом месяце: 899970
```

## Setup

1. APIs already enabled on project `evabot-agent-server` (Text-to-Speech API).
2. Auth: handled automatically by `GoogleAuthProvider` (user-ADC refresh
   token at `~/.config/gcloud/legacy_credentials/evabot.online@gmail.com/adc.json`).
   The `X-Goog-User-Project: evabot-agent-server` header routes quota/billing
   to that project.
3. No build/restart was performed during implementation; deploy via the
   normal flow (`deploy-sync.sh`) when ready.
4. Tests: `tests/cloudtts.test.ts` (registered in `tests/index.ts`), fully
   mocked — no live API calls. `tests/edge_tts.test.ts` covers the Edge chain
   (catalog, rank order, cache keys, prefs override, failure policy) plus one
   real-synthesis check that SKIPS itself with
   `skipped: edge-tts unavailable` when `python3 -m edge_tts --help` fails on
   the host.

## References

- Pricing: https://cloud.google.com/text-to-speech/pricing (Chirp 3: HD free
  tier & per-char prices verified 2026-09)
- Voice list: https://cloud.google.com/text-to-speech/docs/list-voices-and-types
- API reference: https://cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize
