# EvaBot Telegram Bot — Operations Guide

The Telegram transport reuses the **exact same command surface** as the web terminal and CLI:
user messages that start with `/` go through `normalizeCommand` + `ModelCommand.execute`
(`src/models/ModelRatings.ts`); plain messages are routed through a thin `ChatEngine` facade
(`src/telegram/ChatEngine.ts`) that composes the same units as the web `ChatRouter`
(`UniversalLlmClient` + `KnowledgeBaseConnector` + `RulesEngine` + `ChatHistoryStore`).

- Module: `src/telegram/TelegramBot.ts` (long-polling, plain `fetch`, zero new npm deps)
- Chat facade: `src/telegram/ChatEngine.ts`
- Config: `src/core/Config.ts` → `Config.telegramBotToken` (env `TELEGRAM_BOT_TOKEN`)
- Wiring: `src/server/server.ts` → `startServerAsync()` calls `startTelegramBot()` at the end, guarded
- Tests: `tests/telegram.test.ts` (runs as part of `npm test`)

## 1. Getting a bot token (BotFather)

1. Open Telegram and message **@BotFather** (the official bot).
2. Send `/newbot` and follow the prompts:
   - a display name (e.g. `EvaBot`)
   - a username ending in `bot` (e.g. `evabot_neural_bot`)
3. BotFather replies with a token like `123456789:AAExampleTokenHERE`.

Optionally refine later: `/setdescription`, `/setuserpic`.

## 2. Setting the env variable

On `evabot-agent-vm`, edit `/var/www/evabot-backend/.env` (the loader in `Config.ts`
also auto-parses `.env` in the working directory):

```bash
echo 'TELEGRAM_BOT_TOKEN=123456789:AAExampleTokenHERE' >> /var/www/evabot-backend/.env
```

Or export it in the systemd unit environment if the brain runs under
`evabot-brain.service`:

```bash
sudo systemctl edit evabot-brain.service
# [Service]
# Environment=TELEGRAM_BOT_TOKEN=123456789:AAExampleTokenHERE
```

## 3. Restart the brain

```bash
sudo systemctl restart evabot-brain.service
journalctl -u evabot-brain.service -n 50 -f | grep -i telegram
```

Expected log lines:

- with token: `[TelegramBot] Telegram bot started (long-polling)`
- without token: `Telegram bot disabled (no token)` — the server keeps running normally,
  Telegram support is simply inert.

No port or webhook configuration is needed: the bot uses **long polling**
(`getUpdates`, 25s timeout), so it works behind NAT/firewalls with only outbound
HTTPS to `api.telegram.org`.

## 4. Testing

1. Open your bot in Telegram → send `/start`.
   You should get the localized greeting banner (EN default; send `/lang uk` or `/lang ru` to switch —
   the locale is persisted per chat in memory).
2. `/help` — the full command banner (same engine as web/CLI).
3. `/models` — model summary **plus a reply keyboard with the top-8 free models**;
   tapping a model name shows its passport (`/info`).
4. `/history 5`, `/top free`, `/search <query>` — alias-aware (`/історія`, `/история`, …).
5. Send a plain sentence (no `/`) — goes through the chat engine, session id
   `tg-<chatId>` in `data/chat-history.db`. Verify with `/history` or:
   `sqlite3 /var/www/evabot-backend/data/chat-history.db "select * from messages where session_id like 'tg-%' order by ts desc limit 5;"`
6. Send a voice note → the bot replies
   `Voice transcription: coming soon (Whisper via Groq available)`
   (the `.ogg` file is downloaded; STT is intentionally not implemented yet).
7. Rate limiting: send 3 messages in rapid succession — they are answered at
   most 1/sec per chat (per-chat serialized queue).

## 5. Telegram-specific behaviors

| Concern | Behavior |
|---|---|
| 4096-char limit | `splitTelegramMessage()` splits on blank lines → newlines → spaces → hard cut; all chunks ≤ 4096 chars |
| Unknown/`/` commands | normalized via `COMMAND_ALIASES` (UK/RU) and executed by the shared `ModelCommand` |
| Long commands (`/free`, `/top`) | full text output, chunked automatically |
| Per-chat language | in-memory map `chatId → locale` (`/lang uk\|ru\|en`) |
| Rate limit | 1 msg/sec per chat (per-chat FIFO queue) |
| Voice | download + placeholder reply (Whisper/Groq planned) |

## 6. Troubleshooting

- **`401 Unauthorized` in logs** — wrong/revoked token; re-request via BotFather `/revoke`.
- **`409 Conflict`** — another process (or server) is polling with the same token.
  Only one instance may long-poll per token.
- **No reply at all** — check `journalctl` for `Telegram bot disabled (no token)`
  (token missing in the process env) and outbound HTTPS to `api.telegram.org`.
- **History not persisted** — `chat-history.db` is append-on-success; a warning
  `Chat history persistence skipped` in logs means the SQLite file is not writable.
