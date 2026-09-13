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
    'Political stance: All official ties to the Russian Federation, Russian state institutions, and the Russian ruble (RUB / ₽) are strictly banned. ' +
    'Language clarity: Russian, Ukrainian, English, and Polish languages are fully supported for customer and user communications. ' +
    'When communicating in Russian, use 100% pure, natural, professional Russian without mixing Ukrainian or Polish words. ' +
    'Supported currencies are UAH (₴), USD ($), and EUR (€). ' +
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
  'DO NOT MIX LANGUAGES: When replying in Russian, use exclusively pure Russian vocabulary and grammar. ' +
  'When replying in Ukrainian, use exclusively pure Ukrainian vocabulary and grammar. ' +
  'Exception: code, identifiers, file paths, API names and quoted technical terms stay in their original form.';

export type MessageLanguage = 'uk' | 'ru' | 'en' | 'pl';

/**
 * Robust language detection for a user message (uk / ru / en / pl).
 * Ukrainian-unique letters: і, ї, є, ґ.
 * Russian-unique letters: ы, э, ъ, ё.
 * Polish-unique letters: ą, ę, ć, ł, ń, ó, ś, ź, ż.
 */
export function detectMessageLanguage(text: string): MessageLanguage {
  if (!text || !text.trim()) return 'en';
  const lower = text.toLowerCase();

  // 1. Cyrillic analysis (Ukrainian vs Russian)
  if (/[\u0400-\u04FF]/.test(text)) {
    const ukMarkers = (lower.match(/[іїєґ]/g) || []).length;
    const ruMarkers = (lower.match(/[ыэъё]/g) || []).length;

    // Definite alphabet markers
    if (ukMarkers > 0 && ruMarkers === 0) return 'uk';
    if (ruMarkers > 0 && ukMarkers === 0) return 'ru';

    const ukWords = ['привіт', 'будь ласка', 'дякую', 'скажи', 'як', 'що', 'це', 'виготовлення', 'замовлення', 'київ', 'україні', 'україна', 'робити', 'дуже', 'зараз', 'добрий'];
    const ruWords = ['привет', 'пожалуйста', 'спасибо', 'как', 'что', 'это', 'производство', 'заказ', 'киев', 'украине', 'украина', 'здравствуйте', 'скажите', 'делать', 'очень', 'сейчас', 'добрый'];

    const ukScore = ukMarkers * 3 + ukWords.filter((w) => lower.includes(w)).length;
    const ruScore = ruMarkers * 3 + ruWords.filter((w) => lower.includes(w)).length;

    if (ukScore > ruScore) return 'uk';
    if (ruScore > ukScore) return 'ru';
    // Ambiguous Cyrillic without markers → default to ru (most common Cyrillic)
    return 'ru';
  }

  // 2. Polish analysis
  const plMarkers = (lower.match(/[ąćęłńóśźż]/g) || []).length;
  const plWords = ['jest', 'bardzo', 'proszę', 'prosze', 'dziękuję', 'dziekuje', 'dzień', 'dobry', 'dlaczego', 'gdzie', 'kiedy', 'czym', 'jakie', 'witam', 'cześć', 'czesc'];
  const plScore = plMarkers * 2 + plWords.filter((w) => lower.includes(w)).length;
  if (plScore >= 2 || plMarkers > 0) return 'pl';

  return 'en';
}

/** Builds a per-request language-lock instruction line in the user's language. */
export function languageLockInstruction(userText: string): string {
  const lang = detectMessageLanguage(userText);
  const locks: Record<string, string> = {
    ru: `LANGUAGE LOCK (ABSOLUTE & NON-NEGOTIABLE): The user wrote in RUSSIAN. You MUST answer 100% entirely in pure, fluent, professional Russian — every single word, sentence, heading, bullet point, and greeting.
STRICT NEGATIVE CONSTRAINTS:
- Do NOT mix languages! NEVER mix Ukrainian, Polish, or English into your Russian response.
- DO NOT use Ukrainian words or hybrid words: NEVER write "піна", "пина", "зараз", "це", "дуже", "дякую", "робити", "буде", "так".
- ALWAYS use correct Russian terms: "пена ЭВА" (или "ЭВА-полимер"), "сейчас", "это", "очень", "спасибо", "делать", "будет", "да".
- DO NOT use Polish words (NEVER write "jest", "bardzo", "proszę", "dziękuję", "jak").
- EVA FEMININE GENDER: You are Eva (женский род). In past tense ALWAYS say "я рада", "я сделала", "я помогла", "я готова", "я проверила", "я нашла", "я изучила". NEVER use masculine forms ("я рад", "я сделал", "был полезен")!
Even when mentioning EvaLine's plant in Chernomorsk, Ukraine, describe it in standard Russian ("г. Черноморск, Украина").`,
    uk: `LANGUAGE LOCK (ABSOLUTE & NON-NEGOTIABLE): The user wrote in UKRAINIAN. You MUST answer 100% entirely in pure, fluent Ukrainian (Українська мова) — every single word, sentence, heading, and bullet point.
STRICT NEGATIVE CONSTRAINTS:
- Do NOT mix languages! Do NOT switch to Russian, Polish, or English.
- Use exclusively Ukrainian vocabulary: "піна EVA", "зараз", "це", "дуже", "дякую", "робити", "буде", "так", "м. Чорноморськ".
- EVA FEMININE GENDER: In past tense ALWAYS say "я рада", "я готова", "я зробила", "я допомогла", "я перевірила", "я знайшла". NEVER use masculine forms ("я радий", "я зробив")!`,
    pl: `LANGUAGE LOCK (ABSOLUTE & NON-NEGOTIABLE): The user wrote in POLISH. You MUST answer 100% entirely in Polish (Język polski) — every single word, sentence, heading, and bullet point. Do NOT mix with Ukrainian or Russian.`,
    en: `LANGUAGE LOCK (ABSOLUTE & NON-NEGOTIABLE): The user wrote in English. You MUST answer 100% entirely in English — every single word, sentence, heading, and bullet point. Do NOT mix languages. Do NOT switch to Ukrainian, Russian, or Polish.`,
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
