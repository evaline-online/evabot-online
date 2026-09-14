# -*- coding: utf-8 -*-
from helpers import t, accordion_section, sub_accordion
import infographics_builder
import models_renderer

def get_section_04(prerendered_models_html):
    sub1 = sub_accordion(
        "sub-4-1", "🟢",
        "Вопрос 4.1: Что входит в бесплатный пул моделей (Free Quota Tier $0.00 — 62 модели)?",
        "Питання 4.1: Що входить до безкоштовного пулу моделей (Free Quota Tier $0.00 — 62 моделі)?",
        "Question 4.1: What constitutes the 100% free quota tier ($0.00 fleet — 62 models)?",
        "Нулевая себестоимость", "Нульова собівартість", "Zero Token Cost",
        f'''<p>{t(
            "EvaLine использует передовую квоту Google AI Pro / AI Studio (15 RPM, 1M TPM, 1,500 запросов в сутки на модель) и бесплатные эндпоинты OpenRouter. 62 передовые модели (включая Gemini 3.8 Flash, 3.1 Flash, Qwen 2.5, Llama 3.3) обеспечивают до 90% всей рутинной работы фабрики с себестоимостью токенов ровно $0.00.",
            "EvaLine використовує передову квоту Google AI Pro / AI Studio (15 RPM, 1M TPM, 1,500 запитів на добу на модель) та безкоштовні ендпоінти OpenRouter. 62 передові моделі (включно з Gemini 3.8 Flash, 3.1 Flash, Qwen 2.5, Llama 3.3) забезпечують до 90% всієї рутинної роботи фабрики із собівартістю токенів рівно $0.00.",
            "EvaLine leverages authorized high-throughput Google AI Pro / AI Studio quotas (15 RPM, 1M TPM, 1,500 daily requests per model) and OpenRouter free tiers. 62 state-of-the-art models (including Gemini 3.8 Flash, 3.1 Flash, Qwen 2.5, Llama 3.3) absorb up to 90% of all routine enterprise operations at exactly $0.00 token cost."
        )}</p>'''
    )

    sub2 = sub_accordion(
        "sub-4-2", "💎",
        "Вопрос 4.2: Для каких задач используется платный коммерческий пул (32 модели)?",
        "Питання 4.2: Для яких завдань використовується платний комерційний пул (32 моделі)?",
        "Question 4.2: When does the Consilium invoke the commercial frontier fleet (32 models)?",
        "Максимальный IQ", "Максимальний IQ", "Frontier Benchmark",
        f'''<p>{t(
            "Для задач наивысшей ответственности — проектирование архитектурных спецификаций, глубокий аудит кибербезопасности и математическая верификация — привлекаются мощнейшие платные модели: Claude 3.7 Sonnet (с расширенным мышлением), DeepSeek R1, OpenAI o1/o3-mini и Gemini 3.1 Pro.",
            "Для завдань найвищої відповідальності — проєктування архітектурних специфікацій, глибокий аудит кібербезпеки та математична верифікація — залучаються найпотужніші платні моделі: Claude 3.7 Sonnet (з розширеним мисленням), DeepSeek R1, OpenAI o1/o3-mini та Gemini 3.1 Pro.",
            "For mission-critical operations — industrial CAD engineering, formal cryptographic audits, and complex legal syntheses — the Consilium invokes top commercial frontier LLMs: Claude 3.7 Sonnet (with extended reasoning tokens), DeepSeek R1, OpenAI o1/o3-mini, and Gemini 3.1 Pro."
        )}</p>'''
    )

    sub3 = sub_accordion(
        "sub-4-3", "🔀",
        "Вопрос 4.3: Как роутер OmniRoute осуществляет динамическую маршрутизацию запросов?",
        "Питання 4.3: Як роутер OmniRoute здійснює динамічну маршрутизацію запитів?",
        "Question 4.3: How does the OmniRoute dynamic router optimize cost and latency?",
        "Автономная оптимизация", "Автономна оптимізація", "Autonomous Routing",
        f'''<p>{t(
            "Входящий запрос анализируется за 15 миллисекунд: оценивается сложность, требуемый контекст и уровень критичности. Простые задачи автоматически направляются на бесплатные модели со скоростью 150+ токенов/сек, а сложные расчеты эскалируются на платные флагманы, сокращая корпоративный бюджет в 8–12 раз.",
            "Вхідний запит аналізується за 15 мілісекунд: оцінюється складність, необхідний контекст та рівень критичності. Прості завдання автоматично скеровуються на безкоштовні моделі зі швидкістю 150+ токенів/сек, а складні розрахунки ескалюються на платні флагмани, зменшуючи бюджет у 8–12 разів.",
            "Every inbound task is evaluated within 15 milliseconds for token volume, semantic ambiguity, and safety implications. Lightweight tasks route to zero-cost micro-models at 150+ tokens/sec, while rigorous reasoning tasks escalate to frontier models, slashing enterprise LLM expenditure by 8–12x."
        )}</p>'''
    )

    sub4 = sub_accordion(
        "sub-4-4", "📈",
        "Вопрос 4.4: Как контролируется телеметрия флота и автоматический отказоустойчивый резерв?",
        "Питання 4.4: Як контролюється телеметрія флоту та автоматичний відмовостійкий резерв?",
        "Question 4.4: How does real-time fleet telemetry drive automated failover across regions?",
        "99.9% доступность", "99.9% доступність", "99.9% Uptime",
        f'''<p>{t(
            "Служба мониторинга каждые 60 секунд проверяет задержки (TTFT) и коэффициент ошибок всех 94 моделей. При малейшей деградации или исчерпании лимитов трафик бесшовно переключается на альтернативного провайдера без разрыва сессии пользователя.",
            "Служба моніторингу кожні 60 секунд перевіряє затримки (TTFT) та коефіцієнт помилок усіх 94 моделей. При найменшій деградації або вичерпанні лімітів трафік безшовно перемикається на альтернативного провайдера без розриву сесії користувача.",
            "Continuous automated health-checks evaluate Time-to-First-Token (TTFT), error rates, and API throughput across all 94 models every 60 seconds. If an upstream provider throttles, traffic redirects instantaneously across alternate providers with zero user disruption."
        )}</p>'''
    )

    lead = t(
        "В основе суверенитета платформы — единый реестр из <strong>94 языковых моделей</strong> от ведущих мировых лабораторий, разделенный на бесплатный и коммерческий пулы:",
        "В основі суверенітету платформи — єдиний реєстр з <strong>94 мовних моделей</strong> від провідних світових лабораторій, розділений на безкоштовний та комерційний пули:",
        "The sovereign foundation of our platform is an integrated registry of <strong>94 LLM models</strong> from the world's leading AI labs, tiered into free and frontier commercial pools:"
    )

    matrix_controls = f'''
    <!-- Interactive Matrix Filters -->
    <div class="matrix-controls">
      <div class="filter-tabs">
        <button class="filter-btn active" data-filter="free">
          {t("🟢 Бесплатный пул ($0.00 — 62 модели)", "🟢 Безкоштовний пул ($0.00 — 62 моделі)", "🟢 Free Quota ($0.00 — 62 Models)")}
        </button>
        <button class="filter-btn" data-filter="paid">
          {t("💎 Платный коммерческий пул (32 модели)", "💎 Платний комерційний пул (32 моделі)", "💎 Frontier Commercial (32 Models)")}
        </button>
        <button class="filter-btn" data-filter="all">
          {t("🌐 Все 94 модели", "🌐 Всі 94 моделі", "🌐 All 94 Models")}
        </button>
      </div>

      <div class="search-sort-bar">
        <input type="text" id="model-search" class="matrix-search-input" placeholder="{t('🔍 Поиск по названию, роли, провайдеру...', '🔍 Пошук за назвою, роллю, провайдером...', '🔍 Search by name, role, provider...')}">
        
        <select id="model-sort" class="matrix-select">
          <option value="quality">{t("Сортировка: По интеллекту / IQ 🧠", "Сортування: За інтелектом / IQ 🧠", "Sort: Quality / IQ Score 🧠")}</option>
          <option value="recency">{t("Сортировка: По новизне ✨", "Сортування: За новизною ✨", "Sort: Recency / Newest ✨")}</option>
          <option value="speed">{t("Сортировка: По скорости ответа ⚡", "Сортування: За швидкістю відповіді ⚡", "Sort: Speed / Latency ⚡")}</option>
          <option value="price">{t("Сортировка: По стоимости $", "Сортування: За вартістю $", "Sort: Token Price $")}</option>
        </select>
      </div>
    </div>

    <!-- Models Cards Container -->
    <div class="models-grid" id="models-grid">
{prerendered_models_html}
    </div>
'''

    # Compact one-line list: all 94 models + Top-N
    all_lines = models_renderer.get_models_line_list(with_dates=True)
    top_lines = models_renderer.get_models_top_list(
        "🏆 ТОП-20 моделей по совокупному интеллекту (IQ)",
        "🏆 ТОП-20 моделей за сукупним інтелектом (IQ)",
        "🏆 Top-20 Models by Composite Intelligence (IQ)",
        n=20, with_dates=True)

    info_panel = infographics_builder.get_infographic_04()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}
      {sub4}
      {matrix_controls}

      <!-- One-line model registry: plain-text readable, terminal/raw friendly -->
      <div class="model-line-list">
        <div class="model-list-header">{t("📋 Полный реестр 94 моделей (одна строка = одна модель)", "📋 Повний реєстр 94 моделей (один рядок = одна модель)", "📋 Full Registry of 94 Models (one line = one model)")}</div>
        {all_lines}
      </div>

      <div class="model-line-list">
        {top_lines}
      </div>'''

    return accordion_section(
        "models-matrix", "04",
        "Матрица 94 LLM-моделей: Федерация интеллекта без вендор-лока",
        "Матриця 94 LLM-моделей: Федерація інтелекту без вендор-локу",
        "94-Model Multi-Provider Matrix: Sovereign Intelligence Federation",
        "94 модели онлайн", "94 моделі онлайн", "94 Active LLMs",
        content, open=False
    )

def get_section_05():
    sub1 = sub_accordion(
        "sub-5-1", "📊",
        "Вопрос 5.1: Каковы результаты сравнительного анализа одиночного чат-бота и Консилиума?",
        "Питання 5.1: Які результати порівняльного аналізу одиночного чат-бота та Консиліуму?",
        "Question 5.1: What are the benchmark results: single chatbot vs. EvaLine Consilium?",
        "Факторный анализ", "Факторний аналіз", "Factor Analysis",
        f'''<div class="table-responsive">
        <table class="comparison-table" border="1" cellpadding="8" cellspacing="0">
          <thead>
            <tr>
              <th>{t("Критерий оценки", "Критерій оцінки", "Evaluation Criteria")}</th>
              <th>{t("Обычный чат-бот (ChatGPT / Copilot)", "Звичайний чат-бот (ChatGPT / Copilot)", "Generic Chatbot (ChatGPT / Copilot)")}</th>
              <th class="col-highlight">{t("Система «Евалайн Консилиум»", "Система «Євалайн Консиліум»", "EvaLine Consilium System")}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>{t("Архитектура исполнения", "Архітектура виконання", "Execution Architecture")}</strong></td>
              <td data-label="{t('Обычный чат-бот', 'Звичайний чат-бот', 'Generic Chatbot')}">{t("Одиночные ответы в окне чата без интеграции.", "Поодинокі відповіді у вікні чату без інтеграції.", "Isolated text prompt-reply in a browser widget.")}</td>
              <td class="col-highlight" data-label="{t('Консилиум', 'Консиліум', 'Consilium')}">{t("Автономный штат специалистов, работающих сквозным циклом.", "Автономний штат спеціалістів наскрізного циклу.", "Autonomous staff of specialized agents in a full-cycle loop.")}</td>
            </tr>
            <tr>
              <td><strong>{t("Устойчивость к галлюцинациям", "Стійкість до галюцинацій", "Hallucination Defense")}</strong></td>
              <td data-label="{t('Обычный чат-бот', 'Звичайний чат-бот', 'Generic Chatbot')}">{t("Низкая: модель склонна уверенно выдумывать факты.", "Низька: модель схильна впевнено вигадувати факти.", "Low: standalone models hallucinate with high linguistic confidence.")}</td>
              <td class="col-highlight" data-label="{t('Консилиум', 'Консиліум', 'Consilium')}">{t("Высокая: перекрёстный аудит несколькими независимыми LLM (точность 99.4%).", "Висока: перехресний аудит кількома незалежними LLM (точність 99.4%).", "High: heterogeneous cross-model debate and RAG verification (99.4% precision).")}</td>
            </tr>
            <tr>
              <td><strong>{t("Выполнение действий в IT и цехе", "Виконання дій в IT та цеху", "Tool Integration & Actions")}</strong></td>
              <td data-label="{t('Обычный чат-бот', 'Звичайний чат-бот', 'Generic Chatbot')}">{t("Невозможно (только текстовые советы и сниппеты).", "Неможливо (лише поради та шматочки тексту).", "None (passive text generation and advice only).")}</td>
              <td class="col-highlight" data-label="{t('Консилиум', 'Консиліум', 'Consilium')}">{t("Прямое управление серверами, кодом, ЧПУ-раскроем и Docker через MCP.", "Пряме керування серверами, кодом, верстатами ЧПК та Docker через MCP.", "Direct server orchestration, Git commits, CNC cutting, and Docker via MCP.")}</td>
            </tr>
            <tr>
              <td><strong>{t("Безопасность корпоративных данных", "Безпека корпоративних даних", "Enterprise Data Security")}</strong></td>
              <td data-label="{t('Обычный чат-бот', 'Звичайний чат-бот', 'Generic Chatbot')}">{t("Утечка коммерческой тайны на сервера сторонней компании.", "Витік комерційної таємниці на сервери сторонніх компаній.", "Data ingested for training on public commercial servers.")}</td>
              <td class="col-highlight" data-label="{t('Консилиум', 'Консиліум', 'Consilium')}">{t("Суверенная архитектура: закрытый WireGuard контур и изолированные БД.", "Суверенна архітектура: закритий WireGuard контур та ізольовані БД.", "Sovereign architecture: encrypted WireGuard tunnel and local private DBs.")}</td>
            </tr>
            <tr>
              <td><strong>{t("Зависимость от одного провайдера", "Залежність від одного провайдера", "Vendor Lock-in Risk")}</strong></td>
              <td data-label="{t('Обычный чат-бот', 'Звичайний чат-бот', 'Generic Chatbot')}">{t("100% зависимость: при сбое провайдера процесс встаёт.", "100% залежність: при збої провайдера процес зупиняється.", "100% dependent: outage at a single provider halts business.")}</td>
              <td class="col-highlight" data-label="{t('Консилиум', 'Консиліум', 'Consilium')}">{t("Федерация из 94 моделей с автоматическим переключением резерва.", "Федерація з 94 моделей з автоматичним перемиканням резерву.", "Federation of 94 models with automatic sub-second failover.")}</td>
            </tr>
            <tr>
              <td><strong>{t("Экономика владения (TCO)", "Економіка володіння (TCO)", "Total Cost of Ownership")}</strong></td>
              <td data-label="{t('Обычный чат-бот', 'Звичайний чат-бот', 'Generic Chatbot')}">{t("Фиксированная дорогая подписка на каждого пользователя.", "Фіксована дорога підписка на кожного користувача.", "Expensive per-seat subscriptions with unpredictable overages.")}</td>
              <td class="col-highlight" data-label="{t('Консилиум', 'Консиліум', 'Consilium')}">{t("Гибридный пул: 90% задач на бесплатном слое, ROI 400%–900%.", "Гібридний пул: 90% завдань на безкоштовному шарі, ROI 400%–900%.", "Hybrid pool: 90% of volume on free tier, 400%–900% ROI.")}</td>
            </tr>
          </tbody>
        </table>
      </div>'''
    )

    sub2 = sub_accordion(
        "sub-5-2", "🔒",
        "Вопрос 5.2: Как обеспечивается аудит безопасности, приватности и суверенитета данных?",
        "Питання 5.2: Як забезпечується аудит безпеки, приватності та суверенітету даних?",
        "Question 5.2: How is enterprise security, privacy, and sovereign data governance audited?",
        "Нулевое разглашение", "Нульове розголошення", "Zero Data Exposure",
        f'''<p>{t(
            "В отличие от потребительских чат-ботов, где запросы сотрудников уходят в общедоступные облака и используются для дообучения глобальных моделей, платформа EvaLine изолирована: клиентские данные и чертежи никогда не передаются третьим лицам и циркулируют строго внутри зашифрованного периметра.",
            "На відміну від споживчих чат-ботів, де запити співробітників потрапляють у публічні хмари і використовуються для навчання глобальних моделей, платформа EvaLine ізольована: клієнтські дані та креслення ніколи не передаються третім особам і циркулюють суворо всередині зашифрованого периметра.",
            "Unlike public consumer chatbots where confidential business spreadsheets and legal contracts are exposed to third-party model retraining, EvaLine operates strictly within a sandboxed enterprise boundary: zero training on corporate telemetry, strict RBAC permissions, and encrypted at-rest storage."
        )}</p>'''
    )

    sub3 = sub_accordion(
        "sub-5-3", "💵",
        "Вопрос 5.3: Какова реальная юнит-экономика и совокупная стоимость владения (TCO)?",
        "Питання 5.3: Яка реальна юніт-економіка та сукупна вартість володіння (TCO)?",
        "Question 5.3: What are the verified unit economics and TCO optimizations?",
        "Экономия 85%", "Економія 85%", "85% Cost Reduction",
        f'''<p>{t(
            "Использование гибридного контура из 62 бесплатных и 32 платных моделей снижает операционные затраты компании на обработку запросов на 85%. Бизнес получает мощь искусственного интеллекта промышленного класса без раздувания IT-бюджета.",
            "Використання гібридного контуру з 62 безкоштовних та 32 платних моделей знижує операційні витрати компанії на обробку запитів на 85%. Бізнес отримує потужність штучного інтелекту промислового класу без роздування IT-бюджету.",
            "Deploying an intelligent dual-tier architecture with 62 zero-cost models and 32 frontier models compresses monthly enterprise API overhead by up to 85%, providing industrial-grade AI throughput while maintaining lean operational expenditure."
        )}</p>'''
    )

    lead = t(
        "Объективный технический аудит подтверждает превосходство распределенной системы Консилиум над любым одиночным потребительским чат-ботом:",
        "Об'єктивний технічний аудит підтверджує перевагу розподіленої системи Консиліум над будь-яким одиночним споживчим чат-ботом:",
        "An objective technical audit demonstrates the structural superiority of the distributed Consilium architecture over standalone consumer chatbots:"
    )

    info_panel = infographics_builder.get_infographic_05()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}'''

    return accordion_section(
        "comparative-audit", "05",
        "Сравнительный аудит: Одиночный чат-бот vs Система «Евалайн Консилиум»",
        "Порівняльний аудит: Одиночний чат-бот vs Система «Євалайн Консиліум»",
        "Comparative Audit: Standalone Chatbot vs. EvaLine Consilium System",
        "Технический аудит", "Технічний аудит", "Technical Audit",
        content, open=False
    )

def get_section_06():
    sub1 = sub_accordion(
        "sub-6-1", "🇩🇪",
        "Вопрос 6.1: Зачем ядро EvaBrain размещено во Франкфурте (8 vCPU, 32GB RAM)?",
        "Питання 6.1: Навіщо ядро EvaBrain розміщено у Франкфурті (8 vCPU, 32GB RAM)?",
        "Question 6.1: Why is the dedicated EvaBrain compute core hosted in Frankfurt?",
        "8 vCPU / 32GB RAM", "8 vCPU / 32GB RAM", "8 vCPU / 32GB RAM",
        f'''<p>{t(
            "Высокопроизводительный сервер (8 ядер Intel Xeon, 32 ГБ RAM) в дата-центре GCP europe-west3-a (Франкфурт-на-Майне). Здесь непрерывно функционируют все тяжелые агенты, компиляторы, локальные языковые серверы LSP, шина MCP и графовая память. 100% аптайм гарантирован даже при полном блэкауте в восточноевропейском регионе.",
            "Високопродуктивний сервер (8 ядер Intel Xeon, 32 ГБ RAM) у дата-центрі GCP europe-west3-a (Франкфурт-на-Майні). Тут безперервно функціонують усі важкі агенти, компілятори, локальні мовні сервери LSP, шина MCP та графова пам'ять. 100% аптайм гарантовано навіть при блекауті в регіоні.",
            "High-performance compute node (8 vCPUs Intel Xeon, 32 GB RAM) located in GCP datacenter europe-west3-a (Frankfurt). Hosts heavy agent loops, compilers, local LSP engines, MCP servers, and semantic graph memory, guaranteeing 100% uptime regardless of regional infrastructure disturbances."
        )}</p>'''
    )

    sub2 = sub_accordion(
        "sub-6-2", "🇺🇸",
        "Вопрос 6.2: Какую защитную роль играет краевой шлюз EvaFace в Айове (HTTP/3)?",
        "Питання 6.2: Яку захисну роль відіграє крайовий шлюз EvaFace в Айові (HTTP/3)?",
        "Question 6.2: What protective role does the EvaFace edge ingress proxy fulfill?",
        "HTTP/3 QUIC", "HTTP/3 QUIC", "HTTP/3 QUIC",
        f'''<p>{t(
            "Облегченный edge-узел на базе Caddy v2 с аппаратной поддержкой протокола HTTP/3 QUIC, TLS 1.3 и Brotli-сжатия. Принимает глобальный трафик пользователей со всего мира, отсекает DDoS-атаки, кэширует статику и защищенно проксирует запросы в ядро.",
            "Полегшений edge-вузол на базі Caddy v2 з апаратною підтримкою протоколу HTTP/3 QUIC, TLS 1.3 та Brotli-стиснення. Приймає глобальний трафік користувачів з усього світу, блокує DDoS-атаки, кешує статику та захищено проксує запити в ядро.",
            "Hardened edge gateway built on Caddy v2 with native HTTP/3 QUIC, TLS 1.3, and Brotli compression. Ingests global client traffic, absorbs DDoS volumetric surges, serves cached assets, and securely proxies verified workloads to the core."
        )}</p>'''
    )

    sub3 = sub_accordion(
        "sub-6-3", "🌐",
        "Вопрос 6.3: Как магистраль WireGuard Mesh с ChaCha20-Poly1305 изолирует сеть?",
        "Питання 6.3: Як магістраль WireGuard Mesh з ChaCha20-Poly1305 ізолює мережу?",
        "Question 6.3: How does the WireGuard encrypted mesh backbone secure communications?",
        "Peer-to-Peer шифрование", "Peer-to-Peer шифрування", "P2P Encryption",
        f'''<p>{t(
            "Дата-центры во Франкфурте и США объединены через пиринговый туннель WireGuard без публично открытых портов управления. Автоматические службы-сторожи (Watchdog каждые 3 минуты) и защита ядра (EarlyOOM) исключают зависания процессов и сетевые изоляции.",
            "Дата-центри у Франкфурті та США об'єднані через піринговий тунель WireGuard без відкритих публічних портів керування. Автоматичні служби-сторожі (Watchdog що 3 хвилини) та захист ядра (EarlyOOM) виключають зависання процесів та ізоляцію мережі.",
            "Nodes are interconnected via private point-to-point WireGuard mesh tunnels with zero publicly exposed backend ports. Automated watchdog daemons (polling every 180s) and EarlyOOM kernel protectors prevent memory deadlocks and silent process dropouts."
        )}</p>'''
    )

    sub4 = sub_accordion(
        "sub-6-4", "⚡",
        "Вопрос 6.4: Как гарантируется работа при блэкаутах, обрывах связи и ракетных ударах?",
        "Питання 6.4: Як гарантується робота при блекаутах, обривах зв'язку та ракетних ударах?",
        "Question 6.4: How is uninterrupted manufacturing continuity maintained during blackouts?",
        "Автономное производство", "Автономне виробництво", "Autonomous Plant",
        f'''<p>{t(
            "Инфраструктура EvaLine спроектирована для работы в условиях ракетных ударов и аварий энергосистемы. Если физический завод переходит на резервные дизель-генераторы, цифровая фабрика агентов в облаке Европы не прекращает принимать заказы, формировать счета и обновлять складские остатки ни на секунду.",
            "Інфраструктура EvaLine спроєктована для роботи в умовах ракетних ударів та аварій енергосистеми. Якщо фізичний завод переходить на резервні дизель-генератори, цифрова фабрика агентів у хмарі Європи не припиняє приймати замовлення, формувати рахунки та оновлювати складські залишки ні на секунду.",
            "EvaLine infrastructure is architected to endure extreme blackout conditions. When the physical factory shifts seamlessly to industrial diesel generators, our cloud agent fleet in Western Europe continues processing customer orders, booking inventory, and calculating CNC production queues without a single second of downtime."
        )}</p>'''
    )

    lead = t(
        "Инфраструктура EvaLine создана по стандартам военной отказоустойчивости с полным географическим и энергетическим резервированием:",
        "Інфраструктура EvaLine створена за стандартами військової відмовостійкості з повним географічним та енергетичним резервуванням:",
        "EvaLine infrastructure is engineered to defense-grade fault tolerance with full geographic and energy redundancy:"
    )

    info_panel = infographics_builder.get_infographic_06()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}
      {sub4}'''

    return accordion_section(
        "military-resilience", "06",
        "Военная устойчивость, блэкаут-резистентность и кластер двух узлов",
        "Військова стійкість, блекаут-резистентність та кластер двох вузлів",
        "Military Resilience, Blackout Defense & Dual-Node Cluster Topology",
        "Отказоустойчивость", "Відмовостійкість", "High Availability",
        content, open=False
    )

def get_section_07():
    sub1 = sub_accordion(
        "sub-7-1", "🌐",
        "Вопрос 7.1: Какие ключевые веб-терминалы и сервисы входят в сеть компании?",
        "Питання 7.1: Які ключові веб-термінали та сервіси входять до мережі компанії?",
        "Question 7.1: What are the primary public web terminals and interfaces across the network?",
        "4 ключевых домена", "4 ключові домени", "4 Core Domains",
        f'''<div class="hub-grid">
        <a href="https://evabot.online" class="hub-item">
          <span class="hub-item-badge">{t("Рабочая станция ИИ", "Робоча станція ШІ", "AI Workstation")}</span>
          <div class="hub-item-domain">evabot.online</div>
          <div class="hub-item-desc">{t(
            "Главный интерактивный терминал EvaBot: мультимодельный диалог, запуск Консилиума и голосовое взаимодействие.",
            "Головний інтерактивний термінал EvaBot: мультимодельний діалог, запуск Консиліуму та голосова взаємодія.",
            "Primary interactive terminal: multi-model dialogue, Consilium debate engine, and voice interaction."
          )}</div>
        </a>

        <a href="https://evaline.network" class="hub-item">
          <span class="hub-item-badge">{t("Телеметрия кластера", "Телеметрія кластера", "Cluster Telemetry")}</span>
          <div class="hub-item-domain">evaline.network</div>
          <div class="hub-item-desc">{t(
            "Высокотехнологичный TUI-дашборд: мониторинг процессов, задержки сети и состояния 94 LLM моделей в реальном времени.",
            "Високотехнологічний TUI-дашборд: моніторинг процесів, затримок мережі та стану 94 LLM моделей у реальному часі.",
            "High-tech cyber dashboard: real-time process monitoring, network latencies, and 94 LLM health."
          )}</div>
        </a>

        <a href="https://evaline.online" class="hub-item">
          <span class="hub-item-badge">{t("Манифест и философия", "Маніфест і філософія", "Manifesto & Philosophy")}</span>
          <div class="hub-item-domain">evaline.online</div>
          <div class="hub-item-desc">{t(
            "Официальный манифест фабрики агентов, системы Консилиум и принципов суверенного интеллекта и полимерного производства.",
            "Офіційний маніфест фабрики агентів, системи Консиліум та принципів суверенного інтелекту і полімерного виробництва.",
            "Official manifesto of the agent factory, Consilium system, and principles of sovereign intelligence and polymers."
          )}</div>
        </a>

        <a href="https://evaline.website" class="hub-item">
          <span class="hub-item-badge">{t("Центральный портал", "Центральний портал", "Central Portal")}</span>
          <div class="hub-item-domain">evaline.website</div>
          <div class="hub-item-desc">{t(
            "Единый навигационный каталог всех сервисов, продуктов, инструментов и точек входа компании.",
            "Єдиний навігаційний каталог усіх сервісів, продуктів, інструментів та точок входу компанії.",
            "Unified navigation gateway across all company services, product catalogs, and corporate entry points."
          )}</div>
        </a>
      </div>'''
    )

    sub2 = sub_accordion(
        "sub-7-2", "📚",
        "Вопрос 7.2: Где изучить техническую документацию по архитектуре (Quartz Docs)?",
        "Питання 7.2: Де вивчити технічну документацію з архітектури (Quartz Docs)?",
        "Question 7.2: Where can developers study technical documentation and specifications?",
        "База знаний", "База знань", "Knowledge Base",
        f'''<p>{t(
            "Открытая и закрытая корпоративная документация компании, развернутая на быстром движке Quartz. Включает 360+ структурированных статей: детальные схемы кластера, ролевые инструкции агентов, спецификации API, производственные регламенты ТУ/ГОСТ и стандарты контроля качества ISO 9001:2015.",
            "Відкрита та закрита корпоративна документація компанії, розгорнута на швидкому рушії Quartz. Включає 360+ структурованих статей: детальні схеми кластера, рольові інструкції агентів, специфікації API, виробничі регламенти ТУ/ДСТУ та стандарти контролю якості ISO 9001:2015.",
            "Internal and developer documentation hosted on Quartz. Encompasses 360+ structured articles: complete cluster topologies, agent prompt profiles, API endpoints, manufacturing standards, and ISO 9001:2015 compliance protocols."
        )}</p>
        <p><a href="https://evabot.online/docs/" target="_blank" style="color: var(--cyan); text-decoration: underline;">
          {t("Перейти к базе знаний Quartz ➔", "Перейти до бази знань Quartz ➔", "Open Quartz Documentation ➔")}
        </a></p>'''
    )

    sub3 = sub_accordion(
        "sub-7-3", "🎙️",
        "Вопрос 7.3: Как подключить интерактивный голосовой сервис EvaVoice API?",
        "Питання 7.3: Як підключити інтерактивний голосовий сервіс EvaVoice API?",
        "Question 7.3: How do operators integrate the real-time EvaVoice API (FastAPI :8000)?",
        "Синтез и распознавание", "Синтез та розпізнавання", "STT & TTS Engine",
        f'''<p>{t(
            "Высокоскоростной асинхронный микросервис на FastAPI и WebSocket для мгновенного синтеза и распознавания речи в реальном времени. Обеспечивает голосовую связь с агентами EvaLine через браузер, телефонные шлюзы SIP или мобильные устройства с задержкой менее 250 мс.",
            "Високошвидкісний асинхронний мікросервіс на FastAPI та WebSocket для миттєвого синтезу та розпізнавання мови в реальному часі. Забезпечує голосовий зв'язок з агентами EvaLine через браузер, телефонні шлюзи SIP або мобільні пристрої із затримкою менше 250 мс.",
            "Ultra-low-latency asynchronous microservice built on FastAPI and bidirectional WebSockets for real-time speech-to-text and text-to-speech. Connects operators directly to EvaLine agents via browser, SIP VoIP telephony, or mobile apps with sub-250ms latency."
        )}</p>
        <p><a href="https://evabot.online/voice/docs" target="_blank" style="color: var(--accent); text-decoration: underline;">
          {t("Открыть Swagger UI интерактивного API ➔", "Відкрити Swagger UI інтерактивного API ➔", "Open Interactive Swagger UI ➔")}
        </a></p>'''
    )

    lead = t(
        "Экосистема объединяет специализированные домены и API-шлюзы для различных бизнес-сценариев:",
        "Екосистема об'єднує спеціалізовані домени та API-шлюзи для різноманітних бізнес-сценаріїв:",
        "Our unified digital ecosystem links specialized domain endpoints and API services for comprehensive enterprise operations:"
    )

    info_panel = infographics_builder.get_infographic_07()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}'''

    return accordion_section(
        "ecosystem-catalog", "07",
        "Единая экосистема: Каталог доменов и сервисов",
        "Єдина екосистема: Каталог доменів та сервісів",
        "Unified Ecosystem: Domain Directory & Public Services Hub",
        "4 домена кластера", "4 домени кластера", "4 Cluster Domains",
        content, open=False
    )
