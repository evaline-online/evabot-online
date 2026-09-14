# -*- coding: utf-8 -*-
# SECTION 11: TOP PROFESSIONS & LLM AGENTS
# High-paying jobs, most valuable jobs, and Consilium-based LLM agents (replace vs augment).

from helpers import t, accordion_section, sub_accordion

# ---------------------------------------------------------------------------
# 11.1 Top high-paying professions 2026 (salary ranges)
# ---------------------------------------------------------------------------
_paid_rows = [
    # (prof_ru, prof_uk, prof_en, sal_ru, sal_uk, sal_en)
    ("Разработчик AI/ML (AGI-инженер)", "Розробник ШІ/ML (AGI-інженер)", "AI/ML Engineer (AGI)", "$150–400k/год", "$150–400k/рік", "$150–400k/yr"),
    ("Data Scientist / ML Research", "Data Scientist / ML Research", "Data Scientist / ML Research", "$120–300k/год", "$120–300k/рік", "$120–300k/yr"),
    ("Инженер робототехники", "Інженер робототехніки", "Robotics Engineer", "$110–260k/год", "$110–260k/рік", "$110–260k/yr"),
    ("Инженер-нефтегаз (даунстрим)", "Інженер-нафтогаз (даунстрим)", "Oil & Gas Engineer (downstream)", "$90–220k/год", "$90–220k/рік", "$90–220k/yr"),
    ("Хирург / анестезиолог", "Хірург / анестезіолог", "Surgeon / Anesthesiologist", "$120–300k/год", "$120–300k/рік", "$120–300k/yr"),
    ("Пилот-капитан / авиация", "Пілот-капітан / авіація", "Airline Captain / Aviation", "$100–250k/год", "$100–250k/рік", "$100–250k/yr"),
    ("Финансист / инвестиционный банкир", "Фінансист / інвестиційний банкір", "Finance / Investment Banker", "$130–350k/год", "$130–350k/рік", "$130–350k/yr"),
    ("Квант-аналитик (Quant)", "Квант-аналітик (Quant)", "Quantitative Analyst (Quant)", "$150–500k/год", "$150–500k/рік", "$150–500k/yr"),
    ("Юрист (корпоративный/патентный)", "Юрист (корпоративний/патентний)", "Corporate / Patent Lawyer", "$120–350k/год", "$120–350k/рік", "$120–350k/yr"),
    ("C-level (CTO/CIO/CDO)", "C-level (CTO/CIO/CDO)", "C-level (CTO/CIO/CDO)", "$250k–2M+/год", "$250k–2M+/рік", "$250k–2M+/yr"),
    ("Director of AI / ИИ-архитектор предприятия", "Director of AI / ШІ-архітектор підприємства", "Director of AI / Enterprise Architect", "$180–400k/год", "$180–400k/рік", "$180–400k/yr"),
    ("Инженер по ИИ-безопасности (CISO, AI red-team)", "Інженер з ШІ-безпеки (CISO, AI red-team)", "AI Security / Red-team Engineer", "$140–320k/год", "$140–320k/рік", "$140–320k/yr"),
    ("Cloud/Infrastructure (Kubernetes/MLOps)", "Cloud/Infrastructure (Kubernetes/MLOps)", "Cloud / MLOps Engineer", "$110–250k/год", "$110–250k/рік", "$110–250k/yr"),
    ("Специалист по данным IoT/энергетике", "Спеціаліст з даних IoT/енергетиці", "IoT / Energy Data Specialist", "$90–200k/год", "$90–200k/рік", "$90–200k/yr"),
    ("Консультант по автоматизации производства", "Консультант з автоматизації виробництва", "Industrial Automation Consultant", "$80–180k/год", "$80–180k/рік", "$80–180k/yr"),
]

def _render_paid_table():
    rows = []
    for p_ru, p_uk, p_en, s_ru, s_uk, s_en in _paid_rows:
        rows.append(f'''          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="left"><strong>{t(p_ru, p_uk, p_en)}</strong></td>
            <td class="kpi-lbl-cell" align="right"><strong class="kpi-val">{t(s_ru, s_uk, s_en)}</strong></td>
          </tr>''')
    return "\n".join(rows)

def _paid_sub():
    return sub_accordion(
        "sub-11-1", "💲",
        "11.1 Топ высокооплачиваемых профессий (2026): вилки зарплат",
        "11.1 Топ високооплачуваних професій (2026): вилки зарплат",
        "11.1 Top high-paying professions (2026): salary ranges",
        "14 позиций", "14 позицій", "14 roles",
        f'''      <p class="lead-text">{t(
          "Вилки — реальные, для опытных специалистов рынка США/ЕС (C-level и Quant — выше из-за бонусов). В 2026 лидируют AI/ML, квант-финансы и инженерные роли с уклоном в данные и автоматизацию.",
          "Вилки — реальні, для досвідчених фахівців ринку США/ЄС (C-level та Quant — вище через бонуси). У 2026 лідирують ШІ/ML, квант-фінанси та інженерні ролі з ухилом у дані та автоматизацію.",
          "Ranges are real, for senior US/EU-market specialists (C-level and Quant are higher due to bonuses). In 2026 the leaders are AI/ML, quant finance, and engineering roles skewed toward data and automation."
      )}</p>
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <tbody>
{_render_paid_table()}
        </tbody>
      </table>'''
    )

# ---------------------------------------------------------------------------
# 11.2 Most valuable professions (regardless of salary)
# ---------------------------------------------------------------------------
_value_rows = [
    ("Врач / медсестра / скорая", "Лікар / медсестра / швидка", "Doctor / Nurse / Paramedic",
     "Спасают жизни, диагностируют, лечат — фундамент общества.", "Рятують життя, діагностують, лікують — фундамент суспільства.", "Save lives, diagnose, treat — the bedrock of society."),
    ("Учитель / преподаватель", "Вчитель / викладач", "Teacher / Educator",
     "Формируют человеческий и интеллектуальный капитал будущего.", "Формують людський та інтелектуальний капітал майбутнього.", "Build the human and intellectual capital of the future."),
    ("Инженер-эколог / климатолог", "Інженер-еколог / кліматолог", "Environmental Engineer / Climatologist",
     "Планета без ресурсов — нечем управлять; экология = выживание.", "Планета без ресурсів — нема чим керувати; екологія = виживання.", "A planet without resources can't be run; ecology = survival."),
    ("Пожарный / спасатель / МЧС", "Пожежний / рятувальник / ДСНС", "Firefighter / Rescuer / Emergency",
     "Готовы рисковать жизнью, когда все бегут — стоять.", "Готові ризикувати життям, коли всі біжать — стояти.", "Ready to risk their lives while everyone else runs."),
    ("Аграрий / фермер / агроном", "Аграрій / фермер / агроном", "Farmer / Agronomist",
     "Без еды нет ни экономики, ни ИИ; продовольственная безопасность.", "Без їжі немає ні економіки, ні ШІ; продовольча безпека.", "No food, no economy, no AI; food security is foundational."),
    ("Логист / водитель / оператор цепи поставок", "Логіст / водій / оператор ланцюга поставок", "Logistician / Driver / Supply-chain Operator",
     "Двигают товары и людей — артерии экономики.", "Рухають товари та людей — артерії економіки.", "Move goods and people — the arteries of the economy."),
    ("Специалист по кибербезопасности", "Фахівець з кібербезпеки", "Cybersecurity Specialist",
     "В цифровом мире — защитники границ государства и бизнеса.", "У цифровому світі — захисники кордонів держави та бізнесу.", "In a digital world, they defend the borders of state and business."),
    ("Сантехник / электрик / строитель", "Сантехнік / електрик / будівельник", "Plumber / Electrician / Builder",
     "Жильё, вода, свет — то, без чего рушатся города.", "Житло, вода, світло — те, без чого руйнуються міста.", "Housing, water, power — without them cities collapse."),
    ("Учёный / исследователь", "Вчений / дослідник", "Scientist / Researcher",
     "Раздвигают границы знаний, дают почву для всех технологий.", "Розширюють межі знань, дають ґрунт для всіх технологій.", "Expand the boundaries of knowledge, ground for all tech."),
    ("Психолог / психиатр / соцработа", "Психолог / психіатр / соцробота", "Psychologist / Psychiatrist / Social worker",
     "Ментальное здоровье — самое недооценённое богатство.", "Ментальне здоров'я — найбільш недооцінене багатство.", "Mental health is the most undervalued wealth."),
    ("Энергетик / электросети", "Енергетик / електромережі", "Power engineer / Grid operator",
     "Электроэнергия — база дата-центров и всех систем.", "Електроенергія — база дата-центрів та всіх систем.", "Electricity underpins data centers and every system."),
    ("Работник водоканала / водоочистка", "Працівник водоканалу / водоочищення", "Water utility / sanitation",
     "Чистая вода предотвращает больше смертей, чем любая медицина.", "Чиста вода запобігає більше смертей, ніж будь-яка медицина.", "Clean water prevents more deaths than any medicine."),
]

def _render_value_table():
    rows = []
    for p_ru, p_uk, p_en, d_ru, d_uk, d_en in _value_rows:
        rows.append(f'''          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="left"><strong>{t(p_ru, p_uk, p_en)}</strong></td>
            <td class="kpi-sub-cell"><small>{t(d_ru, d_uk, d_en)}</small></td>
          </tr>''')
    return "\n".join(rows)

def _value_sub():
    return sub_accordion(
        "sub-11-2", "❤️",
        "11.2 Самые важные и полезные профессии (независимо от зарплаты)",
        "11.2 Найважливіші та найкорисніші професії (незалежно від зарплати)",
        "11.2 Most valuable & useful professions (regardless of salary)",
        "12 позиций", "12 позицій", "12 roles",
        f'''      <p class="lead-text">{t(
          "Здесь ценность измеряется не $, а влиянием на выживание и развитие людей. Эти профессии ИИ не «заменяет», а в первую очередь должен усиливать.",
          "Тут цінність вимірюється не $, а впливом на виживання та розвиток людей. Ці професії ШІ не «замінює», а насамперед має посилювати.",
          "Here value is measured not in $ but in impact on human survival and development. AI should not \"replace\" these professions so much as amplify them."
      )}</p>
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <tbody>
{_render_value_table()}
        </tbody>
      </table>'''
    )

# ---------------------------------------------------------------------------
# 11.3 Top LLM agents (Consilium-based) — replace vs augment
# ---------------------------------------------------------------------------
_agent_rows = [
    ("Агент-аналитик (BI/данные)", "Агент-аналітик (BI/дані)", "Analyst agent (BI/data)",
     "Дополняет", "Доповнює", "Augments",
     "Отчёты, дашборды, ad-hoc запросы — автономно; интерпретация остаётся за человеком.", "Звіти, дашборди, ad-hoc запити — автономно; інтерпретація залишається за людиною.", "Reports, dashboards, ad-hoc queries autonomously; interpretation stays human."),
    ("Агент-код-ревьюер", "Агент-код-рев'юер", "Code-review agent",
     "Дополняет", "Доповнює", "Augments",
     "Ищет баги, уязвимости, стиль; финальное решение и ответственность — у человека.", "Шукає баги, вразливості, стиль; фінальне рішення та відповідальність — у людини.", "Finds bugs, vulnerabilities, style; the final call and accountability stay human."),
    ("Агент-TA / HR-скринер", "Агент-TA / HR-скринер", "TA / HR-screener agent",
     "Заменяет в рутине", "Замінює в рутині", "Replaces in routine",
     "Скрининг резюме, ассессмент, первичные интервью; решение по кандидату — человек.", "Скринінг резюме, ассесмент, первинні інтерв'ю; рішення щодо кандидата — людина.", "Resume screening, assessment, first interviews; hiring calls stay human."),
    ("Агент-маркетолог", "Агент-маркетолог", "Marketing agent",
     "Заменяет в рутине", "Замінює в рутині", "Replaces in routine",
     "Контент, сегментация, A/B, отчётность; стратегия и тон бренда — человек.", "Контент, сегментація, A/B, звітність; стратегія та тон бренду — людина.", "Content, segmentation, A/B, reporting; strategy and brand tone stay human."),
    ("Агент-юрист", "Агент-юрист", "Legal agent",
     "Дополняет", "Доповнює", "Augments",
     "Договоры, проверка норм, ответы на исковые риски; подпись и ответственность — юрист.", "Договори, перевірка норм, відповіді на позовні ризики; підпис та відповідальність — юрист.", "Contracts, compliance checks, litigation risk; signature and liability stay with the lawyer."),
    ("Агент-бухгалтер", "Агент-бухгалтер", "Accountant agent",
     "Дополняет", "Доповнює", "Augments",
     "Первичка, начисления, сверка; налоговая ответственность — человек.", "Первинка, нарахування, звірка; податкова відповідальність — людина.", "Bookkeeping, accruals, reconciliation; tax liability stays human."),
    ("Агент-мед-консультант", "Агент-мед-консультант", "Medical triage agent",
     "Дополняет", "Доповнює", "Augments",
     "Триаж, напоминания, обзоры литературы; диагноз и назначения — только врач.", "Тріаж, нагадування, огляди літератури; діагноз і призначення — лише лікар.", "Triage, reminders, literature review; diagnosis and prescriptions are doctor-only."),
    ("Агент-тьютор", "Агент-тьютор", "Tutor agent",
     "Заменяет в рутине", "Замінює в рутині", "Replaces in routine",
     "Объяснение, практика, адаптация темпа; наставничество и мотивация — человек.", "Пояснення, практика, адаптація темпу; наставництво та мотивація — людина.", "Explanation, practice, adaptive pace; mentorship and motivation stay human."),
    ("Агент-поддержка", "Агент-підтримка", "Support agent",
     "Заменяет в рутине", "Замінює в рутині", "Replaces in routine",
     "Tier-1 вопросы, эскалация, база знаний; сложные эмоциональные кейсы — человек.", "Tier-1 питання, ескалація, база знань; складні емоційні кейси — людина.", "Tier-1 questions, escalation, knowledge base; complex emotional cases stay human."),
    ("Агент-продавец (SDR)", "Агент-продавець (SDR)", "Sales / SDR agent",
     "Дополняет", "Доповнює", "Augments",
     "Лиды, квалификация, первые касания; закрытие и отношения — человек.", "Ліди, кваліфікація, перші дотики; закриття та стосунки — людина.", "Leads, qualification, first touches; closing and relationships stay human."),
    ("Агент-исследователь", "Агент-дослідник", "Research agent",
     "Дополняет", "Доповнює", "Augments",
     "Глубокий поиск, синтез, обзоры; научная валидация — человек.", "Глибокий пошук, синтез, огляди; наукова валідація — людина.", "Deep search, synthesis, reviews; scientific validation stays human."),
    ("«Профессор» для ИИ-консилиума", "«Професор» для ШІ-консиліуму", "\"Professor\" for the AI Consilium",
     "Дополняет (внутри системы)", "Доповнює (всередині системи)", "Augments (in-system)",
     "Экспертная роль в дебате EvaLine Consilium: верификация логики и контраргументы против галлюцинаций.", "Експертна роль у дебаті EvaLine Consilium: верифікація логіки та контраргументи проти галюцинацій.", "Expert role in the EvaLine Consilium debate: logic verification and counter-arguments against hallucinations."),
    ("Агент-контроль качества (QA)", "Агент-контроль якості (QA)", "QA / QC agent",
     "Дополняет", "Доповнює", "Augments",
     "Тесты, регрессии, аудит контента; приёмка — человек.", "Тести, регресії, аудит контенту; приймання — людина.", "Tests, regressions, content audit; acceptance stays human."),
    ("Агент-логистика/склад", "Агент-логістика/склад", "Logistics / warehouse agent",
     "Заменяет в рутине", "Замінює в рутині", "Replaces in routine",
     "Маршруты, инвентаризация, заказы; стратегия сети и форс-мажор — человек.", "Маршрути, інвентаризація, замовлення; стратегія мережі та форс-мажор — людина.", "Routing, inventory, ordering; network strategy and force-majeure stay human."),
]

def _render_agent_table():
    rows = []
    for a_ru, a_uk, a_en, m_ru, m_uk, m_en, d_ru, d_uk, d_en in _agent_rows:
        is_replace = m_ru.startswith("Заменяет")
        cls = "kpi-red" if is_replace else "kpi-cyan"
        rows.append(f'''          <tr class="kpi-row {cls}">
            <td class="kpi-val-cell" align="left"><strong>{t(a_ru, a_uk, a_en)}</strong></td>
            <td class="kpi-lbl-cell" align="center"><small><strong>{t(m_ru, m_uk, m_en)}</strong></small></td>
            <td class="kpi-sub-cell"><small>{t(d_ru, d_uk, d_en)}</small></td>
          </tr>''')
    return "\n".join(rows)

def _agent_sub():
    return sub_accordion(
        "sub-11-3", "🤖",
        "11.3 Топ LLM-агентов (на базе системы Consilium): где заменяют, где дополняют",
        "11.3 Топ LLM-агентів (на базі системи Consilium): де замінюють, де доповнюють",
        "11.3 Top LLM agents (Consilium-based): where they replace vs augment",
        "14 агентов", "14 агентів", "14 agents",
        f'''      <p class="lead-text">{t(
          "Один и тот же агент может «заменять» рутинную часть работы и «дополнять» человека на уровне решений и ответственности. Красным помечено, где агент берёт на себя рутинный поток целиком, голубым — где человек остаётся в контуре.",
          "Той самий агент може «замінювати» рутинну частину роботи та «доповнювати» людину на рівні рішень і відповідальності. Червоним позначено, де агент бере на себе рутинний потік повністю, синім — де людина залишається в контурі.",
          "The same agent can \"replace\" the routine part of a job and \"augment\" the human at the level of decisions and accountability. Red marks where the agent owns the routine flow outright; blue marks where a human stays in the loop."
      )}</p>
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="34%" align="left">{t("Агент", "Агент", "Agent")}</th>
            <th width="20%" align="center">{t("Роль ИИ", "Роль ШІ", "AI role")}</th>
            <th width="46%" align="left">{t("Что делает / где граница", "Що робить / де межа", "What it does / boundary")}</th>
          </tr>
        </thead>
        <tbody>
{_render_agent_table()}
        </tbody>
      </table>'''
    )

# ---------------------------------------------------------------------------
# Section assembly
# ---------------------------------------------------------------------------
def get_section_11():
    content = f'''      {_paid_sub()}
      {_value_sub()}
      {_agent_sub()}'''
    return accordion_section(
        "top-professions", "11",
        "Топ профессий и агентов: высокооплачиваемые, самые ценные роли и LLM-агенты Consilium",
        "Топ професій та агентів: високооплачувані, найцінніші ролі та LLM-агенти Consilium",
        "Top Professions & Agents: highest-paid, most valuable roles, and Consilium LLM agents",
        "3 вложенных раздела", "3 вкладені розділи", "3 nested sections",
        content, open=False
    )
