/**
 * EdgeTTS.ts — Microsoft Edge-TTS (Azure Neural voices) for EvaBot (ONLY-FREE).
 *
 * Decision (2026 reviews): Edge-TTS = best free unlimited TTS. It is the
 * PRIMARY synthesis chain; Google Cloud TTS (CloudTTS, Chirp3-HD 1M chars/mo
 * free) remains the fallback. Edge-TTS has no per-char quota — it is
 * free/unlimited, so there is NO cap logic here (ONLY-FREE trivially holds).
 *
 * Implementation shells out to the `edge-tts` python package already
 * installed on this server:
 *   python3 -m edge_tts --voice <V> --text <T> --write-media <tmp.mp3>
 * (verified 2026-09: uk-UA-PolinaNeural ~3.6 s, ru-RU-DmitryNeural ~9.9 s).
 *
 * Persona voice mapping (LANGUAGE-FIRST):
 *   Language determines locale; persona determines gender.
 *   uk-UA: Eva (female) → uk-UA-PolinaNeural, Adam (male) → uk-UA-OstapNeural
 *   ru-RU: Eva (female) → ru-RU-SvetlanaNeural, Adam (male) → ru-RU-DmitryNeural
 *   en-US: Eva (female) → en-US-AriaNeural, Adam (male) → en-US-GuyNeural
 * Runtime override: data/voice-prefs.json (same file /voices set writes).
 * Only Edge-Neural voice names (ending in "Neural") are honored there so a
 * Google catalog voice never leaks into this chain.
 *
 * Cache: identical (text+voice) results stored at
 * data/tts-cache/<sha1(voice::text)>.mp3 — the same directory/pattern the
 * CloudTTS module uses (voice names never collide across providers).
 *
 * Failure policy: synthesize() THROWS on any failure (empty text, missing
 * python module, timeout, sub-1KB output) so the caller (VoiceRouter) can
 * fall back to cloudTts.synthesize (Google Chirp3-HD) cleanly.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile } from 'node:child_process';
import { logger } from './Logger.js';
import { loadVoicePrefs } from './CloudTTS.js';

export type EdgePersona = 'eva' | 'adam';

export interface EdgeSynthesisOptions {
  persona?: EdgePersona;
  lang?: string;
  voiceName?: string;
}

export interface EdgeSynthesisResult {
  audioBuffer: Buffer;
  voice: string;
  cached: boolean;
  chars: number;
  provider: 'edge-tts';
}

export interface EdgeUsageState {
  month: string;
  chars: number;
}

export interface EdgeTTSOptions {
  dataDir?: string;
  /** Python interpreter (default "python3"); override in tests to force failure. */
  pythonBin?: string;
  /** Hard deadline for the edge_tts subprocess (default 20 s). */
  timeoutMs?: number;
  evaVoice?: string;
  adamVoice?: string;
}

export const EDGE_TTS_DEFAULT_UK_VOICE = 'uk-UA-PolinaNeural';  // FEMALE
export const EDGE_TTS_DEFAULT_UK_ADAM = 'uk-UA-OstapNeural';     // MALE
export const EDGE_TTS_DEFAULT_RU_VOICE = 'ru-RU-SvetlanaNeural'; // FEMALE
export const EDGE_TTS_DEFAULT_RU_ADAM = 'ru-RU-DmitryNeural';    // MALE
export const EDGE_TTS_DEFAULT_EN_VOICE = 'en-US-AriaNeural';     // FEMALE
export const EDGE_TTS_DEFAULT_EN_ADAM = 'en-US-GuyNeural';       // MALE

// Legacy aliases (used by prefs and constructor)
export const EDGE_TTS_DEFAULT_EVA_VOICE = EDGE_TTS_DEFAULT_UK_VOICE;
export const EDGE_TTS_DEFAULT_ADAM_VOICE = EDGE_TTS_DEFAULT_RU_ADAM;

/** Static catalog of Edge-Neural voices for the ONLY-FREE /voices surface. */
export const EDGE_VOICE_CATALOG: Array<{
  name: string;
  family: 'edge-neural';
  gender: 'FEMALE' | 'MALE';
  free: true;
}> = [
  { name: 'uk-UA-PolinaNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'uk-UA-OstapNeural', family: 'edge-neural', gender: 'MALE', free: true },
  { name: 'ru-RU-DmitryNeural', family: 'edge-neural', gender: 'MALE', free: true },
  { name: 'ru-RU-SvetlanaNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'en-US-AriaNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'en-US-GuyNeural', family: 'edge-neural', gender: 'MALE', free: true },
  { name: 'pl-PL-ZofiaNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'pl-PL-MarekNeural', family: 'edge-neural', gender: 'MALE', free: true },
  { name: 'de-DE-KatjaNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'de-DE-KillianNeural', family: 'edge-neural', gender: 'MALE', free: true },
  { name: 'es-ES-ElviraNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'es-ES-AlvaroNeural', family: 'edge-neural', gender: 'MALE', free: true },
  { name: 'fr-FR-DeniseNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'fr-FR-HenriNeural', family: 'edge-neural', gender: 'MALE', free: true },
  { name: 'it-IT-ElsaNeural', family: 'edge-neural', gender: 'FEMALE', free: true },
  { name: 'it-IT-DiegoNeural', family: 'edge-neural', gender: 'MALE', free: true },
];

const EDGE_VOICE_NAMES: ReadonlySet<string> = new Set(EDGE_VOICE_CATALOG.map((v) => v.name));

/** True when the voice name belongs to the Edge-Neural catalog. */
export function isEdgeVoice(voiceName: string): boolean {
  return EDGE_VOICE_NAMES.has(voiceName) || voiceName.endsWith('Neural');
}

/** MP3 cache key: sha256 of "<voice>::<text>" (same pattern as CloudTTS). */
export function edgeCacheKey(voice: string, text: string): string {
  return crypto.createHash('sha256').update(`${voice}::${text}`).digest('hex');
}

/** Minimal MP3 sanity threshold: real speech is always > 1 KB. */
const MIN_MP3_BYTES = 1024;

export class EdgeTTS {
  private readonly dataDir: string;
  private readonly cacheDir: string;
  private readonly pythonBin: string;
  private readonly timeoutMs: number;
  private evaVoice: string;
  private adamVoice: string;
  private usage: EdgeUsageState | null = null;

  constructor(opts: EdgeTTSOptions = {}) {
    this.dataDir = opts.dataDir || path.resolve(process.cwd(), 'data');
    this.cacheDir = path.join(this.dataDir, 'tts-cache');
    this.pythonBin = opts.pythonBin || 'python3';
    this.timeoutMs = opts.timeoutMs ?? 20_000;
    // Voice precedence: explicit opts (tests) > data/voice-prefs.json
    // (/voices set, Edge-Neural names only) > Edge-Neural defaults.
    const prefs = loadVoicePrefs(this.dataDir);
    this.evaVoice = opts.evaVoice || (prefs.evaVoice && isEdgeVoice(prefs.evaVoice) ? prefs.evaVoice : EDGE_TTS_DEFAULT_EVA_VOICE);
    this.adamVoice = opts.adamVoice || (prefs.adamVoice && isEdgeVoice(prefs.adamVoice) ? prefs.adamVoice : EDGE_TTS_DEFAULT_ADAM_VOICE);
  }

  /** Re-reads data/voice-prefs.json into the live instance (after /voices set). */
  public reloadVoicePrefs(): void {
    const prefs = loadVoicePrefs(this.dataDir);
    if (prefs.evaVoice && isEdgeVoice(prefs.evaVoice)) this.evaVoice = prefs.evaVoice;
    if (prefs.adamVoice && isEdgeVoice(prefs.adamVoice)) this.adamVoice = prefs.adamVoice;
  }

  /** Language-first voice resolution: language determines locale, persona determines gender. */
  public resolveVoice(opts: EdgeSynthesisOptions = {}): string {
    if (opts.voiceName) return opts.voiceName;

    const lang = (opts.lang || '').toLowerCase();
    const isRussian = lang.startsWith('ru');
    const isUkrainian = lang.startsWith('uk') || lang.startsWith('ua');
    const isPolish = lang.startsWith('pl');
    const isGerman = lang.startsWith('de');
    const isSpanish = lang.startsWith('es');
    const isFrench = lang.startsWith('fr');
    const isItalian = lang.startsWith('it');

    // Persona determines GENDER: eva (default) = female, adam = male
    const isFemale = opts.persona !== 'adam';

    if (isRussian) return isFemale ? 'ru-RU-SvetlanaNeural' : 'ru-RU-DmitryNeural';
    if (isUkrainian) return isFemale ? 'uk-UA-PolinaNeural' : 'uk-UA-OstapNeural';
    if (isPolish) return isFemale ? 'pl-PL-ZofiaNeural' : 'pl-PL-MarekNeural';
    if (isGerman) return isFemale ? 'de-DE-KatjaNeural' : 'de-DE-KillianNeural';
    if (isSpanish) return isFemale ? 'es-ES-ElviraNeural' : 'es-ES-AlvaroNeural';
    if (isFrench) return isFemale ? 'fr-FR-DeniseNeural' : 'fr-FR-HenriNeural';
    if (isItalian) return isFemale ? 'it-IT-ElsaNeural' : 'it-IT-DiegoNeural';
    // English (default fallback)
    return isFemale ? 'en-US-AriaNeural' : 'en-US-GuyNeural';
  }

  public getEvaVoice(): string {
    return this.evaVoice;
  }

  public getAdamVoice(): string {
    return this.adamVoice;
  }

  /** Current month key, e.g. "2026-09" (same shape as CloudTTS.currentMonth). */
  public static currentMonth(d: Date = new Date()): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  /** Usage counter {month, chars} (informational only — Edge-TTS is unlimited). */
  public getUsage(): EdgeUsageState {
    const now = EdgeTTS.currentMonth();
    if (this.usage && this.usage.month === now) return this.usage;
    try {
      const p = path.join(this.dataDir, 'edge-tts-usage.json');
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

  private persistUsage(): void {
    try {
      fs.mkdirSync(this.dataDir, { recursive: true });
      fs.writeFileSync(
        path.join(this.dataDir, 'edge-tts-usage.json'),
        JSON.stringify(this.getUsage(), null, 2),
        'utf8',
      );
    } catch (err: any) {
      logger.warn('EdgeTTS', `Failed to persist usage counter: ${err.message}`);
    }
  }

  private cachePath(text: string, voice: string): string {
    return path.join(this.cacheDir, `${edgeCacheKey(voice, text)}.mp3`);
  }

  /** Cache hit check (valid MP3-sized entries only). */
  public readCache(text: string, voice: string): Buffer | null {
    try {
      const p = this.cachePath(text, voice);
      if (fs.existsSync(p) && fs.statSync(p).size >= MIN_MP3_BYTES) {
        return fs.readFileSync(p);
      }
    } catch {
      // Cache read failure is non-fatal.
    }
    return null;
  }

  /**
   * Synthesizes text to an MP3 Buffer via the edge_tts python module.
   * THROWS on any failure so the caller can fall back to Google TTS.
   */
  public async synthesize(text: string, opts: EdgeSynthesisOptions = {}): Promise<EdgeSynthesisResult> {
    const clean = String(text || '').trim();
    if (!clean) throw new Error('edge-tts: empty text');
    const voice = this.resolveVoice(opts);
    const chars = clean.length;

    // 1. Cache hit path (no subprocess).
    const cachedAudio = this.readCache(clean, voice);
    if (cachedAudio) {
      return { audioBuffer: cachedAudio, voice, cached: true, chars, provider: 'edge-tts' };
    }

    // 2. Subprocess: python3 -m edge_tts --voice V --text T --write-media tmp.
    //    The tmp file lives inside the cache dir so the final rename stays
    //    on one filesystem (os.tmpdir() may be a different mount).
    fs.mkdirSync(this.cacheDir, { recursive: true });
    const tmpPath = path.join(this.cacheDir, `.tmp-${edgeCacheKey(voice, clean)}-${process.pid}-${Date.now()}`);
    try {
      await new Promise<void>((resolve, reject) => {
        execFile(
          this.pythonBin,
          ['-m', 'edge_tts', '--voice', voice, '--text', clean, '--write-media', tmpPath],
          { timeout: this.timeoutMs, maxBuffer: 10 * 1024 * 1024 },
          (err) => (err ? reject(err) : resolve()),
        );
      });

      // 3. Validate the produced MP3 before it enters the cache.
      const size = fs.existsSync(tmpPath) ? fs.statSync(tmpPath).size : 0;
      if (size < MIN_MP3_BYTES) {
        throw new Error(`edge-tts produced invalid audio (${size} bytes < ${MIN_MP3_BYTES})`);
      }

      // 4. Move into the shared MP3 cache.
      const finalPath = this.cachePath(clean, voice);
      fs.renameSync(tmpPath, finalPath);

      // 5. Informational usage counter (Edge-TTS is free/unlimited).
      const usage = this.getUsage();
      usage.chars += chars;
      this.persistUsage();

      return { audioBuffer: fs.readFileSync(finalPath), voice, cached: false, chars, provider: 'edge-tts' };
    } catch (err: any) {
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {
        // Cleanup is best-effort.
      }
      logger.warn('EdgeTTS', `Synthesis failed for voice=${voice} chars=${chars}: ${err.message}`);
      throw new Error(`edge-tts synthesis failed: ${err.message}`);
    }
  }
}

/** Process-wide singleton used by the voice router. */
export const edgeTts = new EdgeTTS();
