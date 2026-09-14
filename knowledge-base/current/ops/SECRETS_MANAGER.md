---
title: SECRETS_MANAGER
type: ops
project: evabot-agent-server
date: 2026-09-07
tags: [ops, security, gcp, secret-manager]
status: active
---

# Secret Manager Migration Plan

Back to [[index]]

## Current state (as of 2026-09-07)

| Location | Contents | Status |
|---|---|---|
| `/opt/omniroute/omniroute.env` | 12 API keys/vars (plain text, mode-restricted) | **live source of truth for omniroute** |
| `/var/www/evabot-backend/.env` | `PORT`, `HOST`, `DEFAULT_MODEL` — no secrets | stays local |
| `/var/www/evabot-backend/.env.example` | placeholders only | no action |
| `~/.config/opencode/opencode.json` | provider config w/ key refs | **stays local — do not migrate** |
| GCP Secret Manager (`evabot-agent-server`) | 12 secrets, all v1, byte-verified | created 2026-09-07, **not yet consumed by services** |

Running services (omniroute, evabot-backend) still read from env files. Nothing was switched over.

## Created secrets

All named `evabot-<lowercase-var>`, project `evabot-agent-server`, 1 active version each, sha256-verified round-trip against source.

| Secret | Source var | Source file | sha256 (first 16) |
|---|---|---|---|
| `evabot-gemini-api-key` | GEMINI_API_KEY | omniroute.env | `b3a16360c37b1eb8` |
| `evabot-openrouter-api-key` | OPENROUTER_API_KEY | omniroute.env | `e9de15efe0312af0` |
| `evabot-hf-token` | HF_TOKEN | omniroute.env | `c7e0c596ea0d142c` |
| `evabot-litellm-master-key` | LITELLM_MASTER_KEY | omniroute.env | `d7ce3705ba813ba1` |
| `evabot-groq-api-key` | GROQ_API_KEY | omniroute.env | `f2acdac19b98eb2e` |
| `evabot-cerebras-api-key` | CEREBRAS_API_KEY | omniroute.env | `f901ad16f8009acc` |
| `evabot-zai-api-key` | ZAI_API_KEY | omniroute.env | `941374129a0af22e` |
| `evabot-cloudflare-api-token` | CLOUDFLARE_API_TOKEN | omniroute.env | `8e5856a3c68b0e15` |
| `evabot-cloudflare-account-id` | CLOUDFLARE_ACCOUNT_ID | omniroute.env | `b2259a257dc4c729` |
| `evabot-mistral-api-key` | MISTRAL_API_KEY | omniroute.env | `8b331177bb45f4df` |
| `evabot-together-api-key` | TOGETHER_API_KEY | omniroute.env | `d142b9a98db45509` |
| `evabot-kilo-dummy` | KILO_DUMMY | omniroute.env | `a892500631d02dda` |

## Helper

`/var/www/evabot-backend/scripts/secrets.sh`:

```bash
secrets.sh get openrouter-api-key        # read latest version
secrets.sh set gemini-api-key newkey.txt # rotate (adds version)
secrets.sh list                          # table of secrets
secrets.sh pull-env                      # export VAR=... for migration
```

## Free-tier accounting

GCP Secret Manager free tier: **6 active secret versions/month**. 12 secrets × 1 version = **12 active versions → 6 over the free tier**.

Rotation note: `versions add` creates a *new* version; the old one stays active until disabled/destroyed. On rotation, disable+destroy the previous version to stay within quota.

To land ≤ 6, demote/remove these (low sensitivity, not true secrets):

1. `evabot-kilo-dummy` — literal dummy, not a secret
2. `evabot-cloudflare-account-id` — account ID, not a credential
3. `evabot-litellm-master-key` — internal token, low blast radius
4. `evabot-cloudflare-api-token`
5. `evabot-hf-token`
6. `evabot-zai-api-key`

Priority keep-list (the 6): `openrouter`, `gemini`, `groq`, `cerebras`, `mistral`, `together`.

Alternatively, disable the 6 low-priority secrets' versions (they can be re-enabled) — secrets remain listed but inactive versions don't count.

## Free-tier демоція (2026-09-07)

Executed on 2026-09-07: disabled the 6 low-priority versions (v1 of each) to bring active version count from **12 → 6** (exactly at free-tier limit). Disabled, not destroyed — values are preserved and can be re-enabled.

| Secret | Version | Before | After |
|---|---|---|---|
| `evabot-openrouter-api-key` | 1 | ENABLED | ENABLED (kept) |
| `evabot-gemini-api-key` | 1 | ENABLED | ENABLED (kept) |
| `evabot-groq-api-key` | 1 | ENABLED | ENABLED (kept) |
| `evabot-cerebras-api-key` | 1 | ENABLED | ENABLED (kept) |
| `evabot-mistral-api-key` | 1 | ENABLED | ENABLED (kept) |
| `evabot-together-api-key` | 1 | ENABLED | ENABLED (kept) |
| `evabot-kilo-dummy` | 1 | ENABLED | **DISABLED** |
| `evabot-cloudflare-account-id` | 1 | ENABLED | **DISABLED** |
| `evabot-litellm-master-key` | 1 | ENABLED | **DISABLED** |
| `evabot-cloudflare-api-token` | 1 | ENABLED | **DISABLED** |
| `evabot-hf-token` | 1 | ENABLED | **DISABLED** |
| `evabot-zai-api-key` | 1 | ENABLED | **DISABLED** |

Notes:

- Active versions across all secrets: **6** (before: 12). Disabled versions do not count toward the free-tier quota.
- Disabled secrets keep their values in the source file `/opt/omniroute/omniroute.env` (which remains the live source of truth for omniroute) and remain stored in Secret Manager. Nothing was destroyed.
- Re-enable any of them at any time: `gcloud secrets versions enable 1 --secret=<name> --project evabot-agent-server`.
- **Rotation rule:** `versions add` creates a *new* active version — on any secret update, immediately disable the previous version (`gcloud secrets versions disable <prev-id> --secret=<name>`) to stay ≤6 active versions.

## Migration plan for omniroute (NOT yet executed)

Option A — init-script pull (recommended, no new deps):

1. Create `/opt/omniroute/pull-secrets.sh`:
   `eval "$(secrets.sh pull-env)"` equivalent → writes `/opt/omniroute/omniroute.env` (mode 600) from `pull-env` output.
2. systemd unit for omniroute: add `ExecStartPre=/opt/omniroute/pull-secrets.sh` so env is refreshed at boot.
3. Restrict file perms (600, root or service user).
4. After 1 stable week, remove plaintext values from the old env file (keep only non-secret vars).
5. Rollback: restore original omniroute.env from backup; boot script failure falls back to last-good file (keep backup).

Option B — Secret Manager volume mount (requires `secretmanager-mount` CSI driver or gcloud-sidecar container) — heavier; only if omniroute moves into a container.

## opencode note

`~/.config/opencode/opencode.json` provider config stays local by design. It is excluded from migration and from the Secret Manager scope.

## IAM note

Auth is via **user ADC** (`evabot.online@gmail.com`), not a service account. Consequences:

- REST calls from scripts must send header `X-Goog-User-Project: evabot-agent-server` (billing/quota project).
- Access depends on the logged-in user session; unattended service boot needs a machine identity. **Recommendation:** create a dedicated service account (e.g. `omniroute-secrets@evabot-agent-server`) with role `roles/secretmanager.secretAccessor` on the 12 secrets and grant the compute default SA access, before switching boot-time pulls on.
- `gcloud secrets versions access` as the user works interactively; cron/systemd jobs should use the SA path once created.

## Security audit findings (2026-09-07, read-only)

Patterns scanned: `sk-or-v1-`, `gsk_`, `hf_`, `AIza`, `AQ\.`, `csk-`, `cfat_` in `/var/www/evabot-backend` (excl. node_modules, dist, .git).

| File:line | Pattern | Last 4 | In git history? | Note |
|---|---|---|---|---|
| `src/core/GoogleAuthProvider.ts:37` | AIza | `AVlA` | YES (commit 58ea6d9, 0630109) | hardcoded Gemini key used as comparison — real key in source |
| `src/core/Config.ts:56` | AIza | `AVlA` | YES (same key) | same hardcoded key |
| `src/core/GeminiClient.ts:34` | AIza | `AVlA` | YES (same key) | same hardcoded key |
| `frontend/index.html:367` | AIza | `Sy...` | n/a | placeholder text only, not a secret |
| `src/web/app.ts:193,278,363` | AIza | `Sy...` | n/a | placeholder text only, not a secret |
| git remote `origin` URL | ghp_ | `M4r3` | n/a (remote config, not commits) | **PAT embedded in remote URL** — see below |

Git history `-S` sample results: `sk-or-v1-` → 2 commits; `hf_` → 5 commits; `AIza` → 6 commits; `gsk_`, `AQ.`, `csk-`, `cfat_` → 0.

Recommended remediations (not executed here):

1. The hardcoded `AIzaSy…AVlA` key in the 3 src files is committed history — rotate the Gemini key in Google AI Studio, then refactor the 3 comparisons to reject by *prefix/pattern* instead of matching a key literal.
2. `ghp_` PAT sits in the origin remote URL (`https://ghp_…@github.com/…`). Switch to `gh auth setup-git` (credential helper) or SSH remote — **intentionally not changed in this task**.
3. Omniroute env file: keep mode 600; after migration remove plaintext values entirely.

## TASK-331 — Gemini key literal removed, Secret Manager wired in (2026-09-08)

The revoked hard-coded Gemini literal (`AIzaSy…AVlA`, see audit finding #1 above) has been **removed from `src/`**. Resolution order for the Gemini free-tier key is now implemented in `src/core/GoogleAuthProvider.ts`:

1. `GEMINI_API_KEY` env (backend `.env`) — active path on the VM today.
2. GCP Secret Manager secret `evabot-gemini-api-key` (project `evabot-agent-server`, Gemini API free tier, $0) — read lazily on first use via `gcloud secrets versions access latest --secret=evabot-gemini-api-key` (execFileSync, 10s timeout, ADC on the VM), **cached in memory for the process lifetime** (one access per boot ⇒ 6 accesses/month quota impact ≈ 0).
3. On failure the resolver returns `''` so callers degrade gracefully. The key value is never logged — only the resolution source.

Public API of `GoogleAuthProvider.ts`:

- `resolveGeminiApiKey(): string` — env → Secret Manager → `''`. Preferred entry point.
- `getGeminiApiKeyFromSecretManager(): string` — Secret Manager read, cached.
- `DEFAULT_GEMINI_API_KEY` — deprecated lazy compat shim (string-coerces to `resolveGeminiApiKey()`) kept only so out-of-scope importers (`src/core/GeminiClient.ts:130,135`) keep working without the literal. Follow-up: refactor `GeminiClient.ts` to call `resolveGeminiApiKey()` directly and label the source `Secret Manager: evabot-gemini-api-key (free tier)`.

Operational note: the Secret Manager access path uses **user ADC** (see IAM note above) — fine on this VM where ADC is present; if the service is later moved to a dedicated service-account identity, grant it `roles/secretmanager.secretAccessor` on `evabot-gemini-api-key`. Rotation: add a new version with `secrets.sh set gemini-api-key …`, then disable the previous version (free-tier accounting rule above); the running process picks the new value on next restart (in-memory cache).
