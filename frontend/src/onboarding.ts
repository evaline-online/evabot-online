/**
 * onboarding.ts — прогрессивный поэтапный онбординг «первые 10 шагов».
 *
 * Умный самонастраивающийся интерфейс: шаги, которые пользователь уже настроил
 * (персона / язык / режим / модель / БД / консилиум), автоматически пропускаются.
 * Рендер — универсальные ANSI-блоки (тот же построчный стиль терминала), поверх
 * которых проецируются кликабельные action-кнопки в вебе. Прогресс в localStorage.
 */

import {
  renderOnboardingStep,
  sectionHeader,
  divider,
  ANSI,
} from './ansi';

export interface OnboardingCtx {
  getPersona(): string;
  setPersona(p: string): void;
  getLang(): string;
  setLang(l: string): void;
  getMode(): string;
  setMode(m: string): void;
  getDb(): string;
  setDb(d: string): void;
  setConsiliumPreset(p: 'top10_paid' | 'top10_free'): void;
  openDeckRow(index: number): void;
  startVoiceTest(): void;
  onboardingReplay(): void;
  version(): string;
}

export interface OnboardingAction {
  label: string;
  run(ctx: OnboardingCtx): void;
}

export interface OnboardingStepSpec {
  key: string;
  title: string;
  body: (ctx: OnboardingCtx) => string[];
  autoDone: (ctx: OnboardingCtx) => boolean;
  actions: (ctx: OnboardingCtx) => OnboardingAction[];
}

const has = (key: string) => localStorage.getItem(key) !== null;

export const ONBOARDING_STEPS: OnboardingStepSpec[] = [
  {
    key: 'welcome',
    title: 'WELCOME & LOCALE',
    body: () => [
      'EvaBot Online — линейный кибер-терминал с живым нейроголосом.',
      'База: Одесса, Украина (UA). Финансовый стандарт: строго USD ($) и EUR (€).',
      'Первый экран минимален: голос + поле ввода. Всё остальное — под кнопкой [=] MENU.',
      'Интерфейс обучается по мере работы: этот онбординг — шаг 1 из 10.',
    ],
    autoDone: () => false,
    actions: (ctx) => [{ label: '[VIEW MODEL CATALOG →]', run: (c) => c.openDeckRow(4) }],
  },
  {
    key: 'persona',
    title: 'CO-PILOT PERSONA',
    body: () => [
      'Выберите персону: стратегическая Ева, технический Адам или тандем DUAL.',
      'Персона меняет голос, акцент и системную инструкцию бота.',
    ],
    autoDone: () => has('evabot_persona'),
    actions: (ctx) => [
      { label: '[F] EVA', run: (c) => c.setPersona('eva') },
      { label: '[M] ADAM', run: (c) => c.setPersona('adam') },
      { label: '[DUAL] BOTH', run: (c) => c.setPersona('dual') },
    ],
  },
  {
    key: 'language',
    title: 'LANGUAGE',
    body: () => [
      'Языки общения и документации: EN / UK / RU. Валюта и цены — только USD/EUR.',
    ],
    autoDone: () => has('evabot_lang'),
    actions: (ctx) => [
      { label: '[ EN ]', run: (c) => c.setLang('en') },
      { label: '[ UK ]', run: (c) => c.setLang('uk') },
      { label: '[ RU ]', run: (c) => c.setLang('ru') },
    ],
  },
  {
    key: 'mode',
    title: 'OPERATIONAL MODE',
    body: () => [
      'ЧАТ — прямой диалог. ДИАЛОГ — дебаты Евы и Адама.',
      'ИНТЕРВЬЮ — структурированная спев беседа со скорингом. КОНСИЛИУМ — совет из 3-10 моделей.',
    ],
    autoDone: () => has('evabot_mode'),
    actions: (ctx) => [
      { label: '(*) CHAT', run: (c) => c.setMode('chat') },
      { label: '( ) DIALOG', run: (c) => c.setMode('dialog') },
      { label: '( ) INTERVIEW', run: (c) => c.setMode('interview') },
      { label: '( ) CONSILIUM', run: (c) => c.setMode('consilium') },
    ],
  },
  {
    key: 'model',
    title: 'NEURAL MODEL',
    body: () => [
      'Модельный сад настраивается в System Deck [04].',
      'Есть бесплатные Quota-модели ($0.00) и платные PAYG. Смена на лету: /model <id>.',
    ],
    autoDone: () => has('evabot_model'),
    actions: (ctx) => [
      { label: '[TOP-10 FREE →]', run: (c) => c.openDeckRow(4) },
      { label: '[TOP-10 PAID →]', run: (c) => c.openDeckRow(4) },
    ],
  },
  {
    key: 'database',
    title: 'KNOWLEDGE BASE',
    body: () => [
      'Соедините базу компании: Hybrid (PostgreSQL + Qdrant RAG), PostgreSQL, Qdrant.',
      'Экземпляр Ephemeral — изолированная сессия без постоянного хранилища.',
    ],
    autoDone: () => has('evabot_db'),
    actions: (ctx) => [
      { label: '[*] HYBRID', run: (c) => c.setDb('hybrid') },
      { label: '( ) POSTGRES', run: (c) => c.setDb('postgres') },
      { label: '( ) QDRANT', run: (c) => c.setDb('qdrant') },
      { label: '( ) EPHEMERAL', run: (c) => c.setDb('ephemeral') },
    ],
  },
  {
    key: 'consilium',
    title: 'CONSILIUM COUNCIL',
    body: () => [
      'Совет из 3-10 моделей с синтезом консенсуса и аудитом стоимости.',
      'Преcеты: TOP-10 умных платных или TOP-10 бесплатных участников.',
    ],
    autoDone: () => has('evabot_consilium'),
    actions: (ctx) => [
      { label: '[*] TOP-10 PAID', run: (c) => c.setConsiliumPreset('top10_paid') },
      { label: '[*] TOP-10 FREE', run: (c) => c.setConsiliumPreset('top10_free') },
    ],
  },
  {
    key: 'voice',
    title: 'VOICE LIVE-CHAT',
    body: () => [
      'Кнопка орба справа над полем ввода — живой голосовой чат (Web Speech API).',
      'Tap-to-speak: коснитесь, говорите — команда автоматически отправится.',
    ],
    autoDone: () => false,
    actions: (ctx) => [{ label: '[TEST MIC →]', run: (c) => c.startVoiceTest() }],
  },
  {
    key: 'credentials',
    title: 'CREDENTIALS & KEY',
    body: () => [
      'Система работает и без API-ключей: каталог, диагностика, голос и настройки активны.',
      'Опциональный ключ хранится в localStorage браузера; серверный — ambient Google Cloud.',
    ],
    autoDone: () => false,
    actions: (ctx) => [{ label: '[OPEN SECURITY ROW →]', run: (c) => c.openDeckRow(8) }],
  },
  {
    key: 'ready',
    title: 'READY // MASTERING THE DECK',
    body: (ctx) => [
      `Терминал готов. Персона: ${ctx.getPersona().toUpperCase()} │ режим: ${ctx.getMode().toUpperCase()}`,
      `База: ${ctx.getDb().toUpperCase()} │ язык: ${ctx.getLang().toUpperCase()} │ v${ctx.version()}`,
      'Команды: /help /onboarding /boot /clear. В Developer Mode: /dev /ansi /config.',
      'Подсказки появляются прямо в стриме по мере работы — интерфейс обучает дальше.',
    ],
    autoDone: () => false,
    actions: (ctx) => [
      { label: '[OPEN MENU → SCREEN 2]', run: (c) => c.openDeckRow(0) },
      { label: '[REPLAY]', run: (c) => c.onboardingReplay() },
    ],
  },
];

export type OnboardingView =
  | { kind: 'step'; ansi: string; actions: OnboardingAction[]; step: number; total: number; title: string }
  | { kind: 'done'; ansi: string; actions: OnboardingAction[] };

export const STORAGE_STEP = 'evabot_onboarding_step';
export const STORAGE_DONE = 'evabot_onboarding_done';

export class OnboardingHandler {
  private index: number;

  constructor(
    private ctx: OnboardingCtx,
    private render: (view: OnboardingView) => void,
  ) {
    const saved = parseInt(localStorage.getItem(STORAGE_STEP) || '0', 10);
    this.index = Number.isFinite(saved) && saved >= 0 && saved < ONBOARDING_STEPS.length ? saved : 0;
  }

  static isDone(): boolean {
    return localStorage.getItem(STORAGE_DONE) === '1';
  }

  static reset(): void {
    localStorage.removeItem(STORAGE_STEP);
    localStorage.removeItem(STORAGE_DONE);
  }

  start(): void {
    this.emit();
  }

  getIndex(): number {
    return this.index;
  }

  next(): void {
    if (this.index >= ONBOARDING_STEPS.length) return;
    this.index += 1;
    localStorage.setItem(STORAGE_STEP, String(this.index));
    this.emit();
  }

  private emit(): void {
    while (this.index < ONBOARDING_STEPS.length && ONBOARDING_STEPS[this.index].autoDone(this.ctx)) {
      this.index += 1;
    }
    if (this.index >= ONBOARDING_STEPS.length) {
      this.complete();
      return;
    }
    const spec = ONBOARDING_STEPS[this.index];
    const bodyLines = spec.body(this.ctx);
    const ansi = renderOnboardingStep(this.index + 1, ONBOARDING_STEPS.length, spec.title, bodyLines);
    this.render({
      kind: 'step',
      ansi,
      actions: spec.actions(this.ctx),
      step: this.index + 1,
      total: ONBOARDING_STEPS.length,
      title: spec.title,
    });
  }

  private complete(): void {
    localStorage.setItem(STORAGE_STEP, String(ONBOARDING_STEPS.length));
    localStorage.setItem(STORAGE_DONE, '1');
    const ansi =
      `\n${sectionHeader('ONBOARDING // COMPLETE', 'READY', 80)}\n` +
      `  ${ANSI.green}[OK]${ANSI.reset} All 10 steps configured. The terminal remembers your choices.\n` +
      `  ${ANSI.gray}Tip: тип ${ANSI.reset}${ANSI.brightCyan}/help${ANSI.reset}${ANSI.gray} в любой момент или снова ${ANSI.reset}${ANSI.brightCyan}/onboarding${ANSI.reset}${ANSI.gray} для повтора.${ANSI.reset}\n` +
      `${divider('─', 80)}`;
    this.render({
      kind: 'done',
      ansi,
      actions: [
        { label: '[OPEN MENU → SCREEN 2]', run: (c) => c.openDeckRow(0) },
        { label: '[REPLAY]', run: (c) => c.onboardingReplay() },
      ],
    });
  }
}
