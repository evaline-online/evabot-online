import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { ModelCommand, normalizeCommand, COMMAND_ALIASES } from '../src/models/ModelRatings.js';
import { ChatHistoryStore } from '../src/core/ChatHistoryStore.js';
import { AccountingEngine, CapitalExpenses } from '../src/core/AccountingEngine.js';
import { I18nEngine } from '../src/core/I18nEngine.js';

export function runCommandsAndHistoryTests(): boolean {
  console.log('\n--- Running Command Aliases, ChatHistoryStore & CapitalExpenses Tests ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  // 1. Command alias normalization
  const aliasCases: Array<[string, string, string]> = [
    ['/історія', '/history', 'UK /історія → /history'],
    ['/история', '/history', 'RU /история → /history'],
    ['/hist', '/history', '/hist → /history'],
    ['/журнал', '/history', '/журнал → /history'],
    ['/пам\'ять', '/memory', "UK /пам'ять → /memory"],
    ['/пам’ять', '/memory', 'UK /пам’ять (curly) → /memory'],
    ['/пам`ять', '/memory', 'UK /пам`ять (backtick) → /memory'],
    ['/память', '/memory', 'RU /память → /memory'],
    ['/mem', '/memory', '/mem → /memory'],
    ['/памятка', '/memory', '/памятка → /memory'],
    ['/пошук', '/search', 'UK /пошук → /search'],
    ['/поиск', '/search', 'RU /поиск → /search'],
    ['/знайти', '/search', 'UK /знайти → /search'],
    ['/найти', '/search', 'RU /найти → /search'],
    ['/знайди', '/find', 'UK /знайди → /find'],
    ['/найди', '/find', 'RU /найди → /find'],
    ['/сервіси', '/services', 'UK /сервіси → /services'],
    ['/сервисы', '/services', 'RU /сервисы → /services'],
    ['/служби', '/services', 'UK /служби → /services'],
    ['/службы', '/services', 'RU /службы → /services'],
    ['/сервери', '/servers', 'UK /сервери → /servers'],
    ['/серверы', '/servers', 'RU /серверы → /servers'],
    ['/вми', '/servers', '/вми → /servers'],
    ['/vm', '/servers', '/vm → /servers'],
    ['/моделі', '/models', 'UK /моделі → /models'],
    ['/модели', '/models', 'RU /модели → /models'],
    ['/допомога', '/help', 'UK /допомога → /help'],
    ['/помощь', '/help', 'RU /помощь → /help'],
    ['/мова', '/lang', 'UK /мова → /lang'],
    ['/язык', '/lang', 'RU /язык → /lang'],
    ['/вартість', '/cost', 'UK /вартість → /cost'],
    ['/стоимость', '/cost', 'RU /стоимость → /cost'],
    ['/фінанси', '/cost', 'UK /фінанси → /cost'],
    ['/финансы', '/cost', 'RU /финансы → /cost'],
    ['/бюджет', '/cost', '/бюджет → /cost'],
    ['/бухгалтерія', '/cost', 'UK /бухгалтерія → /cost'],
    ['/бухгалтерия', '/cost', 'RU /бухгалтерия → /cost'],
    ['/очистити', '/clear', 'UK /очистити → /clear'],
    ['/очистить', '/clear', 'RU /очистить → /clear'],
    ['/очистка', '/clear', '/очистка → /clear'],
    ['/cls', '/clear', '/cls → /clear'],
    ['/про', '/about', 'UK/RU /про → /about'],
    ['/про-бота', '/about', '/про-бота → /about'],
    ['/режим', '/mode', 'UK/RU /режим → /mode'],
    ['/консилиум', '/consilium', 'RU /консилиум → /consilium'],
    ['/консиліум', '/consilium', 'UK /консиліум → /consilium'],
    ['/рада', '/consilium', 'UK /рада → /consilium'],
  ];

  for (const [input, expected, label] of aliasCases) {
    assert(normalizeCommand(input) === expected, label);
  }

  // Case-insensitivity, whitespace trimming and argument preservation
  assert(normalizeCommand('  /ПОШУК  gemini flash  ') === '/search gemini flash', 'Uppercase + spaces normalized, args preserved');
  assert(normalizeCommand('/TOP free') === '/top free', 'Existing commands still normalize args');
  assert(Object.keys(COMMAND_ALIASES).length >= 30, `COMMAND_ALIASES map is populated (${Object.keys(COMMAND_ALIASES).length} aliases)`);

  // Alias-backed command execution smoke tests
  const costCmdUk = ModelCommand.execute('/вартість');
  assert(costCmdUk.includes('COST LEDGER'), 'UK /вартість executes /cost (AccountingEngine report)');

  const helpCmdRu = ModelCommand.execute('/помощь');
  assert(typeof helpCmdRu === 'string' && helpCmdRu.includes('COMMANDS'), 'RU /помощь executes /help');
  const ruHelp = I18nEngine.formatHelp('ru');
  assert(ruHelp.includes('СИСТЕМНЫЕ КОМАНДЫ'), 'RU help lists the command set');
  assert(ruHelp.includes('/history'), 'Help lists the new /history command');
  assert(ruHelp.includes('/servers'), 'Help lists the new /servers command');
  assert(ruHelp.includes('/about'), 'Help lists the new /about command');

  const aboutCmd = ModelCommand.execute('/about');
  assert(aboutCmd.includes('EVABOT ONLINE') && aboutCmd.includes('evabot-agent-server'), '/about renders project passport');

  const modeCmd = ModelCommand.execute('/mode');
  assert(modeCmd.includes('OPERATIONAL') || modeCmd.includes('ОПЕРАЦІЙНІ') || modeCmd.includes('ОПЕРАЦИОННЫЕ'), '/mode lists operational modes');

  const consiliumCmd = ModelCommand.execute('/consilium');
  assert(consiliumCmd.includes('CONSILIUM') || consiliumCmd.includes('КОНСИЛІУМ') || consiliumCmd.includes('КОНСИЛИУМ'), '/consilium renders consilium usage');

  const clearCmd = ModelCommand.execute('/clear');
  assert(clearCmd.includes('[OK]'), '/clear executes clear command');

  // 2. ChatHistoryStore (temp DB path)
  const tmpDb = path.join(os.tmpdir(), `evabot-chat-test-${Date.now()}-${Math.floor(Math.random() * 100000)}.db`);
  const store = ChatHistoryStore.getInstance(tmpDb);
  assert(store.isReady(), `ChatHistoryStore opens a temp DB (${tmpDb})`);

  const id1 = store.appendMessage({ sessionId: 'session-a', role: 'user', content: 'Какая модель лучше для кодинга?', model: 'gemini-3.8-flash', lang: 'ru' });
  const id2 = store.appendMessage({ sessionId: 'session-a', role: 'assistant', content: 'Gemini 3.8 Flash — новейшая frontier модель с 1M контекстом.', model: 'gemini-3.8-flash', lang: 'ru' });
  const id3 = store.appendMessage({ sessionId: 'session-b', role: 'user', content: 'Яка модель найкраща для кодування Qwen або DeepSeek?', model: 'qwen-2.5-coder', lang: 'uk' });
  const id4 = store.appendMessage({ sessionId: 'consilium', role: 'assistant', content: 'Consilium synthesis: рекомендуємо Gemini 3.1 Pro для планування.', model: 'consilium', lang: 'en' });
  assert(id1 !== null && id2 !== null && id3 !== null && id4 !== null, 'appendMessage returns row ids for all messages');

  const historyA = store.getSessionHistory('session-a', 10);
  assert(historyA.length === 2, `getSessionHistory returns session-a messages (found ${historyA.length})`);
  assert(historyA[0].role === 'user' && historyA[1].role === 'assistant', 'Session history is in chronological order');

  const recent = store.getRecentMessages(10);
  assert(recent.length === 4, `getRecentMessages spans all sessions (found ${recent.length})`);
  assert(recent[recent.length - 1].sessionId === 'consilium', 'Newest message across sessions is the consilium one');

  const found = store.searchMessages('модель');
  assert(found.length >= 2, `FTS5 search finds messages by keyword (found ${found.length})`);
  const notFound = store.searchMessages('supercalifragilisticword');
  assert(Array.isArray(notFound) && notFound.length === 0, 'FTS5 search returns empty array for non-matching query');

  const sessions = store.listSessions(10);
  assert(sessions.length === 3, `listSessions lists distinct sessions (found ${sessions.length})`);
  const consiliumSession = sessions.find((s) => s.sessionId === 'consilium');
  assert(Boolean(consiliumSession), 'consilium session is persisted and listed');

  const counts = store.countAll();
  assert(counts.totalMessages === 4, `countAll counts total messages (${counts.totalMessages})`);
  assert(counts.sessions === 3, `countAll counts distinct sessions (${counts.sessions})`);

  // Error resilience: fire-and-forget append must never throw
  let threw = false;
  try {
    (store as any).db = null;
    const fallback = store.appendMessage({ sessionId: 'x', role: 'user', content: 'broken db write' });
    assert(fallback === null, 'appendMessage returns null (not throw) when DB handle is broken');
    assert(store.countAll().totalMessages === 0 || Array.isArray(store.searchMessages('модель')), 'Reads degrade gracefully when DB handle is broken');
  } catch (e) {
    threw = true;
  }
  assert(!threw, 'No exception escapes ChatHistoryStore on DB failure');

  store.close();
  try { fs.unlinkSync(tmpDb); } catch (e) { /* temp cleanup best-effort */ }

  // 3. CapitalExpenses ledger
  const capitalTotal = CapitalExpenses.getTotalCapitalUSD();
  assert(capitalTotal === 1500, `Capital investments total is exactly $1500 (found $${capitalTotal})`);
  const ledger = CapitalExpenses.getCapitalExpenses();
  assert(ledger.length === 4, `Capital ledger has 4 entries (found ${ledger.length})`);
  assert(ledger[0].item.includes('evabot-agent-vm') && ledger[0].usd === 300, 'Ledger entry #1 is the GCP server plan ($300)');
  assert(ledger[3].item.includes('Pixel 10 Pro XL') && ledger[3].usd === 1000, 'Ledger entry #4 is the Pixel 10 Pro XL ($1000)');
  assert(ledger.every((e) => e.date === '2026-09-01'), 'All capital entries are dated 2026-09-01');

  const costReport = AccountingEngine.formatCostReport();
  assert(costReport.includes('CAPITAL INVESTMENTS'), 'Cost report contains the CAPITAL INVESTMENTS section');
  assert(costReport.includes('$1500.00'), 'Cost report shows the $1500 capital total');
  assert(costReport.includes('Pixel 10 Pro XL'), 'Cost report itemizes the Pixel 10 Pro XL');

  // /cost via alias renders the same capital section
  const costViaAlias = ModelCommand.execute('/фінанси');
  assert(costViaAlias.includes('CAPITAL INVESTMENTS'), 'UK /фінанси (alias of /cost) includes capital section');

  return passed;
}
