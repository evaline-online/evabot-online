import { VoiceDockUI } from './voice/VoiceDockUI';
import {
  CatalogStore,
  streamChat,
  runConsilium,
  fetchHealth,
  fetchBootDiagnostics,
  fetchAppConfig,
  fetchBootBannerText,
  setServerDevMode,
} from './api';
import type { BootReport, ConsiliumMode, CostEstimate, PersonaId } from './models';
import {
  toHtml,
  ANSI,
  renderBootBanner,
  renderDiagnostics,
  renderDiagnosticsProbe,
  renderStatusBar,
  renderModelsTable,
  renderCompareTable,
  renderHelp,
  renderAbout,
  renderChatBoxContent,
  renderChatBoxWithCost,
  renderCostLine,
  renderConsiliumTurn,
  renderConsensusBox,
  renderAuditBox,
  renderUserLine,
  renderError,
  renderNotice,
  renderDevModeBlock,
  renderConfigBlock,
  renderRawAnsiBlock,
  renderOnboardingStep,
  formatPrompt,
  ONBOARDING_TIPS,
} from './ansi';
import { OnboardingHandler, STORAGE_DONE, STORAGE_STEP, ONBOARDING_STEPS } from './onboarding';
import type { OnboardingAction, OnboardingCtx, OnboardingView } from './onboarding';

export type Lang = 'en' | 'uk' | 'ru';
export type ModeId = ConsiliumMode;
export type DbId = 'hybrid' | 'postgres' | 'qdrant' | 'ephemeral';
export type RoleId =
  | 'eva_frontend'
  | 'adam_backend'
  | 'ceo'
  | 'cto'
  | 'ciso'
  | 'cfo'
  | 'devops_sre'
  | 'data_ai_lead'
  | 'qa_automation'
  | 'legal_compliance';

interface WebMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  ansi?: boolean;
  metadata?: {
    model?: string;
    mode?: ModeId;
    persona?: PersonaId;
    role?: string;
    db?: string;
  };
}

interface TranslationStrings {
  appTitle: string;
  statusOnline: string;
  statusBusy: string;
  statusError: string;
  returnTerminalBtn: string;
  clearChatBtn: string;
  transmitBtn: string;
  stopBtn: string;
  inputPlaceholder: string;
  welcomeHeading: string;
  welcomeNotice: string;

  voiceTapToSpeak: string;
  voiceListening: string;
  voiceSpeaking: string;
  voiceSublabel: string;
  voiceStatusReady: string;
  voiceStatusListening: string;
  voiceStatusSpeaking: string;

  personaEvaLabel: string;
  personaAdamLabel: string;
  personaDualLabel: string;

  modeChatLabel: string;
  modeDialogLabel: string;
  modeInterviewLabel: string;
  modeConsiliumLabel: string;

  badgeFree: string;
  badgePaid: string;

  noticePersonaSwitched: string;
  noticeModeSwitched: string;
  noticeModelSwitched: string;
  noticeDbSwitched: string;
  noticeRoleSwitched: string;
  noticeKeySaved: string;
  noticeKeyCleared: string;
  noticeChatCleared: string;
  copiedBtn: string;
  copyBtn: string;
}

export const TRANSLATIONS: Record<Lang, TranslationStrings> = {
  en: {
    appTitle: 'EVABOT // CYBER-TERMINAL & NEURAL VOICE HUB',
    statusOnline: 'ONLINE',
    statusBusy: 'STREAMING',
    statusError: 'ERROR',
    returnTerminalBtn: '[ ↑ RETURN TO TERMINAL ]',
    clearChatBtn: '[ CLR ]',
    transmitBtn: '[ TRANSMIT ↵ ]',
    stopBtn: '[ STOP ! ]',
    inputPlaceholder: 'Enter prompt or command (e.g. /help, /persona, /mode, /models, /db)...',
    welcomeHeading: 'EVABOT NEURAL CYBER-TERMINAL // CORE INITIALIZED',
    welcomeNotice:
      'Session active. Pure monochrome cyber-terminal initialized. Based in Chernomorsk, Ukraine (UA) & Bratislava (EU). Connected to Google Cloud ambient infrastructure with zero-trust isolation.',

    voiceTapToSpeak: 'TAP TO SPEAK',
    voiceListening: 'LISTENING...',
    voiceSpeaking: 'NEURAL VOICE',
    voiceSublabel: '[ LIVE NEURAL VOICE ]',
    voiceStatusReady: 'Eva (Lead Frontend) & Adam (Chief Backend) listening * Web Speech API Ready',
    voiceStatusListening: 'Speech recognition active... Speak clearly into microphone.',
    voiceStatusSpeaking: 'Neural audio synthesis active * Transmitting voice response.',

    personaEvaLabel: '[F] EVA [Lead Frontend & UX Director]',
    personaAdamLabel: '[M] ADAM [Chief Backend & Cloud Architect]',
    personaDualLabel: '[DUAL] EVA & ADAM [Synergistic Co-Pilots]',

    modeChatLabel: 'CHAT // Direct Model Interaction',
    modeDialogLabel: 'DIALOG // Bilateral Debate (Eva vs Adam)',
    modeInterviewLabel: 'INTERVIEW // Structured Technical/Executive Q&A',
    modeConsiliumLabel: 'CONSILIUM // Multi-Agent Executive Council',

    badgeFree: '[FREE] 100% FREE QUOTA',
    badgePaid: '[PAID] PAID / PAYG',

    noticePersonaSwitched: 'Active Co-Pilot Persona switched to',
    noticeModeSwitched: 'Operational Mode switched to',
    noticeModelSwitched: 'Neural Model switched to',
    noticeDbSwitched: 'Knowledge Base & Database routed to',
    noticeRoleSwitched: 'Specialist Role activated:',
    noticeKeySaved: 'Custom Google API Key securely saved to browser localStorage.',
    noticeKeyCleared: 'Reverted to Google Cloud ambient auto-authentication.',
    noticeChatCleared: 'Terminal chat stream purged.',
    copiedBtn: 'COPIED',
    copyBtn: 'COPY',
  },
  uk: {
    appTitle: 'EVABOT // КІБЕР-ТЕРМІНАЛ ТА НЕЙРО-ГОЛОСОВИЙ ХАБ',
    statusOnline: 'В МЕРЕЖІ',
    statusBusy: 'ГЕНЕРАЦІЯ',
    statusError: 'ПОМИЛКА',
    returnTerminalBtn: '[ ↑ ПОВЕРНУТИСЯ ДО ТЕРМІНАЛУ ]',
    clearChatBtn: '[ ОЧИСТИТИ ]',
    transmitBtn: '[ ВІДПРАВИТИ ↵ ]',
    stopBtn: '[ ЗУПИНИТИ ! ]',
    inputPlaceholder: 'Введіть запит або команду (напр. /help, /persona, /mode, /models, /db)...',
    welcomeHeading: 'НЕЙРОННИЙ КІБЕР-ТЕРМІНАЛ EVABOT // СИСТЕМУ ІНІЦІАЛІЗОВАНО',
    welcomeNotice:
      'Сесія активна. Монохромний кібер-термінал активовано. Створено в Одесі, Україна (UA). Підключено до хмарної інфраструктури Google Cloud із Zero-Trust автентифікацією.',

    voiceTapToSpeak: 'НАТИСНІТЬ ДЛЯ ГОЛОСУ',
    voiceListening: 'СЛУХАЮ...',
    voiceSpeaking: 'НЕЙРО-ГОЛОС',
    voiceSublabel: '[ ЖИВИЙ НЕЙРО-ГОЛОС ]',
    voiceStatusReady: 'Єва (FrontEnd) та Адам (BackEnd) на зв’язку * Web Speech API готовий',
    voiceStatusListening: 'Розпізнавання голосу активне... Говоріть у мікрофон.',
    voiceStatusSpeaking: 'Нейронний синтез голосу активний * Відтворення аудіо.',

    personaEvaLabel: '[F] ЄВА [Головний FrontEnd & UX Архітектор]',
    personaAdamLabel: '[M] АДАМ [Головний BackEnd & Cloud Архітектор]',
    personaDualLabel: '[DUAL] ЄВА & АДАМ [Тандем Full-Stack Ко-Пілотів]',

    modeChatLabel: 'ЧАТ // Прямий діалог з моделлю',
    modeDialogLabel: 'ДІАЛОГ // Двосторонні дебати (Єва проти Адама)',
    modeInterviewLabel: "ІНТЕРВ'Ю // Структурована співбесіда та оцінювання",
    modeConsiliumLabel: 'КОНСИЛІУМ // Багатоагентна рада директорів',

    badgeFree: '[БЕЗКОШТОВНО] 100% КВОТА',
    badgePaid: '[ПЛАТНО] PAYG',

    noticePersonaSwitched: 'Активну персону змінено на',
    noticeModeSwitched: 'Режим роботи змінено на',
    noticeModelSwitched: 'Нейронну модель переключено на',
    noticeDbSwitched: 'Базу знань та даних переключено на',
    noticeRoleSwitched: 'Активовано професійну роль:',
    noticeKeySaved: 'Власний Google API ключ успішно збережено в браузері.',
    noticeKeyCleared: 'Повернуто автоматичну авторизацію Google Cloud.',
    noticeChatCleared: 'Історію термінала очищено.',
    copiedBtn: 'СКОПІЙОВАНО',
    copyBtn: 'КОПІЮВАТИ',
  },
  ru: {
    appTitle: 'EVABOT // КИБЕР-ТЕРМИНАЛ И НЕЙРО-ГОЛОСОВОЙ ХАБ',
    statusOnline: 'В СЕТИ',
    statusBusy: 'ГЕНЕРАЦИЯ',
    statusError: 'ОШИБКА',
    returnTerminalBtn: '[ ↑ ВЕРНУТЬСЯ В ТЕРМИНАЛ ]',
    clearChatBtn: '[ ОЧИСТИТЬ ]',
    transmitBtn: '[ ОТПРАВИТЬ ↵ ]',
    stopBtn: '[ ОСТАНОВИТЬ ! ]',
    inputPlaceholder: 'Введите запрос или команду (напр. /help, /persona, /mode, /models, /db)...',
    welcomeHeading: 'НЕЙРОННЫЙ КИБЕР-ТЕРМИНАЛ EVABOT // СИСТЕМА ИНИЦИАЛИЗИРОВАНА',
    welcomeNotice:
      'Сессия активна. Монохромный кибер-терминал готов к работе. Базируется в Одессе, Украина (UA). Подключено к инфраструктуре Google Cloud с Zero-Trust аутентификацией.',

    voiceTapToSpeak: 'НАЖМИТЕ ДЛЯ ГОЛОСА',
    voiceListening: 'СЛУШАЮ...',
    voiceSpeaking: 'НЕЙРО-ГОЛОС',
    voiceSublabel: '[ ЖИВОЙ НЕЙРО-ГОЛОС ]',
    voiceStatusReady: 'Ева (FrontEnd) и Адам (BackEnd) на связи * Web Speech API готов',
    voiceStatusListening: 'Распознавание речи активно... Говорите в микрофон.',
    voiceStatusSpeaking: 'Нейронный синтез речи активен * Передача аудио-ответа.',

    personaEvaLabel: '[F] ЕВА [Главный FrontEnd & UX Архитектор]',
    personaAdamLabel: '[M] АДАМ [Главный BackEnd & Cloud Архитектор]',
    personaDualLabel: '[DUAL] ЕВА & АДАМ [Тандем Full-Stack Ко-Пилотов]',

    modeChatLabel: 'ЧАТ // Прямой диалог с моделью',
    modeDialogLabel: 'ДИАЛОГ // Двусторонние дебаты (Ева против Адама)',
    modeInterviewLabel: 'ИНТЕРВЬЮ // Структурированное собеседование и скоринг',
    modeConsiliumLabel: 'КОНСИЛИУМ // Многоагентный совет директоров',

    badgeFree: '[БЕСПЛАТНО] 100% КВОТА',
    badgePaid: '[ПЛАТНО] PAYG',

    noticePersonaSwitched: 'Активная персона переключена на',
    noticeModeSwitched: 'Режим работы переключен на',
    noticeModelSwitched: 'Нейронная модель переключена на',
    noticeDbSwitched: 'База знаний и БД переключена на',
    noticeRoleSwitched: 'Активирована корпоративная роль:',
    noticeKeySaved: 'Пользовательский Google API ключ сохранен в браузере.',
    noticeKeyCleared: 'Возвращена автоматическая авторизация Google Cloud.',
    noticeChatCleared: 'История терминала очищена.',
    copiedBtn: 'СКОПИРОВАНО',
    copyBtn: 'КОПИРОВАТЬ',
  },
};

// ===========================================================================
// SmartInput — pure lexicon / fuzzy-match / auto-correct engine.
// Mirrors the inline engine in public/index.html so both stay in sync.
// Storage: 'evabot_vocab' (learned words, freq+recency), 'evabot_lexicon'
// (learned corrections), 'evabot_autocorrect' (on|off toggle).
// ===========================================================================
interface VocabMeta {
  f: number;
  t: number;
}

interface AutocorrectResult {
  text: string;
  fixes: { from: string; to: string }[];
}

export const SmartInput = {
  VOCAB_KEY: 'evabot_vocab',
  LEXICON_KEY: 'evabot_lexicon',
  AC_KEY: 'evabot_autocorrect',
  VOCAB_CAP: 500,

  levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    const m = a.length;
    const n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = new Array<number>(n + 1);
    let cur = new Array<number>(n + 1);
    for (let j = 0; j <= n; j++) prev[j] = j;
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  },

  // Simple subsequence scorer: 0 = no match, higher = better (prefix & streak bonuses)
  subsequenceScore(query: string, target: string): number {
    const q = query.toLowerCase();
    const t = target.toLowerCase();
    let qi = 0;
    let score = 0;
    let streak = 0;
    for (let i = 0; i < t.length && qi < q.length; i++) {
      if (t[i] === q[qi]) {
        qi++;
        streak++;
        score += 2 + streak;
        if (i === 0) score += 3;
      } else {
        streak = 0;
      }
    }
    if (qi < q.length) return 0;
    if (t.startsWith(q)) score += 20 - Math.min(10, t.length - q.length);
    return score;
  },

  loadVocab(): Record<string, VocabMeta> {
    try {
      return (JSON.parse(localStorage.getItem(this.VOCAB_KEY) || '{}') || {}) as Record<string, VocabMeta>;
    } catch {
      return {};
    }
  },

  vocabScore(meta: VocabMeta): number {
    const days = (Date.now() - (meta.t || 0)) / 86400000;
    return (meta.f || 1) / (1 + Math.max(0, days));
  },

  saveVocab(vocab: Record<string, VocabMeta>): void {
    let entries = Object.entries(vocab);
    if (entries.length > this.VOCAB_CAP) {
      entries.sort((a, b) => this.vocabScore(b[1]) - this.vocabScore(a[1]));
      entries = entries.slice(0, this.VOCAB_CAP);
    }
    const out: Record<string, VocabMeta> = {};
    for (const [w, meta] of entries) out[w] = meta;
    try {
      localStorage.setItem(this.VOCAB_KEY, JSON.stringify(out));
    } catch {
      // quota — ignore
    }
  },

  rememberText(text: string): void {
    const clean = String(text || '').replace(/\/\S+/g, ' ');
    const words = clean.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}'’-]{2,}/gu) || [];
    if (!words.length) return;
    const vocab = this.loadVocab();
    for (const w of words) {
      vocab[w] = { f: (vocab[w]?.f || 0) + 1, t: Date.now() };
    }
    this.saveVocab(vocab);
  },

  lexiconSet(): Set<string> {
    const set = new Set<string>([
      'omniroute', 'openrouter', 'litellm', 'gemini', 'qwen', 'glm', 'evabot', 'evaline',
      'consilium', 'terminal', 'models', 'history', 'server', 'servers', 'health', 'status',
      'tokens', 'budget', 'frontend', 'backend', 'github', 'docker', 'deploy',
      'привет', 'привіт', 'спасибо', 'дякую', 'проверь', 'перевір', 'модель', 'модели', 'моделі',
      'сервер', 'сервера', 'серверы', 'сервери', 'консилиум', 'консиліум', 'нейросеть',
      'нейромережа', 'история', 'історія', 'статус', 'ошибка', 'помилка', 'токены', 'токени',
    ]);
    try {
      const learned = JSON.parse(localStorage.getItem(this.LEXICON_KEY) || '{}') || {};
      for (const w of Object.keys(learned)) set.add(w.toLowerCase());
    } catch {
      // ignore
    }
    return set;
  },

  learnCorrection(word: string): void {
    try {
      const learned = JSON.parse(localStorage.getItem(this.LEXICON_KEY) || '{}') || {};
      learned[word.toLowerCase()] = (learned[word.toLowerCase()] || 0) + 1;
      localStorage.setItem(this.LEXICON_KEY, JSON.stringify(learned));
    } catch {
      // ignore
    }
  },

  isEnabled(): boolean {
    return localStorage.getItem(this.AC_KEY) !== 'off';
  },

  setEnabled(v: boolean): void {
    localStorage.setItem(this.AC_KEY, v ? 'on' : 'off');
  },

  // Mask code fences & URLs so corrections never touch them.
  protectSegments(text: string): { text: string; masked: string[]; restore: (s: string) => string } {
    const masked: string[] = [];
    const stash = (m: string): string => {
      masked.push(m);
      return '￰' + (masked.length - 1) + '￰';
    };
    let out = text.replace(/```[\s\S]*?(?:```|$)/g, stash);
    out = out.replace(/https?:\/\/\S+|www\.\S+/gi, stash);
    return {
      text: out,
      masked,
      restore: (s: string) => s.replace(/￰(\d+)￰/g, (_, i) => (masked[Number(i)] !== undefined ? masked[Number(i)] : '')),
    };
  },

  matchCase(word: string, candidate: string): string {
    if (word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase() && word.slice(1) === word.slice(1).toLowerCase()) {
      return candidate[0].toUpperCase() + candidate.slice(1);
    }
    return candidate;
  },

  // Unique best candidate within edit distance budget, else null.
  correctWord(word: string, dict: Set<string>): string | null {
    if (word.length < 5 || dict.has(word)) return null;
    const maxDist = word.length >= 8 ? 2 : 1;
    let best: string | null = null;
    let bestDist = maxDist + 1;
    let ties = 0;
    for (const cand of dict) {
      if (Math.abs(cand.length - word.length) > maxDist) continue;
      const d = this.levenshtein(word, cand);
      if (d < bestDist) {
        bestDist = d;
        best = cand;
        ties = 1;
      } else if (d === bestDist && cand !== best) {
        ties++;
      }
    }
    if (best && bestDist <= maxDist && ties === 1) return best;
    return null;
  },

  // '/hist' → '/history', '/модел' → '/models' (prefix → translit → fuzzy)
  TRANSLIT: {
    'топ': 'top', 'модели': 'models', 'моделі': 'models', 'модел': 'models', 'модель': 'models',
    'история': 'history', 'історія': 'history', 'очистить': 'clear', 'очистити': 'clear',
    'помощь': 'help', 'справка': 'help', 'довідка': 'help', 'консилиум': 'consilium',
    'консиліум': 'consilium', 'язык': 'lang', 'мова': 'lang',
  } as Record<string, string>,

  fixCommand(token: string): string | null {
    const COMMANDS = ['help', '?', 'top', 'models', 'info', 'company', 'evaline', 'cost', 'lang', 'mcp', 'lsp', 'free', 'paid', 'mode', 'consilium', 'clear', 'history', 'autocorrect', 'voice', 'tts', 'persona', 'model', 'db', 'preset', 'compare', 'menu', 'boot', 'config', 'dev', 'ansi', 'onboarding'];
    if (!token || !token.startsWith('/')) return null;
    const raw = token.slice(1).toLowerCase();
    if (!raw) return null;
    if (COMMANDS.includes(raw)) return null;
    let target = raw;
    if (this.TRANSLIT[target]) target = this.TRANSLIT[target];
    if (COMMANDS.includes(target) && target !== raw) return '/' + target;
    const pref = COMMANDS.filter((c) => c.startsWith(target));
    if (pref.length === 1) return '/' + pref[0];
    const maxDist = target.length >= 4 ? 2 : 1;
    let best: string | null = null;
    let bestDist = maxDist + 1;
    let ties = 0;
    for (const c of COMMANDS) {
      if (c[0] !== target[0]) continue;
      const d = this.levenshtein(target, c);
      if (d < bestDist) {
        bestDist = d;
        best = c;
        ties = 1;
      } else if (d === bestDist) {
        ties++;
      }
    }
    return best && bestDist <= maxDist && ties === 1 ? '/' + best : null;
  },

  // Punctuation spacing (safe for "3.14", "19:10", "e.g")
  normalizePunct(text: string): string {
    return text
      .replace(/[ \t]+([,.!?;:%)])/g, '$1')
      .replace(/([,;:])(?=[^\s\d)])/g, '$1 ')
      .replace(/([!?])(?=[^\s\d)])/g, '$1 ')
      .replace(/([а-яёіїєґa-z]{2,})\.([А-ЯЁЄІЇҐA-Z])/g, '$1. $2')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+$/gm, '');
  },

  // Main pass: command expansion + punctuation + word-level correction.
  // Returns { text, fixes }. Never alters code fences / URLs.
  autocorrect(text: string): AutocorrectResult {
    const fixes: { from: string; to: string }[] = [];
    if (!text || !text.trim()) return { text, fixes };
    const prot = this.protectSegments(text);
    let out = prot.text;

    const cmdMatch = out.match(/^\s*(\/[^\s]+)/);
    if (cmdMatch) {
      const fixed = this.fixCommand(cmdMatch[1]);
      if (fixed) {
        fixes.push({ from: cmdMatch[1], to: fixed });
        out = fixed + out.slice(out.indexOf(cmdMatch[1]) + cmdMatch[1].length);
      }
    }

    out = this.normalizePunct(out);

    const dict = this.lexiconSet();
    const vocab = this.loadVocab();
    for (const w of Object.keys(vocab)) dict.add(w.toLowerCase());
    out = out
      .split(/(￰\d+￰)/g)
      .map((seg) => {
        if (/^￰\d+￰$/.test(seg)) return seg;
        return seg.replace(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu, (w) => {
          const lw = w.toLowerCase();
          if (lw.length < 5 || dict.has(lw)) return w;
          const c = this.correctWord(lw, dict);
          if (c) {
            const fixedWord = this.matchCase(w, c);
            fixes.push({ from: w, to: fixedWord });
            this.learnCorrection(c);
            return fixedWord;
          }
          return w;
        });
      })
      .join('');

    return { text: prot.restore(out), fixes };
  },
};

export class EvaBotWebApp {
  private messages: WebMessage[] = [];
  private currentLang: Lang = 'en';
  private currentPersona: PersonaId = 'dual';
  private currentMode: ModeId = 'chat';
  private currentModel: string = 'gemini-2.5-flash';
  private currentDb: DbId = 'hybrid';
  private customDbUri: string = '';
  private currentRole: RoleId = 'eva_frontend';
  private consiliumCount: number = 5;
  private consiliumPreset: 'top10_paid' | 'top10_free' | null = null;

  private isGenerating: boolean = false;
  private abortController: AbortController | null = null;
  private serverUptimeSec: number = 0;
  private serverMemoryMb: number = 32;
  private lastLatencyMs: number = 4;
  private sessionTotalTokens: number = 0;
  private sessionTotalCostUSD: number = 0;
  private sessionTotalCostEUR: number = 0;
  private authSource: string = 'Google Cloud Ambient';
  private userAccount: string = 'evabot.online@gmail.com';
  private uptimeInterval: number | null = null;

  private isRecording: boolean = false;
  private speechRecognition: any = null;
  private isSpeaking: boolean = false;
  private voiceDockUI: VoiceDockUI | null = null;

  // Developer Mode (client side) + server runtime flag
  private devMode: boolean = false;
  private serverDevMode: boolean = false;

  // Progressive onboarding + rotating newbie tips
  private onboarding: OnboardingHandler | null = null;
  private onbCtx: OnboardingCtx | null = null;
  private tipCursor: number = 0;
  private chatAcc: string = '';
  private fontStep: number = 16;

  // Discrete font sizes for the universal UI (quick-menu toggle)
  private static readonly FONT_SIZES: number[] = [8, 10, 12, 14, 16, 18, 20, 22, 24];

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const savedLang = localStorage.getItem('evabot_lang') as Lang;
    if (savedLang && (savedLang === 'en' || savedLang === 'uk' || savedLang === 'ru')) {
      this.currentLang = savedLang;
    }

    const savedPersona = localStorage.getItem('evabot_persona') as PersonaId;
    if (savedPersona && (savedPersona === 'eva' || savedPersona === 'adam' || savedPersona === 'dual')) {
      this.currentPersona = savedPersona;
    }

    const savedMode = localStorage.getItem('evabot_mode') as ModeId;
    if (
      savedMode &&
      (savedMode === 'chat' || savedMode === 'dialog' || savedMode === 'interview' || savedMode === 'consilium')
    ) {
      this.currentMode = savedMode;
    }

    this.devMode = localStorage.getItem('evabot_dev_mode') === '1';
    if (this.devMode) document.body.classList.add('dev-mode');

    const savedFont = Number(localStorage.getItem('evabot_font_size') || '16');
    if (EvaBotWebApp.FONT_SIZES.includes(savedFont)) this.applyFontSize(savedFont);

    this.setupEventListeners();
    this.setupVoiceEngine();
    await CatalogStore.load();
    if (CatalogStore.isLoaded()) {
      this.currentModel = CatalogStore.getById(this.currentModel) ? this.currentModel : CatalogStore.getDefault();
    }
    this.populateModelSelector();
    this.applyLanguage();
    this.updatePersonaUI();
    this.updateModeUI();
    this.updateDbUI();
    this.updateRoleUI();
    this.updateModelDetailsUI();
    this.updateKeyStatusUI();
    this.startTelemetryLoop();

    this.voiceDockUI = new VoiceDockUI();
    this.voiceDockUI.init().catch((e) => console.warn('[App] VoiceDockUI init warning:', e));

    await this.checkHealth();
    await this.renderStartupSequence();

    if (!OnboardingHandler.isDone()) {
      this.renderOnboarding();
    }
  }

  private t(): TranslationStrings {
    return TRANSLATIONS[this.currentLang];
  }

  public setLanguage(lang: Lang): void {
    if (lang === this.currentLang) return;
    this.currentLang = lang;
    localStorage.setItem('evabot_lang', lang);
    this.applyLanguage();
    this.updatePersonaUI();
    this.updateModeUI();
    this.updateModelDetailsUI();
    this.updateKeyStatusUI();
    this.updateTelemetryUI();

    if (this.messages.length <= 2) {
      this.messages = [];
      const container = document.getElementById('messages-container');
      if (container) container.innerHTML = '';
      this.renderStartupSequence();
    }
  }

  private applyLanguage(): void {
    const t = this.t();

    ['en', 'uk', 'ru'].forEach((l) => {
      const btn = document.getElementById(`lang-btn-${l}`);
      if (btn) {
        btn.className = l === this.currentLang ? 'lang-btn active' : 'lang-btn';
      }
    });

    document.title = `${t.appTitle} // [${this.currentPersona.toUpperCase()}]`;

    const input = document.getElementById('user-input') as HTMLTextAreaElement;
    if (input) {
      input.placeholder = t.inputPlaceholder;
    }

    const orbLabel = document.getElementById('orb-label');
    if (orbLabel && !this.isRecording && !this.isSpeaking) {
      orbLabel.textContent = t.voiceTapToSpeak;
    }

    const orbSublabel = document.getElementById('orb-sublabel');
    if (orbSublabel && !this.isRecording && !this.isSpeaking) {
      orbSublabel.textContent = t.voiceSublabel;
    }

    const voiceFeedback = document.getElementById('voice-status-feedback');
    if (voiceFeedback && !this.isRecording && !this.isSpeaking) {
      voiceFeedback.textContent = t.voiceStatusReady;
    }

    this.updateSendButtonState(this.isGenerating);
  }

  private setupEventListeners(): void {
    document.getElementById('lang-btn-en')?.addEventListener('click', () => this.setLanguage('en'));
    document.getElementById('lang-btn-uk')?.addEventListener('click', () => this.setLanguage('uk'));
    document.getElementById('lang-btn-ru')?.addEventListener('click', () => this.setLanguage('ru'));

    document.querySelectorAll<HTMLElement>('[data-qm-lang]').forEach((el) => {
      el.addEventListener('click', () => {
        const l = el.getAttribute('data-qm-lang');
        if (l === 'en' || l === 'uk' || l === 'ru') this.setLanguage(l);
        this.setQuickMenuOpen(false);
      });
    });

    const toTerminalBtn = document.getElementById('scroll-to-terminal-btn');
    const deckSection = document.getElementById('screen-control-deck');
    const terminalSection = document.getElementById('screen-terminal');

    const menuBtn = document.getElementById('menu-btn');
    menuBtn?.addEventListener('click', () => {
      this.setQuickMenuOpen(!this.isQuickMenuOpen());
    });

    document.querySelectorAll<HTMLElement>('[data-qm]').forEach((el) => {
      el.addEventListener('click', () => {
        const action = el.getAttribute('data-qm');
        if (action === 'close') {
          this.setQuickMenuOpen(false);
        } else if (action === 'onboarding') {
          this.setQuickMenuOpen(false);
          this.onboardingReplay();
        } else if (action === 'clear') {
          this.setQuickMenuOpen(false);
          this.clearTerminal();
        } else if (action === 'deck') {
          this.setQuickMenuOpen(false);
          deckSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (action === 'row') {
          const idx = parseInt(el.getAttribute('data-qm-index') || '0', 10);
          this.setQuickMenuOpen(false);
          this.openDeckRow(idx);
        } else if (action === 'dev') {
          this.setDevMode(!this.devMode);
        }
      });
    });

    document.querySelectorAll<HTMLElement>('[data-font-size]').forEach((el) => {
      el.addEventListener('click', () => {
        this.applyFontSize(parseInt(el.getAttribute('data-font-size') || '16', 10));
      });
    });

    const devToggleDeck = document.getElementById('devmode-toggle-deck');
    devToggleDeck?.addEventListener('click', () => this.setDevMode(!this.devMode));

    document.querySelectorAll<HTMLElement>('[data-onb-replay]').forEach((el) => {
      el.addEventListener('click', () => this.onboardingReplay());
    });

    toTerminalBtn?.addEventListener('click', () => {
      terminalSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (this.isQuickMenuOpen()) {
          this.setQuickMenuOpen(false);
        } else if (deckSection && terminalSection) {
          const rect = deckSection.getBoundingClientRect();
          if (rect.top >= 0 && rect.top < window.innerHeight) {
            terminalSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    });

    document.getElementById('header-persona-pill')?.addEventListener('click', () => {
      const cycle: Record<PersonaId, PersonaId> = {
        eva: 'adam',
        adam: 'dual',
        dual: 'eva',
      };
      this.setPersona(cycle[this.currentPersona]);
    });

    document.querySelectorAll<HTMLElement>('#persona-selector-group [data-persona]').forEach((el) => {
      el.addEventListener('click', () => {
        const p = el.getAttribute('data-persona') as PersonaId;
        if (p) this.setPersona(p);
      });
    });

    document.querySelectorAll<HTMLElement>('#mode-selector-group [data-mode]').forEach((el) => {
      el.addEventListener('click', () => {
        const m = el.getAttribute('data-mode') as ModeId;
        if (m) this.setMode(m);
      });
    });

    const consiliumSlider = document.getElementById('deck-consilium-count') as HTMLInputElement;
    const consiliumVal = document.getElementById('consilium-count-val');
    consiliumSlider?.addEventListener('input', (e) => {
      const val = parseInt((e.target as HTMLInputElement).value, 10) || 5;
      this.consiliumCount = val;
      if (consiliumVal) consiliumVal.textContent = String(val);
      this.consiliumPreset = null;
      this.updatePresetButtonsUI();
    });

    document.getElementById('btn-preset-top10-paid')?.addEventListener('click', () => {
      this.consiliumPreset = 'top10_paid';
      this.consiliumCount = 10;
      localStorage.setItem('evabot_consilium', 'top10_paid');
      if (consiliumSlider) consiliumSlider.value = '10';
      if (consiliumVal) consiliumVal.textContent = '10';
      this.updatePresetButtonsUI();
      this.addSystemNotification(renderNotice('Preset activated: **Top-10 Smartest Paid Models** (10 participants)'));
    });

    document.getElementById('btn-preset-top10-free')?.addEventListener('click', () => {
      this.consiliumPreset = 'top10_free';
      this.consiliumCount = 10;
      localStorage.setItem('evabot_consilium', 'top10_free');
      if (consiliumSlider) consiliumSlider.value = '10';
      if (consiliumVal) consiliumVal.textContent = '10';
      this.updatePresetButtonsUI();
      this.addSystemNotification(renderNotice('Preset activated: **Top-10 Free Quota Models** (10 participants)'));
    });

    document.querySelectorAll<HTMLElement>('#db-selector-group [data-db]').forEach((el) => {
      el.addEventListener('click', () => {
        const db = el.getAttribute('data-db') as DbId;
        if (db) this.setDb(db);
      });
    });

    const customDbInput = document.getElementById('custom-db-uri-input') as HTMLInputElement;
    customDbInput?.addEventListener('change', () => {
      this.customDbUri = customDbInput.value.trim();
      if (this.customDbUri) {
        this.addSystemNotification(
          renderNotice(`Custom Company Database connected: \`${this.customDbUri.replace(/:[^:@]+@/, ':****@')}\``),
        );
      }
    });

    document.querySelectorAll<HTMLElement>('#roles-selector-group [data-role]').forEach((el) => {
      el.addEventListener('click', () => {
        const role = el.getAttribute('data-role') as RoleId;
        if (role) this.setRole(role);
      });
    });

    const modelSelect = document.getElementById('deck-model-select') as HTMLSelectElement;
    modelSelect?.addEventListener('change', (e) => {
      this.currentModel = (e.target as HTMLSelectElement).value;
      localStorage.setItem('evabot_model', this.currentModel);
      this.updateModelDetailsUI();
      const m = CatalogStore.getById(this.currentModel);
      this.addSystemNotification(renderNotice(`${this.t().noticeModelSwitched} **${m?.name || this.currentModel}**`));
    });

    document.getElementById('header-model-pill')?.addEventListener('click', () => {
      deckSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const saveKeyBtn = document.getElementById('deck-save-key-btn');
    const clearKeyBtn = document.getElementById('deck-clear-key-btn');
    const apiKeyInput = document.getElementById('deck-api-key-input') as HTMLInputElement;

    saveKeyBtn?.addEventListener('click', () => {
      const val = apiKeyInput?.value.trim() || '';
      if (val) {
        localStorage.setItem('evabot_gemini_key', val);
        this.voiceDockUI?.setApiKey(val);
        this.addSystemNotification(this.t().noticeKeySaved);
      }
      this.updateKeyStatusUI();
    });

    clearKeyBtn?.addEventListener('click', () => {
      localStorage.removeItem('evabot_gemini_key');
      this.voiceDockUI?.setApiKey('');
      if (apiKeyInput) apiKeyInput.value = '';
      this.addSystemNotification(this.t().noticeKeyCleared);
      this.updateKeyStatusUI();
    });

    document.getElementById('clear-btn')?.addEventListener('click', () => {
      this.clearTerminal();
    });

    const form = document.getElementById('chat-form') as HTMLFormElement;
    const input = document.getElementById('user-input') as HTMLTextAreaElement;

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSend();
    });

    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.handleSend();
      }
    });

    document.getElementById('voice-orb')?.addEventListener('click', () => {
      this.toggleVoiceRecording();
    });
  }

  // ===========================================================================
  // VOICE ENGINE (Web Speech Recognition & Synthesis)
  // ===========================================================================
  private setupVoiceEngine(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      const feedback = document.getElementById('voice-status-feedback');
      if (feedback) feedback.textContent = 'Web Speech API not supported in this browser. (Use Chrome/Edge or type prompts)';
      return;
    }

    try {
      this.speechRecognition = new SpeechRecognition();
      this.speechRecognition.continuous = false;
      this.speechRecognition.interimResults = true;
      this.speechRecognition.maxAlternatives = 1;

      this.speechRecognition.onstart = () => {
        this.isRecording = true;
        const orb = document.getElementById('voice-orb');
        const orbIcon = document.getElementById('orb-icon');
        const orbLabel = document.getElementById('orb-label');
        const orbSublabel = document.getElementById('orb-sublabel');
        const feedback = document.getElementById('voice-status-feedback');

        if (orb) orb.classList.add('listening');
        if (orbIcon) orbIcon.textContent = '[REC]';
        if (orbLabel) orbLabel.textContent = this.t().voiceListening;
        if (orbSublabel) orbSublabel.textContent = '[ LISTENING... ]';
        if (feedback) feedback.textContent = this.t().voiceStatusListening;
      };

      this.speechRecognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const transcript = final || interim;
        const input = document.getElementById('user-input') as HTMLTextAreaElement;
        if (input && transcript) {
          input.value = transcript;
        }

        if (final && final.trim()) {
          this.stopVoiceRecording();
          if (this.processVoiceCommand(final.trim())) return;
          setTimeout(() => {
            this.handleSend();
          }, 300);
        }
      };

      this.speechRecognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        this.stopVoiceRecording();
      };

      this.speechRecognition.onend = () => {
        this.stopVoiceRecording();
      };
    } catch (e) {
      console.warn('SpeechRecognition initialization error:', e);
    }
  }

  private toggleVoiceRecording(): void {
    if (this.isRecording) {
      this.stopVoiceRecording();
    } else {
      this.startVoiceRecording();
    }
  }

  private startVoiceRecording(): void {
    if (!this.speechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your prompt in the command line.');
      return;
    }
    try {
      const langCode = this.currentLang === 'uk' ? 'uk-UA' : this.currentLang === 'ru' ? 'ru-RU' : 'en-US';
      this.speechRecognition.lang = langCode;
      this.speechRecognition.start();
    } catch (e) {
      console.warn('Failed to start speech recognition:', e);
      this.stopVoiceRecording();
    }
  }

  private stopVoiceRecording(): void {
    this.isRecording = false;
    try {
      this.speechRecognition?.stop();
    } catch {
      // ignore
    }

    const orb = document.getElementById('voice-orb');
    const orbIcon = document.getElementById('orb-icon');
    const orbLabel = document.getElementById('orb-label');
    const orbSublabel = document.getElementById('orb-sublabel');
    const feedback = document.getElementById('voice-status-feedback');

    if (orb) orb.classList.remove('listening');
    if (orbIcon) orbIcon.textContent = '[MIC]';
    if (orbLabel) orbLabel.textContent = this.t().voiceTapToSpeak;
    if (orbSublabel) orbSublabel.textContent = this.t().voiceSublabel;
    if (feedback) feedback.textContent = this.t().voiceStatusReady;
  }

  // Voice-command router: wake-word prefix stripping ('ева', 'єва', 'eva', 'адам', 'adam'),
  // 'команда/command' prefix, then direct word map or fuzzy slash-command execution.
  // Returns true if the transcript was consumed as a command.
  private processVoiceCommand(rawTranscript: string): boolean {
    let rest = rawTranscript.toLowerCase().replace(/^[,.\s]+|[.!?…]+$/g, '').replace(/\s+/g, ' ').trim();
    rest = rest.replace(/^(ева|єва|eva|адам|adam)[,]?\s*/u, '').trim();
    if (!rest) return true; // bare wake word — consumed, no-op
    rest = rest.replace(/^(команда|команди|command)\s+/u, '').trim();
    if (rest.startsWith('/')) {
      const first = rest.split(/\s+/);
      const fixed = SmartInput.fixCommand(first[0]);
      const candidate = fixed ? [fixed, ...first.slice(1)].join(' ') : rest;
      return this.handleSlashCommand(candidate);
    }
    const voiceWords: Record<string, string> = {
      'очистить': '/clear', 'очисти': '/clear', 'очистити': '/clear', 'clear': '/clear', 'cls': '/clear',
      'помощь': '/help', 'справка': '/help', 'довідка': '/help', 'help': '/help',
      'модели': '/models', 'моделі': '/models', 'models': '/models',
      'о проекте': '/about', 'про проект': '/about', 'про нас': '/about', 'о нас': '/about', 'about': '/about',
      'режим': '/mode', 'mode': '/mode',
      'консилиум': '/consilium', 'консиліум': '/consilium', 'consilium': '/consilium',
    };
    const direct = voiceWords[rest];
    if (direct) return this.handleSlashCommand(direct);
    return false;
  }

  /** Detect language of text: Cyrillic with uk markers → uk, other Cyrillic → ru, else en. */
  private detectTextLanguage(text: string): string {
    if (!text) return 'en';
    if (/[\u0400-\u04FF]/.test(text)) {
      const lower = text.toLowerCase();
      const ukMarkers = (lower.match(/[іїєґ]/g) || []).length;
      const ukWords = ['привіт', 'будь ласка', 'дякую', 'скажи', 'як', 'що', 'це'];
      const ruWords = ['привет', 'пожалуйста', 'спасибо', 'как', 'что', 'это'];
      const ukScore = ukMarkers * 2 + ukWords.filter((w) => lower.includes(w)).length;
      const ruScore = ruWords.filter((w) => lower.includes(w)).length;
      if (ukScore > ruScore) return 'uk';
      if (ruScore > ukScore) return 'ru';
      return 'ru';
    }
    return 'en';
  }

  private speakVoiceResponse(text: string, persona: PersonaId): void {
    if (!window.speechSynthesis) return;
    if (localStorage.getItem('evabot_tts') === 'off') return;

    window.speechSynthesis.cancel();

    const cleanText = text
      .replace(/```[\s\S]*?```/g, ' [Code omitted] ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*_#~>|┌┐└┘├┤─│═]+/g, ' ')
      .replace(/https?:\/\/\S+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    const spokenSlice = cleanText.length > 350 ? `${cleanText.slice(0, 350)}...` : cleanText;
    const utterance = new SpeechSynthesisUtterance(spokenSlice);

    // Detect language from the text itself (LANGUAGE-FIRST)
    const detectedLang = this.detectTextLanguage(spokenSlice);
    const langCode = detectedLang === 'uk' ? 'uk-UA' : detectedLang === 'ru' ? 'ru-RU' : 'en-US';
    utterance.lang = langCode;

    if (persona === 'eva') {
      utterance.pitch = 1.12;
      utterance.rate = 1.05;
    } else if (persona === 'adam') {
      utterance.pitch = 0.85;
      utterance.rate = 0.95;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    // Persona voice heuristics: prefer known female/male voice names
    const voices = window.speechSynthesis.getVoices() || [];
    const langPool = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith(langCode.slice(0, 2).toLowerCase()));
    const pool = langPool.length ? langPool : voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
    const personaRe = persona === 'adam'
      ? /male|man|dmitri|pavel|alex|david|daniel|maxim|oleg|artem/i
      : /female|woman|alice|milena|tatyana|yuri|alena|katya|zira|susan|katia|olesya|svetlana|valentina|natalia/i;
    const picked = pool.find((v) => personaRe.test(v.name)) || pool[0];
    if (picked) utterance.voice = picked;

    const orb = document.getElementById('voice-orb');
    const orbLabel = document.getElementById('orb-label');
    const feedback = document.getElementById('voice-status-feedback');

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (orb) orb.classList.add('speaking');
      if (orbLabel) orbLabel.textContent = this.t().voiceSpeaking;
      if (feedback) feedback.textContent = this.t().voiceStatusSpeaking;
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (orb) orb.classList.remove('speaking');
      if (orbLabel) orbLabel.textContent = this.t().voiceTapToSpeak;
      if (feedback) feedback.textContent = this.t().voiceStatusReady;
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (orb) orb.classList.remove('speaking');
      if (orbLabel) orbLabel.textContent = this.t().voiceTapToSpeak;
    };

    window.speechSynthesis.speak(utterance);
  }

  // ===========================================================================
  // PERSONA, MODE, DB, ROLE
  // ===========================================================================
  public setPersona(persona: PersonaId): void {
    this.currentPersona = persona;
    localStorage.setItem('evabot_persona', persona);
    this.updatePersonaUI();
    if (this.voiceDockUI) {
      this.voiceDockUI.setPersona(persona === 'adam' ? 'adam' : 'eva');
    }
    const nameMap: Record<PersonaId, string> = {
      eva: '[F] EVA (Frontend & UX Director)',
      adam: '[M] ADAM (Chief Backend Architect)',
      dual: '[DUAL] EVA & ADAM (Full-Stack Co-Pilots)',
    };
    this.addSystemNotification(`${this.t().noticePersonaSwitched} ${nameMap[persona]}`);
  }

  private updatePersonaUI(): void {
    const t = this.t();
    const pill = document.getElementById('header-persona-name');
    if (pill) {
      if (this.currentPersona === 'eva') pill.textContent = t.personaEvaLabel;
      else if (this.currentPersona === 'adam') pill.textContent = t.personaAdamLabel;
      else pill.textContent = t.personaDualLabel;
    }

    document.querySelectorAll<HTMLElement>('#persona-selector-group [data-persona]').forEach((btn) => {
      const p = btn.getAttribute('data-persona');
      if (p === this.currentPersona) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateTelemetryUI();
  }

  public setMode(mode: ModeId): void {
    this.currentMode = mode;
    localStorage.setItem('evabot_mode', mode);
    this.updateModeUI();
    this.addSystemNotification(`${this.t().noticeModeSwitched} ${mode.toUpperCase()}`);
  }

  private updateModeUI(): void {
    const headerMode = document.getElementById('header-mode-badge');
    if (headerMode) headerMode.textContent = `MODE: ${this.currentMode.toUpperCase()}`;

    document.querySelectorAll<HTMLElement>('#mode-selector-group [data-mode]').forEach((btn) => {
      const m = btn.getAttribute('data-mode');
      if (m === this.currentMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    this.updateTelemetryUI();
  }

  private updatePresetButtonsUI(): void {
    const paidBtn = document.getElementById('btn-preset-top10-paid');
    const freeBtn = document.getElementById('btn-preset-top10-free');

    if (this.consiliumPreset === 'top10_paid') {
      paidBtn?.classList.add('active');
      freeBtn?.classList.remove('active');
    } else if (this.consiliumPreset === 'top10_free') {
      freeBtn?.classList.add('active');
      paidBtn?.classList.remove('active');
    } else {
      paidBtn?.classList.remove('active');
      freeBtn?.classList.remove('active');
    }
  }

  public setDb(db: DbId): void {
    this.currentDb = db;
    localStorage.setItem('evabot_db', db);
    this.updateDbUI();
    this.addSystemNotification(`${this.t().noticeDbSwitched} ${db.toUpperCase()}`);
  }

  private updateDbUI(): void {
    document.querySelectorAll<HTMLElement>('#db-selector-group [data-db]').forEach((btn) => {
      const d = btn.getAttribute('data-db');
      if (d === this.currentDb) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const tickerDb = document.getElementById('ticker-db');
    if (tickerDb) {
      const labels: Record<DbId, string> = {
        hybrid: 'HYBRID RAG',
        postgres: 'POSTGRES',
        qdrant: 'QDRANT VECTOR',
        ephemeral: 'EPHEMERAL',
      };
      tickerDb.textContent = labels[this.currentDb];
    }
  }

  public setRole(role: RoleId): void {
    this.currentRole = role;
    this.updateRoleUI();
    this.addSystemNotification(`${this.t().noticeRoleSwitched} ${role.toUpperCase()}`);
  }

  private updateRoleUI(): void {
    document.querySelectorAll<HTMLElement>('#roles-selector-group [data-role]').forEach((btn) => {
      const r = btn.getAttribute('data-role');
      if (r === this.currentRole) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // ===========================================================================
  // MODEL SELECTOR & SPECIFICATIONS
  // ===========================================================================
  private populateModelSelector(): void {
    const select = document.getElementById('deck-model-select') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';
    const categories = CatalogStore.getCategories();

    for (const cat of categories) {
      const models = CatalogStore.getByCategory(cat);
      if (!models || models.length === 0) continue;

      const group = document.createElement('optgroup');
      group.label = cat;

      for (const m of models) {
        const opt = document.createElement('option');
        opt.value = m.id;
        const isFree = m.pricing.freeTierStatus.includes('Free');
        opt.textContent = `${m.name} ${isFree ? '[FREE]' : '[PAID]'}`;
        if (m.id === this.currentModel) opt.selected = true;
        group.appendChild(opt);
      }
      select.appendChild(group);
    }
  }

  private updateModelDetailsUI(): void {
    const m = CatalogStore.getById(this.currentModel);
    if (!m) return;

    const isFree = m.pricing.freeTierStatus.includes('Free');

    const headerName = document.getElementById('header-model-name');
    if (headerName) headerName.textContent = m.name;

    const headerBadge = document.getElementById('header-model-badge');
    if (headerBadge) {
      headerBadge.textContent = isFree ? '[FREE]' : '[PAID]';
      headerBadge.style.color = isFree ? 'var(--clr-green)' : 'var(--clr-yellow)';
    }

    const tierBadge = document.getElementById('model-tier-badge');
    if (tierBadge) {
      tierBadge.textContent = isFree ? '🟢 100% FREE QUOTA ($0.00)' : '[PAID] PAID / PAYG';
      tierBadge.style.color = isFree ? 'var(--clr-green)' : 'var(--clr-yellow)';
    }

    const specUsd = document.getElementById('spec-usd');
    if (specUsd) specUsd.textContent = `In: ${m.pricing.inputPer1MTokensUSD} / Out: ${m.pricing.outputPer1MTokensUSD}`;

    const specEur = document.getElementById('spec-eur');
    if (specEur) specEur.textContent = `In: ${m.pricing.inputPer1MTokensEUR} / Out: ${m.pricing.outputPer1MTokensEUR}`;

    const specContext = document.getElementById('spec-context');
    if (specContext) specContext.textContent = `${m.contextWindow.toLocaleString()} tokens`;
  }

  private updateKeyStatusUI(): void {
    const statusEl = document.getElementById('deck-key-status');
    const input = document.getElementById('deck-api-key-input') as HTMLInputElement;
    const customKey = localStorage.getItem('evabot_gemini_key') || '';

    if (input && !input.value) {
      input.value = customKey;
    }

    if (statusEl) {
      if (customKey) {
        statusEl.textContent = '[OK] CUSTOM KEY ACTIVE';
        statusEl.style.color = 'var(--clr-green)';
      } else {
        statusEl.textContent = '[OK] GOOGLE AMBIENT AUTH';
        statusEl.style.color = 'var(--clr-green)';
      }
    }
  }

  // ===========================================================================
  // TELEMETRY
  // ===========================================================================
  private async checkHealth(): Promise<void> {
    const t0 = performance.now();
    const data = await fetchHealth();
    this.lastLatencyMs = Math.round(performance.now() - t0);
    if (!data) {
      this.lastLatencyMs = 999;
    } else {
      if (data.uptimeSeconds) this.serverUptimeSec = data.uptimeSeconds;
      if (data.memoryUsageMb) this.serverMemoryMb = data.memoryUsageMb;
      if (data.account) this.userAccount = data.account;
      if (data.authSource) this.authSource = data.authSource;
      if (typeof data.devMode === 'boolean') this.serverDevMode = data.devMode;
    }
    this.updateTelemetryUI();
  }

  private async fetchBootDiagnostics(): Promise<void> {
    const report = await fetchBootDiagnostics(this.currentModel);
    if (report && report.steps) {
      const tickerMsg = document.getElementById('boot-ticker-msg');
      if (tickerMsg) {
        tickerMsg.innerHTML = `
          <span style="color:var(--clr-green); font-weight:700;">[OK] INITIALIZED:</span>
          <span>All ${report.steps.length} Systems Healthy * Frankfurt [c3-std-8] & Iowa [e2-micro] Online (${report.totalDurationMs}ms)</span>
        `;
      }
    }
  }

  private startTelemetryLoop(): void {
    if (this.uptimeInterval !== null) window.clearInterval(this.uptimeInterval);
    this.uptimeInterval = window.setInterval(() => {
      this.serverUptimeSec += 1;
      this.updateTelemetryUI();
    }, 1000);

    window.setInterval(() => {
      this.checkHealth();
    }, 15000);
  }

  private updateTelemetryUI(): void {
    const uptimeEl = document.getElementById('telem-uptime');
    if (uptimeEl) {
      const hrs = Math.floor(this.serverUptimeSec / 3600);
      const mins = Math.floor((this.serverUptimeSec % 3600) / 60);
      const secs = this.serverUptimeSec % 60;
      uptimeEl.textContent = `${hrs}h ${mins}m ${secs}s`;
    }

    const memEl = document.getElementById('telem-memory');
    if (memEl) memEl.textContent = `${this.serverMemoryMb} MB`;

    const latEl = document.getElementById('telem-latency');
    if (latEl) latEl.textContent = `${this.lastLatencyMs} ms`;

    const tickerLat = document.getElementById('ticker-latency');
    if (tickerLat) tickerLat.textContent = `${this.lastLatencyMs}ms`;

    const tickerTokens = document.getElementById('ticker-tokens');
    if (tickerTokens) tickerTokens.textContent = this.sessionTotalTokens.toLocaleString();

    const tickerCost = document.getElementById('ticker-cost');
    if (tickerCost) tickerCost.textContent = `$${this.sessionTotalCostUSD.toFixed(4)} / €${this.sessionTotalCostEUR.toFixed(4)}`;

    const telemTokens = document.getElementById('telem-tokens');
    if (telemTokens) telemTokens.textContent = this.sessionTotalTokens.toLocaleString();

    const telemCost = document.getElementById('telem-cost');
    if (telemCost) telemCost.textContent = `$${this.sessionTotalCostUSD.toFixed(4)} / €${this.sessionTotalCostEUR.toFixed(4)}`;
  }

  // ===========================================================================
  // SCREEN TRANSITIONS & TERMINAL MESSAGES
  // ===========================================================================
  private activateChatRegion(): void {
    const chatRegion = document.getElementById('chat-stream-region');
    if (chatRegion) chatRegion.style.display = 'flex';
  }

  private renderStatusBarOnly(): void {
    const m = CatalogStore.getById(this.currentModel);
    const isFree = !!m && m.pricing.freeTierStatus === '100% Free Quota Available';
    const now = new Date().toLocaleTimeString();
    const status = renderStatusBar({
      model: this.currentModel,
      isFree,
      mode: this.currentMode,
      role: this.personaRoleLabel(),
      tokens: this.sessionTotalTokens,
      costUSD: this.sessionTotalCostUSD,
      costEUR: this.sessionTotalCostEUR,
      modelCount: CatalogStore.getAll().length,
    });
    this.appendMessage({ role: 'system', text: status, timestamp: now, ansi: true });
  }

  private personaRoleLabel(): string {
    if (this.currentPersona === 'eva') return '[F] EVA // FRONTEND & UX';
    if (this.currentPersona === 'adam') return '[M] ADAM // BACKEND & CLOUD';
    return '[DUAL] EVA & ADAM';
  }

  private clearTerminal(): void {
    this.messages = [];
    const container = document.getElementById('messages-container');
    if (container) container.innerHTML = '';
    this.renderStatusBarOnly();
    this.addSystemNotification(this.t().noticeChatCleared);
  }

  private async renderStartupSequence(): Promise<void> {
    const now = new Date().toLocaleTimeString();

    this.appendMessage({ role: 'system', text: renderBootBanner(), timestamp: now, ansi: true });
    this.appendMessage({ role: 'system', text: renderDiagnosticsProbe(), timestamp: now, ansi: true });

    const m = CatalogStore.getById(this.currentModel);
    const isFree = !!m && m.pricing.freeTierStatus === '100% Free Quota Available';
    const report = await fetchBootDiagnostics(this.currentModel);

    if (report && report.steps) {
      const steps = report.steps.map((s) => ({
        status: s.status === 'success' ? 'success' : s.status === 'failed' ? 'error' : 'warn',
        name: s.name,
        latencyMs: s.latencyMs,
        details: s.details,
      }));
      let body = renderDiagnostics(steps);
      body += `\n${renderNotice(`ALL DIAGNOSTIC CHECKS ${report.failed === 0 ? 'PASSED' : 'HAD FAILURES'} [Total: ${report.totalDurationMs}ms]`)}\n`;
      body += renderStatusBar({
        model: this.currentModel,
        isFree,
        mode: this.currentMode,
        role: this.personaRoleLabel(),
        tokens: this.sessionTotalTokens,
        costUSD: this.sessionTotalCostUSD,
        costEUR: this.sessionTotalCostEUR,
        modelCount: CatalogStore.getAll().length,
      });
      body += `\n${formatPrompt({ model: this.currentModel, mode: this.currentMode, role: this.currentRole })}${this.t().welcomeNotice}`;

      this.appendMessage({
        role: 'model',
        text: body,
        timestamp: now,
        ansi: true,
        metadata: {
          model: this.currentModel,
          persona: this.currentPersona,
          mode: this.currentMode,
        },
      });
    }
  }

  // ===========================================================================
  // SLASH COMMAND PARSER
  // ===========================================================================
  private handleSlashCommand(input: string): boolean {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return false;

    const [cmd, ...args] = trimmed.split(/\s+/);
    const argStr = args.join(' ').toLowerCase();

    if (cmd === '/help') {
      this.appendMessage({
        role: 'system',
        text: renderHelp(),
        timestamp: new Date().toLocaleTimeString(),
        ansi: true,
      });
      return true;
    }

    if (cmd === '/about') {
      this.appendMessage({
        role: 'system',
        text: renderAbout(),
        timestamp: new Date().toLocaleTimeString(),
        ansi: true,
      });
      return true;
    }

    if (cmd === '/persona') {
      if (argStr === 'eva' || argStr === 'adam' || argStr === 'dual') {
        this.setPersona(argStr as PersonaId);
      } else {
        this.addSystemNotification('Usage: `/persona <eva | adam | dual>`');
      }
      return true;
    }

    if (cmd === '/mode') {
      if (argStr === 'chat' || argStr === 'dialog' || argStr === 'interview' || argStr === 'consilium' || argStr === 'solo' || argStr === 'dialogue') {
        const mappedMode: ModeId = argStr === 'solo' ? 'chat' : argStr === 'dialogue' ? 'dialog' : (argStr as ModeId);
        this.setMode(mappedMode);
        this.addSystemNotification(`Operational mode switched to: ${mappedMode.toUpperCase()}`);
      } else {
        this.addSystemNotification(`Active mode: ${this.currentMode}. Usage: \`/mode <chat | dialog | interview | consilium>\``);
      }
      return true;
    }

    if (cmd === '/consilium') {
      const topic = args.join(' ').trim();
      this.setMode('consilium');
      if (topic) {
        const inputElem = document.getElementById('user-input') as HTMLTextAreaElement;
        if (inputElem) {
          inputElem.value = topic;
          void this.handleSend();
        } else {
          this.addSystemNotification(`Switched to CONSILIUM mode. Topic: "${topic}"`);
        }
      } else {
        this.addSystemNotification('Switched to CONSILIUM mode (multi-agent deliberation). Enter your topic or question below.');
      }
      return true;
    }

    if (cmd === '/db') {
      if (argStr === 'hybrid' || argStr === 'postgres' || argStr === 'qdrant' || argStr === 'ephemeral') {
        this.setDb(argStr as DbId);
      } else {
        this.addSystemNotification('Usage: `/db <hybrid | postgres | qdrant | ephemeral>`');
      }
      return true;
    }

    if (cmd === '/preset') {
      if (argStr === 'top10_paid') {
        document.getElementById('btn-preset-top10-paid')?.click();
      } else if (argStr === 'top10_free') {
        document.getElementById('btn-preset-top10-free')?.click();
      } else {
        this.addSystemNotification('Usage: `/preset <top10_paid | top10_free>`');
      }
      return true;
    }

    if (cmd === '/model') {
      const clean = argStr.replace(/^models\//, '');
      const found = CatalogStore.getById(clean);
      if (clean && found) {
        this.currentModel = found.id;
        localStorage.setItem('evabot_model', found.id);
        this.updateModelDetailsUI();
        const sel = document.getElementById('deck-model-select') as HTMLSelectElement;
        if (sel) sel.value = found.id;
        this.addSystemNotification(`${this.t().noticeModelSwitched} ${found.name}`);
      } else {
        this.addSystemNotification(clean ? `Unknown model: ${clean}. Use /models to list.` : 'Usage: `/model <id>`');
      }
      return true;
    }

    if (cmd === '/models') {
      void this.renderModelsCatalog();
      return true;
    }

    if (cmd === '/compare') {
      void this.renderCompareCatalog();
      return true;
    }

    if (cmd === '/menu') {
      document.getElementById('screen-control-deck')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return true;
    }

    if (cmd === '/boot') {
      void this.renderStartupSequence();
      return true;
    }

    if (cmd === '/clear' || cmd === '/cls') {
      this.clearTerminal();
      return true;
    }

    if (cmd === '/config') {
      void this.runConfigCommand();
      return true;
    }

    if (cmd === '/dev') {
      void this.runDevCommand();
      return true;
    }

    if (cmd === '/ansi') {
      void this.runAnsiCommand();
      return true;
    }

    if (cmd === '/onboarding') {
      if (argStr === 'reset') OnboardingHandler.reset();
      this.onboardingReplay();
      return true;
    }

    if (cmd === '/autocorrect') {
      if (argStr === 'on' || argStr === 'off') {
        localStorage.setItem('evabot_autocorrect', argStr);
        this.addSystemNotification(`Smart auto-correction ${argStr === 'on' ? 'ENABLED' : 'disabled'}.`);
      } else {
        this.addSystemNotification(`Usage: \`/autocorrect <on | off>\` (currently ${SmartInput.isEnabled() ? 'on' : 'off'})`);
      }
      return true;
    }

    if (cmd === '/voice') {
      if (argStr === 'eva' || argStr === 'adam') {
        this.setPersona(argStr as PersonaId);
      } else if (argStr === 'on' || argStr === 'off') {
        localStorage.setItem('evabot_voice', argStr);
        this.addSystemNotification(`Voice input ${argStr === 'on' ? 'enabled' : 'disabled'}.`);
      } else {
        this.addSystemNotification('Usage: `/voice <on | off | eva | adam>`');
      }
      return true;
    }

    if (cmd === '/tts') {
      if (argStr === 'on' || argStr === 'off') {
        localStorage.setItem('evabot_tts', argStr);
        this.addSystemNotification(`Text-to-speech ${argStr === 'on' ? 'enabled' : 'muted'}.`);
        if (argStr === 'off') window.speechSynthesis?.cancel();
      } else {
        this.addSystemNotification('Usage: `/tts <on | off>`');
      }
      return true;
    }

    return false;
  }

  private modelToAnsiSpan(m: import('./models').GeminiModelInfo) {
    return {
      id: m.id,
      provider: m.provider,
      category: m.category,
      name: m.name,
      contextWindow: m.contextWindow,
      tier: m.tier,
      pricing: {
        freeTierStatus: m.pricing.freeTierStatus,
        inputPer1MTokensUSD: m.pricing.inputPer1MTokensUSD,
        outputPer1MTokensUSD: m.pricing.outputPer1MTokensUSD,
      },
    };
  }

  private async renderModelsCatalog(): Promise<void> {
    const [topPaid, topFree] = await Promise.all([
      CatalogStore.fetchTopModels('top10_paid'),
      CatalogStore.fetchTopModels('top10_free'),
    ]);
    const merged = [...topPaid, ...topFree];
    const text = merged.length
      ? renderModelsTable(merged.map((m) => this.modelToAnsiSpan(m)))
      : renderNotice('Catalog unreachable — server offline while models load.');
    this.appendMessage({
      role: 'system',
      text,
      timestamp: new Date().toLocaleTimeString(),
      ansi: true,
    });
  }

  private async renderCompareCatalog(): Promise<void> {
    const topPaid = await CatalogStore.fetchTopModels('top10_paid');
    const text = topPaid.length
      ? renderCompareTable(topPaid.map((m) => this.modelToAnsiSpan(m)))
      : renderNotice('Compare table unreachable — server offline.');
    this.appendMessage({
      role: 'system',
      text,
      timestamp: new Date().toLocaleTimeString(),
      ansi: true,
    });
  }

  private async runConfigCommand(): Promise<void> {
    const cfg = await fetchAppConfig();
    const text = cfg ? renderConfigBlock(cfg as any) : renderError('Server /api/config unreachable');
    this.appendMessage({ role: 'system', text, timestamp: new Date().toLocaleTimeString(), ansi: true });
  }

  private async runDevCommand(): Promise<void> {
    const health = await fetchHealth();
    const text = renderDevModeBlock({
      clientDev: this.devMode,
      serverDev: this.serverDevMode,
      authSource: health?.authSource ?? this.authSource,
      hasServerKey: health?.hasServerApiKey ?? false,
      modelCount: health?.availableModels ?? CatalogStore.getAll().length,
      version: health?.version ?? 'v0.0.1 MVP',
    });
    this.appendMessage({ role: 'system', text, timestamp: new Date().toLocaleTimeString(), ansi: true });
  }

  private async runAnsiCommand(): Promise<void> {
    const content = (await fetchBootBannerText()) || renderBootBanner();
    this.appendMessage({
      role: 'system',
      text: renderRawAnsiBlock(content),
      timestamp: new Date().toLocaleTimeString(),
      ansi: true,
    });
  }

  // ===========================================================================
  // TRANSMISSION & GENERATION ENGINE
  // ===========================================================================
  private async handleSend(): Promise<void> {
    if (this.isGenerating) {
      if (this.abortController) {
        this.abortController.abort();
      }
      return;
    }

    const input = document.getElementById('user-input') as HTMLTextAreaElement;
    const rawText = input?.value.trim();
    if (!rawText) return;

    input.value = '';

    // SmartInput: auto-correct + vocabulary learning (never breaks commands/code/URLs)
    let text = rawText;
    try {
      if (SmartInput.isEnabled()) {
        const res = SmartInput.autocorrect(rawText);
        text = res.text;
        for (const f of res.fixes) {
          this.addSystemNotification(`fixed: ${f.from} → ${f.to}`);
        }
      }
      SmartInput.rememberText(text);
    } catch {
      text = rawText;
    }

    if (this.handleSlashCommand(text)) {
      this.activateChatRegion();
      return;
    }

    this.activateChatRegion();

    const now = new Date().toLocaleTimeString();
    this.appendMessage({
      role: 'user',
      text,
      timestamp: now,
      metadata: {
        mode: this.currentMode,
        persona: this.currentPersona,
      },
    });

    const customKey = localStorage.getItem('evabot_gemini_key') || '';
    this.isGenerating = true;
    this.updateStatusLight('busy');
    this.updateSendButtonState(true);

    const botMessageElement = this.createMessageBubble('model', '', now);
    const textSpan = botMessageElement.querySelector('.message-body') as HTMLElement;

    try {
      this.abortController = new AbortController();

      if (this.currentMode === 'chat') {
        const historyPayload = this.messages
          .filter((m3) => m3.role === 'user' || m3.role === 'model')
          .slice(-10)
          .map((m2) => ({
            role: m2.role,
            parts: [{ text: m2.text }],
          }));

        const t0 = performance.now();
        this.chatAcc = '';

        await streamChat(
          {
            message: text,
            model: this.currentModel,
            persona: this.currentPersona,
            role: this.currentRole,
            lang: this.currentLang,
            db: this.currentDb,
            mode: this.currentMode,
            history: historyPayload,
            apiKey: customKey || undefined,
          },
          {
            onChunk: (acc) => {
              this.chatAcc = acc;
              textSpan.innerHTML = this.ansiEffect(textSpan, acc);
              this.scrollToBottom();
            },
            onError: (message) => {
              textSpan.innerHTML += this.renderMarkdown(`\n\n[Error: ${message}]`);
            },
            onDone: (fullText, usage, cost) => {
              const pTok = usage?.promptTokens ?? this.estimateTokensLocal(`${text} ${fullText}`);
              const cTok = usage?.completionTokens ?? this.estimateTokensLocal(fullText);
              const cst: CostEstimate | null = cost ?? null;
              this.chatAcc = fullText;
              const costLine = cst
                ? renderCostLine({
                    model: cst.modelName,
                    isFreeTier: cst.isFreeTier,
                    totalTokens: cst.totalTokens,
                    promptTokens: cst.promptTokens,
                    completionTokens: cst.completionTokens,
                    formattedUSD: cst.formattedUSD,
                    formattedEUR: cst.formattedEUR,
                    commercialValueUSD: cst.commercialValueUSD,
                    commercialValueEUR: cst.commercialValueEUR,
                  })
                : '';
              textSpan.innerHTML = this.ansiEffect(
                textSpan,
                renderChatBoxWithCost(fullText, cst?.modelName ?? this.currentModel, costLine),
              );

              if (cst) {
                this.sessionTotalTokens += cst.totalTokens;
                this.sessionTotalCostUSD += cst.costUSD;
                this.sessionTotalCostEUR += cst.costEUR;
              } else {
                this.sessionTotalTokens += pTok + cTok;
              }
              this.updateTelemetryUI();
              this.scrollToBottom();
            },
          },
          this.abortController.signal,
        );

        this.lastLatencyMs = Math.round(performance.now() - t0);
        this.updateTelemetryUI();

        const finalText = this.chatAcc;
        this.messages.push({
          role: 'model',
          text: finalText,
          timestamp: new Date().toLocaleTimeString(),
          metadata: {
            model: this.currentModel,
            mode: this.currentMode,
            persona: this.currentPersona,
          },
        });

        this.speakVoiceResponse(finalText, this.currentPersona);
        this.rotateTip();
      } else {
        const t0 = performance.now();
        textSpan.innerHTML =
          '<span style="color:var(--clr-yellow); font-family:var(--font-sans);">[>>] Multi-Agent Engine Deliberating... Synchronizing participants & models...</span>';

        const result = await runConsilium(
          {
            prompt: text,
            mode: this.currentMode,
            persona: this.currentPersona,
            preset: this.consiliumPreset || undefined,
            participants: this.consiliumCount,
            apiKey: customKey || undefined,
            useKnowledgeBase: true,
          },
          this.abortController.signal,
        );

        this.lastLatencyMs = Math.round(performance.now() - t0);
        this.updateTelemetryUI();

        const res = result;
        let outputMarkdown = '';
        if (res.consensus) {
          outputMarkdown += `### [*] EXECUTIVE CONSENSUS\n\n${res.consensus}\n\n`;
        }
        if (res.interviewResult) {
          const ir = res.interviewResult;
          outputMarkdown += `### [*] INTERVIEW ASSESSMENT // SCORE: ${ir.score}/100\n\n`;
          outputMarkdown += `**Rating:** ${ir.rating}\n\n`;
          outputMarkdown += `**Executive Feedback:**\n${ir.feedback}\n\n`;
          if (ir.nextQuestion) {
            outputMarkdown += `**Next Probing Question:**\n> ${ir.nextQuestion}\n\n`;
          }
        }

        if (res.turns && res.turns.length > 0) {
          outputMarkdown += '### [*] PARTICIPANT DELIBERATIONS\n\n';
          res.turns.forEach((turn: any) => {
            const turnName = turn.name || turn.participantName || 'Agent';
            const turnModel = turn.model || turn.modelId || 'Unknown Model';
            const turnTokens = turn.totalTokens ? ` │ Tokens: ${turn.totalTokens}` : '';
            const turnCost = turn.cost ? ` │ Cost: ${turn.cost.formattedUSD}` : '';
            outputMarkdown += `#### [${turnName}] (${turnModel}${turnTokens}${turnCost})\n${turn.content}\n\n`;
          });
        }

        if (res.costSummary) {
          this.sessionTotalTokens += res.costSummary.totalTokens;
          this.sessionTotalCostUSD += res.costSummary.totalCostUSD;
          this.sessionTotalCostEUR += res.costSummary.totalCostEUR;
          this.updateTelemetryUI();

          outputMarkdown += '```text\n';
          outputMarkdown += '┌──────────────────────────────────────────────────────────────────────────────┐\n';
          outputMarkdown += `│ [AUDIT] CONSILIUM PARTICIPATION: ${res.costSummary.models.length} Models\n`;
          outputMarkdown += `│ [TOTAL TOKENS] ${res.costSummary.totalTokens.toLocaleString()} tokens (In: ${res.costSummary.totalPromptTokens.toLocaleString()}, Out: ${res.costSummary.totalCompletionTokens.toLocaleString()})\n`;
          outputMarkdown += `│ [TOTAL COST] ${res.costSummary.formattedUSD} │ ${res.costSummary.formattedEUR}\n`;
          outputMarkdown += '└──────────────────────────────────────────────────────────────────────────────┘\n';
          outputMarkdown += '```\n';
        }

        textSpan.innerHTML = this.renderMarkdown(outputMarkdown);
        this.scrollToBottom();

        this.messages.push({
          role: 'model',
          text: outputMarkdown,
          timestamp: new Date().toLocaleTimeString(),
          metadata: {
            model: this.currentModel,
            mode: this.currentMode,
            persona: this.currentPersona,
          },
        });

        const speakable =
          res.consensus ||
          (res.interviewResult ? `${res.interviewResult.feedback}. ${res.interviewResult.nextQuestion || ''}` : '');
        if (speakable) {
          this.speakVoiceResponse(speakable, this.currentPersona);
        }
      }

      this.updateStatusLight('online');
    } catch (err: any) {
      this.updateStatusLight('error');
      if (err.name === 'AbortError') {
        textSpan.innerHTML +=
          '\n<span style="color:var(--clr-yellow); font-family:var(--font-sans); font-size:11px;"> [TRANSMISSION_HALTED_BY_OPERATOR 🟡]</span>';
      } else {
        textSpan.innerHTML = `<span style="color:var(--clr-red); font-family:var(--font-sans); font-size:11px;">[ERR] TRANSMISSION_ERROR: ${this.escapeHtml(err.message)}</span>`;
      }
    } finally {
      this.isGenerating = false;
      this.abortController = null;
      this.updateSendButtonState(false);
      this.setupCodeCopyButtons();
      setTimeout(() => {
        if (!this.isGenerating) this.updateStatusLight('online');
      }, 3000);
    }
  }

  private estimateTokensLocal(text: string): number {
    return Math.ceil(text.length / 3.8);
  }

  // ===========================================================================
  // UI STATUS & BUBBLES
  // ===========================================================================
  private updateStatusLight(state: 'online' | 'busy' | 'error'): void {
    const t = this.t();
    const light = document.getElementById('telemetry-status-light');
    const text = document.getElementById('telemetry-status-text');

    if (state === 'online') {
      if (light) light.className = 'led-green';
      if (text) {
        text.textContent = t.statusOnline;
        text.style.color = 'var(--clr-green)';
      }
    } else if (state === 'busy') {
      if (light) light.className = 'led-yellow';
      if (text) {
        text.textContent = t.statusBusy;
        text.style.color = 'var(--clr-yellow)';
      }
    } else {
      if (light) light.className = 'led-red';
      if (text) {
        text.textContent = t.statusError;
        text.style.color = 'var(--clr-red)';
      }
    }
  }

  private updateSendButtonState(generating: boolean): void {
    const t = this.t();
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    if (!sendBtn) return;

    if (generating) {
      sendBtn.textContent = t.stopBtn;
      sendBtn.style.background = '#78350f';
      sendBtn.style.color = 'var(--clr-yellow)';
      sendBtn.style.borderColor = 'var(--clr-yellow)';
    } else {
      sendBtn.textContent = t.transmitBtn;
      sendBtn.style.background = '#ffffff';
      sendBtn.style.color = '#000000';
      sendBtn.style.borderColor = '#ffffff';
    }
  }

  private appendMessage(msg: WebMessage): void {
    this.messages.push(msg);
    this.createMessageBubble(msg.role, msg.text, msg.timestamp, !!msg.ansi);
    this.scrollToBottom();
    this.setupCodeCopyButtons();
  }

  private createMessageBubble(
    role: 'user' | 'model' | 'system',
    text: string,
    timestamp: string,
    ansi: boolean = false,
  ): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'terminal-bubble ' + role + (ansi ? ' ansi-message' : '');

    const isUser = role === 'user';
    const isSystem = role === 'system';

    const header = document.createElement('div');
    header.className = 'bubble-meta';

    let callsign = `┌─ [${timestamp}] [USER // OPERATOR]`;
    if (!isUser && !isSystem) {
      callsign = `┌─ [${timestamp}] [EVABOT // ${this.currentPersona.toUpperCase()} // ${this.currentMode.toUpperCase()}]`;
    } else if (isSystem) {
      callsign = `┌─ [${timestamp}] [SYSTEM // KERNEL]`;
    }

    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:700; color:${isUser ? '#ffffff' : isSystem ? 'var(--fg-muted)' : 'var(--clr-cyan)'};">${callsign}</span>
        <span style="font-size:10px; color:var(--fg-dim);">${isUser ? 'TX_OK' : 'RX_OK [OK]'}</span>
      </div>
    `;

    const body = document.createElement('div');
    body.className = 'message-body achat-body';
    body.style.lineHeight = '1.45';
    if (ansi) {
      body.innerHTML = this.ansiEffect(body, text);
    } else {
      body.innerHTML = this.renderMarkdown(text);
    }

    wrapper.appendChild(header);
    wrapper.appendChild(body);

    const container = document.getElementById('messages-container');
    container?.appendChild(wrapper);
    return wrapper;
  }

  private ansiEffect(el: HTMLElement, text: string): string {
    el.classList.add('ansi-stream');
    return toHtml(text);
  }

  private renderMarkdown(md: string): string {
    if (!md) return '';

    let html = md;

    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const language = lang || 'text';
      const t = this.t();
      return `
        <div style="margin:10px 0; border:1px solid var(--border-bright); background:var(--bg-panel);">
          <div style="display:flex; justify-content:space-between; align-items:center; padding:4px 10px; border-bottom:1px solid var(--border-dim); background:#000000; font-size:10px; color:var(--fg-muted);">
            <span style="font-weight:700; color:#ffffff;">┌ [CODE: ${language.toUpperCase()}]</span>
            <button class="copy-code-btn return-btn" style="padding:1px 6px; font-size:9px;" data-code="${encodeURIComponent(code)}">${t.copyBtn}</button>
          </div>
          <pre style="padding:10px; overflow-x:auto; font-size:11px; color:var(--fg-primary);"><code>${this.escapeHtml(code)}</code></pre>
          <div style="padding:2px 10px; font-size:9px; color:var(--fg-dim); border-top:1px solid var(--border-dim);">└──────────────────────────────────────────────────────────</div>
        </div>
      `;
    });

    html = html.replace(
      /`([^`]+)`/g,
      '<code style="padding:1px 4px; border:1px solid var(--border-dim); background:var(--bg-panel); color:var(--clr-green); font-size:11px;">$1</code>',
    );

    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ffffff; font-weight:700;">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em style="color:var(--fg-muted);">$1</em>');

    html = html.replace(
      /^### (.*$)/gim,
      '<h3 style="font-size:12px; font-weight:800; color:#ffffff; margin:12px 0 4px; border-bottom:1px solid var(--border-dim); padding-bottom:2px;">> $1</h3>',
    );
    html = html.replace(
      /^## (.*$)/gim,
      '<h2 style="font-size:13px; font-weight:800; color:#ffffff; margin:14px 0 6px; border-bottom:1px solid var(--border-bright); padding-bottom:4px;">>> $1</h2>',
    );
    html = html.replace(
      /^# (.*$)/gim,
      '<h1 style="font-size:14px; font-weight:900; color:#ffffff; margin:16px 0 8px; border-bottom:1px solid #ffffff; padding-bottom:4px;">>>> $1</h1>',
    );

    html = html.replace(/((?:\|[^\n]+\|\n?)+)/g, (match) => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) return match;

      let tableHtml =
        '<div style="overflow-x:auto; margin:10px 0;"><table style="width:100%; border-collapse:collapse; font-size:11px; border:1px solid var(--border-dim);">';
      rows.forEach((row, idx) => {
        if (row.includes('---')) return;
        const cols = row.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1);
        const tag = idx === 0 ? 'th' : 'td';
        tableHtml += '<tr style="border-bottom:1px solid var(--border-dim);">';
        cols.forEach((c) => {
          const val = c.trim();
          tableHtml += `<${tag} style="padding:4px 8px; text-align:left; border-right:1px solid var(--border-dim); ${tag === 'th' ? 'font-weight:700; color:#ffffff; background:var(--bg-panel);' : 'color:var(--fg-primary);'}">${val}</${tag}>`;
        });
        tableHtml += '</tr>';
      });
      tableHtml += '</table></div>';
      return tableHtml;
    });

    html = html.replace(
      /^\s*-\s+(.*$)/gim,
      '<div style="display:flex; gap:6px; margin:2px 0 2px 8px;"><span style="color:var(--clr-green);">*</span><span>$1</span></div>',
    );

    return html;
  }

  private setupCodeCopyButtons(): void {
    const t = this.t();
    document.querySelectorAll<HTMLButtonElement>('.copy-code-btn').forEach((btn) => {
      btn.onclick = () => {
        const raw = btn.getAttribute('data-code');
        if (raw) {
          navigator.clipboard.writeText(decodeURIComponent(raw));
          btn.textContent = t.copiedBtn;
          setTimeout(() => {
            btn.textContent = t.copyBtn;
          }, 2000);
        }
      };
    });
  }

  private addSystemNotification(text: string): void {
    const container = document.getElementById('messages-container');
    if (!container) return;

    const notif = document.createElement('div');
    notif.style.textAlign = 'center';
    notif.style.margin = '6px 0';
    notif.style.fontSize = '11px';
    notif.style.color = 'var(--fg-muted)';
    const clean = text.replace(/\*\*/g, '').replace(/`/g, '');
    notif.innerHTML = toHtml(renderNotice(clean));
    container.appendChild(notif);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const chatRegion = document.getElementById('chat-stream-region');
    if (chatRegion) {
      chatRegion.scrollTop = chatRegion.scrollHeight;
    }
  }

  private rotateTip(): void {
    if (!OnboardingHandler.isDone()) return;
    const tips = ONBOARDING_TIPS;
    if (!tips.length) return;
    const tip = tips[this.tipCursor % tips.length];
    this.tipCursor += 1;
    this.appendMessage({
      role: 'system',
      text: `\n${ANSI.brightCyan}TIP: ${tip}${ANSI.reset}\n`,
      timestamp: new Date().toLocaleTimeString(),
      ansi: true,
    });
  }

  private setDevMode(enabled: boolean): void {
    this.devMode = enabled;
    localStorage.setItem('evabot_dev_mode', enabled ? '1' : '0');
    document.body.classList.toggle('dev-mode', enabled);
    const badge = document.getElementById('dev-badge');
    if (badge) badge.textContent = enabled ? 'DEV:ON' : 'DEV:OFF';
    this.addSystemNotification(
      enabled
        ? '[DEV] Developer Mode [ON] — extra commands active: /dev /ansi /config'
        : '[DEV] Developer Mode [OFF]',
    );
    this.updateDevModeUI();
    void this.syncServerDevMode(enabled);
  }

  private async syncServerDevMode(enabled: boolean): Promise<void> {
    try {
      this.serverDevMode = await setServerDevMode(enabled);
    } catch {
      this.serverDevMode = enabled;
    }
    this.updateDevModeUI();
  }

  private applyFontSize(size: number): void {
    if (!EvaBotWebApp.FONT_SIZES.includes(size)) size = 16;
    this.fontStep = size;
    document.documentElement.style.fontSize = `${size}px`;
    localStorage.setItem('evabot_font_size', String(size));
    this.updateFontSizeUI();
    this.addSystemNotification(`[FONT] Interface font size set to ${size}px.`);
  }

  private updateFontSizeUI(): void {
    document.querySelectorAll<HTMLElement>('[data-font-size]').forEach((el) => {
      el.classList.toggle('active', Number(el.getAttribute('data-font-size')) === this.fontStep);
    });
    const cur = document.querySelector('[data-font-current]');
    if (cur) cur.textContent = `${this.fontStep}px`;
  }

  private updateDevModeUI(): void {
    const anyOn = this.devMode || this.serverDevMode;
    document.querySelectorAll<HTMLElement>('[data-dev-state]').forEach((el) => {
      el.textContent = anyOn ? 'ON' : 'OFF';
    });
    document.querySelectorAll<HTMLElement>('[data-dev-cmd]').forEach((el) => {
      el.classList.toggle('hidden', !anyOn);
    });
    document.querySelectorAll<HTMLButtonElement>('[data-dev-toggle]').forEach((el) => {
      el.textContent = anyOn ? 'DEV MODE: ON (CLICK TO OFF)' : 'DEV MODE: OFF (CLICK TO ON)';
    });
  }

  private isQuickMenuOpen(): boolean {
    const el = document.getElementById('quick-menu');
    return !!el && el.classList.contains('open');
  }

  private setQuickMenuOpen(open: boolean): void {
    const el = document.getElementById('quick-menu');
    if (el) el.classList.toggle('open', open);
  }

  private openDeckRow(row: number): void {
    const id = `deck-row-${String(row).padStart(2, '0')}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      document.getElementById('screen-control-deck')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private buildOnboardingCtx(): OnboardingCtx {
    return {
      getPersona: () => this.currentPersona,
      setPersona: (p) => this.setPersona(p as PersonaId),
      getLang: () => this.currentLang,
      setLang: (l) => this.setLanguage(l as Lang),
      getMode: () => this.currentMode,
      setMode: (m) => this.setMode(m as ModeId),
      getDb: () => this.currentDb,
      setDb: (d) => this.setDb(d as DbId),
      setConsiliumPreset: (p) => {
        document.getElementById(p === 'top10_paid' ? 'btn-preset-top10-paid' : 'btn-preset-top10-free')?.click();
      },
      openDeckRow: (idx) => this.openDeckRow(idx),
      startVoiceTest: () => {
        document.getElementById('voice-orb')?.click();
      },
      onboardingReplay: () => {
        this.onboardingReplay();
      },
      version: () => 'v0.0.1 MVP',
    };
  }

  private renderOnboarding(): void {
    this.onbCtx = this.buildOnboardingCtx();
    this.onboarding = new OnboardingHandler(this.onbCtx, (view) => this.renderOnboardingView(view));
    this.onboarding.start();
  }

  private onboardingReplay(): void {
    OnboardingHandler.reset();
    this.onboarding = new OnboardingHandler(this.buildOnboardingCtx(), (view) => this.renderOnboardingView(view));
    this.onboarding.start();
    document.getElementById('chat-stream-region')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private renderOnboardingView(view: OnboardingView): void {
    const now = new Date().toLocaleTimeString();
    this.appendMessage({ role: 'system', text: view.ansi, timestamp: now, ansi: true });

    const container = document.getElementById('messages-container');
    if (!container) return;

    const bar = document.createElement('div');
    bar.className = 'onboarding-actions';
    view.actions.forEach((a) => {
      const btn = document.createElement('button');
      btn.className = 'return-btn';
      btn.textContent = a.label;
      btn.addEventListener('click', () => {
        if (this.onbCtx) a.run(this.onbCtx);
        if (view.kind === 'step' && this.onboarding) {
          this.onboarding.next();
        }
      });
      bar.appendChild(btn);
    });
    container.appendChild(bar);
    this.scrollToBottom();
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

(window as any).EvaBotWebApp = EvaBotWebApp;

window.addEventListener('DOMContentLoaded', () => {
  (window as any).evaBotApp = new EvaBotWebApp();
});