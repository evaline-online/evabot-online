/**
 * coverage_push.test.ts — targeted branch/edge coverage push (TASK: coverage push)
 *
 * Targets the 12 worst-covered src/ files (by lines pct, coverage-summary.json):
 *   src/core/RoomManager.ts                 10.6%
 *   src/core/BootDiagnostics.ts             34.0%
 *   src/cli/terminal-chat.ts                43.0%
 *   src/core/GoogleAuthProvider.ts          58.2%
 *   src/core/UniversalLlmClient.ts          64.4%
 *   src/models/ModelRatings.ts              65.3%
 *   src/plugins/consilium/index.ts          66.0%
 *   src/core/AnsiStreamEngine.ts            67.5%
 *   src/server/server.ts                    69.1%
 *   src/core/AlertManager.ts                70.4%
 *   src/core/SephirotEngine.ts              70.5%
 *   src/plugins/llm-providers/index.ts      72.2%
 *
 * Hermetic rules honored: no external network (GoogleAuthProvider is driven
 * through its in-memory cache branch / env-first branch only), no real API
 * keys, no .env dependence (env vars saved/stubbed/restored), temp dir for fs.
 */

import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { RoomManager } from '../src/core/RoomManager.js';
import { BootDiagnostics } from '../src/core/BootDiagnostics.js';
import { GoogleAuthProvider, resolveGeminiApiKey, DEFAULT_GEMINI_API_KEY } from '../src/core/GoogleAuthProvider.js';
import { AlertManager, alertManager } from '../src/core/AlertManager.js';
import { SephirotEngine } from '../src/core/SephirotEngine.js';
import { UniversalLlmClient } from '../src/core/UniversalLlmClient.js';
import { ModelRegistry } from '../src/models/ModelRegistry.js';
import { ModelRatings, ModelCommand, normalizeCommand } from '../src/models/ModelRatings.js';
import { ConsiliumPlugin } from '../src/plugins/consilium/index.js';
import { LLMProvidersPlugin } from '../src/plugins/llm-providers/index.js';
import {
  AnsiColors,
  stripAnsi, visibleWidth, padEndVisible, padStartVisible, toPlainText,
  trafficLightIcon, trafficLightColor, statusBadge, badge, divider,
  sectionHeader, sectionFooter, formatBanner, promptSymbol, formatPrompt,
  TableFormatter, AnsiStreamWriter,
} from '../src/core/AnsiStreamEngine.js';
import { createServer } from '../src/server/server.js';

export async function runCoveragePushTests(): Promise<boolean> {
  console.log('\n--- Running CoveragePush Tests (targeted branch coverage, 12 weakest files) ---');
  let passed = true;
  let assertionCount = 0;

  function assert(cond: boolean, msg: string): void {
    assertionCount++;
    if (cond) {
      console.log(`  [OK] ${msg}`);
    } else {
      console.error(`  [FAIL] ${msg}`);
      passed = false;
    }
  }

  // ========================================================================
  // 1. RoomManager — singleton room lifecycle, member moves, empty-room GC
  // ========================================================================
  try {
    console.log('  -- RoomManager');
    const rm = RoomManager.getInstance();
    const roomA = rm.createOrJoin('cov-room-a', 'cov-sess-1', 'Alice');
    assert(roomA.id === 'cov-room-a' && roomA.members.size === 1, 'createOrJoin creates room with 1 member');
    assert(roomA.createdAt > 0, 'room createdAt timestamp set');

    rm.createOrJoin('cov-room-a', 'cov-sess-2');
    assert(rm.getRoom('cov-room-a')!.members.size === 2, 'second session joins existing room');

    const defaultNamed = rm.createOrJoin('cov-room-a', 'cov-sess-3');
    assert(defaultNamed.members.get('cov-sess-3')!.name === 'User-cov-sess', 'default member name derived from sessionId.slice(0,8)');

    // Session moves between rooms (implicit leave of previous room)
    rm.createOrJoin('cov-room-b', 'cov-sess-2', 'Bob');
    assert(rm.getRoom('cov-room-a')!.members.size === 2, 'session leaves previous room on rejoin');
    assert(rm.getRoomForSession('cov-sess-2') === 'cov-room-b', 'sessionToRoom mapping updated after move');

    const listed = rm.listRooms();
    assert(listed.some(r => r.id === 'cov-room-a' && r.members === 2), 'listRooms reports cov-room-a with 2 members');
    assert(listed.some(r => r.id === 'cov-room-b' && r.members === 1), 'listRooms reports cov-room-b with 1 member');

    const membersB = rm.getRoomMembers('cov-room-b');
    assert(membersB.length === 1 && membersB[0].sessionId === 'cov-sess-2' && membersB[0].name === 'Bob', 'getRoomMembers returns member details');
    assert(rm.getRoomMembers('cov-missing').length === 0, 'getRoomMembers for unknown room returns []');
    assert(rm.getRoom('cov-missing') === undefined, 'getRoom for unknown room returns undefined');
    assert(rm.getRoomForSession('cov-sess-none') === undefined, 'getRoomForSession for unknown session returns undefined');

    assert(rm.leaveRoom('cov-sess-1') === true, 'leaveRoom returns true for known session');
    assert(rm.leaveRoom('cov-sess-3') === true, 'leaveRoom returns true for remaining member');
    assert(rm.getRoom('cov-room-a') === undefined, 'empty room is garbage-collected after last member leaves');
    assert(rm.getRoomForSession('cov-sess-3') === undefined, 'mapping cleaned after leave');
    assert(rm.leaveRoom('cov-sess-unknown') === false, 'leaveRoom returns false for unknown session');

    // cleanup so other suites in the same process are unaffected
    rm.leaveRoom('cov-sess-2');
    rm.leaveRoom('cov-sess-3');
    assert(rm.getRoom('cov-room-a') === undefined && rm.getRoom('cov-room-b') === undefined, 'cleanup: no cov rooms left behind');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] RoomManager block threw: ${e.message}`);
  }

  // ========================================================================
  // 2. BootDiagnostics — full report shape (GoogleAuthProvider cache branch,
  //    so NO network is attempted)
  // ========================================================================
  try {
    console.log('  -- BootDiagnostics');
    const gp: any = GoogleAuthProvider as any;
    const origCached = gp.cachedCredentials;
    const origExpires = gp.expiresAt;
    gp.cachedCredentials = {
      token: 'cov-fake-token',
      type: 'bearer',
      source: 'Google ADC (evabot.online@gmail.com)',
      account: 'cov@test.invalid',
    };
    gp.expiresAt = Date.now() + 60_000;

    try {
      const report = await BootDiagnostics.runDiagnostics('cov-active-model');
      assert(report.steps.length === 5, 'runDiagnostics emits 5 diagnostic steps');
      assert(report.allPassed === true && report.totalDurationMs >= 0, 'report allPassed=true with duration');
      assert(report.auth.authenticated === true && report.auth.source === 'Google ADC (evabot.online@gmail.com)', 'auth step resolves via injected cache');
      assert(report.auth.account === 'cov@test.invalid', 'auth account propagated from cached credentials');
      assert(report.models.totalCount > 0 && report.models.freeTierCount > 0 && report.models.paidCount >= 0, 'model registry audit counts positive');
      assert(report.models.activeModel === 'cov-active-model', 'activeModel passthrough');
      assert(report.models.latestFrontier.length === 6, 'frontier fleet list present');
      assert(report.servers.webServer.status === 'ONLINE [OK]' && report.servers.agentServer.status === 'ONLINE [OK]', 'both server telemetry entries ONLINE');
      assert(report.quotas.currencyStandard === 'USD ($) & EUR (€)', 'quotas report USD/EUR standard only');
      const stepIds = new Set(report.steps.map(s => s.id));
      assert(stepIds.has('step-web-server') && stepIds.has('step-agent-server') && stepIds.has('step-auth') && stepIds.has('step-models') && stepIds.has('step-quotas'), 'all 5 step ids present');
      assert(report.steps.every(s => ['pending', 'running', 'success', 'warning', 'error'].includes(s.status)), 'step statuses from allowed enum');

      const creds = await GoogleAuthProvider.getCredentials();
      assert(creds !== null && creds!.token === 'cov-fake-token', 'getCredentials serves unexpired in-memory cache');
    } finally {
      gp.cachedCredentials = origCached;
      gp.expiresAt = origExpires;
    }
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] BootDiagnostics block threw: ${e.message}`);
  }

  // ========================================================================
  // 3. GoogleAuthProvider — env-first Gemini key resolution + lazy shim
  // ========================================================================
  try {
    console.log('  -- GoogleAuthProvider key resolution');
    const origKey = process.env.GEMINI_API_KEY;
    process.env.GEMINI_API_KEY = '  cov-key-trimmed  ';
    try {
      assert(resolveGeminiApiKey() === 'cov-key-trimmed', 'resolveGeminiApiKey trims GEMINI_API_KEY env value');
      process.env.GEMINI_API_KEY = 'cov-key-plain';
      assert(resolveGeminiApiKey() === 'cov-key-plain', 'env-first resolution short-circuits secret manager');
      assert(`${DEFAULT_GEMINI_API_KEY}` === 'cov-key-plain', 'LazyDefaultGeminiKey toString() coerces to resolved key');
      assert(DEFAULT_GEMINI_API_KEY.trim() === 'cov-key-plain', 'LazyDefaultGeminiKey trim() coerces to resolved key');
      assert((DEFAULT_GEMINI_API_KEY as any).valueOf() === 'cov-key-plain', 'LazyDefaultGeminiKey valueOf() coerces');
      assert((DEFAULT_GEMINI_API_KEY as any).toJSON() === 'cov-key-plain', 'LazyDefaultGeminiKey toJSON() coerces');
      assert((DEFAULT_GEMINI_API_KEY as any)[Symbol.toPrimitive]() === 'cov-key-plain', 'LazyDefaultGeminiKey Symbol.toPrimitive coerces');
    } finally {
      if (origKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = origKey;
    }
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] GoogleAuthProvider block threw: ${e.message}`);
  }

  // ========================================================================
  // 4. AlertManager — deliver channels, rate limiting, stats, error paths
  // ========================================================================
  try {
    console.log('  -- AlertManager');
    const am = alertManager;
    const cfg = am.getConfig();
    const fileCh = cfg.channels.find(c => c.type === 'file')!;
    const origFilePath = fileCh.config.path;
    const tmpLog = path.join(os.tmpdir(), `evabot-cov-alerts-${process.pid}.log`);
    if (fs.existsSync(tmpLog)) fs.unlinkSync(tmpLog);
    fileCh.config.path = tmpLog;

    try {
      const ev1 = await am.alert('high', 'CovHighAlert', 'high severity body', 'cov-suite', { k: 1 });
      assert(ev1.id.startsWith('alert-') && ev1.severity === 'high', 'alert() returns event with generated id');
      assert(ev1.channels.includes('console') && ev1.channels.includes('file'), 'enabled console+file channels listed');
      assert(fs.existsSync(tmpLog), 'file channel wrote alert log to temp dir');
      assert(fs.readFileSync(tmpLog, 'utf8').includes(ev1.id), 'alert log contains event id as JSON line');

      const ev2 = await am.alert('high', 'CovHighAlert', 'dup within cooldown');
      assert(ev2.id === 'rate-limited', 'second identical alert within cooldown is rate-limited');

      const lowEv = await am.low('CovLowAlert', 'body');
      const medEv = await am.medium('CovMedAlert', 'body');
      const critEv = await am.critical('CovCritAlert', 'body');
      assert(lowEv.severity === 'low' && medEv.severity === 'medium' && critEv.severity === 'critical', 'low/medium/critical shortcuts map severities');

      const recent = am.getRecentAlerts(5);
      assert(recent.length > 0 && recent[0].id === critEv.id, 'getRecentAlerts returns most recent first (reversed)');
      const onlyCritical = am.getRecentAlerts(50, 'critical');
      assert(onlyCritical.length > 0 && onlyCritical.every(a => a.severity === 'critical'), 'getRecentAlerts severity filter works');

      const stats = am.getStats();
      assert(stats.totalAlerts >= 4 && stats.bySeverity.critical >= 1 && stats.bySeverity.low >= 1, 'getStats totals and bySeverity counts');
      assert(stats.activeChannels.includes('console') && stats.activeChannels.includes('file'), 'getStats activeChannels list');

      am.setChannelEnabled('desktop', true);
      const deskEv = await am.alert('low', 'CovDesktopAlert', 'body');
      assert(deskEv.channels.includes('desktop'), 'setChannelEnabled(true) activates desktop channel');
      am.setChannelEnabled('desktop', false);
      const afterOff = await am.alert('low', 'CovDesktopOff', 'body');
      assert(!afterOff.channels.includes('desktop'), 'setChannelEnabled(false) deactivates channel');
      am.setChannelEnabled('cov-nope' as any, true);
      assert(true, 'setChannelEnabled for unknown channel type is a no-op (no throw)');

      // error path: file delivery failure is swallowed, alert still returns.
      // Use an existing FILE as parent dir -> mkdirSync fails fast with ENOTDIR
      // (do NOT use /proc or /sys paths: fs.mkdirSync can hang on them).
      fileCh.config.path = `${tmpLog}/sub/x.log`;
      const errEv = await am.alert('medium', 'CovFileFailAlert', 'body');
      assert(errEv.id.startsWith('alert-'), 'deliverFile failure swallowed without throwing');
      fileCh.config.path = tmpLog;
    } finally {
      fileCh.config.path = origFilePath;
      if (fs.existsSync(tmpLog)) fs.unlinkSync(tmpLog);
    }
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] AlertManager block threw: ${e.message}`);
  }

  // ========================================================================
  // 5. SephirotEngine — participant building, guards, async-run states
  // ========================================================================
  try {
    console.log('  -- SephirotEngine');
    const parts = SephirotEngine.buildParticipants('cov sephirot topic');
    assert(parts.length === 10, 'buildParticipants emits 10 sephirot nodes');
    assert(parts.every(p => p.id.startsWith('sephira-')), 'participant ids prefixed sephira-');
    assert(parts[0]!.id === 'sephira-kether' && parts[9]!.id === 'sephira-malkuth', 'BFS tree order: kether first, malkuth last');
    assert(parts[0]!.systemPrompt.includes('root of the tree'), 'root node has no-parent prompt');
    assert(parts[1]!.systemPrompt.includes('receive input from'), 'child nodes reference upstream input');
    assert(parts[1]!.systemPrompt.includes('cov sephirot topic'), 'topic embedded into every system prompt');
    assert(parts[0]!.temperature === 0.4, 'neutral persona temperature 0.4');
    assert(parts.find(p => p.id === 'sephira-tiferet')!.temperature === 0.6, 'adam persona (tiferet) temperature 0.6');

    let threw = false;
    try { await SephirotEngine.runSephirotConsilium(''); } catch { threw = true; }
    assert(threw, 'runSephirotConsilium rejects empty topic');
    threw = false;
    try { await SephirotEngine.runSephirotConsilium('   '); } catch { threw = true; }
    assert(threw, 'runSephirotConsilium rejects whitespace-only topic');
    assert(SephirotEngine.getStatus().running === false, 'status not running after guard rejects');

    const usage = SephirotEngine.startAsyncRun('   ');
    assert(usage.includes('Використання'), 'startAsyncRun empty topic returns usage hint');
    assert(SephirotEngine.getStatus().running === false, 'startAsyncRun empty topic does not start a run');

    const se: any = SephirotEngine as any;
    const origStatus = se.status;
    se.status = { running: true, topic: 'cov-busy', startedAt: Date.now() };
    try {
      const busy = SephirotEngine.startAsyncRun('another topic');
      assert(busy.includes('Уже запущено') && busy.includes('cov-busy'), 'startAsyncRun while running reports busy state');
    } finally {
      se.status = origStatus;
    }
    assert(SephirotEngine.getStatus().running === false && SephirotEngine.getStatus().topic === '', 'status restored after busy check');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] SephirotEngine block threw: ${e.message}`);
  }

  // ========================================================================
  // 6. UniversalLlmClient — provider routing edges, normalization, model ids
  // ========================================================================
  try {
    console.log('  -- UniversalLlmClient routing/normalization');
    const client = new UniversalLlmClient();
    assert(client.resolveProvider('omni/cf-gpt-oss-120b') === 'omniroute', 'omni/ prefix routes to omniroute');
    assert(client.resolveProvider('anthropic/claude-4') === 'openrouter', 'anthropic/ prefix routes to openrouter');
    assert(client.resolveProvider('openai/gpt-x') === 'openrouter', 'openai/ prefix routes to openrouter');
    assert(client.resolveProvider('microsoft/phi-4') === 'openrouter', 'microsoft/ prefix routes to openrouter');
    assert(client.resolveProvider('x-ai/grok-4') === 'openrouter', 'x-ai/ prefix routes to openrouter');
    assert(client.resolveProvider('cohere/command-r') === 'openrouter', 'cohere/ prefix routes to openrouter');
    assert(client.resolveProvider('cov-unknown-vendor-model') === 'google', 'unrecognized model falls back to google');

    // T-42: raw provider prefixes are fronted by the local OmniRoute gateway
    // and must resolve there (they used to fall through to Google / error).
    assert(client.resolveProvider('groq/openai/gpt-oss-120b') === 'omniroute', 'groq/ prefix routes to omniroute');
    assert(client.resolveProvider('cloudflare/@cf/openai/gpt-oss-120b') === 'omniroute', 'cloudflare/ prefix routes to omniroute');
    assert(client.resolveProvider('zai/glm-4.5-air') === 'omniroute', 'zai/ prefix routes to omniroute');
    assert(client.resolveProvider('mistral/codestral-latest') === 'omniroute', 'mistral/ prefix routes to omniroute');
    assert(client.resolveProvider('hf/any-model') === 'omniroute', 'hf/ prefix routes to omniroute');
    assert(client.resolveProvider('mistralai/mistral-7b-instruct:free') === 'openrouter', ':free suffix wins over mistralai/ mapping');

    const allModels = ModelRegistry.getAllModels();
    const orModel = allModels.find(m => m.provider === 'OpenRouter');
    const omniModel = allModels.find(m => m.provider === 'OmniRoute');
    const ocModel = allModels.find(m => m.provider === 'OpenCode AI');
    const gModel = allModels.find(m => m.provider === 'Google DeepMind');
    assert(!orModel || client.resolveProvider(orModel.id) === 'openrouter', `registry OpenRouter model routes to openrouter (${orModel?.id ?? 'none'})`);
    assert(!omniModel || client.resolveProvider(omniModel.id) === 'omniroute', `registry OmniRoute model routes to omniroute (${omniModel?.id ?? 'none'})`);
    // T-42: the opencode/go-*/zen-* entries are placeholders with no upstream
    // route; they are mapped through OmniRoute so they resolve at runtime.
    assert(!ocModel || client.resolveProvider(ocModel.id) === 'omniroute', `registry OpenCode placeholder routes via omniroute (${ocModel?.id ?? 'none'})`);
    assert(!gModel || client.resolveProvider(gModel.id) === 'google', `registry Google DeepMind model routes to google (${gModel?.id ?? 'none'})`);

    assert(client.normalizeToUniversal([]).length === 0, 'normalizeToUniversal empty array -> []');
    assert(client.normalizeToUniversal(null as any).length === 0, 'normalizeToUniversal non-array -> []');
    const chatMsgs = client.normalizeToUniversal([{ role: 'model', parts: [{ text: '' }] }] as any);
    assert(chatMsgs.length === 1 && chatMsgs[0].role === 'assistant' && chatMsgs[0].content === '', 'ChatMessage empty parts text coerced to empty content');

    const merged = client.toGeminiFormat([
      { role: 'system', content: 'A' },
      { role: 'system', content: 'B' },
    ], 'base');
    assert(merged.systemInstruction === 'base\nA\nB' && merged.contents.length === 0, 'toGeminiFormat merges default + multiple system messages');

    const cm = (client as any).cleanModelId.bind(client);
    assert(cm('omniroute/m1', 'omniroute') === 'm1', 'cleanModelId strips legacy omniroute/ prefix');
    assert(cm('omni/m2', 'omniroute') === 'omni/m2', 'cleanModelId preserves live omni/ prefix');
    assert(cm('opencode/z1', 'opencode') === 'z1', 'cleanModelId strips opencode/ prefix');
    assert(cm('openrouter/x', 'openrouter') === 'x', 'cleanModelId strips openrouter/ prefix');
    assert(cm('openrouter/free', 'openrouter') === 'openrouter/free', 'cleanModelId preserves openrouter/free meta-router id');
    assert(cm('plain-id', 'google') === 'plain-id', 'cleanModelId passthrough for google');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] UniversalLlmClient block threw: ${e.message}`);
  }

  // ========================================================================
  // 7. ModelRatings — normalizeCommand variants, ratings, fallback chains
  // ========================================================================
  try {
    console.log('  -- ModelRatings');
    assert(normalizeCommand('/пам`ять') === '/memory', 'backtick apostrophe variant canonicalized');
    assert(normalizeCommand('/пам’ять') === '/memory', 'curly apostrophe variant canonicalized');
    assert(normalizeCommand('/пам´ять') === '/memory', 'acute apostrophe variant canonicalized');
    assert(normalizeCommand('/каталог alpha beta') === '/products alpha beta', 'alias resolution preserves args');
    assert(normalizeCommand('/covnosuchalias x') === '/covnosuchalias x', 'unknown head passthrough with args');
    assert(normalizeCommand('') === '', 'normalizeCommand empty input');
    assert(normalizeCommand('   ') === '', 'normalizeCommand whitespace-only input');

    const first = ModelRegistry.getAllModels()[0];
    const rating = ModelRatings.computeRating(first);
    assert(rating.modelId === first.id, 'computeRating keyed by model id');
    const dims = [rating.quality, rating.recency, rating.speed, rating.context, rating.cost, rating.composite];
    assert(dims.every(v => v >= 0 && v <= 100), 'all rating dimensions within 0..100');

    const byContext = ModelRatings.rankByDimension('context', 5, true);
    assert(byContext.length > 0 && byContext.length <= 5, 'rankByDimension respects limit');
    assert(byContext.every((e, i) => e.rank === i + 1), 'rankByDimension assigns sequential ranks');
    assert(byContext.every(e => e.model.pricing.freeTierStatus === '100% Free Quota Available'), 'rankByDimension freeOnly filter honored');

    const topOverall = ModelRatings.getTopOverall(false, 3);
    assert(topOverall.length === 3, 'getTopOverall returns requested count');
    const formatted = ModelRatings.formatTopList(topOverall, 'Cov Rating Title');
    assert(formatted.includes('Cov Rating Title') && formatted.includes('#'), 'formatTopList renders title and ranks');
    assert(!formatted.includes('RUB') && !formatted.includes('₽'), 'formatTopList enforces no-rubles locale policy');

    const smartest = ModelRatings.getSmartestFreeModel();
    assert(typeof smartest?.id === 'string' && smartest.id.length > 0, 'getSmartestFreeModel returns a valid model');

    const freeChain = ModelRatings.getFallbackChain('openrouter/free');
    assert(freeChain.length > 0 && freeChain.every(id => ModelRegistry.isValidModel(id)), 'free fallback chain: all registry-valid');
    assert(!freeChain.includes('openrouter/free'), 'free fallback chain excludes the model itself');

    const paidModel = ModelRegistry.getAllModels().find(m => m.pricing.freeTierStatus !== '100% Free Quota Available');
    if (paidModel) {
      const paidChain = ModelRatings.getFallbackChain(paidModel.id);
      assert(paidChain.length > 0 && !paidChain.includes(paidModel.id) && paidChain.every(id => ModelRegistry.isValidModel(id)), 'paid fallback chain: valid, self-excluded');
    }

    const unknownChain = ModelRatings.getFallbackChain('cov-totally-unknown-model');
    assert(unknownChain.length > 0 && unknownChain.every(id => ModelRegistry.isValidModel(id)), 'unknown model id treated as free -> valid fallback chain');

    assert(ModelCommand.execute('/covdefinitelynotacommand').includes('Unknown command'), 'ModelCommand unknown command error path');
    assert(ModelCommand.execute('').includes('Unknown command'), 'ModelCommand empty command error path');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] ModelRatings block threw: ${e.message}`);
  }

  // ========================================================================
  // 8. ConsiliumPlugin — all 4 modes via mocked client + usage guard paths
  // ========================================================================
  try {
    console.log('  -- ConsiliumPlugin');
    const plugin = new ConsiliumPlugin('cov-key');
    const fakeCtx: any = {
      config: {},
      logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
      eventBus: { emit: () => {}, on: () => {} },
      registerRoute: () => {},
      registerCommand: () => {},
      getStorage: () => null,
    };
    await plugin.initialize(fakeCtx);
    assert(plugin.routes.length === 1 && plugin.commands.length === 3, 'initialize registers 1 route + 3 commands');
    const hc = await plugin.healthCheck();
    assert(hc.status === 'healthy', 'healthCheck healthy after initialize');

    assert((await plugin.handleCommand('')).includes('Usage:'), 'handleCommand empty args -> usage');
    assert((await plugin.handleCommand('bogusmode hello')).includes('Usage:'), 'handleCommand invalid mode -> usage');
    assert((await plugin.handleCommand('solo')).includes('Usage:'), 'handleCommand missing prompt -> usage');

    const origGenerate = UniversalLlmClient.prototype.generateContent;
    try {
      UniversalLlmClient.prototype.generateContent = async function (model: string) {
        if (String(model).includes('fail-model')) throw new Error('cov simulated failure');
        return `[cov:${model}] response`;
      };

      const solo = await plugin.run({ mode: 'solo', prompt: 'p', models: ['m-a'] });
      assert(solo.mode === 'solo' && solo.turns.length === 1 && solo.synthesis === '[cov:m-a] response', 'solo mode: single turn + synthesis');
      assert(solo.durationMs >= 0, 'run sets durationMs');

      const broadcast = await plugin.run({ mode: 'broadcast', prompt: 'p', models: ['m-a', 'fail-model'] });
      assert(broadcast.mode === 'broadcast' && broadcast.turns.length === 2, 'broadcast mode: all models get turns');
      assert(broadcast.turns.some(t => t.content.includes('[ERROR] cov simulated failure')), 'broadcast failed model reported as [ERROR] turn');
      assert(typeof broadcast.synthesis === 'string' && broadcast.synthesis.length > 0, 'broadcast still synthesizes despite one failure');

      const dialogue = await plugin.run({ mode: 'dialogue', prompt: 'p', models: ['m-a', 'm-b'], rounds: 2 });
      assert(dialogue.mode === 'dialogue' && dialogue.turns.length === 4, 'dialogue 2 rounds -> 4 turns');
      assert(dialogue.turns[0].participantId === 'm-a-r0' && dialogue.turns[1].participantId === 'm-b-r0', 'dialogue turn ids carry round index');

      const cons = await plugin.run({ mode: 'consilium', prompt: 'p', models: ['m-a', 'm-b', 'm-c'] });
      assert(cons.mode === 'consilium' && cons.turns.length === 6, 'consilium 3 models -> 3 initial + 3 review turns');
      assert(cons.turns.some(t => t.participantId.endsWith('-review')), 'cross-evaluation review turns emitted');

      const allFail = await plugin.run({ mode: 'consilium', prompt: 'p', models: ['fail-model', 'fail-model-2'], synthesizerModel: 'm-synth' });
      assert(allFail.turns.length === 2 && typeof allFail.synthesis === 'string', 'consilium <2 valid results -> early synthesis path');
      assert(allFail.synthesis!.includes('m-synth'), 'early synthesis path used the dedicated synthesizer model');

      let unknownThrew = false;
      try { await plugin.run({ mode: 'nonsense' as any, prompt: 'p', models: [] }); } catch (e: any) { unknownThrew = e.message.includes('Unknown mode'); }
      assert(unknownThrew, 'run() unknown mode throws');

      const out = await plugin.handleCommand('solo cov prompt here');
      assert(out.includes('=== Consilium [SOLO] ===') && out.includes('=== SYNTHESIS ==='), 'handleCommand success renders board + synthesis');
    } finally {
      UniversalLlmClient.prototype.generateContent = origGenerate;
    }

    await plugin.shutdown();
    assert(true, 'shutdown resolves cleanly');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] ConsiliumPlugin block threw: ${e.message}`);
  }

  // ========================================================================
  // 9. LLMProvidersPlugin — registration, routing, guards, shutdown
  // ========================================================================
  try {
    console.log('  -- LLMProvidersPlugin');
    const p = new LLMProvidersPlugin();
    const fakeCtx: any = {
      config: {},
      logger: { info: () => {}, warn: () => {}, error: () => {}, debug: () => {} },
      eventBus: { emit: () => {}, on: () => {} },
      registerRoute: () => {},
      registerCommand: () => {},
      getStorage: () => null,
    };
    await p.initialize(fakeCtx);
    assert(p.routes.length === 3 && p.commands.length === 1, 'initialize registers 3 routes + 1 command');
    assert(p.getProvider('google') !== undefined && p.getProvider('cov-nope') === undefined, 'getProvider lookup + miss');

    assert(p.resolveProvider('omniroute/m')?.id === 'omniroute', 'resolve omniroute/ prefix');
    assert(p.resolveProvider('opencode/m')?.id === 'opencode', 'resolve opencode/ prefix');
    assert(p.resolveProvider('openrouter/m')?.id === 'openrouter', 'resolve openrouter/ prefix');
    assert(p.resolveProvider('vendor/m:free')?.id === 'openrouter', 'resolve :free suffix');
    assert(p.resolveProvider('vendor/m/free')?.id === 'openrouter', 'resolve /free segment');
    assert(p.resolveProvider('kilo/m')?.id === 'kilocode', 'resolve kilo/ prefix');
    assert(p.resolveProvider('kilocode/m')?.id === 'kilocode', 'resolve kilocode/ prefix');
    assert(p.resolveProvider('text-about-claude')?.id === 'openrouter', 'resolve claude substring -> openrouter');
    assert(p.resolveProvider('gpt-5-mini')?.id === 'openrouter', 'resolve gpt- substring -> openrouter');
    assert(p.resolveProvider('openai-compatible')?.id === 'openrouter', 'resolve openai substring -> openrouter');
    assert(p.resolveProvider('gemini-2.5-flash')?.id === 'google', 'default routes to google');

    const openrouterCh = p.getProvider('openrouter')!;
    const origOpenrouterEnabled = openrouterCh.enabled;
    openrouterCh.enabled = false;
    let disabledErr: any = null;
    try { await p.chat({ model: 'openrouter/x', messages: [] }); } catch (e) { disabledErr = e; }
    assert(disabledErr !== null && disabledErr.statusCode === 503 && String(disabledErr.message).includes('disabled'), 'chat on disabled provider -> 503 error');
    openrouterCh.enabled = origOpenrouterEnabled;

    const googleCh = p.getProvider('google')!;
    const origGoogleEnabled = googleCh.enabled;
    googleCh.enabled = false;
    let disabledErr2: any = null;
    try { await p.chat({ model: 'gemini-2.5-flash', messages: [] }); } catch (e) { disabledErr2 = e; }
    assert(disabledErr2 !== null && disabledErr2.provider === 'google', 'chat disabled google provider error carries provider id');
    googleCh.enabled = origGoogleEnabled;

    let unknownThrew = false;
    try { await p.testProvider('cov-nope'); } catch { unknownThrew = true; }
    assert(unknownThrew, 'testProvider unknown id throws');

    const cm = (p as any).cleanModelId.bind(p);
    assert(cm('kilo/k1') === 'k1' && cm('kilocode/k2') === 'k2' && cm('bare') === 'bare', 'cleanModelId strips kilo/kilocode prefixes, passthrough bare');
    assert((p as any).getTestModel({ id: 'zzz' } as any) === 'test', 'getTestModel falls back to literal for unknown provider');

    const status = p.getProviderStatus();
    assert(status.length === 5 && status.every(s => typeof s.enabled === 'boolean' && typeof s.freeOnly === 'boolean'), 'getProviderStatus lists 5 providers with flags');

    const list = p.formatProviderList();
    assert(list.includes('LLM PROVIDERS') && list.includes('kilocode') && list.includes('(free)'), 'formatProviderList renders header, ids, free tag');

    const health1 = await p.healthCheck();
    assert(health1.status === 'healthy' && /\/5 providers enabled$/.test(health1.message), 'healthCheck healthy with initialized providers');

    await p.shutdown();
    const health2 = await p.healthCheck();
    assert(health2.status === 'down' && health2.message.startsWith('0/0'), 'healthCheck down after shutdown clears providers');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] LLMProvidersPlugin block threw: ${e.message}`);
  }

  // ========================================================================
  // 10. AnsiStreamEngine — pure helpers, borders, banner, streamer edges
  // ========================================================================
  try {
    console.log('  -- AnsiStreamEngine pure helpers');
    // terminal-chat auto-starts main() on import; disable for this process,
    // then load its pure renderers dynamically (same pattern as cli_tui.test.ts)
    process.env.EVABOT_CLI_AUTOSTART = 'off';
    const { TerminalMarkdownStreamer, renderTerminalMarkdown } = await import('../src/cli/terminal-chat.js');

    assert(stripAnsi('') === '' && toPlainText('') === '', 'stripAnsi/toPlainText empty strings');
    assert(visibleWidth('') === 0, 'visibleWidth empty string');
    assert(padEndVisible('ab', 1) === 'ab', 'padEndVisible no-op when target smaller');
    assert(padStartVisible('ab', 5) === '   ab', 'padStartVisible pads start');
    assert(trafficLightIcon('ok') === '[OK]' && trafficLightIcon('standby') === '[MED]' && trafficLightIcon('offline') === '[HIGH]' && trafficLightIcon('bogus' as any) === '[--]', 'trafficLightIcon alias + default branches');
    assert(trafficLightColor('ok') === AnsiColors.green && trafficLightColor('bogus' as any) === AnsiColors.white, 'trafficLightColor alias + default branches');
    assert(statusBadge('red', 'CUSTOM LABEL').includes('CUSTOM LABEL'), 'statusBadge custom label overrides');
    assert(badge('txt').includes('txt'), 'badge renders text');
    assert(divider().length === 78 + AnsiColors.gray.length + AnsiColors.reset.length, 'divider default width 78 with colors');
    assert(divider('=', 10).includes('=='), 'divider custom char/width');
    const header = sectionHeader('cov title', 'TAG', 60);
    assert(header.includes('COV TITLE') && header.includes('[ TAG ]'), 'sectionHeader uppercases title, renders tag');
    assert(sectionFooter(30).length === 30 + AnsiColors.gray.length + AnsiColors.reset.length, 'sectionFooter width');
    const banner = formatBanner(['L1', 'L2'], 'COV BANNER', 60);
    assert(banner.includes('COV BANNER') && banner.includes('L1') && banner.includes('L2'), 'formatBanner renders title + lines');
    assert(promptSymbol('consilium').includes('[TEAM]') && promptSymbol('dialogue').includes(String.fromCharCode(0x276F)) && promptSymbol('broadcast').includes('[NET]'), 'promptSymbol mode branches');
    assert(promptSymbol('anything-else').includes(String.fromCharCode(0x276F)), 'promptSymbol default branch');
    const fp = formatPrompt({ model: 'm1', mode: 'consilium', role: 'dev' });
    assert(fp.includes('m1') && fp.includes('dev') && fp.includes('[CONSILIUM]'), 'formatPrompt renders model, role, mode');
    assert(!formatPrompt({ role: 'general_assistant' }).includes('general_assistant'), 'formatPrompt omits default general_assistant role');
    assert(formatPrompt({}).includes('[SOLO]'), 'formatPrompt defaults to solo mode');

    const asciiTable = TableFormatter.render([{ a: 1 }], { columns: [{ key: 'a', header: 'A' }], borderStyle: 'ascii' });
    assert(asciiTable.includes('+') && asciiTable.includes('A') && asciiTable.includes('1'), 'TableFormatter ascii borders + data');
    const noneTable = TableFormatter.render([], { columns: [{ key: 'a', header: 'A' }], borderStyle: 'none' });
    assert(!noneTable.includes('┌') && noneTable.includes('A'), 'TableFormatter none borderStyle, empty rows');
    const minTable = TableFormatter.render([{ a: 'x' }], { columns: [{ key: 'a', header: 'A' }], borderStyle: 'minimal' });
    assert(!minTable.includes('┌') && minTable.includes('x'), 'TableFormatter minimal borderStyle');
    const fmtTable = TableFormatter.render([{ a: 7 }], { columns: [{ key: 'a', header: 'A', align: 'right', format: (v: any) => `f(${v})` }] });
    assert(fmtTable.includes('f(7)'), 'TableFormatter format callback + right align');

    // AnsiStreamWriter edge: no trailing newline flushed by end()
    const chunks: string[] = [];
    const lines: string[] = [];
    const writer = new AnsiStreamWriter({
      onChunk: (c: string) => chunks.push(c),
      onLine: (l: string) => lines.push(l),
      writeToStdout: false,
    });
    writer.write('tail without newline');
    writer.end();
    assert(lines.includes('tail without newline'), 'AnsiStreamWriter end() flushes unterminated tail line');

    // TerminalMarkdownStreamer: fenced code, tail flush, unclosed fence
    const out1: string[] = [];
    const s1 = new TerminalMarkdownStreamer(t => out1.push(t));
    s1.push('```ts\ncode line\n```\nafter');
    s1.finish();
    const j1 = out1.join('');
    assert(j1.includes('[TS]') && j1.includes('code line') && j1.includes('└──') && j1.includes('after'), 'TerminalMarkdownStreamer fenced block + tail flush');

    const out2: string[] = [];
    const s2 = new TerminalMarkdownStreamer(t => out2.push(t));
    s2.push('```py');
    s2.finish();
    const j2 = out2.join('');
    assert(j2.includes('[PY]') && j2.includes('└──'), 'TerminalMarkdownStreamer closes unclosed fence on finish()');

    assert(renderTerminalMarkdown('') === '', 'renderTerminalMarkdown empty input');
    const md = renderTerminalMarkdown('```ts\nlet x = 1;\n```\n# Head\n> quote\n- item\n1. step\n[text](https://cov.example)\n---\n**bold** `ic`');
    assert(md.includes('[TS]') && md.includes('let x = 1;'), 'renderTerminalMarkdown code block with language tag');
    assert(md.includes('text') && md.includes('https://cov.example'), 'renderTerminalMarkdown link rendering');
    assert(md.includes('──'), 'renderTerminalMarkdown horizontal rule rendered');
    assert(!renderTerminalMarkdown('no fence here').includes('┌──'), 'renderTerminalMarkdown plain text untouched');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] AnsiStreamEngine block threw: ${e.message}`);
  }

  // ========================================================================
  // 11. server.ts — createServer + OPTIONS branch + router health route
  //     (loopback only, same hermetic pattern as tests/server.test.ts)
  // ========================================================================
  try {
    console.log('  -- server.ts createServer smoke');
    const srv: http.Server = createServer();
    assert(typeof srv.close === 'function', 'createServer returns an http.Server');
    await new Promise<void>((resolve) => srv.listen(0, '127.0.0.1', resolve));
    const addr = srv.address() as { port: number };
    const base = `http://127.0.0.1:${addr.port}`;

    const optRes = await fetch(`${base}/cov-options-probe`, { method: 'OPTIONS' });
    assert(optRes.status === 204, 'OPTIONS preflight answered with 204');
    assert(optRes.headers.get('access-control-allow-origin') === '*', 'CORS allow-origin header on preflight');
    await optRes.text();

    const healthRes = await fetch(`${base}/api/health`);
    const healthJson: any = await healthRes.json();
    assert(healthRes.status === 200 && healthJson.status === 'online', 'GET /api/health via built router');

    await new Promise<void>((resolve) => srv.close(() => resolve()));
    assert(true, 'server closed cleanly without listening side effects');
  } catch (e: any) {
    passed = false;
    console.error(`  [FAIL] server.ts block threw: ${e.message}`);
  }

  console.log(`\n  CoveragePush: ${passed ? 'ALL PASSED' : 'FAILURES PRESENT'} (${assertionCount} assertions)`);
  return passed;
}
