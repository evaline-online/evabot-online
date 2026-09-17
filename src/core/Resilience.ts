/**
 * Resilience.ts — Hang protection and provider fallback infrastructure.
 *
 * Provides:
 *  - withTimeout(): race a promise against a hard deadline so a hung provider
 *    call never blocks the brain forever.
 *  - CircuitBreaker: per-provider breaker (closed / open / half-open).
 *    Opens after `openThreshold` consecutive failures, stays open for
 *    `cooldownMs`, then allows a single half-open probe.
 *  - BREAKERS: static registry keyed by provider name (google, omniroute,
 *    openrouter, hf, zai, groq, cerebras, cloudflare, mistral, opencode).
 *  - ProviderFallbackChain: helpers to filter a candidate model chain by
 *    breaker health and render a text health report for the /health command.
 *
 * Design note: all state is in-process memory. After a process restart every
 * breaker resets to closed — acceptable for a single-node brain.
 */

import { logger } from './Logger.js';
import { OpLog } from './OpLog.js';

/** Default hard deadline for a single LLM provider call (45 s). */
export const LLM_CALL_TIMEOUT_MS = 45_000;

/**
 * Rejects if the wrapped promise does not settle within `ms` milliseconds.
 * The underlying promise is NOT cancelled (JS cannot cancel fetches without
 * an AbortSignal), but the caller stops waiting on it.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[TIMEOUT] ${label} did not complete within ${ms}ms`));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

export type BreakerState = 'closed' | 'open' | 'half-open';

export interface BreakerSnapshot {
  provider: string;
  state: BreakerState;
  consecutiveFailures: number;
  lastError?: string;
  lastErrorTs?: number;
  lastOkTs?: number;
  openedAtTs?: number;
}

/** Global ring buffer of the last provider errors (for /health "last 5 errors"). */
const recentProviderErrors: ChainAttemptEvent[] = [];

export class CircuitBreaker {
  public readonly provider: string;
  public openThreshold: number = 3;
  public cooldownMs: number = 60_000;

  private state: BreakerState = 'closed';
  private consecutiveFailures = 0;
  private lastError?: string;
  private lastErrorTs?: number;
  private lastOkTs?: number;
  private openedAtTs?: number;

  constructor(provider: string) {
    this.provider = provider;
  }

  public getState(): BreakerState {
    // An open breaker whose cooldown has elapsed transitions to half-open so
    // the next canAttempt() call admits a single probe request.
    if (this.state === 'open' && Date.now() - (this.openedAtTs || 0) >= this.cooldownMs) {
      this.state = 'half-open';
      OpLog.getInstance().log('warn', 'breaker', `${this.provider} → half-open (cooldown elapsed, admitting probe)`);
    }
    return this.state;
  }

  /**
   * Whether a request may be attempted right now.
   *  - closed  → always yes
   *  - open    → no (until cooldown elapses, then half-open allows one probe)
   *  - half-open → yes, but only one probe in flight (state is flipped to
   *    'open' semantics by recordSuccess/recordFailure outcomes)
   */
  public canAttempt(): boolean {
    const st = this.getState();
    if (st === 'closed') return true;
    if (st === 'open') return false;
    // half-open: admit exactly one probe, then block until it resolves
    this.state = 'open';
    this.openedAtTs = Date.now() - this.cooldownMs; // will re-enter half-open check on next getState
    return true;
  }

  public recordSuccess(): void {
    const wasOpen = this.state !== 'closed';
    this.consecutiveFailures = 0;
    this.lastOkTs = Date.now();
    this.state = 'closed';
    this.openedAtTs = undefined;
    if (wasOpen) {
      OpLog.getInstance().log('warn', 'breaker', `${this.provider} → closed (probe succeeded)`);
    }
  }

  public recordFailure(err: Error | string): void {
    const msg = typeof err === 'string' ? err : err.message;
    this.consecutiveFailures += 1;
    this.lastError = msg;
    this.lastErrorTs = Date.now();

    if (this.state === 'half-open' || this.consecutiveFailures >= this.openThreshold) {
      this.state = 'open';
      this.openedAtTs = Date.now();
      OpLog.getInstance().log('warn', 'breaker', `${this.provider} → open (${this.consecutiveFailures} consecutive failures, cooldown ${this.cooldownMs / 1000}s)`);
      logger.warn('CircuitBreaker', `Provider "${this.provider}" breaker OPENED after ${this.consecutiveFailures} consecutive failures. Cooldown ${this.cooldownMs / 1000}s. Last error: ${msg}`);
    }
    recentProviderErrors.push({ model: '-', provider: this.provider, outcome: 'failed', error: msg, ts: Date.now() });
    if (recentProviderErrors.length > 20) recentProviderErrors.shift();
  }

  public snapshot(): BreakerSnapshot {
    const st = this.getState();
    const snap: BreakerSnapshot = {
      provider: this.provider,
      state: st,
      consecutiveFailures: this.consecutiveFailures,
    };
    if (this.lastError) snap.lastError = this.lastError;
    if (this.lastErrorTs) snap.lastErrorTs = this.lastErrorTs;
    if (this.lastOkTs) snap.lastOkTs = this.lastOkTs;
    if (this.openedAtTs) snap.openedAtTs = this.openedAtTs;
    return snap;
  }
}

/** Known provider fleet of the EvaBot cluster. */
export const BREAKER_PROVIDER_NAMES = [
  'google',
  'omniroute',
  'openrouter',
  'hf',
  'zai',
  'groq',
  'cerebras',
  'cloudflare',
  'mistral',
  'opencode',
] as const;

/**
 * T-42: External provider model ids → OmniRoute route ids.
 *
 * The backend is a pure client of the local OmniRoute/LiteLLM gateway
 * (:20128), which already fronts Groq, Cloudflare Workers AI, Z.AI, Mistral
 * and OpenRouter. Model ids carrying these raw provider prefixes used to fall
 * through to Google in resolveProvider() and become dead branches. They are
 * mapped here onto the closest registered `omni/*` route so they resolve and
 * never error at runtime. No mapping is circular: backend → OmniRoute only.
 *
 * Built from the ACTUAL routes declared in /opt/omniroute/config.yaml
 * (model_list, verified 2026-09-15). Exact matches are preferred; the
 * prefix table below is the fallback for any variant not listed.
 */
export const EXTERNAL_MODEL_TO_OMNI_ROUTE: Record<string, string> = {
  // --- Groq (omni/groq-*) ---
  'groq/openai/gpt-oss-120b': 'omni/groq-gpt-oss-120b',
  'groq/openai/gpt-oss-20b': 'omni/groq-gpt-oss-20b',
  'groq/groq/compound': 'omni/groq-compound',
  'groq/groq/compound-mini': 'omni/groq-compound-mini',
  'groq/qwen/qwen3.8-27b': 'omni/groq-qwen3.8-27b',
  'groq/qwen/qwen3.6-27b': 'omni/groq-qwen3.6-27b',
  // --- Cloudflare Workers AI (omni/cf-*) ---
  'cloudflare/@cf/openai/gpt-oss-120b': 'omni/cf-gpt-oss-120b',
  'cloudflare/@cf/openai/gpt-oss-20b': 'omni/cf-gpt-oss-20b',
  'cloudflare/@cf/meta/llama-3.3-70b-instruct-fp8-fast': 'omni/cf-llama-3.3-70b',
  'cloudflare/@cf/google/gemma-4-26b-a4b-it': 'omni/cf-gemma-4-26b',
  'cloudflare/@cf/nvidia/nemotron-3-120b-a12b': 'omni/cf-nemotron-3-120b',
  'cloudflare/@cf/meta/llama-4-scout-17b-16e-instruct': 'omni/cf-llama-4-scout',
  'cloudflare/@cf/qwen/qwen2.5-coder-32b-instruct': 'omni/cf-qwen2.5-coder-32b',
  'cloudflare/@cf/mistralai/mistral-small-3.1-24b-instruct': 'omni/cf-mistral-small-3.1',
  // --- Z.AI (omni/zai-*) ---
  'zai/glm-5.3-flash': 'omni/zai-glm-5.3-flash',
  'zai/glm-4.5-air': 'omni/zai-glm-4.5-air',
  // --- Mistral (omni/mistral-*) ---
  'mistral/codestral-latest': 'omni/mistral-codestral',
  'mistralai/codestral-latest': 'omni/mistral-codestral',
  // --- OpenCode Go / Zen placeholders → closest working OmniRoute route ---
  'opencode/go-coder-32b': 'omni/cf-qwen2.5-coder-32b',
  'opencode/go-fast': 'omni/groq-gpt-oss-20b',
  'opencode/zen-coder-pro': 'omni/cf-qwen2.5-coder-32b',
  'opencode/zen-fast-7b': 'omni/or-lfm-2.5',
  'opencode/zen-reasoner-32b': 'omni/groq-qwen3.6-27b',
  'opencode/zen-multi-lang-70b': 'omni/cf-llama-3.3-70b',
  'opencode/zen-security-auditor': 'omni/groq-compound',
  'opencode/zen-test-gen': 'omni/cf-qwen2.5-coder-32b',
  'opencode/zen-docs-writer': 'omni/mistral-codestral',
  'opencode/zen-frontend-react': 'omni/cf-qwen2.5-coder-32b',
  'opencode/zen-backend-go': 'omni/cf-qwen2.5-coder-32b',
  'opencode/zen-devops-k8s': 'omni/groq-compound',
};

/**
 * Prefix fallbacks for provider families fronted by OmniRoute. `hf/` and
 * `cerebras/` have no dedicated OmniRoute route, so they are mapped to a
 * working free route to avoid runtime errors (reported in T-42).
 */
const EXTERNAL_MODEL_PREFIX_TO_OMNI_ROUTE: Array<[string, string]> = [
  ['groq/', 'omni/groq-gpt-oss-120b'],
  ['cloudflare/', 'omni/cf-gpt-oss-120b'],
  ['zai/', 'omni/zai-glm-5.3-flash'],
  ['mistralai/', 'omni/mistral-codestral'],
  ['mistral/', 'omni/mistral-codestral'],
  ['hf/', 'omni/or-nemotron-3.5-lightning'],
  ['cerebras/', 'omni/or-nemotron-3.5-lightning'],
];

/** True when `model` is an external provider id that OmniRoute fronts. */
export function isMappedExternalModel(model: string): boolean {
  const m = model.toLowerCase();
  if (EXTERNAL_MODEL_TO_OMNI_ROUTE[m]) return true;
  return EXTERNAL_MODEL_PREFIX_TO_OMNI_ROUTE.some(([prefix]) => m.startsWith(prefix));
}

/** Resolves an external provider id to its OmniRoute route (identity if none). */
export function mapToOmniRoute(model: string): string {
  const m = model.toLowerCase();
  const exact = EXTERNAL_MODEL_TO_OMNI_ROUTE[m];
  if (exact) return exact;
  for (const [prefix, route] of EXTERNAL_MODEL_PREFIX_TO_OMNI_ROUTE) {
    if (m.startsWith(prefix)) return route;
  }
  return model;
}

const breakers = new Map<string, CircuitBreaker>();

export function getBreaker(provider: string): CircuitBreaker {
  let b = breakers.get(provider);
  if (!b) {
    b = new CircuitBreaker(provider);
    breakers.set(provider, b);
  }
  return b;
}

/** Static registry keyed by provider name (lazily populated for all known names). */
export const BREAKERS: Record<string, CircuitBreaker> = Object.fromEntries(
  BREAKER_PROVIDER_NAMES.map((p) => [p, getBreaker(p)])
);

/**
 * Maps a model id to its logical provider/breaker key.
 *
 * T-42: raw external provider ids (groq/*, cloudflare/*, zai/*, mistral/*,
 * hf/*, cerebras/* …) are now served THROUGH OmniRoute, so they share the
 * `omniroute` breaker. The `:free` / openrouter check stays first so genuine
 * OpenRouter free ids (e.g. mistralai/mistral-7b-instruct:free) keep their
 * own breaker. Ordering mirrors UniversalLlmClient.resolveProvider().
 */
export function providerOfModel(model: string): string {
  const m = model.toLowerCase();
  if (m.startsWith('omniroute/') || m.startsWith('omni/')) return 'omniroute';
  if (m.startsWith('openrouter/') || m.endsWith(':free')) return 'openrouter';
  if (isMappedExternalModel(m)) return 'omniroute';
  if (m.startsWith('opencode/')) return 'opencode';
  return 'google';
}

export interface ChainAttemptEvent {
  model: string;
  provider: string;
  outcome: 'skipped-open-breaker' | 'ok' | 'failed' | 'timeout';
  error?: string;
  ts: number;
}

/**
 * Wraps the execution of an ordered provider/model fallback chain.
 * `attempt(model)` should throw on failure; the chain skips candidates whose
 * breaker is open, records breaker outcomes and keeps the last N events.
 */
export class ProviderFallbackChain {
  private events: ChainAttemptEvent[] = [];
  private readonly maxEvents = 100;

  public getEvents(): ChainAttemptEvent[] {
    return [...this.events];
  }

  /** Candidates that are allowed to be attempted right now. */
  public filterHealthy(models: string[]): string[] {
    return models.filter((model) => {
      const breaker = getBreaker(providerOfModel(model));
      const allowed = breaker.getState() !== 'open' || breaker.canAttempt();
      if (!allowed) {
        this.push({ model, provider: breaker.provider, outcome: 'skipped-open-breaker', ts: Date.now() });
      }
      return allowed;
    });
  }

  public recordOk(model: string): void {
    const provider = providerOfModel(model);
    getBreaker(provider).recordSuccess();
    this.push({ model, provider, outcome: 'ok', ts: Date.now() });
  }

  public recordFailure(model: string, err: Error, isTimeout: boolean): void {
    const provider = providerOfModel(model);
    getBreaker(provider).recordFailure(err);
    this.push({ model, provider, outcome: isTimeout ? 'timeout' : 'failed', error: err.message, ts: Date.now() });
  }

  private push(ev: ChainAttemptEvent): void {
    this.events.push(ev);
    if (this.events.length > this.maxEvents) this.events.shift();
  }

  /** Text table: provider, breaker state, last error, last ok ts. */
  public static getHealthReport(): string {
    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    lines.push('   HEALTH ОТЧЁТ LLM-ПРОВАЙДЕРОВ (CircuitBreakers)');
    lines.push('═'.repeat(78));
    lines.push('  ПРОВАЙДЕР    СТАТУС      СБОЕВ  ПОСЛЕДНЯЯ ОШИБКА');
    lines.push('─'.repeat(78));

    for (const name of BREAKER_PROVIDER_NAMES) {
      const snap = getBreaker(name).snapshot();
      const icon = snap.state === 'closed' ? '[OK]' : snap.state === 'half-open' ? '[HALF]' : '[OPEN]';
      const lastErr = snap.lastError ? snap.lastError.substring(0, 36) : '—';
      lines.push(
        `  ${name.padEnd(12)} ${icon} ${snap.state.padEnd(8)} ${String(snap.consecutiveFailures).padEnd(6)} ${lastErr}`
      );
      if (snap.lastOkTs) {
        lines.push(`               last ok: ${new Date(snap.lastOkTs).toISOString().replace('T', ' ').substring(0, 19)} UTC`);
      }
    }

    lines.push('─'.repeat(78));
    lines.push('  ПОСЛЕДНИЕ 5 ОШИБОК (за время жизни процесса):');
    const globalErrs = recentProviderErrors.slice(-5);
    if (globalErrs.length === 0) {
      lines.push('    • Ошибок не зафиксировано.');
    }
    for (const ev of globalErrs) {
      const when = new Date(ev.ts).toISOString().replace('T', ' ').substring(0, 19);
      lines.push(`    • ${when} [${ev.provider}] ${ev.model}: ${ev.error || ev.outcome}`);
    }
    lines.push('═'.repeat(78));
    return lines.join('\n');
  }
}
