import { Router, withErrorHandling } from './Router.js';
import { cloudTts } from '../../core/CloudTTS.js';
import { edgeTts } from '../../core/EdgeTTS.js';
import { detectMessageLanguage } from '../../core/LocalePolicy.js';
import {
  transcribeAudio,
  transcribeVoiceWithFallback,
  type SttEncoding,
  type SttLanguage,
  type SttResult,
} from '../../core/CloudSTT.js';
import { logger, LogCategory } from '../../core/Logger.js';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export function readRawBody(req: import('node:http').IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        reject(new Error('Audio body too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/**
 * Minimal multipart/form-data extractor: returns the first part that carries
 * a filename (or the name "audio"/"file"), decoded between the CRLF headers
 * and the trailing boundary delimiter.
 */
export function extractMultipartFile(body: Buffer, contentType: string): Buffer | null {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!boundaryMatch) return null;
  const boundary = `--${(boundaryMatch[1] || boundaryMatch[2]).trim()}`;
  const marker = Buffer.from(boundary);
  let start = body.indexOf(marker);
  while (start !== -1) {
    const headerEnd = body.indexOf('\r\n\r\n', start);
    if (headerEnd === -1) break;
    const headers = body.slice(start, headerEnd).toString('utf8');
    const nextBoundary = body.indexOf(marker, headerEnd);
    if (nextBoundary === -1) break;
    const isFile = /filename="/.test(headers) || /name="(audio|file)"/i.test(headers);
    if (isFile) {
      let end = nextBoundary;
      if (body[end - 2] === 13 && body[end - 1] === 10) end -= 2;
      return body.slice(headerEnd + 4, end);
    }
    start = nextBoundary;
  }
  return null;
}

function normalizeLang(raw: string | null): SttLanguage {
  if (raw === 'uk-UA' || raw === 'uk' || raw === 'ua') return 'uk-UA';
  if (raw === 'en-US' || raw === 'en') return 'en-US';
  return 'ru-RU';
}

function normalizeEncoding(raw: string | null): SttEncoding | undefined {
  const v = (raw || '').toUpperCase();
  if (v === 'OGG_OPUS' || v === 'FLAC' || v === 'WEBM_OPUS' || v === 'LINEAR16') return v;
  return undefined;
}

function sendSttResult(ctx: { sendJson: (s: number, d: any) => void }, result: SttResult): void {
  if (result.ok) {
    ctx.sendJson(200, { transcript: result.transcript, confidence: result.confidence, secondsBilled: result.secondsBilled });
    return;
  }
  if ((result.error || '').includes('MONTHLY_CAP_REACHED')) {
    ctx.sendJson(429, { error: result.error });
    return;
  }
  ctx.sendJson(502, { error: result.error || 'STT_FAILED' });
}

export function createVoiceRouter(): Router {
  const router = new Router();

  // POST /api/tts  {text, persona: 'eva'|'adam', lang?}
  //   → {ok, audioBase64, voice, cached, provider: 'edge-tts'|'google-tts'}
  // Chain: Edge-TTS (Azure Neural, free/unlimited) first; Google Chirp3-HD
  // (1M chars/mo free cap) is the fallback when the edge_tts module fails.
  router.post('/api/tts', withErrorHandling(async (ctx) => {
    const body = await ctx.parseJsonBody();
    const text = typeof body?.text === 'string' ? body.text : '';
    if (!text.trim()) {
      ctx.sendJson(400, { ok: false, error: 'Missing "text".' });
      return;
    }
    const persona = body?.persona === 'adam' ? 'adam' : body?.persona === 'eva' ? 'eva' : undefined;
    // Language from the TEXT wins (LANGUAGE-FIRST): Russian text must be voiced
    // with a Russian voice even when the UI language param says otherwise.
    // body.lang is only a fallback when text detection yields nothing.
    const detectedLang = detectMessageLanguage(text);
    const lang = detectedLang || (typeof body?.lang === 'string' ? body.lang : undefined);

    let audioBase64: string | null = null;
    let voice = '';
    let cached = false;
    let provider: 'edge-tts' | 'google-tts' = 'google-tts';

    // 1. Primary: Edge-TTS (throws on failure → fall back below).
    try {
      const edge = await edgeTts.synthesize(text, { persona, lang });
      audioBase64 = edge.audioBuffer.toString('base64');
      voice = edge.voice;
      cached = edge.cached;
      provider = 'edge-tts';
    } catch (err: any) {
      logger.warn(LogCategory.HTTP, 'TTS', `edge-tts unavailable → google fallback: ${err.message}`);
    }

    // 2. Fallback: Google Cloud TTS (Chirp3-HD, ONLY-FREE cap enforced there).
    if (!audioBase64) {
      const result = await cloudTts.synthesize(text, { persona, lang });
      if (result.ok && result.base64Audio) {
        audioBase64 = result.base64Audio;
        voice = result.voice;
        cached = result.cached === true;
        provider = 'google-tts';
      } else {
        ctx.sendJson(200, { ok: false, fallback: 'browser-tts', error: result.error || 'synthesis failed', overCap: result.overCap === true });
        return;
      }
    }

    ctx.sendJson(200, { ok: true, audioBase64, mimeType: 'audio/mp3', voice, cached, overCap: false, provider });
  }));

  // GET /api/tts/status → voices, usage vs free cap
  router.get('/api/tts/status', withErrorHandling(async (ctx) => {
    const usage = cloudTts.getUsage();
    ctx.sendJson(200, {
      voicesReady: true,
      evaVoice: cloudTts.getEvaVoice(),
      adamVoice: cloudTts.getAdamVoice(),
      monthChars: usage.chars,
      cap: cloudTts.getCap(),
      remainingChars: cloudTts.getCharsLeft(),
      freeTier: 'wavenet-1M/mo',
    });
  }));

  // POST /api/stt?lang=uk-UA&encoding=OGG_OPUS
  // Accepts: raw audio body (audio/* or application/octet-stream),
  // multipart/form-data (first file part), or JSON {audio: <base64>}.
  router.post('/api/stt', withErrorHandling(async (ctx) => {
    const lang = normalizeLang(ctx.query.get('lang'));
    const encoding = normalizeEncoding(ctx.query.get('encoding'));
    const sampleRateRaw = parseInt(ctx.query.get('sampleRate') || '', 10);
    const sampleRate = Number.isFinite(sampleRateRaw) ? sampleRateRaw : undefined;
    const useFallback = ctx.query.get('fallback') !== 'false';

    const contentType = (ctx.req.headers['content-type'] || '').toLowerCase();
    let audio: Buffer | null = null;

    if (contentType.includes('multipart/form-data')) {
      const body = await readRawBody(ctx.req);
      audio = extractMultipartFile(body, ctx.req.headers['content-type'] || '');
    } else if (contentType.includes('application/json')) {
      const body = await ctx.parseJsonBody();
      if (body && typeof body.audio === 'string' && body.audio) {
        audio = Buffer.from(body.audio, 'base64');
      }
    } else if (contentType.startsWith('audio/') || contentType.includes('octet-stream') || contentType === '') {
      audio = await readRawBody(ctx.req);
    }

    if (!audio || audio.length === 0) {
      ctx.sendJson(400, { error: 'No audio payload. Send raw body, multipart file part, or JSON {audio: base64}.' });
      return;
    }

    logger.info(LogCategory.HTTP, 'STT', `${ctx.pathname} lang=${lang} encoding=${encoding || 'auto'} bytes=${audio.length} ip=${ctx.clientIp}`);
    const result = useFallback
      ? await transcribeVoiceWithFallback(audio, { lang, encoding, sampleRate })
      : await transcribeAudio(audio, { lang, encoding, sampleRate });
    sendSttResult(ctx, result);
  }));

  return router;
}
