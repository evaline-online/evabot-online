export type SupportedLocale = 'en' | 'uk' | 'ru';

export interface LocaleDefinition {
  statusOnline: string;
  statusBusy: string;
  statusOffline: string;
  ping: string;
  mesh: string;
  live: string;
  model: string;
  mode: string;
  pool: string;
  lang: string;
  commandsLabel: string;
  databasesLabel: string;
  databasesValue: string;
  loadLabel: string;
  brainLabel: string;
  faceLabel: string;
  greeting: string;
  placeholder: string;
  helpTitle: string;
  helpCommands: Array<{ cmd: string; desc: string }>;
  langSwitched: string;
  unknownCommand: string;
}

const DICTIONARY: Record<SupportedLocale, LocaleDefinition> = {
  en: {
    statusOnline: 'ONLINE',
    statusBusy: 'BUSY',
    statusOffline: 'OFFLINE',
    ping: 'Ping:',
    mesh: 'Mesh:',
    live: 'Live:',
    model: 'Model:',
    mode: 'Mode:',
    pool: 'models (/models)',
    lang: 'Lang:',
    commandsLabel: 'Commands:',
    databasesLabel: 'Databases:',
    databasesValue: 'Chroma Vector (1075 embeddings) [OK] · SQLite FTS5 (1086 chunks) [OK] · Memory KB (178 docs) [OK]',
    loadLabel: 'Load:',
    brainLabel: 'Brain(Frankfurt)',
    faceLabel: 'Face(Iowa)',
    greeting: 'Connected to evabot.online. Type a message or command (/help).',
    placeholder: 'Type a message or command (/help)...',
    helpTitle: 'SYSTEM COMMANDS:',
    helpCommands: [
      { cmd: '/about', desc: 'About EvaBot Online, EvaLine manufacturing & GCP cluster architecture' },
      { cmd: '/top [free|paid|speed]', desc: 'Top models leaderboard by quality and recency' },
      { cmd: '/models', desc: 'Full interactive model catalog' },
      { cmd: '/info <model>', desc: 'Technical passport, context limits & token pricing' },
      { cmd: '/company [evaline|free|paid]', desc: '10-Agent Autonomous AI Corporation' },
      { cmd: '/evaline', desc: 'EvaLine Enterprise Business Swarm (Mats, SCM, 24/7 Support)' },
      { cmd: '/products [category|query]', desc: 'EvaLine product catalog: stats, categories, search' },
      { cmd: '/who [role]', desc: 'Corporate knowledge matrix: who knows what & info exchange' },
      { cmd: '/cost', desc: 'Financial ledger, token burn & cluster OpEx' },
      { cmd: '/lang [en|uk|ru]', desc: 'Instant language switch (English, Ukrainian, Russian)' },
      { cmd: '/mcp', desc: 'Active 21 MCP tool servers status' },
      { cmd: '/lsp', desc: 'Active 4 Language Server Protocol daemons' },
      { cmd: '/free, /paid', desc: 'Filter models by tariff tier' },
      { cmd: '/mode [solo|consilium]', desc: 'Toggle single model or multi-agent consilium' },
      { cmd: '/consilium [topic]', desc: 'Run multi-agent deliberation and synthesis' },
      { cmd: '/sephirot [topic]', desc: 'Sephirot/Tetraxis consilium: 10 Tree-of-Life agents' },
      { cmd: '/auto [on|off|test]', desc: 'Smart auto-switch: best FREE model per message' },
      { cmd: '/subagent [1-4] <task>', desc: 'Parallel sub-agents (Analyst/Builder/Critic) + synthesis' },
      { cmd: '/history [N]', desc: 'Last N chat messages across all sessions' },
      { cmd: '/memory', desc: 'Memory stats: KB docs, FTS chunks, chat DB, pointers' },
      { cmd: '/search <query>', desc: 'Full-text search across chats and knowledge base' },
      { cmd: '/find <query>', desc: 'Alias of /search' },
      { cmd: '/services', desc: 'Systemd/docker services and DB backends status' },
      { cmd: '/servers', desc: 'Cluster view: evabot-agent-vm + evaline-micro-vm' },
      { cmd: '/news [tag]', desc: 'Curated Evaline news feed: war, odessa, economy, eva, trends' },
      { cmd: '/translate <to> <text>', desc: 'Google Translate: /translate uk Привіт світ (free tier 500k chars/mo)' },
      { cmd: '/health', desc: 'LLM provider health: circuit breakers & last 5 errors' },
      { cmd: '/debug [on|off|full]', desc: 'Debug mode: latency footer in replies & /log debug entries' },
      { cmd: '/log [N] [filter]', desc: 'Operation log tail: filter by level/kind/text' },
      { cmd: '/monitor', desc: 'Model monitor: TOP-10 free/paid coding models' },
      { cmd: '/say <text>', desc: 'Cloud TTS (Google Chirp3-HD/Wavenet free tier): speak text to /tmp/evabot-say.mp3' },
      { cmd: '/voices [uk|ru|en]', desc: 'Voice catalog: Chirp3-HD & Wavenet free families, gender + current Eva/Adam pick' },
      { cmd: '/voices set eva|adam <voice>', desc: 'Switch TTS persona voice (free families only), persisted in data/voice-prefs.json' },
      { cmd: '/settings', desc: 'Current settings table: locale, model, debug, TTS/STT/translate usage, developer mode' },
      { cmd: '/agents', desc: 'Agent roster: 18 corporate roles + 10 Sephirot Tree-of-Life nodes' },
      { cmd: '/emoji [on|off]', desc: 'Emoji rendering in replies (off = strip emoji, default)' },
      { cmd: '/listen <file>', desc: 'Transcribe a local audio file via Google Cloud STT (uk/ru/en)' },
      { cmd: '/sys', desc: 'Self-awareness: current model, cluster, company, KB stats' },
      { cmd: '/developer [unlock|status|lock]', desc: 'Password-protected developer mode (EVADEV_PASSWORD, TTL 2h)' },
      { cmd: '/clear', desc: 'Clear terminal screen' },
    ],
    langSwitched: 'Language switched to English (EN). Interface updated instantly.',
    unknownCommand: 'Unknown command: {cmd}. Type /help for assistance.',
  },
  uk: {
    statusOnline: 'ОНЛАЙН',
    statusBusy: 'ЗАЙНЯТИЙ',
    statusOffline: 'ОФЛАЙН',
    ping: 'Пінг:',
    mesh: 'Mesh:',
    live: 'Live:',
    model: 'Модель:',
    mode: 'Режим:',
    pool: 'моделей (/models)',
    lang: 'Мова:',
    commandsLabel: 'Команди:',
    databasesLabel: 'Бази даних:',
    databasesValue: 'Chroma Vector (1075 ембедінгів) [OK] · SQLite FTS5 (1086 чанків) [OK] · Memory KB (178 док) [OK]',
    loadLabel: 'Навантаження:',
    brainLabel: 'Brain(Frankfurt)',
    faceLabel: 'Face(Iowa)',
    greeting: 'Підключено до evabot.online. Введіть повідомлення або команду (/help).',
    placeholder: 'Введіть повідомлення або команду (/help)...',
    helpTitle: 'СИСТЕМНІ КОМАНДИ:',
    helpCommands: [
      { cmd: '/about', desc: 'Про проект EvaBot Online, виробництво EvaLine та архітектуру GCP кластера' },
      { cmd: '/top [free|paid|speed]', desc: 'Рейтинг моделей за якістю та новизною' },
      { cmd: '/models', desc: 'Повний інтерактивний каталог моделей' },
      { cmd: '/info <model>', desc: 'Технічний паспорт, контекстне вікно та тарифи' },
      { cmd: '/company [evaline|free|paid]', desc: 'Ростер 10 автономних ШІ-агентів компанії' },
      { cmd: '/evaline', desc: 'Бізнес-система агентів EvaLine (Автоковрики, SCM, 24/7 Сапорт)' },
      { cmd: '/products [категорія|запит]', desc: 'Каталог продукції EvaLine: статистика, категорії, пошук' },
      { cmd: '/who [роль]', desc: 'Матриця знань компанії: хто що знає та обмін інформацією' },
      { cmd: '/cost', desc: 'Бухгалтерія, витрати токенів та собівартість OpEx' },
      { cmd: '/lang [en|uk|ru]', desc: 'Миттєва зміна мови (English, Українська, Русский)' },
      { cmd: '/mcp', desc: 'Статус пулу з 21 MCP-сервера' },
      { cmd: '/lsp', desc: 'Статус 4 глобальних мовних серверів LSP' },
      { cmd: '/free, /paid', desc: 'Фільтри моделей за тарифом' },
      { cmd: '/mode [solo|consilium]', desc: 'Перемикання режиму solo / консиліум' },
      { cmd: '/consilium [тема]', desc: 'Колегіальний аналіз та синтез консиліуму' },
      { cmd: '/sephirot [тема]', desc: 'Консиліум Сефірот/Тетраксис: 10 агентів Дерева Життя' },
      { cmd: '/auto [on|off|test]', desc: 'Розумний авто-вибір: найкраща БЕЗКОШТОВНА модель на повідомлення' },
      { cmd: '/subagent [1-4] <задача>', desc: 'Паралельні суб-агенти (Analyst/Builder/Critic) + синтез' },
      { cmd: '/history [N]', desc: 'Останні N повідомлень чату з усіх сесій' },
      { cmd: '/memory', desc: 'Статистика памʼяті: база знань, FTS чанки, чат-БД' },
      { cmd: '/search <запит>', desc: 'Полнотекстовий пошук по чатах і базі знань' },
      { cmd: '/find <запит>', desc: 'Синонім /search' },
      { cmd: '/services', desc: 'Статус systemd/docker сервісів і бекендів БД' },
      { cmd: '/servers', desc: 'Кластер: evabot-agent-vm + evaline-micro-vm' },
      { cmd: '/news [тег]', desc: 'Кураторські новини Evaline: war, odessa, economy, eva, trends' },
      { cmd: '/translate <мова> <текст>', desc: 'Переклад: /translate uk Привіт світ (free tier 500k симв/міс)' },
      { cmd: '/health', desc: 'Здоров’я LLM-провайдерів: circuit breakers та останні 5 помилок' },
      { cmd: '/debug [on|off|full]', desc: 'Режим налагодження: футер латентності у відповідях і debug-записи в /log' },
      { cmd: '/log [N] [фільтр]', desc: 'Журнал операцій: останні N записів, фільтр за рівнем/типом/текстом' },
      { cmd: '/monitor', desc: 'Модельний монітор: ТОП-10 free/paid моделей для кодингу' },
      { cmd: '/say <текст>', desc: 'Хмарний TTS (Google Chirp3-HD/Wavenet free tier): озвучити текст у /tmp/evabot-say.mp3 ("/скажи", "/сказать")' },
      { cmd: '/voices [uk|ru|en]', desc: 'Каталог голосів: Chirp3-HD та Wavenet (free tier), стать + поточний вибір Єва/Адам' },
      { cmd: '/voices set eva|adam <voice>', desc: 'Змінити голос персони (лише free-родини), зберігається у data/voice-prefs.json' },
      { cmd: '/settings', desc: 'Таблиця поточних налаштувань: мова, модель, debug, TTS/STT/переклад ліміти, режим розробника' },
      { cmd: '/agents', desc: 'Ростер агентів: 18 корпоративних ролей + 10 вузлів Сефірот (Дерево Життя)' },
      { cmd: '/emoji [on|off]', desc: 'Відображення емодзі у відповідях (off = вирізати, за замовчуванням)' },
      { cmd: '/listen <файл>', desc: 'Розпізнати локальний аудіофайл через Google Cloud STT ("/розпізнай <файл>")' },
      { cmd: '/sys', desc: 'Самоідентифікація системи: модель, кластер, компанія, БЗ' },
      { cmd: '/developer [unlock|status|lock]', desc: 'Захищений паролем режим розробника (EVADEV_PASSWORD, TTL 2 год)' },
      { cmd: '/clear', desc: 'Очистити екран термінала' },
    ],
    langSwitched: 'Мову перемкнено на українську (UK). Інтерфейс оновлено миттєво.',
    unknownCommand: 'Невідома команда: {cmd}. Введіть /help для довідки.',
  },
  ru: {
    statusOnline: 'ОНЛАЙН',
    statusBusy: 'ЗАНЯТ',
    statusOffline: 'ОФФЛАЙН',
    ping: 'Пинг:',
    mesh: 'Mesh:',
    live: 'Live:',
    model: 'Модель:',
    mode: 'Режим:',
    pool: 'моделей (/models)',
    lang: 'Язык:',
    commandsLabel: 'Команды:',
    databasesLabel: 'Базы данных:',
    databasesValue: 'Chroma Vector (1075 эмбеддингов) [OK] · SQLite FTS5 (1086 чанков) [OK] · Memory KB (178 док) [OK]',
    loadLabel: 'Нагрузка:',
    brainLabel: 'Brain(Frankfurt)',
    faceLabel: 'Face(Iowa)',
    greeting: 'Подключено к evabot.online. Введите сообщение или команду (/help).',
    placeholder: 'Введите сообщение или команду (/help)...',
    helpTitle: 'СИСТЕМНЫЕ КОМАНДЫ:',
    helpCommands: [
      { cmd: '/about', desc: 'О проекте EvaBot Online, производстве EvaLine и архитектуре GCP кластера' },
      { cmd: '/top [free|paid|speed]', desc: 'Топ моделей по качеству и новизне' },
      { cmd: '/models', desc: 'Полный интерактивный каталог моделей' },
      { cmd: '/info <model>', desc: 'Паспорт, контекстное окно и квоты модели' },
      { cmd: '/company [evaline|free|paid]', desc: 'Ростер 10 автономных ИИ-агентов компании' },
      { cmd: '/evaline', desc: 'Бизнес-система агентов EvaLine (Автоковрики, SCM, 24/7 Саппорт)' },
      { cmd: '/products [категория|запрос]', desc: 'Каталог продукции EvaLine: статистика, категории, поиск' },
      { cmd: '/who [роль]', desc: 'Матрица знаний компании: кто что знает и обмен информацией' },
      { cmd: '/cost', desc: 'Бухгалтерия, токены и себестоимость OpEx' },
      { cmd: '/lang [en|uk|ru]', desc: 'Мгновенное переключение языка (English, Украинский, Русский)' },
      { cmd: '/mcp', desc: 'Пул из 21 активного MCP-сервера' },
      { cmd: '/lsp', desc: 'Статус 4 языковых демонов LSP' },
      { cmd: '/free, /paid', desc: 'Фильтры моделей по тарифу' },
      { cmd: '/mode [solo|consilium]', desc: 'Смена режима solo / консилиум' },
      { cmd: '/consilium [тема]', desc: 'Запуск коллегиального анализа моделей' },
      { cmd: '/sephirot [тема]', desc: 'Консилиум Сфирот/Тетраксис: 10 агентов Древа Жизни' },
      { cmd: '/auto [on|off|test]', desc: 'Умный авто-выбор: лучшая БЕСПЛАТНАЯ модель на сообщение' },
      { cmd: '/subagent [1-4] <задача>', desc: 'Параллельные суб-агенты (Analyst/Builder/Critic) + синтез' },
      { cmd: '/history [N]', desc: 'Последние N сообщений чата из всех сессий' },
      { cmd: '/memory', desc: 'Статистика памяти: база знаний, FTS чанки, чат-БД' },
      { cmd: '/search <запрос>', desc: 'Полнотекстовый поиск по чатам и базе знаний' },
      { cmd: '/find <запрос>', desc: 'Синоним /search' },
      { cmd: '/services', desc: 'Статус systemd/docker сервисов и бекендов БД' },
      { cmd: '/servers', desc: 'Кластер: evabot-agent-vm + evaline-micro-vm' },
      { cmd: '/news [тег]', desc: 'Кураторские новости Evaline: war, odessa, economy, eva, trends' },
      { cmd: '/translate <язык> <текст>', desc: 'Перевод: /translate uk Привет мир (free tier 500k симв/мес)' },
      { cmd: '/health', desc: 'Здоровье LLM-провайдеров: circuit breakers и последние 5 ошибок' },
      { cmd: '/debug [on|off|full]', desc: 'Режим отладки: футер латентности в ответах и debug-записи в /log' },
      { cmd: '/log [N] [фильтр]', desc: 'Журнал операций: последние N записей, фильтр по уровню/типу/тексту' },
      { cmd: '/monitor', desc: 'Модельный монитор: ТОП-10 free/paid моделей для кодинга' },
      { cmd: '/say <текст>', desc: 'Облачный TTS (Google Chirp3-HD/Wavenet free tier): озвучить текст в /tmp/evabot-say.mp3 ("/скажи", "/сказать")' },
      { cmd: '/voices [uk|ru|en]', desc: 'Каталог голосов: Chirp3-HD и Wavenet (free tier), пол + текущий выбор Ева/Адам' },
      { cmd: '/voices set eva|adam <voice>', desc: 'Сменить голос персоны (только free-семейства), сохраняется в data/voice-prefs.json' },
      { cmd: '/settings', desc: 'Таблица текущих настроек: язык, модель, debug, лимиты TTS/STT/перевода, режим разработчика' },
      { cmd: '/agents', desc: 'Ростер агентов: 18 корпоративных ролей + 10 узлов Сфирот (Древо Жизни)' },
      { cmd: '/emoji [on|off]', desc: 'Отображение эмодзи в ответах (off = вырезать, по умолчанию)' },
      { cmd: '/listen <файл>', desc: 'Распознать локальный аудиофайл через Google Cloud STT ("/распознать <файл>")' },
      { cmd: '/sys', desc: 'Самоидентификация системы: модель, кластер, компания, БЗ' },
      { cmd: '/developer [unlock|status|lock]', desc: 'Защищённый паролем режим разработчика (EVADEV_PASSWORD, TTL 2 ч)' },
      { cmd: '/clear', desc: 'Очистить экран терминала' },
    ],
    langSwitched: 'Язык переключен на русский (RU). Интерфейс обновлен мгновенно.',
    unknownCommand: 'Неизвестная команда: {cmd}. Введите /help для справки.',
  },
};

export class I18nEngine {
  private static activeLocale: SupportedLocale = 'en';

  public static getLocale(): SupportedLocale {
    return this.activeLocale;
  }

  public static setLocale(localeInput: string): { locale: SupportedLocale; message: string } {
    const clean = localeInput.toLowerCase().trim();
    if (clean === 'uk' || clean === 'ua' || clean === 'ukr' || clean === 'ukrainian') {
      this.activeLocale = 'uk';
    } else if (clean === 'ru' || clean === 'rus' || clean === 'russian') {
      this.activeLocale = 'ru';
    } else {
      this.activeLocale = 'en';
    }

    return {
      locale: this.activeLocale,
      message: DICTIONARY[this.activeLocale].langSwitched,
    };
  }

  public static getStrings(locale?: SupportedLocale): LocaleDefinition {
    return DICTIONARY[locale || this.activeLocale] || DICTIONARY.en;
  }

  public static formatHelp(locale?: SupportedLocale): string {
    const s = this.getStrings(locale);
    const lines: string[] = [];
    lines.push('');
    lines.push('═'.repeat(78));
    lines.push(`  ${s.helpTitle}`);
    lines.push('═'.repeat(78));
    for (const c of s.helpCommands) {
      lines.push(`  ${c.cmd.padEnd(30)} - ${c.desc}`);
    }
    lines.push('═'.repeat(78));
    return lines.join('\n');
  }
}

/**
 * Emoji → ASCII replacement map used by the defensive renderer stripEmoji().
 * Box-drawing and geometric symbols (─│┌┐└┘├┤┬┴┼═║╔╗╚╝ ●○◆■□▪▫) are NEVER
 * touched: the rule is "no codepoints above U+2B00 except the allowed set".
 */
export const EMOJI_ASCII: Record<string, string> = {
  '🎤': '[ MIC ]',
  '🔊': '[ TTS:ON ]',
  '🔇': '[ TTS:OFF ]',
  '✅': '[OK]',
  '❌': '[X]',
  '✔': '[OK]',
  '✖': '[X]',
  '⚠': '[WRN]',
  '🔒': '[LOCK]',
  '🔓': '[UNLOCK]',
  '⏳': '[WAIT]',
  '🐞': '[DBG]',
  '🌳': '[=]',
  '📡': '>',
  '📰': 'NEWS',
  '🤖': '[BOT]',
  '👤': '[USER]',
  '⚡': '*',
  '⚙': '*',
  '★': '*',
  '♥': '*',
  '⚖': '*',
};

/**
 * Defensive renderer: strips/replaces emoji (including surrogate pairs and
 * variation selectors) from text before it is displayed. Allowed Unicode
 * symbols (box drawing, ●○◐◆■□▪▫) pass through untouched. When the map has
 * an ASCII equivalent it is used, otherwise the codepoint is removed.
 */
export function stripEmoji(input: string): string {
  if (!input) return '';
  return input.replace(
    /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{200D}\u{20E3}\u{1F1E6}-\u{1F1FF}]/gu,
    (m: string) => EMOJI_ASCII[m] ?? '',
  );
}
