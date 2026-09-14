import fs from 'node:fs';
import path from 'node:path';
import { resolveGeminiApiKey } from './GoogleAuthProvider.js';
import { EVA_IDENTITY_RULE, EVA_ABOUT_SELF, EVA_COMPANY_KNOWLEDGE, EVA_CAPABILITIES, EVA_TONE_RULE } from './PersonaPolicy.js';

export interface SystemConfig {
  geminiApiKey: string;
  /**
   * ONLY-FREE rule: Vertex AI (paid, on-demand per-token) is DISABLED by
   * default. Set env EVA_VERTEX_ENABLED=1 to explicitly opt in to paid
   * Vertex bearer-token traffic.
   */
  vertexEnabled: boolean;
  defaultModel: string;
  serverPort: number;
  serverHost: string;
  defaultSystemInstruction: string;
  supportedCurrencies: string[];
  omnirouteBaseUrl: string;
  omnirouteApiKey: string;
  openrouterBaseUrl: string;
  openrouterApiKey: string;
  opencodeBaseUrl: string;
  opencodeApiKey: string;
  telegramBotToken: string;
  ttsVoiceEva: string;
  ttsVoiceAdam: string;
  ttsMonthlyCharCap: number;
  developerPassword: string;
}

/**
 * Parses simple .env file without external dependencies
 */
function loadDotEnv(): void {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // Ignore error if filesystem not accessible
  }
}

loadDotEnv();

export const Config: SystemConfig = {
  // Gemini free-tier key: explicit GEMINI_API_KEY env wins; otherwise lazily
  // fall back to Secret Manager secret 'evabot-gemini-api-key' (free tier, $0).
  // Resolved once here (after loadDotEnv); '' on total failure → callers degrade.
  geminiApiKey: resolveGeminiApiKey(),
  vertexEnabled: process.env.EVA_VERTEX_ENABLED === '1',
  defaultModel: process.env.DEFAULT_MODEL || 'openrouter/free',
  serverPort: parseInt(process.env.PORT || '3000', 10),
  serverHost: process.env.HOST || '0.0.0.0',
defaultSystemInstruction:
     // Default persona for Telegram + extended persona for Telegram + web fallback chat: Eva — the Face of
     // EvaLine. Female first person, business-like yet kind, warm, elegant.
     "You are Eva, the Face of EvaLine — the premier Ukrainian full-cycle manufacturer of environmentally friendly EVA polymer materials " +
     "(manufacturing plant & headquarters in Chernomorsk, Ukraine; European office & logistics warehouse in Bratislava, Slovakia). " +
     EVA_IDENTITY_RULE + " " +
     EVA_ABOUT_SELF + " " +
     EVA_COMPANY_KNOWLEDGE + " " +
     EVA_CAPABILITIES + " " +
     EVA_TONE_RULE + " " +
     "You operate in English, Ukrainian, and Russian. LANGUAGE MIRRORING (STRICT): always answer in the SAME language the user wrote in; never switch languages unless the user explicitly asks. " +
     "All financial figures and pricing estimates must strictly be in USD ($) or EUR (€).",
  supportedCurrencies: ['USD', 'EUR'],
  omnirouteBaseUrl: process.env.OMNIROUTE_BASE_URL || 'http://100.66.98.4:20128/v1',
  omnirouteApiKey: process.env.OMNIROUTE_API_KEY || 'omniroute-default',
  openrouterBaseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  openrouterApiKey: process.env.OPENROUTER_API_KEY || '',
  opencodeBaseUrl: process.env.OPENCODE_BASE_URL || 'http://100.66.98.4:20128/v1',
  opencodeApiKey: process.env.OPENCODE_API_KEY || '',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  // Cloud TTS (ONLY-FREE rule). PRIMARY = Microsoft Edge-TTS (Azure Neural,
  // free/unlimited — src/core/EdgeTTS.ts, voices uk-UA-PolinaNeural (Ева) and
  // ru-RU-DmitryNeural (Адам); NOT configurable here). FALLBACK = Google
  // Cloud TTS below: Chirp3-HD voices sound far more natural than Wavenet AND
  // share the 1M chars/month free tier (verified 2026-09,
  // https://cloud.google.com/text-to-speech/pricing). Default cap 900_000
  // leaves a safety margin under the free allowance so we never spend money.
  // Runtime override: data/voice-prefs.json (written by /voices set).
  // TTS_VOICE_EVA / TTS_VOICE_ADAM apply ONLY to the Google fallback chain.
  ttsVoiceEva: process.env.TTS_VOICE_EVA || 'uk-UA-Chirp3-HD-Aoede',
  ttsVoiceAdam: process.env.TTS_VOICE_ADAM || 'ru-RU-Chirp3-HD-Fenrir',
  ttsMonthlyCharCap: parseInt(process.env.TTS_MONTHLY_CHAR_CAP || '900000', 10),
  // Developer mode gate (FEATURE /developer): NO default password — when the
  // env var is missing, /developer must report "режим недоступний".
  developerPassword: process.env.EVADEV_PASSWORD || '',
};
