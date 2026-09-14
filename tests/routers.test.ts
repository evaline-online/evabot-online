/**
 * routers.test.ts — HTTP route-level tests for the 7 API routers
 * (VoiceRouter, ChatRouter, ModelsRouter, AlertsRouter, LogsRouter,
 * SecurityRouter, PluginsRouter) plus the shared Router plumbing
 * (withErrorHandling 500 path, param matching, method filter).
 *
 * Harness: boots the real server via createServer() on an ephemeral port
 * (mirrors server.test.ts) and drives it with fetch. All live dependencies
 * are mocked in-process:
 *  - UniversalLlmClient.prototype.generateContent / streamContent  (LLM)
 *  - KnowledgeBaseConnector.prototype.search                       (KB)
 *  - cloudTts instance methods (CloudTTS singleton)                (TTS)
 *  - GoogleAuthProvider.getCredentials + globalThis.fetch          (STT)
 *  - ConsiliumEngine.prototype.run                                 (consilium)
 * Chat history is persisted into a temp SQLite DB via EVABOT_CHAT_DB.
 * No real network calls are made.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createServer } from '../src/server/server.js';
import { UniversalLlmClient } from '../src/core/UniversalLlmClient.js';
import { KnowledgeBaseConnector } from '../src/core/CorporateRoles.js';
import { ConsiliumEngine } from '../src/core/ConsiliumEngine.js';
import { cloudTts } from '../src/core/CloudTTS.js';
import { edgeTts } from '../src/core/EdgeTTS.js';
import { GoogleAuthProvider } from '../src/core/GoogleAuthProvider.js';
import { ChatHistoryStore } from '../src/core/ChatHistoryStore.js';
import { DeveloperMode } from '../src/core/DeveloperMode.js';
import { SystemContext } from '../src/core/SystemContext.js';
import { setDebugOn } from '../src/core/OpLog.js';
import { alertManager } from '../src/core/AlertManager.js';
import { Config } from '../src/core/Config.js';
import { extractMultipartFile } from '../src/server/routes/VoiceRouter.js';
import { STT_USAGE_PATH } from '../src/core/CloudSTT.js';

export async function runRouterTests(): Promise<boolean> {
  console.log('\n--- Running Router HTTP API Tests (7 routers) ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  // ---------------------------------------------------------------------
  // Environment isolation (before anything instantiates the history store)
  // ---------------------------------------------------------------------
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'evabot-routers-'));
  const prevChatDb = process.env.EVABOT_CHAT_DB;
  const prevDevPwd = process.env.EVADEV_PASSWORD;
  process.env.EVABOT_CHAT_DB = path.join(tmpDir, 'chat-history.db');
  process.env.EVADEV_PASSWORD = 'router-dev-pass-1';

  // STT usage counter file: back it up so recordUsage() writes are undone.
  const sttUsageBackup: Buffer | null = fs.existsSync(STT_USAGE_PATH) ? fs.readFileSync(STT_USAGE_PATH) : null;

  // ---------------------------------------------------------------------
  // In-process mocks (saved + restored in finally)
  // ---------------------------------------------------------------------
  const captured: {
    generate?: { model: string; messages: any[]; options: any };
    stream?: { model: string; messages: any[]; options: any };
    ttsCalls: Array<{ text: string; opts: any }>;
    sttCalls: Array<{ url: string; body: any }>;
  } = { ttsCalls: [], sttCalls: [] };

  const proto: any = UniversalLlmClient.prototype;
  const origGenerate = proto.generateContent;
  const origStream = proto.streamContent;
  const kbProto: any = KnowledgeBaseConnector.prototype;
  const origKbSearch = kbProto.search;
  const consiliumProto: any = ConsiliumEngine.prototype;
  const origConsiliumRun = consiliumProto.run;
  const googleAuthAny: any = GoogleAuthProvider;
  const origGetCredentials = googleAuthAny.getCredentials;
  const origGlobalFetch = globalThis.fetch;

  proto.generateContent = async function (model: string, messages: any[], options: any = {}) {
    captured.generate = { model, messages, options };
    return 'MOCK-LLM-REPLY';
  };
  proto.streamContent = async function (model: string, messages: any[], onChunk: (c: string) => void, options: any = {}) {
    captured.stream = { model, messages, options };
    onChunk('Привіт');
    onChunk('!');
    return 'Привіт!';
  };
  kbProto.search = async () => [];
  consiliumProto.run = async function (req: any) {
    return { mode: req?.mode || 'solo', text: 'SYNTH-RESULT' };
  };

  const cloudTtsAny: any = cloudTts;
  const origTtsMethods: Record<string, any> = {};
  for (const k of ['synthesize', 'getUsage', 'getEvaVoice', 'getAdamVoice', 'getCap', 'getCharsLeft']) {
    origTtsMethods[k] = cloudTtsAny[k];
  }
  let ttsResult: any = { ok: true, base64Audio: 'QUJDRA==', voice: 'eva-test-voice', cached: false };
  cloudTtsAny.synthesize = async (text: string, opts: any) => {
    captured.ttsCalls.push({ text, opts });
    return ttsResult;
  };
  cloudTtsAny.getUsage = () => ({ month: 'test', chars: 4321 });
  cloudTtsAny.getEvaVoice = () => 'eva-test-voice';
  cloudTtsAny.getAdamVoice = () => 'adam-test-voice';
  // Edge-TTS primary chain mock: succeed only when edgeOk, else fall through to cloudTts.
  let edgeOk = true;
  const edgeTtsAny = edgeTts as any;
  const origEdgeMethods: Record<string, any> = {};
  for (const k of ['synthesize', 'getEvaVoice', 'getAdamVoice']) origEdgeMethods[k] = edgeTtsAny[k];
  edgeTtsAny.synthesize = async (text: string, opts: any) => {
    if (!edgeOk) throw new Error('edge-tts unavailable');
    return { audioBuffer: Buffer.from('EDGEAUDIO'), voice: 'uk-UA-PolinaNeural', cached: false, chars: text.length, provider: 'edge-tts' };
  };
  edgeTtsAny.getEvaVoice = () => 'uk-UA-PolinaNeural';
  edgeTtsAny.getAdamVoice = () => 'ru-RU-DmitryNeural';
  cloudTtsAny.getCap = () => 900000;
  cloudTtsAny.getCharsLeft = () => 895679;

  // ---------------------------------------------------------------------
  // Server boot (mirrors tests/server.test.ts)
  // ---------------------------------------------------------------------
  const server = createServer();
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });
  const testPort = (server.address() as any).port;
  const base = `http://127.0.0.1:${testPort}`;

  let ipCounter = 0;
  // Capture the REAL fetch before any test patches globalThis.fetch (STT mock).
  const realFetch = globalThis.fetch;
  async function api(method: string, pathname: string, body?: any, extraHeaders: Record<string, string> = {}): Promise<{ status: number; json: any; text: string; contentType: string }> {
    ipCounter += 1;
    const headers: Record<string, string> = {
      'X-Forwarded-For': `router-test-${ipCounter}`,
      ...extraHeaders,
    };
    let payload: string | Uint8Array | undefined;
    if (body !== undefined) {
      if (body instanceof Uint8Array) {
        payload = body;
      } else {
        payload = typeof body === 'string' ? body : JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
      }
    }
    const res = await realFetch(`${base}${pathname}`, { method, headers, body: payload });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* non-JSON */ }
    return { status: res.status, json, text, contentType: res.headers.get('content-type') || '' };
  }

  /** Builds a minimal multipart/form-data body carrying one file part. */
  function multipartBody(content: Buffer, opts: { filename?: string; name?: string } = {}): { body: Buffer; contentType: string } {
    const boundary = 'evabot-test-bnd-7354';
    const name = opts.name || 'audio';
    const filenameLine = opts.filename ? `; filename="${opts.filename}"` : '';
    const head = `--${boundary}\r\nContent-Disposition: form-data; name="${name}"${filenameLine}\r\nContent-Type: application/octet-stream\r\n\r\n`;
    const tail = `\r\n--${boundary}--\r\n`;
    return {
      body: Buffer.concat([Buffer.from(head, 'utf8'), content, Buffer.from(tail, 'utf8')]),
      contentType: `multipart/form-data; boundary=${boundary}`,
    };
  }

  const historyStore = () => ChatHistoryStore.getInstance();

  try {
    setDebugOn(false);
    DeveloperMode.resetAll();
    // Disable alert delivery channels that could touch the network/disk;
    // console-only delivery keeps the send endpoint fully exercised.
    for (const ch of ['file', 'webhook', 'email', 'syslog', 'desktop'] as const) {
      alertManager.setChannelEnabled(ch, false);
    }

    // ===================================================================
    // 1. Router plumbing (Router.ts)
    // ===================================================================
    {
      const r = await api('PUT', '/api/chat', { message: 'hi' });
      assert(r.status === 404 && r.text === 'Not Found', 'Router: unmatched method → 404 Not Found');

      const r2 = await api('POST', '/api/chat', '{malformed json', {});
      assert(r2.status === 500 && r2.json?.error?.includes('Malformed JSON'), 'withErrorHandling: thrown parse error → 500 JSON');

      const r3 = await api('GET', '/api/alerts/unknown-sub');
      assert(r3.status === 404, 'Router: unmatched pathname → 404');
    }

    // ===================================================================
    // 2. VoiceRouter
    // ===================================================================
    {
      ttsResult = { ok: true, base64Audio: 'QUJDRA==', voice: 'eva-test-voice', cached: false };

      const missing = await api('POST', '/api/tts', { text: '   ' });
      assert(missing.status === 400 && missing.json?.error?.includes('Missing "text"'), 'POST /api/tts: blank text → 400');

      const ok = await api('POST', '/api/tts', { text: 'Привіт', persona: 'eva', lang: 'uk-UA' });
      assert(ok.status === 200 && ok.json?.ok === true, 'POST /api/tts: success → 200 ok:true');
      assert(ok.json?.provider === 'edge-tts' && ok.json?.voice === 'uk-UA-PolinaNeural', 'POST /api/tts: edge-tts primary serves audio (provider + voice)');
      assert(Buffer.from(ok.json?.audioBase64 || '', 'base64').toString() === 'EDGEAUDIO', 'POST /api/tts: edge-tts audio payload base64');
      assert(captured.ttsCalls.length === 0, 'POST /api/tts: cloudTts NOT called while edge-tts healthy');

      edgeOk = false;
      const okGoogle = await api('POST', '/api/tts', { text: 'Привіт', persona: 'eva', lang: 'uk-UA' });
      assert(okGoogle.status === 200 && okGoogle.json?.ok === true && okGoogle.json?.provider === 'google-tts', 'POST /api/tts: edge failure → google-tts fallback provider');
      assert(captured.ttsCalls.length === 1 && captured.ttsCalls[0].text === 'Привіт' && captured.ttsCalls[0].opts.persona === 'eva', 'POST /api/tts: delegates to cloudTts.synthesize with persona');
      edgeOk = true;

      ttsResult = { ok: false, error: 'synthesis failed' };
      edgeOk = false;
      const fail = await api('POST', '/api/tts', { text: 'fail please' });
      assert(fail.status === 200 && fail.json?.ok === false && fail.json?.fallback === 'browser-tts' && fail.json?.error === 'synthesis failed', 'POST /api/tts: synthesis failure → 200 ok:false browser fallback');

      ttsResult = { ok: false, error: 'MONTHLY_CAP_REACHED (900000)', overCap: true };
      const cap = await api('POST', '/api/tts', { text: 'over cap' });
      assert(cap.status === 200 && cap.json?.overCap === true, 'POST /api/tts: over-cap failure flagged overCap:true');
      ttsResult = { ok: true, base64Audio: 'QUJDRA==', voice: 'eva-test-voice', cached: false };
      edgeOk = true;

      const status = await api('GET', '/api/tts/status');
      assert(status.status === 200 && status.json?.voicesReady === true, 'GET /api/tts/status: 200 voicesReady');
      assert(status.json?.evaVoice === 'eva-test-voice' && status.json?.adamVoice === 'adam-test-voice' && status.json?.monthChars === 4321 && status.json?.cap === 900000, 'GET /api/tts/status: voices + usage + cap fields');
    }

    // ---- STT block: mock credentials + fetch, back up usage counter ----
    {
      googleAuthAny.getCredentials = async () => ({ type: 'bearer', token: 'test-token', source: 'test' });
      const sttJson = () => ({
        ok: true,
        status: 200,
        json: async () => ({ results: [{ alternatives: [{ transcript: 'привіт світ', confidence: 0.91 }] }] }),
        text: async () => '',
      });
      globalThis.fetch = (async (url: any, init: any) => {
        captured.sttCalls.push({ url: String(url), body: init?.body });
        return sttJson() as any;
      }) as any;

      try {
        // No-audio → 400
        const none = await api('POST', '/api/stt', {});
        assert(none.status === 400 && none.json?.error?.includes('No audio payload'), 'POST /api/stt: JSON without audio → 400');

        // JSON audio path (success through mocked CloudSTT)
        const audioB64 = Buffer.from('fake-ogg-bytes').toString('base64');
        const jsonOk = await api('POST', '/api/stt?lang=ru-RU&encoding=OGG_OPUS', { audio: audioB64 });
        assert(jsonOk.status === 200 && jsonOk.json?.transcript === 'привіт світ' && jsonOk.json?.confidence === 0.91, 'POST /api/stt: JSON audio path transcribes via mocked CloudSTT');
        assert(captured.sttCalls.length === 1 && captured.sttCalls[0].url === 'https://speech.googleapis.com/v1/speech:recognize', 'POST /api/stt: single recognize API call');
        const recognizedBody = JSON.parse(captured.sttCalls[0].body);
        assert(recognizedBody.config?.languageCode === 'ru-RU' && recognizedBody.config?.encoding === 'OGG_OPUS', 'POST /api/stt: query lang/encoding forwarded into recognize request');
        assert(recognizedBody.audio?.content === audioB64, 'POST /api/stt: base64 audio forwarded');

        // Multipart path (uses extractMultipartFile)
        const mp = multipartBody(Buffer.from('fake-ogg-multipart'));
        const mpRes = await api('POST', '/api/stt', mp.body, { 'Content-Type': mp.contentType });
        assert(mpRes.status === 200 && mpRes.json?.transcript === 'привіт світ', 'POST /api/stt: multipart file part transcribed');
        assert(captured.sttCalls.length === 2, 'POST /api/stt: multipart made exactly one recognize call');

        // Multipart without a file part → 400
        const badMp = multipartBody(Buffer.from('data'), { name: 'comment', filename: undefined as any });
        const mp400 = await api('POST', '/api/stt', badMp.body, { 'Content-Type': badMp.contentType });
        assert(mp400.status === 400 && mp400.json?.error?.includes('No audio payload'), 'POST /api/stt: multipart without file part → 400');

        // extractMultipartFile unit behavior
        const withName = multipartBody(Buffer.from('audio-bytes-1'), { name: 'audio' });
        assert(extractMultipartFile(withName.body, withName.contentType)?.toString() === 'audio-bytes-1', 'extractMultipartFile: name="audio" part extracted');
        const noBnd = extractMultipartFile(withName.body, 'application/json');
        assert(noBnd === null, 'extractMultipartFile: no boundary → null');

        // Failure path: credentials unavailable → 502
        googleAuthAny.getCredentials = async () => null;
        const fail = await api('POST', '/api/stt', { audio: Buffer.from('x').toString('base64') });
        assert(fail.status === 502 && String(fail.json?.error).includes('NO_GOOGLE_CREDENTIALS'), 'POST /api/stt: missing credentials → 502 NO_GOOGLE_CREDENTIALS');
      } finally {
        globalThis.fetch = origGlobalFetch;
        googleAuthAny.getCredentials = origGetCredentials;
        if (sttUsageBackup) fs.writeFileSync(STT_USAGE_PATH, sttUsageBackup);
        else if (fs.existsSync(STT_USAGE_PATH)) { try { fs.unlinkSync(STT_USAGE_PATH); } catch { /* ignore */ } }
      }
    }

    // ===================================================================
    // 3. ChatRouter
    // ===================================================================
    {
      const missing = await api('POST', '/api/chat', {});
      assert(missing.status === 400 && missing.json?.error?.includes('Missing or invalid "message"'), 'POST /api/chat: missing message → 400');

      const ok = await api('POST', '/api/chat', { message: 'Привіт Ева', sessionId: 'sess-a', history: [{ role: 'user', content: 'old' }] });
      assert(ok.status === 200 && ok.json?.response === 'MOCK-LLM-REPLY', 'POST /api/chat: 200 with mocked LLM reply (no debug footer when debug off)');
      assert(ok.json?.model === Config.defaultModel && ok.json?.provider === new UniversalLlmClient().resolveProvider(Config.defaultModel), 'POST /api/chat: default model + resolved provider');
      assert(captured.generate?.model === Config.defaultModel, 'POST /api/chat: generateContent called with default model');
      assert(captured.generate?.messages?.length === 2 && captured.generate?.messages?.[1]?.content === 'Привіт Ева', 'POST /api/chat: request history preserved + user message appended');
      assert(captured.generate?.options?.systemInstruction?.includes('[SYSTEM CONTEXT') === true, 'POST /api/chat: system-awareness block appended to instruction');
      assert(!DeveloperMode.isUnlocked('sess-a'), 'POST /api/chat: locked session gets no developer block');
      assert(!(captured.generate?.options?.systemInstruction || '').includes(SystemContext.DEVELOPER_BLOCK), 'POST /api/chat: DEVELOPER_BLOCK absent for locked session');

      const stored = historyStore().getSessionHistory('sess-a');
      assert(stored.length === 2 && stored[0].role === 'user' && stored[0].content === 'Привіт Ева' && stored[1].role === 'assistant' && stored[1].content === 'MOCK-LLM-REPLY', 'POST /api/chat: user+assistant persisted to temp ChatHistoryStore');

      // Debug footer
      setDebugOn(true);
      const dbg = await api('POST', '/api/chat', { message: 'debug me', sessionId: 'sess-dbg' });
      assert(dbg.status === 200 && dbg.json?.response?.startsWith('MOCK-LLM-REPLY') && dbg.json?.response?.includes('* debug:'), 'POST /api/chat: debug footer appended when debug ON');
      assert(dbg.json?.response?.includes(`model=${Config.defaultModel}`), 'POST /api/chat: footer carries model=…');
      setDebugOn(false);

      // sessionId handling: empty/missing → 'web-default'
      await api('POST', '/api/chat', { message: 'who am i', sessionId: '' });
      const webDefault = historyStore().getSessionHistory('web-default');
      assert(webDefault.length === 2 && webDefault.some((m) => m.content === 'who am i'), 'POST /api/chat: empty sessionId falls back to "web-default"');

      // Developer unlock via ModelsRouter /api/models/command (sessionId binding)
      const cmd = await api('POST', '/api/models/command', { command: '/developer unlock router-dev-pass-1', sessionId: 'sess-dev' });
      assert(cmd.status === 200 && typeof cmd.json?.result === 'string', 'POST /api/models/command: /developer unlock executes');
      assert(DeveloperMode.isUnlocked('sess-dev'), 'POST /api/models/command: unlock bound to body.sessionId');

      const devChat = await api('POST', '/api/chat', { message: 'dev?', sessionId: 'sess-dev' });
      assert(devChat.status === 200, 'POST /api/chat (developer session): 200');
      assert((captured.generate?.options?.systemInstruction || '').includes(SystemContext.DEVELOPER_BLOCK), 'POST /api/chat: DEVELOPER_BLOCK appended for unlocked session');

      const statusCmd = await api('POST', '/api/models/command', { command: '/developer status', sessionId: 'sess-dev' });
      assert(statusCmd.json?.result?.includes('[DEV-ON]'), 'POST /api/models/command: /developer status reports unlocked session');
      DeveloperMode.lock('sess-dev');

      // Password masking in persisted chat
      await api('POST', '/api/chat', { message: '/developer unlock SuperSecret99', sessionId: 'mask-sess' });
      const masked = historyStore().getSessionHistory('mask-sess');
      const userMsg = masked.find((m) => m.role === 'user');
      assert(userMsg?.content === '/developer unlock ****', 'POST /api/chat: persisted unlock message has password masked as ****');
      assert(!JSON.stringify(masked).includes('SuperSecret99'), 'POST /api/chat: raw password never reaches ChatHistoryStore');

      // History trim: store keeps per-session history, limit N returns last N
      for (let i = 1; i <= 12; i++) {
        historyStore().appendMessage({ sessionId: 'trim-sess', role: 'user', content: `trim-msg-${i}` });
      }
      const trimmed = historyStore().getSessionHistory('trim-sess', 10);
      assert(trimmed.length === 10 && trimmed[0].content === 'trim-msg-3' && trimmed[9].content === 'trim-msg-12', 'history trim: limit 10 returns the LAST 10 messages chronologically');

      // /api/chat/stream: 400 + SSE happy path
      const s400 = await api('POST', '/api/chat/stream', {});
      assert(s400.status === 400 && s400.json?.error?.includes('Missing or invalid "message"'), 'POST /api/chat/stream: missing message → 400 JSON (no SSE headers)');

      const sse = await realFetch(`${base}/api/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': `router-test-${++ipCounter}` },
        body: JSON.stringify({ message: 'стрім', sessionId: 'sess-stream' }),
      });
      assert(sse.status === 200 && (sse.headers.get('content-type') || '').includes('text/event-stream'), 'POST /api/chat/stream: SSE content-type');
      const sseBody = await sse.text();
      assert(sseBody.includes('data: {"chunk":"Привіт"}') && sseBody.includes('data: {"chunk":"!"}'), 'POST /api/chat/stream: chunk events forwarded as SSE data frames');
      assert(sseBody.includes('"done":true') && sseBody.includes('"fullText":"Привіт!"'), 'POST /api/chat/stream: done frame carries fullText');
      const streamStored = historyStore().getSessionHistory('sess-stream');
      assert(streamStored.some((m) => m.role === 'assistant' && m.content === 'Привіт!'), 'POST /api/chat/stream: assistant full text persisted');

      // /api/consilium
      const c400 = await api('POST', '/api/consilium', {});
      assert(c400.status === 400 && c400.json?.error?.includes('Missing or invalid "prompt"'), 'POST /api/consilium: missing prompt → 400');
      const cMode = await api('POST', '/api/consilium', { prompt: 'x', mode: 'invalid-mode' });
      assert(cMode.status === 400 && cMode.json?.error?.includes('Invalid "mode"'), 'POST /api/consilium: invalid mode → 400');
      const cOk = await api('POST', '/api/consilium', { prompt: 'Поради?', mode: 'solo' });
      assert(cOk.status === 200 && cOk.json?.success === true && cOk.json?.result?.text === 'SYNTH-RESULT', 'POST /api/consilium: 200 with mocked engine result');
      const consiliumStored = historyStore().getSessionHistory('consilium');
      assert(consiliumStored.some((m) => m.role === 'assistant' && m.content === 'SYNTH-RESULT'), 'POST /api/consilium: result persisted under consilium session');

      // /api/roles + /api/rules
      const roles = await api('GET', '/api/roles');
      assert(roles.status === 200 && roles.json?.count > 0 && Array.isArray(roles.json?.roles) && roles.json.roles[0].id, 'GET /api/roles: corporate roles list');

      const rulesGet = await api('GET', '/api/rules');
      assert(rulesGet.status === 200 && typeof rulesGet.json?.total === 'number' && Array.isArray(rulesGet.json?.rules), 'GET /api/rules: rules list + counts');

      const ruleAdd = await api('POST', '/api/rules', { action: 'add', name: 'router-test-rule', ruleText: 'Be polite', category: 'test' });
      assert(ruleAdd.status === 201 && ruleAdd.json?.success === true, 'POST /api/rules: add → 201');
      const addBad = await api('POST', '/api/rules', { action: 'add' });
      assert(addBad.status === 400, 'POST /api/rules: add without name/ruleText → 400');

      const ruleId = ruleAdd.json?.rule?.id;
      const toggle = await api('POST', '/api/rules', { action: 'toggle', id: ruleId, enforced: false });
      assert(toggle.status === 200, 'POST /api/rules: toggle');
      const remove = await api('POST', '/api/rules', { action: 'remove', id: ruleId });
      assert(remove.status === 200, 'POST /api/rules: remove');
      const removeMissing = await api('POST', '/api/rules', { action: 'remove' });
      assert(removeMissing.status === 400, 'POST /api/rules: remove without id → 400');
      const badAction = await api('POST', '/api/rules', { action: 'bogus' });
      assert(badAction.status === 400 && badAction.json?.error?.includes('Invalid action'), 'POST /api/rules: unknown action → 400');
      await api('POST', '/api/rules', { action: 'reset' });
    }

    // ===================================================================
    // 4. ModelsRouter
    // ===================================================================
    {
      const models = await api('GET', '/api/models');
      assert(models.status === 200 && Array.isArray(models.json?.models) && models.json.models.length > 0, 'GET /api/models: model catalog with ratings');
      assert(models.json?.stats && typeof models.json.stats.total === 'number' && typeof models.json.defaultModel === 'string', 'GET /api/models: stats + defaultModel + smartestFreeModel');
      const first = models.json.models[0];
      assert(first.rating && typeof first.rating.composite === 'number', 'GET /api/models: composite rating attached');

      const free = await api('GET', '/api/models/free');
      assert(free.status === 200 && typeof free.json?.count === 'number' && Array.isArray(free.json?.models), 'GET /api/models/free: free-only list');
      const paid = await api('GET', '/api/models/paid');
      assert(paid.status === 200 && typeof paid.json?.count === 'number' && Array.isArray(paid.json?.models), 'GET /api/models/paid: paid-only list');

      const top = await api('GET', '/api/models/top?dimension=speed&limit=3&free=true');
      assert(top.status === 200 && top.json?.dimension === 'speed' && top.json?.limit === 3 && top.json?.freeOnly === true && Array.isArray(top.json?.entries), 'GET /api/models/top: dimension/limit/freeOnly echo + entries');

      const valid = await api('POST', '/api/models/command', { command: '/debug status' });
      assert(valid.status === 200 && valid.json?.result?.includes('Debug mode:'), 'POST /api/models/command: valid command returns result');

      const invalid = await api('POST', '/api/models/command', { command: 'definitely-not-a-command' });
      assert(invalid.status === 200 && invalid.json?.result?.includes('[ERROR] Unknown command'), 'POST /api/models/command: unknown command returns [ERROR] string');
    }

    // ===================================================================
    // 5. AlertsRouter
    // ===================================================================
    {
      const list0 = await api('GET', '/api/alerts?limit=5&severity=low');
      assert(list0.status === 200 && typeof list0.json?.count === 'number' && Array.isArray(list0.json?.alerts), 'GET /api/alerts: limit + severity filter');

      const stats = await api('GET', '/api/alerts/stats');
      assert(stats.status === 200 && typeof stats.json === 'object', 'GET /api/alerts/stats: stats object');

      const sendBad = await api('POST', '/api/alerts/send', { severity: 'low' });
      assert(sendBad.status === 400 && sendBad.json?.error?.includes('Missing severity/title/message'), 'POST /api/alerts/send: missing fields → 400');

      const before = (await api('GET', '/api/alerts')).json.count;
      const sent = await api('POST', '/api/alerts/send', { severity: 'high', title: `router-test-${Date.now()}`, message: 'boom', source: 'routers.test' });
      assert(sent.status === 200 && sent.json?.sent === true && sent.json?.event?.id, 'POST /api/alerts/send: event dispatched');
      const after = (await api('GET', '/api/alerts')).json.count;
      assert(after === before + 1, 'POST /api/alerts/send: event retrievable via GET /api/alerts');

      const ch = await api('POST', '/api/alerts/channel', { type: 'desktop', enabled: true });
      assert(ch.status === 200 && ch.json?.type === 'desktop' && ch.json?.enabled === true, 'POST /api/alerts/channel: toggle echoed');
      const cfg = await api('GET', '/api/alerts/config');
      assert(cfg.status === 200 && Array.isArray(cfg.json?.channels) && cfg.json.channels.find((c: any) => c.type === 'desktop')?.enabled === true, 'GET /api/alerts/config: channel state persisted');
      alertManager.setChannelEnabled('desktop', false);
    }

    // ===================================================================
    // 6. LogsRouter
    // ===================================================================
    {
      const files = await api('GET', '/api/logs/files');
      assert(files.status === 200 && Array.isArray(files.json?.files) && files.json?.paths, 'GET /api/logs/files: file list + path map');

      const read = await api('GET', '/api/logs/read?lines=10');
      assert(read.status === 200 && read.json?.filename === 'evabot.log' && read.json?.lines === 10 && typeof read.json?.content === 'string', 'GET /api/logs/read: defaults + content');

      const recent = await api('GET', '/api/logs/recent?limit=10');
      assert(recent.status === 200 && typeof recent.json?.count === 'number' && Array.isArray(recent.json?.logs), 'GET /api/logs/recent: ring buffer query');

      const recentLevel = await api('GET', '/api/logs/recent?limit=5&level=ERROR');
      assert(recentLevel.status === 200 && recentLevel.json.logs.every((l: any) => l.level === 'ERROR'), 'GET /api/logs/recent: level filter applied');
    }

    // ===================================================================
    // 7. SecurityRouter
    // ===================================================================
    {
      const st = await api('GET', '/api/security/status');
      assert(st.status === 200 && typeof st.json === 'object', 'GET /api/security/status: stats object');

      const report = await api('GET', '/api/security/report');
      assert(report.status === 200 && report.contentType.includes('text/plain') && report.text.length > 0, 'GET /api/security/report: plain-text report');

      const blockBad = await api('POST', '/api/security/block', {});
      assert(blockBad.status === 400 && blockBad.json?.error?.includes('Missing "ip"'), 'POST /api/security/block: missing ip → 400');

      const blockedIp = '203.0.113.77';
      const block = await api('POST', '/api/security/block', { ip: blockedIp, reason: 'routers.test' });
      assert(block.status === 200 && block.json?.blocked === blockedIp, 'POST /api/security/block: ip blocked');

      const blockedReq = await realFetch(`${base}/api/health`, { headers: { 'X-Forwarded-For': blockedIp } });
      assert(blockedReq.status === 403, 'blocked IP is rejected by middleware with 403');

      const unblockBad = await api('POST', '/api/security/unblock', {});
      assert(unblockBad.status === 400, 'POST /api/security/unblock: missing ip → 400');
      const unblock = await api('POST', '/api/security/unblock', { ip: blockedIp });
      assert(unblock.status === 200 && unblock.json?.unblocked === blockedIp, 'POST /api/security/unblock: ip unblocked');
      const afterUnblock = await realFetch(`${base}/api/health`, { headers: { 'X-Forwarded-For': `router-test-${++ipCounter}` } });
      assert(afterUnblock.status === 200, 'unblocked IP can reach the server again');
    }

    // ===================================================================
    // 8. PluginsRouter
    // ===================================================================
    {
      const list = await api('GET', '/api/plugins');
      assert(list.status === 200 && typeof list.json?.count === 'number' && Array.isArray(list.json?.plugins), 'GET /api/plugins: manifest list');

      const health = await api('GET', '/api/plugins/health');
      assert(health.status === 200 && health.json?.health && typeof health.json.health === 'object', 'GET /api/plugins/health: health map');

      const unknown = await api('GET', '/api/plugins/definitely-not-a-plugin');
      assert(unknown.status === 404 && unknown.json?.error?.includes('not found'), 'GET /api/plugins/:id: unknown id → 404');

      const enableMissing = await api('POST', '/api/plugins/definitely-not-a-plugin/enable');
      assert(enableMissing.status === 500, 'POST /api/plugins/:id/enable: unknown plugin → 500 (withErrorHandling)');
      const disableMissing = await api('POST', '/api/plugins/definitely-not-a-plugin/disable');
      assert(disableMissing.status === 500, 'POST /api/plugins/:id/disable: unknown plugin → 500 (withErrorHandling)');
    }

    // Restore alert channel defaults
    for (const ch of ['file', 'webhook', 'email', 'syslog', 'desktop'] as const) {
      alertManager.setChannelEnabled(ch, ch === 'file');
    }

    console.log('--- Router HTTP API Tests Complete ---');
  } catch (err: any) {
    console.error(`  ✗ Router test harness error: ${err.stack || err.message}`);
    passed = false;
  } finally {
    await new Promise<void>((resolve) => { server.close(() => resolve()); });

    // Restore module state / env
    proto.generateContent = origGenerate;
    proto.streamContent = origStream;
    kbProto.search = origKbSearch;
    consiliumProto.run = origConsiliumRun;
    for (const [k, v] of Object.entries(origTtsMethods)) cloudTtsAny[k] = v;
    for (const [k, v] of Object.entries(origEdgeMethods)) edgeTtsAny[k] = v;
    globalThis.fetch = origGlobalFetch;
    googleAuthAny.getCredentials = origGetCredentials;
    if (sttUsageBackup) { try { fs.writeFileSync(STT_USAGE_PATH, sttUsageBackup); } catch { /* ignore */ } }
    DeveloperMode.resetAll();
    setDebugOn(false);
    if (prevChatDb === undefined) delete process.env.EVABOT_CHAT_DB; else process.env.EVABOT_CHAT_DB = prevChatDb;
    if (prevDevPwd === undefined) delete process.env.EVADEV_PASSWORD; else process.env.EVADEV_PASSWORD = prevDevPwd;
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* best effort */ }
  }

  return passed;
}
