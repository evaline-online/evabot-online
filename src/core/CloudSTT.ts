/**
 * CloudSTT.ts — Google Cloud Speech-to-Text (v1 recognize) with ONLY-FREE guard.
 *
 * Design constraints:
 *  - Uses the v1 `speech:recognize` endpoint with the standard model
 *    `latest_long`, which falls under the recurring free allowance of
 *    60 minutes/month per account (chirp models are Speech-to-Text V2 only
 *    and have no published free allowance — see docs/ops/CLOUD_STT.md).
 *  - Enforces a module-level monthly cap (3000 s = 50 min free + safety
 *    margin) persisted in data/stt-usage.json {month, secondsUsed}.
 *    Requests are REFUSED once the cap is reached — never silently spend money.
 *  - Auth: Bearer token from GoogleAuthProvider + required
 *    `X-Goog-User-Project: evabot-agent-server` header.
 *  - 15 s hard deadline via Resilience.withTimeout; never throws into the
 *    request path (errors are returned on the SttResult).
 *  - ffmpeg fallback chain: OGG_OPUS attempt → FLAC 16 kHz mono retry.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { logger, LogCategory } from './Logger.js';
import { GoogleAuthProvider } from './GoogleAuthProvider.js';
import { withTimeout } from './Resilience.js';

export const STT_ENDPOINT = 'https://speech.googleapis.com/v1/speech:recognize';
export const STT_PROJECT_HEADER = 'evabot-agent-server';
/** v1 standard model → included in the 60 min/month free tier (chirp is V2-only, paid from min 1). */
export const STT_MODEL = 'latest_long';
/** 3600 s free tier  600 s safety margin = 3000 s. */
export const STT_MONTHLY_CAP_SECONDS = 3000;
export const STT_TIMEOUT_MS = 15_000;

export const STT_USAGE_PATH = path.resolve(process.cwd(), 'data', 'stt-usage.json');

export type SttLanguage = 'uk-UA' | 'ru-RU' | 'en-US';
export type SttEncoding = 'OGG_OPUS' | 'FLAC' | 'WEBM_OPUS' | 'LINEAR16';

export interface SttOptions {
  lang?: SttLanguage;
  encoding?: SttEncoding;
  sampleRate?: number;
  /** Override billed/estimated duration (e.g. Telegram voice.duration). */
  durationSeconds?: number;
}

export interface SttResult {
  transcript: string;
  confidence: number;
  secondsBilled: number;
  ok: boolean;
  error?: string;
  usedFallbackFlac?: boolean;
}

export interface SttUsage {
  month: string;
  secondsUsed: number;
}

/** Current billing month key, UTC (e.g. '2026-09'). */
export function monthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function readUsage(): SttUsage {
  try {
    const raw = fs.readFileSync(STT_USAGE_PATH, 'utf8');
    const parsed = JSON.parse(raw) as SttUsage;
    if (parsed && parsed.month === monthKey() && typeof parsed.secondsUsed === 'number') {
      return parsed;
    }
  } catch {
    // missing / corrupted / previous month → fresh counter
  }
  return { month: monthKey(), secondsUsed: 0 };
}

export function writeUsage(usage: SttUsage): void {
  const dir = path.dirname(STT_USAGE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(STT_USAGE_PATH, JSON.stringify(usage, null, 2), 'utf8');
}

/** Whether `seconds` more could be billed this month without breaching the cap. */
export function isWithinCap(seconds: number, usage: SttUsage = readUsage()): boolean {
  if (usage.month !== monthKey()) return true;
  return usage.secondsUsed + seconds <= STT_MONTHLY_CAP_SECONDS;
}

export function recordUsage(seconds: number, usage: SttUsage = readUsage()): SttUsage {
  const fresh = usage.month === monthKey()
    ? usage
    : { month: monthKey(), secondsUsed: 0 };
  fresh.secondsUsed += seconds;
  writeUsage(fresh);
  return fresh;
}

/** Test helper: reset the monthly counter to zero (fresh month). */
export function resetUsageForTest(): void {
  writeUsage({ month: monthKey(), secondsUsed: 0 });
}

/**
 * Size-based duration estimate used when no explicit duration is provided:
 *  - FLAC / LINEAR16 16 kHz mono 16-bit  32 000 bytes/s
 *  - Opus (OGG/WEBM)  48 kbps  6 000 bytes/s (typical Telegram voice)
 * Always rounds up to the next whole second (Google rounds up too).
 */
export function estimateAudioSeconds(sizeBytes: number, encoding: SttEncoding = 'OGG_OPUS', sampleRate: number = 16000): number {
  const bytesPerSecond = encoding === 'FLAC' || encoding === 'LINEAR16'
    ? Math.max(4000, sampleRate * 2)
    : 6000;
  return Math.max(1, Math.ceil(sizeBytes / bytesPerSecond));
}

/** ffprobe-based duration (best effort); returns null when ffprobe is unavailable. */
export function probeAudioSeconds(audio: Buffer): number | null {
  const tmpIn = path.join(os.tmpdir(), `evabot-stt-probe-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  try {
    fs.writeFileSync(tmpIn, audio);
    const out = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      tmpIn,
    ], { encoding: 'utf8', timeout: 4000 });
    const seconds = parseFloat(out.trim());
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.ceil(seconds);
    }
  } catch {
    // ffprobe missing or unreadable container → caller falls back to estimate
  } finally {
    try { fs.unlinkSync(tmpIn); } catch { /* ignore */ }
  }
  return null;
}

/** ffmpeg argument vector for the 16 kHz mono FLAC fallback conversion. */
export function buildFfmpegFlacArgs(input: string, output: string): string[] {
  return ['-y', '-i', input, '-ar', '16000', '-ac', '1', '-f', 'flac', output];
}

/** Converts arbitrary input audio to FLAC 16 kHz mono via ffmpeg. Returns null on failure. */
export function convertToFlac16k(audio: Buffer): Buffer | null {
  const tmpIn = path.join(os.tmpdir(), `evabot-stt-in-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const tmpOut = `${tmpIn}.flac`;
  try {
    fs.writeFileSync(tmpIn, audio);
    execFileSync('ffmpeg', buildFfmpegFlacArgs(tmpIn, tmpOut), { encoding: 'utf8', timeout: 30_000 });
    const flac = fs.readFileSync(tmpOut);
    return flac.length > 0 ? flac : null;
  } catch (err: any) {
    logger.warn(LogCategory.SYSTEM, 'CloudSTT', `ffmpeg FLAC conversion failed: ${err.message}`);
    return null;
  } finally {
    try { fs.unlinkSync(tmpIn); } catch { /* ignore */ }
    try { fs.unlinkSync(tmpOut); } catch { /* ignore */ }
  }
}

/**
 * Pure request builder for speech:recognize.
 *  - FLAC: sample rate is auto-detected from the header (omitted).
 *  - OGG_OPUS / WEBM_OPUS: defaults to 48000 (Telegram voice is 48 kHz).
 *  - LINEAR16: sampleRate is required.
 */
export function buildRecognizeRequest(
  audioBase64: string,
  opts: SttOptions = {}
): { config: Record<string, unknown>; audio: { content: string } } {
  const encoding: SttEncoding = opts.encoding || 'OGG_OPUS';
  const primaryLang = opts.lang || 'ru-RU';
  const candidatePool = ['ru-RU', 'uk-UA', 'en-US', 'pl-PL'];
  const altLangs = candidatePool.filter((l) => l !== primaryLang).slice(0, 3);

  const config: Record<string, unknown> = {
    languageCode: primaryLang,
    alternativeLanguageCodes: altLangs,
    model: STT_MODEL,
    enableAutomaticPunctuation: true,
  };
  if (encoding === 'LINEAR16') {
    config.encoding = encoding;
    config.sampleRateHertz = opts.sampleRate || 16000;
  } else if (encoding === 'FLAC') {
    config.encoding = encoding; // sampleRateHertz auto-detected from FLAC header
  } else {
    config.encoding = encoding;
    config.sampleRateHertz = opts.sampleRate || 48000;
  }
  return { config, audio: { content: audioBase64 } };
}

async function callRecognizeApi(
  audioBase64: string,
  opts: SttOptions
): Promise<{ transcript: string; confidence: number; error?: string }> {
  const creds = await GoogleAuthProvider.getCredentials();
  if (!creds || creds.type !== 'bearer') {
    return { transcript: '', confidence: 0, error: 'NO_GOOGLE_CREDENTIALS' };
  }

  const body = JSON.stringify(buildRecognizeRequest(audioBase64, opts));
  const res = await withTimeout(
    fetch(STT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${creds.token}`,
        'X-Goog-User-Project': STT_PROJECT_HEADER,
      },
      body,
    }),
    STT_TIMEOUT_MS,
    'CloudSTT speech:recognize'
  );

  const data: any = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.error?.message || `HTTP ${res.status}`;
    return { transcript: '', confidence: 0, error: `STT_API_ERROR: ${msg}` };
  }

  const result = data?.results?.[0]?.alternatives?.[0];
  return {
    transcript: (result?.transcript || '').trim(),
    confidence: typeof result?.confidence === 'number' ? result.confidence : 0,
  };
}

/**
 * Transcribes audio via Google Cloud STT v1 (model latest_long) under the
 * monthly ONLY-FREE cap. Never throws — failures come back on the result.
 */
export async function transcribeAudio(
  audio: Buffer | string,
  opts: SttOptions = {}
): Promise<SttResult> {
  try {
    const buf = typeof audio === 'string' ? Buffer.from(audio, 'base64') : audio;
    if (!buf || buf.length === 0) {
      return { transcript: '', confidence: 0, secondsBilled: 0, ok: false, error: 'EMPTY_AUDIO' };
    }

    // ONLY-FREE guard: refuse BEFORE spending when this request would breach the cap.
    const encoding: SttEncoding = opts.encoding || 'OGG_OPUS';
    const estSeconds = opts.durationSeconds
      ?? probeAudioSeconds(buf)
      ?? estimateAudioSeconds(buf.length, encoding, opts.sampleRate || (encoding === 'FLAC' ? 16000 : 48000));
    if (!isWithinCap(estSeconds)) {
      const usage = readUsage();
      logger.warn(LogCategory.SYSTEM, 'CloudSTT', `Monthly STT cap reached (${usage.secondsUsed}/${STT_MONTHLY_CAP_SECONDS}s) — request refused`);
      return {
        transcript: '',
        confidence: 0,
        secondsBilled: 0,
        ok: false,
        error: `MONTHLY_CAP_REACHED (used ${usage.secondsUsed}s / cap ${STT_MONTHLY_CAP_SECONDS}s; resets ${monthKey()}→next month)`,
      };
    }

    const audioBase64 = buf.toString('base64');
    const res = await callRecognizeApi(audioBase64, opts);
    if (res.error) {
      return { transcript: '', confidence: 0, secondsBilled: 0, ok: false, error: res.error };
    }

    // Bill actual (rounded-up) duration; ffprobe on real audio beats the estimate.
    const billed = opts.durationSeconds ?? probeAudioSeconds(buf) ?? estSeconds;
    recordUsage(billed);
    logger.info(LogCategory.SYSTEM, 'CloudSTT', `Transcribed ${billed}s audio, confidence ${res.confidence.toFixed(2)}`);

    return { transcript: res.transcript, confidence: res.confidence, secondsBilled: billed, ok: true };
  } catch (err: any) {
    logger.warn(LogCategory.SYSTEM, 'CloudSTT', `transcribeAudio failed: ${err.message}`);
    return { transcript: '', confidence: 0, secondsBilled: 0, ok: false, error: err.message };
  }
}

/**
 * Preferred chain for Telegram voice (.ogg/opus) and CLI /listen:
 * 1. OGG_OPUS @ 48 kHz direct attempt.
 * 2. On API failure (not cap refusal): ffmpeg → FLAC 16 kHz mono, retry FLAC.
 */
export async function transcribeVoiceWithFallback(
  audio: Buffer,
  opts: SttOptions = {}
): Promise<SttResult> {
  const first = await transcribeAudio(audio, { ...opts, encoding: opts.encoding || 'OGG_OPUS', sampleRate: opts.sampleRate || 48000 });
  // Bail early ONLY on a cap refusal — retrying FLAC cannot bypass the cap and
  // would only waste ffmpeg time. Any other failure (API error, HTTP 200 with
  // an empty transcript, e.g. mp3 bytes mislabeled as OGG_OPUS) falls through
  // to the FLAC 16 kHz retry below.
  if ((first.error || '').includes('MONTHLY_CAP_REACHED')) return first;
  if (first.ok && first.transcript) return first;

  const flac = convertToFlac16k(audio);
  if (!flac) return first;

  const second = await transcribeAudio(flac, { ...opts, encoding: 'FLAC' });
  if (second.ok) return { ...second, usedFallbackFlac: true };
  return { ...first, error: `${first.error} | FLAC fallback: ${second.error}` };
}
