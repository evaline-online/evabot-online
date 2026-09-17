import { ModelCommand, normalizeCommand } from '../models/ModelRatings.js';
import { ModelRatings } from '../models/ModelRatings.js';
import { Config } from '../core/Config.js';
import { logger, LogCategory } from '../core/Logger.js';
import { I18nEngine, SupportedLocale } from '../core/I18nEngine.js';
import { transcribeVoiceWithFallback, type SttLanguage, type SttResult } from '../core/CloudSTT.js';
import { edgeTts } from '../core/EdgeTTS.js';
import { detectMessageLanguage } from '../core/LocalePolicy.js';
import { stripEmoji } from '../core/I18nEngine.js';
import { DeveloperMode } from '../core/DeveloperMode.js';
import { LearnedLessons } from '../core/LearnedLessons.js';
import { ChatEngine } from './ChatEngine.js';

export const TELEGRAM_MESSAGE_LIMIT = 4096;
const TELEGRAM_API_BASE = 'https://api.telegram.org';
const RATE_LIMIT_INTERVAL_MS = 1000;
const VOICE_PLACEHOLDER = '[WRN] Не вдалося завантажити голосове повідомлення. Спробуйте ще раз.';
const VOICE_PREFIX = 'Розпізнано:';

export function stripMarkdownForVoice(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')          // strip HTML tags (<i>, <b>, etc.)
    .replace(/[*_~#>|•]/g, '')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Async transcriber injected for tests; production default = Google CloudSTT with FLAC fallback. */
export type VoiceTranscriber = (audio: Buffer, lang: SttLanguage) => Promise<SttResult>;
const HISTORY_SESSION_PREFIX = 'tg-';

export interface TelegramCommandExecutor {
  (command: string): string;
}

/**
 * Splits an arbitrary text into chunks that each fit the Telegram sendMessage
 * hard limit (4096 UTF-16 code units per message). Prefers splitting on blank
 * lines, then newlines, then hard-cutting long unbroken lines.
 */
export function splitTelegramMessage(text: string, limit: number = TELEGRAM_MESSAGE_LIMIT): string[] {
  const clean = (text || '').trim();
  if (!clean) return [];
  if (clean.length <= limit) return [clean];

  const chunks: string[] = [];
  let remaining = clean;

  while (remaining.length > limit) {
    const window = remaining.slice(0, limit);

    let cut = window.lastIndexOf('\n\n');
    if (cut < Math.floor(limit * 0.25)) cut = window.lastIndexOf('\n');
    if (cut < Math.floor(limit * 0.25)) cut = window.lastIndexOf(' ');
    if (cut < Math.floor(limit * 0.25)) cut = limit;

    chunks.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }

  if (remaining) chunks.push(remaining);
  return chunks;
}

export function markdownToTelegramHtml(markdown: string): string {
  if (!markdown) return '';
  let text = markdown;

  // 1. Preserve code blocks
  const codeBlocks: string[] = [];
  text = text.replace(/```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g, (_match, _lang, code) => {
    const placeholder = `___CB_${codeBlocks.length}___`;
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    codeBlocks.push(`<pre><code>${escaped.trim()}</code></pre>`);
    return placeholder;
  });

  // 2. Preserve inline code
  const inlineCodes: string[] = [];
  text = text.replace(/`([^`]+)`/g, (_match, code) => {
    const placeholder = `___IC_${inlineCodes.length}___`;
    const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    inlineCodes.push(`<code>${escaped}</code>`);
    return placeholder;
  });

  // 3. Escape HTML special characters in outer text
  text = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 4. Headers: convert # Header to <b>Header</b>
  text = text.replace(/^#{1,6}\s+(.+)$/gm, '<b>$1</b>');

  // 5. Bold: **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  text = text.replace(/__(.+?)__/g, '<b>$1</b>');

  // 6. Italic: *text*
  text = text.replace(/(^|\s)\*([^\s*][^*]*[^\s*])\*(\s|$|[.,!?])/g, '$1<i>$2</i>$3');

  // 7. Links: [text](url)
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2">$1</a>');

  // 8. Restore code blocks and inline code
  inlineCodes.forEach((code, idx) => {
    text = text.replace(`___IC_${idx}___`, code);
  });
  codeBlocks.forEach((block, idx) => {
    text = text.replace(`___CB_${idx}___`, block);
  });

  return text;
}

interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

interface TelegramVoice {
  file_id: string;
  duration?: number;
  mime_type?: string;
  file_size?: number;
}

interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  date: number;
  chat: { id: number; type: string; title?: string; username?: string };
  text?: string;
  caption?: string;
  voice?: TelegramVoice;
  audio?: TelegramVoice;
  video_note?: TelegramVoice;
  document?: { file_id: string; file_name?: string; mime_type?: string; file_size?: number };
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
}

interface TelegramApiResponse<T> {
  ok: boolean;
  result?: T;
  description?: string;
}

export class TelegramBot {
  private token: string;
  private apiBase: string;
  private chatEngine: ChatEngine;
  private execute: TelegramCommandExecutor;
  private transcriber: VoiceTranscriber;
  private chatLocales: Map<number, SupportedLocale> = new Map();
  private chatQueues: Map<number, Promise<void>> = new Map();
  private chatLastRun: Map<number, number> = new Map();
  private voiceModeChats: Set<number> = new Set();
  private offset: number = 0;
  private running: boolean = false;
  private webhookUrl: string | null = null;

  constructor(options: { token?: string; apiBase?: string; execute?: TelegramCommandExecutor; transcriber?: VoiceTranscriber; webhookUrl?: string } = {}) {
    this.token = options.token || Config.telegramBotToken;
    this.apiBase = options.apiBase || TELEGRAM_API_BASE;
    this.execute = options.execute || ((command) => ModelCommand.execute(command));
    this.transcriber = options.transcriber || ((audio, lang) => transcribeVoiceWithFallback(audio, { lang }));
    this.chatEngine = new ChatEngine();
    this.webhookUrl = options.webhookUrl ?? null;
  }

  public static isEnabled(): boolean {
    return Boolean(Config.telegramBotToken);
  }

  public async start(): Promise<void> {
    if (!this.token) {
      logger.warn(LogCategory.SYSTEM, 'TelegramBot', 'Telegram bot disabled (no token)');
      return;
    }
    if (this.running) return;

    this.running = true;

    if (this.webhookUrl) {
      logger.info(LogCategory.SYSTEM, 'TelegramBot', `Setting webhook to ${this.webhookUrl}...`);
      try {
        await this.setWebhook(this.webhookUrl);
        logger.info(LogCategory.SYSTEM, 'TelegramBot', 'Webhook set successfully');
      } catch (err: any) {
        logger.error(LogCategory.SYSTEM, 'TelegramBot', `Failed to set webhook: ${err.message}`);
        throw err;
      }
    } else {
      logger.info(LogCategory.SYSTEM, 'TelegramBot', 'Starting Telegram long-polling loop...');
      void this.pollLoop();
    }
  }

  private async setWebhook(url: string): Promise<void> {
    const result = await this.api<{ url: string; has_custom_certificate: boolean; pending_update_count: number; max_connections: number; ip_address?: string }>('setWebhook', {
      url,
      drop_pending_updates: true,
    });
    logger.info(LogCategory.SYSTEM, 'TelegramBot', `Webhook info: ${JSON.stringify(result)}`);
  }

  public async handleWebhookUpdate(update: TelegramUpdate): Promise<void> {
    const msg = update.message || update.edited_message;
    if (!msg) return;
    logger.info(LogCategory.SYSTEM, 'TelegramBot', `Webhook update ${update.update_id}: msg from chatId=${msg.chat.id}, text="${msg.text || ''}"`);
    await this.handleMessage(msg);
  }

  public stop(): void {
    this.running = false;
  }

  private async api<T>(method: string, payload?: Record<string, unknown>): Promise<T | undefined> {
    const res = await fetch(`${this.apiBase}/bot${this.token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload || {}),
    });
    const data = (await res.json()) as TelegramApiResponse<T>;
    if (!data.ok) {
      throw new Error(`Telegram ${method} failed: ${data.description || 'unknown error'}`);
    }
    return data.result;
  }

  private async pollLoop(): Promise<void> {
    while (this.running) {
      try {
        const updates = await this.api<TelegramUpdate[]>('getUpdates', {
          offset: this.offset,
          timeout: 25,
          allowed_updates: ['message', 'edited_message'],
        });
        if (updates && updates.length > 0) {
          logger.info(LogCategory.SYSTEM, 'TelegramBot', `Fetched ${updates.length} updates`);
          for (const update of updates) {
            this.offset = update.update_id + 1;
            const msg = update.message || update.edited_message;
            if (msg) {
              logger.info(LogCategory.SYSTEM, 'TelegramBot', `Update ${update.update_id}: msg from chatId=${msg.chat.id}, text="${msg.text || ''}"`);
              void this.handleMessage(msg);
            }
          }
        }
      } catch (err: any) {
        if (!this.running) break;
        logger.warn(LogCategory.SYSTEM, 'TelegramBot', `Long-poll error: ${err.message}. Retrying in 5s...`);
        await this.sleep(5000);
      }
    }
  }

  private handleMessage(message: TelegramMessage): Promise<void> {
    return this.enqueueForChat(message.chat.id, () => this.processMessage(message));
  }

  /**
   * Rate limit: 1 message per second per chat. All work for a chat is chained
   * on a per-chat promise queue; each task starts at least RATE_LIMIT_INTERVAL_MS
   * after the previous task in the same chat started.
   */
  private async enqueueForChat(chatId: number, task: () => Promise<void>): Promise<void> {
    const previous = this.chatQueues.get(chatId) || Promise.resolve();
    const run = previous
      .then(async () => {
        const last = this.chatLastRun.get(chatId) || 0;
        const waitMs = Math.max(0, RATE_LIMIT_INTERVAL_MS - (Date.now() - last));
        if (waitMs > 0) await this.sleep(waitMs);
        this.chatLastRun.set(chatId, Date.now());
        await task();
      })
      .catch((err: any) => {
        logger.error(LogCategory.SYSTEM, 'TelegramBot', `Chat ${chatId} handler error: ${err.message}`);
      });

    this.chatQueues.set(chatId, run);
    try {
      await run;
    } finally {
      if (this.chatQueues.get(chatId) === run) this.chatQueues.delete(chatId);
    }
  }

  private async processMessage(message: TelegramMessage): Promise<void> {
    const chatId = message.chat.id;
    const from = message.from || { id: chatId, first_name: 'User' };

    const isAudioDoc = Boolean(
      message.document && (
        message.document.mime_type?.startsWith('audio/') ||
        /\.(ogg|oga|mp3|wav|m4a|aac|flac|opus)$/i.test(message.document.file_name || '')
      )
    );
    const audioPayload = message.voice || message.audio || message.video_note || (isAudioDoc ? message.document : undefined);

    logger.info(
      LogCategory.SYSTEM,
      'TelegramBot',
      `Message received chatId=${chatId} (id=${message.message_id}): type=${audioPayload ? 'audio/voice' : 'text'}, text="${(message.text || message.caption || '').slice(0, 50)}"`
    );

    if (audioPayload) {
      await this.handleVoiceMessage(message, audioPayload);
      return;
    }

    const text = (message.text || message.caption || '').trim();
    if (!text) return;

    if (from.language_code && !this.chatLocales.has(chatId)) {
      const code = from.language_code.toLowerCase().slice(0, 2);
      if (code === 'uk' || code === 'ua') this.chatLocales.set(chatId, 'uk');
      else if (code === 'ru') this.chatLocales.set(chatId, 'ru');
      else if (code === 'en') this.chatLocales.set(chatId, 'en');
    }

    // Registration check: users without username or first_name must register first
    if (!from || (!from.username && !from.first_name)) {
      await this.sendMessage(chatId, '[WRN] Please register a Telegram account (set a username or name) to chat with EvaBot.');
      return;
    }

    if (text.startsWith('/')) {
      await this.handleCommand(chatId, text);
      return;
    }

    await this.handleChatMessage(chatId, text);
  }

private getWelcomeMessage(locale: SupportedLocale): string {
    const strings = I18nEngine.getStrings(locale);
    const help = I18nEngine.formatHelp(locale);
    const intro = locale === 'uk'
      ? 'Вітаю! Я — Єва, AI EvaLine (EVA, Чорноморськ/Братислава).'
      : locale === 'ru'
      ? 'Здравствуйте! Я — Ева, AI EvaLine (EVA, Черноморск/Братислава).'
      : 'Hello! I am Eva, AI EvaLine (EVA, Chornomorsk/Bratislava).';
    return `✨ EvaLine | EvaBot 001 MVP\n\n${intro}\n\n${strings.greeting}\n\n${help}`;
  }

  private async handleCommand(chatId: number, raw: string): Promise<void> {
    const locale = this.getChatLocale(chatId);

    if (raw.startsWith('/start')) {
      await this.sendPlainMessage(chatId, `[BOT] ${this.getWelcomeMessage(locale)}`);
      return;
    }

    const [head] = raw.split(/\s+/);
    const canonicalHead = normalizeCommand(head).split(/\s+/)[0];

    if (canonicalHead === '/lang') {
      const arg = raw.split(/\s+/)[1]?.toLowerCase() || '';
      const resolved: SupportedLocale = arg === 'uk' || arg === 'ua' ? 'uk' : arg === 'ru' ? 'ru' : 'en';
      this.chatLocales.set(chatId, resolved);
      const strings = I18nEngine.getStrings(resolved);
      await this.sendMessage(chatId, strings.langSwitched);
      return;
    }

    if (canonicalHead === '/voice') {
      const isVoice = this.voiceModeChats.has(chatId);
      if (isVoice) {
        this.voiceModeChats.delete(chatId);
        await this.sendMessage(chatId, '🔇 Голосовой режим выключен. Ответы будут текстовыми.');
      } else {
        this.voiceModeChats.add(chatId);
        await this.sendMessage(chatId, '🔊 Голосовой режим включен! Ева будет озвучивать свои ответы голосом.');
      }
      return;
    }

    if (canonicalHead === '/learn') {
      const lessonText = raw.replace(/^\/learn\s*/i, '').trim();
      if (!lessonText) {
        await this.sendMessage(chatId, '📝 Использование: <code>/learn &lt;правило или опыт&gt;</code>\nПример: <code>/learn отвечай кратко и конкретно</code>');
        return;
      }
      LearnedLessons.addLesson(lessonText, 'user_command', `telegram_${chatId}`);
      await this.sendMessage(chatId, `✨ <b>Урок усвоен и сохранен в память Евы:</b>\n"<i>${lessonText}</i>"`);
      return;
    }

    if (canonicalHead === '/lessons') {
      const lessons = LearnedLessons.getTopLessons(10);
      if (lessons.length === 0) {
        await this.sendMessage(chatId, '📚 База выученных уроков пуста.');
        return;
      }
      const list = lessons.map((l, i) => `${i + 1}. [${l.category}] ${l.lesson}`).join('\n');
      await this.sendMessage(chatId, `📚 <b>Выученные уроки Евы (${lessons.length}):</b>\n\n${list}`);
      return;
    }

    if (canonicalHead === '/secretary') {
      await this.sendMessage(
        chatId,
        '👩‍💼 <b>Режим секретаря Евы</b>\n\n' +
        '• <b>Статус:</b> Активен через MTProto Userbot (+380968720693)\n' +
        '• <b>Функции:</b>\n' +
        '  - Прямой контакт с контактами (@username / телефон)\n' +
        '  - Прием аудио и голосовых сообщений с мгновенной расшифровкой (faster-whisper)\n' +
        '  - Озвучка ответов голосом Светланы (Edge-TTS)\n' +
        '• <b>Отправка через секретаря:</b>\n' +
        '  <code>Ева, напиши @username сообщение ...</code>'
      );
      return;
    }

    if (canonicalHead === '/models') {
      await this.sendMessage(chatId, this.execute('/models'));
      await this.sendModelsKeyboard(chatId);
      return;
    }

    // /subagent needs the async executor (parallel LLM batch, up to ~2 min).
    if (canonicalHead === '/subagent') {
      const output = await ModelCommand.executeAsync(normalizeCommand(raw));
      await this.sendMessage(chatId, output);
      return;
    }

    // /developer keeps the RAW command: normalizeCommand lowercases the whole
    // line, which would corrupt mixed-case passwords (DeveloperMode.parseCommand
    // does its own head-alias resolution).
    if (canonicalHead === '/developer') {
      const sessionId = `${HISTORY_SESSION_PREFIX}${chatId}`;
      DeveloperMode.setActiveSession(sessionId);
      const output = this.execute(raw);
      await this.sendMessage(chatId, output);
      return;
    }

    const commandText = normalizeCommand(raw);
    const output = this.execute(commandText);
    await this.sendMessage(chatId, output);
  }

  public async sendTyping(chatId: number): Promise<void> {
    try {
      await this.api('sendChatAction', { chat_id: chatId, action: 'typing' });
    } catch {
      // Non-fatal if chat is blocked or temporary network blip
    }
  }

  private async handleChatMessage(chatId: number, text: string): Promise<void> {
    const sessionId = `${HISTORY_SESSION_PREFIX}${chatId}`;
    const locale = this.getChatLocale(chatId);
    logger.info(LogCategory.SYSTEM, 'TelegramBot', `Generating response for chatId=${chatId} (${locale}): "${text.slice(0, 60)}"`);

    // Auto-capture lessons from conversational instructions
    if (/^(запомни|запам'ятай|remember)[:,\s]+/i.test(text.trim())) {
      const lesson = text.trim().replace(/^(запомни|запам'ятай|remember)[:,\s]+/i, '').trim();
      if (lesson.length >= 6) {
        LearnedLessons.addLesson(lesson, 'conversational_memory', `telegram_${chatId}`);
      }
    }

    void this.sendTyping(chatId);
    const typingTimer = setInterval(() => void this.sendTyping(chatId), 4000);

    try {
      const response = await this.chatEngine.respond({ message: text, sessionId, locale });
      logger.info(LogCategory.SYSTEM, 'TelegramBot', `Response ready for chatId=${chatId} (${response.text.length} chars)`);

      // Sync chat locale with the actual language of the response so TTS
      // always uses the correct voice (uk/ru/en) — never falls back to default.
      const responseLang = detectMessageLanguage(response.text);
      if (responseLang === 'uk' || responseLang === 'ru' || responseLang === 'en') {
        this.chatLocales.set(chatId, responseLang);
      }

      // 1. Send full formatted text response first
      await this.sendMessage(chatId, response.text);

      // 2. If voice mode is active, synthesize natural speech and send voice message
      const shouldVoice = this.voiceModeChats.has(chatId);
      if (shouldVoice) {
        let cleanForVoice = stripEmoji(stripMarkdownForVoice(response.text));
        if (cleanForVoice.length > 500) {
          const match = cleanForVoice.slice(0, 500).match(/^(.*?[.!?])(?:\s|$)/s);
          cleanForVoice = match && match[1] && match[1].length > 30 ? match[1] : cleanForVoice.slice(0, 450) + '...';
        }
        if (cleanForVoice.length > 0) {
          try {
            const synthLang = responseLang === 'uk' || responseLang === 'ru' || responseLang === 'en' ? responseLang : locale;
            logger.info(LogCategory.SYSTEM, 'TelegramBot', `TTS voice mode for chatId=${chatId}: lang=${synthLang}`);
            const synth = await edgeTts.synthesize(cleanForVoice, { persona: 'eva', lang: synthLang });
            await this.sendVoice(chatId, synth.audioBuffer);
          } catch (voiceErr: any) {
            logger.warn(LogCategory.SYSTEM, 'TelegramBot', `Voice synth failed: ${voiceErr.message}`);
          }
        }
      }
    } catch (err: any) {
      logger.error(LogCategory.SYSTEM, 'TelegramBot', `Chat error for ${sessionId}: ${err.message}`);
      await this.sendMessage(chatId, `[WRN] Chat engine error: ${err.message}`);
    } finally {
      clearInterval(typingTimer);
    }
  }

  public async sendVoice(chatId: number, audio: Buffer, caption?: string): Promise<void> {
    const formData = new FormData();
    formData.append('chat_id', String(chatId));
    formData.append('voice', new Blob([new Uint8Array(audio)], { type: 'audio/mpeg' }), 'voice.mp3');
    if (caption) {
      formData.append('caption', caption.slice(0, 1024));
    }
    const res = await fetch(`${this.apiBase}/bot${this.token}/sendVoice`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`sendVoice failed (${res.status}): ${err}`);
    }
  }

  /**
   * Voice messages (.ogg/opus, 48 kHz): download → Google CloudSTT (OGG_OPUS,
   * FLAC 16 kHz fallback inside transcribeVoiceWithFallback) → send transcript
   * as reply, then treat the transcript like typed text: '/…' runs as a
   * command, otherwise it flows into the normal chat engine.
   */
  private async handleVoiceMessage(message: TelegramMessage, voicePayload?: { file_id: string }): Promise<void> {
    const chatId = message.chat.id;
    const from = message.from;
    const payload = voicePayload || message.voice || message.audio;
    if (!payload) return;
    if (!from || (!from.username && !from.first_name)) {
      await this.sendMessage(chatId, '[WRN] Please register a Telegram account to send voice messages.');
      return;
    }

    logger.info(LogCategory.SYSTEM, 'TelegramBot', `Voice handler started chatId=${chatId}, fileId=${payload.file_id}`);
    void this.sendTyping(chatId);

    let audio: Buffer | null = null;
    try {
      audio = await this.downloadVoiceFile(payload.file_id);
    } catch (err: any) {
      logger.warn(LogCategory.SYSTEM, 'TelegramBot', `Voice download failed: ${err.message}`);
    }
    if (!audio) {
      await this.sendMessage(chatId, VOICE_PLACEHOLDER);
      return;
    }

    const lang = localeToSttLang(this.getChatLocale(chatId));
    logger.info(LogCategory.SYSTEM, 'TelegramBot', `Transcribing voice (${audio.length} bytes, lang=${lang})...`);
    const result = await this.transcriber(audio, lang);
    if (!result.ok || !result.transcript) {
      logger.warn(LogCategory.SYSTEM, 'TelegramBot', `Voice transcription failed: ${result.error}`);
      await this.sendMessage(chatId, `[WRN] Не вдалося розпізнати голосове повідомлення${result.error ? ` (${result.error})` : ''}.`);
      return;
    }

    logger.info(LogCategory.SYSTEM, 'TelegramBot', `Voice transcribed successfully: "${result.transcript}"`);
    await this.sendMessage(chatId, `${VOICE_PREFIX} ${result.transcript}`);

    // Update chat locale based on detected language of the transcript
    // so subsequent TTS uses the correct voice (uk/ru/en)
    const detectedLang = detectMessageLanguage(result.transcript);
    if (detectedLang === 'uk' || detectedLang === 'ru' || detectedLang === 'en') {
      this.chatLocales.set(chatId, detectedLang);
    }

    // DO NOT auto-enable voice mode here — only user's explicit /voice command should enable it
    // this.voiceModeChats.add(chatId);  // REMOVED: caused infinite loop

    if (result.transcript.startsWith('/')) {
      await this.handleCommand(chatId, result.transcript);
    } else {
      await this.handleChatMessage(chatId, result.transcript);
    }
  }

  private async downloadVoiceFile(fileId: string): Promise<Buffer | null> {
    const file = await this.api<{ file_path?: string }>('getFile', { file_id: fileId });
    const filePath = file?.file_path;
    if (!filePath) return null;
    const res = await fetch(`${this.apiBase}/file/bot${this.token}/${filePath}`);
    const buf = Buffer.from(await res.arrayBuffer());
    logger.info(LogCategory.SYSTEM, 'TelegramBot', `Downloaded voice file ${filePath} (${buf.length} bytes)`);
    return buf.length > 0 ? buf : null;
  }

  public async sendModelsKeyboard(chatId: number): Promise<void> {
    const top8 = ModelRatings.getTopFree(8);
    const rows: string[][] = [];
    for (let i = 0; i < top8.length; i += 2) {
      rows.push(top8.slice(i, i + 2).map((e) => e.model.name));
    }
    await this.api('sendMessage', {
      chat_id: chatId,
      text: ' Top-8 free models — tap to inspect:',
      reply_markup: { keyboard: rows, resize_keyboard: true, one_time_keyboard: true },
    });
  }

  public getChatLocale(chatId: number): SupportedLocale {
    return this.chatLocales.get(chatId) || I18nEngine.getLocale();
  }

  public async sendMessage(chatId: number, text: string): Promise<void> {
    const htmlText = markdownToTelegramHtml(text);
    const chunks = splitTelegramMessage(htmlText, TELEGRAM_MESSAGE_LIMIT);
    if (chunks.length === 0) return;
    for (const chunk of chunks) {
      try {
        await this.api('sendMessage', {
          chat_id: chatId,
          text: chunk,
          parse_mode: 'HTML',
          disable_web_page_preview: true,
        });
      } catch (err: any) {
        logger.warn(LogCategory.SYSTEM, 'TelegramBot', `HTML send failed (${err.message}), falling back to plain text`);
        const rawChunks = splitTelegramMessage(text, TELEGRAM_MESSAGE_LIMIT);
        for (const rawChunk of rawChunks) {
          await this.api('sendMessage', {
            chat_id: chatId,
            text: rawChunk,
            disable_web_page_preview: true,
          });
        }
      }
    }
  }

  public async sendPlainMessage(chatId: number, text: string): Promise<void> {
    const chunks = splitTelegramMessage(text, TELEGRAM_MESSAGE_LIMIT);
    if (chunks.length === 0) return;
    for (const chunk of chunks) {
      await this.api('sendMessage', {
        chat_id: chatId,
        text: chunk,
        disable_web_page_preview: true,
      });
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Process incoming update from webhook */
  public async processUpdate(update: any): Promise<void> {
    if (update.message) {
      await this.handleMessage(update.message);
    } else if (update.edited_message) {
      await this.handleMessage(update.edited_message);
    } else if (update.callback_query) {
      // Handle callback queries if needed
      logger.info(LogCategory.SYSTEM, 'TelegramBot', `Callback query from ${update.callback_query.from.id}`);
    }
  }
}

let singleton: TelegramBot | null = null;

export function getTelegramBotSingleton(): TelegramBot | null {
  return singleton;
}

/** Maps a chat locale to a Google STT language code. */
export function localeToSttLang(locale: SupportedLocale): SttLanguage {
  return locale === 'uk' ? 'uk-UA' : locale === 'ru' ? 'ru-RU' : 'en-US';
}

export function startTelegramBot(webhookUrl?: string): void {
  if (!TelegramBot.isEnabled()) {
    logger.warn(LogCategory.SYSTEM, 'TelegramBot', 'Telegram bot disabled (no token)');
    return;
  }
  try {
    if (!singleton) singleton = new TelegramBot({ webhookUrl });
    void singleton.start();
    logger.info(LogCategory.SYSTEM, 'TelegramBot', webhookUrl
      ? `Telegram bot started (webhook mode: ${webhookUrl})`
      : 'Telegram bot started (long-polling)');
  } catch (err: any) {
    logger.error(LogCategory.SYSTEM, 'TelegramBot', `Failed to start Telegram bot: ${err.message}`);
  }
}
