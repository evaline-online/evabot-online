/**
 * telegram_deep.test.ts — deep coverage for src/telegram/ (TelegramBot + ChatEngine).
 *
 * No real network: global fetch is stubbed with a per-test router keyed on the
 * Telegram API URL; the command executor, voice transcriber and ChatEngine
 * collaborators are injected or monkey-patched at their public seams.
 */
import { TelegramBot, localeToSttLang, type VoiceTranscriber } from '../src/telegram/TelegramBot.js';
import { ChatEngine } from '../src/telegram/ChatEngine.js';
import { I18nEngine } from '../src/core/I18nEngine.js';
import { DeveloperMode } from '../src/core/DeveloperMode.js';
import { ChatHistoryStore } from '../src/core/ChatHistoryStore.js';
import { SystemContext } from '../src/core/SystemContext.js';
import { rulesEngine } from '../src/core/RulesEngine.js';
import { LOCALE_POLICY } from '../src/core/LocalePolicy.js';
import { Config } from '../src/core/Config.js';
import { ModelRatings, normalizeCommand } from '../src/models/ModelRatings.js';
import type { SttLanguage, SttResult } from '../src/core/CloudSTT.js';
import path from 'node:path';
import os from 'node:os';
import fs from 'node:fs';

interface SentMessage {
  chatId: number;
  text: string;
  reply_markup?: { keyboard: string[][] };
}

interface FetchRouteResult {
  ok?: boolean;
  result?: unknown;
  bytes?: Buffer;
  throwError?: Error;
}

interface BotFixture {
  bot: TelegramBot;
  sent: SentMessage[];
  calls: { url: string; body: any }[];
  setRoute: (r: (url: string, body: any) => FetchRouteResult | undefined) => void;
  restore: () => void;
}

/** Stubs global fetch, routing calls through `route` and recording everything. */
function installFetchStub(route: (url: string, body: any) => FetchRouteResult | undefined): () => void {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = String(typeof input === 'string' ? input : input?.url || '');
    let body: any = undefined;
    try {
      body = init?.body ? JSON.parse(init.body) : undefined;
    } catch {
      body = init?.body;
    }
    const handled = route(url, body);
    if (handled?.throwError) throw handled.throwError;
    if (handled?.bytes) {
      const bytes = handled.bytes;
      return {
        ok: true,
        json: async () => ({ ok: true }),
        arrayBuffer: async () =>
          bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
      } as any;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({ ok: handled?.ok !== false, result: handled?.result ?? [] }),
      arrayBuffer: async () => new ArrayBuffer(0),
    } as any;
  }) as any;
  return () => {
    globalThis.fetch = realFetch;
  };
}

/** Collapses sleeps ≥900ms (rate-limit waits, poll retries) to ~1ms while recording them. */
function installFastTimers(): { delays: number[]; restore: () => void } {
  const realSetTimeout = globalThis.setTimeout;
  const realDateNow = Date.now;
  const delays: number[] = [];
  let fakeNow = realDateNow.call(Date);
  const fast = function (this: unknown, fn: any, ms?: any, ...args: any[]) {
    const d = Number(ms) || 0;
    if (d >= 900) delays.push(d);
    fakeNow += Math.min(d, 1);
    return (realSetTimeout as any)(fn, Math.min(d, 1), ...args);
  };
  (globalThis as any).setTimeout = fast as any;
  Date.now = () => fakeNow;
  return {
    delays,
    restore: () => {
      (globalThis as any).setTimeout = realSetTimeout;
      Date.now = realDateNow;
    },
  };
}

function makeBotFixture(executor: (cmd: string) => string, transcriber?: VoiceTranscriber): BotFixture {
  const sent: SentMessage[] = [];
  const calls: { url: string; body: any }[] = [];
  let route: (url: string, body: any) => FetchRouteResult | undefined = () => undefined;
  const bot = new TelegramBot({ token: 'TEST-TOKEN', apiBase: 'https://api.telegram.test', execute: executor, transcriber });
  const restore = installFetchStub((url, body) => {
    calls.push({ url, body });
    if (url.includes('/sendMessage')) {
      sent.push({ chatId: body?.chat_id, text: body?.text, reply_markup: body?.reply_markup });
    }
    return route(url, body);
  });
  return {
    bot,
    sent,
    calls,
    setRoute: (r) => {
      route = r;
    },
    restore,
  };
}

function makeTextMessage(chatId: number, text: string, username = 'tester'): any {
  return {
    message_id: 1,
    from: { id: 7, username },
    date: 0,
    chat: { id: chatId, type: 'private' },
    text,
  };
}

function makeVoiceMessage(chatId: number, username = 'tester'): any {
  return {
    message_id: 2,
    from: { id: 7, username },
    date: 0,
    chat: { id: chatId, type: 'private' },
    voice: { file_id: 'FILE123', duration: 2, mime_type: 'audio/ogg' },
  };
}

async function waitFor(predicate: () => boolean, timeoutMs = 3000, stepMs = 10): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return true;
    await new Promise((r) => setTimeout(r, stepMs));
  }
  return predicate();
}

async function expectThrowsAsync(fn: () => Promise<unknown>): Promise<Error | null> {
  try {
    await fn();
    return null;
  } catch (err: any) {
    return err;
  }
}

async function runTelegramDeepTests(): Promise<boolean> {
  console.log('\n=== TelegramBot + ChatEngine Deep Tests ===\n');
  let passed = 0;
  let failed = 0;
  const t = (name: string, cond: boolean, detail: string = '') => {
    if (cond) {
      passed++;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      console.error(`  ✗ ${name} ${detail}`);
    }
  };

  // ------------------------------------------------------------------
  // PART A — TelegramBot
  // ------------------------------------------------------------------

  // A1. sendMessage fan-out for >4096-char replies.
  {
    const fx = makeBotFixture(() => '');
    try {
      const wall = 'a'.repeat(9000);
      await fx.bot.sendMessage(1, wall);
      const msgs = fx.sent.filter((s) => s.chatId === 1);
      t('sendMessage chunks a 9000-char wall into 3 API calls', msgs.length === 3, `count=${msgs.length}`);
      t('each sendMessage chunk ≤4096 chars', msgs.every((m) => m.text!.length <= 4096));
      t('chunked payload concatenates back to the original', msgs.map((m) => m.text).join('') === wall);
    } finally {
      fx.restore();
    }
  }

  // A2. sendMessage with blank text → no API call.
  {
    const fx = makeBotFixture(() => '');
    try {
      await fx.bot.sendMessage(2, '   ');
      t('sendMessage with blank text sends nothing', fx.sent.length === 0, `sent=${fx.sent.length}`);
    } finally {
      fx.restore();
    }
  }

  // A3. /lang + localized /start greeting.
  {
    const executorCalls: string[] = [];
    const fx = makeBotFixture((cmd) => {
      executorCalls.push(cmd);
      return `EXEC:${cmd}`;
    });
    try {
      await (fx.bot as any).processMessage(makeTextMessage(101, '/lang uk'));
      t('/lang uk switches chat locale', fx.bot.getChatLocale(101) === 'uk');
      t('/lang replies with the uk langSwitched string', fx.sent[0]?.text === I18nEngine.getStrings('uk').langSwitched);
      await (fx.bot as any).processMessage(makeTextMessage(101, '/start'));
      const greet = fx.sent[1];
      t('/start greeting is localized (uk), prefixed [BOT], includes help',
        Boolean(greet) && greet!.text.startsWith('[BOT] ')
        && greet!.text.includes(I18nEngine.getStrings('uk').greeting)
        && greet!.text.includes(I18nEngine.formatHelp('uk')));
      t('/start never hits the command executor', !executorCalls.some((c) => c.startsWith('/start')));
    } finally {
      fx.restore();
    }
  }

  // A4. /lang argument resolution: ua→uk, ru→ru, unknown→en.
  {
    const fx = makeBotFixture(() => 'ok');
    try {
      await (fx.bot as any).processMessage(makeTextMessage(102, '/lang ua'));
      t('/lang ua resolves to uk', fx.bot.getChatLocale(102) === 'uk');
      await (fx.bot as any).processMessage(makeTextMessage(102, '/lang ru'));
      t('/lang ru resolves to ru', fx.bot.getChatLocale(102) === 'ru');
      await (fx.bot as any).processMessage(makeTextMessage(102, '/lang de'));
      t('/lang de falls back to en', fx.bot.getChatLocale(102) === 'en');
    } finally {
      fx.restore();
    }
  }

  // A5. /models: executor output + reply keyboard with top-8 free models.
  {
    const executorCalls: string[] = [];
    const fx = makeBotFixture((cmd) => {
      executorCalls.push(cmd);
      return `EXEC:${cmd}`;
    });
    try {
      await (fx.bot as any).processMessage(makeTextMessage(103, '/models'));
      t('/models runs through the executor', executorCalls.includes('/models'));
      t('/models delivers the executor output first', fx.sent[0]?.text === 'EXEC:/models');
      const markup = fx.sent[1]?.reply_markup;
      const top8 = ModelRatings.getTopFree(8);
      t('/models sends a reply keyboard containing the top free model',
        Boolean(markup?.keyboard) && markup!.keyboard.length > 0
        && markup!.keyboard.flat().includes(top8[0].model.name));
    } finally {
      fx.restore();
    }
  }

  // A6. /developer: RAW command (password casing preserved) + session scoping.
  {
    const executorCalls: string[] = [];
    const fx = makeBotFixture((cmd) => {
      executorCalls.push(cmd);
      return `EXEC:${cmd}`;
    });
    try {
      await (fx.bot as any).processMessage(makeTextMessage(104, '/developer unlock MyPw123'));
      t('/developer passes the RAW line to the executor (casing intact)',
        executorCalls.includes('/developer unlock MyPw123'),
        `received=${JSON.stringify(executorCalls)}`);
      t('/developer scopes DeveloperMode session to tg-<chatId>', DeveloperMode.resolveSession() === 'tg-104');
      t('/developer delivers the executor output', fx.sent[0]?.text === 'EXEC:/developer unlock MyPw123');
    } finally {
      fx.restore();
      DeveloperMode.clearActiveSession();
    }
  }

  // A7. Plain command path: normalizeCommand applied before execute.
  {
    const executorCalls: string[] = [];
    const fx = makeBotFixture((cmd) => {
      executorCalls.push(cmd);
      return `EXEC:${cmd}`;
    });
    try {
      await (fx.bot as any).processMessage(makeTextMessage(105, '/ТОП free 3'));
      const expected = normalizeCommand('/ТОП free 3');
      t('non-/developer commands are normalized (lowercased alias) before execute',
        executorCalls.length === 1 && executorCalls[0] === expected,
        `received=${JSON.stringify(executorCalls)} expected=${expected}`);
      t('normalized command output is delivered', fx.sent[0]?.text === `EXEC:${expected}`);
    } finally {
      fx.restore();
    }
  }

  // A8. Chat (non-command) text → ChatEngine.respond, reply delivered.
  {
    const respondCalls: any[] = [];
    const fx = makeBotFixture(() => '');
    (fx.bot as any).chatEngine = {
      respond: async (req: any) => {
        respondCalls.push(req);
        return { text: 'ENGINE-REPLY', model: 'm', sessionId: req.sessionId };
      },
    };
    try {
      await (fx.bot as any).processMessage(makeTextMessage(106, 'какая погода сегодня?'));
      t('chat text routed into ChatEngine with tg-<chatId> session id',
        respondCalls.length === 1 && respondCalls[0].message === 'какая погода сегодня?' && respondCalls[0].sessionId === 'tg-106');
      t('chat engine reply is delivered to the chat', fx.sent[0]?.text === 'ENGINE-REPLY');
    } finally {
      fx.restore();
    }
  }

  // A9. ChatEngine failure → warning reply, no crash.
  {
    const fx = makeBotFixture(() => '');
    (fx.bot as any).chatEngine = {
      respond: async () => {
        throw new Error('llm down');
      },
    };
    try {
      await (fx.bot as any).processMessage(makeTextMessage(107, 'hello?'));
      t('chat engine failure produces a [WRN] error reply',
        fx.sent.length === 1 && fx.sent[0].text.includes('[WRN] Chat engine error: llm down'));
    } finally {
      fx.restore();
    }
  }

  // A10. Unregistered user (no username/first_name) warned for text and voice.
  {
    const fx = makeBotFixture(() => '');
    try {
      const anon: any = makeTextMessage(108, 'hi');
      anon.from = { id: 9 };
      await (fx.bot as any).processMessage(anon);
      t('text from user without username/name → registration warning',
        fx.sent.length === 1 && fx.sent[0].text.includes('register a Telegram account'));

      const anonVoice: any = makeVoiceMessage(108);
      anonVoice.from = { id: 9 };
      await (fx.bot as any).processMessage(anonVoice);
      t('voice from user without username/name → registration warning (no download attempt)',
        fx.sent.length === 2 && fx.sent[1].text.includes('register a Telegram account'));
    } finally {
      fx.restore();
    }
  }

  // A11. Whitespace-only text is ignored gracefully.
  {
    const fx = makeBotFixture(() => '');
    try {
      await (fx.bot as any).processMessage(makeTextMessage(109, '   '));
      t('whitespace-only text is ignored (no reply)', fx.sent.length === 0);
    } finally {
      fx.restore();
    }
  }

  // A12. Voice → transcript starting with / executes as a command.
  {
    const executorCalls: string[] = [];
    let transcriberLang: SttLanguage | null = null;
    const fx = makeBotFixture((cmd) => {
      executorCalls.push(cmd);
      return `EXEC:${cmd}`;
    }, async (_audio, lang) => {
      transcriberLang = lang;
      return { transcript: '/help', confidence: 0.9, secondsBilled: 2, ok: true };
    });
    try {
      fx.setRoute((url) => {
        if (url.includes('/getFile')) return { result: { file_path: 'voice/file.ogg' } };
        if (url.includes('/file/bot')) return { bytes: Buffer.from('raw-ogg') };
        return undefined;
      });
      await (fx.bot as any).processMessage(makeVoiceMessage(110));
      // NOTE: sendMessage → splitTelegramMessage trims leading whitespace, so
      // VOICE_PREFIX's leading space never reaches the wire.
      t('voice transcript echoed with the Розпізнано prefix', fx.sent[0]?.text === 'Розпізнано: /help');
      t('voice transcript starting with / executes as a command', executorCalls.includes('/help'));
      t('transcriber receives en-US STT language by default', transcriberLang === 'en-US');
    } finally {
      fx.restore();
    }
  }

  // A13. Voice → non-command transcript flows into ChatEngine.
  {
    const respondCalls: any[] = [];
    const transcriber: VoiceTranscriber = async () => ({
      transcript: 'что такое кватернион',
      confidence: 0.8,
      secondsBilled: 3,
      ok: true,
    });
    const fx = makeBotFixture(() => '', transcriber);
    (fx.bot as any).chatEngine = {
      respond: async (req: any) => {
        respondCalls.push(req);
        return { text: 'CHAT-REPLY', model: 'm', sessionId: req.sessionId };
      },
    };
    try {
      fx.setRoute((url) => {
        if (url.includes('/getFile')) return { result: { file_path: 'voice/file.ogg' } };
        if (url.includes('/file/bot')) return { bytes: Buffer.from('raw-ogg') };
        return undefined;
      });
      await (fx.bot as any).processMessage(makeVoiceMessage(111));
      t('non-command voice transcript flows into ChatEngine',
        respondCalls.length === 1 && respondCalls[0].message === 'что такое кватернион');
      t('chat reply for voice transcript is delivered', fx.sent[1]?.text === 'CHAT-REPLY');
    } finally {
      fx.restore();
    }
  }

  // A14. Voice transcription failure → warning with the STT error detail.
  {
    const fx = makeBotFixture(() => '', async () => ({
      transcript: '',
      confidence: 0,
      secondsBilled: 0,
      ok: false,
      error: 'no-speech',
    }));
    try {
      fx.setRoute((url) => {
        if (url.includes('/getFile')) return { result: { file_path: 'voice/f.ogg' } };
        if (url.includes('/file/bot')) return { bytes: Buffer.from('ogg') };
        return undefined;
      });
      await (fx.bot as any).processMessage(makeVoiceMessage(112));
      t('transcription failure → [WRN] with the STT error',
        fx.sent[0]?.text.includes('Не вдалося розпізнати') && fx.sent[0]?.text.includes('no-speech'));
    } finally {
      fx.restore();
    }
  }

  // A15. Voice download failure → placeholder, transcriber never invoked.
  {
    let transcriberCalled = false;
    const fx = makeBotFixture(() => '', async () => {
      transcriberCalled = true;
      return { transcript: 'x', confidence: 1, secondsBilled: 1, ok: true };
    });
    try {
      fx.setRoute((url) => {
        if (url.includes('/getFile')) return { throwError: new Error('tg file gone') };
        return undefined;
      });
      await (fx.bot as any).processMessage(makeVoiceMessage(113));
      t('voice download failure → placeholder message', fx.sent[0]?.text.includes('Не вдалося завантажити голосове'));
      t('transcriber skipped when the download fails', transcriberCalled === false);
    } finally {
      fx.restore();
    }
  }

  // A16. Per-chat 1 msg/sec rate queue (fake timers record the waits).
  {
    const fx = makeBotFixture(() => '');
    (fx.bot as any).chatEngine = {
      respond: async (req: any) => ({ text: req.message, model: 'm', sessionId: req.sessionId }),
    };
    const fast = installFastTimers();
    try {
      const p1 = (fx.bot as any).handleMessage(makeTextMessage(114, 'one'));
      const p2 = (fx.bot as any).handleMessage(makeTextMessage(114, 'two'));
      const p3 = (fx.bot as any).handleMessage(makeTextMessage(114, 'three'));
      await Promise.all([p1, p2, p3]);
      t('per-chat queue processes all three messages', fx.sent.length === 3);
      const rateDelays = fast.delays.filter((d) => d > 900 && d <= 1000);
      t('rate limit waits ~1000ms recorded for messages 2 and 3',
        rateDelays.length >= 2,
        `delays=${JSON.stringify(fast.delays)}`);
      t('messages processed in FIFO order', fx.sent.map((s) => s.text).join(',') === 'one,two,three',
        `order=${fx.sent.map((s) => s.text).join(',')}`);
    } finally {
      fast.restore();
      fx.restore();
    }
  }

  // A17. Poll loop: one update processed end-to-end; fetch error → logged, loop continues.
  {
    const executorCalls: string[] = [];
    const fx = makeBotFixture((cmd) => {
      executorCalls.push(cmd);
      return `EXEC:${cmd}`;
    });
    (fx.bot as any).chatEngine = {
      respond: async (req: any) => ({ text: 'POLL-CHAT-REPLY', model: 'm', sessionId: req.sessionId }),
    };
    const fast = installFastTimers();
    let getUpdatesCalls = 0;
    try {
      fx.setRoute((url) => {
        if (url.includes('/getUpdates')) {
          getUpdatesCalls++;
          if (getUpdatesCalls === 1) {
            return { result: [{ update_id: 42, message: makeTextMessage(120, 'hello from poll') }] };
          }
          if (getUpdatesCalls === 2) return { throwError: new Error('network glitch') };
          if (getUpdatesCalls === 3) return { result: [] };
          if (getUpdatesCalls === 4) {
            fx.bot.stop();
            return { throwError: new Error('second glitch') };
          }
          return { result: [] };
        }
        return undefined;
      });
      await fx.bot.start();
      const drained = await waitFor(() => getUpdatesCalls >= 4 && fx.sent.length >= 1);
      t('poll loop processed the update and delivered the chat reply',
        drained && fx.sent.some((s) => s.text === 'POLL-CHAT-REPLY'),
        `calls=${getUpdatesCalls} sent=${fx.sent.length}`);
      const pollCalls = fx.calls.filter((c) => c.url.includes('/getUpdates'));
      t('first getUpdates offset starts at 0', pollCalls[0]?.body.offset === 0);
      t('offset advances past the update id (43)', pollCalls[1]?.body.offset === 43,
        `offset=${pollCalls[1]?.body.offset}`);
      t('poll loop continued after the getUpdates failure (4 calls total)', getUpdatesCalls === 4, `calls=${getUpdatesCalls}`);
      t('getUpdates long-poll payload includes timeout/allowed_updates',
        pollCalls[0]?.body.timeout === 25 && Array.isArray(pollCalls[0]?.body.allowed_updates));
    } finally {
      fx.bot.stop();
      fast.restore();
      fx.restore();
    }
  }

  // A18. start() without token is a safe no-op.
  {
    const noTokenBot = new TelegramBot({ token: '', execute: () => '' });
    await noTokenBot.start();
    noTokenBot.stop();
    t('start() without token does not throw / poll', true);
  }

  // A19. localeToSttLang mapping.
  {
    t('localeToSttLang en→en-US', localeToSttLang('en') === 'en-US');
    t('localeToSttLang uk→uk-UA', localeToSttLang('uk') === 'uk-UA');
    t('localeToSttLang ru→ru-RU', localeToSttLang('ru') === 'ru-RU');
  }

  // ------------------------------------------------------------------
  // PART B — ChatEngine
  // ------------------------------------------------------------------
  const tmpDb = path.join(os.tmpdir(), `evabot-tgdeep-${Date.now()}-${Math.floor(Math.random() * 1e6)}.db`);
  const origGetInstance = (ChatHistoryStore as any).getInstance;
  const tempStore: ChatHistoryStore = origGetInstance.call(ChatHistoryStore, tmpDb);
  (ChatHistoryStore as any).getInstance = function (dbPath?: string): ChatHistoryStore {
    return dbPath ? origGetInstance.call(ChatHistoryStore, dbPath) : tempStore;
  };
  const origPassword = process.env.EVADEV_PASSWORD;

  try {
    const makeEngine = (historyLimit = 12) => {
      const engine = new ChatEngine({ historyLimit });
      const clientCalls: { model: string; messages: any[]; options: any }[] = [];
      (engine as any).client.generateContent = async (model: string, messages: any[], options: any) => {
        clientCalls.push({ model, messages, options });
        return 'LLM-ANSWER';
      };
      const kbCalls: string[] = [];
      (engine as any).kbConnector.search = async (q: string) => {
        kbCalls.push(q);
        return [{ id: 'd1', title: 'KB Doc', content: 'KB body', category: 'x', tags: [], source: 's' }];
      };
      (engine as any).kbConnector.formatContextForPrompt = () => 'KB-CONTEXT-MARKER';
      return { engine, clientCalls, kbCalls };
    };

    // B1. Happy path (developer locked): prompt composition + persistence.
    {
      const { engine, clientCalls, kbCalls } = makeEngine();
      const res = await engine.respond({ message: 'hi there', sessionId: 'ce-lock', locale: 'en' });
      t('respond returns LLM text, model and sessionId',
        res.text === 'LLM-ANSWER' && res.model === Config.defaultModel && res.sessionId === 'ce-lock');
      const sys = clientCalls[0].options.systemInstruction as string;
      t('system instruction includes the LocalePolicy suffix', sys.includes(LOCALE_POLICY.systemInstructionSuffix));
      t('system instruction includes rules engine output', sys.includes(rulesEngine.compileRulesInstruction()));
      t('system instruction includes the SystemContext block', sys.includes(SystemContext.build()));
      t('system instruction excludes DEVELOPER_BLOCK while locked', !sys.includes(SystemContext.DEVELOPER_BLOCK));
      t('KB search ran and its context was appended', kbCalls.includes('hi there') && sys.includes('KB-CONTEXT-MARKER'));
      t('message list ends with the trimmed user message',
        clientCalls[0].messages.length === 1
        && clientCalls[0].messages[0].role === 'user'
        && clientCalls[0].messages[0].content === 'hi there');
      const stored = tempStore.getSessionHistory('ce-lock', 10);
      t('user + assistant turns persisted to the history store',
        stored.length === 2 && stored[0].role === 'user' && stored[1].role === 'assistant');
      t('persisted lang mirrors the request locale', stored.every((r) => r.lang === 'en'));
    }

    // B2. DEVELOPER_BLOCK injected only when the session is unlocked.
    {
      process.env.EVADEV_PASSWORD = 'D3vPW';
      const { engine, clientCalls } = makeEngine();
      await engine.respond({ message: 'q', sessionId: 'ce-dev', locale: 'en' });
      const sys1 = clientCalls[0].options.systemInstruction as string;
      t('locked session prompt has no DEVELOPER_BLOCK', !sys1.includes(SystemContext.DEVELOPER_BLOCK));
      t('developer unlock succeeds with the correct password', DeveloperMode.unlock('ce-dev', 'D3vPW') === true);
      await engine.respond({ message: 'q2', sessionId: 'ce-dev', locale: 'en' });
      const sys2 = clientCalls[1].options.systemInstruction as string;
      t('unlocked session prompt includes DEVELOPER_BLOCK', sys2.includes(SystemContext.DEVELOPER_BLOCK));
      DeveloperMode.lock('ce-dev');
    }

    // B3. History trimming from the temp store (historyLimit=4, 10 prefilled turns).
    {
      for (let i = 0; i < 10; i++) {
        tempStore.appendMessage({ sessionId: 'ce-hist', role: i % 2 === 0 ? 'user' : 'assistant', content: `turn-${i}`, model: 'm', lang: 'en' });
      }
      const { engine, clientCalls } = makeEngine(4);
      await engine.respond({ message: 'new question', sessionId: 'ce-hist', locale: 'en' });
      const msgs = clientCalls[0].messages;
      t('history trimmed to historyLimit (4) + new message = 5 total', msgs.length === 5, `len=${msgs.length}`);
      t('trim keeps the most recent turns (turn-6 first, new message last)',
        msgs[0].content === 'turn-6' && msgs[msgs.length - 1].content === 'new question',
        `first=${msgs[0].content} last=${msgs[msgs.length - 1].content}`);
      t('history roles preserved (user/assistant)',
        msgs.slice(0, 4).every((m) => m.role === 'user' || m.role === 'assistant'));
    }

    // B4. Developer password masked in persisted history only.
    {
      const { engine, clientCalls } = makeEngine();
      const res = await engine.respond({ message: '/developer unlock MyPw999', sessionId: 'ce-mask', locale: 'en' });
      const stored = tempStore.getSessionHistory('ce-mask', 10);
      const userRec = stored.find((r) => r.role === 'user');
      t('persisted user turn masks the developer password',
        Boolean(userRec) && userRec!.content.includes('/developer unlock ****') && !userRec!.content.includes('MyPw999'),
        `content=${JSON.stringify(userRec?.content)}`);
      t('assistant turn persisted alongside the masked user turn',
        stored.some((r) => r.role === 'assistant' && r.content === 'LLM-ANSWER'));
      t('client still received the raw message (masking is persistence-only)',
        clientCalls[0].messages.some((m: any) => m.content === '/developer unlock MyPw999'));
      t('system instruction untouched by masking (no ****)', !(res && String(clientCalls[0].options.systemInstruction).includes('****')));
    }

    // B5. LLM failure propagates cleanly; nothing is persisted.
    {
      const engine = new ChatEngine();
      (engine as any).client.generateContent = async () => {
        throw new Error('provider 500');
      };
      const err = await expectThrowsAsync(() => engine.respond({ message: 'boom', sessionId: 'ce-fail', locale: 'en' }));
      t('LLM failure surfaces as a thrown error', err !== null && err.message === 'provider 500');
      t('no turns persisted when the LLM call fails', tempStore.getSessionHistory('ce-fail', 50).length === 0);
    }

    // B6. KB retrieval failure is non-fatal.
    {
      const engine = new ChatEngine();
      const sysSeen: string[] = [];
      (engine as any).client.generateContent = async (_m: string, _msgs: unknown[], options: any) => {
        sysSeen.push(options.systemInstruction);
        return 'ok';
      };
      (engine as any).kbConnector.search = async () => {
        throw new Error('kb offline');
      };
      const res = await engine.respond({ message: 'q', sessionId: 'ce-kbfail', locale: 'en' });
      t('KB failure does not break respond()', res.text === 'ok');
      t('instruction omits KB context when the KB is down', !sysSeen[0].includes('KB-CONTEXT-MARKER'));
      t('SystemContext still present on KB failure', sysSeen[0].includes(SystemContext.build()));
    }

    // B7. History load failure is non-fatal (empty history, no crash).
    {
      const engine = new ChatEngine();
      const msgsSeen: number[] = [];
      (engine as any).client.generateContent = async (_m: string, msgs: any[]) => {
        msgsSeen.push(msgs.length);
        return 'ok';
      };
      const realGet = tempStore.getSessionHistory.bind(tempStore);
      (tempStore as any).getSessionHistory = () => {
        throw new Error('db locked');
      };
      try {
        await engine.respond({ message: 'again', sessionId: 'ce-histfail', locale: 'en' });
        t('history load failure → only the new user message is sent', msgsSeen[0] === 1, `msgs=${msgsSeen[0]}`);
      } finally {
        (tempStore as any).getSessionHistory = realGet;
      }
    }

    // B8. useHistory/useKnowledgeBase flags disable the features.
    {
      const { engine, clientCalls, kbCalls } = makeEngine();
      const res = await engine.respond({ message: 'flagged', sessionId: 'ce-flags', locale: 'en', useHistory: false, useKnowledgeBase: false });
      t('useHistory=false → history context empty', clientCalls[0].messages.length === 1);
      t('useKnowledgeBase=false → no KB search', kbCalls.length === 0);
      t('flagged respond still returns the answer', res.text === 'LLM-ANSWER' && clientCalls.length === 1);
    }

    // B9. resolveSystemInstruction composition.
    {
      const engine = new ChatEngine();
      const sys = engine.resolveSystemInstruction();
      t('resolveSystemInstruction applies locale policy + rules',
        sys.includes(LOCALE_POLICY.systemInstructionSuffix) && sys.includes(rulesEngine.compileRulesInstruction()));
    }
  } finally {
    (ChatHistoryStore as any).getInstance = origGetInstance;
    if (origPassword === undefined) delete process.env.EVADEV_PASSWORD;
    else process.env.EVADEV_PASSWORD = origPassword;
    DeveloperMode.resetAll();
    try {
      fs.rmSync(tmpDb, { force: true });
    } catch {
      // temp cleanup best-effort
    }
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Telegram deep tests: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------------------------------\n');
  return failed === 0;
}

type SttResultLike = SttResult;

export { runTelegramDeepTests };
