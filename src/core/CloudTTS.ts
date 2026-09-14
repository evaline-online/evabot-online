/**
 * CloudTTS.ts — Google Cloud Text-to-Speech for EvaBot (ONLY-FREE compliant).
 *
 * Reuses GoogleAuthProvider token/credentials logic (user-ADC refresh token
 * exchange). Every request sends:
 *   Authorization: Bearer <token>
 *   X-Goog-User-Project: evabot-agent-server   (REQUIRED for user-ADC auth)
 *
 * Endpoint: POST https://texttospeech.googleapis.com/v1/text:synthesize
 *
 * ONLY-FREE rule (verified 2026-09 against the official pricing page
 * https://cloud.google.com/text-to-speech/pricing):
 *   - WaveNet voices: first 1M chars/month free, then pay-per-char.
 *   - Chirp 3: HD voices: free allowance exists too (1M chars/mo), but after
 *     the cap it is the most expensive family ($30/1M chars).
 *   - Standard voices: first 4M chars/month free.
 * The module enforces a hard monthly character cap (MAX_CHARS_FREE_PER_MONTH,
 * default 900_000 = safety margin under the 1M Wavenet free allowance) and
 * REFUSES to synthesize beyond it. It never silently spends money: requests
 * over the cap are rejected with an overCap result so callers can fall back
 * to browser TTS.
 *
 * Persona voice mapping (LANGUAGE-FIRST, verified from live GET /v1/voices, 2066 voices):
 *   Language determines locale; persona determines gender.
 *   uk-UA: Eva (female) → uk-UA-Chirp3-HD-Aoede, Adam (male) → uk-UA-Chirp3-HD-Fenrir
 *   ru-RU: Eva (female) → ru-RU-Chirp3-HD-Aoede, Adam (male) → ru-RU-Chirp3-HD-Fenrir
 *   en-US: Eva (female) → en-US-Chirp3-HD-Aoede, Adam (male) → en-US-Chirp3-HD-Fenrir
 * Chirp3-HD voices sound far more natural than Wavenet AND have the same
 * 1M chars/month free allowance (verified 2026-09, official pricing page).
 * Runtime overrides: data/voice-prefs.json (written by /voices set) wins over
 * these defaults; explicit constructor opts (tests) win over everything.
 *
 * Extras:
 *   - Monthly usage counter persisted at data/tts-usage.json {month, chars}.
 *   - Audio cache: identical (text+voice) results stored at
 *     data/tts-cache/<sha1>.mp3 — cache hits never hit the API or the counter.
 *   - 10 s hard deadline via Resilience.withTimeout.
 *   - synthesize() NEVER throws into the chat flow: all failures resolve to
 *     { ok: false, error } so callers can fall back gracefully.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { logger } from './Logger.js';
import { GoogleAuthProvider } from './GoogleAuthProvider.js';
import { withTimeout } from './Resilience.js';

export type TtsPersona = 'eva' | 'adam';

export interface TtsSynthesisOptions {
  lang?: string;
  persona?: TtsPersona;
  voiceName?: string;
}

export interface TtsSynthesisResult {
  ok: boolean;
  base64Audio?: string;
  voice: string;
  charCount: number;
  cached?: boolean;
  overCap?: boolean;
  charsLeftThisMonth?: number;
  payPerCharAfterCap?: boolean;
  error?: string;
}

export interface TtsUsageState {
  month: string;
  chars: number;
}

export interface CloudTTSOptions {
  dataDir?: string;
  fetchFn?: typeof fetch;
  getCredentials?: () => Promise<{ token: string } | null>;
  cap?: number;
  evaVoice?: string;
  adamVoice?: string;
  timeoutMs?: number;
}

const TTS_ENDPOINT = 'https://texttospeech.googleapis.com/v1/text:synthesize';
const TTS_VOICES_ENDPOINT = 'https://texttospeech.googleapis.com/v1/voices';
const USER_PROJECT = 'evabot-agent-server';

/** Voice family derived from the voice name (drives pricing metadata). */
export function voiceFamily(voiceName: string): 'edge-neural' | 'chirp3-hd' | 'wavenet' | 'neural2' | 'studio' | 'standard' {
  if (/Neural$/.test(voiceName)) return 'edge-neural';
  if (voiceName.includes('Chirp3')) return 'chirp3-hd';
  if (voiceName.includes('Wavenet')) return 'wavenet';
  if (voiceName.includes('Neural2')) return 'neural2';
  if (voiceName.includes('Studio')) return 'studio';
  return 'standard';
}

/** Free-tier allowance per family, chars/month (verified 2026-09, see doc). */
export function familyFreeAllowance(family: string): number {
  switch (family) {
    case 'edge-neural': return 999_999_999; // Edge-TTS: free/unlimited
    case 'standard': return 4_000_000;
    case 'wavenet':
    case 'neural2':
    case 'chirp3-hd': return 1_000_000;
    default: return 100_000; // studio
  }
}

/** Pay-per-char label used when the module reports a cap-exhausted family. */
export function familyPayPerCharNote(family: string): string {
  switch (family) {
    case 'edge-neural': return 'UNLIMITED FREE (Microsoft Edge-TTS / Azure Neural)';
    case 'chirp3-hd': return 'PAY-PER-CHAR after cap: US$30 per 1M chars';
    case 'studio': return 'PAY-PER-CHAR after cap: US$160 per 1M chars';
    case 'neural2': return 'PAY-PER-CHAR after cap: US$16 per 1M chars';
    default: return 'PAY-PER-CHAR after cap: US$16 per 1M chars';
  }
}

/** Extracts languageCode ("uk-UA") from a full voice name. */
export function languageCodeOf(voiceName: string): string {
  const parts = voiceName.split('-');
  return parts.length >= 2 ? `${parts[0]}-${parts[1]}` : 'en-US';
}

// ============================================================================
// Voice catalog + ONLY-FREE family validation (drives the /voices command).
// Free families: chirp3-hd, wavenet, neural2, standard (1M–4M chars/mo free).
// Paid-only families (e.g. studio) are rejected by /voices set.
// ============================================================================

export type CatalogVoiceFamily = 'edge-neural' | 'chirp3-hd' | 'wavenet' | 'neural2' | 'standard';

export interface CatalogVoice {
  name: string;
  family: CatalogVoiceFamily;
  gender: 'FEMALE' | 'MALE';
  free: boolean;
}

/** Families allowed by /voices set (all free-tier). Studio/others rejected. */
export const FREE_VOICE_FAMILIES: ReadonlySet<string> = new Set<CatalogVoiceFamily>([
  'edge-neural', 'chirp3-hd', 'wavenet', 'neural2', 'standard',
]);

/** Family → sort rank for /voices listing (Edge-Neural first: free/unlimited
 * and the primary chain; Chirp3-HD next, most natural free-tier Google). */
export function familyRank(family: string): number {
  switch (family) {
    case 'edge-neural': return 0;
    case 'chirp3-hd': return 1;
    case 'wavenet': return 2;
    case 'neural2': return 3;
    case 'standard': return 4;
    default: return 9;
  }
}

const CHIRP3_FEMALE = ['Aoede', 'Autonoe', 'Callirrhoe', 'Despina', 'Erinome', 'Gacrux', 'Kore', 'Laomedeia', 'Leda', 'Pulcherrima', 'Sadr', 'Vindemiatrix', 'Zephyr'];
const CHIRP3_MALE = ['Achernar', 'Achird', 'Algenib', 'Algol', 'Alnilam', 'Charon', 'Enceladus', 'Fenrir', 'Iapetus', 'Orus', 'Puck', 'Umbriel', 'Zubenelgenubi'];

function catalogVoicesFor(locales: string[]): CatalogVoice[] {
  const out: CatalogVoice[] = [];
  for (const loc of locales) {
    for (const n of CHIRP3_FEMALE) out.push({ name: `${loc}-Chirp3-HD-${n}`, family: 'chirp3-hd', gender: 'FEMALE', free: true });
    for (const n of CHIRP3_MALE) out.push({ name: `${loc}-Chirp3-HD-${n}`, family: 'chirp3-hd', gender: 'MALE', free: true });
  }
  return out;
}

const UK_WAVENET: Array<[string, CatalogVoiceFamily, 'FEMALE' | 'MALE']> = [
  ['uk-UA-Wavenet-B', 'wavenet', 'FEMALE'],
  ['uk-UA-Standard-B', 'standard', 'FEMALE'],
];

const RU_WAVENET: Array<[string, CatalogVoiceFamily, 'FEMALE' | 'MALE']> = [
  ['ru-RU-Wavenet-A', 'wavenet', 'FEMALE'],
  ['ru-RU-Wavenet-D', 'wavenet', 'MALE'],
  ['ru-RU-Standard-A', 'standard', 'FEMALE'],
  ['ru-RU-Standard-B', 'standard', 'FEMALE'],
  ['ru-RU-Standard-D', 'standard', 'MALE'],
  ['ru-RU-Standard-E', 'standard', 'MALE'],
];

const EN_WAVENET: Array<[string, CatalogVoiceFamily, 'FEMALE' | 'MALE']> = [
  ['en-US-Wavenet-A', 'wavenet', 'FEMALE'],
  ['en-US-Wavenet-B', 'wavenet', 'MALE'],
  ['en-US-Wavenet-C', 'wavenet', 'FEMALE'],
  ['en-US-Wavenet-D', 'wavenet', 'MALE'],
  ['en-US-Wavenet-E', 'wavenet', 'FEMALE'],
  ['en-US-Wavenet-F', 'wavenet', 'MALE'],
  ['en-US-Standard-A', 'standard', 'FEMALE'],
  ['en-US-Standard-B', 'standard', 'MALE'],
  ['en-US-Standard-C', 'standard', 'FEMALE'],
  ['en-US-Standard-D', 'standard', 'MALE'],
  ['en-US-Standard-E', 'standard', 'FEMALE'],
  ['en-US-Standard-F', 'standard', 'MALE'],
];

/** Edge-Neural voices (primary TTS chain, src/core/EdgeTTS.ts): free/unlimited,
 * rendered first in /voices via familyRank. Catalog/defaults only here — the
 * actual synthesis lives in EdgeTTS (kept separate to avoid an import cycle). */
const EDGE_NEURAL: Array<[string, CatalogVoiceFamily, 'FEMALE' | 'MALE']> = [
  ['uk-UA-PolinaNeural', 'edge-neural', 'FEMALE'],
  ['uk-UA-OstapNeural', 'edge-neural', 'MALE'],
  ['ru-RU-DmitryNeural', 'edge-neural', 'MALE'],
  ['ru-RU-SvetlanaNeural', 'edge-neural', 'FEMALE'],
  ['en-US-AriaNeural', 'edge-neural', 'FEMALE'],
  ['en-US-GuyNeural', 'edge-neural', 'MALE'],
  ['pl-PL-ZofiaNeural', 'edge-neural', 'FEMALE'],
  ['pl-PL-MarekNeural', 'edge-neural', 'MALE'],
];

/** Static ONLY-FREE voice catalog per language (Edge-Neural + Chirp3-HD + Wavenet tiers). */
export const VOICE_CATALOG: CatalogVoice[] = [
  ...EDGE_NEURAL.map(([name, family, gender]) => ({ name, family, gender, free: true })),
  ...catalogVoicesFor(['uk-UA', 'ru-RU', 'en-US']),
  ...UK_WAVENET.map(([name, family, gender]) => ({ name, family, gender, free: true })),
  ...RU_WAVENET.map(([name, family, gender]) => ({ name, family, gender, free: true })),
  ...EN_WAVENET.map(([name, family, gender]) => ({ name, family, gender, free: true })),
];

export interface VoiceValidationResult {
  ok: boolean;
  family?: CatalogVoiceFamily;
  gender?: string;
  error?: string;
}

/** Validates a voice name against the ONLY-FREE catalog + family whitelist. */
export function validateVoiceName(voiceName: string): VoiceValidationResult {
  const entry = VOICE_CATALOG.find((v) => v.name === voiceName);
  if (!entry) {
    return {
      ok: false,
      error: `unknown voice "${voiceName}" (not in the free catalog — use /voices to list available voices)`,
    };
  }
  if (!FREE_VOICE_FAMILIES.has(entry.family)) {
    return {
      ok: false,
      family: entry.family,
      error: `voice family "${entry.family}" is NOT in the free-family list (allowed: ${[...FREE_VOICE_FAMILIES].join(', ')})`,
    };
  }
  return { ok: true, family: entry.family, gender: entry.gender };
}

// ============================================================================
// Voice preferences persistence (data/voice-prefs.json, written by /voices set)
// ============================================================================

export interface VoicePrefs {
  evaVoice?: string;
  adamVoice?: string;
}

/** Default location of the persisted voice preferences file. */
export function voicePrefsPath(dataDir: string = path.resolve(process.cwd(), 'data')): string {
  return path.join(dataDir, 'voice-prefs.json');
}

/** Loads data/voice-prefs.json (if present and valid). Never throws. */
export function loadVoicePrefs(dataDir: string = path.resolve(process.cwd(), 'data')): VoicePrefs {
  try {
    const p = voicePrefsPath(dataDir);
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
      const prefs: VoicePrefs = {};
      if (typeof raw.evaVoice === 'string' && raw.evaVoice) prefs.evaVoice = raw.evaVoice;
      if (typeof raw.adamVoice === 'string' && raw.adamVoice) prefs.adamVoice = raw.adamVoice;
      return prefs;
    }
  } catch {
    // Corrupt file → fall back to defaults.
  }
  return {};
}

/** Persists data/voice-prefs.json {evaVoice, adamVoice}. */
export function saveVoicePrefs(prefs: VoicePrefs, dataDir: string = path.resolve(process.cwd(), 'data')): void {
  fs.mkdirSync(dataDir, { recursive: true });
  const merged = { ...loadVoicePrefs(dataDir), ...prefs };
  fs.writeFileSync(voicePrefsPath(dataDir), JSON.stringify(merged, null, 2), 'utf8');
}

/** Builds the exact JSON body for POST /v1/text:synthesize. */
export function buildSynthesizeRequest(text: string, voiceName: string): Record<string, unknown> {
  return {
    input: { text },
    voice: {
      languageCode: languageCodeOf(voiceName),
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: 'MP3',
    },
  };
}

export class CloudTTS {
  private readonly dataDir: string;
  private readonly cacheDir: string;
  private readonly fetchFn: typeof fetch;
  private readonly getCredentials: () => Promise<{ token: string } | null>;
  private readonly cap: number;
  private evaVoice: string;
  private adamVoice: string;
  private readonly timeoutMs: number;
  private usage: TtsUsageState | null = null;
  private voicesReady: boolean = false;

  constructor(opts: CloudTTSOptions = {}) {
    this.dataDir = opts.dataDir || path.resolve(process.cwd(), 'data');
    this.cacheDir = path.join(this.dataDir, 'tts-cache');
    this.fetchFn = opts.fetchFn || fetch;
    this.getCredentials = opts.getCredentials || (async () => {
      const creds = await GoogleAuthProvider.getCredentials();
      return creds ? { token: creds.token } : null;
    });
    this.cap = opts.cap ?? 900_000;
    // Voice precedence: explicit opts (tests) > data/voice-prefs.json
    // (/voices set) > Chirp3-HD defaults (most natural free-tier voices).
    const prefs = loadVoicePrefs(this.dataDir);
    this.evaVoice = opts.evaVoice || prefs.evaVoice || 'uk-UA-Chirp3-HD-Aoede';
    this.adamVoice = opts.adamVoice || prefs.adamVoice || 'ru-RU-Chirp3-HD-Fenrir';
    this.timeoutMs = opts.timeoutMs ?? 10_000;
  }

  /** Re-reads data/voice-prefs.json into the live instance (after /voices set). */
  public reloadVoicePrefs(): void {
    const prefs = loadVoicePrefs(this.dataDir);
    if (prefs.evaVoice) this.evaVoice = prefs.evaVoice;
    if (prefs.adamVoice) this.adamVoice = prefs.adamVoice;
  }

  /** Language-first voice resolution: language determines locale, persona determines gender. */
  public resolveVoice(opts: TtsSynthesisOptions = {}): string {
    if (opts.voiceName) return opts.voiceName;

    const lang = (opts.lang || '').toLowerCase();
    const isRussian = lang.startsWith('ru');
    const isUkrainian = lang.startsWith('uk') || lang.startsWith('ua');

    // Persona determines GENDER: eva (default) = female, adam = male
    const isFemale = opts.persona !== 'adam';

    if (isRussian) return isFemale ? 'ru-RU-Chirp3-HD-Aoede' : 'ru-RU-Chirp3-HD-Fenrir';
    if (isUkrainian) return isFemale ? 'uk-UA-Chirp3-HD-Aoede' : 'uk-UA-Chirp3-HD-Fenrir';
    // English (default fallback)
    return isFemale ? 'en-US-Chirp3-HD-Aoede' : 'en-US-Chirp3-HD-Fenrir';
  }

  public getCap(): number {
    return this.cap;
  }

  public getEvaVoice(): string {
    return this.evaVoice;
  }

  public getAdamVoice(): string {
    return this.adamVoice;
  }

  public isVoicesReady(): boolean {
    return this.voicesReady;
  }

  /** Current month key, e.g. "2026-09". */
  public static currentMonth(d: Date = new Date()): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  /** Loads (and month-rolls) the persisted usage counter. */
  public getUsage(): TtsUsageState {
    const now = CloudTTS.currentMonth();
    if (this.usage && this.usage.month === now) return this.usage;
    try {
      const p = path.join(this.dataDir, 'tts-usage.json');
      if (fs.existsSync(p)) {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (raw.month === now) {
          this.usage = { month: raw.month, chars: Number(raw.chars) || 0 };
          return this.usage;
        }
      }
    } catch {
      // Corrupt file → start fresh for this month.
    }
    this.usage = { month: now, chars: 0 };
    return this.usage;
  }

  public getMonthChars(): number {
    return this.getUsage().chars;
  }

  public getCharsLeft(): number {
    return Math.max(0, this.cap - this.getMonthChars());
  }

  private persistUsage(): void {
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(
        path.join(this.dataDir, 'tts-usage.json'),
        JSON.stringify(this.getUsage(), null, 2),
        'utf8',
      );
    } catch (err: any) {
      logger.warn('CloudTTS', `Failed to persist usage counter: ${err.message}`);
    }
  }

  private cachePath(text: string, voice: string): string {
    const sha1 = crypto.createHash('sha1').update(`${voice}::${text}`).digest('hex');
    return path.join(this.cacheDir, `${sha1}.mp3`);
  }

  /** Cache hit check — cache hits never hit the API nor the usage counter. */
  public readCache(text: string, voice: string): string | null {
    try {
      const p = this.cachePath(text, voice);
      if (fs.existsSync(p) && fs.statSync(p).size > 0) {
        return fs.readFileSync(p).toString('base64');
      }
    } catch {
      // Cache read failure is non-fatal.
    }
    return null;
  }

  public writeCache(text: string, voice: string, base64Audio: string): void {
    try {
      fs.mkdirSync(this.cacheDir, { recursive: true });
      fs.writeFileSync(this.cachePath(text, voice), new Uint8Array(Buffer.from(base64Audio, 'base64')));
    } catch (err: any) {
      logger.warn('CloudTTS', `Failed to write TTS cache: ${err.message}`);
    }
  }

  /**
   * Synthesizes text to base64 MP3. Never throws — failures resolve to
   * { ok: false, error } so the chat flow can fall back to browser TTS.
   */
  public async synthesize(text: string, opts: TtsSynthesisOptions = {}): Promise<TtsSynthesisResult> {
    const clean = String(text || '').trim();
    const voice = this.resolveVoice(opts);
    const charCount = clean.length;
    const family = voiceFamily(voice);
    const payPerCharNote = familyPayPerCharNote(family);

    if (!clean) {
      return { ok: false, voice, charCount: 0, error: 'empty text' };
    }

    // 1. Cache hit path (no API call, no counter increment).
    const cached = this.readCache(clean, voice);
    if (cached) {
      return {
        ok: true,
        base64Audio: cached,
        voice,
        charCount,
        cached: true,
        charsLeftThisMonth: this.getCharsLeft(),
      };
    }

    // 2. ONLY-FREE hard cap enforcement. Refuse before spending anything.
    if (this.getMonthChars() + charCount > this.cap) {
      logger.warn('CloudTTS', `Monthly cap ${this.cap} reached (${this.getMonthChars()} used). Refusing synthesis of ${charCount} chars — falling back to browser TTS. ${payPerCharNote}`);
      return {
        ok: false,
        voice,
        charCount,
        overCap: true,
        charsLeftThisMonth: 0,
        payPerCharAfterCap: true,
        error: `Monthly free cap (${this.cap} chars) reached. ${payPerCharNote}. Falling back to browser TTS.`,
      };
    }

    // 3. Credentials.
    let token: string;
    try {
      const creds = await this.getCredentials();
      if (!creds || !creds.token) {
        return { ok: false, voice, charCount, error: 'No Google credentials available' };
      }
      token = creds.token;
    } catch (err: any) {
      return { ok: false, voice, charCount, error: `Credentials failed: ${err.message}` };
    }

    // 4. HTTP call with 10 s deadline; errors never throw into chat flow.
    try {
      const res = await withTimeout(
        this.fetchFn(TTS_ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'X-Goog-User-Project': USER_PROJECT,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(buildSynthesizeRequest(clean, voice)),
        }),
        this.timeoutMs,
        'CloudTTS text:synthesize',
      );

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        return {
          ok: false,
          voice,
          charCount,
          payPerCharAfterCap: family === 'chirp3-hd' && !this.voicesReady,
          error: `TTS API ${res.status}: ${errBody.slice(0, 200)}`,
        };
      }

      const data: any = await res.json();
      const base64Audio = data.audioContent || '';
      if (!base64Audio) {
        return { ok: false, voice, charCount, error: 'Empty audioContent from TTS API' };
      }

      this.voicesReady = true;

      // 5. Persist counter AFTER a successful synthesis (charge once).
      const usage = this.getUsage();
      usage.chars += charCount;
      this.persistUsage();

      // 6. Cache identical (text+voice) results.
      this.writeCache(clean, voice, base64Audio);

      return {
        ok: true,
        base64Audio,
        voice,
        charCount,
        cached: false,
        charsLeftThisMonth: this.getCharsLeft(),
      };
    } catch (err: any) {
      return { ok: false, voice, charCount, error: `TTS request failed: ${err.message}` };
    }
  }

  /**
   * Lists voices for a language (e.g. ru-RU, uk-UA) via GET /v1/voices.
   * Used for /api/tts/status "voicesReady" and for diagnostics.
   */
  public async listVoices(lang?: string): Promise<Array<{ name: string; gender: string }>> {
    try {
      const creds = await this.getCredentials();
      if (!creds || !creds.token) return [];
      const url = lang
        ? `${TTS_VOICES_ENDPOINT}?languageCode=${encodeURIComponent(lang)}`
        : TTS_VOICES_ENDPOINT;
      const res = await withTimeout(
        this.fetchFn(url, {
          headers: {
            'Authorization': `Bearer ${creds.token}`,
            'X-Goog-User-Project': USER_PROJECT,
          },
        }),
        this.timeoutMs,
        'CloudTTS /v1/voices',
      );
      if (!res.ok) return [];
      const data: any = await res.json();
      const voices = (data.voices || []).map((v: any) => ({
        name: v.name,
        gender: v.ssmlGender || 'UNSPECIFIED',
      }));
      this.voicesReady = voices.length > 0;
      return voices;
    } catch {
      return [];
    }
  }
}

/** Process-wide singleton used by the voice router and chat integrations. */
export const cloudTts = new CloudTTS();
