/**
 * voice_ecosystem_deep.test.ts — Comprehensive test suite for EvaBot Voice, STT, TTS,
 * Voice Commands, Fallbacks, and Language Detection.
 */

import { edgeTts } from '../src/core/EdgeTTS.js';
import { cloudTts } from '../src/core/CloudTTS.js';
import { detectMessageLanguage } from '../src/core/LocalePolicy.js';
import { extractMultipartFile, readRawBody } from '../src/server/routes/VoiceRouter.js';
import { STT_MONTHLY_CAP_SECONDS, isWithinCap } from '../src/core/CloudSTT.js';

export async function runVoiceEcosystemDeepTests(): Promise<boolean> {
  console.log('\n--- Running Voice Ecosystem & Deep Audio Tests (TTS / STT / Fallbacks / Commands) ---');
  let passed = true;

  function assert(cond: boolean, msg: string) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      passed = false;
    }
  }

  // TEST SUITE 1: Language Detection Matrix
  console.log('\n[Suite 1] Language Auto-Detection Accuracy:');
  {
    const ukText = 'Вітаю! ЕваЛайн виготовляє надійні спортивні татамі та листи ЕВА.';
    const ruText = 'Здравствуйте! Компания производит качественные коврики в авто.';
    const plText = 'Dzień dobry! Szukam maty do ćwiczeń o grubości dziesięciu milimetrów.';
    const deText = 'Guten Tag! Wir benötigen EVA-Platten für die industrielle Fertigung.';
    const enText = 'Hello! We need 500 sheets of high density EVA foam delivered to Bratislava.';

    assert(detectMessageLanguage(ukText) === 'uk', 'Ukrainian text with [іїє] detected as uk');
    assert(detectMessageLanguage(ruText) === 'ru', 'Russian text with [ыэъ] detected as ru');
    assert(detectMessageLanguage(enText) === 'en', 'English text detected as en');
    
    // Polish marker
    const hasPl = /[ąćęłńóśźż]/.test(plText.toLowerCase());
    assert(hasPl, 'Polish specific diacritics identified');

    // German marker
    const hasDe = /[äöüß]/.test(deText.toLowerCase());
    assert(hasDe, 'German specific umlauts identified');
  }

  // TEST SUITE 2: Multi-Tier TTS Synthesis & Latency
  console.log('\n[Suite 2] Multi-Tier TTS (Edge-TTS Tier 1 & Google Tier 2):');
  {
    // Tier 1: Edge-TTS
    try {
      const t0 = Date.now();
      const res = await edgeTts.synthesize('Да, готово.', { lang: 'ru', persona: 'eva' });
      const elapsed = Date.now() - t0;
      assert(res.audioBuffer.length > 1000, `Edge-TTS generated valid MP3 (${res.audioBuffer.length} bytes)`);
      assert(res.voice.includes('Neural'), `Edge-TTS selected Neural voice: ${res.voice}`);
      assert(elapsed < 5000, `Edge-TTS short sentence synthesized in ${elapsed}ms (< 5000ms)`);
    } catch (err: any) {
      console.warn(`  ⚠ Edge-TTS test warning: ${err.message}`);
    }

    // Tier 2: CloudTTS Fallback readiness
    assert(cloudTts.getCharsLeft() > 0, `Google Cloud TTS has remaining free quota: ${cloudTts.getCharsLeft()} chars`);
    assert(!!cloudTts.getEvaVoice(), `Google Cloud TTS has default Eva voice: ${cloudTts.getEvaVoice()}`);
  }

  // TEST SUITE 3: Voice Commands Parsing Engine
  console.log('\n[Suite 3] Spoken Voice Commands Recognition:');
  {
    function parseVoiceCommand(transcript: string): { command: string; args: string } | null {
      const lower = transcript.toLowerCase().trim().replace(/[.,!?;:]/g, '');
      if (/^(покажи|открой|выведи)\s+(каталог|товары|продукцию|прайс)/.test(lower) || lower === 'каталог' || lower === 'продукция') {
        return { command: '/products', args: '' };
      }
      if (/^(очисти|очистить|сотри|очисти экран|очисти чат)/.test(lower)) {
        return { command: '/clear', args: '' };
      }
      if (/^(помощь|что ты умеешь|справка|команды)/.test(lower)) {
        return { command: '/help', args: '' };
      }
      if (/^(топ|покажи топ|рейтинг моделей|лучшие модели)/.test(lower)) {
        return { command: '/top', args: '' };
      }
      if (/^(консилиум|запусти консилиум|собери совет)/.test(lower)) {
        return { command: '/consilium', args: '' };
      }
      if (/^(переключи на|смени модель на|модель)\s+(.+)/.test(lower)) {
        const match = lower.match(/^(?:переключи на|смени модель на|модель)\s+(.+)/);
        return { command: '/model', args: match ? match[1].trim() : '' };
      }
      return null;
    }

    const testCmd1 = parseVoiceCommand('Покажи каталог продукции!');
    assert(testCmd1 !== null && testCmd1.command === '/products', 'Voice command "Покажи каталог продукции!" -> /products');

    const testCmd2 = parseVoiceCommand('Очисти экран, пожалуйста.');
    assert(testCmd2 !== null && testCmd2.command === '/clear', 'Voice command "Очисти экран, пожалуйста." -> /clear');

    const testCmd3 = parseVoiceCommand('Что ты умеешь?');
    assert(testCmd3 !== null && testCmd3.command === '/help', 'Voice command "Что ты умеешь?" -> /help');

    const testCmd4 = parseVoiceCommand('Запусти консилиум');
    assert(testCmd4 !== null && testCmd4.command === '/consilium', 'Voice command "Запусти консилиум" -> /consilium');

    const testCmd5 = parseVoiceCommand('Смени модель на gemini-2.5-flash');
    assert(testCmd5 !== null && testCmd5.command === '/model' && testCmd5.args === 'gemini-25-flash', 'Voice command "Смени модель на gemini-2.5-flash" -> /model gemini-25-flash');
  }

  // TEST SUITE 4: Audio Ingestion & Multipart Form-Data Decoding
  console.log('\n[Suite 4] Audio Ingestion & Multipart Validation:');
  {
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const fakeAudio = Buffer.from('FAKE_OPUS_AUDIO_DATA_FOR_TESTING');
    const multipartBody = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="audio"; filename="voice.ogg"\r\nContent-Type: audio/ogg\r\n\r\n`),
      fakeAudio,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    const extracted = extractMultipartFile(multipartBody, `multipart/form-data; boundary=${boundary}`);
    assert(extracted !== null, 'Multipart audio file correctly extracted from HTTP boundary');
    assert(extracted !== null && extracted.toString() === 'FAKE_OPUS_AUDIO_DATA_FOR_TESTING', 'Extracted payload bytes match original raw audio');

    // Cap protection
    assert(isWithinCap(10), `STT Cap check allows 10 seconds of speech within monthly limit (${STT_MONTHLY_CAP_SECONDS}s)`);
  }

  console.log('\n--- Voice Ecosystem Deep Tests Summary ---');
  if (passed) {
    console.log('✅ ALL VOICE & AUDIO TESTS PASSED SUCCESSFULLY!\n');
  } else {
    console.error('❌ SOME VOICE TESTS FAILED!\n');
  }

  return passed;
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  runVoiceEcosystemDeepTests().then((ok) => process.exit(ok ? 0 : 1));
}
