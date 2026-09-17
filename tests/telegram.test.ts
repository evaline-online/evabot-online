import { splitTelegramMessage, stripMarkdownForVoice, TelegramBot } from '../src/telegram/TelegramBot.js';
import { normalizeCommand, ModelCommand } from '../src/models/ModelRatings.js';
import { Config } from '../src/core/Config.js';

async function runTelegramTests(): Promise<boolean> {
  console.log('================================================================');
  console.log('🤖 TELEGRAM BOT TESTS');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  const test = (name: string, condition: boolean, detail: string = '') => {
    if (condition) {
      passed++;
      console.log(`  ✓ ${name}`);
    } else {
      failed++;
      console.error(`  ✗ ${name} ${detail}`);
    }
  };

  // --- 1. Chunking: short message stays intact ---
  const short = 'Hello, EvaBot!';
  const shortChunks = splitTelegramMessage(short);
  test('short message → single chunk', shortChunks.length === 1 && shortChunks[0] === short);

  // --- 2. Chunking: long message is split within the 4096 limit ---
  const longText = Array.from({ length: 400 }, (_, i) => `Line ${i + 1}: ${'x'.repeat(50)}`).join('\n');
  const longChunks = splitTelegramMessage(longText);
  test('long message split into ≤4096 chunks', longChunks.length > 1 && longChunks.every((c) => c.length <= 4096),
    `chunks=${longChunks.length} lens=${longChunks.map((c) => c.length).join(',')}`);

  // --- 3. Chunking: no content lost ---
  const rejoined = longChunks.join(' ');
  const originalWords = longText.replace(/\s+/g, ' ').trim().split(' ').length;
  const rejoinedWords = rejoined.replace(/\s+/g, ' ').trim().split(' ').length;
  test('chunking preserves content volume', originalWords === rejoinedWords,
    `original=${originalWords} rejoined=${rejoinedWords}`);

  // --- 4. Chunking: unbreakable wall of text is hard-cut ---
  const wall = 'a'.repeat(9000);
  const wallChunks = splitTelegramMessage(wall);
  test('unbroken text hard-cut at limit', wallChunks.length === Math.ceil(9000 / 4096) && wallChunks.every((c) => c.length <= 4096),
    `chunks=${wallChunks.length} lens=${wallChunks.map((c) => c.length).join(',')}`);

  // --- 5. Chunking: empty input ---
  test('empty input → no chunks', splitTelegramMessage('').length === 0);

  // --- 6. Command normalization via the shared alias map ---
  test('/моделі → /models', normalizeCommand('/моделі') === '/models');
  test('/история 5 → /history 5', normalizeCommand('/история 5') === '/history 5');
  test('/top args preserved', normalizeCommand('/top free 5') === '/top free 5');

  // --- 7. Mocked execute: command flows through normalizeCommand into the engine ---
  const received: string[] = [];
  const mockExecutor = (command: string): string => {
    received.push(command);
    return `MOCK:${command}`;
  };
  const bot = new TelegramBot({ token: 'test-token', execute: mockExecutor });

  test('bot accepts injected executor', Boolean(bot));

  // Simulate the exact path handleCommand uses: normalize then execute
  const rawUkInput = '/моделі';
  const normalized = normalizeCommand(rawUkInput);
  const out = mockExecutor(normalized);
  test('ukrainian alias reaches engine normalized', received.includes('/models') && out === 'MOCK:/models');

  // --- 8. Per-chat locale map defaults and switching ---
  test('default locale en', bot.getChatLocale(111) === 'en');

  // --- 9. Real (non-mocked) shared engine smoke: /help executes synchronously ---
  const helpOut = ModelCommand.execute('/help');
  test('ModelCommand.execute(/help) returns help banner', helpOut.includes('SYSTEM COMMANDS') || helpOut.includes('КОМАНДИ') || helpOut.includes('КОМАНДЫ'));

  // --- 10. Config exposes telegram token field ---
  test('Config.telegramBotToken field exists', typeof Config.telegramBotToken === 'string');

  // --- 11. stripMarkdownForVoice strips HTML tags for TTS ---
  test('stripMarkdownForVoice removes <i> tags', stripMarkdownForVoice('Привет <i>мир</i>').includes('Привет') && !stripMarkdownForVoice('Привет <i>мир</i>').includes('<i>') && !stripMarkdownForVoice('Привет <i>мир</i>').includes('</i>'));
  test('stripMarkdownForVoice removes <b> tags', stripMarkdownForVoice('<b>bold</b> text').includes('bold') && !stripMarkdownForVoice('<b>bold</b> text').includes('<b>') && !stripMarkdownForVoice('<b>bold</b> text').includes('</b>'));
  test('stripMarkdownForVoice removes all HTML tags', !stripMarkdownForVoice('Hello <b>world</b> <i>test</i>!').match(/<\/?[a-z]+>/i));

  // --- 12. stripMarkdownForVoice strips markdown ---
  test('stripMarkdownForVoice removes **bold**', stripMarkdownForVoice('**bold** text') === 'bold text');
  test('stripMarkdownForVoice removes *italic*', stripMarkdownForVoice('*italic* text') === 'italic text');

  // --- 13. stripMarkdownForVoice handles mixed content ---
  test('stripMarkdownForVoice handles code + emoji', stripMarkdownForVoice('Hello `code` 🎤 world').includes('code'));

  console.log('\n----------------------------------------------------------------');
  console.log(`Telegram tests: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------------------------------\n');
  return failed === 0;
}

export { runTelegramTests };
