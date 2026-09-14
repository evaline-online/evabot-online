---
title: Google Cloud Speech-to-Text (CloudSTT)
tags: [ops, stt, google-cloud, voice, only-free]
created: 2026-09-07
updated: 2026-09-07
module: src/core/CloudSTT.ts
---

Back to [[index]]

# Google Cloud Speech-to-Text (CloudSTT)

## Endpoints

| Component | Value |
|---|---|
| API | `POST https://speech.googleapis.com/v1/speech:recognize` (v1) |
| Model | `latest_long` (v1 standard — falls under the free tier) |
| Auth | `Authorization: Bearer <token>` from [[GoogleAuthProvider]] (`src/core/GoogleAuthProvider.ts`) |
| **Required header** | `X-Goog-User-Project: evabot-agent-server` |
| HTTP route | `POST /api/stt?lang=uk-UA&encoding=OGG_OPUS&sampleRate=48000` (`src/server/routes/VoiceRouter.ts`) |
| Core module | `src/core/CloudSTT.ts` → `transcribeAudio()`, `transcribeVoiceWithFallback()` |

Accepted request bodies on `/api/stt`: raw audio (`audio/*` / `application/octet-stream`), `multipart/form-data` (first file part), or JSON `{ "audio": "<base64>" }`. Response: `{ transcript, confidence, secondsBilled }`.

## ONLY-FREE rule & monthly cap

- **Chirp is NOT free**: per [cloud.google.com/speech-to-text/pricing](https://cloud.google.com/speech-to-text/pricing), the standard-model free tier ("Speech Recognition … 0–60 minute → $0.00") covers **v1 standard models** (`default`, `command_and_search`, `latest_short`, `latest_long`, `phone_call`, `video`); `chirp` is listed as *"Speech-to-Text V2 only"*, and the published V2 rate card has no recurring free allowance. Therefore the integration uses **v1 + `latest_long`**, never chirp.
- **Monthly cap**: `data/stt-usage.json` `{ "month": "YYYY-MM", "secondsUsed": N }` (UTC month). Hard cap `STT_MONTHLY_CAP_SECONDS = 3000` s (3600 s free tier − 600 s safety margin). Requests that would breach the cap are **refused before the API call** (`MONTHLY_CAP_REACHED`), never silently billed. Stale months roll over to a fresh zero counter automatically.
- Billed seconds = actual audio duration (Telegram `voice.duration` → `ffprobe` → size-based estimate fallback), rounded up — matching Google's 1-second rounding.
- **Telegram**: OGG_OPUS @ 48 kHz (`sampleRateHertz: 48000`, Telegram voice is 48 kHz). FLAC omits `sampleRateHertz` (auto-detected from the header).

## ffmpeg fallback chain (Telegram voice + CLI /listen)

1. Attempt `speech:recognize` with the original encoding (Telegram `.ogg`/opus → `OGG_OPUS`).
2. On API failure (not cap refusal): `ffmpeg -y -i <in> -ar 16000 -ac 1 -f flac <out>` → retry with `FLAC` (see `buildFfmpegFlacArgs` / `convertToFlac16k`).
3. Cap refusals short-circuit — no retry, no spend.

CLI: `/listen <file>` (aliases `/розпізнай`, `/распознать`, `/прослушать`, `/stt`) converts unsupported containers (mp3/wav/…) to FLAC 16 kHz mono first, then transcribes. Telegram handler (`src/telegram/TelegramBot.ts`) sends the transcript as `🎙 Розпізнано: <text>` and routes `/…` transcripts as commands, otherwise into the chat engine. Web fallback (`public/index.html` `VoiceEngine.fallbackServerStt`): on browser SpeechRecognition errors, POST a 6 s MediaRecorder webm clip as `WEBM_OPUS` to `/api/stt`; skipped silently when MediaRecorder is unavailable.

## Roundtrip evidence (2026-09-07, `/tmp/stt-roundtrip.log`)

- TTS: `texttospeech v1`, `ru-RU-Standard-A`, text `Перевірка розпізнавання мовлення` → 115 776 B LINEAR16.
- ffmpeg → FLAC 16 kHz mono (2.41 s) → `speech:recognize` (`latest_long`) →
  transcript **«переверка распознавание моления»**, confidence **0.888**, `totalBilledTime: 3s` (ru-RU voice reading Ukrainian text — phonetically faithful).
- Module-level call: `transcribeAudio()` → `ok: true`, `secondsBilled: 3`, usage file incremented `2026-09 → 3 s`.

## Related

- [[TELEGRAM_BOT]]
- TTS counterpart: `/say` — `src/core/CloudTTS.ts` (WaveNet free tier)
