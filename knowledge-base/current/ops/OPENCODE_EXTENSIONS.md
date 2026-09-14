# OpenCode Extensions — Recommended FREE MCP & LSP Servers (2026)

> Research date: 2026-09-07. Every recommendation below was **verified to exist**
> (npm registry or GitHub API) before inclusion. Nothing in this doc has been
> applied to `~/.config/opencode/opencode.json` — the snippets are for manual
> adoption. Current EvaBot baseline (14 MCP servers + 4 global LSPs) stays as is;
> additions are per-project opt-in, not maximalism (each MCP server's tool
> schemas consume context on every request).

## 1. Evaluation table (MCP + tooling)

| Tool | Type | What it adds | Install | Memory/CPU cost | Priority |
|---|---|---|---|---|---|
| **Serena** (`oraios/serena`, ~29k★, MIT) | MCP | Symbol-level semantic code retrieval & editing via language servers (40+ langs): find-symbol, find-references, rename, replace-symbol-body. Surgical edits on large codebases at a fraction of the grep/read token cost. Directly complements the existing `typescript-language-server`. | `uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant` (Python/uv; **not on npm**) | ~150–300 MB per project (language server) | **HIGH** |
| **codebase-memory-mcp** (`DeusData/codebase-memory-mcp`, ~42k★, MIT) | MCP | Indexes the repo into a persistent knowledge graph (158 langs, sub-ms queries); cross-session context retention — "what/where is X" without re-reading files. 99% fewer tokens vs raw reads. Single static binary, zero deps. | GitHub release binary → `./codebase-memory-mcp serve` (see repo README) | ~100–200 MB RAM after first index (persistent on disk) | **HIGH** |
| **claude-task-master** (npm `claude-task-master` 1.6.4, ~28k★, MIT) | MCP | PRD → dependency-aware task graph / kanban; keeps long multi-step refactors on track across sessions (solves "agent forgot step 3" on long chats). | `npm i -g claude-task-master` → `task-master init` → stdio `npx -y --package claude-task-master task-master-mcp` | ~50 MB (Node), state in `.taskmaster/` JSON | **HIGH** |
| **oxlint** (npm 1.82.0) + **eslint_d** (npm 15.0.3) | LSP / CLI | Millisecond-lint feedback loop. opencode has **built-in oxlint + eslint LSP servers** that activate when the dep is in the project — just add them as devDeps of `/var/www/evabot-backend`. Fastest path to "faster error fixing". | `npm i -D oxlint eslint_d` (opencode LSP auto-detects) | oxlint: ~30 MB, sub-100ms runs; eslint_d: persistent daemon ~120 MB | **HIGH** |
| **dockerfile-language-server-nodejs** (npm 0.15.0) | LSP (custom) | Dockerfile diagnostics/hover/completion for the repo's Docker builds and `deploy-sync.sh` images — no built-in support in opencode. | `npm i -g dockerfile-language-server-nodejs` + custom LSP entry below | ~60 MB (idle between edits) | MED |
| **bash-language-server** (npm 5.6.0) | LSP | Shell lint/diagnostics for `deploy-sync.sh`, `start-term.sh`, scripts/. **Note:** opencode *built-in* bash LSP auto-installs this already — global install only needed for the 5-agent shared setup. | `npm i -g bash-language-server` | ~50 MB | MED |
| **yaml-language-server** (npm 1.24.0) | LSP | CI workflows, systemd drop-ins, k8s/compose, LiteLLM omniroute config validation (schema-aware). Built-in `yaml-ls` in opencode auto-installs it; global install for agent-suite parity. | `npm i -g yaml-language-server` | ~80 MB | MED |
| **vet-mcp** (Apache-2, see `best-of-mcp-servers`) | MCP | Security vetting of npm packages *before* the agent installs them (flags malicious/abandoned deps suggested by AI tools). Good guardrail since EvaBot agents add deps autonomously. | GitHub (`safedep/vet`) — single binary | ~40 MB | LOW |
| **Biome** (`@biomejs/biome` 2.5.12) | Formatter/CLI | Alternative to eslint+prettier in one Rust binary; only if the team wants to migrate linting away from eslint 10. | `npm i -D @biomejs/biome` | ~25 MB, very fast | LOW (redundant with oxlint/eslint) |
| **Memory MCP** (`@modelcontextprotocol/server-memory` 2026.8.31) | MCP | Already installed. Knowledge-graph long-term memory — no change needed; see hygiene §4. | — | ~30 MB | already active |
| tree-sitter / typegrep / code-index-mcp / mcp-server-tree-sitter / taskmaster-ai / @oraios/serena (npm) | — | **NOT on npm** (404 verified) or superseded — do not chase npm installs for these; Serena = GitHub/uvx, code indexing = codebase-memory-mcp. | — | — | ❌ rejected |

Not recommended for EvaBot today: angular-cli/svelte/rust-analyzer/vue LSPs (no Angular/Svelte/Rust/Vue in the stack), protobuf LSP (no `.proto` files), jdtls/go/ruby (unused languages — each LSP daemon is a standing RAM cost).

## 2. Recommended `opencode.json` additions (DO NOT apply automatically)

Add to project config `/var/www/evabot-backend/opencode.json` (project scope wins over global; commit it so all agents share it):

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  // Enable built-in LSP feedback (auto-installs bash, yaml-ls, oxlint, eslint
  // when the respective deps/extensions are present in the project)
  "lsp": true,
  "lsp": {
    // keep built-ins (typescript, pyright, bash, yaml-ls, oxlint, eslint) and add:
    "dockerfile": {
      "command": ["dockerfile-language-server", "--stdio"],
      "extensions": [".dockerfile", "Dockerfile"]
    },
    "markdown": {
      "command": ["marksman", "lsp"], // marksman already in PATH (global suite)
      "extensions": [".md", ".mdx"]
    }
  },
  "mcp": {
    "serena": {
      "type": "local",
      "command": ["uvx", "--from", "git+https://github.com/oraios/serena", "serena", "start-mcp-server", "--context", "ide-assistant", "--project", "/var/www/evabot-backend"],
      "enabled": true
    },
    "codebase-memory": {
      "type": "local",
      "command": ["/opt/codebase-memory-mcp/codebase-memory-mcp", "serve", "--project", "/var/www/evabot-backend"],
      "enabled": true
    },
    "taskmaster": {
      "type": "local",
      "command": ["npx", "-y", "--package", "claude-task-master", "task-master-mcp"],
      "enabled": true
    }
  },
  // Context hygiene (§4)
  "compaction": { "auto": true, "prune": true, "reserved": 10000 },
  "watcher": { "ignore": ["node_modules/**", "dist/**", "logs/**", "archive/**", "backups/**", "knowledge-base/evaline-knowledge-base/chroma_db/**"] }
}
```

Notes:

- `lsp: true` + object form: the object form **keeps built-ins enabled** while adding custom entries (dockerfile, marksman). Don't duplicate the snippet's two `lsp` keys — merge them (JSONC shown for clarity).
- Serena needs `uv` (or `pipx`). One shared instance per project — it spawns per-language servers lazily.
- codebase-memory-mcp: download the static binary from GitHub releases to `/opt/`, index once, sub-ms queries thereafter.
- taskmaster state lives in `.taskmaster/` inside the repo — add it to `.gitignore` if not wanted in VCS.

## 3. LSP additions — what actually matters for EvaBot

| Language/file | Status | Action |
|---|---|---|
| TypeScript/JS | ✅ covered (`typescript-language-server`) | keep; add `oxlint` + `eslint_d` as project devDeps so opencode's built-in eslint/oxlint LSPs light up |
| Python | ✅ covered (pyright) | keep |
| HTML/CSS/JSON | ✅ covered (vscode-*) | keep |
| Markdown | ✅ global marksman | register as **custom** opencode LSP entry (opencode has no built-in marksman) |
| Bash (`.sh`, scripts/) | built-in auto-install | nothing to do beyond `lsp: true` |
| YAML (CI, systemd, omniroute config) | built-in auto-install (`yaml-ls`) | nothing to do beyond `lsp: true` |
| Dockerfile | **no built-in** | custom entry above (`dockerfile-language-server-nodejs`) |
| Lua / Go / Jsonnet / Rust / Vue / Svelte | not used by EvaBot | skip (standing RAM cost with zero benefit) |

Reminder from opencode docs: LSP is a feedback channel, not a substitute for explicit commands — keep `npx tsc --noEmit`, `npm test`, and lint commands documented in `AGENTS.md` so the agent runs them directly.

## 4. Context-window hygiene strategies

1. **Project-scope MCPs, 3–6 per project.** The 14-server global suite is right for the *agent pool*; for coding sessions, enable only: filesystem, serena (or codebase-memory — not both initially), context7, taskmaster. Tool schemas ride every request.
2. **Compaction**: `"compaction": { "auto": true, "prune": true }` — auto-compacts at window pressure and prunes stale tool outputs (biggest single saver on long debug sessions).
3. **`/compact` pattern**: run `/compact` *after* each milestone (e.g., "tests green", "feature merged"), not when overflow forces it — compaction quality drops when the model is already near the limit. Before compacting, persist state: write decisions to the memory MCP graph (`create_entities`) or to `WORKLOG.md` so post-compaction sessions can re-derive context.
4. **Memory MCP usage**: store durable facts (repo layout, model IDs, service names) as entities/relations once, then `search_nodes` instead of re-reading files. Rotate: quarterly prune of stale entities (`sync-mcp` days).
5. **Watcher ignores** (snippet above): `dist/`, `logs/`, `archive/`, `backups/`, `node_modules/`, `chroma_db/` — otherwise file watching floods session context on rebuilds.
6. **Docs lookup discipline**: context7 first for library APIs (already installed); Serena symbol-lookup instead of `grep`+read for code navigation; avoid pasting whole files when `replace-symbol-body` edits suffice.
7. **Snapshot cost**: for a repo this size with many generated artifacts, consider `"snapshot": false` if disk/indexing pressure appears — tradeoff: no UI revert.

## 5. Top-5 shortlist (TL;DR)

1. **Serena MCP** — symbol-level code intelligence; biggest token/quality win for a TS codebase this size.
2. **codebase-memory-mcp** — persistent repo knowledge graph; context retention across long chats/sessions.
3. **claude-task-master MCP** — dependency-aware task graph for long refactors; survives compaction.
4. **oxlint + eslint_d** (project devDeps → built-in opencode LSPs) — fastest error-fix loop, near-zero config.
5. **Bash/YAML LSPs (built-in) + Dockerfile LSP (custom)** — covers scripts, CI, and container config that the current 4-language suite misses.
