---
title: EvaBot Command Reference
date: 2026-09-07
tags:
  - commands
  - reference
description: Повний реєстр команд EvaBot (веб-термінал, CLI, серверний реєстр) — синтаксис, аліаси EN/UK/RU, опції, голосові команди, гарячі клавіші та карта взаємодій.
---

<!-- markdownlint-disable MD013 MD025 MD060 -->

# EvaBot — Довідник команд (COMMANDS.md)

> Джерело істини: `src/models/ModelRatings.ts` (ModelCommand, COMMAND_ALIASES), `src/core/I18nEngine.ts`,
> `public/index.html` (handleCommand, SmartInput, VoiceEngine), `src/cli/terminal-chat.ts`,
> `src/server/routes/ModelsRouter.ts`. Жодна команда не додана «з голови» — кожна перевірена по коду.

## 1. Огляд: як працює командний рушій

EvaBot має **три шляхи виконання команд**, і вони не дублюють, а доповнюють одне одного:

| Шлях | Точка входу | Рушій | Примітка |
|---|---|---|---|
| **Web** (<https://evabot.online>) | `public/index.html` → `handleCommand()` | Локальний перехоплювач + делегування `POST /api/models/command` | См. § 2.2 |
| **CLI** (термінал) | `src/cli/terminal-chat.ts` → REPL `switch` | Локальні CLI-команди + `ModelCommand.execute(input)` | См. § 2.3 |
| **API** (довільний клієнт) | `POST /api/models/command` `{ "command": "/top free" }` | `ModelCommand.execute()` | `ModelsRouter.ts:62` |

**Нормалізація команд** — `normalizeCommand()` (`ModelRatings.ts:419`):

1. `trim()` + `toLowerCase()`.
2. Апострофи/лапки канонізуються: **`'` ´ ʼ ’ → `'`** (регекс `/['`´ʼ’']/g`) — тобто`/пам’ять`,`/пам'ять`,`/пам´ять` — одна й та сама команда.
3. Перший токен (head) резолвиться через `COMMAND_ALIASES`; аргументи (rest) зберігаються після канонічного head.
4. Невідома команда → `[ERROR] Unknown command: ...` зі списком валідних команд.

Приклади нормалізації: `/ІСТОРІЯ` → `/history`; `/пошук модели` → `/search модели`; `/Здоров'я` → `/health`.

**Мови:** усі довідкові виводи (`/help`) мають три локалі (en/uk/ru) в `I18nEngine`; аліаси UK/RU приймаються незалежно від активної мови. Вихідні тексти більшості server-команд (історія, пошук, фінанси) поки що російськомовні — це видно в коді, наведено як є.

**Веб-делегування** (`handleCommand`, `index.html:1462`): локально перехоплюються `/lang`, `/clear`, `/help`, `/history` (без аргументів), `/autocorrect`, `/voice`, `/tts`, `/mode`, `/consilium`; **все інше, що починається з `/`**, надсилається на сервер через `POST /api/models/command` → `ModelCommand.execute()`.

---

## 2. Повний реєстр команд

### 2.1 Серверні команди (`ModelCommand.execute` — спільні для Web-API та CLI)

Кожна команда нижче верифікована в `ModelRatings.ts` (switch, рядки 434–491) або в її handler-функції.

| Команда | Синтаксис | Аліаси EN/UK/RU (перевірені) | Аргументи / опції | Що виводить | Приклад |
|---|---|---|---|---|---|
| `/top` | `/top [filter] [N]` | — | `filter`: `free\|paid\|speed\|context` (дефолт `all`), `N` — ліміт (дефолт 10) | Без аргументів: ТОП-5 free + ТОП-5 paid + підказки. З фільтром — рейтинг моделей за якістю/швидкістю/контекстом з причинами (Reason) | `/top free 5` |
| `/free` | `/free` | — | — | Усі безкоштовні моделі (46) з ID, контекстом, квотою та рейтингом Q/S/C/$/Composite | `/free` |
| `/paid` | `/paid` | — | — | Усі платні моделі (32) з цінами in/out та рейтингом | `/paid` |
| `/models` | `/models [filter]` | UK: `/моделі` · RU: `/модели` | `filter`: лише `summary` (дефолт) — інше ігнорується | Зведення: 46 free / 32 paid / 78 всього + перелік модельних команд | `/models` |
| `/mcp` | `/mcp` | — | — | Статус пулу з 21 MCP-сервера (14 задокументованих у виводі) + sync-mcp | `/mcp` |
| `/lsp` | `/lsp` | — | — | Статус 4 LSP-демонів (TS, Pyright, HTML/CSS/JSON, marksman) | `/lsp` |
| `/history` | `/history [N]` | EN: `/hist` · UK: `/історія`, `/журнал` · RU: `/история` | `N` — к-сть повідомлень, 1…200 (дефолт 20) | Останні N повідомлення **з усіх сесій** з SQLite `chat-history.db` (timestamp, USER/BOT, тег сесії `[consilium]` тощо) | `/history 50` |
| `/memory` | `/memory` | EN: `/mem` · UK: `/пам'ять` · RU: `/память`, `/памятка` | — | Статистика памʼяті: Knowledge Base (доки, FTS5 чанки), чат-БД (повідомлення/сесії/шлях), ChromaDB вказівник, підказки `/search`, `/kb` | `/memory` |
| `/search` | `/search <запит>` | EN: `/find` · UK: `/пошук`, `/знайти` · RU: `/поиск`, `/найти` | `<запит>` — обовʼязково (без нього — usage) | Полнотекстовий пошук (FTS5): ≤5 збігів у чат-БД + ≤5 у базі знань (SQLite FTS5 + memory KB), підсумок | `/search автоковрики` |
| `/find` | `/find <запит>` | як `/search` | `<запит>` | Ідентично `/search` (окремий case у switch) | `/find eva` |
| `/services` | `/services` | UK: `/сервіси`, `/служби` · RU: `/сервисы`, `/службы` | — | Статус systemd/docker сервісів (evabot-brain, omniroute, nginx, code-server, n8n, evabot-voice) + бекенди БД (chat-history.db, FTS5 index, ChromaDB) | `/services` |
| `/servers` | `/servers` | EN: `/vm` · UK: `/сервери`, `/вми` · RU: `/серверы` | — | Кластер з 2 серверів: evabot-agent-vm (Brain/Frankfurt, load/mem/uptime) + evaline-micro-vm (Face/Iowa, live-метрики ClusterMonitor) | `/servers` |
| `/cost` | `/cost` | EN: `/finance`, `/budget` · UK: `/вартість`, `/фінанси`, `/бюджет`, `/бухгалтерія` · RU: `/стоимость`, `/финансы`, `/бюджет`, `/бухгалтерия` | — | Фінансовий звіт: [1] OpEx інфраструктури (7 ресурсів, $/міс та $/год), [2] витрати токенів сесії та економія free-флоту, [3] собівартість 1 агента, [4] **CapEx-відьмo (capital ledger)** від `CapitalExpenses` | `/cost` |
| `/company` | `/company [tier]` | EN: `/team`, `/roster` | `tier`: `evaline` (дефолт) \| `free` \| `paid` | Ростер 10 агентів відповідного tier (AgentBuilder) + матриця знань компанії + статистика каталогу продуктів | `/company free` |
| `/evaline` | `/evaline` | EN: `/business` | — | Фіксовано `handleCompany(['evaline'])` — бізнес-система EvaLine | `/evaline` |
| `/lang` | `/lang <code>` | EN: `/language`, `/locale` · UK: `/мова` · RU: `/язык` | `<code>`: `uk\|ua\|ukr\|ukrainian`, `ru\|rus\|russian`, інше → `en` | Повідомлення про переключення мови (локалізоване), впливає на всі локалізовані виводи | `/lang uk` |
| `/help` | `/help` | EN: `/?` · UK: `/допомога` · RU: `/помощь` | — | Довідка `I18nEngine.formatHelp()` активною мовою — 24 команди з описами | `/help` |
| `/info` | `/info <model_id>` | EN: `/inspect` | `<model_id>` — ID або фрагмент назви моделі | Технічний паспорт: ID, провайдер, протокол, контекст/вихід, ціни in/out, квоти, 5 рейтинг-вимірів, опис | `/info gemini-3.8-flash` |
| `/health` | `/health` | UK: `/здоров'я`, `/статус-моделей`, `/статус` · RU: `/здоровье` | — | Health-звіт LLM-провайдерів: стан circuit breakers (✅ closed / 🟡 half-open / ⛔ open), кількість збоїв, останні 5 помилок | `/health` |
| `/news` | `/news [tag...]` | UK: `/новини`, `/новины` · RU: `/новости`, `/нов` | `tag` — один або кілька; синоніми: `war\|війна\|война\|security`, `odessa\|одеса\|одесса\|region`, `economy\|економіка\|бізнес`, `eva\|піна\|market`, `trends\|тренди\|products`, `evaline\|company\|бренд` | Дайджест Google News RSS (+newsapi.org): ≤15 записів, dedupe за заголовком (Jaccard>0.6), кеш 15 хв, таймаут джерела 8 с. **Web:** cache-first синхронно (перший виклик грітиме кеш «до ~10 c»); **CLI/API:** повністю async через `executeAsync` | `/news odessa economy` |
| `/products` | `/products [категорія\|запит]` | EN: `/catalog` · UK: `/продукти`, `/товари`, `/каталог` · RU: `/продукты`, `/товары` | без аргументу → статистика; з аргументом → спочатку match за категорією (префіксний), інакше вільний пошук по всіх полях | Категорії (23 товари, 12 категорій: sheets, home, packaging, sports-mats, kids, outdoor, beauty, footwear, livestock-mats, flooring, craft, marine) або картки товарів: розміри, товщина, кольори, сертифікати, ринки | `/products kids` |
| `/who` | `/who [role]` | UK: `/хто`, `/ролі` · RU: `/кто`, `/роли` | без аргументу → вся матриця; з аргументом → роль (префікс або підстрока назви, напр. `sec` → `security_auditor`) | Матриця знань компанії: 18 ролей, домени знань, джерела, партнери обміну інформацією + статистика БД продуктів | `/who eva` |
| `/sephirot` | `/sephirot <тема>` \| `/sephirot status` \| `/sephirot tree` | EN: `/tetraxis` · UK: `/сфирот`, `/сефирот`, `/дерево`, `/тетраксис` · RU: `/сфирот`, `/сефирот`, `/дерево` | підкоманди: `status`, `tree\|map`, інакше — тема | `<тема>`: запуск консиліуму 10 сфер Дерева Життя **у фоні** (миттєве підтвердження; тривалість — хвилини). `status`: стан (⏳/❌/✅), тема, часи, синтез (≤3000 симв.). `tree`: карта 10 агентів (моделі, батьки, стадії) | `/sephirot вихід на ринок ЄС` |
| `/auto` | `/auto on\|off` \| `/auto test <текст>` \| `/auto fleet` | UK: `/авто` · RU: `/автомат`, `/автопилот` | підкоманди: `on`, `off`, `test <текст>`, `fleet`; без аргументу → toggle + статус | **TASK-320 Smart Auto-Switch**: динамічний вибор БЕЗКОШТОВНОЇ моделі на кожне повідомлення — обсяг контексту (~tok) + складність (light/code/reasoning/longform) + ліміти провайдера (RPM з freeTierDetails) + стан CircuitBreaker. Сесійний прапорець (`DeveloperMode.resolveSession`): Telegram, Web (`/api/chat`, `/api/chat/stream`) та CLI. ONLY-FREE: платні моделі ніколи не обираються | `/auto test напиши SQL-запит` |
| `/subagent` | `/subagent [1-4] <задача>` | — | `N` — кількість агентів (дефолт 3, макс 4); без задачі → usage | **TASK-325 SubagentEngine**: N паралельних LLM-субагентів з ролями Analyst / Builder / Critic / Researcher, кожен на власній ONLY-FREE моделі (Nemotron 3 Ultra / Inkling / Gemma 4 / Cohere North / Ling 3.0 + omni/* edge-флот), `Promise.allSettled` (відмова одного агента не ламає батч), потім синтез через `openrouter/free`. Довго (до ~2 хв) — CLI/Telegram йдуть через `executeAsync`; web sync-шлях повертає usage-підказку. Ключем модель призначається різноманітно (distinct model на слот) | `/subagent 3 спроектуй схему БД для каталогу` |

> **Синтаксична відповідь на невідому команду** (`ModelRatings.ts:490`) перераховує весь офіційний реєстр: `/top, /models, /history, /memory, /search, /find, /services, /servers, /mcp, /lsp, /cost, /company, /evaline, /lang, /info, /news, /health, /products, /who, /sephirot, /free, /paid, /help`.

### 2.2 Фронтенд-локальні команди (`public/index.html` → `handleCommand`)

Ці команди **не** надсилаються на сервер — обробляються в браузері.

| Команда | Синтаксис | Аргументи / опції | Поведінка (локальна) | Приклад |
|---|---|---|---|---|
| `/lang` | `/lang uk\|ru\|en` | також `/language`, `/locale`; без аргументу → `en` | Миттєве переключення UI (I18N-словник у `index.html`), збереження в `localStorage.evabot_lang` **+ тихе делегування** `POST /api/models/command {command:'/lang uk'}` для синхронізації серверної локалі | `/lang uk` |
| `/clear` | `/clear` | синонім `/cls` | Очищує екран чату (chat-container) і пише «Екран очищено.» | `/clear` |
| `/help` | `/help` | синонім `/?` | Локальна довідка I18N (укр/рос/англ) — **та сама структура, що й серверна**, але рендериться локально | `/help` |
| `/history` | `/history` | **лише без аргументів!** | Останні ≤10 повідомлень **in-memory сесії браузера** (`state.history`). `/history N` з N → делегується серверу (SQLite, усі сесії) | `/history` |
| `/autocorrect` | `/autocorrect on\|off` | без аргументу → показати стан | Увімкнення/вимкнення SmartInput-корекції (`localStorage.evabot_autocorrect`); дефолт **on** | `/autocorrect off` |
| `/voice` | `/voice on\|off` | `/voice eva` \| `/voice adam` \| `/voice autosend on\|off`; без аргументу → стан | `on/off` — мікрофон-диктування (`localStorage.evabot_voice`); `eva/adam` — персона TTS (жіноча/чоловіча); `autosend on/off` — автоматична відправка розпізнаного тексту через 250 мс (дефолт **on**) | `/voice eva` |
| `/tts` | `/tts on\|off` | без аргументу → стан | Озвучення відповідей (SpeechSynthesis); дефолт **on** (`evabot_tts`) | `/tts off` |
| `/mode` | `/mode [value]` | без аргументу → toggle `solo`↔`consilium`; з аргументом — довільне значення у state | Перемикач режиму в хедері | `/mode consilium` |
| `/consilium` | `/consilium [тема]` | без теми → перемикає режим consilium і чекає запитання; з темою → `POST /api/consilium` | Консиліум 3 моделей (gemini-2.5-pro, gemini-2.5-flash, deepseek-r1:free) + синтез | `/consilium стратегія експансії` |

Усе інше, що починається з `/`, делегується на сервер (§ 2.1), включно з `/top`, `/info`, `/who`, `/sephirot`, `/health`, `/news`, `/products`, `/memory`, `/search`, `/services`, `/servers`, `/cost`, `/company`, `/mcp`, `/lsp`.

**SmartInput** (`SmartInput.COMMANDS`) знає 27 фрагментів для автодоповнення/автокорекції:
`help, ?, top, models, info, company, evaline, products, who, cost, lang, mcp, lsp, free, paid, mode, consilium, clear, history, memory, search, find, services, servers, autocorrect, voice, tts` —
з трансліт-картою (`топ→top`, `істор→history`, `очист→clear`, `мова→lang`, `вартість→cost` тощо).

### 2.3 CLI-лише команди (`src/cli/terminal-chat.ts`)

Існують **тільки** в терміналі (`tsx src/cli/terminal-chat.ts`) — веб не має аналогів.

| Команда | Синтаксис | Опції | Поведінка | Приклад |
|---|---|---|---|---|
| `/model` | `/model <id>` | без аргументу → usage | Переключити активну модель сесії (валідація `ModelRegistry.isValidModel`) | `/model gemini-2.5-flash` |
| `/models <arg>` | `/models x` | з будь-яким аргументом | **Повний каталог усіх 78 моделей** (printAllModels) — на відміну від серверного `/models` (лише summary); без аргументу — серверний summary | `/models all` |
| `/mode` | `/mode [solo\|broadcast\|dialogue\|consilium]` | без аргументу → toggle solo↔consilium | Режим сесії; у режимі ≠ solo звичайні повідомлення йдуть у `handleConsiliumRun` | `/mode dialogue` |
| `/role` | `/role <roleId>` | без аргументу → список доступних | Встановити корпоративну роль (18 ID: `god, adam, eva, eva_frontend, adam_backend, architect, devops, security_auditor, general_assistant, data_engineer, ceo, cto, ciso, cfo, devops_sre, data_ai_lead, qa_automation, legal_compliance`) | `/role architect` |
| `/dialogue` | `/dialogue <тема>` | — | Автономний дебат-діалог двох моделей (gemini-2.5-pro + gemini-2.5-flash, 2 раунди) з синтезом | `/dialogue чи виходити на Німеччину` |
| `/consilium` | `/consilium <тема>` | — | Прямий запуск консиліуму (3 моделі, 1 раунд, gemini-2.5-pro синтезатор) | `/consilium ризики Q4` |
| `/boot` | `/boot` | — | Повторити самодіагностику двох серверів (BootDiagnostics) | `/boot` |
| `/clear` | `/clear` | синонім `/cls` | Очистити **історію сесії** (session.clearHistory) + консоль | `/clear` |
| `/exit` | `/exit` | синонім `/quit` | Завершити термінальну сесію | `/exit` |

**Нюанс CLI-аліасів** (default-гілка switch, рядок 506): UK/RU аліаси маршрутизуються через `COMMAND_ALIASES` лише якщо канонічна команда ∈ {`/history`, `/memory`, `/search`, `/find`, `/services`, `/servers`, `/health`, `/news`, `/products`, `/who`}. Отже:

- `/історія`, `/пошук`, `/статус` (→`/health`), `/новини` тощо — **працюють** у CLI;
- але `/моделі` (→`/models`), `/вартість` (→`/cost`), `/допомога` (→`/help`) — у CLI **невідомі** (ці команди мають власні case-гілки лише для латинських форм). Пряме `/health` у CLI теж не обробляється (немає case) — тільки через аліаси `/статус` / `/здоров'я` / `/здоровье`.

---

### 2.4 Планові команди — 🚧 rollout in progress

**`/debug` та `/log`** у коді станом на 2026-09-07 **відсутні**: немає їх у switch `ModelCommand.execute`, у `COMMAND_ALIASES`, у словниках `I18nEngine` (усі 3 локалі), у `handleCommand` веб-терміналу та в CLI. Файл `src/core/OpLog.ts` також не існує (можливо, додається паралельним агентом).

**Статус: НЕ РЕАЛІЗОВАНО / В ПРОЦЕСІ ВПРОВАДЖЕННЯ.** У реєстри нижче вони не включені. Запланована семантика (лише проектна, НЕ з коду):

| Команда (план) | Очікувана поведінка | Статус |
|---|---|---|
| `/debug on\|off` | Увімкнути verbose-футери в оголошеннях системи (розширені технічні підписи відповідей) | 🚧 відсутня в коді |
| `/debug full` | Максимальний рівень діагностики, інтеграція з `/log` | 🚧 відсутня в коді |
| `/log [N] [level\|kind]` | Перегляд записів журналу (останні N, фільтр за рівнем/типом) | 🚧 відсутня в коді |

Після появи `OpLog.ts` / записів у `I18nEngine` цей розділ слід перенести в таблиці § 2.1–2.2.

---

## 3. Карта взаємодії команд

```mermaid
flowchart LR
  subgraph Діагностика["🩺 Діагностика (плановий ланцюг)"]
    DEBUG["/debug on|full 🚧"] -->|verbose-футери відповідей| FOOTER["розширені футери"]
    LOG["/log [N] [level|kind] 🚧"] <-->|debug-записи| DEBUG
    HEALTH["/health"]
    LOG -.дублює інформацію про помилки.-> HEALTH
    DEBUG -.full → health-блок.-> HEALTH
  end

  subgraph Памʼять["🧠 Памʼять: спільна SQLite БД"]
    DB[("chat-history.db\nFTS5 index")]
    HIST["/history [N]"]
    SEARCH["/search <запит> ⟷ /find"]
    HIST ---|"читає останні N"| DB
    SEARCH ---|"FTS5-пошук (≤5 хітів)"| DB
  end

  subgraph Консиліуми["⚖ Багатоагентні механізми"]
    CONS["/consilium <тема>"]
    SEPH["/sephirot <тема>"]
    SEPHSTAT["/sephirot status"]
    MODE["/mode solo|consilium"]
    CONS -->|persist sessionId='consilium'| DB
    SEPH -->|persist sessionId='sephirot'| DB
    SEPH -->|прогрес/синтез| SEPHSTAT
    MODE -.перемикає підготовку запиту.-> CONS
  end

  subgraph Моделі["📊 Каталог моделей (78)"]
    MODELS["/models"] --- TOP["/top free|paid|speed|context"]
    MODELS --- FREE["/free"] & PAID["/paid"]
    INFO["/info <model_id>"] --- MODELS
    TOP --> INFO
  end

  subgraph Фінанси["💰 Економіка"]
    COST["/cost ⟷ /finance ⟷ /budget"]
    CAPEX["CapitalExpenses (CapEx ledger $1500)"]
    COST -->|розділ [4]| CAPEX
  end

  subgraph Знання["🏭 Знання компанії"]
    WHO["/who [role] (18 ролей)"]
    COMPANY["/company evaline|free|paid"]
    PRODUCTS["/products [cat|запит]"]
    COMPANY -->|append матриця| WHO
    WHO -->|статистика продуктів| PRODUCTS
  end

  subgraph Новини["📰 Новини: 6 тегів"]
    NEWS["/news [tag...]"]
    WAR["war"] & ODESSA["odessa"] & ECON["economy"] & EVA["eva"] & TRENDS["trends"] & EVALINE["evaline"]
    NEWS --- WAR & ODESSA & ECON & EVA & TRENDS & EVALINE
  end

  LANG["/lang uk|ru|en"] -.локаль для всіх виводів.-> MODELS & NEWS & WHO & PRODUCTS
```

Ключові звʼязки:

- **/search ↔ /history** — одна БД (`data/chat-history.db`): `/history` читає останні записи, `/search` шукає тим самим FTS5-індексом.
- **/consilium → /history** — підсумки консиліуму зберігаються в сесії `consilium` і видимі в `/history` (тег `[consilium]`) та `/search`.
- **/sephirot → /history + /sephirot status** — фоновий запуск, синтез у сесії `sephirot`, прогрес через `status`.
- **/log ↔ /health ↔ /debug** — плани єдиної діагностичної трійки (зараз діють лише `/health` і опосередковано `/services`).
- **/models ↔ /top /free /paid ↔ /info** — один реєстр `ModelRegistry` (78 моделей), `/info` деталізує будь-який рядок рейтингу.
- **/cost ↔ capital ledger** — звіт обовʼязково додає розділ капітальних інвестицій (`CapitalExpenses.formatCapitalSection`).
- **/who ↔ /company** — обидві друкують `CompanyKnowledge.formatMatrix`; `/company` додає ростер, `/who` дозволяє drill-down по ролі.
- **/news ↔ 6 категорій**, **/products ↔ 12 категорій** (`data/products.json`, 23 товари).

---

## 4. Усі опції та налаштування

| Команда | Значення | Поведінка | Де зберігається | Дефолт |
|---|---|---|---|---|
| `/lang uk\|ru\|en` | `uk` (синоніми `ua, ukr, ukrainian`), `ru` (`rus, russian`), інше → `en` | Локаль UI + серверні виводи | Web: `localStorage.evabot_lang` + сервер in-memory | `en` |
| `/mode solo\|broadcast\|dialogue\|consilium` | Web приймає довільний рядок; CLI валідує 4 значення; без аргументу — toggle solo↔consilium | Режим обробки повідомлень | Web: `state.currentMode` (не persist) | `solo` |
| `/autocorrect on\|off` | без аргументу = показати стан | SmartInput: автокорекція описок (Levenshtein), розгортання команд (`/модел`→`/models`), нормалізація пунктуації; код-блоки та URL захищені | `localStorage.evabot_autocorrect` | `on` |
| `/voice on\|off` | увімкнути/вимкнути мікрофон-диктування | Web Speech Recognition (`evabot_voice`) | `localStorage.evabot_voice` | `on` |
| `/voice eva\|adam` | персона озвучки | підбір голосу за статтю + pitch (eva=1.12, adam=0.85) | `localStorage.evabot_tts_persona` | `eva` |
| `/voice autosend on\|off` | автонадсилання фінального транскрипта (через 250 мс) | `localStorage.evabot_voice_autosend` | `on` |  |
| `/tts on\|off` | озвучення відповідей асистента (≤350 символів, код та посилання вирізаються) | `localStorage.evabot_tts` | `on` |  |
| `/debug on\|off\|status\|full` | — | 🚧 **не реалізовано** (немає в коді; план: verbose-футери, повна діагностика) | — | — |
| `/history N` | N = 1…200 (дефолт 20) | серверний варіант; Web без аргументу — локальні останні 10 | SQLite | 20 |
| `/log [N] [level\|kind]` | — | 🚧 **не реалізовано** (план: останні N записів з фільтром рівня/типу) | — | — |
| `/search <query>` | обовʼязковий запит | FTS5 по чатах + KB | read-only | — |
| `/news <category>` | `war\|odessa\|economy\|eva\|trends\|evaline` (+ UK/RU синоніми, кілька тегів через пробіл) | фільтр дайджесту | кеш 15 хв | усі теги |
| `/products <category>` | `sheets, home, packaging, sports-mats, kids, outdoor, beauty, footwear, livestock-mats, flooring, craft, marine` (або вільний запит) | фільтр/пошук каталогу | `data/products.json` | статистика |
| `/sephirot <topic>\|status\|tree` | topic — вільний текст; `tree\|map` — карта | запуск/моніторинг консиліуму | in-memory status + сесія `sephirot` | usage |
| `/who <role>` | roleId або префікс (`sec`→`security_auditor`) | детальний профіль ролі | — | повна матриця |

---

## 5. Голосові команди (VoiceEngine)

**Wake-слова** (обрізаються з початку транскрипту, необовʼязкова кома після них):

| Wake word | Значення |
|---|---|
| `ева`, `єва`, `eva` | звертання до Єви |
| `адам`, `adam` | звертання до Адама |
| `команда`, `команди`, `command` | явний префікс «виконай команду ...» |

Голе wake-слово — «поглинається» без дії. Транскрипт, що починається з `/` (після обрізання wake-слова), проходить `SmartInput.autocorrect` і виконується як команда. Інакше — таблиця прямих команд:

| Промовлене слово/фраза | → Команда |
|---|---|
| `очистить`, `очисти`, `очистити`, `clear`, `очисти экран`, `очистити екран`, `clear screen` | `/clear` |
| `история`, `історія`, `history` | `/history` |
| `помощь`, `справка`, `довідка`, `help` | `/help` |
| `модели`, `моделі`, `models` | `/models` |
| `топ`, `top` | `/top` |
| `cost`, `витрати`, `затраты` | `/cost` |
| `консилиум`, `консиліум`, `consilium` | `/mode consilium` |

Мова розпізнавання: `uk-UA` / `ru-RU` / `en-US` — за активною мовою UI. Якщо транскрипт не зʼєднався з жодною командою — він вставляється в поле вводу і (при `autosend on`) надсилається як звичайне повідомлення через 250 мс.

---

## 6. Гарячі клавіші та UX

| Елемент | Дія |
|---|---|
| `Enter` | Надіслати повідомлення/команду |
| `Shift+Enter` | Новий рядок (textarea авто-розтягується) |
| `/` на початку слова | Тригер автодоповнення команд (до 8 підказок з бейджем `cmd` + опис локальною мовою) |
| 2+ літери | Автодоповнення вивчених слів словника (до 6 підказок, бейдж `mem`, пріоритет за частотою/свіжістю) |
| `↑` / `↓` | Навігація по підказках (коли список відкритий) |
| `Tab` | Прийняти активну підказку (вставка + пробіл) |
| `Esc` | Закрити список підказок |
| Клік по підказці | Теж прийняти (`mousedown`, щоб не втрачати фокус) |
| Кнопка 🎤 | Почати/зупинити диктування (пульсація червоною рамкою під час запису; недоступна в браузерах без SpeechRecognition — приглухлена) |
| 🔊/🔇 у шапці | Toggle TTS (глушить поточне озвучення) |
| Пілюлі `[EN] UK RU` | Переключення мови UI |
| Пілюля моделі / «78 models» | Відкрити модальний каталог моделей з фільтрами All (78) / Free (46) / Paid (32) |
| Пілюля `Mode: solo` | Клік — toggle solo↔consilium |

---

## Верифікація

- **Дата верифікації:** 2026-09-07.
- **Метод:** усі команди, аліаси, опції та voice-мапи винесені безпосередньо з коду (див. рядки джерел нижче). Нічого не вигадано: `/debug`, `/log` навмисно позначені як відсутні (§ 2.4).
- **Як перевірити повторно (grep-підказки):**

```bash
cd /var/www/evabot-backend
## Серверний реєстр + switch виконання:
grep -n "case '/" src/models/ModelRatings.ts
## Усі UK/RU аліаси:
sed -n '/export const COMMAND_ALIASES/,/^};/p' src/models/ModelRatings.ts
## Локальні команди веб:
grep -n "lower.startsWith\|lower === " public/index.html
## CLI-лише команди:
grep -n "case '/" src/cli/terminal-chat.ts
## Словник довідки (3 мови):
grep -n "helpCommands" -A 30 src/core/I18nEngine.ts
## Voice-команди та wake-слова:
grep -n "VOICE_COMMAND_WORDS\|ева|єва" public/index.html
## Автодоповнення: список команд і трансліт:
grep -n "COMMANDS:\|TRANSLIT:" public/index.html
## /debug та /log: переконайтеся, що досі відсутні (має бути порожньо в src/):
grep -rn "'/debug'\|'/log'" src/ public/index.html
## Існування OpLog (якщо з'явився — оновіть § 2.4):
ls src/core/OpLog.ts
```

Back to [[index]]

## Додаток: нові команди (оновлення 2026-09-07, пізній вечір)

| Команда | Аліаси | Опції | Опис |
|---------|--------|-------|------|
| `/developer` | `/девелопер` `/розробник` | `unlock <пароль>` `status` `lock` | Режим розробника (пароль з `EVADEV_PASSWORD`), відкриті відповіді про код/сервери/конфіги, TTL 2 год; пароль маскується в історії |
| `/sys` | `/система` `/whereami` | — | Системний контекст бота: модель за замовчуванням + остання використана, провайдер, сервери, компанія, БД |
| `/voices` | `/голоси` `/голоса` `/звуки` | `[uk\|ru\|en]`, `set eva\|adam <voice>` | Каталог FREE-голосів (Chirp3-HD → Wavenet → Standard); зміна голосу Єва/Адам зі збереженням у `data/voice-prefs.json` |
| `/settings` | `/налаштування` `/настройки` | — | Таблиця всіх поточних налаштувань: локаль, модель, debug, TTS (голоси + ліміт), STT, translate, autocorrect, emoji |
| `/agents` | `/агенти` `/рота` `/роли-агентів` | — | Ростер: 18 корпоративних ролей + 10 вузлів Сефірот (голосові персони Adam/Eva) |
| `/emoji` | — | `on\|off` | Локальний (браузер/CLI): заміна емодзі на ASCII/ANSI (дефолт OFF = все ASCII) |
| `/say` | `/скажи` `/сказать` | `<текст>` | Синтез мовлення через Google Cloud TTS → `/tmp/evabot-say.mp3` + ліміт місяця |
| `/listen` | `/розпізнай` `/распознать` | `<файл>` | Розпізнавання аудіо (ffmpeg → Cloud STT, 50 хв/міс free) |
| `/translate` | `/переклад` `/перевод` | `<to> <текст>` | Cloud Translation v3 (480k симв/міс free) |
| `/monitor` | `/монитор` `/рейтинг` | — | Топ-10 FREE/PAID моделей з модельного монітора (10 джерел, кожні 12 год) |

Back to [[index]]
