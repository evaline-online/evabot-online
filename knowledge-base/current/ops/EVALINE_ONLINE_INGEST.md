# EvaLine Online Repo Ingest (TASK-350)

## What was integrated

The company site repo `/home/evabot/evaline-online` (53 MB) is now part of Eva's Brain.
Content indexed (27 documents, trilingual en/uk/ru):

| Content | Files | Categories |
|---|---|---|
| `docs/architecture.{en,uk,ru}.md` | 3 | architecture |
| `docs/audit_and_diagnosis.{en,uk,ru}.md` | 3 | audit |
| `docs/user_guide.{en,uk,ru}.md` | 3 | user-guide |
| `KANBAN.{en,uk,ru}.md` | 3 | kanban |
| `MANIFESTO.md`, `manifesto.txt` | 2 | manifesto |
| `README.md` | 1 | company-overview |
| `evabot_full_documentation.{en,uk,ru}.md` | 3 | evabot-docs |
| `evabot_modular_architecture.{en,uk,ru}.md` | 3 | evabot-docs |
| `evabot_cli_verification.{en,uk,ru}.md` | 3 | evabot-docs |
| `evabot_v001_release.{en,uk,ru}.md` | 3 | evabot-docs |

Skipped by design: `node_modules/`, `dist/`, `backups/`, `archive/`, `legacy_archive/`,
`public/`, `src/`, `tests/`, `scripts/`, `.git/`, `*.metadata.json`.

## Counts

| Metric | Before | After |
|---|---|---|
| SQLite FTS5 chunks (total) | 1086 | 1438 |
| FTS chunks from evaline-online | 0 | 352 |
| Memory documents | 178 | 205 |
| evaline-online memory docs | 0 | 27 (en=11, ru=8, uk=8) |

Chunking is identical to `knowledge-base/evaline-knowledge-base/build_knowledge_base.py`:
split on `#`-`###` headers, 1200-char soft limit, `Document: / Section:` contextual
prefix, chunk ids `{lang}_{stem}_{n}`, `file_path` = `evaline-online/<relpath>`.

## Implementation

- `src/core/KnowledgeBase.ts`
  - `possibleRoots` extended with `/home/evabot/evaline-online`.
  - New `loadEvalineOnline()`: recursive md/txt scan (depth 3, ignore list),
    language detection from filename suffix `.en` / `.uk` / `.ru`
    (non-suffixed files default to `en`), memory doc ids prefixed
    `evaline-online-`, dedupe by id, FTS indexing via new
    `indexEvalineOnlineChunks()`.
  - `indexEvalineOnlineChunks()` inserts into `chunks_fts` and skips files that
    already have chunks (dedupe by `file_path`) — incremental and idempotent.
- `scripts/ingest-evaline-online.ts`
  - Prints FTS/memory counts before and after, runs verification searches
    (`EvaLine производство`, `audit`, `user guide`).

## How to re-run

```bash
cd /var/www/evabot-backend
npx tsx scripts/ingest-evaline-online.ts
```

Re-runs are idempotent (dedupe by source path): if a file has not changed, its
chunks are skipped. To force a rebuild of only the evaline-online part:

```bash
sqlite3 knowledge-base/evaline-knowledge-base/fts_index.db \
  "DELETE FROM chunks_fts WHERE file_path LIKE 'evaline-online/%';"
npx tsx scripts/ingest-evaline-online.ts
```

At service startup `KnowledgeBase.initialize()` runs the same ingest automatically,
so manual re-run is only needed after changing files in `/home/evabot/evaline-online`
while the service is up (restart also picks them up).

## Verification

- `knowledgeBase.search('EvaLine производство')` returns relevant production docs
  (site content); `audit` returns `docs/audit_and_diagnosis.{en,ru}.md` chunks;
  `user guide` returns `docs/user_guide.en.md` chunks.
- 178-doc baseline behavior preserved: 205 - 27 = 178 legacy memory docs intact.
