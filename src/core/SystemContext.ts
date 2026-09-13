import os from 'node:os';
import { Config } from './Config.js';
import { BREAKER_PROVIDER_NAMES, getBreaker, providerOfModel } from './Resilience.js';
import { ProductCatalog } from './ProductCatalog.js';
import { knowledgeBase } from './KnowledgeBase.js';

export interface LastUsedModelInfo {
  model: string;
  provider: string;
  ts: number;
}

/**
 * Module-level "last model actually used by a chat request" registry.
 * ChatRouter / ChatEngine update it on every request so SystemContext can
 * answer "какая сейчас подключена модель?" with the REAL model, not a guess.
 */
let lastUsedModel: LastUsedModelInfo | null = null;

export function recordLastUsedModel(model: string, provider: string): void {
  const changed = !lastUsedModel || lastUsedModel.model !== model || lastUsedModel.provider !== provider;
  lastUsedModel = { model, provider, ts: Date.now() };
  // A different model just served a request → the 60s-cached block is stale.
  if (changed) SystemContext.invalidate();
}

export function getLastUsedModel(): LastUsedModelInfo | null {
  return lastUsedModel;
}

/**
 * SystemContext — compact self-awareness block (1200 chars) describing the
 * CURRENT EvaBot runtime: active/default model, proxy endpoint, breaker
 * health (state reads only, no network), cluster topology, key services,
 * company identity and catalog/KB stats. Cached for 60s.
 */
export class SystemContext {
  public static readonly CACHE_TTL_MS = 60_000;
  public static readonly MAX_CHARS = 1200;

  private static cache: Record<string, { text: string; ts: number }> = {};

  /** Drops the cached block (used by tests and by recordLastUsedModel consumers). */
  public static invalidate(): void {
    this.cache = {};
  }

  /**
   * Full developer-mode prompt addendum (FEATURE 2). Injected by ChatRouter /
   * ChatEngine only when the session is unlocked via /developer unlock.
   */
  public static readonly DEVELOPER_BLOCK: string =
    'Ти в режимі розробника. Відповідай максимально повно і технічно: повні шляхи файлів, команди, конфіги, моделі, витрати, ключі (крім самих секретів — показуй тільки префікси), архітектура, код. Не приховуй внутрішню інформацію системи EvaBot/EvaLine.';

  public static developerBlock(lang?: string): string {
    if (lang === 'ru') {
      return 'Вы в режиме разработчика. Отвечайте максимально полно и технически: полные пути к файлам, команды, конфиги, модели, расходы, ключи (кроме самих секретов — только префиксы), архитектура, код. Не скрывайте внутреннюю информацию системы EvaBot/EvaLine.';
    }
    if (lang === 'en') {
      return 'You are in developer mode. Provide exhaustive, technical answers: full file paths, commands, configs, models, costs, key prefixes, architecture, code. Do not conceal internal EvaBot/EvaLine system details.';
    }
    return SystemContext.DEVELOPER_BLOCK;
  }

  public static build(lang?: string): string {
    const l = lang === 'ru' || lang === 'uk' || lang === 'en' ? lang : 'uk';
    const cached = this.cache[l];
    if (cached && Date.now() - cached.ts < this.CACHE_TTL_MS) {
      return cached.text;
    }
    const text = this.render(l);
    this.cache[l] = { text, ts: Date.now() };
    return text;
  }

  private static render(lang: string = 'uk'): string {
    const defaultModel = Config.defaultModel;
    const last = getLastUsedModel();
    const isRu = lang === 'ru';
    const isEn = lang === 'en';

    const lastLine = last
      ? (isRu
          ? `Последняя использованная модель: ${last.model} (provider: ${last.provider})`
          : isEn
          ? `Last used model: ${last.model} (provider: ${last.provider})`
          : `Остання використана модель: ${last.model} (provider: ${last.provider})`)
      : (isRu
          ? 'Последняя использованная модель: еще не использовалась в текущей сессии процесса'
          : isEn
          ? 'Last used model: not yet used in this process session'
          : 'Остання використана модель: ще не використовувалась у цій сесії процесу');

    // Breaker health: state snapshot only (no network calls).
    let closed = 0;
    let halfOpen = 0;
    let open = 0;
    try {
      for (const name of BREAKER_PROVIDER_NAMES) {
        const st = getBreaker(name).snapshot().state;
        if (st === 'open') open += 1;
        else if (st === 'half-open') halfOpen += 1;
        else closed += 1;
      }
    } catch {
      /* breaker stats are best-effort */
    }
    const breakerLine = isRu
      ? `Предохранители (Breakers): ${closed} closed / ${halfOpen} half-open / ${open} open (из ${BREAKER_PROVIDER_NAMES.length})`
      : isEn
      ? `Breakers: ${closed} closed / ${halfOpen} half-open / ${open} open (of ${BREAKER_PROVIDER_NAMES.length})`
      : `Breakers: ${closed} closed / ${halfOpen} half-open / ${open} open (з ${BREAKER_PROVIDER_NAMES.length})`;

    // Product + KB stats (local reads only).
    let productCount = 0;
    try {
      productCount = ProductCatalog.stats().total;
    } catch {
      /* catalog is best-effort */
    }
    let kbLine = isRu ? 'База знаний: недоступна' : isEn ? 'Knowledge base: unavailable' : 'База знань: недоступна';
    try {
      const kbStats = knowledgeBase.getStats();
      kbLine = isRu
        ? `База знаний: ${kbStats.documentCount} документов (${kbStats.name})`
        : isEn
        ? `Knowledge base: ${kbStats.documentCount} documents (${kbStats.name})`
        : `База знань: ${kbStats.documentCount} документів (${kbStats.name})`;
    } catch {
      /* KB is best-effort */
    }

    const lines: string[] = isRu
      ? [
          `[СИСТЕМНЫЙ КОНТЕКСТ — рабочее окружение бота EvaBot, обновлено ${new Date().toISOString().substring(0, 16)}]`,
          `Модель по умолчанию: ${defaultModel} (provider: ${providerOfModel(defaultModel)})`,
          lastLine,
          `OmniRoute edge-proxy: ${Config.omnirouteBaseUrl} (роутер моделей)`,
          breakerLine,
          'Кластер: [1] evabot-agent-vm — europe-west3-a (Франкфурт), c3-standard-8 (ЭТОТ сервер, brain/бэкенд) · [2] evaline-micro-vm — us-central1-a (frontend edge/face), публичный IP 136.114.26.252',
          'Сервисы: evabot-brain :3000 (Node/TS) · evabot-face :8093 (3D-лицо) · omniroute :20128 (LiteLLM-роутер) · voice (python + TTS/STT) · watchdogs/monitors',
          'Домены/сайты компании: evabot.online · evaline.online · evaline.network · evaline.com.ua · business.evaline.online (бизнес-портал через GCP HTTPS-LB 34.49.122.75) · Cloud Run B2B API (business-tier-api)',
          'Компания: ООО ЭВА-ЛАЙН (ТОВ ЕВА-ЛАЙН), ЕДРПОУ 40484497, г. Черноморск Одесской обл. — производитель пены ЭВА (EVA-пена), 2 участника, капитал 16 000 000 ₴',
          `Продукты: ${productCount} в data/products.json`,
          kbLine,
        ]
      : isEn
      ? [
          `[SYSTEM CONTEXT — EvaBot runtime environment, updated ${new Date().toISOString().substring(0, 16)}]`,
          `Default model: ${defaultModel} (provider: ${providerOfModel(defaultModel)})`,
          lastLine,
          `OmniRoute edge-proxy: ${Config.omnirouteBaseUrl} (model router)`,
          breakerLine,
          'Cluster: [1] evabot-agent-vm — europe-west3-a (Frankfurt), c3-standard-8 (THIS server, brain/backend) · [2] evaline-micro-vm — us-central1-a (frontend edge/face), public IP 136.114.26.252',
          'Services: evabot-brain :3000 (Node/TS) · evabot-face :8093 (3D Face) · omniroute :20128 (LiteLLM router) · voice (python + TTS/STT) · watchdogs/monitors',
          'Domains/websites: evabot.online · evaline.online · evaline.network · evaline.com.ua · business.evaline.online (business portal via GCP HTTPS-LB 34.49.122.75) · Cloud Run B2B API (business-tier-api)',
          'Company: LLC EVA-LINE (TOV EVA-LINE), EDRPOU 40484497, Chernomorsk, Odesa region, Ukraine — EVA foam manufacturer, 2 partners, capital 16 000 000 UAH',
          `Products: ${productCount} in data/products.json`,
          kbLine,
        ]
      : [
          `[SYSTEM CONTEXT — власне середовище бота EvaBot, оновлено ${new Date().toISOString().substring(0, 16)}]`,
          `Модель за замовчуванням: ${defaultModel} (provider: ${providerOfModel(defaultModel)})`,
          lastLine,
          `OmniRoute edge-proxy: ${Config.omnirouteBaseUrl} (роутер моделей, health не перевіряється тут)`,
          breakerLine,
          'Кластер: [1] evabot-agent-vm — europe-west3-a (Франкфурт), c3-standard-8 (ЦЕЙ сервер, brain/бекенд) · [2] evaline-micro-vm — us-central1-a (frontend edge/face), публічний IP 136.114.26.252',
          'Сервіси: evabot-brain :3000 (Node/TS) · evabot-face :8093 (3D-лицо) · omniroute :20128 (LiteLLM-роутер) · voice (python + TTS/STT) · watchdogs/monitors',
          'Домени/сайти компанії: evabot.online · evaline.online · evaline.network · evaline.com.ua · business.evaline.online (бізнес-портал через GCP HTTPS-LB 34.49.122.75) · Cloud Run B2B API (business-tier-api)',
          'Компанія: ТОВ ЕВА-ЛАЙН, ЄДРПОУ 40484497, м. Чорноморськ Одеська обл. — виробник піни EVA (EVA-піна), 2 учасники, каптал 16 000 000 ₴',
          `Продукти: ${productCount} у data/products.json`,
          kbLine,
        ];
    let text = lines.join('\n');
    if (text.length > this.MAX_CHARS) text = `${text.substring(0, this.MAX_CHARS - 1)}…`;
    return text;
  }

  /** Used by the CLI dashboard/tests to confirm this VM identity. */
  public static isBrainVm(): boolean {
    return os.hostname().length > 0 && Config.serverPort > 0;
  }
}
