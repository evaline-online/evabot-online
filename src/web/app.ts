import { ModelRegistry, GeminiModelInfo } from '../models/ModelRegistry.js';

export type Lang = 'en' | 'uk' | 'ru';
export type ProviderId = 'google' | 'omniroute' | 'openrouter' | 'opencode';
export type ModeId = 'solo' | 'broadcast' | 'dialogue' | 'consilium';
export type RoleId = 'ceo' | 'cto' | 'ciso' | 'cfo' | 'ux' | 'dev' | 'rsch' | 'legal';

interface WebMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
  metadata?: {
    model?: string;
    mode?: ModeId;
    role?: RoleId;
    provider?: ProviderId;
  };
}

interface TranslationStrings {
  appTitle: string;
  appSubtitle: string;
  statusOnline: string;
  statusBusy: string;
  statusError: string;
  controlPanelBtn: string;
  returnTerminalBtn: string;
  clearChatBtn: string;
  transmitBtn: string;
  stopBtn: string;
  inputPlaceholder: string;
  inputLegend: string;
  welcomeHeading: string;
  welcomeNotice: string;

  // Sections
  secDeckTitle: string;
  secProviders: string;
  secModels: string;
  secModes: string;
  secRoles: string;
  secTelemetry: string;
  secSecurity: string;

  // Badges
  badgeFree: string;
  badgePaid: string;
  badgeActive: string;
  badgeReady: string;
  badgeStandby: string;

  // Providers
  provGoogleName: string;
  provGoogleDesc: string;
  provOmniName: string;
  provOmniDesc: string;
  provOpenRouterName: string;
  provOpenRouterDesc: string;
  provOpenCodeName: string;
  provOpenCodeDesc: string;

  // Modes
  modeSoloName: string;
  modeSoloDesc: string;
  modeBroadcastName: string;
  modeBroadcastDesc: string;
  modeDialogueName: string;
  modeDialogueDesc: string;
  modeConsiliumName: string;
  modeConsiliumDesc: string;

  // Roles
  roleCeoName: string;
  roleCeoDesc: string;
  roleCtoName: string;
  roleCtoDesc: string;
  roleCisoName: string;
  roleCisoDesc: string;
  roleCfoName: string;
  roleCfoDesc: string;
  roleUxName: string;
  roleUxDesc: string;
  roleDevName: string;
  roleDevDesc: string;
  roleRschName: string;
  roleRschDesc: string;
  roleLegalName: string;
  roleLegalDesc: string;

  // Telemetry labels
  telemServerLabel: string;
  telemUptimeLabel: string;
  telemMemoryLabel: string;
  telemLatencyLabel: string;
  telemProviderLabel: string;
  telemModelLabel: string;
  telemQuotaLabel: string;
  telemAuthLabel: string;
  telemAccountLabel: string;

  // Security
  apiKeyLabel: string;
  apiKeyHelp: string;
  apiKeyPlaceholder: string;
  saveKeyBtn: string;
  clearKeyBtn: string;
  keyStatusCustom: string;
  keyStatusAmbient: string;

  // Notifications
  noticeModelSwitched: string;
  noticeRoleSwitched: string;
  noticeModeSwitched: string;
  noticeProviderSwitched: string;
  noticeKeySaved: string;
  noticeKeyCleared: string;
  noticeChatCleared: string;
  copiedBtn: string;
  copyBtn: string;
}

const TRANSLATIONS: Record<Lang, TranslationStrings> = {
  en: {
    appTitle: 'EVABOT // CYBER-TERMINAL',
    appSubtitle: 'Autonomous Multi-Provider Neural Deck',
    statusOnline: '[ONLINE] // IDLE',
    statusBusy: '[ACTIVE] // STREAMING',
    statusError: '[ERROR] // OFFLINE',
    controlPanelBtn: '[ CONTROL PANEL // SYSTEM DECK ]',
    returnTerminalBtn: '[ RETURN TO TERMINAL ]',
    clearChatBtn: '[ CLR ]',
    transmitBtn: '[ TRANSMIT  ]',
    stopBtn: '[ STOP ]',
    inputPlaceholder: 'Enter cyber command or query prompt (Enter to send, Shift+Enter for newline)...',
    inputLegend: 'Enter: Transmit • Shift+Enter: Linebreak • EvaBot Core v0.2.0',
    welcomeHeading: 'EVABOT NEURAL CYBER-TERMINAL ONLINE',
    welcomeNotice: 'Session initialized. Pure black & white minimalist cyber-deck active. Connected to Google Cloud ambient infrastructure with real-time multi-provider routing.',
    secDeckTitle: 'EVA CONTROL DECK // CONFIGURATION & TELEMETRY',
    secProviders: '1. NEURAL PROVIDERS',
    secModels: '2. MODEL SELECTION & QUOTAS',
    secModes: '3. OPERATIONAL MODES',
    secRoles: '4. CORPORATE ROLES & PERSONAS',
    secTelemetry: '5. REAL-TIME SYSTEM TELEMETRY',
    secSecurity: '6. SECURITY & CREDENTIALS',
    badgeFree: '[FREE QUOTA]',
    badgePaid: '[PAID / PAYG]',
    badgeActive: '[ACTIVE]',
    badgeReady: '[READY]',
    badgeStandby: '[STANDBY]',
    provGoogleName: 'Google Cloud (Vertex AI & AI Studio)',
    provGoogleDesc: 'Native Google DeepMind Gemini and enterprise partner models with low-latency direct API dispatch.',
    provOmniName: 'OmniRoute Neural Gateway',
    provOmniDesc: 'Dynamic multi-cloud neural router featuring intelligent load-balancing, failover, and prompt routing.',
    provOpenRouterName: 'OpenRouter Mesh',
    provOpenRouterDesc: 'Decentralized gateway granting access to global open-weights clusters and specialized reasoning engines.',
    provOpenCodeName: 'OpenCode Go Engine',
    provOpenCodeDesc: 'High-throughput code inference node designed for private syntax generation, refactoring, and AST analysis.',
    modeSoloName: 'SOLO',
    modeSoloDesc: 'Direct single LLM execution focused strictly on active corporate persona directives.',
    modeBroadcastName: 'BROADCAST',
    modeBroadcastDesc: 'Multi-perspective analysis broadcasting your prompt across core architectural dimensions.',
    modeDialogueName: 'DIALOGUE',
    modeDialogueDesc: 'Rapid-cadence conversational cyber-stream with continuous state retention and feedback.',
    modeConsiliumName: 'CONSILIUM',
    modeConsiliumDesc: 'Autonomous corporate council deliberation synthesizing executive viewpoints into consensus.',
    roleCeoName: 'CEO // Executive Strategist',
    roleCeoDesc: 'High-level corporate strategy, market positioning, ROI evaluation, and decisive leadership.',
    roleCtoName: 'CTO // Principal Architect',
    roleCtoDesc: 'Distributed systems design, enterprise scalability, zero-downtime reliability, and clean code.',
    roleCisoName: 'CISO // Cyber Security & Infosec',
    roleCisoDesc: 'Threat modeling, zero-trust architecture, cryptographic integrity, and zero-day defense.',
    roleCfoName: 'CFO // Financial & Risk Analyst',
    roleCfoDesc: 'Fiscal governance, tokenomics optimization, operational expenditure in USD ($) and EUR (€).',
    roleUxName: 'UX/DES // Creative Director',
    roleUxDesc: 'Minimalist cyber aesthetics, terminal ergonomics, human-computer interaction, and high usability.',
    roleDevName: 'DEV // Lead Full-Stack Engineer',
    roleDevDesc: 'Production-ready code implementation, bug elimination, algorithmic efficiency, and test suites.',
    roleRschName: 'RSCH // AI Research Scientist',
    roleRschDesc: 'Attention mechanisms, context compression, reasoning paradigms, and neurosymbolic agent loops.',
    roleLegalName: 'LEGAL // Compliance Counsel',
    roleLegalDesc: 'Regulatory adherence (GDPR, EU AI Act), risk mitigation, license conformity, and ethics.',
    telemServerLabel: 'Edge Server',
    telemUptimeLabel: 'Uptime',
    telemMemoryLabel: 'Memory (RSS)',
    telemLatencyLabel: 'API Latency',
    telemProviderLabel: 'Provider',
    telemModelLabel: 'Active Model',
    telemQuotaLabel: 'Quota Status',
    telemAuthLabel: 'Auth Source',
    telemAccountLabel: 'Account',
    apiKeyLabel: 'Google Gemini / Vertex API Key',
    apiKeyHelp: 'Enter your custom key to override server ambient credentials. Stored securely in browser localStorage.',
    apiKeyPlaceholder: 'AIzaSy...',
    saveKeyBtn: '[ SAVE CREDENTIALS ]',
    clearKeyBtn: '[ USE AMBIENT AUTO-AUTH ]',
    keyStatusCustom: '[CUSTOM KEY ACTIVE]',
    keyStatusAmbient: '[GOOGLE AMBIENT AUTH]',
    noticeModelSwitched: 'Switched model to',
    noticeRoleSwitched: 'Activated corporate role',
    noticeModeSwitched: 'Changed operation mode to',
    noticeProviderSwitched: 'Switched primary neural provider to',
    noticeKeySaved: 'Custom API credentials saved to local browser storage.',
    noticeKeyCleared: 'Reverted to Google Cloud ambient auto-authentication.',
    noticeChatCleared: 'Chat history purged.',
    copiedBtn: 'COPIED',
    copyBtn: 'COPY',
  },
  uk: {
    appTitle: 'EVABOT // КІБЕР-ТЕРМІНАЛ',
    appSubtitle: 'Автономний багатопровайдерний нейродек',
    statusOnline: '[ONLINE] В МЕРЕЖІ // ОЧІКУВАННЯ',
    statusBusy: '[ACTIVE] ГЕНЕРАЦІЯ // АКТИВНО',
    statusError: '[ERROR] ПОМИЛКА // ОФЛАЙН',
    controlPanelBtn: '[ ПАНЕЛЬ КЕРУВАННЯ // СИСТЕМНИЙ ДЕК ]',
    returnTerminalBtn: '[ ПОВЕРНУТИСЯ ДО ТЕРМІНАЛУ ]',
    clearChatBtn: '[ ОЧИСТИТИ ]',
    transmitBtn: '[ ВІДПРАВИТИ  ]',
    stopBtn: '[ ЗУПИНИТИ ]',
    inputPlaceholder: 'Введіть кібер-команду або запит (Enter для відправки, Shift+Enter для нового рядка)...',
    inputLegend: 'Enter: Відправити • Shift+Enter: Перенос рядка • Ядро EvaBot v0.2.0',
    welcomeHeading: 'НЕЙРОННИЙ КІБЕР-ТЕРМІНАЛ EVABOT В МЕРЕЖІ',
    welcomeNotice: 'Сесію ініціалізовано. Мінімалістичний чорно-білий кібер-дек активовано. Підключено до хмарної інфраструктури Google Cloud із багатопровайдерною маршрутизацією.',
    secDeckTitle: 'ДЕК КЕРУВАННЯ EVA // КОНФІГУРАЦІЯ ТА ТЕЛЕМЕТРІЯ',
    secProviders: '1. НЕЙРОННІ ПРОВАЙДЕРИ',
    secModels: '2. ВИБІР МОДЕЛІ ТА КВОТИ',
    secModes: '3. РЕЖИМИ РОБОТИ',
    secRoles: '4. КОРПОРАТИВНІ РОЛІ ТА ПЕРСОНИ',
    secTelemetry: '5. ТЕЛЕМЕТРІЯ В РЕАЛЬНОМУ ЧАСІ',
    secSecurity: '6. БЕЗПЕКА ТА АВТОРИЗАЦІЯ',
    badgeFree: '[БЕЗКОШТОВНО]',
    badgePaid: '[ПЛАТНО / PAYG]',
    badgeActive: '[АКТИВНИЙ]',
    badgeReady: '[ГОТОВИЙ]',
    badgeStandby: '[ОЧІКУВАННЯ]',
    provGoogleName: 'Google Cloud (Vertex AI & AI Studio)',
    provGoogleDesc: 'Оригінальні моделі Google DeepMind Gemini та партнерські корпоративні моделі з прямою відправкою.',
    provOmniName: 'Нейрошлюз OmniRoute',
    provOmniDesc: 'Динамічний багатохмарний маршрутизатор з інтелектуальним балансуванням навантаження та відмовостійкістю.',
    provOpenRouterName: 'Мережа OpenRouter',
    provOpenRouterDesc: 'Децентралізований шлюз для доступу до світових кластерів відкритих ваг та спеціалізованих моделей.',
    provOpenCodeName: 'Вузол OpenCode Go',
    provOpenCodeDesc: 'Високопродуктивний рушій генерації коду для приватного синтаксичного аналізу, рефакторингу та AST.',
    modeSoloName: 'СОЛО',
    modeSoloDesc: 'Пряме виконання одного LLM із суворим дотриманням вибраної корпоративної ролі.',
    modeBroadcastName: 'ТРАНСЛЯЦІЯ',
    modeBroadcastDesc: 'Багатовимірний аналіз із паралельним транслюванням запиту за ключовими напрямками.',
    modeDialogueName: 'ДІАЛОГ',
    modeDialogueDesc: 'Швидкий діалоговий кібер-потік із постійним збереженням контексту та швидким зворотним зв’язком.',
    modeConsiliumName: 'КОНСИЛІУМ',
    modeConsiliumDesc: 'Автономне засідання ради директорів із синтезом позицій лідерів у єдиний узгоджений консенсус.',
    roleCeoName: 'CEO // Стратегічний лідер',
    roleCeoDesc: 'Корпоративна стратегія високого рівня, ринкове позиціонування, оцінка ROI та рішуче лідерство.',
    roleCtoName: 'CTO // Головний архітектор',
    roleCtoDesc: 'Проєктування розподілених систем, корпоративне масштабування, відмовостійкість та чистий код.',
    roleCisoName: 'CISO // Кібербезпека та інфобезпека',
    roleCisoDesc: 'Моделювання загроз, архітектура Zero-Trust, криптографічна цілісність та захист від zero-day.',
    roleCfoName: 'CFO // Фінансовий аналітик',
    roleCfoDesc: 'Фінансовий контроль, оптимізація токеноміки, розрахунок витрат строго в доларах США ($) та євро (€).',
    roleUxName: 'UX/DES // Креативний директор',
    roleUxDesc: 'Мінімалістична кібер-естетика, ергономіка термінала, людино-машинна взаємодія та висока зручність.',
    roleDevName: 'DEV // Провідний Full-Stack інженер',
    roleDevDesc: 'Впровадження продакшн-коду, усунення багів, алгоритмічна оптимізація та модульне тестування.',
    roleRschName: 'RSCH // Дослідник штучного інтелекту',
    roleRschDesc: 'Механізми уваги, стиснення контексту, міркування LLM та нейросимволічні агентні контури.',
    roleLegalName: 'LEGAL // Юрист з комплайєнсу',
    roleLegalDesc: 'Дотримання регламентів (GDPR, EU AI Act), мінімізація ризиків, ліцензії та етичні норми ШІ.',
    telemServerLabel: 'Вузол сервера',
    telemUptimeLabel: 'Час роботи',
    telemMemoryLabel: 'Пам’ять (RSS)',
    telemLatencyLabel: 'Затримка API',
    telemProviderLabel: 'Провайдер',
    telemModelLabel: 'Активна модель',
    telemQuotaLabel: 'Статус квоти',
    telemAuthLabel: 'Джерело авторизації',
    telemAccountLabel: 'Акаунт',
    apiKeyLabel: 'API ключ Google Gemini / Vertex',
    apiKeyHelp: 'Введіть власний ключ для перевизначення серверної авторизації. Зберігається локально в браузері.',
    apiKeyPlaceholder: 'AIzaSy...',
    saveKeyBtn: '[ ЗБЕРЕГТИ КЛЮЧ ]',
    clearKeyBtn: '[ АВТО-АВТОРИЗАЦІЯ GOOGLE ]',
    keyStatusCustom: '[ВЛАСНИЙ КЛЮЧ АКТИВНИЙ]',
    keyStatusAmbient: '[АВТО-АВТОРИЗАЦІЯ GOOGLE]',
    noticeModelSwitched: 'Переключено модель на',
    noticeRoleSwitched: 'Активовано корпоративну роль',
    noticeModeSwitched: 'Змінено режим роботи на',
    noticeProviderSwitched: 'Змінено нейронного провайдера на',
    noticeKeySaved: 'Власний ключ API успішно збережено в браузері.',
    noticeKeyCleared: 'Повернуто автоматичну авторизацію Google Cloud.',
    noticeChatCleared: 'Історію повідомлень очищено.',
    copiedBtn: 'СКОПІЙОВАНО',
    copyBtn: 'КОПІЮВАТИ',
  },
  ru: {
    appTitle: 'EVABOT // КИБЕР-ТЕРМИНАЛ',
    appSubtitle: 'Автономный многопровайдерный нейродек',
    statusOnline: '[ONLINE] В СЕТИ // ОЖИДАНИЕ',
    statusBusy: '[ACTIVE] ГЕНЕРАЦИЯ // АКТИВНО',
    statusError: '[ERROR] ОШИБКА // ОФЛАЙН',
    controlPanelBtn: '[ КОНТРОЛЬНАЯ ПАНЕЛЬ // СИСТЕМНЫЙ ДЕК ]',
    returnTerminalBtn: '[ ВЕРНУТЬСЯ В ТЕРМИНАЛ ]',
    clearChatBtn: '[ ОЧИСТИТЬ ]',
    transmitBtn: '[ ОТПРАВИТЬ  ]',
    stopBtn: '[ ОСТАНОВИТЬ ]',
    inputPlaceholder: 'Введите кибер-команду или запрос (Enter для отправки, Shift+Enter для новой строки)...',
    inputLegend: 'Enter: Отправить • Shift+Enter: Перенос строки • Ядро EvaBot v0.2.0',
    welcomeHeading: 'НЕЙРОННЫЙ КИБЕР-ТЕРМИНАЛ EVABOT В СЕТИ',
    welcomeNotice: 'Сессия инициализирована. Минималистичный черно-белый кибер-дек активирован. Подключение к облачной инфраструктуре Google Cloud с многопровайдерной маршрутизацией.',
    secDeckTitle: 'ДЕК УПРАВЛЕНИЯ EVA // КОНФИГУРАЦИЯ И ТЕЛЕМЕТРИЯ',
    secProviders: '1. НЕЙРОННЫЕ ПРОВАЙДЕРЫ',
    secModels: '2. ВЫБОР МОДЕЛИ И КВОТЫ',
    secModes: '3. РЕЖИМЫ РАБОТЫ',
    secRoles: '4. КОРПОРАТИВНЫЕ РОЛИ И ПЕРСОНЫ',
    secTelemetry: '5. ТЕЛЕМЕТРИЯ В РЕАЛЬНОМ ВРЕМЕНИ',
    secSecurity: '6. БЕЗОПАСНОСТЬ И АВТОРИЗАЦИЯ',
    badgeFree: '[БЕСПЛАТНО]',
    badgePaid: '[ПЛАТНО / PAYG]',
    badgeActive: '[АКТИВЕН]',
    badgeReady: '[ГОТОВ]',
    badgeStandby: '[ОЖИДАНИЕ]',
    provGoogleName: 'Google Cloud (Vertex AI & AI Studio)',
    provGoogleDesc: 'Оригинальные модели Google DeepMind Gemini и партнерские корпоративные модели прямого вызова.',
    provOmniName: 'Нейрошлюз OmniRoute',
    provOmniDesc: 'Динамический мультиоблачный маршрутизатор с интеллектуальной балансировкой и отказоустойчивостью.',
    provOpenRouterName: 'Сеть OpenRouter',
    provOpenRouterDesc: 'Децентрализованный шлюз доступа к глобальным кластерам открытых весов и специализированным моделям.',
    provOpenCodeName: 'Узел OpenCode Go',
    provOpenCodeDesc: 'Высокопроизводительный движок генерации кода для приватного анализа, рефакторинга и AST.',
    modeSoloName: 'СОЛО',
    modeSoloDesc: 'Прямое исполнение одной LLM со строгой фокусировкой на директивах активной роли.',
    modeBroadcastName: 'ТРАНСЛЯЦИЯ',
    modeBroadcastDesc: 'Многомерный анализ с параллельной трансляцией запроса по ключевым аналитическим срезам.',
    modeDialogueName: 'ДИАЛОГ',
    modeDialogueDesc: 'Быстрый диалоговый кибер-поток с непрерывным сохранением контекста и оперативным откликом.',
    modeConsiliumName: 'КОНСИЛИУМ',
    modeConsiliumDesc: 'Автономное совещание совета директоров с синтезом мнений экспертов в единый консенсус.',
    roleCeoName: 'CEO // Стратегический лидер',
    roleCeoDesc: 'Корпоративная стратегия высокого уровня, рыночное позиционирование, расчет ROI и лидерство.',
    roleCtoName: 'CTO // Главный архитектор',
    roleCtoDesc: 'Проектирование распределенных систем, масштабируемость, отказоустойчивость и чистый код.',
    roleCisoName: 'CISO // Кибербезопасность и инфобез',
    roleCisoDesc: 'Моделирование угроз, архитектура Zero-Trust, криптографическая целостность и отражение атак.',
    roleCfoName: 'CFO // Финансовый аналитик',
    roleCfoDesc: 'Финансовый аудит, оптимизация токеномики, учет затрат строго в долларах США ($) и евро (€).',
    roleUxName: 'UX/DES // Креативный директор',
    roleUxDesc: 'Минималистичная кибер-эстетика, эргономика терминала, взаимодействие с пользователем и дизайн.',
    roleDevName: 'DEV // Ведущий Full-Stack инженер',
    roleDevDesc: 'Реализация продакшн-кода, устранение ошибок, алгоритмическая оптимизация и модульные тесты.',
    roleRschName: 'RSCH // Исследователь ИИ',
    roleRschDesc: 'Механизмы внимания, компрессия контекста, архитектура рассуждений и нейросимволические агенты.',
    roleLegalName: 'LEGAL // Корпоративный юрист',
    roleLegalDesc: 'Соблюдение регламентов (GDPR, EU AI Act), снижение рисков, лицензирование и этика ИИ.',
    telemServerLabel: 'Узел сервера',
    telemUptimeLabel: 'Время работы',
    telemMemoryLabel: 'Память (RSS)',
    telemLatencyLabel: 'Задержка API',
    telemProviderLabel: 'Провайдер',
    telemModelLabel: 'Активная модель',
    telemQuotaLabel: 'Статус квоты',
    telemAuthLabel: 'Источник авторизации',
    telemAccountLabel: 'Аккаунт',
    apiKeyLabel: 'API ключ Google Gemini / Vertex',
    apiKeyHelp: 'Введите собственный ключ для переопределения серверной авторизации. Сохраняется в браузере.',
    apiKeyPlaceholder: 'AIzaSy...',
    saveKeyBtn: '[ СОХРАНИТЬ КЛЮЧ ]',
    clearKeyBtn: '[ АВТО-АВТОРИЗАЦИЯ GOOGLE ]',
    keyStatusCustom: '[СОБСТВЕННЫЙ КЛЮЧ АКТИВЕН]',
    keyStatusAmbient: '[АВТО-АВТОРИЗАЦИЯ GOOGLE]',
    noticeModelSwitched: 'Модель переключена на',
    noticeRoleSwitched: 'Активирована корпоративная роль',
    noticeModeSwitched: 'Режим работы изменен на',
    noticeProviderSwitched: 'Нейронный провайдер изменен на',
    noticeKeySaved: 'Ключ API сохранен в локальном хранилище браузера.',
    noticeKeyCleared: 'Возвращена автоматическая авторизация Google Cloud.',
    noticeChatCleared: 'История сообщений очищена.',
    copiedBtn: 'СКОПИРОВАНО',
    copyBtn: 'КОПИРОВАТЬ',
  },
};

export class EvaBotWebApp {
  private messages: WebMessage[] = [];
  private currentLang: Lang = 'en';
  private currentProvider: ProviderId = 'google';
  private currentModel: string = 'openrouter/free';
  private currentMode: ModeId = 'solo';
  private currentRole: RoleId = 'ceo';
  private isGenerating: boolean = false;
  private abortController: AbortController | null = null;
  private serverHasApiKey: boolean = false;
  private authSource: string = 'Google Cloud Ambient';
  private userAccount: string = 'evabot.online@gmail.com';
  private serverUptimeSec: number = 0;
  private serverMemoryMb: number = 0;
  private lastLatencyMs: number = 0;
  private uptimeInterval: any = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const savedLang = localStorage.getItem('evabot_lang') as Lang;
    if (savedLang && (savedLang === 'en' || savedLang === 'uk' || savedLang === 'ru')) {
      this.currentLang = savedLang;
    }

    this.setupEventListeners();
    await this.checkHealth();
    this.populateModelSelector();
    this.applyLanguage();
    // Locale applied pre-paint by the inline head script (data-locale-pending);
    // reveal the body only after the saved language has actually been applied
    // so the user never sees a wrong-language flash.
    document.documentElement.lang = this.currentLang;
    document.documentElement.removeAttribute('data-locale-pending');
    this.updateProviderUI();
    this.updateModeUI();
    this.updateRoleUI();
    this.updateModelDetailsUI();
    this.updateKeyStatusUI();
    this.renderWelcomeMessage();
    this.startTelemetryLoop();
  }

  private t(): TranslationStrings {
    return TRANSLATIONS[this.currentLang];
  }

  public setLanguage(lang: Lang): void {
    if (lang === this.currentLang) return;
    this.currentLang = lang;
    localStorage.setItem('evabot_lang', lang);
    this.applyLanguage();
    this.updateModelDetailsUI();
    this.updateKeyStatusUI();
    this.updateTelemetryUI();

    if (this.messages.length <= 1) {
      this.messages = [];
      const container = document.getElementById('messages-container');
      if (container) container.innerHTML = '';
      this.renderWelcomeMessage();
    }
  }

  private applyLanguage(): void {
    const t = this.t();

    // Language switcher buttons active state
    ['en', 'uk', 'ru'].forEach((l) => {
      const btn = document.getElementById(`lang-btn-${l}`);
      if (btn) {
        if (l === this.currentLang) {
          btn.className = 'px-2 py-0.5 text-xs font-bold bg-white text-black border border-white';
        } else {
          btn.className = 'px-2 py-0.5 text-xs font-bold bg-black text-zinc-400 hover:text-white border border-transparent';
        }
      }
    });

    document.title = `${t.appTitle} // ${this.currentModel}`;

    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n') as keyof TranslationStrings;
      if (key && t[key]) {
        el.textContent = t[key];
      }
    });

    document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('[data-i18n-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-i18n-placeholder') as keyof TranslationStrings;
      if (key && t[key]) {
        el.placeholder = t[key];
      }
    });

    const ctrlBtn = document.getElementById('control-panel-btn-label');
    if (ctrlBtn) ctrlBtn.textContent = t.controlPanelBtn;

    const retBtn = document.getElementById('return-terminal-btn-label');
    if (retBtn) retBtn.textContent = t.returnTerminalBtn;

    const clrBtn = document.getElementById('clear-btn');
    if (clrBtn) clrBtn.textContent = t.clearChatBtn;

    this.updateSendButtonState(this.isGenerating);
  }

  private setupEventListeners(): void {
    document.getElementById('lang-btn-en')?.addEventListener('click', () => this.setLanguage('en'));
    document.getElementById('lang-btn-uk')?.addEventListener('click', () => this.setLanguage('uk'));
    document.getElementById('lang-btn-ru')?.addEventListener('click', () => this.setLanguage('ru'));

    const toDeckBtn = document.getElementById('scroll-to-deck-btn');
    const toTerminalBtn = document.getElementById('scroll-to-terminal-btn');
    const deckSection = document.getElementById('screen-control-deck');
    const terminalSection = document.getElementById('screen-terminal');

    toDeckBtn?.addEventListener('click', () => {
      deckSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    toTerminalBtn?.addEventListener('click', () => {
      terminalSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

    document.getElementById('clear-btn')?.addEventListener('click', () => {
      this.messages = [];
      const container = document.getElementById('messages-container');
      if (container) container.innerHTML = '';
      this.renderWelcomeMessage();
      this.addSystemNotification(this.t().noticeChatCleared);
    });

    const modelSelect = document.getElementById('deck-model-select') as HTMLSelectElement;
    modelSelect?.addEventListener('change', (e) => {
      this.currentModel = (e.target as HTMLSelectElement).value;
      this.updateModelDetailsUI();
      const m = ModelRegistry.getModelById(this.currentModel);
      this.addSystemNotification(`${this.t().noticeModelSwitched} **${m?.name || this.currentModel}**`);
    });

    document.querySelectorAll<HTMLElement>('[data-provider]').forEach((el) => {
      el.addEventListener('click', () => {
        const prov = el.getAttribute('data-provider') as ProviderId;
        if (prov) {
          this.currentProvider = prov;
          this.updateProviderUI();
          this.addSystemNotification(`${this.t().noticeProviderSwitched} **${prov.toUpperCase()}**`);
        }
      });
    });

    document.querySelectorAll<HTMLElement>('[data-mode]').forEach((el) => {
      el.addEventListener('click', () => {
        const mode = el.getAttribute('data-mode') as ModeId;
        if (mode) {
          this.currentMode = mode;
          this.updateModeUI();
          this.addSystemNotification(`${this.t().noticeModeSwitched} **${mode.toUpperCase()}**`);
        }
      });
    });

    document.querySelectorAll<HTMLElement>('[data-role]').forEach((el) => {
      el.addEventListener('click', () => {
        const role = el.getAttribute('data-role') as RoleId;
        if (role) {
          this.currentRole = role;
          this.updateRoleUI();
          this.addSystemNotification(`${this.t().noticeRoleSwitched} **${role.toUpperCase()}**`);
        }
      });
    });

    const saveKeyBtn = document.getElementById('deck-save-key-btn');
    const clearKeyBtn = document.getElementById('deck-clear-key-btn');
    const apiKeyInput = document.getElementById('deck-api-key-input') as HTMLInputElement;

    saveKeyBtn?.addEventListener('click', () => {
      const val = apiKeyInput?.value.trim() || '';
      if (val) {
        localStorage.setItem('evabot_gemini_key', val);
        this.addSystemNotification(this.t().noticeKeySaved);
      }
      this.updateKeyStatusUI();
    });

    clearKeyBtn?.addEventListener('click', () => {
      localStorage.removeItem('evabot_gemini_key');
      if (apiKeyInput) apiKeyInput.value = '';
      this.addSystemNotification(this.t().noticeKeyCleared);
      this.updateKeyStatusUI();
    });

    document.getElementById('header-model-pill')?.addEventListener('click', () => {
      deckSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    const bootAccordion = document.getElementById('accordion-boot') as HTMLDetailsElement | null;
    const bootLabel = document.getElementById('boot-toggle-label');
    bootAccordion?.addEventListener('toggle', () => {
      if (bootLabel) {
        bootLabel.textContent = bootAccordion.open ? '[ - COLLAPSE ]' : '[ + EXPAND ]';
      }
    });
  }

  private async checkHealth(): Promise<void> {
    const t0 = performance.now();
    try {
      const res = await fetch('/api/health');
      this.lastLatencyMs = Math.round(performance.now() - t0);
      if (res.ok) {
        const data = await res.json();
        this.serverHasApiKey = Boolean(data.hasServerApiKey);
        if (data.authSource) this.authSource = data.authSource;
        if (data.account) this.userAccount = data.account;
        if (data.uptimeSeconds) this.serverUptimeSec = data.uptimeSeconds;
        if (data.memoryUsageMb) this.serverMemoryMb = data.memoryUsageMb;
      }
    } catch {
      this.serverHasApiKey = false;
      this.lastLatencyMs = 999;
    }
    this.updateTelemetryUI();
    this.fetchBootDiagnostics();
  }

  private async fetchBootDiagnostics(): Promise<void> {
    try {
      const res = await fetch(`/api/diagnostics/boot?model=${encodeURIComponent(this.currentModel)}`);
      if (res.ok) {
        const report = await res.json();
        const container = document.getElementById('boot-log-container');
        if (container && report.steps) {
          container.innerHTML = `
            <div class="text-zinc-500 font-bold mb-1">Live dual-server diagnostic probe completed in ${report.totalDurationMs}ms:</div>
            ${report.steps.map((step: any) => `
              <div class="flex items-start gap-2 text-zinc-300 py-0.5">
                <span class="text-emerald-400 font-bold">[OK]</span>
                <div class="flex-1">
                  <div class="flex justify-between items-center">
                    <span class="text-white font-bold">${step.name}</span>
                    <span class="text-zinc-500 text-[10px] font-mono">${step.latencyMs}ms</span>
                  </div>
                  <div class="text-zinc-400 text-[11px]">${step.details}</div>
                </div>
              </div>
            `).join('')}
          `;
        }
      }
    } catch (e) {
      console.warn('Boot diagnostics fetch skipped:', e);
    }
  }

  private startTelemetryLoop(): void {
    if (this.uptimeInterval) clearInterval(this.uptimeInterval);
    this.uptimeInterval = setInterval(() => {
      this.serverUptimeSec += 1;
      this.updateTelemetryUI();
    }, 1000);

    setInterval(() => {
      this.checkHealth();
    }, 15000);
  }

  private updateTelemetryUI(): void {
    const t = this.t();

    const serverEl = document.getElementById('telem-server');
    if (serverEl) serverEl.textContent = 'evabot-online-edge';

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

    const provEl = document.getElementById('telem-provider');
    if (provEl) provEl.textContent = this.currentProvider.toUpperCase();

    const modelEl = document.getElementById('telem-model');
    if (modelEl) modelEl.textContent = this.currentModel;

    const roleEl = document.getElementById('telem-role');
    if (roleEl) roleEl.textContent = this.currentRole.toUpperCase();

    const modeEl = document.getElementById('telem-mode');
    if (modeEl) modeEl.textContent = this.currentMode.toUpperCase();

    const m = ModelRegistry.getModelById(this.currentModel);
    const isFree = m?.pricing.freeTierStatus === '100% Free Quota Available';
    const quotaEl = document.getElementById('telem-quota');
    if (quotaEl) {
      quotaEl.textContent = isFree ? t.badgeFree : t.badgePaid;
      quotaEl.className = isFree ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold';
    }

    const authEl = document.getElementById('telem-auth');
    if (authEl) {
      const customKey = localStorage.getItem('evabot_gemini_key');
      authEl.textContent = customKey ? 'Custom API Key' : this.authSource;
    }

    const accEl = document.getElementById('telem-account');
    if (accEl) accEl.textContent = this.userAccount;
  }

  private populateModelSelector(): void {
    const select = document.getElementById('deck-model-select') as HTMLSelectElement;
    if (!select) return;

    select.innerHTML = '';

     const categories = [
       'Google Gemini (Next-Gen)',
       'Google Gemini (Long-Context)',
       'Google Gemma (Open Weights)',
       'Anthropic Claude on Google Cloud',
       'Meta Llama 3 on Google Cloud',
       'Mistral AI on Google Cloud',
       'DeepSeek on Google Cloud',
       'AI21 Labs & Cohere on Google Cloud',
       'OmniRoute Daemon Cluster',
       'OpenRouter Free Models',
       'OpenRouter Premium',
       'OpenCode Go Platforms',
     ];

    for (const cat of categories) {
      const models = ModelRegistry.getModelsByCategory(cat);
      if (!models || models.length === 0) continue;

      const group = document.createElement('optgroup');
      group.label = cat;

      for (const m of models) {
        const opt = document.createElement('option');
        opt.value = m.id;
        const isFree = m.pricing.freeTierStatus.includes('Free');
        const badge = isFree ? ' [FREE]' : ' [PAID]';
        opt.textContent = `${m.name}${badge}`;
        if (m.id === this.currentModel) opt.selected = true;
        group.appendChild(opt);
      }
      select.appendChild(group);
    }
  }

  private updateProviderUI(): void {
    document.querySelectorAll<HTMLElement>('[data-provider]').forEach((el) => {
      const prov = el.getAttribute('data-provider');
      const isSelected = prov === this.currentProvider;
      if (isSelected) {
        el.classList.add('border-white', 'bg-zinc-900', 'text-white');
        el.classList.remove('border-zinc-800', 'bg-black', 'text-zinc-400');
      } else {
        el.classList.remove('border-white', 'bg-zinc-900', 'text-white');
        el.classList.add('border-zinc-800', 'bg-black', 'text-zinc-400');
      }
    });
    this.updateTelemetryUI();
  }

  private updateModeUI(): void {
    document.querySelectorAll<HTMLElement>('[data-mode]').forEach((el) => {
      const mode = el.getAttribute('data-mode');
      const isSelected = mode === this.currentMode;
      if (isSelected) {
        el.classList.add('border-white', 'bg-zinc-900', 'text-white');
        el.classList.remove('border-zinc-800', 'bg-black', 'text-zinc-400');
      } else {
        el.classList.remove('border-white', 'bg-zinc-900', 'text-white');
        el.classList.add('border-zinc-800', 'bg-black', 'text-zinc-400');
      }
    });

    const headerMode = document.getElementById('header-mode-badge');
    if (headerMode) headerMode.textContent = `MODE: ${this.currentMode.toUpperCase()}`;

    this.updateTelemetryUI();
  }

  private updateRoleUI(): void {
    document.querySelectorAll<HTMLElement>('[data-role]').forEach((el) => {
      const role = el.getAttribute('data-role');
      const isSelected = role === this.currentRole;
      if (isSelected) {
        el.classList.add('border-white', 'bg-zinc-900', 'text-white');
        el.classList.remove('border-zinc-800', 'bg-black', 'text-zinc-400');
      } else {
        el.classList.remove('border-white', 'bg-zinc-900', 'text-white');
        el.classList.add('border-zinc-800', 'bg-black', 'text-zinc-400');
      }
    });

    const headerRole = document.getElementById('header-role-badge');
    if (headerRole) headerRole.textContent = `ROLE: ${this.currentRole.toUpperCase()}`;

    this.updateTelemetryUI();
  }

  private updateModelDetailsUI(): void {
    const m = ModelRegistry.getModelById(this.currentModel);
    if (!m) return;

    const t = this.t();
    const isFree = m.pricing.freeTierStatus === '100% Free Quota Available';

    const headerName = document.getElementById('header-model-name');
    if (headerName) headerName.textContent = m.name;

    const headerBadge = document.getElementById('header-model-badge');
    if (headerBadge) {
      headerBadge.textContent = isFree ? '[FREE]' : '[PAID]';
      headerBadge.className = isFree
        ? 'px-1.5 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-700 text-[10px] font-bold'
        : 'px-1.5 py-0.2 bg-amber-950 text-amber-400 border border-amber-700 text-[10px] font-bold';
    }

    const specName = document.getElementById('model-spec-name');
    if (specName) specName.textContent = m.name;

    const specProv = document.getElementById('model-spec-provider');
    if (specProv) specProv.textContent = m.provider;

    const specBadge = document.getElementById('model-spec-badge');
    if (specBadge) {
      specBadge.textContent = isFree ? t.badgeFree : t.badgePaid;
      specBadge.className = isFree
        ? 'px-2 py-0.5 border border-emerald-600 text-emerald-400 font-bold text-xs'
        : 'px-2 py-0.5 border border-amber-600 text-amber-400 font-bold text-xs';
    }

    const specContext = document.getElementById('model-spec-context');
    if (specContext) specContext.textContent = `${m.contextWindow.toLocaleString()} tokens`;

    const specMaxOut = document.getElementById('model-spec-maxout');
    if (specMaxOut) specMaxOut.textContent = `${m.maxOutputTokens.toLocaleString()} tokens`;

    const specUsd = document.getElementById('model-spec-usd');
    if (specUsd) specUsd.textContent = `In: ${m.pricing.inputPer1MTokensUSD} | Out: ${m.pricing.outputPer1MTokensUSD}`;

    const specEur = document.getElementById('model-spec-eur');
    if (specEur) specEur.textContent = `In: ${m.pricing.inputPer1MTokensEUR} | Out: ${m.pricing.outputPer1MTokensEUR}`;

    const specQuota = document.getElementById('model-spec-quota');
    if (specQuota) specQuota.textContent = m.pricing.freeTierDetails;

    this.updateTelemetryUI();
  }

  private updateKeyStatusUI(): void {
    const t = this.t();
    const statusEl = document.getElementById('deck-key-status');
    const input = document.getElementById('deck-api-key-input') as HTMLInputElement;
    const customKey = localStorage.getItem('evabot_gemini_key') || '';

    if (input && !input.value) {
      input.value = customKey;
    }

    if (statusEl) {
      if (customKey) {
        statusEl.textContent = t.keyStatusCustom;
        statusEl.className = 'text-xs font-bold text-emerald-400 border border-emerald-800 bg-emerald-950/40 px-2.5 py-1';
      } else {
        statusEl.textContent = `${t.keyStatusAmbient} (${this.userAccount})`;
        statusEl.className = 'text-xs font-bold text-emerald-400 border border-emerald-800 bg-emerald-950/40 px-2.5 py-1';
      }
    }
  }

  private renderWelcomeMessage(): void {
    const t = this.t();
    const m = ModelRegistry.getModelById(this.currentModel);
    const welcome = `+==============================================================================+
| ${t.welcomeHeading}
+==============================================================================+
${t.welcomeNotice}

• PROVIDER: [${this.currentProvider.toUpperCase()}] // Google Cloud Vertex & AI Studio
• ACTIVE MODEL: ${m?.name || this.currentModel} [${m?.pricing.freeTierStatus}]
• OPERATIONAL MODE: [${this.currentMode.toUpperCase()}]
• CORPORATE PERSONA: [${this.currentRole.toUpperCase()}]
• CURRENCY ACCOUNTING: Strictly USD ($) and EUR (€) Compliance

Execute commands or submit analytical inquiries below. Click '[ CONTROL PANEL ]' to toggle neural deck parameters.`;

    this.appendMessage({
      role: 'model',
      text: welcome,
      timestamp: new Date().toLocaleTimeString(),
      metadata: {
        model: this.currentModel,
        mode: this.currentMode,
        role: this.currentRole,
        provider: this.currentProvider,
      },
    });
  }

  private buildSystemInstruction(): string {
    const rolePrompts: Record<RoleId, string> = {
      ceo: 'Act as EvaBot Executive Strategist & CEO. Deliver decisive, high-level corporate insight, focus on strategic objectives, market leadership, and return on investment.',
      cto: 'Act as EvaBot Principal System Architect & CTO. Focus strictly on distributed systems design, zero-downtime scalability, fault tolerance, robust engineering, and clean code.',
      ciso: 'Act as EvaBot Cyber Security Specialist & CISO. Scrutinize zero-trust architecture, threat modeling, cryptographic integrity, attack surface minimization, and zero-day resilience.',
      cfo: 'Act as EvaBot Financial & Risk Analyst & CFO. Provide rigorous financial and tokenomics evaluations. All calculations and budget estimates must be strictly in USD ($) and EUR (€). Calculations must be exclusively in USD ($) or EUR (€).',
      ux: 'Act as EvaBot Creative Director & UX Designer. Focus on minimalist cyber aesthetics, high-contrast monochrome terminal ergonomics, clarity, and frictionless human-agent interaction.',
      dev: 'Act as EvaBot Lead Full-Stack Software Engineer. Provide complete, production-grade, bug-free implementations with clear type safety, algorithmic precision, and tests.',
      rsch: 'Act as EvaBot AI Research Scientist. Analyze attention topologies, context retention, chain-of-thought paradigms, and neurosymbolic reasoning loops.',
      legal: 'Act as EvaBot Compliance Counsel & Legal Officer. Scrutinize regulatory alignment (GDPR, EU AI Act), data sovereignty, intellectual property, and ethical AI standards.',
    };

    const modePrompts: Record<ModeId, string> = {
      solo: 'Mode: SOLO. Focus with maximum precision on the assigned corporate role mandate.',
      broadcast: 'Mode: BROADCAST. Deliver a comprehensive multi-dimensional breakdown analyzing technical feasibility, financial impact (USD/EUR only), security risks, and operational execution.',
      dialogue: 'Mode: DIALOGUE. Maintain high-cadence, crisp, responsive interactive cyber-terminal communication.',
      consilium: 'Mode: CONSILIUM. Convene an executive council of leadership roles (CEO, CTO, CISO, CFO). Deliberate trade-offs across perspectives, then synthesize into a decisive actionable consensus.',
    };

    const langDirective = this.currentLang === 'uk'
      ? 'Respond strictly in Ukrainian (Українська мова). Maintain technical precision and cyber-terminal formatting.'
      : this.currentLang === 'ru'
      ? 'Respond strictly in Russian. Maintain technical precision and cyber-terminal formatting. Adhere strictly to the rule: Use strictly USD ($) or EUR (€) for all pricing and metrics.'
      : 'Respond strictly in English. Maintain technical precision and cyber-terminal formatting.';

    return `${rolePrompts[this.currentRole]}\n\n${modePrompts[this.currentMode]}\n\n${langDirective}\n\nFormat your responses with clean cyber-terminal markdown, crisp ASCII tables or bullet points where appropriate, and clean code blocks.`;
  }

  private async handleSend(): Promise<void> {
    if (this.isGenerating) {
      if (this.abortController) {
        this.abortController.abort();
      }
      return;
    }

    const input = document.getElementById('user-input') as HTMLTextAreaElement;
    const text = input?.value.trim();
    if (!text) return;

    input.value = '';
    const now = new Date().toLocaleTimeString();

    this.appendMessage({
      role: 'user',
      text,
      timestamp: now,
      metadata: {
        mode: this.currentMode,
        role: this.currentRole,
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

      const historyPayload = this.messages
        .filter((m) => m.role === 'user' || m.role === 'model')
        .map((m) => ({
          role: m.role,
          parts: [{ text: m.text }],
        }));

      const t0 = performance.now();

      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({
         message: text,
         model: this.currentModel,
         provider: this.currentProvider,
         history: historyPayload,
         apiKey: customKey || undefined,
         systemInstruction: this.buildSystemInstruction(),
       }),
        signal: this.abortController.signal,
      });

      this.lastLatencyMs = Math.round(performance.now() - t0);
      this.updateTelemetryUI();

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({ error: 'Transmission error' }));
        throw new Error(errJson.error || `HTTP ${response.status}`);
      }

      if (!response.body) throw new Error('Readable stream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulatedText = '';
      let buffer = '';

      // Watchdog: a silent provider stream must never wedge the chat in the
      // '...' state. Abort when no chunk arrives for 60s (or 120s total).
      let lastActivity = Date.now();
      const watchdog = setInterval(() => {
        if (Date.now() - lastActivity > 60_000) {
          this.abortController?.abort();
        }
      }, 5_000);
      const totalTimer = setTimeout(() => this.abortController?.abort(), 120_000);

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          lastActivity = Date.now();

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.slice(6).trim();
              if (!dataStr) continue;

              try {
                const data = JSON.parse(dataStr);
                if (data.chunk) {
                  accumulatedText += data.chunk;
                  textSpan.innerHTML = this.renderMarkdown(accumulatedText);
                  this.scrollToBottom();
                } else if (data.error) {
                  accumulatedText += `\n\n[Error: ${data.error}]`;
                  textSpan.innerHTML = this.renderMarkdown(accumulatedText);
                }
              } catch {
                // Ignore partial JSON
              }
            }
          }
        }
      } finally {
        clearInterval(watchdog);
        clearTimeout(totalTimer);
      }

      if (!accumulatedText.trim()) {
        throw new Error('Model returned empty response (fallback exhausted)');
      }

      this.messages.push({
        role: 'model',
        text: accumulatedText,
        timestamp: new Date().toLocaleTimeString(),
        metadata: {
          model: this.currentModel,
          mode: this.currentMode,
          role: this.currentRole,
          provider: this.currentProvider,
        },
      });
      this.updateStatusLight('online');
    } catch (err: any) {
      this.updateStatusLight('error');
      if (err.name === 'AbortError') {
        textSpan.innerHTML += '\n<span class="text-amber-400 font-mono text-xs"> [STREAM_HALTED_BY_OPERATOR]</span>';
      } else {
        textSpan.innerHTML = `<span class="text-rose-500 font-mono text-xs">[ERROR] TRANSMISSION_ERROR: ${this.escapeHtml(err.message)}</span>`;
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

  private updateStatusLight(state: 'online' | 'busy' | 'error'): void {
    const t = this.t();
    const light = document.getElementById('telemetry-status-light');
    const text = document.getElementById('telemetry-status-text');

    if (state === 'online') {
      if (light) light.className = 'inline-block w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#22c55e]';
      if (text) {
        text.textContent = t.statusOnline;
        text.className = 'text-xs text-emerald-400 font-mono font-bold';
      }
    } else if (state === 'busy') {
      if (light) light.className = 'inline-block w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-pulse';
      if (text) {
        text.textContent = t.statusBusy;
        text.className = 'text-xs text-amber-400 font-mono font-bold';
      }
    } else {
      if (light) light.className = 'inline-block w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_#ef4444]';
      if (text) {
        text.textContent = t.statusError;
        text.className = 'text-xs text-rose-500 font-mono font-bold';
      }
    }
  }

  private updateSendButtonState(generating: boolean): void {
    const t = this.t();
    const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
    if (!sendBtn) return;

    if (generating) {
      sendBtn.textContent = t.stopBtn;
      sendBtn.className = 'px-4 py-2 border border-amber-500 bg-amber-950/40 text-amber-400 font-bold text-xs tracking-wider transition-all hover:bg-amber-900/60 font-mono';
    } else {
      sendBtn.textContent = t.transmitBtn;
      sendBtn.className = 'px-4 py-2 border border-white bg-white text-black font-bold text-xs tracking-wider transition-all hover:bg-zinc-200 active:scale-95 font-mono';
    }
  }

  private appendMessage(msg: WebMessage): void {
    this.messages.push(msg);
    const el = this.createMessageBubble(msg.role, msg.text, msg.timestamp);
    const container = document.getElementById('messages-container');
    if (container) {
      container.appendChild(el);
      this.scrollToBottom();
      this.setupCodeCopyButtons();
    }
  }

  private createMessageBubble(role: 'user' | 'model' | 'system', text: string, timestamp: string): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'w-full mb-4 animate-fade-in font-mono text-sm';

    const isUser = role === 'user';
    const isSystem = role === 'system';

    const card = document.createElement('div');
    card.className = isUser
      ? 'border border-zinc-700 bg-black p-3 sm:p-4 text-white'
      : isSystem
      ? 'border border-dashed border-zinc-800 bg-black p-2 text-zinc-400 text-xs text-center'
      : 'border border-zinc-800 bg-black p-3 sm:p-4 text-white';

    const header = document.createElement('div');
    header.className = 'text-xs text-zinc-500 mb-2 flex items-center justify-between gap-2 border-b border-zinc-900 pb-1.5 font-mono';

    const callsign = isUser
      ? `┌─ [${timestamp}] [USER // OPERATOR]`
      : `┌─ [${timestamp}] [EVA // ${this.currentModel.toUpperCase()} // ${this.currentMode.toUpperCase()} // ${this.currentRole.toUpperCase()}]`;

    header.innerHTML = `
      <span class="font-bold ${isUser ? 'text-white' : 'text-zinc-300'}">${callsign}</span>
      <span class="text-zinc-600 text-[11px]">${isUser ? 'TX_OK' : 'RX_OK [OK]'}</span>
    `;

    const body = document.createElement('div');
    body.className = 'message-body font-mono text-zinc-200 leading-relaxed overflow-x-auto';
    body.innerHTML = this.renderMarkdown(text);

    card.appendChild(header);
    card.appendChild(body);

    const footer = document.createElement('div');
    footer.className = 'text-xs text-zinc-700 mt-2 font-mono select-none';
    footer.textContent = '└──────────────────────────────────────────────────────────';
    card.appendChild(footer);

    wrapper.appendChild(card);

    const container = document.getElementById('messages-container');
    container?.appendChild(wrapper);
    return wrapper;
  }

  private renderMarkdown(md: string): string {
    if (!md) return '';

    let html = md;

    html = html.replace(/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g, (_match, lang, code) => {
      const language = lang || 'text';
      const t = this.t();
      return `
        <div class="code-block-wrapper my-3 border border-zinc-800 bg-black font-mono text-xs">
          <div class="flex justify-between items-center px-3 py-1.5 border-b border-zinc-800 bg-zinc-950 text-zinc-400">
            <span class="font-bold uppercase tracking-widest text-[11px] text-white">┌ [CODE: ${language.toUpperCase()}]</span>
            <button class="copy-code-btn px-2 py-0.5 border border-zinc-700 bg-black hover:bg-zinc-800 text-zinc-200 transition-all text-[10px]" data-code="${encodeURIComponent(code)}">${t.copyBtn}</button>
          </div>
          <pre class="p-3 overflow-x-auto text-zinc-200"><code>${this.escapeHtml(code)}</code></pre>
          <div class="px-3 py-0.5 border-t border-zinc-900 text-zinc-700 text-[10px]">└──────────────────────────────────────────────</div>
        </div>
      `;
    });

    html = html.replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 border border-zinc-800 bg-zinc-950 text-white font-mono text-xs">$1</code>');
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="text-white font-bold">$1</strong>');
    html = html.replace(/\*([^*]+)\*/g, '<em class="text-zinc-400">$1</em>');

    html = html.replace(/^### (.*$)/gim, '<h3 class="text-sm font-bold text-white mt-3 mb-1 border-b border-zinc-800 pb-0.5">> $1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-base font-bold text-white mt-4 mb-1.5 border-b border-zinc-700 pb-1">>> $1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-lg font-bold text-white mt-4 mb-2 border-b border-zinc-600 pb-1">>>> $1</h1>');

    html = html.replace(/^\s*-\s+(.*$)/gim, '<div class="flex items-start gap-2 ml-2 my-0.5 text-zinc-300"><span class="text-zinc-500">•</span><span>$1</span></div>');
    html = html.replace(/\n\n/g, '<br/><br/>');

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
    notif.className = 'text-center my-2 text-xs font-mono text-zinc-500';
    notif.innerHTML = ` ${this.renderMarkdown(text)}`;
    container.appendChild(notif);
    this.scrollToBottom();
  }

  private scrollToBottom(): void {
    const main = document.getElementById('chat-scroll-area');
    if (main) {
      main.scrollTop = main.scrollHeight;
    }
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
