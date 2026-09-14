---
title: OpenCode Extensions — Applied (2026-09-07)
date: 2026-09-07
type: ops-log
status: done
tags: [opencode, mcp, lsp, omniroute]
---

# OpenCode Extensions — Applied

Back to [[index]]

Applies the recommendations from [[OPENCODE_EXTENSIONS]] to `/home/evabot/.config/opencode/opencode.json`.
Backup: `~/.config/opencode/opencode.json.bak-20260907`. Final JSON validated with `python3 -m json.tool`.

## 1. OmniRoute model list — synced with live proxy (Part 1)

- Fetched `http://127.0.0.1:20128/v1/models` → **35 models**, exact match confirmed.
- Replaced the omniroute `models` object with the 35 live IDs; entry style preserved (`{"name": "<human label>"}`).
- Ordering: `omni/groq-gpt-oss-120b` first in the free block, remaining free models in live-list order, Google (paid) block last.
- Labels: `[FREE] Groq/Cloudflare/OpenRouter/Z.ai: …` for the free prefixes; `Google: …` for gemini; `Mistral: Codestral Latest` for `omni/mistral-codestral`.
- **Removed stale IDs** that no longer exist on the proxy (e.g. all `hf/*` omniroute models, `omni/gemini-2.5-*`, `omni/claude-*`, `omni/gpt-*`, `omni/deepseek-*`, `omni/qwen-*`, `omni/meta-*`, `omni/granite-*`, `omni/grok-*`, `omni/kimi-k3`, `omni/kat-*`, `omni/seed-*`, old `omni/*-free` OpenRouter slugs with `-free` suffix).
- All other providers left byte-identical (verified programmatically): google, openrouter, huggingface (402-depleted, untouched as instructed), groq, cerebras, zai, cloudflare-ai, mistral.

## 2. MCP additions (Part 2) — 3 verified, all added

| Server | Command | Verification |
|---|---|---|
| **serena** | `~/.local/bin/serena start-mcp-server --context claude-code --project-from-cwd` | ✅ Installed via `uv tool install -p 3.13 serena-agent` (current README method, **not** the doc's `uvx git+https://…`). Launched from `/var/www/evabot-backend`: MCP server up with 21 tools, clean stdio lifecycle. Full path used per the docs' "discoverability" pitfall. |
| **taskmaster** | `npx -y --package=task-master-ai task-master-mcp` | ✅ JSON-RPC `initialize` handshake answered (`Task Master MCP Server 0.43.1`). **Doc correction:** the doc's `claude-task-master` npm package (1.6.4) has no `task-master-mcp` binary (only `claude-task-init`) — its MCP server lives in `task-master-ai` (verified: `npm view task-master-ai bin`). |
| **codebase-memory** | `~/.local/opt/codebase-memory-mcp/codebase-memory-mcp` | ✅ Static binary downloaded from GitHub release v0.10.8 (linux-amd64) to `~/.local/opt/codebase-memory-mcp/`. JSON-RPC `initialize` handshake answered; stdio default mode per `--help`. |

- `uv`/`uvx` already present at `~/.local/bin` — no uv install needed.
- **Serena context note:** `--context ide-assistant` is **deprecated** (logs: "renamed to 'claude-code'"). Current valid contexts: `ide`, `claude-code`, `vscode`, `codex`, etc. We use `claude-code` (single-project workflow) + `--project-from-cwd`.

## 3. LSP additions (Part 3 of task) — 3 installed globally

All three were missing; installed via `npm i -g` (footprint: `~/.npm-global`, ~17 packages total incl. deps):

| Server | npm package (version) | Binary | opencode wiring |
|---|---|---|---|
| Bash | `bash-language-server` 5.6.0 | `bash-language-server start` | extensions: `.sh`, `.bash` |
| YAML | `yaml-language-server` 1.24.0 | `yaml-language-server --stdio` | extensions: `.yml`, `.yaml` |
| Dockerfile | `dockerfile-language-server-nodejs` 0.15.0 | `docker-langserver --stdio` | extensions: `Dockerfile`, `.dockerfile` |

Existing LSP entries (typescript, pyright, vscode html/css/json, marksman) untouched.

## 4. Skipped / notes

- **Nothing failed verification** — all three MCP candidates passed launch tests, so the "serena + max 2 more" budget is used exactly (serena, taskmaster, codebase-memory).
- **huggingface provider**: left as-is per instructions (API key returns 402; config untouched).
- The old `opencode.json.bak_20260907_093506` (earlier same-day backup) predates this change and was not modified.
- `sync-mcp` should be run to propagate the MCP suite changes to the other 4 agent environments (per AGENTS.md).

## 5. Install footprint

- **uv tool**: `serena-agent` → `~/.local/share/uv/tools/serena-agent/` (Python 3.13 venv; ~200 MB with deps). Executables: `serena`, `serena-agent`, `serena-hooks`.
- **Binary**: `codebase-memory-mcp` v0.10.8 (single static Go binary) → `~/.local/opt/codebase-memory-mcp/` (~30–50 MB on disk).
- **npm -g**: bash-language-server@5.6.0, yaml-language-server@1.24.0, dockerfile-language-server-nodejs@0.15.0 → `~/.npm-global`.
- Runtime RAM (idle): serena ~150–300 MB per project (language servers lazy), codebase-memory ~100–200 MB after first index, taskmaster ~50 MB on demand, LSPs ~50–80 MB each on file open.

## 6. Rollback

```bash
cp ~/.config/opencode/opencode.json.bak-20260907 ~/.config/opencode/opencode.json
uv tool uninstall serena-agent
npm uninstall -g bash-language-server yaml-language-server dockerfile-language-server-nodejs
rm -rf ~/.local/opt/codebase-memory-mcp
```
