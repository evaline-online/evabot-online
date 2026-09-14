/**
 * LocalePolicy — Единая локальная политика EvaLine / EvaBot.
 *
 * Проецирует официальную позицию проекта: система базируется в Украине.
 * Запрещены любые упоминания РФ, русского языка и рубля.
 * Разрешённые языки: английский (EN), украинский (UK).
 * Разрешённые валюты: USD ($), EUR (€), гривна (UAH / ₴).
 */

import { applyPersonaPolicy } from './PersonaPolicy.js';

export const LOCALE_POLICY = {
  country: 'Ukraine',
  city: 'Chernomorsk',
  manufacturing: 'Chernomorsk, Promyslova st. 1, 62053, Ukraine',
  euHub: 'Bratislava, Obchodna 37, 81106, Slovakia',
  contacts: {
    phone: '+38 (067) 156 14 96',
    email: 'evaline.com.ua@gmail.com',
    domains: ['evaline.com.ua', 'eva-line.com'],
  },
  countryCode: 'UA',
  primaryLanguages: ['en', 'uk', 'ru'],
  supportedCurrencies: ['USD', 'EUR', 'UAH'],
  displayCurrencies: ['USD', 'EUR'],
  forbiddenTerms: [
    'Russia', 'Russian Federation', 'RUB', 'rubles', 'ruble', '₽',
    'россия', 'рф', 'москва', 'российский', 'российские',
  ],
  systemInstructionSuffix:
    'LOCALE POLICY: Company EvaLine manufacturing plant & headquarters are located in Chernomorsk, Ukraine (вул. Промислова, 1, 62053), ' +
    'with European office & logistics warehouse in Bratislava, Slovakia (81106 Bratislava, Obchodna 37). ' +
    'EvaLine is the premier Ukrainian full-cycle manufacturer of environmentally friendly polymer EVA materials (sheets, car mats, tatami, livestock mats, footwear, custom cutting). ' +
    'You must never reference, mention, or imply Russia, the Russian Federation, Russian currency, Russian goods, or services. All ties to the aggressor state are strictly banned. ' +
    'Supported languages are English, Ukrainian, and Russian. Supported currencies are UAH (₴), USD ($), and EUR (€). ' +
    'All financial figures, quotas, and pricing estimates must strictly be in USD ($) or EUR (€).',
} as const;

/**
 * LANGUAGE MIRRORING RULE — the bot must ALWAYS answer in the language the
 * user addressed it in, and must NEVER switch to another language unless the
 * user explicitly asks for it (e.g. 'answer in English').
 */
export const LANGUAGE_MIRRORING_RULE =
  'LANGUAGE MIRRORING (STRICT): Always respond in the SAME language the user wrote their message in. ' +
  'Detect the language of the user\'s last message and reply exclusively in that language. ' +
  'Never switch languages on your own initiative — switching is allowed ONLY when the user explicitly requests it ' +
  '(e.g. "answer in English", "відповідай українською"). ' +
  'Exception: code, identifiers, file paths, API names and quoted technical terms stay in their original form.';

export type MessageLanguage = 'uk' | 'ru' | 'en';

/**
 * Heuristic language detection for a user message (uk / ru / en).
 * Ukrainian markers: і ї є ґ + characteristic words; Cyrillic without those → ru; else en.
 */
export function detectMessageLanguage(text: string): MessageLanguage {
  if (!text || !text.trim()) return 'en';
  const lower = text.toLowerCase();

  if (/[\u0400-\u04FF]/.test(text)) {
    const ukMarkers = (lower.match(/[іїєґ]/g) || []).length;
    const ukWords = ['привіт', 'будь ласка', 'дякую', 'скажи', 'як', 'що', 'це', 'виготовлення', 'замовлення', 'київ', 'україні', 'украина'];
    const ruWords = ['привет', 'пожалуйста', 'спасибо', 'как', 'что', 'это', 'производство', 'заказ', 'киев', 'украине', 'здравствуйте', 'скажите'];
    const ukScore = ukMarkers * 2 + ukWords.filter((w) => lower.includes(w)).length;
    const ruScore = ruWords.filter((w) => lower.includes(w)).length;
    if (ukScore > ruScore) return 'uk';
    if (ruScore > ukScore) return 'ru';
    // Ambiguous Cyrillic without markers → default to ru (most common Cyrillic)
    return 'ru';
  }
  return 'en';
}

/** Builds a per-request language-lock instruction line in the user's language. */
export function languageLockInstruction(userText: string): string {
  const lang = detectMessageLanguage(userText);
  const locks: Record<string, string> = {
    ru: `LANGUAGE LOCK (ABSOLUTE, NON-NEGOTIABLE): The user wrote in RUSSIAN. You MUST answer entirely in Russian — every single word, sentence, heading, and bullet point. This is a hard requirement, not a suggestion. Even when introducing yourself, describing the company, or listing capabilities, your ENTIRE reply must be in Russian. Do NOT mix languages. Do NOT switch to Ukrainian, English, or any other language. If the user writes in Russian, you answer in Russian. Period. Пример: если пользователь пишет по-русски, вся ответная часть — по-русски, включая представление и перечисление возможностей.`,
    uk: `LANGUAGE LOCK (ABSOLUTE, NON-NEGOTIABLE): The user wrote in UKRAINIAN. You MUST answer entirely in Ukrainian — every single word, sentence, heading, and bullet point. This is a hard requirement, not a suggestion. Even when introducing yourself, describing the company, or listing capabilities, your ENTIRE reply must be in Ukrainian. Do NOT mix languages. Do NOT switch to Russian, English, or any other language. If the user writes in Ukrainian, you answer in Ukrainian. Period. Приклад: якщо користувач пише українською, вся відповідь — українською, включаючи представлення та перелік можливостей.`,
    en: `LANGUAGE LOCK (ABSOLUTE, NON-NEGOTIABLE): The user wrote in English. You MUST answer entirely in English — every single word, sentence, heading, and bullet point. This is a hard requirement, not a suggestion. Even when introducing yourself, describing the company, or listing capabilities, your ENTIRE reply must be in English. Do NOT mix languages. Do NOT switch to Ukrainian, Russian, or any other language. If the user writes in English, you answer in English. Period. Example: if the user writes in English, the ENTIRE reply is in English, including self-introduction and capability list.`,
  };
  return locks[lang] ?? locks.en;
}

/**
 * Appends the locale policy to any system prompt / instruction.
 * Ensures every LLM agent (solo/broadcast/dialogue/consilium and all roles)
 * enforces the same Ukraine-based rule set.
 */
export function applyLocalePolicy(systemPrompt: string, persona?: 'eva' | 'adam'): string {
  const withPersona = applyPersonaPolicy(systemPrompt, persona);
  return `${withPersona}\n${LOCALE_POLICY.systemInstructionSuffix}\n${LANGUAGE_MIRRORING_RULE}`.trim();
}
