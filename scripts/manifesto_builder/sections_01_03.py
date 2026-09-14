# -*- coding: utf-8 -*-
from helpers import t, accordion_section, sub_accordion
import infographics_builder

def get_section_01():
    sub1 = sub_accordion(
        "sub-1-1", "❌",
        "Вопрос 1.1: В чем опасность слепых галлюцинаций одиночных нейросетей?",
        "Питання 1.1: У чому небезпека сліпих галюцинацій одиночних нейромереж?",
        "Question 1.1: What are the dangers of blind hallucinations in standalone AI?",
        "Критический риск", "Критичний ризик", "Critical Risk",
        f'''<p>{t(
            "Одиночная языковая модель генерирует ответы с предельной лингвистической уверенностью, даже когда фатально искажает факты. В юриспруденции, финансах, системной архитектуре и промышленном производстве полимеров цена выдуманной нормы стандарта, ошибки в рецептуре или уязвимости в коде оборачивается колоссальными убытками и судебными исками.",
            "Одиночна мовна модель генерує відповіді з граничною лінгвістичною впевненістю, навіть коли фатально спотворює факти. В юриспруденції, фінансах, системній архітектурі та промисловому виробництві полімерів ціна вигаданої норми стандарту, помилки в рецептурі або вразливості в коді обертається колосальними збитками.",
            "Standalone language models generate responses with absolute syntactic confidence even while fatally hallucinating critical facts. In legal compliance, financial forecasting, system architecture, and polymer manufacturing, a single hallucinated standard, compounding formulation error, or security flaw leads to catastrophic financial and operational losses."
        )}</p>'''
    )

    sub2 = sub_accordion(
        "sub-1-2", "🔒",
        "Вопрос 1.2: Почему текстовый чат не способен выполнять реальную работу («проблема отсутствия рук»)?",
        "Питання 1.2: Чому текстовий чат не здатний виконувати реальну роботу («проблема відсутності рук»)?",
        "Question 1.2: Why is text chat isolated and unable to execute physical actions?",
        "Отсутствие инструментов", "Відсутність інструментів", "Tool Deprivation",
        f'''<p>{t(
            "Традиционный чат-бот заперт в веб-интерфейсе. Он не может самостоятельно зайти на сервер по SSH, собрать Docker-образ, выполнить коммит в Git, проверить складские остатки сырья в 1С/ERP или сгенерировать управляющий G-код для раскройного станка ЧПУ. Человек остается вынужденным ручным посредником между монитором и реальным делом.",
            "Традиційний чат-бот замкнений у веб-інтерфейсі. Він не може самостійно зайти на сервер через SSH, зібрати Docker-образ, зробити коміт у Git, перевірити залишки сировини в 1С/ERP або згенерувати керуючий G-код для верстата ЧПК. Людина залишається вимушеним ручним посередником між монітором і виробництвом.",
            "Traditional chatbots remain trapped inside a static web browser window. They cannot SSH into production servers, build Docker containers, commit code to Git repositories, query live ERP/1C inventory, or generate CNC G-code cutting paths. Humans remain burdened as manual, error-prone copy-paste intermediaries."
        )}</p>'''
    )

    sub3 = sub_accordion(
        "sub-1-3", "⛓️",
        "Вопрос 1.3: Чем опасна зависимость от монополий (Vendor Lock-in) и риск блокировки?",
        "Питання 1.3: Чим небезпечна залежність від монополій (Vendor Lock-in) та ризик блокування?",
        "Question 1.3: What are the severe risks of vendor lock-in and infrastructure fragility?",
        "Стратегическая уязвимость", "Стратегічна вразливість", "Strategic Vulnerability",
        f'''<p>{t(
            "Привязка критических процессов к одному зарубежному закрытому API делает компанию заложником чужой ценовой политики, цензуры, санкционных фильтров и внезапных аварий в дата-центрах Калифорнии. Когда падает единственный поставщик — останавливаются продажи, клиентская поддержка и автоматизация бизнеса.",
            "Прив'язка критичних процесів до одного закритого API робить компанію заручником чужої цінової політики, цензури, санкційних фільтрів та раптових аварій у дата-центрах Каліфорнії. Коли падає єдиний постачальник — зупиняються продажі, клієнтська підтримка та автоматизація бізнесу.",
            "Anchoring enterprise automation to a single proprietary cloud API leaves business operations exposed to sudden price hikes, rate limits, arbitrary geopolitical account suspensions, and cloud outages. When a single vendor suffers downtime, customer support, sales pipelines, and ERP workflows immediately grind to a halt."
        )}</p>'''
    )

    lead = t(
        "Подавляющее большинство корпоративных внедрений искусственного интеллекта терпит фиаско, сводясь к примитивному окну веб-чата. На практике бизнес мгновенно упирается в фундаментальные ограничения одиночных языковых моделей:",
        "Переважна більшість корпоративних впроваджень штучного інтелекту зазнає невдачі, зводячись до примітивного вікна веб-чату. На практиці бізнес миттєво стикається з фундаментальними обмеженнями одиночних мовних моделей:",
        "The vast majority of corporate AI implementations fail because they reduce intelligence to an isolated web chatbox. In real-world enterprise environments, businesses face systemic bottlenecks from standalone language models:"
    )

    info_panel = infographics_builder.get_infographic_01()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}'''

    return accordion_section(
        "problem-statement", "01",
        "Проблема рынка: почему бизнесу недостаточно обычных чат-ботов",
        "Проблема ринку: чому бізнесу недостатньо звичайних чат-ботів",
        "Market Bottleneck: Why Standalone Chatbots Fail in Enterprise",
        "Аудит уязвимостей", "Аудит вразливостей", "Vulnerability Audit",
        content, open=True
    )

def get_section_02():
    sub1 = sub_accordion(
        "sub-2-1", "👥",
        "Вопрос 2.1: Что такое фабрика агентов и в чем ролевая специализация цифровых сотрудников?",
        "Питання 2.1: Що таке фабрика агентів та в чому рольова спеціалізація цифрових співробітників?",
        "Question 2.1: What is an agent factory and how are digital employee personas structured?",
        "6 ключевых ролей", "6 ключових ролей", "6 Core Personas",
        f'''<p>{t(
            "Каждый агент EvaLine наделен строгим функционалом и персональной зоной ответственности: Главный системный архитектор (<strong>Architect</strong>), Ведущий инженер бэкенда и разработки, шеф производства, безопасности и бизнес-процессов (<strong>Adam</strong>), Фронтенд-директор, лицо компании и голос заботы о клиентах (<strong>Eva</strong>), Офицер кибербезопасности (<strong>CISO</strong>), Аналитик баз данных (<strong>Data Engineer</strong>) и Стратегический директор (<strong>CEO</strong>).",
            "Кожен агент EvaLine наділений чітким функціоналом та зоною відповідальності: Головний системний архітектор (<strong>Architect</strong>), Провідний інженер бекенду та розробки, шеф виробництва, безпеки та бізнес-процесів (<strong>Adam</strong>), Фронтенд-директор, обличчя компанії та голос турботи про клієнта (<strong>Eva</strong>), Офіцер кібербезпеки (<strong>CISO</strong>), Аналітик баз даних (<strong>Data Engineer</strong>) та Стратегічний директор (<strong>CEO</strong>).",
            "Every EvaLine agent is endowed with explicit authority boundaries and rigorous domain prompts: Chief Systems Architect (<strong>Architect</strong>), Lead Backend & Development Engineer, Chief of Manufacturing, Security & Business Processes (<strong>Adam</strong>), Frontend Director, Company Face & Client-Care Voice (<strong>Eva</strong>), Chief Information Security Officer (<strong>CISO</strong>), Telemetry & Data Engineer (<strong>Data Engineer</strong>), and Strategic Coordinator (<strong>CEO</strong>)."
        )}</p>'''
    )

    sub2 = sub_accordion(
        "sub-2-2", "🛠️",
        "Вопрос 2.2: Что дает открытый протокол Model Context Protocol (MCP) и зачем 21 сервер инструментов?",
        "Питання 2.2: Що дає відкритий протокол Model Context Protocol (MCP) та навіщо 21 сервер інструментів?",
        "Question 2.2: What capabilities does the MCP tool bus provide with 21 execution servers?",
        "Физический доступ", "Фізичний доступ", "Physical Execution",
        f'''<p>{t(
            "Через открытый протокол Model Context Protocol наши агенты получают реальные «руки» в инфраструктуре: прямое исполнение терминальных команд Linux/Bash, управление Docker-контейнерами, чтение и коммит в Git, запросы в базы данных SQLite/PostgreSQL, управление браузером через Chrome DevTools и вызовы защищенных корпоративных REST/WebSocket API.",
            "Через відкритий протокол Model Context Protocol наші агенти отримують реальні «руки» в інфраструктурі: пряме виконання команд Linux/Bash, керування Docker-контейнерами, читання та коміти в Git, запити до баз даних SQLite/PostgreSQL, автоматизація браузера через Chrome DevTools та виклики захищених REST/WebSocket API.",
            "Standardized via the Model Context Protocol, our autonomous agents possess real hands in compute and production environments: direct sandboxed Linux/Bash execution, Docker lifecycle orchestration, Git version control commits, live SQLite/PostgreSQL telemetry queries, Chrome DevTools headless automation, and authenticated REST/WebSocket ERP webhooks."
        )}</p>'''
    )

    sub3 = sub_accordion(
        "sub-2-3", "🧠",
        "Вопрос 2.3: Как заземленная корпоративная память (RAG) гарантирует 0% выдумок?",
        "Питання 2.3: Як заземлена корпоративна пам'ять (RAG) гарантує 0% вигадок?",
        "Question 2.3: How does grounded enterprise RAG memory ensure 0% hallucinations?",
        "0% фантазий", "0% фантазій", "Zero Hallucination",
        f'''<p>{t(
            "Агенты никогда не отвечают «наугад». Перед генерацией любого ответа или управляющего решения агент обращается к трехуровневой памяти: графовая база сущностей Memory, векторное семантическое хранилище ChromaDB и полнотекстовый поиск FTS5 по 360+ статьям внутренней документации, ГОСТам, спецификациям ISO 9001:2015 и складским базам.",
            "Агенти ніколи не відповідають «наосліп». Перед генерацією будь-якої відповіді чи рішення агент звертається до трирівневої пам'яті: графова база сутностей Memory, векторне сховище ChromaDB та повнотекстовий пошук FTS5 по 360+ статтях внутрішньої документації, ДСТУ/ТУ, стандартах ISO 9001:2015 та базах 1С.",
            "Agents never reply based on ungrounded statistical guesses. Prior to forming any technical output or production order, agents cross-reference a 3-tier corporate memory: semantic graph entity relations (Memory MCP), high-density vector retrieval (ChromaDB), and deterministic FTS5 full-text indexing over 360+ documentation articles, ISO 9001:2015 specs, and inventory ledgers."
        )}</p>'''
    )

    sub4 = sub_accordion(
        "sub-2-4", "🔄",
        "Вопрос 2.4: Как устроен закрытый автономный цикл исполнения и контроль качества?",
        "Питання 2.4: Як влаштований закритий автономний цикл виконання та контроль якості?",
        "Question 2.4: How is the closed-loop autonomous execution and QA cycle structured?",
        "Самовосстановление", "Самовідновлення", "Self-Healing",
        f'''<p>{t(
            "Агенты функционируют в непрерывном цикле: Восприятие задачи ➔ Составление формального плана ➔ Исполнение в песочнице ➔ Линтинг и тестирование результата ➔ Взаимное рецензирование коллегами. При обнаружении синтаксических ошибок или нестыковок в смете агент выполняет автоматический откат (rollback) и итеративное исправление без привлечения человека.",
            "Агенти функціонують у безперервному циклі: Сприйняття завдання ➔ Складання плану ➔ Виконання в пісочниці ➔ Лінтинг та тестування ➔ Взаємне рецензування колегами. У разі виявлення помилок або невідповідностей у кошторисі агент здійснює автоматичний відкат (rollback) та виправлення без турботи людини.",
            "Our agents operate inside a closed autonomous control loop: Task Perception ➔ Formal Step Decomposition ➔ Sandboxed Sandbox Execution ➔ Static Analysis & Test Verification ➔ Peer Review. If a syntax regression or volumetric discrepancy is caught, the system initiates an automated git rollback and iteratively refines the solution before final output."
        )}</p>'''
    )

    lead = t(
        "<strong>EvaLine</strong> проектирует не одиночные «виджеты», а <strong>автономную фабрику специализированных цифровых сотрудников</strong>, объединенных промышленными протоколами передачи контекста и общим контуром управления:",
        "<strong>EvaLine</strong> проектує не поодинокі «віджети», а <strong>автономну фабрику спеціалізованих цифрових співробітників</strong>, об'єднаних промисловими протоколами передачі контексту та єдиним контуром управління:",
        "<strong>EvaLine</strong> builds not disposable novelty bots, but an <strong>autonomous factory of specialized digital employees</strong> bound by industrial context protocols and unified deterministic oversight:"
    )

    info_panel = infographics_builder.get_infographic_02()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}
      {sub4}'''

    return accordion_section(
        "agent-factory", "02",
        "EvaNetwork: Фабрика агентов и автономное ИИ-агентство",
        "EvaNetwork: Фабрика агентів та автономне ШІ-агентство",
        "EvaNetwork: Sovereign Agent Factory & Autonomous AI Agency",
        "Инженерная платформа", "Інженерна платформа", "Core Platform",
        content, open=False
    )

def get_section_03():
    sub1 = sub_accordion(
        "sub-3-1", "⚖️",
        "Вопрос 3.1: Как работают 4 этапа выработки решения: от бизнес-потребности к результату?",
        "Питання 3.1: Як працюють 4 етапи вироблення рішення: від бізнес-потреби до результату?",
        "Question 3.1: What are the 4 stages of decision synthesis: from demand to implementation?",
        "Архитектурный протокол", "Архітектурний протокол", "Consensus Protocol",
        f'''<div class="workflow-steps">
          <div class="step-box">
            <div class="step-num">{t("Этап 01", "Етап 01", "Stage 01")}</div>
            <div class="step-title">{t("Декомпозиция и контекст", "Декомпозиція та контекст", "Decomposition & Context")}</div>
            <p class="step-desc">{t(
              "Архитектор и Бизнес-аналитик формулируют технические ограничения, критерии качества и извлекают регламенты из вечной памяти RAG.",
              "Архітектор та Бізнес-аналітик формулюють технічні обмеження, критерії якості та витягують регламенти з вічної пам'яті RAG.",
              "Chief Architect and Business Analyst parse constraints, verify boundary conditions, and pull normative regulations from long-term RAG memory."
            )}</p>
          </div>

          <div class="step-box">
            <div class="step-num">{t("Этап 02", "Етап 02", "Stage 02")}</div>
            <div class="step-title">{t("Параллельный дебат", "Паралельний дебат", "Parallel Debate")}</div>
            <p class="step-desc">{t(
              "Задача одновременно отдается разнородным моделям (Google Gemini, Anthropic Claude, DeepSeek R1). Каждая предлагает свой проект решения.",
              "Завдання одночасно передається різнорідним моделям (Google Gemini, Anthropic Claude, DeepSeek R1). Кожна пропонує свій проєкт рішення.",
              "Task vectors are broadcast in parallel to heterogeneous LLM families (Google Gemini, Anthropic Claude, DeepSeek R1) for independent generation."
            )}</p>
          </div>

          <div class="step-box">
            <div class="step-num">{t("Этап 03", "Етап 03", "Stage 03")}</div>
            <div class="step-title">{t("Состязательный аудит", "Змагальний аудит", "Adversarial Audit")}</div>
            <p class="step-desc">{t(
              "Адам и CISO проверяют код и сметы на уязвимости и перерасход ресурсов. Ева оценивает понятность и ценность для клиента.",
              "Адам та CISO перевіряють код і кошториси на вразливості та перевитрату ресурсів. Єва оцінює зрозумілість і цінність для клієнта.",
              "Adam and CISO audit drafts for security flaws, budget overrun, and memory leaks. Eva audits user ergonomics and clarity."
            )}</p>
          </div>

          <div class="step-box">
            <div class="step-num">{t("Этап 04", "Етап 04", "Stage 04")}</div>
            <div class="step-title">{t("Консенсус и исполнение", "Консенсус та виконання", "Consensus & Action")}</div>
            <p class="step-desc">{t(
              "Логический арбитр синтезирует итоговое решение. Через MCP-серверы команды поступают на боевые сервера, ЧПУ или в CRM.",
              "Логічний арбітр синтезує підсумкове рішення. Через MCP-сервери команди надходять на бойові сервери, ЧПК або в CRM.",
              "Logical arbitrator synthesizes provable consensus. Execution commands are dispatched through sandboxed MCP servers to servers or CNC."
            )}</p>
          </div>
        </div>'''
    )

    sub2 = sub_accordion(
        "sub-3-2", "⚔️",
        "Вопрос 3.2: Зачем заставлять спорить разнородные нейросетевые архитектуры?",
        "Питання 3.2: Навіщо змушувати сперечатися різнорідні нейромережеві архітектури?",
        "Question 3.2: Why mandate adversarial debates across heterogeneous LLM families?",
        "Исключение предвзятости", "Виключення упередженості", "Zero Model Bias",
        f'''<p>{t(
            "Ни одна модель в мире не идеальна. Gemini обладает гигантским контекстом в 2M токенов, Claude непревзойден в архитектурном рефакторинге, а DeepSeek R1 превосходит аналоги в пошаговых математических рассуждениях. В системе Консилиум они выступают оппонентами: Claude находит логические ошибки в коде Gemini, DeepSeek проверяет формулы Claude, а Gemini сводит воедино многотомные массивы входящих документов.",
            "Жодна модель у світі не є ідеальною. Gemini має гігантський контекст у 2M токенів, Claude неперевершений в інженерному рефакторингу, а DeepSeek R1 перевершує аналоги у покрокових математичних міркуваннях. У системі Консиліум вони виступають опонентами: Claude виявляє логічні помилки в коді Gemini, DeepSeek перевіряє формули Claude, а Gemini синтезує масиви документів.",
            "No single model holds absolute superiority across all cognitive tasks. Google Gemini provides a massive 2,000,000 token context window, Anthropic Claude excels in architectural refactoring, and DeepSeek R1 masters deterministic mathematical derivation. Inside the Consilium, they serve as rigorous adversarial peers: Claude attacks Gemini's code for edge cases, DeepSeek verifies numerical formulas, and Gemini fuses multimodal enterprise context."
        )}</p>'''
    )

    sub3 = sub_accordion(
        "sub-3-3", "🔍",
        "Вопрос 3.3: Как математическая верификация устраняет галлюцинации (Точность 99.4%)?",
        "Питання 3.3: Як математична верифікація усуває галюцинації (Точність 99.4%)?",
        "Question 3.3: How does formal mathematical verification eliminate hallucinations (99.4% accuracy)?",
        "Точность 99.4%", "Точність 99.4%", "99.4% Precision",
        f'''<p>{t(
            "Для устранения галлюцинаций используется принцип математического консенсуса. Если вероятность истинности утверждения не подтверждается независимой моделью-аудитором и первоисточником в базе RAG, факт бракуется и отправляется на повторный цикл декомпозиции. Это гарантирует надежность промышленных чертежей и финансовой отчетности на уровне 99.4%.",
            "Для усунення галюцинацій використовується принцип математичного консенсусу. Якщо ймовірність істинності твердження не підтверджується незалежною моделлю-аудитором та першоджерелом у базі RAG, факт відкидається і відправляється на повторний цикл. Це гарантує надійність креслень та звітності на рівні 99.4%.",
            "To eliminate hallucinations, EvaLine deploys formal cross-verification algorithms. Any factual claim, numerical dimension, or code branch that lacks corroboration by both an independent audit LLM and canonical RAG source citations is automatically rejected and sent back for re-verification, achieving a verified factual reliability rate of 99.4%."
        )}</p>'''
    )

    sub4 = sub_accordion(
        "sub-3-4", "☯️",
        "Вопрос 3.4: В чем суть диалектического баланса Адама (Бэкенд и Безопасность) и Евы (Фронтенд и Лицо компании)?",
        "Питання 3.4: У чому суть діалектичного балансу Адама (Бекенд та Безпека) та Єви (Фронтенд та Обличчя компанії)?",
        "Question 3.4: What is the core of the dialectical executive balance: Adam (Backend & Security) vs. Eva (Frontend & Face)?",
        "Двойной контроль", "Подвійний контроль", "Dual Governance",
        f'''<p>{t(
            "Управление платформой разделено между двумя противоположными архетипами: <strong>Адам</strong> олицетворяет сурового инженера бэкенда и разработки: безопасность, бизнес-процессы, сметные лимиты, производство и отсутствие уязвимостей. <strong>Ева</strong> — фронтенд и лицо компании: человекоцентричность, эмпатия, безупречный стиль диалога и мгновенное удовлетворение потребностей клиентов. Их непрерывный диалог рождает идеальный продукт.",
            "Управління платформою розділене між двома протилежними архетипами: <strong>Адам</strong> уособлює суворого інженера бекенду та розробки: безпека, бізнес-процеси, ліміти кошторису, виробництво й відсутність вразливостей. <strong>Єва</strong> — фронтенд і обличчя компанії: людиноцентричність, емпатія, бездоганний стиль діалогу та задоволення потреб клієнтів. Їхній діалог народжує ідеальний баланс.",
            "Platform governance is anchored in an executive dichotomy: <strong>Adam</strong> embodies the unyielding backend and development engineer: zero-trust security, business-process rigor, budget caps, manufacturing discipline, and strict standard compliance. <strong>Eva</strong> is the frontend and the face of the company: empathy, multilingual prose, brand warmth, and instant client success. Their dialectical tension creates products that are both technically bulletproof and delightful to use."
        )}</p>'''
    )

    lead = t(
        "Главное технологическое ядро фабрики — <strong>Consilium Engine</strong>. Это алгоритмическая система многоагентных состязательных дебатов, взаимного рецензирования и консенсуса между независимыми нейросетевыми архитектурами:",
        "Головне технологічне ядро фабрики — <strong>Consilium Engine</strong>. Це алгоритмічна система багатоагентних змагальних дебатів, взаємного рецензування та консенсусу між незалежними нейромережевими архітектурами:",
        "The core technological engine of our platform is the <strong>Consilium Engine</strong>: an algorithmic multi-agent framework facilitating adversarial debates, cross-model peer review, and formal consensus arbitration across heterogeneous neural architectures:"
    )

    info_panel = infographics_builder.get_infographic_03()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}
      {sub4}'''

    return accordion_section(
        "consilium-system", "03",
        "Система «Евалайн Консилиум»: Как работает коллегиальный разум",
        "Система «Євалайн Консиліум»: Як працює колегіальний розум",
        "The EvaLine Consilium System: Collective Intelligence Engine",
        "Коллегиальный ИИ", "Колегіальний ШІ", "Consensus Engine",
        content, open=False
    )
