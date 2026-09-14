# -*- coding: utf-8 -*-
# SECTION 10: PATH TO $1 TRILLION (Economics & Upside of AI Agents)
# Monuments of earning analytics: agent costs, agency ARR, data centers, $1T roadmap.

from helpers import t, accordion_section, sub_accordion

# ---------------------------------------------------------------------------
# 10.1 Cost of building AI agents
# ---------------------------------------------------------------------------
_cost_rows = [
    # (lvl_ru, lvl_uk, lvl_en, cost_ru, cost_uk, cost_en, note_ru, note_uk, note_en)
    ("Бесплатно", "Безкоштовно", "Free",
     "0 $/мес", "0 $/міс", "$0/mo",
     "Локальная open-source модель (Llama 3.3/Qwen/DeepSeek-R1 на своём ПК) или free-quota API. WebUI, Ollama, vLLM на домашнем GPU. Отличный старт: цена = ваш ПК и электричество.",
     "Локальна open-source модель (Llama 3.3/Qwen/DeepSeek-R1 на власному ПК) або free-quota API. WebUI, Ollama, vLLM на домашньому GPU. Чудовий старт: ціна = ваш ПК та електроенергія.",
     "Local open-source model (Llama 3.3/Qwen/DeepSeek-R1 on your PC) or free-quota API. WebUI/Ollama/vLLM on a home GPU. Great start — your only cost is hardware and electricity."),
    ("Low-cost (флоу без API)", "Low-cost (флоу без API)", "Low-cost (no-API flows)",
     "0–5 $/мес", "0–5 $/міс", "$0–5/mo",
     "Автоматизации n8n/Zapier + бесплатные модели через шлюз. Агентные цепочки без платных токенов: сбор заявок, уведомления, парсинг. Себестоимость ≈ 0, масштаб = количеству лидов.",
     "Автоматизації n8n/Zapier + безкоштовні моделі через шлюз. Агентні ланцюжки без платних токенів: збір заявок, сповіщення, парсинг. Собівартість ≈ 0, масштаб = кількості лідів.",
     "n8n/Zapier automations + free models via a router gateway. Agent chains with zero paid tokens: lead capture, alerts, parsing. Near-zero cost, scale limited only by lead flow."),
    ("Средний (API)", "Середній (API)", "Mid-tier (API)",
     "5–100 $/мес", "5–100 $/міс", "$5–100/mo",
     "Продакшн-боты на GPT/Claude/Gemini: ~$1–15 за млн входных и $5–60 за млн выходных токенов frontier-моделей. До сотен тысяч токенов/мес. Окупается первым же клиентом.",
     "Продакшн-боти на GPT/Claude/Gemini: ~$1–15 за млн вхідних і $5–60 за млн вихідних токенів frontier-моделей. До сотень тисяч токенів/міс. Окупається першим клієнтом.",
     "Production bots on GPT/Claude/Gemini: ~$1–15 per M input and $5–60 per M output tokens for frontier models. Up to a few hundred k tokens/mo. Pays for itself with the first client."),
    ("Тяжёлый (финтюнинг + GPU)", "Важкий (фінтюнінг + GPU)", "Heavy (fine-tuning + GPU)",
     "~1 000+ $/мес", "~1 000+ $/міс", "~$1,000+/mo",
     "Аренда GPU (A100/H100, ~$1–3/час) для финтюнинга, LoRA, RAG-векторки, инференса на своём железе. Нужен при собственной модели под нишу или обработке больших объёмов.",
     "Оренда GPU (A100/H100, ~$1–3/год) для фінтюнінгу, LoRA, RAG-векторки, інференсу на власному залізі. Потрібен для власної моделі під нішу або великих обсягів обробки.",
     "GPU rentals (A100/H100, ~$1–3/hr) for fine-tuning, LoRA, RAG vector ingest, self-hosted inference. Needed for a niche proprietary model or high-volume processing."),
    ("Мета-суперагент (ансамбль)", "Мета-суперагент (ансамбль)", "Meta super-agent (ensemble)",
     "10 000+ $/мес", "10 000+ $/міс", "$10k+/mo",
     "Ансамбль нескольких frontier-моделей + инфраструктура (кластеры, оркестрация, резервирование, SLA). Консилиум-подход EvaLine превращает 3–5+ LLM в непрерывный дебат высокого качества.",
     "Ансамбль кількох frontier-моделей + інфраструктура (кластери, оркестрація, резервування, SLA). Консиліум-підхід EvaLine перетворює 3–5+ LLM на безперервний дебат високої якості.",
     "Ensemble of multiple frontier models + infrastructure (clusters, orchestration, redundancy, SLA). The EvaLine Consilium approach turns 3–5+ LLMs into a continuous high-quality debate."),
]

def _render_cost_table():
    rows = []
    for lvl_ru, lvl_uk, lvl_en, c_ru, c_uk, c_en, n_ru, n_uk, n_en in _cost_rows:
        rows.append(f'''          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="left"><strong class="kpi-val">{t(lvl_ru, lvl_uk, lvl_en)}</strong></td>
            <td class="kpi-lbl-cell" align="center"><strong>{t(c_ru, c_uk, c_en)}</strong></td>
            <td class="kpi-sub-cell"><small>{t(n_ru, n_uk, n_en)}</small></td>
          </tr>''')
    return "\n".join(rows)

def _cost_sub():
    return sub_accordion(
        "sub-10-1", "🛠️",
        "10.1 Сколько стоит создать AI-агента: 5 уровней затрат (2026)",
        "10.1 Скільки коштує створити ШІ-агента: 5 рівнів витрат (2026)",
        "10.1 How much does an AI agent cost to build: 5 cost tiers (2026)",
        "от $0 до $10k+/мес", "від $0 до $10k+/міс", "from $0 to $10k+/mo",
        f'''      <p class="lead-text">{t(
          "Стоимость зависит не от «магии», а от выбора: локальная open-source модель — бесплатно; frontier-API — доли цента за запрос; собственный финтюнинг и суперагентный консилиум — тысячи долларов. Ниже — реальные вилки 2026 года по топовым провайдерам (GPT-5 / Claude / Gemini / DeepSeek / Qwen / Llama): входные токены ~$0.05–15 за млн, выходные ~$0.20–60 за млн; open-source self-hosted ≈ $0 (кроме железа).",
          "Вартість залежить не від «магії», а від вибору: локальна open-source модель — безкоштовно; frontier-API — частки цента за запит; власний фінтюнінг і суперагентний консиліум — тисячі доларів. Нижче — реальні вилки 2026 року за топовими провайдерами (GPT-5 / Claude / Gemini / DeepSeek / Qwen / Llama): вхідні токени ~$0.05–15 за млн, вихідні ~$0.20–60 за млн; open-source self-hosted ≈ $0 (крім заліза).",
          "Cost is a choice, not magic: a local open-source model is free; frontier APIs cost fractions of a cent per request; proprietary fine-tuning and a super-agent Consilium run to thousands of dollars. Below are real 2026 ranges across top providers (GPT-5 / Claude / Gemini / DeepSeek / Qwen / Llama): ~$0.05–15 per M input and ~$0.20–60 per M output tokens; self-hosted open-source ≈ $0 (hardware aside)."
      )}</p>
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="24%" align="left">{t("Уровень", "Рівень", "Tier")}</th>
            <th width="18%" align="center">{t("Затраты", "Витрати", "Cost")}</th>
            <th width="58%" align="left">{t("Что и зачем", "Що і навіщо", "What & why")}</th>
          </tr>
        </thead>
        <tbody>
{_render_cost_table()}
        </tbody>
      </table>'''
    )

# ---------------------------------------------------------------------------
# 10.2 Agency earning schemes (ARR cases)
# ---------------------------------------------------------------------------
_agency_rows = [
    # (stage_ru, stage_uk, stage_en, arr_ru, arr_uk, arr_en, how_ru, how_uk, how_en)
    ("Агентство-фриланс", "Агентство-фриланс", "Freelance agency",
     "$10–50 тыс/мес ($120–600k ARR)", "$10–50 тис/міс ($120–600k ARR)", "$10–50k/mo ($120–600k ARR)",
     "Локальные внедрения: бот-поддержка, приём заявок, контент-конвейер. 5–20 клиентов × $500–2,500/мес. Маржа 70–85% — продаётся интеллект, а не железо.",
     "Локальні впровадження: бот-підтримка, прийом заявок, контент-конвеєр. 5–20 клієнтів × $500–2,500/міс. Маржа 70–85% — продається інтелект, а не залізо.",
     "Local deployments: support bot, lead intake, content pipeline. 5–20 clients × $500–2,500/mo. 70–85% margin — you sell intellect, not hardware."),
    ("Продактизированное SaaS-агентство", "Продактизоване SaaS-агентство", "Productized SaaS agency",
     "$50–200 тыс/мес ($0.6–2.4M ARR)", "$50–200 тис/міс ($0.6–2.4M ARR)", "$50–200k/mo ($0.6–2.4M ARR)",
     "One продукт-агент (например, токенизированный AI-консьерж) продаётся сотням клиентов по подписке. Токенизированные агенты: платёж за «робота-сотрудника», а не за часы.",
     "Один продукт-агент (напр., токенізований ШІ-консьєрж) продається сотням клієнтів за підпискою. Токенізовані агенти: платіж за «робота-співробітника», а не за години.",
     "One product-agent (e.g., a tokenized AI concierge) sold to hundreds of clients on subscription. Tokenized agents: you charge for an \"AI employee,\" not billable hours."),
    ("Продуктовая AI-компания", "Продуктова AI-компанія", "Product AI company",
     "$1–10M ARR", "$1–10M ARR", "$1–10M ARR",
     "Enterprise SaaS поверх агентов (CRM-агент, юрид-агент, консилиум-аудит). Платит рынок B2B: контракты $10k–500k/год.",
     "Enterprise SaaS поверх агентів (CRM-агент, юрид-агент, консиліум-аудит). Платить ринок B2B: контракти $10k–500k/рік.",
     "Enterprise SaaS on top of agents (CRM-agent, legal agent, Consilium audits). B2B pays: contracts $10k–500k/yr."),
    ("Масштаб (Scale AI)", "Масштаб (Scale AI)", "Scale (AI unicorn)",
     "$100M+ ARR", "$100M+ ARR", "$100M+ ARR",
     "Платформа/рынок данных + агентов, лидер ниши. Примеры: от Cursor и Glean до глобальных data-labels. Здесь 1–2% рынка ИИ уже измеряются сотнями миллионов.",
     "Платформа/ринок даних + агентів, лідер ніші. Приклади: від Cursor та Glean до глобальних data-labels. Тут 1–2% ринку ШІ вже вимірюються сотнями мільйонів.",
     "A platform/agent & data marketplace owning a niche. Examples: Cursor, Glean, global data labels. Here 1–2% of the AI market is measured in hundreds of millions."),
]

def _render_agency_table():
    rows = []
    for s_ru, s_uk, s_en, a_ru, a_uk, a_en, h_ru, h_uk, h_en in _agency_rows:
        rows.append(f'''          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="left"><strong>{t(s_ru, s_uk, s_en)}</strong></td>
            <td class="kpi-lbl-cell"><strong class="kpi-val">{t(a_ru, a_uk, a_en)}</strong></td>
            <td class="kpi-sub-cell"><small>{t(h_ru, h_uk, h_en)}</small></td>
          </tr>''')
    return "\n".join(rows)

def _agency_sub():
    return sub_accordion(
        "sub-10-2", "💼",
        "10.2 Схемы максимального заработка на AI-агентствах: кейсы ARR",
        "10.2 Схеми максимального заробітку на AI-агентствах: кейси ARR",
        "10.2 Maximum earnings schemes for AI agencies: ARR cases",
        "ARR $120k → $100M+", "ARR $120k → $100M+", "ARR $120k → $100M+",
        f'''      <p class="lead-text">{t(
          "Ключевые модели: токенизированные агенты/подписки (платите за «робота-сотрудника»), перевод бизнес-процессов на роботов (замена рутинных операций вручную → автономно) и монетизация данных (датасеты, телеметрия, логи консилиумов). Margins >70% почти на любой из них.",
          "Ключові моделі: токенізовані агенти/підписки (платите за «робота-співробітника»), переведення бізнес-процесів на роботів (рутинні операції → автономно) та монетизація даних (датасети, телеметрія, логи консиліумів). Маржа >70% майже на будь-якій з них.",
          "Key models: tokenized agents/subscriptions (pay for an \"AI employee\"), moving business processes onto robots (routine ops → autonomous), and data monetization (datasets, telemetry, Consilium logs). Margins exceed 70% on nearly all of them."
      )}</p>
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="26%" align="left">{t("Эшелон", "Ешелон", "Stage")}</th>
            <th width="26%" align="center">{t("Доход (ARR)", "Дохід (ARR)", "Revenue (ARR)")}</th>
            <th width="48%" align="left">{t("Как устроено", "Як влаштовано", "How it works")}</th>
          </tr>
        </thead>
        <tbody>
{_render_agency_table()}
        </tbody>
      </table>'''
    )

# ---------------------------------------------------------------------------
# 10.3 Data centers & GPU clouds
# ---------------------------------------------------------------------------
_dc_rows = [
    # (segment, capex, margin, detail)
    ("Малый GPU-колокейшн / майнинг-обновление", "s50k", "50–70%",
     "s50k_detail"),
]
# rebuild with richer structure
_dc_rows = [
    # (seg_ru, seg_uk, seg_en, capex_ru, capex_uk, capex_en, margin, det_ru, det_uk, det_en)
    ("Малый GPU-cluster / edge-ферма", "Малий GPU-кластер / edge-ферма", "Small GPU cluster / edge farm",
     "$50 тыс", "$50 тис", "$50k", "50–65%",
     "1–8 GPU (RTX/A10/L40). Продажа AI-инференса, рендера и дешёвых токенов на свой нонсенс-трафик. Окупаемость 1–2 года.",
     "1–8 GPU (RTX/A10/L40). Продаж ШІ-інференсу, рендеру та дешевих токенів на власний трафік. Окупність 1–2 роки.",
     "1–8 GPUs (RTX/A10/L40). Selling AI inference, rendering, and cheap tokens on your own traffic. Payback 1–2 years."),
    ("Региональный дата-центр", "Регіональний дата-центр", "Regional data center",
     "$1–20 млн", "$1–20 млн", "$1–20M", "55–70%",
     "Узлы с H100/H200, балансировка инференса, контракты на GPU-as-a-Service. Маржа выше у того, кто даёт «токены по себестоимости+наценка».",
     "Вузли з H100/H200, балансування інференсу, контракти на GPU-as-a-Service. Маржа вища в того, хто дає «токени за собівартістю+націнка».",
     "Nodes with H100/H200, inference load-balancing, GPU-as-a-Service contracts. The provider offering \"tokens at cost+margin\" keeps the higher margin."),
    ("Гиперскейл-дата-центр", "Гіперскейл-дата-центр", "Hyperscale AI data center",
     "$100 млн+ / ЦОД", "$100 млн+ / ЦОД", "$100M+/DC", "60–75%",
     "Десятки тысяч GPU, собственные ЧИПы (TPU), охлаждение, энергетика. Игра для государств и мега-корпораций; рынок инференса измеряется триллионами $ к концу 2020-х.",
     "Десятки тисяч GPU, власні чіпи (TPU), охолодження, енергетика. Гра для держав і мега-корпорацій; ринок інференсу вимірюється трильйонами $ до кінця 2020-х.",
     "Tens of thousands of GPUs, custom silicon (TPU), cooling, power. A game for states and mega-corporations; the inference market runs into trillions of dollars by the late 2020s."),
]

def _render_dc_table():
    rows = []
    for sg_ru, sg_uk, sg_en, cx_ru, cx_uk, cx_en, mg, dt_ru, dt_uk, dt_en in _dc_rows:
        rows.append(f'''          <tr class="kpi-row kpi-purple">
            <td class="kpi-val-cell" align="left"><strong>{t(sg_ru, sg_uk, sg_en)}</strong></td>
            <td class="kpi-lbl-cell" align="center"><strong class="kpi-val">{t(cx_ru, cx_uk, cx_en)}</strong></td>
            <td class="kpi-sub-cell" align="center"><small>{mg}</small></td>
            <td class="kpi-sub-cell"><small>{t(dt_ru, dt_uk, dt_en)}</small></td>
          </tr>''')
    return "\n".join(rows)

def _dc_sub():
    return sub_accordion(
        "sub-10-3", "🖥️",
        "10.3 Дата-центры и GPU-облака: капитал, маржинальность, заработок",
        "10.3 Дата-центри та GPU-хмари: капітал, маржинальність, заробіток",
        "10.3 Data centers & GPU clouds: capex, margins, earnings",
        "$50k → $100M+", "$50k → $100M+", "$50k → $100M+",
        f'''      <p class="lead-text">{t(
          "Заработок на GPU-облаках идёт из трёх потоков: (1) продажа инференса/токенов, (2) аренда вычислительных единиц под финтюнинг, (3) рендер и специализированные нагрузки. Капитальные затраты масштабируются от $50k (домашняя edge-ферма) до $100M+ на гиперскейл-ЦОД. Валовая маржа GPU-провайдеров — 50–75%, но требует больших CAPEX и управления загрузкой.",
          "Заробіток на GPU-хмарах іде з трьох потоків: (1) продаж інференсу/токенів, (2) оренда обчислювальних одиниць під фінтюнінг, (3) рендер і спеціалізовані навантаження. Капітальні витрати масштабуються від $50k (домашня edge-ферма) до $100M+ на гіперскейл-ЦОД. Валова маржа GPU-провайдерів — 50–75%, але потребує великих CAPEX та управління завантаженням.",
          "GPU-cloud earnings come from three streams: (1) selling inference/tokens, (2) renting compute for fine-tuning, (3) rendering and specialized workloads. Capex scales from $50k (home edge farm) to $100M+ per hyperscale DC. GPU-provider gross margins run 50–75%, yet require heavy CAPEX and load management."
      )}</p>
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="24%" align="left">{t("Сегмент", "Сегмент", "Segment")}</th>
            <th width="16%" align="center">{t("CAPEX", "CAPEX", "CAPEX")}</th>
            <th width="14%" align="center">{t("Валовая маржа", "Валова маржа", "Gross margin")}</th>
            <th width="46%" align="left">{t("Источники дохода", "Джерела доходу", "Revenue sources")}</th>
          </tr>
        </thead>
        <tbody>
{_render_dc_table()}
        </tbody>
      </table>'''
    )

# ---------------------------------------------------------------------------
# 10.4 All revenue schemes + real growth examples
# ---------------------------------------------------------------------------
_rev_schemes = [
    ("Подписка (SaaS)", "Підписка (SaaS)", "Subscription (SaaS)",
     "$10–999/мес", "$10–999/міс", "$10–999/mo",
     "Стабильный MRR; рост на конверсии free→paid.", "Стабільний MRR; зростання на конверсії free→paid.", "Stable MRR; growth via free→paid conversion."),
    ("Микро-SaaS / одно-агентные инструменты", "Мікро-SaaS / одно-агентні інструменти", "Micro-SaaS / single-agent tools",
     "$5–49 разово или $10–99/мес", "$5–49 разово або $10–99/міс", "$5–49 one-off or $10–99/mo",
     "Калькуляторы, ROI-стенды, планировщики; быстрый запуск.", "Калькулятори, ROI-стенди, планувальники; швидкий запуск.", "Calculators, ROI stands, planners; fast to ship."),
    ("AI-консьерж / цифровой офис", "ШІ-консьєрж / цифровий офіс", "AI concierge / digital office",
     "$99–1,500/мес", "$99–1,500/міс", "$99–1,500/mo",
     "Агент-сотрудник: поддержка, заказы, документы 24/7.", "Агент-співробітник: підтримка, замовлення, документи 24/7.", "Agent-employee: support, orders, documents 24/7."),
    ("White-label агенты", "White-label агенти", "White-label agents",
     "$500–5,000 лицензия + роялти 10–20%", "$500–5,000 ліцензія + роялті 10–20%", "$500–5,000 license + 10–20% royalty",
     "Франшиза «фабрики агентов» по регионам.", "Франшиза «фабрики агентів» по регіонах.", "Regional \"agent factory\" franchise."),
    ("Marketplace агентов", "Marketplace агентів", "Agent marketplace",
     "Комиссия 10–30%", "Комісія 10–30%", "10–30% take rate",
     "Площадка, где агенты продаются/сдаются в аренду друг другу.", "Площадка, де агенти продаються/здаються в оренду один одному.", "A marketplace where agents are sold/rented to each other."),
    ("Данные / датасеты", "Дані / датасети", "Data / datasets",
     "$200–5,000 / датасет", "$200–5,000 / датасет", "$200–5,000 / dataset",
     "Telemetry, логи консилиумов, размеченные данные для ML.", "Telemetry, логи консиліумів, розмічені дані для ML.", "Telemetry, Consilium logs, labeled data for ML."),
    ("Инфраструктура (API/GPU)", "Інфраструктура (API/GPU)", "Infrastructure (API/GPU)",
     "$20–200/мес слот и выше", "$20–200/міс слот і вище", "$20–200/mo slot and up",
     "перепродажа токенов, аренда edge/GPU.", "перепродаж токенів, оренда edge/GPU.", "token resale, edge/GPU rental."),
]

def _render_rev_table():
    rows = []
    for s_ru, s_uk, s_en, p_ru, p_uk, p_en, d_ru, d_uk, d_en in _rev_schemes:
        rows.append(f'''          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="left"><strong>{t(s_ru, s_uk, s_en)}</strong></td>
            <td class="kpi-lbl-cell" align="center"><strong class="kpi-val">{t(p_ru, p_uk, p_en)}</strong></td>
            <td class="kpi-sub-cell"><small>{t(d_ru, d_uk, d_en)}</small></td>
          </tr>''')
    return "\n".join(rows)

def _growth_rows():
    # (company_ru, company_en, tid_ru, tid_en, tid_uk, story_ru, story_uk, story_en)
    rows = [
        ("Cursor (Anysphere)", "Cursor (Anysphere)",
         "код-агенты", "code agents", "код-агенти",
         "Достигли восьмизначного ARR в $млн за месяцы после запуска — один продукт-агент, рекуррентная подписка $20–60/мес.",
         "Досягли восьмизначного ARR у $млн за місяці після запуску — один продукт-агент, рекурентна підписка $20–60/міс.",
         "Reached eight-figure ARR within months of launch — one product-agent, $20–60/mo recurring subscription."),
        ("Midjourney / Perplexity", "Midjourney / Perplexity",
         "генерация / поиск", "generation / search", "генерація / пошук",
         "Небольшие команды, высокая маржа: продукт, который миллионы людей платят $10–200/мес.",
         "Невеликі команди, висока маржа: продукт, який мільйони людей платять $10–200/міс.",
         "Small teams, fat margins: a product millions pay $10–200/mo for."),
        ("Glean / Enterprise RAG", "Glean / Enterprise RAG",
         "корпоративный поиск", "enterprise search", "корпоративний пошук",
         "Enterprise-агенты с контрактами $100k+/год — подтверждают спрос на «агента, который знает ваши документы».",
         "Enterprise-агенти з контрактами $100k+/рік — підтверджують попит на «агента, який знає ваші документи».",
         "Enterprise agents with $100k+/yr contracts — proof of demand for \"the agent that knows your docs.\""),
        ("OpenAI / Anthropic", "OpenAI / Anthropic",
         "фундаментальные модели", "frontier labs", "фундаментальні моделі",
         "Траектория: от API-платформы к агентам и агентным операционным системам; рынок смещается от токенов к автономным рабочим процессам.",
         "Траєкторія: від API-платформи до агентів і агентних операційних систем; ринок зміщується від токенів до автономних робочих процесів.",
         "Trajectory: from API platform to agents and agentic OSes; the market shifts from tokens to autonomous workflows."),
    ]
    out = []
    for c_ru, c_en, tid_ru, tid_en, tid_uk, st_ru, st_uk, st_en in rows:
        out.append(f'''          <li><strong>{t(c_ru, c_en, c_ru)}</strong> — <span style="color:var(--accent,#4de1ff);">{t(tid_ru, tid_uk, tid_en)}</span>: {t(st_ru, st_uk, st_en)}</li>''')
    return "\n".join(out)

def _schemes_sub():
    return sub_accordion(
        "sub-10-4", "💰",
        "10.4 Все схемы доходов и реальные примеры роста компаний",
        "10.4 Всі схеми доходів та реальні приклади зростання компаній",
        "10.4 All revenue schemes & real company growth examples",
        "7 моделей + кейсы", "7 моделей + кейси", "7 models + cases",
        f'''      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="28%" align="left">{t("Схема", "Схема", "Scheme")}</th>
            <th width="26%" align="center">{t("Ценник", "Ціна", "Pricing")}</th>
            <th width="46%" align="left">{t("Особенность", "Особливість", "Notes")}</th>
          </tr>
        </thead>
        <tbody>
{_render_rev_table()}
        </tbody>
      </table>
      <p class="lead-text" style="margin-top:16px;">{t(
        "Реальные примеры роста (2024–2026):",
        "Реальні приклади зростання (2024–2026):",
        "Real growth examples (2024–2026):"
      )}</p>
      <ul style="margin:8px 0 0 0;">
{_growth_rows()}
      </ul>'''
    )

# ---------------------------------------------------------------------------
# 10.5 Path to $1T for EvaBot / Evaline / Consilium
# ---------------------------------------------------------------------------
_trillion_stages = [
    ("Этап 1 · Бесплатные инструменты", "Етап 1 · Безкоштовні інструменти", "Stage 1 · Free tools",
     "0", "$0",
     "ROI-калькулятор, глоссарий, демо-консилиум, открытый манифест → трафик, доверие, органический рост ЛП.",
     "ROI-калькулятор, глосарій, демо-консиліум, відкритий маніфест → трафік, довіра, органічне зростання ЛП.",
     "ROI calculator, glossary, Consilium demo, open manifesto → traffic, trust, organic lead growth."),
    ("Этап 2 · Платформа (токенизированные агенты)", "Етап 2 · Платформа (токенізовані агенти)", "Stage 2 · Platform (tokenized agents)",
     "10–100 тыс", "10–100k",
     "Подписки $10–100/мес за «агента-сотрудника»; микро-SaaS и AI-консьержи.",
     "Підписки $10–100/міс за «агента-співробітника»; мікро-SaaS та ШІ-консьєржі.",
     "Subscriptions $10–100/mo per \"agent-employee\"; micro-SaaS and AI concierges."),
    ("Этап 3 · Enterprise Consilium & токенизированные услуги", "Етап 3 · Enterprise Consilium та токенізовані послуги", "Stage 3 · Enterprise Consilium & tokenized services",
     "100 тыс–10 млн", "100k–10M",
     "Консилиум-аудиты $150–1,500, enterprise-SLA $10k–500k/год, white-label франшиза.",
     "Консиліум-аудити $150–1,500, enterprise-SLA $10k–500k/рік, white-label франшиза.",
     "Consilium audits $150–1,500, enterprise SLA $10k–500k/yr, white-label franchise."),
    ("Этап 4 · Data / агентные рынки", "Етап 4 · Data / агентні ринки", "Stage 4 · Data / agent marketplaces",
     "10 млн–1 млрд", "10M–1B",
     "Marketplace, где агенты торгуют услугами; комиссия 10–30%; датасеты и телеметрия.",
     "Marketplace, де агенти торгують послугами; комісія 10–30%; датасети та телеметрія.",
     "A marketplace where agents trade services; 10–30% take; datasets and telemetry."),
    ("Этап 5 · Сеть дата-центров / GPU-инфраструктура", "Етап 5 · Мережа дата-центрів / GPU-інфраструктура", "Stage 5 · Data-center network / GPU infrastructure",
     "1 млрд–1 трлн", "1B–1T",
     "Собственная генерация инференса, edge-кластеры, GPU-as-a-Service поверх 94-модельного шлюза.",
     "Власна генерація інференсу, edge-кластери, GPU-as-a-Service поверх 94-модельного шлюзу.",
     "Own inference generation, edge clusters, GPU-as-a-Service above the 94-model gateway."),
]

def _render_trillion_table():
    rows = []
    for s_ru, s_uk, s_en, v_ru, v_en, d_ru, d_uk, d_en in _trillion_stages:
        rows.append(f'''          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="left"><strong>{t(s_ru, s_uk, s_en)}</strong></td>
            <td class="kpi-lbl-cell" align="center"><strong class="kpi-val">{t(v_ru, v_en, v_ru)}</strong></td>
            <td class="kpi-sub-cell"><small>{t(d_ru, d_uk, d_en)}</small></td>
          </tr>''')
    return "\n".join(rows)

def _trillion_sub():
    return sub_accordion(
        "sub-10-5", "🚀",
        "10.5 Путь системы EvaBot / Evaline / Consilium к $1 триллиону",
        "10.5 Шлях системи EvaBot / Evaline / Consilium до $1 трильйона",
        "10.5 The EvaBot / Evaline / Consilium path to $1 trillion",
        "поэтапная модель снизу-вверх", "поетапна модель знизу-вгору", "bottom-up staged model",
        f'''      <p class="lead-text">{t(
          "Логика проста: не «вырасти на одном продукте», а выстроить многослойную воронку ценности снизу-вверх — от бесплатных инструментов (привлечение) к платформе и токенизированным услугам (MRR), затем к data/агентным рынкам (комиссии) и собственной GPU-инфраструктуре (инференс/аренда).",
          "Логіка проста: не «вирости на одному продукті», а вибудувати багатошарову воронку цінності знизу-вгору — від безкоштовних інструментів (залучення) до платформи та токенізованих послуг (MRR), далі до data/агентних ринків (комісії) і власної GPU-інфраструктури (інференс/оренда).",
          "The logic is simple: instead of growing on a single product, build a layered bottom-up value funnel — from free tools (acquisition) to platform and tokenized services (MRR), then to data/agent marketplaces (take rates) and finally own GPU infrastructure (inference/rental)."
      )}</p>
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="44%" align="left">{t("Этап", "Етап", "Stage")}</th>
            <th width="18%" align="center">{t("Порядок величины", "Порядок величини", "Magnitude")}</th>
            <th width="38%" align="left">{t("Механика", "Механіка", "Mechanism")}</th>
          </tr>
        </thead>
        <tbody>
{_render_trillion_table()}
        </tbody>
      </table>

      <p class="lead-text" style="margin-top:16px;">{t(
        "Порядок величины (what it takes):",
        "Порядок величини (what it takes):",
        "Order of magnitude (what it takes):"
      )}</p>
      <ul style="margin:8px 0 0 0;">
        <li>{t(
          "1 млн подписчиков × $50/мес среднего чека = $600 млн/год ARR (этап 2).",
          "1 млн підписників × $50/міс середнього чека = $600 млн/рік ARR (етап 2).",
          "1M subscribers × $50/mo average check = $600M/yr ARR (stage 2)."
        )}</li>
        <li>{t(
          "+ Enterprise & Consilium: 1 000 корп. контрактов × $100k/год = $100M ARR; + агентные комиссии на обороте рынка ×10–30%.",
          "+ Enterprise & Consilium: 1 000 корп. контрактів × $100k/рік = $100M ARR; + агентні комісії з обороту ринку ×10–30%.",
          "+ Enterprise & Consilium: 1,000 corporate contracts × $100k/yr = $100M ARR; + agent market commissions at 10–30%."
        )}</li>
        <li>{t(
          "+ Инфраструктура: доля в рынке инференса, который к концу 2020-х оценивается квадриллионными величинами (AI markets are estimated in the hundreds of trillions of dollars) — даже 0.1–1% такого TAM измеряется сотнями миллиардов.",
          "+ Інфраструктура: частка в ринку інференсу, який до кінця 2020-х оцінюється квадрильйонними величинами (AI markets estimated in the hundreds of trillions of dollars) — навіть 0.1–1% такого TAM вимірюється сотнями мільярдів.",
          "+ Infrastructure: a share of the inference market, valued in the hundreds of trillions of dollars by the late 2020s — even 0.1–1% of such a TAM is hundreds of billions."
        )}</li>
        <li>{t(
          "Итоговая диагностика: капитализация в $1T достижима при комбинации 5–10 млн платящих + 5–20 тыс enterprise + лидирующая доля в агентном рынке + собственная вычислительная инфраструктура. Это марафон на годы, но вектор верный: ценность смещается от «токенов» к «автономным рабочим процессам».",
          "Підсумкова діагностика: капіталізація в $1T досяжна при комбінації 5–10 млн платників + 5–20 тис enterprise + лідируюча частка в агентному ринку + власна обчислювальна інфраструктура. Це марафон на роки, але вектор вірний: цінність зміщується від «токенів» до «автономних робочих процесів».",
          "Bottom line: $1T valuation is reachable with 5–10M paying users + 5–20K enterprise accounts + a leading share of the agent market + owned compute. It is a multi-year marathon, but the vector is right: value shifts from \"tokens\" to \"autonomous workflows\"."
        )}</li>
      </ul>'''
    )

# ---------------------------------------------------------------------------
# Section assembly
# ---------------------------------------------------------------------------
def get_section_10():
    content = f'''      {_cost_sub()}
      {_agency_sub()}
      {_dc_sub()}
      {_schemes_sub()}
      {_trillion_sub()}'''
    return accordion_section(
        "trillion-path", "10",
        "Окупаемость и путь к Триллиону: экономика AI-агентов, агентств, GPU и план до $1T",
        "Окупність і шлях до Трильйона: економіка ШІ-агентів, агенцій, GPU та план до $1T",
        "Payback & the $1 Trillion Path: agent economics, agency ARR, GPU clouds, and the $1T roadmap",
        "5 разделов", "5 розділів", "5 subsections",
        content, open=False
    )
