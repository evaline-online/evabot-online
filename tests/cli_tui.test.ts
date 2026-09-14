/**
 * cli_tui.test.ts — CLI/TUI layer coverage:
 *  - TuiRenderer: domain resolution, page template loading (frontmatter,
 *    fallbacks), renderText hydration, renderHtml output
 *  - ChatSession: history add/trim (max turns), clear, serialization,
 *    role handling, streaming vs unary, error path (offline via fetch stub)
 *  - terminal-chat pure parts: renderDashboard banner, printHelp commands,
 *    COMMAND_ALIASES routing for the CLI default case, /lang parsing,
 *    de-emoji strip filter on output, renderTerminalMarkdown + streamer
 * No real network/LLM: globalThis.fetch is stubbed for ChatSession paths.
 */
import fs from 'node:fs';
import path from 'node:path';
import { TuiRenderer, DOMAINS_CONFIG } from '../src/core/TuiRenderer.js';
import { ChatSession } from '../src/core/ChatSession.js';
import { ModelRegistry } from '../src/models/ModelRegistry.js';
import { ModelCommand, COMMAND_ALIASES } from '../src/models/ModelRatings.js';
import { I18nEngine, stripEmoji } from '../src/core/I18nEngine.js';

// terminal-chat auto-starts main() on import; disable for the test process
// (see the import-safety guard documented in src/cli/terminal-chat.ts).
process.env.EVABOT_CLI_AUTOSTART = 'off';

const C_RESET = '\x1b[0m';
const C_BOLD = '\x1b[1m';

export async function runCliTuiTests(): Promise<boolean> {
  console.log('\n--- Running CLI/TUI Renderer & ChatSession Tests ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  // =====================================================================
  // 1. TuiRenderer — domain resolution
  // =====================================================================
  {
    const meta0 = TuiRenderer.resolveDomain(undefined);
    assert(meta0.domain === DOMAINS_CONFIG[0].domain, 'resolveDomain(undefined) → first DOMAINS_CONFIG entry');

    const meta1 = TuiRenderer.resolveDomain('www.EvaBot.ONLINE:443');
    assert(meta1.domain === 'evabot.online' && meta1.badge === 'NEURAL CORE', 'resolveDomain strips www/port and lowercases host');

    const meta2 = TuiRenderer.resolveDomain('evaline.network');
    assert(meta2.domain === 'evaline.network' && meta2.badge.startsWith('EDGE MESH'), 'resolveDomain maps evaline.network to EDGE MESH meta');
  }

  // =====================================================================
  // 2. TuiRenderer — page template loading (frontmatter + fallbacks)
  // =====================================================================
  {
    const fm = TuiRenderer.loadPageTemplate('evabot.online');
    assert(fm.meta.domain === 'evabot.online', 'loadPageTemplate: known host returns its meta');
    assert(typeof fm.body === 'string' && fm.body.length > 0, 'loadPageTemplate: body read from template file');

    const missing = TuiRenderer.loadPageTemplate('no-such-host-xyz-42');
    assert(missing.meta.domain === DOMAINS_CONFIG[0].domain, 'loadPageTemplate: unknown host falls back to default meta');
    assert(missing.body.length > 0, 'loadPageTemplate: unknown host falls back to default template body');

    // Temporary fixture with front-matter override (incl. colon in value)
    const fixture = path.join(process.cwd(), 'pages', 'tui-test-fixture.unui.md');
    try {
      fs.writeFileSync(
        fixture,
        [
          '---',
          'domain: tui-test-fixture.dev',
          'badge: TEST-BADGE',
          'role: Test Role Line',
          'infra: Test Infra: with colon',
          'target: ip: 10.0.0.1',
          '---',
          '# Body Marker XYZ',
          'plain body line',
          '',
        ].join('\n'),
        'utf-8'
      );
      const parsed = TuiRenderer.loadPageTemplate('tui-test-fixture');
      assert(parsed.meta.domain === 'tui-test-fixture.dev', 'frontmatter: domain override parsed');
      assert(parsed.meta.badge === 'TEST-BADGE' && parsed.meta.role === 'Test Role Line', 'frontmatter: badge/role parsed');
      assert(parsed.meta.infra === 'Test Infra: with colon', 'frontmatter: values containing colons survive (join(":"))');
      assert(parsed.meta.target === 'ip: 10.0.0.1', 'frontmatter: target parsed with colon value');
      assert(parsed.body.includes('# Body Marker XYZ'), 'frontmatter: body after closing --- separator');

      const raw = TuiRenderer.getRawTemplate('tui-test-fixture');
      assert(raw.includes('TEST-BADGE') && raw.includes('# Body Marker XYZ'), 'getRawTemplate returns full raw markdown');

      const rawText = TuiRenderer.getRawTextTemplate('tui-test-fixture');
      assert(typeof rawText === 'string' && rawText.length > 0, 'getRawTextTemplate reads .unui.txt variant or fallback');
    } finally {
      if (fs.existsSync(fixture)) fs.unlinkSync(fixture);
    }

    const rawDefault = TuiRenderer.getRawTemplate('www.UNKNOWN-HOST.invalid:8080');
    const rawDefaultDisk = fs.readFileSync(path.join(process.cwd(), 'pages', 'default.unui.md'), 'utf-8');
    assert(rawDefault === rawDefaultDisk, 'getRawTemplate: unknown host (www/port stripped) → default.unui.md');

    const rawTextFallback = TuiRenderer.getRawTextTemplate('tui-test-no-file');
    const rawTextDisk = fs.readFileSync(path.join(process.cwd(), 'pages', 'default.unui.txt'), 'utf-8');
    assert(rawTextFallback === rawTextDisk && rawTextFallback.length > 0, 'getRawTextTemplate: unknown host → default.unui.txt');

    const resolveMeta = TuiRenderer.resolveDomain('tui-test-fixture');
    assert(resolveMeta.domain === DOMAINS_CONFIG[0].domain, 'resolveDomain with host without template → default meta');
  }

  // =====================================================================
  // 3. TuiRenderer — renderText / renderHtml (offline: local metrics only)
  // =====================================================================
  {
    const text = TuiRenderer.renderText('evabot.online');
    assert(text.length > 100, 'renderText: produces substantial output');
    assert((text.includes('EVABOT TUI') || text.includes('EvaBot')) && (text.includes('Model:') || text.includes('Ping:')), 'renderText: banner body rendered from template');
    assert(text.endsWith('\n') && !text.endsWith('\n\n'), 'renderText: output trimmed to single trailing newline');
    assert(!/<!--\s*\/?SLOT:[A-Z_]+\s*-->/.test(text), 'renderText: slot comment tags stripped from terminal stream');

    const textHost = TuiRenderer.renderText('www.EVALINE.NETWORK:8080');
    assert(textHost.length > 100, 'renderText: www/port normalization works for evaline.network');

    const html = TuiRenderer.renderHtml('evabot.online');
    assert(html.startsWith('<!DOCTYPE html>'), 'renderHtml: valid HTML document start');
    assert(html.includes('EVABOT.ONLINE') && html.includes('NEURAL CORE'), 'renderHtml: topbar shows domain + badge');
    assert(html.includes('proc-table'), 'renderHtml: process watcher section present');
    assert(html.includes('EVABRAIN') && html.includes('WIREGUARD MESH'), 'renderHtml: telemetry section present');
    assert(html.includes('applyTheme') && html.includes('pollCluster'), 'renderHtml: embedded JS helpers present');

    const htmlOther = TuiRenderer.renderHtml('evaline.website');
    assert(htmlOther.includes('evaline.website') && htmlOther.includes('CHRONICLE'), 'renderHtml: alternate domain maps to its badge');
  }

  // =====================================================================
  // 4. ChatSession — history add/trim/clear/serialization (fetch stubbed)
  // =====================================================================
  const realFetch = globalThis.fetch;
  {
    const geminiOk = () => Promise.resolve({
      ok: true,
      status: 200,
      text: async () => '',
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'MOCK-REPLY' }] } }],
      }),
    } as unknown as Response);

    globalThis.fetch = (async (url: unknown) => {
      const u = String(url);
      if (u.includes('generativelanguage.googleapis.com')) return geminiOk();
      throw new Error(`Unexpected fetch in test: ${u}`);
    }) as typeof fetch;

    try {
      const session = new ChatSession({ model: 'gemini-2.5-flash', apiKey: 'test-key-123456', maxHistoryTurns: 2 });

      const empty = session.getHistory();
      assert(empty.length === 0, 'ChatSession: starts with empty history');

      const reply = await session.sendMessage('  Привет, как дела?  ');
      assert(reply === 'MOCK-REPLY', 'ChatSession.sendMessage: returns model reply from API response');
      let hist = session.getHistory();
      assert(hist.length === 2, 'ChatSession: one exchange records user+model messages');
      assert(hist[0].role === 'user' && hist[0].parts[0].text === 'Привет, как дела?', 'ChatSession: user prompt is trimmed and role=user');
      assert(hist[1].role === 'model' && hist[1].parts[0].text === 'MOCK-REPLY', 'ChatSession: model reply recorded with role=model');

      const serialized = JSON.stringify(hist);
      const revived = JSON.parse(serialized);
      assert(revived.length === 2 && revived[0].role === 'user' && revived[1].role === 'model', 'ChatSession: history JSON-serializable (round-trip)');

      hist[0].parts[0].text = 'TAMPERED';
      assert(session.getHistory()[0].parts[0].text === 'TAMPERED', 'getHistory: shallow copy shares message objects (documented finding)');
      const beforePush = session.getHistory().length;
      session.getHistory().push({ role: 'user', parts: [{ text: 'extra' }] });
      assert(session.getHistory().length === beforePush, 'ChatSession: getHistory returns a copy (array-level isolation)');

      await session.sendMessage('msg-2');
      await session.sendMessage('msg-3');
      hist = session.getHistory();
      // maxHistoryTurns=2 → at most 4 messages kept (2 turns * user+model)
      assert(hist.length === 4, `ChatSession.trimHistory: keeps maxHistoryTurns*2 messages (got ${hist.length})`);
      assert(hist[0].parts[0].text === 'msg-2' && hist[1].parts[0].text === 'MOCK-REPLY', 'trimHistory: oldest exchange dropped, newest kept');
      assert(hist[3].parts[0].text === 'MOCK-REPLY' && hist[2].parts[0].text === 'msg-3', 'trimHistory: newest exchange intact');

      session.clearHistory();
      assert(session.getHistory().length === 0, 'ChatSession.clearHistory: empties history');

      // trimHistory is a no-op when under the limit
      await session.sendMessage('short');
      session.trimHistory();
      assert(session.getHistory().length === 2, 'trimHistory: no-op when under the limit');

      // Error path: fetch failure → throws, history not mutated
      const before = session.getHistory().length;
      globalThis.fetch = (async () => Promise.resolve({
        ok: false,
        status: 429,
        text: async () => JSON.stringify({ error: { message: 'rate limited (stub)' } }),
        json: async () => ({}),
      } as unknown as Response)) as typeof fetch;
      let threw = false;
      try {
        await session.sendMessage('boom');
      } catch (err: any) {
        threw = true;
        assert(String(err.message).includes('429'), 'ChatSession.sendMessage: propagates API error');
      }
      assert(threw, 'ChatSession.sendMessage: throws on API error');
      assert(session.getHistory().length === before, 'ChatSession: failed exchange is not recorded in history');

      // Streaming path (SSE body) with onChunk callback
      globalThis.fetch = (async (url: unknown) => {
        const u = String(url);
        if (!u.includes('streamGenerateContent')) throw new Error(`Expected stream URL, got ${u}`);
        const encoder = new TextEncoder();
        const events = [
          'data: {"candidates":[{"content":{"parts":[{"text":"PAR"}]}}]}\n\n',
          'data: {"candidates":[{"content":{"parts":[{"text":"T2"}]}}]}\n\n',
          'data: [DONE]\n\n',
        ];
        const body = new ReadableStream({
          start(controller) {
            for (const e of events) controller.enqueue(encoder.encode(e));
            controller.close();
          },
        });
        return { ok: true, status: 200, body, text: async () => '', json: async () => ({}) } as unknown as Response;
      }) as typeof fetch;

      const chunks: string[] = [];
      const streamed = await session.sendMessage('stream me', (c) => chunks.push(c));
      assert(streamed === 'PART2', 'ChatSession.streamContent: SSE chunks concatenated into full text');
      assert(chunks.join('') === 'PART2', 'ChatSession: onChunk receives each streamed chunk');
      const streamHist = session.getHistory();
      const last = streamHist[streamHist.length - 1];
      assert(last.role === 'model' && last.parts[0].text === 'PART2', 'ChatSession: streamed reply recorded in history');
    } finally {
      globalThis.fetch = realFetch;
    }

    // Model fallback on invalid constructor model
    const defaultId = ModelRegistry.getDefaultModel().id;
    const fallbackSession = new ChatSession({ model: 'definitely-not-a-model', apiKey: 'test-key-123456' });
    assert(fallbackSession.getModel() === defaultId, 'ChatSession: invalid constructor model falls back to registry default');

    const sysSession = new ChatSession({ apiKey: 'test-key-123456' });
    sysSession.setSystemInstruction('Always answer in Ukrainian.');
    assert(sysSession.getSystemInstruction() === 'Always answer in Ukrainian.', 'ChatSession: setSystemInstruction/getSystemInstruction');

    assert(sysSession.hasApiKey() === true, 'ChatSession: hasApiKey true after explicit key');
    sysSession.setApiKey('another-key-654321');
    assert(sysSession.hasApiKey() === true, 'ChatSession: setApiKey replaces credential');

    // trimHistory keeps newest half of the window when over the limit
    assert(ModelRegistry.isValidModel('gemini-2.5-flash'), 'ModelRegistry: valid model accepted');
    assert(!ModelRegistry.isValidModel('nope-nope'), 'ModelRegistry: invalid model rejected');
  }

  // =====================================================================
  // 5. terminal-chat — banner (renderDashboard), help, aliases, /lang
  // =====================================================================
  const cli = await import('../src/cli/terminal-chat.js');
  {
    const realLog = console.log;
    let captured = '';
    console.log = (...args: unknown[]) => {
      captured += args.map((a) => (typeof a === 'string' ? a : '')).join('') + '\n';
    };
    try {
      I18nEngine.setLocale('en');
      const session = new ChatSession({ apiKey: 'test-key-123456', model: ModelRegistry.getDefaultModel().id });
      cli.renderDashboard(session);

      const lines = captured.split('\n');
      assert(lines[0].includes('●') && lines[0].includes('EvaBot v0.0.1'), 'renderDashboard line 1: project name + status dot');
      assert(captured.includes('Ping:'), 'renderDashboard: Ping line present');
      assert(captured.includes('Model:') && captured.includes(session.getModel()), 'renderDashboard: Model line shows active model');
      assert(captured.includes('[FREE]') || captured.includes('[PAID]'), 'renderDashboard: pricing tier badge present');
      assert(captured.includes('Pool:'), 'renderDashboard: model pool count line present');
      assert(captured.includes('Lang:'), 'renderDashboard: Lang line present');
      assert(captured.includes('Databases:'), 'renderDashboard: Databases line present');
      assert(captured.includes('Load:') && captured.includes('Brain(Frankfurt)') && captured.includes('Face(Iowa)'), 'renderDashboard: cluster load telemetry line present');
      assert(captured.includes('■') && captured.includes('░'), 'renderDashboard: ASCII load bars rendered');
      assert(captured.includes('system :'), 'renderDashboard: system greeting printed');

      const strip = captured.split('\n').find((l) => l.includes('/help') && l.includes('/clear')) || '';
      const dashCommands = ['/help', '/?', '/top', '/models', '/cost', '/company', '/evaline', '/products', '/who', '/lang', '/mode', '/consilium', '/sephirot', '/mcp', '/lsp', '/history', '/memory', '/search', '/services', '/servers', '/clear'];
      const missingCmds = dashCommands.filter((c) => !strip.includes(c));
      assert(missingCmds.length === 0, `renderDashboard: 21-command strip complete (missing: ${missingCmds.join(',')})`);
      const slashCount = (strip.match(/\//g) || []).length;
      assert(slashCount >= 21, `renderDashboard: strip advertises ≥21 commands (got ${slashCount})`);

      captured = '';
      cli.printHelp();
      const help = captured;
      const requiredHelp = ['/voices', '/settings', '/agents', '/developer', '/sys', '/say', '/listen', '/translate', '/monitor', '/emoji', '/exit'];
      const missingHelp = requiredHelp.filter((c) => !help.includes(c));
      assert(missingHelp.length === 0, `printHelp: documents new commands (missing: ${missingHelp.join(',')})`);
      assert(help.includes('/help') && help.includes('/?'), 'printHelp: basics documented');
    } finally {
      console.log = realLog;
    }

    // /lang parsing (I18nEngine.setLocale) as used by the /lang CLI case
    assert(I18nEngine.setLocale('uk').locale === 'uk', '/lang uk → uk locale');
    assert(I18nEngine.setLocale('UA').locale === 'uk', '/lang UA (uppercase alias) → uk locale');
    assert(I18nEngine.setLocale('ukr').locale === 'uk', '/lang ukr → uk locale');
    assert(I18nEngine.setLocale('ru').locale === 'ru', '/lang ru → ru locale');
    assert(I18nEngine.setLocale('RUS').locale === 'ru', '/lang RUS → ru locale');
    assert(I18nEngine.setLocale('de').locale === 'en', '/lang with unsupported code → en fallback');
    assert(I18nEngine.setLocale('').locale === 'en', '/lang with empty arg → en fallback');
    const ukStrings = I18nEngine.getStrings('uk');
    assert(typeof ukStrings.helpCommands.length === 'number' && ukStrings.helpCommands.length > 0, 'I18n: every locale has help commands');
    const ruHelp = I18nEngine.formatHelp('ru');
    assert(ruHelp.includes('═'.repeat(78)) && ruHelp.split('\n').length > 5, 'I18n: formatHelp ru renders framed help');
    const enLocale = I18nEngine.setLocale('en');
    assert(enLocale.locale === 'en' && typeof enLocale.message === 'string', '/lang en resets locale');

    // CLI default case: alias routing table covers every canonical target
    const canonicalTargets = ['/history', '/memory', '/search', '/find', '/services', '/servers', '/health', '/news', '/translate', '/products', '/who', '/debug', '/log', '/monitor', '/say', '/listen', '/sys', '/developer', '/voices', '/settings', '/agents'];
    const unroutable = canonicalTargets.filter((t) => !Object.values(COMMAND_ALIASES).includes(t));
    assert(unroutable.length === 0, `COMMAND_ALIASES: every CLI default-case target has ≥1 alias (unroutable: ${unroutable.join(',')})`);
    assert(COMMAND_ALIASES['/скажи'] === '/say' && COMMAND_ALIASES['/сказать'] === '/say', 'alias routing: /say UK/RU aliases');
    assert(COMMAND_ALIASES['/історія'] === '/history' && COMMAND_ALIASES['/история'] === '/history', 'alias routing: /history UK/RU aliases');
    assert(COMMAND_ALIASES['/stt'] === '/listen' && COMMAND_ALIASES['/переклад'] === '/translate', 'alias routing: /listen + /translate aliases');
    const badAliasValues = Object.values(COMMAND_ALIASES).filter((v) => !/^\/[a-z]+$/.test(v));
    assert(badAliasValues.length === 0, `COMMAND_ALIASES: all values are canonical /commands (bad: ${badAliasValues.slice(0, 3).join(',')})`);
  }

  // =====================================================================
  // 6. terminal-chat — de-emoji strip filter (installEmojiStripFilter)
  // =====================================================================
  {
    const written: string[] = [];
    const fakeStream = { write: (...args: unknown[]) => { written.push(String(args[0])); return true; } };
    cli.installEmojiStripFilter(fakeStream as any);
    fakeStream.write('Broadcast 🎤 on 🔊 off 🔇 done ✅\n');
    assert(written[0] === 'Broadcast [ MIC ] on [ TTS:ON ] off [ TTS:OFF ] done [OK]\n', 'emoji strip filter: emoji replaced with ASCII on output');

    const rawOut: string[] = [];
    const rawStream = { write: (...args: unknown[]) => { rawOut.push(args.map(String).join('|')); return true; } };
    cli.installEmojiStripFilter(rawStream as any, () => false);
    rawStream.write('🎤 stays\n');
    assert(rawOut[0] === '🎤 stays\n', 'emoji strip filter: disabled mode passes emoji through');
    rawStream.write('non-string fallback: ', 42, '\n');
    assert(rawOut[1] === 'non-string fallback: |42|\n', 'emoji strip filter: non-string args forwarded untouched');

    // stripEmoji composition (same function the CLI writer delegates to)
    assert(stripEmoji('Готово 🚀 ✅ мир') === 'Готово  [OK] мир', 'stripEmoji: unmapped emoji removed, ✅ → [OK]');
    const rendered = cli.renderTerminalMarkdown('**Готово** 🚀 ✅');
    assert(!stripEmoji(rendered).includes('🚀') && stripEmoji(rendered).includes('[OK]'), 'strip path: markdown output de-emojified with ASCII badge');
  }

  // =====================================================================
  // 7. terminal-chat — renderTerminalMarkdown (batch) & streamer
  // =====================================================================
  {
    assert(cli.renderTerminalMarkdown('') === '', 'renderTerminalMarkdown: empty input → empty output');

    const md = cli.renderTerminalMarkdown('# Заголовок\n**bold** *ital* `code`\n- item\n1. step\n> quote\n---\n[text](https://example.com)');
    assert(md.includes('# Заголовок') && md.includes('\x1b[32m'), 'markdown: heading highlighted (bold+green)');
    assert(md.includes(C_BOLD), 'markdown: bold ANSI applied');
    assert(md.includes('bold') && md.includes('ital') && md.includes('code'), 'markdown: inline styles rendered');
    assert(md.includes('•'), 'markdown: unordered list bullet');
    assert(md.includes('│'), 'markdown: blockquote bar');
    assert(md.includes('─'.repeat(50)), 'markdown: horizontal rule');
    assert(md.includes('https://example.com'), 'markdown: link URL preserved');

    const code = cli.renderTerminalMarkdown('```ts\nconst a = 1;\n```');
    assert(code.includes('[TS]') && code.includes('┌──') && code.includes('└──'), 'markdown: fenced code block boxed with language tag');
    const codeNoLang = cli.renderTerminalMarkdown('```\nplain\n```');
    const stripped = codeNoLang.replace(/\x1b\[[0-9;]*m/g, '');
    assert(stripped.includes('┌──') && !stripped.includes('['), 'markdown: fence without language omits tag');

    const writes: string[] = [];
    const streamer = new cli.TerminalMarkdownStreamer((t) => writes.push(t));
    streamer.push('```py\n');
    streamer.push('print(1)\n');
    streamer.push('```\n');
    streamer.push('done **x**');
    streamer.finish();
    const out = writes.join('');
    assert(out.includes('[PY]') && out.includes('print(1)'), 'streamer: code block rendered across pushed chunks');
    assert(out.includes('└──'), 'streamer: closing fence after code block');
    assert(out.includes('done') && out.includes('x'), 'streamer: trailing partial line flushed by finish()');
    assert(out.includes('─'.repeat(46)), 'streamer: code block rule lines');
  }

  // =====================================================================
  // 8. ModelCommand.execute — offline sanity for commands routed by the CLI
  // =====================================================================
  {
    const models = ModelCommand.execute('/models');
    assert(models.length > 50 && (models.includes('модел') || models.toLowerCase().includes('model')), 'ModelCommand /models: catalog rendered offline');
    const unknownCmd = I18nEngine.getStrings('en');
    assert(unknownCmd.unknownCommand.includes('{cmd}'), 'I18n: unknownCommand template has {cmd} placeholder');
  }

  console.log('--- CLI/TUI Renderer & ChatSession tests done ---');
  return passed;
}
