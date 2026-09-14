# EvaBot Frontend — Testing Guide

Unit testing stack for the `frontend/` Vite + TypeScript workspace. Introduced for
KANBAN TASK-324 (frontend coverage was 0%, no test runner at all).

## Stack

| Tool | Purpose |
|---|---|
| vitest | Test runner (Vite-native, zero extra config for TS) |
| @vitest/coverage-v8 | Code coverage via the V8 provider |
| jsdom | Browser-like test environment (localStorage, DOM) |

## Running

All commands run inside `frontend/`:

```bash
npm run test            # single run, watch mode off
npm run test:coverage   # single run + V8 coverage report
npx vitest              # watch mode during development
npx vitest run src/ansi.test.ts   # a single file
```

TypeScript is type-checked separately (`npm run build` runs `tsc --noEmit`);
test files are included in that check.

## Configuration

`frontend/vitest.config.ts`:

- `environment: 'jsdom'` — every test file runs in a simulated browser
  (localStorage, `TextEncoder`, `ReadableStream` are available).
- `include: ['src/**/*.test.ts', 'tests/**/*.test.ts']` — tests live next to
  the source or under `frontend/tests/`.
- Coverage: provider `v8`, `include: ['src/**/*.ts']`,
  `exclude: ['**/*.d.ts', 'src/main.ts']` (entry point has no logic).

## What is covered

| Module | Status | Notes |
|---|---|---|
| `src/ansi.test.ts` | 16 tests | Pure ANSI engine: `stripAnsi`, `visibleWidth` (CJK/emoji double-width), `padEndVisible`/`padStartVisible`, `escapeHtml`, `toHtml` (SGR-to-inline-style mapping, span close on reset, unknown code dropping), `trafficLightIcon`, `renderTerminalTable` (layout, widths, format callbacks), `renderError`, `renderNotice`. |
| `src/ansi-format.test.ts` | 34 tests | Remaining ANSI helpers: `trafficLightColor`, `statusBadge` (default/custom/fallback labels), `badge`, `divider`, `sectionHeader`/`sectionFooter` (box width via `visibleWidth`, long-title minimum-width path), `formatBanner` (line structure, body padding), `promptSymbol` (mode mapping, case-insensitivity), `formatPrompt` (model/role/mode composition, `general_assistant` omission), `chatBoxHeader`/`chatBoxFooter`/`renderChatBoxContent`/`renderChatBoxWithCost` (cost + tip branches), `renderCostLine` (FREE vs PAID, commercial valuation), `renderConsiliumTurn` (free/paid tags, optional token summary), `renderConsensusBox` (incl. empty synthesis), `renderAuditBox` (with/without model rows), `renderUserLine`, `renderDevModeBlock` (ON/OFF, has-key vs no-key), `renderConfigBlock` (full config vs empty-object defaults), `renderRawAnsiBlock` (ESC escaping), `renderOnboardingStep`, `ANSI_WHISPER_COMMANDS`, `ONBOARDING_TIPS`. |
| `src/api.test.ts` | 9 tests | Network layer with `vi.stubGlobal('fetch', ...)` and mocked `ReadableStream` SSE bodies: `CatalogStore` (load-once semantics, accessors, failure resilience), `fetchHealth` (ok + offline), `streamChat` (SSE chunk accumulation, usage/cost delivery, in-stream error events, non-ok HTTP error). |
| `src/api-extra.test.ts` | 21 tests | Untested API surface: `fetchAppConfig` (ok + offline), `setServerDevMode` (POST body, non-ok, thrown), `fetchBootBannerText` (content/empty/404/offline), `fetchBootDiagnostics` (URL model encoding + failure), `fetchVoiceConfig`, `toggleVoicePlugin` (resolves through network rejection), `runConsilium` (payload unwrap, server error message, malformed error body fallback), `CatalogStore` extras (`fetchTopModels` ok + failure, empty-catalog accessors, `defaultModel` adoption vs omission). |
| `src/onboarding.test.ts` | 6 tests | `OnboardingHandler` against jsdom localStorage: first-step render, step advance + persistence, auto-skip of configured steps, action execution, completion flag (`STORAGE_DONE`), `isDone()`/`reset()`. |
| `src/onboarding-edge.test.ts` | 12 tests | Edge cases: corrupted/negative/out-of-range saved step recovery, fractional index truncation, completion from the last step, no advancement past the final step, multi-step auto-skip chains (full and partial), welcome step always shown first, spec invariants (unique keys/titles, body lines + actions per step, per-key `autoDone`, `ready` body composition). |
| `src/smartinput.test.ts` | 47 tests | `SmartInput` autocorrect engine from `app.ts`: `levenshtein` (empty/unicode/symmetry), `subsequenceScore` (prefix + streak bonuses, case-insensitivity), vocab storage (corrupted JSON, command stripping, frequency, recency decay, VOCAB_CAP trimming), lexicon merge + `learnCorrection`, on/off toggle, `protectSegments` (fences, URLs, unclosed fences, orphan markers), `matchCase`, `correctWord` (ties, distance budget), `fixCommand` (known/prefix/translit/fuzzy/ambiguous), `normalizePunct` (spacing rules, numbers, trailing whitespace), `autocorrect` integration (fence/URL/vocabulary protection, learning), `TRANSLATIONS` i18n shape (identical key sets, non-empty values, per-language distinctness, locale-policy zero-tolerance). |

Total: 7 files, 145 tests, all passing.

`src/smartinput.test.ts` imports `app.ts`, whose module scope boots `EvaBotWebApp`
on `DOMContentLoaded`; the test dispatches the event manually and uses fake
timers (`shouldAdvanceTime`) so the boot telemetry intervals never create real
pending handles.

## Baseline coverage (`npm run test:coverage`, TASK coverage push round 2)

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `src/ansi.ts` | 84.91% | 74.87% | 81.81% | 86.57% |
| `src/api.ts` | 95.9% | 81.48% | 95.45% | 99.05% |
| `src/onboarding.ts` | 72.41% | 100% | 62.5% | 74.39% |
| `src/app.ts` | 32.63% | 23.72% | 27.86% | 33.39% |
| `src/voice/*` | 0% | 0% | 0% | 0% |
| **All files** | **35.02%** | **28.25%** | **38.57%** | **35.87%** |

Previous baseline: 10.31% stmts / 7.02% branch / 18.18% funcs / 10.64% lines.

## Modules intentionally not tested (and why)

- `src/models.ts`, `src/voice/GeminiLiveProtocol.ts` — TypeScript type and
  interface declarations only; zero runtime logic to assert.
- `src/voice/*` UI/client modules (`VoiceDockUI`, `GeminiLiveClient`,
  `AudioPCMStreamer`, `VoiceVisualizer`) — depend on WebAudio, WebSocket and
  canvas APIs; candidates for future integration tests with heavy mocking.
  `VoiceDockUI` is vi-mocked in `src/smartinput.test.ts` so the app boot does
  not touch it.
- `src/app.ts` remaining ~67% — the chat render loop, slash-command parser,
  screen transitions and voice engine wiring are DOM/event-coupled; the pure
  `SmartInput` autocorrect engine and `TRANSLATIONS` dictionary are now
  extracted as exports and fully tested. The rest needs component-level
  tooling (see next steps).
- `src/main.ts` — empty entry point, excluded from coverage by config.

## Conventions

- Test files are colocated with sources (`src/*.test.ts`) or placed in
  `frontend/tests/`.
- No emojis in test names.
- Network is always mocked with `vi.stubGlobal('fetch', ...)` +
  `vi.unstubAllGlobals()` in `afterEach`; static singletons (e.g. `CatalogStore`)
  are reset between tests via a `beforeEach` helper.
- Assertion style: narrow union types (`OnboardingView`) with `kind` checks
  before accessing variant-specific properties so `tsc --noEmit` stays clean.

## Next steps

1. **Component tests** — `app.ts` and `src/voice/VoiceDockUI.ts` need DOM-level
   testing. Add `@testing-library/dom` (or `happy-dom` + query helpers), extract
   small render helpers from `app.ts` where possible, and test status-bar /
   deck / dialog rendering against fixture ANSI strings.
2. **Voice protocol tests** — `GeminiLiveClient` can be tested with a mocked
   `WebSocket` transport asserting the JSON message shapes from
   `GeminiLiveProtocol.ts` (setup / realtimeInput / serverContent handling).
3. **E2E** — Playwright against `npm run preview` (or the dev server), covering
   the boot sequence, chat streaming and the onboarding funnel end to end.
4. **CI gate** — once the meaningful-code coverage (`ansi.ts`, `api.ts`,
   `onboarding.ts` + future component tests) exceeds a threshold, wire
   `npm run test:coverage` into CI with `--coverage.thresholds` in
   `vitest.config.ts`.
