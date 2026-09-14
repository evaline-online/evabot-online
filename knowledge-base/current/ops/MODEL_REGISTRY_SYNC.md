# OpenRouter Registry Sync (TASK-323)

## What it does

`scripts/sync-openrouter-registry.ts` is a standalone drift probe for the
OpenRouter free-model fleet defined in the live-verified **section 9b** of
`src/models/ModelRegistry.ts`.

On every run it:

1. Fetches `https://openrouter.ai/api/v1/models` (uses `OPENROUTER_API_KEY`
   from the environment when present; otherwise works unauthenticated —
   the key value is never printed or logged).
2. Filters the **100% free** models: `pricing.prompt == 0` AND
   `pricing.completion == 0`.
3. Sorts them by `created` descending and takes the **top 15**.
4. Parses the current section-9b ids out of `src/models/ModelRegistry.ts`
   **by regex** (the registry file is never imported; the meta-router id
   `openrouter/free` is excluded from the comparison because it is a local
   registry construct, not an OpenRouter catalog model).
5. Prints a human-readable drift report to stdout:
   `ADDED` / `REMOVED` / `UNCHANGED`.
6. Writes a machine-readable snapshot to
   `data/model-monitor/openrouter-free-snapshot.json`.

Exit code is **always 0** — this is observability, not a gate. Transient
OpenRouter API failures are logged and swallowed so the daily timer never
pages on flaky network calls.

## Why

The OpenRouter free-model reality drifts fast. Discovered 2026-09-08:
legacy `:free` ids (deepseek-r1:free, gpt-4o-mini:free, ...) became **paid**
while the registry still listed them. A stale fleet silently routes workloads
to paid endpoints. The daily probe detects exactly this.

## Enabling (systemd)

Unit files live in `config/` (not installed yet — root action required):

- `config/evabot-registry-sync.service` (oneshot)
- `config/evabot-registry-sync.timer` (`OnCalendar=daily`, `Persistent=true`)

To enable:

```bash
sudo cp /var/www/evabot-backend/config/evabot-registry-sync.{service,timer} /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now evabot-registry-sync.timer
```

Logs accumulate in `logs/registry-sync.log` (appended by the unit).

Manual one-off run:

```bash
cd /var/www/evabot-backend && npx tsx scripts/sync-openrouter-registry.ts
```

## Snapshot

`data/model-monitor/openrouter-free-snapshot.json` — one file, overwritten on
each run. Contents: `generatedAt`, run context (authenticated?, total/free
model counts), the `drift` object (`added` / `removed` / `unchanged`), and the
full top-15 free-model list with `id`, `name`, `created`, `context_length`.
Machine-readable, so AlertManager (or any future consumer) can diff
consecutive snapshots or alert on non-empty `added`/`removed`.

## Acting on drift

1. **Human review first (current policy):** when the report shows
   `ADDED` or `REMOVED` models, a maintainer manually updates
   `src/models/ModelRegistry.ts` **section 9b only** — never the stale
   2025-era `:free` section 9 — and re-runs the probe until it reports
   `OK: registry 9b is in sync`.
2. **AlertManager (planned follow-up):** wire the snapshot into AlertManager
   so a non-empty `added`/`removed` set raises an alert (severity `warning`)
   instead of relying on a human reading `logs/registry-sync.log`.
