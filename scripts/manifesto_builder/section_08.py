# -*- coding: utf-8 -*-
from helpers import t, accordion_section, sub_accordion
import infographics_builder

def make_role_card(num, icon, title_ru, title_uk, title_en, sephira_ru, sephira_uk, sephira_en, desc_ru, desc_uk, desc_en, stack):
    node_lbl = t(f"Узел {num}", f"Вузол {num}", f"Node {num}")
    seph_lbl = t(sephira_ru, sephira_uk, sephira_en)
    title_html = t(title_ru, title_uk, title_en)
    desc_html = t(desc_ru, desc_uk, desc_en)
    stack_lbl = t("Стек:", "Стек:", "Stack:")
    return f'''          <div class="sephira-card">
            <div class="sephira-tag">
              <span class="sephira-level">{node_lbl} &bull; {seph_lbl}</span>
              <span>{icon}</span>
            </div>
            <div class="sephira-title">{title_html}</div>
            <div class="sephira-desc">{desc_html}</div>
            <div class="sephira-model"><strong>{stack_lbl}</strong> {stack}</div>
          </div>'''

def get_section_08():
    # =========================================================================
    # 8.1 Physical Manufacturing & Solving Business Pains
    # =========================================================================
    sub1_content = f'''
      <div class="factory-overview-card">
        <div class="factory-header-row">
          <div>
            <div class="hero-eyebrow">{t("МАТЕРИАЛЬНЫЙ СУВЕРЕНИТЕТ // PHYSICAL ASSETS", "МАТЕРІАЛЬНИЙ СУВЕРЕНІТЕТ // PHYSICAL ASSETS", "PHYSICAL SOVEREIGNTY // ASSETS")}</div>
            <h4 style="color:#fff; font-size: 1.25rem; margin: 4px 0;">
              {t("Завод полимеров EvaLine (Черноморск) & Логистический хаб ЕС (Братислава)",
                 "Завод полімерів EvaLine (Чорноморськ) та Логістичний хаб ЄС (Братислава)",
                 "EvaLine Polymer Factory (Chornomorsk) & EU Logistics Hub (Bratislava)")}
            </h4>
          </div>
          <span class="sub-badge">{t("ISO 9001:2015 & CE", "ISO 9001:2015 & CE", "ISO 9001:2015 & CE")}</span>
        </div>
        <p style="color: var(--fg-muted); margin-bottom: 16px;">
          {t("EvaLine — это не просто виртуальный софт, а физический промышленный гигант: собственная фабрика площадью 2.8 гектара в Черноморске (Одесская область), 100+ квалифицированных инженеров и операторов, ежемесячный выпуск более 550 тонн полимерного листа ЭВА, 8 автоматизированных линий вспенивания и 4 раскройных плоттера ЧПУ. Европейский склад в Братиславе (Obchodna 37) гарантирует беспошлинную экспресс-доставку по странам ЕС за 24–48 часов.",
             "EvaLine — це не просто віртуальний софт, а фізичний промисловий гігант: власна фабрика площею 2.8 гектара в Чорноморську (Одеська область), 100+ кваліфікованих інженерів та операторів, щомісячний випуск понад 550 тонн полімерного листа ЕВА, 8 автоматизованих ліній спінювання та 4 розкрійні плотери ЧПК. Європейський склад у Братиславі (Obchodna 37) гарантує безмитну експрес-доставку країнами ЄС за 24–48 годин.",
             "EvaLine is not merely a digital platform, but a heavy physical manufacturer: an owned 2.8-hectare industrial plant in Chornomorsk (Odesa region), 100+ engineers and machine operators, over 550 tons of EVA polymer sheets produced monthly, 8 automated foaming lines, and 4 high-precision CNC cutting tables. An EU distribution warehouse in Bratislava (Obchodna 37) delivers duty-free 24-48h dispatch across the European Union.")}
        </p>

        <!-- Product Line Badges -->
        <div class="product-tags-row" style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 20px;">
          <span class="pill-tech">🚗 {t("Автоковрики EvaLine Drive (Ромб/Соты 8мм)", "Автокилимки EvaLine Drive (Ромб/Стільники 8мм)", "EvaLine Drive Auto Mats (Diamond/Cells)")}</span>
          <span class="pill-tech">🐄 {t("Маты для КРС «Бурьонка» (Компенсация 25%)", "Мати для ВРХ «Бурьонка» (Компенсація 25%)", "Buryonka Cow Mats (25% Subsidy)")}</span>
          <span class="pill-tech">⛵ {t("Морской тик Marine Teak (3M VHB, УФ-стойкий)", "Морський тік Marine Teak (3M VHB, УФ-стійкий)", "Marine Teak Decking (3M VHB UV)")}</span>
          <span class="pill-tech">🥋 {t("Татами «Ласточкин хвост» (75-250 кг/м³)", "Татамі «Ластівчин хвіст» (75-250 кг/м³)", "Tatami Puzzle Mats (75-250 kg/m³)")}</span>
        </div>
      </div>

      <!-- 6 Pain & Solution Cards -->
      <div class="biz-grid" style="margin-top: 20px;">
        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-card-icon">⚡</div>
            <div class="biz-card-title">{t("Медленный саппорт и потеря клиентов", "Повільний саппорт та втрата клієнтів", "Slow Support & Lost Sales Deals")}</div>
          </div>
          <div class="biz-pain-box">
            <strong>{t("Боль бизнеса:", "Біль бізнесу:", "Pain:")}</strong> {t(
              "Менеджеры отвечают по 40–90 минут, ночью заявки простаивают, B2B-клиенты уходят к конкурентам. Текучка кадров, обучение новичка занимает до 3 месяцев.",
              "Менеджери відповідають по 40–90 хвилин, вночі заявки простоюють, B2B-клієнти йдуть до конкурентів. Плинність кадрів, навчання новачка триває до 3 місяців.",
              "Managers take 40–90 minutes to respond, night inquiries expire, and B2B clients defect to rivals. Staff turnover requires 3 months of costly training."
            )}
          </div>
          <div class="biz-solution-box">
            <strong>{t("Решение EvaBot:", "Рішення EvaBot:", "EvaBot Solution:")}</strong> {t(
              "Ролевые агенты Адам (бэкенд, производство, безопасность) и Ева (фронтенд — лицо компании, 6 языков). Время первого квалифицированного ответа — 1.2 секунды в режиме 24/7/365 с проверкой реальных складских остатков.",
              "Рольові агенти Адам (бекенд, виробництво, безпека) та Єва (фронтенд — обличчя компанії, 6 мовами). Час першої кваліфікованої відповіді — 1.2 секунди в режимі 24/7/365 з перевіркою реальних залишків на складі.",
              "Role-based agents Adam (backend, production, security) and Eva (frontend — the face of the company, 6 languages). First qualified response in 1.2 seconds, 24/7/365, with live inventory verification."
            )}
          </div>
        </div>

        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-card-icon">📐</div>
            <div class="biz-card-title">{t("Брак в раскрое и сметных спецификациях", "Брак у розкрої та сметних специфікаціях", "Scrap in CNC Cutting & Quoting")}</div>
          </div>
          <div class="biz-pain-box">
            <strong>{t("Боль производства:", "Біль виробництва:", "Manufacturing Pain:")}</strong> {t(
              "Ошибки мастеров при расчете выкроек ковриков или татами приводят к перерасходу полимерного листа до 12% и накоплению обрезков.",
              "Помилки майстрів при розрахунку викрійок килимків або татамі призводять до перевитрати полімерного листа до 12% та накопичення обрізків.",
              "Manual geometric calculation errors lead to up to 12% polymer sheet scrap and piles of unsellable offcut waste."
            )}
          </div>
          <div class="biz-solution-box">
            <strong>{t("Решение EvaBot:", "Рішення EvaBot:", "EvaBot Solution:")}</strong> {t(
              "Автоматическая генерация векторных карт раскроя (DXF/G-код) и строгая геометрическая оптимизация nesting. Снижение отходов до минимума (< 0.01% брака).",
              "Автоматична генерація векторних карт розкрою (DXF/G-код) та сувора геометрична оптимізація nesting. Зниження відходів до мінімуму (< 0.01% браку).",
              "Automated CAD vector cutting generation (DXF/G-code) with algorithmic nesting. Cuts scrap waste to an absolute minimum (< 0.01% defects)."
            )}
          </div>
        </div>

        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-card-icon">💸</div>
            <div class="biz-card-title">{t("Неконтролируемые расходы на облачный ИИ", "Неконтрольовані витрати на хмарний ШІ", "Runaway Cloud AI Token Costs")}</div>
          </div>
          <div class="biz-pain-box">
            <strong>{t("Боль финансов:", "Біль фінансів:", "Financial Pain:")}</strong> {t(
              "Подключение сырых API OpenAI или Claude приводит к счетам в тысячи долларов за рутинные запросы, которые могла решить бесплатная модель.",
              "Підключення сирих API OpenAI або Claude призводить до рахунків у тисячі доларів за рутинні запити, які могла вирішити безкоштовна модель.",
              "Unmanaged API tokens produce massive invoices for trivial questions that free models handle effortlessly."
            )}
          </div>
          <div class="biz-solution-box">
            <strong>{t("Решение EvaBot:", "Рішення EvaBot:", "EvaBot Solution:")}</strong> {t(
              "Двухуровневый маршрутизатор OmniRoute. 90% трафика направляется на авторизованный бесплатный пул Google AI Studio ($0.00), экономя до 85% бюджета.",
              "Дворівневий маршрутизатор OmniRoute. 90% трафіку спрямовується на авторизований безкоштовний пул Google AI Studio ($0.00), заощаджуючи до 85% бюджету.",
              "OmniRoute 2-tier classifier routes 90% of routine traffic to verified Google AI Studio zero-cost quotas ($0.00), reducing token OpEx by 85%."
            )}
          </div>
        </div>

        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-card-icon">⚖️</div>
            <div class="biz-card-title">{t("Сложности с экспортом и стандартами ЕС", "Складнощі з експортом та стандартами ЄС", "Export Friction & EU Compliance")}</div>
          </div>
          <div class="biz-pain-box">
            <strong>{t("Боль юристов и ВЭД:", "Біль юристів та ЗЕД:", "Legal/Export Pain:")}</strong> {t(
              "Ошибки в классификации кодов УКТВЭД, антикоррупционных требованиях UNIC и декларациях соответствия CE задерживают грузы на таможне.",
              "Помилки в класифікації кодів УКТЗЕД, антикорупційних вимогах UNIC та деклараціях відповідності CE затримують вантажі на митниці.",
              "Misclassified HS/customs codes, UNIC anti-corruption audits, and CE paperwork cause prolonged customs inspections and fines."
            )}
          </div>
          <div class="biz-solution-box">
            <strong>{t("Решение EvaBot:", "Рішення EvaBot:", "EvaBot Solution:")}</strong> {t(
              "Юрист-агент по ВЭД проверяет спецификации по базе регламентов ЕС за 40 секунд. Логистический хаб в Братиславе обеспечивает бесшовный транзит.",
              "Юрист-агент із ЗЕД перевіряє специфікації за базою регламентів ЄС за 40 секунд. Логістичний хаб у Братиславі забезпечує безшовний транзит.",
              "Specialized Legal agent audits export documentation in 40 seconds against EU directives. The Bratislava warehouse guarantees frictionless transit."
            )}
          </div>
        </div>

        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-card-icon">🧠</div>
            <div class="biz-card-title">{t("Утечка знаний при уходе ключевых мастеров", "Витік знань при звільненні ключових майстрів", "Loss of Proprietary Factory Know-How")}</div>
          </div>
          <div class="biz-pain-box">
            <strong>{t("Боль руководства:", "Біль керівництва:", "Leadership Pain:")}</strong> {t(
              "Специфика рецептур, свойства пластификаторов ЭВА и нюансы настроек станков хранятся только в головах ветеранов завода.",
              "Специфіка рецептур, властивості пластифікаторів ЕВА та нюанси налаштувань верстатів зберігаються лише в головах ветеранів заводу.",
              "Decades of compounding chemistry, EVA polymer formulation, and foaming machine tweaks remain trapped in individuals minds."
            )}
          </div>
          <div class="biz-solution-box">
            <strong>{t("Решение EvaBot:", "Рішення EvaBot:", "EvaBot Solution:")}</strong> {t(
              "Оцифровка 100% корпоративной памяти в ChromaDB и SQLite FTS5. Знания принадлежат заводу, а агенты обучают новых операторов за часы.",
              "Оцифрування 100% корпоративної пам'яті в ChromaDB та SQLite FTS5. Знання належать заводу, а агенти навчають нових операторів за години.",
              "100% of corporate manufacturing know-how indexed into ChromaDB and SQLite FTS5. Knowledge stays company-owned, onboarding operators in hours."
            )}
          </div>
        </div>

        <div class="biz-card">
          <div class="biz-card-header">
            <div class="biz-card-icon">🛡️</div>
            <div class="biz-card-title">{t("Риск блэкаутов и потери заказов", "Ризик блекаутів та втрати замовлень", "Blackout Vulnerability & Outages")}</div>
          </div>
          <div class="biz-pain-box">
            <strong>{t("Боль инфраструктуры:", "Біль інфраструктури:", "Infrastructure Pain:")}</strong> {t(
              "Перебои с электричеством или связью парализуют прием заказов и отгрузку, приводя к штрафам по контрактам.",
              "Перебої з електрикою або зв'язком паралізують прийом замовлень та відвантаження, призводячи до штрафів за контрактами.",
              "Grid outages, infrastructure disruptions, and telecom drops freeze sales and manufacturing, risking severe delivery breach penalties."
            )}
          </div>
          <div class="biz-solution-box">
            <strong>{t("Решение EvaBot:", "Рішення EvaBot:", "EvaBot Solution:")}</strong> {t(
              "Двухузловой отказоустойчивый кластер (Франкфурт ⟷ Айова) на закрытой магистрали WireGuard Mesh. Облачные агенты продолжают прием заказов, а дизели питают цех.",
              "Двовузловий відмовостійкий кластер (Франкфурт ⟷ Айова) на закритій магістралі WireGuard Mesh. Хмарні агенти продовжують прийом замовлень, а дизелі живлять цех.",
              "Dual-node resilient cluster (Frankfurt ⟷ Iowa) across encrypted WireGuard tunnels. Cloud agents run uninterrupted while on-site industrial generators power the machines."
            )}
          </div>
        </div>
      </div>
    '''
    sub1 = sub_accordion(
        "sub-8-1", "🏭",
        "Вопрос 8.1: Каковы физические мощности завода EvaLine и склада в ЕС?",
        "Питання 8.1: Які фізичні потужності заводу EvaLine та складу в ЄС?",
        "Question 8.1: What are EvaLine's physical factory assets, capacity, and EU hub?",
        "Завод 2.8 га", "Завод 2.8 га", "2.8 Ha Plant",
        sub1_content
    )

    # =========================================================================
    # 8.2 Tetraktys 10 Roles & Sephirot Parallel
    # =========================================================================
    c1 = make_role_card(
        "01", "👑",
        "Архитектор (Chief Architect)", "Архітектор (Chief Architect)", "Chief Architect",
        "Кетер (Kether) // Высший замысел", "Кетер (Kether) // Вищий задум", "Kether (Crown) // Sovereign Vision",
        "Определение глобального видения, системных аксиом, декомпозиция задач верхнего уровня и стратегическое целеполагание.",
        "Визначення глобального бачення, системних аксіом, декомпозиція завдань верхнього рівня та стратегічне цілепокладання.",
        "Definition of global vision, system axioms, high-level task decomposition, and sovereign architectural roadmaps.",
        "Gemini 3.1 Pro (2M Context) • Claude 3.7"
    )

    c2 = make_role_card(
        "02", "🛡️",
        "Адам (Бэкенд / Производство / CISO)", "Адам (Бекенд / Виробництво / CISO)", "Adam (Backend / Production / CISO)",
        "Бина / Гевура // Форма & Строгость", "Біна / Гевура // Форма & Суворість", "Gevurah & Binah // Severity & Discipline",
        "Шеф бэкенда, разработки, безопасности, производства и бизнес-процессов. Формальная верификация, аудит кода, сметные лимиты, контроль раскроя на ЧПУ и соблюдение ГОСТ/ISO.",
        "Шеф бекенду, розробки, безпеки, виробництва та бізнес-процесів. Формальна верифікація, аудит коду, кошторисні ліміти, контроль розкрою на ЧПК та дотримання ДСТУ/ISO.",
        "Chief of backend, development, security, manufacturing, and business processes. Formal verification, code audit, budget limits, CNC nest QA, and ISO compliance.",
        "Claude 3.7 Sonnet • DeepSeek R1 • Linux MCP"
    )

    c3 = make_role_card(
        "03", "🤝",
        "Ева (Фронтенд / Лицо компании / CXO)", "Єва (Фронтенд / Обличчя компанії / CXO)", "Eva (Frontend / Company Face / CXO)",
        "Хокма / Хесед // Мудрость & Экспансия", "Хокма / Хесед // Мудрість & Експансія", "Chesed & Chokmah // Mercy & Growth",
        "Фронтенд-директор и лицо компании: клиентский опыт, сервис и продажи. Мультиязычная живая коммуникация на 6 языках (UK, EN, DE, PL, RO, RU), эмпатия, омничейн-поддержка, B2B-сделки.",
        "Фронтенд-директор та обличчя компанії: клієнтський досвід, сервіс і продажі. Багатомовна жива комунікація 6 мовами (UK, EN, DE, PL, RO, RU), емпатія, B2B-угоди.",
        "Frontend director and the face of the company: CX, service & sales. Live empathetic dialogue in 6 languages (UK, EN, DE, PL, RO, RU) with live stock checks.",
        "Gemini 3.8 Flash • OmniRoute • Voice Engine"
    )

    c4 = make_role_card(
        "04", "⚖️",
        "Арбитр Консилиума (Consilium Arbiter)", "Арбітр Консиліуму (Consilium Arbiter)", "Consilium Arbiter",
        "Тиферет (Tifereth) // Гармония & Синтез", "Тіферет (Tifereth) // Гармонія & Синтез", "Tifereth (Beauty) // Synthesis & Consensus",
        "Главный арбитр Консилиума. Алгоритмическое разрешение споров между Адамом (бэкенд и безопасность) и Евой (фронтенд и продажи), состязательный синтез с точностью 99.4%.",
        "Головний арбітр Консиліуму. Алгоритмічне вирішення суперечок між Адамом (бекенд і безпека) та Євою (фронтенд і продажі), змагальний синтез з точністю 99.4%.",
        "Supreme dispute resolver. Mathematical adversarial synthesis between Adam (backend & security) and Eva (frontend & sales), guaranteeing 99.4% precision.",
        "Consilium Consensus Engine • Multi-LLM Judge"
    )

    c5 = make_role_card(
        "05", "⚡",
        "Разработчик (Lead Developer / Coder)", "Розробник (Lead Developer / Coder)", "Lead Developer / Coder",
        "Нецах (Netzach) // Победа & Энергия", "Нецах (Netzach) // Перемога & Енергія", "Netzach (Victory) // Dynamic Execution",
        "Ведущий инженер разработки и кодинга. Написание чистого кода, сборка микросервисов, рефакторинг, тесты, линтинг, Docker, Git и скрипты.",
        "Провідний інженер розробки та кодингу. Написання чистого коду, збірка мікросервісів, рефакторинг, тести, лінтинг, Docker, Git та скрипти.",
        "Lead software engineer. Writes clean code, refactors microservices, builds Docker containers, Git commits, and manages unit tests.",
        "Claude 3.7 Sonnet • DeepSeek R1 • LSP Servers"
    )

    c6 = make_role_card(
        "06", "🎙️",
        "Коммуникатор (Voice & Speech Specialist)", "Комунікатор (Voice & Speech Specialist)", "Voice & Speech Specialist",
        "Ход (Hod) // Речь & Форма выражения", "Ход (Hod) // Мова & Форма вираження", "Hod (Splendor) // Speech & Expression",
        "Специалист по речевому взаимодействию. Потоковый синтез и распознавание речи в реальном времени (EvaVoice FastAPI :8000), SIP/VoIP звонки.",
        "Спеціаліст з мовної взаємодії. Потоковий синтез та розпізнавання мови в реальному часі (EvaVoice FastAPI :8000), дзвінки SIP/VoIP.",
        "Speech and voice specialist. Real-time neural audio streaming (EvaVoice FastAPI :8000), SIP/VoIP PBX routing, and interactive dialogues.",
        "EvaVoice Engine • WebSpeech • WebSocket"
    )

    c7 = make_role_card(
        "07", "💾",
        "Хранитель Памяти (Data & RAG Specialist)", "Охоронець Пам'яті (Data & RAG Specialist)", "Data & RAG Specialist",
        "Йесод (Yesod) // Основание & Память", "Йесод (Yesod) // Основа & Пам'ять", "Yesod (Foundation) // Grounded Knowledge",
        "Архивариус и хранитель знаний. Векторные базы ChromaDB, таблицы SQLite FTS5, семантическая память Memory Graph, прайс-листы и регламенты ТУ.",
        "Архіваріус та охоронець знань. Векторні бази ChromaDB, таблиці SQLite FTS5, семантична пам'ять Memory Graph, прайс-листи та регламенти ТУ.",
        "Corporate memory librarian. High-density ChromaDB vector collections, SQLite FTS5 index, Memory Graph MCP, and technical specs.",
        "ChromaDB • SQLite FTS5 • Memory Graph MCP"
    )

    c8 = make_role_card(
        "08", "🔧",
        "Системный Администратор (SRE / DevOps)", "Системний Адміністратор (SRE / DevOps)", "SRE / DevOps Engineer",
        "Оболочка Йесод // Защитный каркас", "Оболонка Йесод // Захисний каркас", "Yesod Shell // Infrastructure Backbone",
        "Дежурный системный инженер. Мониторинг задержек 94 моделей, шифрованная магистраль WireGuard Mesh, EarlyOOM, Caddy HTTP/3 и аптайм 99.9%.",
        "Черговий системний інженер. Моніторинг затримок 94 моделей, шифрована магістраль WireGuard Mesh, EarlyOOM, Caddy HTTP/3 та аптайм 99.9%.",
        "Site reliability engineer. 94-model latency monitoring, WireGuard Mesh dual-node backbone, EarlyOOM daemon, and 99.9% cluster uptime.",
        "WireGuard Mesh • Caddy v2 • Watchdog Daemons"
    )

    c9 = make_role_card(
        "09", "📜",
        "Юрист-Логист (Legal & EU Compliance)", "Юрист-Логіст (Legal & EU Compliance)", "Legal & EU Compliance Counsel",
        "Врата Малхут // Таможня & Законы", "Брама Малхут // Митниця & Закони", "Gates of Malkuth // Regulatory Boundary",
        "Юрист по ВЭД и координатор европейской логистики. Проверка контрактов, кодов УКТВЭД, антикоррупционных норм UNIC, логистика хаба в Братиславе.",
        "Юрист із ЗЕД та координатор європейської логістики. Перевірка контрактів, кодів УКТЗЕД, антикорупційних норм UNIC, логістика хабу в Братиславі.",
        "Cross-border legal and EU logistics counsel. Audits foreign trade contracts, HS/customs codes, UNIC regulations, and Bratislava hub dispatches.",
        "Legal Compliance RAG • EU Trade Directives"
    )

    c10 = make_role_card(
        "10", "🏭",
        "Мастер Завода (CNC & Production Master)", "Майстер Заводу (CNC & Production Master)", "CNC & Plant Production Master",
        "Малхут (Malkuth) // Физический Мир", "Малхут (Malkuth) // Фізичний Світ", "Malkuth (Kingdom) // Physical Matter",
        "Шеф производственного цеха и ЧПУ. Реальное физическое производство на заводе в Черноморске (2.8 га, 550+ т/мес), раскрой на плоттерах, коврики, маты, татами.",
        "Шеф виробничого цеху та ЧПК. Реальне фізичне виробництво на заводі в Чорноморську (2.8 га, 550+ т/міс), розкрій на плотерах, килимки, мати, татамі.",
        "Shopfloor and CNC production master. Physical execution at Chornomorsk plant (2.8 ha, 550+ t/mo), automated nesting, auto mats, and tatami.",
        "CAM DXF/G-Code • Foaming Presses • ISO 9001"
    )

    sub2_content = f'''
      <div class="sephirot-box">
        <div class="sephirot-header">
          <div class="hero-eyebrow">{t("ТЕТРАКСИС ПИФАГОРА // 1 + 2 + 3 + 4 = 10 РОЛЕЙ", "ТЕТРАКСИС ПІФАГОРА // 1 + 2 + 3 + 4 = 10 РОЛЕЙ", "PYTHAGOREAN TETRAKTYS // 1 + 2 + 3 + 4 = 10 ROLES")}</div>
          <h4 style="font-family: var(--font-display); font-size: 1.3rem; color: #fff; margin: 4px 0 8px;">
            {t("Гармоничная иерархия 10 универсальных должностей цифрового штата",
               "Гармонійна ієрархія 10 універсальних посад цифрового штату",
               "Harmonious Hierarchy of 10 Universal Roles in Sovereign Fleet")}
          </h4>
          <p style="max-width: 860px; margin: 0 auto; color: var(--fg-muted);">
            {t("В фабрике EvaLine устранена путаница хаотичных микроботов. 10 ролей структурированы по закону сакрального Тетраксиса Пифагора (1+2+3+4 = 10 узлов) в строгом соответствии с 10 ступенями Сфирот — от высшего замысла владельца до физического станка ЧПУ:",
               "У фабриці EvaLine усунуто плутанину хаотичних мікроботів. 10 ролей структуровано за законом сакрального Тетраксису Піфагора (1+2+3+4 = 10 вузлів) у суворій відповідності з 10 ступенями Сфірот — від вищого задуму власника до фізичного верстата ЧПК:",
               "EvaLine eliminates chaotic ad-hoc bots by structuring exactly 10 universal positions under the sacred Pythagorean Tetraktys (1+2+3+4 = 10 nodes) in direct parallel with the 10 Sephirot — from sovereign visionary intent down to physical CNC execution:")}
          </p>
        </div>

        <div class="tetraktys-container">
          <!-- TIER 1: MONAD -->
          <div class="tetraktys-tier-block">
            <div class="tier-heading">▲ {t("РЯД I // МОНАДА (1 УЗЕЛ): ВЫСШИЙ ЗАМЫСЕЛ ⟷ КЕТЕР", "РЯД I // МОНАДА (1 ВУЗОЛ): ВИЩИЙ ЗАДУМ ⟷ КЕТЕР", "TIER I // MONAD (1 NODE): SOVEREIGN INTENT ⟷ KETHER")}</div>
            <div class="sephirot-grid" style="grid-template-columns: 1fr;">
{c1}
            </div>
          </div>

          <!-- TIER 2: DYAD -->
          <div class="tetraktys-tier-block">
            <div class="tier-heading">▲▲ {t("РЯД II // ДИАДА (2 УЗЛА): БИНАРНЫЙ КОНТУР СИЛ ⟷ БИНА / ГЕВУРА & ХОКМА / ХЕСЕД", "РЯД II // ДІАДА (2 ВУЗЛИ): БІНАРНИЙ КОНТУР СИЛ ⟷ БІНА / ГЕВУРА & ХОКМА / ХЕСЕД", "TIER II // DYAD (2 NODES): BINARY FORCE POLARITY ⟷ GEVURAH & CHESED")}</div>
            <div class="sephirot-grid">
{c2}
{c3}
            </div>
          </div>

          <!-- TIER 3: TRIAD -->
          <div class="tetraktys-tier-block">
            <div class="tier-heading">▲▲▲ {t("РЯД III // ТРИАДА (3 УЗЛА): ДИНАМИЧЕСКИЙ БАЛАНС ⟷ ТИФЕРЕТ, НЕЦАХ, ХОД", "РЯД III // ТРІАДА (3 ВУЗЛИ): ДИНАМІЧНИЙ БАЛАНС ⟷ ТІФЕРЕТ, НЕЦАХ, ХОД", "TIER III // TRIAD (3 NODES): DYNAMIC HARMONY ⟷ TIFERETH, NETZACH, HOD")}</div>
            <div class="sephirot-grid">
{c4}
{c5}
{c6}
            </div>
          </div>

          <!-- TIER 4: TETRAD -->
          <div class="tetraktys-tier-block">
            <div class="tier-heading">▲▲▲▲ {t("РЯД IV // ТЕТРАДА (4 УЗЛА): МАТЕРИАЛИЗАЦИЯ (1 + 2 + 3 + 4 = 10) ⟷ ЙЕСОД, МАЛХУТ", "РЯД IV // ТЕТРАДА (4 ВУЗЛИ): МАТЕРІАЛІЗАЦІЯ (1 + 2 + 3 + 4 = 10) ⟷ ЙЕСОД, МАЛХУТ", "TIER IV // TETRAD (4 NODES): PHYSICAL EMBODIMENT (1+2+3+4=10) ⟷ YESOD, MALKUTH")}</div>
            <div class="sephirot-grid">
{c7}
{c8}
{c9}
{c10}
            </div>
          </div>
        </div>
      </div>
    '''
    sub2 = sub_accordion(
        "sub-8-2", "📐",
        "Вопрос 8.2: Как устроен Тетраксис Пифагора (1+2+3+4=10), Сфирот и 10 универсальных должностей?",
        "Питання 8.2: Як влаштований Тетраксис Піфагора (1+2+3+4=10), Сфірот та 10 універсальних посад?",
        "Question 8.2: How does the Pythagorean Tetraktys (1+2+3+4=10) map to Sephirot and 10 universal roles?",
        "10 ролей Тетраксиса", "10 ролей Тетраксиса", "10 Tetraktys Roles",
        sub2_content
    )

    # =========================================================================
    # 8.3 End-to-End Autonomous Dataflow Pipeline (7 Steps)
    # =========================================================================
    sub3_content = f'''
      <p style="color: var(--fg-muted); margin-bottom: 20px;">
        {t("Каждая транзакция, входящий звонок или чертеж детали проходит 7-ступенчатую защищенную магистраль обработки в реальном времени:",
           "Кожна транзакція, вхідний дзвінок або креслення деталі проходить 7-ступеневу захищену магістраль обробки в реальному часі:",
           "Every customer transaction, VoIP call, or CAD blueprint traverses a 7-stage authenticated real-time processing pipeline:")}
      </p>

      <div class="pipeline-flow">
        <div class="pipe-step">
          <span class="pipe-badge">{t("Шаг 01 // Омниканал", "Крок 01 // Омніканал", "Step 01 // Omnichannel")}</span>
          <div class="pipe-name">{t("Клиентский вход", "Клієнтський вхід", "Client Ingestion")}</div>
          <div class="pipe-desc">{t(
            "Входящий звонок (EvaVoice), Telegram, WhatsApp, B2B-портал или вебхук из 1С/CRM.",
            "Вхідний дзвінок (EvaVoice), Telegram, WhatsApp, B2B-портал або вебхук з 1С/CRM.",
            "Inbound VoIP call (EvaVoice), Telegram, WhatsApp, B2B portal, or ERP/CRM webhook."
          )}</div>
          <div class="pipe-tech">FastAPI • WebSpeech • REST API</div>
        </div>

        <div class="pipe-step">
          <span class="pipe-badge">{t("Шаг 02 // Защита", "Крок 02 // Захист", "Step 02 // Edge Shield")}</span>
          <div class="pipe-name">{t("Фильтрация трафика", "Фільтрація трафіку", "Traffic Filtering")}</div>
          <div class="pipe-desc">{t(
            "Краевой шлюз EvaFace (Айова) отсекает DDoS, валидирует JWT-токены и шифрует туннель.",
            "Крайовий шлюз EvaFace (Айова) відсікає DDoS, валідує JWT-токени та шифрує тунель.",
            "EvaFace edge gateway (Iowa) blocks DDoS bursts, validates JWT signatures, and tunnels data."
          )}</div>
          <div class="pipe-tech">Caddy HTTP/3 • TLS 1.3 • WireGuard</div>
        </div>

        <div class="pipe-step">
          <span class="pipe-badge">{t("Шаг 03 // Маршрутизатор", "Крок 03 // Маршрутизатор", "Step 03 // Router")}</span>
          <div class="pipe-name">{t("OmniRoute селектор", "OmniRoute селектор", "OmniRoute Selector")}</div>
          <div class="pipe-desc">{t(
            "Анализ сложности задачи за 15 мс и выбор: бесплатный пул ($0) или платный флагман.",
            "Аналіз складності завдання за 15 мс та вибір: безкоштовний пул ($0) або платний флагман.",
            "Task complexity parsing in 15ms: selects zero-cost tier ($0) or commercial frontier models."
          )}</div>
          <div class="pipe-tech">Token Classifier • TTFT Monitor</div>
        </div>

        <div class="pipe-step">
          <span class="pipe-badge">{t("Шаг 04 // Память", "Крок 04 // Пам'ять", "Step 04 // Memory")}</span>
          <div class="pipe-name">{t("RAG и контекст", "RAG та контекст", "RAG & Knowledge")}</div>
          <div class="pipe-desc">{t(
            "Извлечение цен, чертежей и регламентов ISO/ТУ из базы ChromaDB и таблиц SQLite.",
            "Вилучення цін, креслень та регламентів ISO/ТУ з бази ChromaDB та таблиць SQLite.",
            "Retrieves live pricing, CAD files, and ISO standards from ChromaDB and SQLite FTS5."
          )}</div>
          <div class="pipe-tech">ChromaDB • SQLite FTS5 • Memory Graph</div>
        </div>

        <div class="pipe-step">
          <span class="pipe-badge">{t("Шаг 05 // Консилиум", "Крок 05 // Консиліум", "Step 05 // Consilium")}</span>
          <div class="pipe-name">{t("Коллегиальный дебат", "Колегіальний дебат", "Collegiate Debate")}</div>
          <div class="pipe-desc">{t(
            "Параллельный опрос моделей Google, Anthropic, DeepSeek. Синтез консенсуса без галлюцинаций.",
            "Паралельне опитування моделей Google, Anthropic, DeepSeek. Синтез консенсусу без галюцинацій.",
            "Parallel query across Google, Anthropic, DeepSeek. Consensus synthesis with 0% hallucinations."
          )}</div>
          <div class="pipe-tech">Gemini 3.1 Pro • Claude 3.7 • DeepSeek R1</div>
        </div>

        <div class="pipe-step">
          <span class="pipe-badge">{t("Шаг 06 // Аудит", "Крок 06 // Аудит", "Step 06 // CISO & QA")}</span>
          <div class="pipe-name">{t("Контроль безопасности", "Контроль безпеки", "Security Gate")}</div>
          <div class="pipe-desc">{t(
            "Проверка сметных лимитов, соблюдения норм UNIC, ISO 9001 и коммерческой тайны.",
            "Перевірка лімітів кошторису, дотримання норм UNIC, ISO 9001 та комерційної таємниці.",
            "Validates budget caps, UNIC integrity regulations, ISO 9001 rules, and data privacy."
          )}</div>
          <div class="pipe-tech">RulesEngine • OWASP Guard • Token Budget</div>
        </div>

        <div class="pipe-step">
          <span class="pipe-badge">{t("Шаг 07 // Исполнение", "Крок 07 // Виконання", "Step 07 // Action")}</span>
          <div class="pipe-name">{t("Физическое действие", "Фізична дія", "Physical Execution")}</div>
          <div class="pipe-desc">{t(
            "Формирование счетов в 1С, выгрузка G-кода на раскройные плоттеры ЧПУ в Черноморске.",
            "Формування рахунків в 1С, вивантаження G-коду на розкрійні плотери ЧПК у Чорноморську.",
            "Generates invoices in 1C/ERP and dispatches G-code nesting to CNC cutting flatbeds."
          )}</div>
          <div class="pipe-tech">MCP 1C • CNC G-Code • Bitrix24 Hook</div>
        </div>
      </div>
    '''
    sub3 = sub_accordion(
        "sub-8-3", "⚡",
        "Вопрос 8.3: Как выглядит сквозной конвейер: от звонка до станка ЧПУ и отгрузки (7 шагов)?",
        "Питання 8.3: Як виглядає наскрізний конвеєр: від дзвінка до верстата ЧПК та відвантаження (7 кроків)?",
        "Question 8.3: What does the end-to-end autonomous pipeline look like: call to CNC (7 steps)?",
        "Сквозной конвейер", "Наскрізний конвеєр", "7-Step Pipeline",
        sub3_content
    )

    # =========================================================================
    # 8.4 Transformation Metrics Before vs After
    # =========================================================================
    sub4_content = f'''
      <div class="compare-grid">
        <div class="compare-card">
          <div class="compare-metric-title">
            <span>{t("Скорость первого ответа", "Швидкість першої відповіді", "First Response Speed")}</span>
            <span class="compare-delta">-99.9%</span>
          </div>
          <div class="compare-row before">
            <span>{t("До (Человек):", "До (Людина):", "Before (Human):")}</span>
            <span>{t("45 минут", "45 хвилин", "45 minutes")}</span>
          </div>
          <div class="compare-row after">
            <span>{t("С EvaBot (Автономно):", "З EvaBot (Автономно):", "With EvaBot (Autonomous):")}</span>
            <span>{t("1.2 секунды", "1.2 секунди", "1.2 seconds")}</span>
          </div>
          <div class="compare-bar-wrap">
            <div class="compare-bar-fill" style="width: 98%;"></div>
          </div>
        </div>

        <div class="compare-card">
          <div class="compare-metric-title">
            <span>{t("Себестоимость заявки", "Собівартість заявки", "Cost per Inbound Ticket")}</span>
            <span class="compare-delta">-99.5%</span>
          </div>
          <div class="compare-row before">
            <span>{t("До (Оператор):", "До (Оператор):", "Before (Operator):")}</span>
            <span>$4.50 / {t("заявка", "заявка", "ticket")}</span>
          </div>
          <div class="compare-row after">
            <span>{t("С EvaBot (Гибрид):", "З EvaBot (Гібрид):", "With EvaBot (Hybrid):")}</span>
            <span>$0.02 / {t("заявка", "заявка", "ticket")}</span>
          </div>
          <div class="compare-bar-wrap">
            <div class="compare-bar-fill" style="width: 96%;"></div>
          </div>
        </div>

        <div class="compare-card">
          <div class="compare-metric-title">
            <span>{t("Брак в сметах и раскрое", "Брак у кошторисах і розкрої", "Nesting & Quoting Scrap")}</span>
            <span class="compare-delta">-99.8%</span>
          </div>
          <div class="compare-row before">
            <span>{t("До (Ручной счет):", "До (Ручний рахунок):", "Before (Manual):")}</span>
            <span>8.4% {t("ошибок", "помилок", "errors")}</span>
          </div>
          <div class="compare-row after">
            <span>{t("С EvaBot (ЧПУ/CAM):", "З EvaBot (ЧПК/CAM):", "With EvaBot (CNC/CAM):")}</span>
            <span>&lt; 0.01% {t("брака", "браку", "scrap")}</span>
          </div>
          <div class="compare-bar-wrap">
            <div class="compare-bar-fill" style="width: 99%;"></div>
          </div>
        </div>

        <div class="compare-card">
          <div class="compare-metric-title">
            <span>{t("Режим доступности", "Режим доступності", "Operating Availability")}</span>
            <span class="compare-delta">+320%</span>
          </div>
          <div class="compare-row before">
            <span>{t("До внедрения:", "До впровадження:", "Before:")}</span>
            <span>40 {t("ч / неделю", "год / тиждень", "hrs / week")}</span>
          </div>
          <div class="compare-row after">
            <span>{t("С EvaBot:", "З EvaBot:", "With EvaBot:")}</span>
            <span>168 {t("ч / нед (24/7)", "год / тижд (24/7)", "hrs / wk (24/7)")}</span>
          </div>
          <div class="compare-bar-wrap">
            <div class="compare-bar-fill" style="width: 100%;"></div>
          </div>
        </div>

        <div class="compare-card">
          <div class="compare-metric-title">
            <span>{t("Проверка экспортного ВЭД", "Перевірка експортного ЗЕД", "Export Trade Verification")}</span>
            <span class="compare-delta">-99.8%</span>
          </div>
          <div class="compare-row before">
            <span>{t("До (Юристы):", "До (Юристи):", "Before (Lawyers):")}</span>
            <span>3 {t("рабочих дня", "робочі дні", "business days")}</span>
          </div>
          <div class="compare-row after">
            <span>{t("С EvaBot (Legal):", "З EvaBot (Legal):", "With EvaBot (Legal):")}</span>
            <span>40 {t("секунд", "секунд", "seconds")}</span>
          </div>
          <div class="compare-bar-wrap">
            <div class="compare-bar-fill" style="width: 97%;"></div>
          </div>
        </div>

        <div class="compare-card">
          <div class="compare-metric-title">
            <span>{t("Мультиязычный охват", "Багатомовне охоплення", "Multilingual Support")}</span>
            <span class="compare-delta">6 {t("Языков", "Мов", "Languages")}</span>
          </div>
          <div class="compare-row before">
            <span>{t("До внедрения:", "До впровадження:", "Before:")}</span>
            <span>1–2 {t("языка со словарем", "мови зі словником", "languages with dictionary")}</span>
          </div>
          <div class="compare-row after">
            <span>{t("С EvaBot:", "З EvaBot:", "With EvaBot:")}</span>
            <span>UK, EN, DE, PL, RO, RU</span>
          </div>
          <div class="compare-bar-wrap">
            <div class="compare-bar-fill" style="width: 100%;"></div>
          </div>
        </div>
      </div>
    '''
    sub4 = sub_accordion(
        "sub-8-4", "📈",
        "Вопрос 8.4: Каковы подтвержденные метрики бизнес-трансформации («До» и «После»)?",
        "Питання 8.4: Які підтверджені метрики бізнес-трансформації («До» та «Після»)?",
        "Question 8.4: What are the verified transformation benchmarks: Before vs. After?",
        "Метрики До/После", "Метрики До/Після", "Before/After Metrics",
        sub4_content
    )

    # =========================================================================
    # 8.5 5-Phase Onboarding Protocol
    # =========================================================================
    sub5_content = f'''
      <p style="color: var(--fg-muted); margin-bottom: 20px;">
        {t("Внедрение EvaBot не требует остановки производства или переписывания софта. Процесс разбит на 5 четких фаз (2–4 недели):",
           "Впровадження EvaBot не потребує зупинки виробництва або переписування софту. Процес розбитий на 5 чітких фаз (2–4 тижні):",
           "Deploying EvaBot requires zero production downtime or disruptive software rewrites. It executes across 5 phased stages (2–4 weeks):")}
      </p>

      <div class="phase-timeline">
        <div class="phase-card">
          <div class="phase-badge-col">
            <div class="phase-circle">1</div>
            <span class="phase-days">{t("Дни 1–3", "Дні 1–3", "Days 1–3")}</span>
          </div>
          <div class="phase-body">
            <h4>{t("Фаза 1: Семантический аудит и оцифровка корпоративной памяти",
                    "Фаза 1: Семантичний аудит та оцифрування корпоративної пам'яті",
                    "Phase 1: Semantic Audit & Knowledge Digitalization")}</h4>
            <p>{t(
              "Сбор и векторизация прайс-листов, регламентов ГОСТ/ISO/ТУ, коммерческих условий и архивов переписки в векторную базу ChromaDB и индекс SQLite FTS5.",
              "Збір та векторизація прайс-листів, регламентів ДСТУ/ISO/ТУ, комерційних умов та архівів листування у векторну базу ChromaDB та індекс SQLite FTS5.",
              "Ingestion and vectorization of pricing sheets, ISO/TU standards, sales playbooks, and correspondence logs into ChromaDB and SQLite FTS5."
            )}</p>
            <div class="phase-deliverables">
              <span class="phase-pill">RAG-индекс</span>
              <span class="phase-pill">PII Security</span>
              <span class="phase-pill">Entity Graph</span>
            </div>
          </div>
        </div>

        <div class="phase-card">
          <div class="phase-badge-col">
            <div class="phase-circle">2</div>
            <span class="phase-days">{t("Дни 4–7", "Дні 4–7", "Days 4–7")}</span>
          </div>
          <div class="phase-body">
            <h4>{t("Фаза 2: Подключение операционных инструментов через 21 MCP-сервер",
                    "Фаза 2: Підключення операційних інструментів через 21 MCP-сервер",
                    "Phase 2: Connecting Operational Tools via 21 MCP Servers")}</h4>
            <p>{t(
              "Безопасное развертывание MCP-коннекторов к 1С:Предприятие, CRM Битрикс24/amoCRM, базам PostgreSQL/MySQL и защищенным мессенджерам.",
              "Безпечне розгортання MCP-конекторів до 1С:Підприємство, CRM Бітрікс24/amoCRM, баз PostgreSQL/MySQL та захищених месенджерів.",
              "Sandboxed deployment of MCP adapters to 1C:Enterprise, Bitrix24/amoCRM, SQL databases, and secure omnichannel messaging gateways."
            )}</p>
            <div class="phase-deliverables">
              <span class="phase-pill">21 MCP Sandbox</span>
              <span class="phase-pill">1C/CRM API</span>
              <span class="phase-pill">Omnichannel Webhooks</span>
            </div>
          </div>
        </div>

        <div class="phase-card">
          <div class="phase-badge-col">
            <div class="phase-circle">3</div>
            <span class="phase-days">{t("Дни 8–14", "Дні 8–14", "Days 8–14")}</span>
          </div>
          <div class="phase-body">
            <h4>{t("Фаза 3: Развертывание ролевых агентов и калибровка Консилиума",
                    "Фаза 3: Розгортання рольових агентів та калібрування Консиліуму",
                    "Phase 3: Deploying Agent Fleet & Consilium Calibration")}</h4>
            <p>{t(
              "Настройка системных промптов Адама (инженерия/смета/CISO) и Евы (клиентский сервис/продажи). Подбор оптимального пула из 94 LLM под целевой бюджет.",
              "Налаштування системних промптів Адама (інженерія/кошторис/CISO) та Єви (клієнтський сервіс/продажі). Підбір оптимального пулу з 94 LLM під бюджет.",
              "Fine-tuning prompt boundaries for Adam (CISO/engineering/quoting) and Eva (CXO/sales). Calibration of the 94-LLM router to target budgets."
            )}</p>
            <div class="phase-deliverables">
              <span class="phase-pill">Adam & Eva Personas</span>
              <span class="phase-pill">Consilium Consensus</span>
              <span class="phase-pill">Token Optimization</span>
            </div>
          </div>
        </div>

        <div class="phase-card">
          <div class="phase-badge-col">
            <div class="phase-circle">4</div>
            <span class="phase-days">{t("Дни 15–21", "Дні 15–21", "Days 15–21")}</span>
          </div>
          <div class="phase-body">
            <h4>{t("Фаза 4: Пилотный режим Shadow Mode (Параллельная работа без риска)",
                    "Фаза 4: Пілотний режим Shadow Mode (Паралельна робота без ризику)",
                    "Phase 4: Zero-Risk Pilot in Shadow Mode")}</h4>
            <p>{t(
              "Агенты обрабатывают реальные заявки параллельно с живыми сотрудниками: генерируют черновики смет и накладных для проверки в 1 клик.",
              "Агенти обробляють реальні заявки паралельно з живими працівниками: генерують чернетки кошторисів та накладних для перевірки в 1 клік.",
              "Agents shadow human operators on live inquiries: generating draft quotes and cutting nests verified with single-click human confirmation."
            )}</p>
            <div class="phase-deliverables">
              <span class="phase-pill">Zero-Risk Shadowing</span>
              <span class="phase-pill">Precision Analytics</span>
              <span class="phase-pill">Staff AI Training</span>
            </div>
          </div>
        </div>

        <div class="phase-card">
          <div class="phase-badge-col">
            <div class="phase-circle">5</div>
            <span class="phase-days">{t("День 22+", "День 22+", "Day 22+")}</span>
          </div>
          <div class="phase-body">
            <h4>{t("Фаза 5: Полномасштабный автономный продакшн и финансовый учет",
                    "Фаза 5: Повномасштабний автономний продакшн та фінансовий облік",
                    "Phase 5: Full-Scale Autonomous Production & OpEx Monitoring")}</h4>
            <p>{t(
              "Перевод 85%+ рутины на автономное исполнение 24/7/365. Подключение дашборда evaline.network и посекундного учета затрат AccountingEngine.",
              "Переведення 85%+ рутини на автономне виконання 24/7/365. Підключення дашборда evaline.network та обліку витрат AccountingEngine.",
              "Full handover of 85%+ routine operations to autonomous 24/7 execution with real-time telemetry on evaline.network and sub-second token accounting."
            )}</p>
            <div class="phase-deliverables">
              <span class="phase-pill">24/7 Autonomy</span>
              <span class="phase-pill">evaline.network</span>
              <span class="phase-pill">AccountingEngine</span>
            </div>
          </div>
        </div>
      </div>
      {infographics_builder.get_onboarding_gantt()}
    '''
    sub5 = sub_accordion(
        "sub-8-5", "📋",
        "Вопрос 8.5: Как выглядит пошаговый протокол интеграции на предприятие (5 фаз за 2–4 недели)?",
        "Питання 8.5: Як виглядає покроковий протокол інтеграції на підприємство (5 фаз за 2–4 тижні)?",
        "Question 8.5: What is the phased onboarding methodology for enterprise (5 phases in 2-4 weeks)?",
        "5 фаз внедрения", "5 фаз впровадження", "5-Phase Protocol",
        sub5_content
    )

    # =========================================================================
    # 8.6 Interactive ROI Calculator
    # =========================================================================
    sub6_content = f'''
      <div class="roi-calc-box" id="roi-calculator">
        <div class="roi-calc-header">
          <div>
            <h3 style="color:#fff; margin: 0 0 4px 0;">
              {t("Интерактивный калькулятор окупаемости внедрения EvaBot",
                 "Інтерактивний калькулятор окупності впровадження EvaBot",
                 "Interactive EvaBot Investment & ROI Payback Calculator")}
            </h3>
            <p style="color: var(--fg-muted); margin: 0; font-size: 0.92rem;">
              {t("Передвигайте ползунки под реальные параметры вашей компании:",
                 "Пересувайте повзунки під реальні параметри вашої компанії:",
                 "Adjust sliders to reflect your organization's real parameters:")}
            </p>
          </div>
          <div class="roi-badge">⚡ Real-time OpEx Engine</div>
        </div>

        <div class="roi-layout">
          <div class="roi-sliders">
            <div class="roi-field">
              <div class="roi-field-header">
                <span>{t("Сотрудников в отделе (продажи, саппорт, сметчики):", "Співробітників у відділі (продажі, саппорт, кошторис):", "Department Staff (Sales, Support, Estimators):")}</span>
                <span class="roi-field-val" id="val-staff">5 человек</span>
              </div>
              <input type="range" id="slider-staff" class="roi-slider" min="1" max="50" value="5" oninput="updateRoiCalc()">
            </div>

            <div class="roi-field">
              <div class="roi-field-header">
                <span>{t("Обращений и заказов в месяц:", "Звернень та замовлень на місяць:", "Monthly Inquiries & Orders:")}</span>
                <span class="roi-field-val" id="val-tickets">3 500 заявок</span>
              </div>
              <input type="range" id="slider-tickets" class="roi-slider" min="200" max="30000" step="100" value="3500" oninput="updateRoiCalc()">
            </div>

            <div class="roi-field">
              <div class="roi-field-header">
                <span>{t("Средняя стоимость часа специалиста:", "Середня вартість години фахівця:", "Average Hourly Wage of Specialist:")}</span>
                <span class="roi-field-val" id="val-wage">$15 / час</span>
              </div>
              <input type="range" id="slider-wage" class="roi-slider" min="5" max="60" step="1" value="15" oninput="updateRoiCalc()">
            </div>
          </div>

          <div class="roi-results">
            <div class="roi-result-card">
              <span class="roi-result-label">{t("Чистая экономия бюджета в месяц:", "Чиста економія бюджету на місяць:", "Net Monthly Cost Savings:")}</span>
              <span class="roi-result-val green" id="res-savings">$7,625</span>
              <span style="font-size: 0.74rem; color: var(--fg-subtle);">{t("С учетом снижения OpEx на 80%+", "З урахуванням зниження OpEx на 80%+", "Reflects an 80%+ OpEx reduction")}</span>
            </div>

            <div class="roi-result-card">
              <span class="roi-result-label">{t("Высвобождено рабочих часов:", "Вивільнено робочих годин:", "Work Hours Liberated:")}</span>
              <span class="roi-result-val cyan" id="res-hours">525 ч/мес</span>
              <span style="font-size: 0.74rem; color: var(--fg-subtle);">{t("Направлено на развитие и сделки", "Спрямовано на розвиток та угоди", "Reinvested into growth & closures")}</span>
            </div>

            <div class="roi-result-card">
              <span class="roi-result-label">{t("Прогнозируемый ROI платформы:", "Прогнозований ROI платформи:", "Projected Platform ROI:")}</span>
              <span class="roi-result-val amber" id="res-roi">420%</span>
              <span style="font-size: 0.74rem; color: var(--fg-subtle);">{t("Возврат инвестиций в первый же месяц", "Повернення інвестицій у перший же місяць", "Capital return within the first 30 days")}</span>
            </div>

            <div class="roi-result-card">
              <span class="roi-result-label">{t("Срок полной окупаемости:", "Термін повної окупності:", "Full Payback Horizon:")}</span>
              <span class="roi-result-val" id="res-payback" style="color: #a78bfa;">18 дней</span>
              <span style="font-size: 0.74rem; color: var(--fg-subtle);">{t("За счет гибридных бесплатных квот", "Завдяки гібридним безкоштовним квотам", "Enabled by zero-cost hybrid quotas")}</span>
            </div>
          </div>
        </div>
      </div>
    '''
    sub6 = sub_accordion(
        "sub-8-6", "💰",
        "Вопрос 8.6: Как устроен интерактивный калькулятор экономической окупаемости внедрения (ROI)?",
        "Питання 8.6: Як влаштований інтерактивний калькулятор економічної окупності впровадження (ROI)?",
        "Question 8.6: How does the real-time financial ROI calculator compute cost savings?",
        "Калькулятор ROI", "Калькулятор ROI", "Interactive ROI",
        sub6_content
    )

    # =========================================================================
    # 8.7 Enterprise Integration & 21 MCP Architecture
    # =========================================================================
    sub7_content = f'''
      <div class="cards-grid">
        <div class="card">
          <div class="card-icon">🔌</div>
          <h4 class="card-title">{t("Протокол Model Context Protocol (MCP)", "Протокол Model Context Protocol (MCP)", "Model Context Protocol (MCP) Core")}</h4>
          <p class="card-text">{t(
            "21 специализированный сервер стандартизирует доступ агентов к данным: файловые системы, репозитории Git, СУБД SQLite/PostgreSQL, SSH-консоли и веб-браузер.",
            "21 спеціалізований сервер стандартизує доступ агентів до даних: файлові системи, репозиторії Git, СУБД SQLite/PostgreSQL, SSH-консолі та веб-браузер.",
            "21 specialized MCP servers standardize agent access to file trees, Git commits, SQL databases, remote SSH bash shells, and live Chrome DevTools."
          )}</p>
        </div>

        <div class="card">
          <div class="card-icon">🔄</div>
          <h4 class="card-title">{t("Бесшовная интеграция с 1С:Предприятие", "Безшовна інтеграція з 1С:Підприємство", "Seamless 1C:Enterprise Integration")}</h4>
          <p class="card-text">{t(
            "Двусторонний обмен через OData / REST API: чтение номенклатуры, проверка реальных остатков полимеров на складах и автоматическое выставление счетов.",
            "Двосторонній обмін через OData / REST API: читання номенклатури, перевірка реальних залишків полімерів на складах та автоматичне виставлення рахунків.",
            "Bidirectional OData/REST sync: real-time inventory queries, warehouse polymer stock reconciliation, and automated invoicing."
          )}</p>
        </div>

        <div class="card">
          <div class="card-icon">🏭</div>
          <h4 class="card-title">{t("Промышленный контур ЧПУ & CAM", "Промисловий контур ЧПК та CAM", "Industrial CNC & CAM Machine Bus")}</h4>
          <p class="card-text">{t(
            "Генерация DXF/G-кода для цифровых раскройных комплексов (плоттеров). Оптимизация схемы раскладки (раскроя) листа минимизирует краевые отходы.",
            "Генерація DXF/G-коду для цифрових розкрійних комплексів (плотерів). Оптимізація схеми розкладки листа мінімізує відходи сировини.",
            "Automated DXF/G-code vector generation for digital flatbed CNC cutting systems. Optimal nesting geometry minimizes edge trim waste."
          )}</p>
        </div>
      </div>
    '''
    sub7 = sub_accordion(
        "sub-8-7", "🔌",
        "Вопрос 8.7: Как архитектура 21 MCP-коннектора интегрирует фабрику агентов в IT-ландшафт предприятия?",
        "Питання 8.7: Як архітектура 21 MCP-конектора інтегрує фабрику агентів в IT-ландшафт підприємства?",
        "Question 8.7: How does the 21 MCP adapter suite integrate agents into enterprise IT systems?",
        "21 MCP Коннектор", "21 MCP Конектор", "21 MCP Adapters",
        sub7_content
    )

    lead = t(
        "<strong>EvaLine</strong> объединяет тяжелую физическую индустрию полимеров EVA и передовую распределенную фабрику автономных агентов:",
        "<strong>EvaLine</strong> об'єднує важку фізичну індустрію полімерів EVA та передову розподілену фабрику автономних агентів:",
        "<strong>EvaLine</strong> uniquely fuses physical industrial polymer manufacturing with an autonomous distributed agent factory:"
    )

    info_panel = infographics_builder.get_infographic_08()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {sub1}
      {sub2}
      {sub3}
      {sub4}
      {sub5}
      {sub6}
      {sub7}'''

    return accordion_section(
        "business-solutions", "08",
        "Решение задач бизнеса, интеграция производства и анатомия EvaBot",
        "Рішення для бізнесу, інтеграція виробництва та анатомія EvaBot",
        "Business Solutions, Manufacturing Integration & EvaBot Anatomy",
        "Практическое внедрение", "Практичне впровадження", "Production Reality",
        content, open=False
    )
