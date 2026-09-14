# -*- coding: utf-8 -*-
"""
EvaLine Manifesto Infographics, Dashboards & Diagrams Builder.
Generates rich visual KPI cards, dashboards, Mermaid diagrams (mindmaps, sequences,
flowcharts, gantt), and ASCII fallback boxes for all 9 sections.
"""

import helpers
from helpers import t
import re

def render_kpi_row(val, lbl_ru, lbl_uk, lbl_en, sub_ru, sub_uk, sub_en, accent="green"):
    return f'''        <tr class="kpi-row kpi-{accent}">
          <td class="kpi-val-cell" align="center"><strong class="kpi-val">{val}</strong></td>
          <td class="kpi-lbl-cell"><strong>{t(lbl_ru, lbl_uk, lbl_en)}</strong></td>
          <td class="kpi-sub-cell"><small>{t(sub_ru, sub_uk, sub_en)}</small></td>
        </tr>'''

# =============================================================================
# Mindmap -> Markmap converter (zoomable, pan-able, fully responsive)
# Markmap renders a rich zoom/pan mindmap that is perfectly readable on
# portrait smartphones, unlike the static wide mermaid "mindmap" output.
# =============================================================================
def _mindmap_tree(mermaid_text):
    """Parse a Mermaid `mindmap` block into a markmap JSON tree (dict)."""
    root = {"type": "root", "content": "", "children": []}
    stack = []  # (depth, node)
    first = True
    for raw in mermaid_text.splitlines():
        if raw.strip().startswith("mindmap"):
            continue
        stripped = raw.rstrip()
        if not stripped.strip():
            continue
        depth = len(raw) - len(raw.lstrip(" "))
        content = stripped.strip()
        # strip mermaid mindmap syntactic sugar: root((...)) / (parens) /
        # [square] annotations, keeping the inner text
        m_root = re.match(r"^root\s*\(\((.*?)\)\)\s*$", content, re.DOTALL)
        if m_root:
            root["content"] = m_root.group(1).strip() or "EvaLine"
            first = False
            continue
        content = content.replace("((", "").replace("))", "")
        content = content.replace("[", "").replace("]", "")
        content = content.replace("(", "").replace(")", "")
        content = content.replace("`", "").strip()
        node = {"type": "branch" if depth > 0 else "root",
                "content": content or "EvaLine", "children": []}
        while stack and stack[-1][0] >= depth:
            stack.pop()
        if stack:
            stack[-1][1]["children"].append(node)
        else:
            root["children"].append(node)
        stack.append((depth, node))
    if not root["content"]:
        root["content"] = "EvaLine"
    return root


def render_markmap_block(m_ru, m_uk, m_en):
    """Render a zoomable markmap container for trilingual mindmaps."""
    import json

    def _attr(tree):
        # JSON goes into a single-quoted HTML attribute: escape apostrophes
        # (&#39; is decoded back to ' by the browser before JS parses it)
        return json.dumps(_mindmap_tree(tree), ensure_ascii=False).replace("'", "&#39;")

    trees = [_attr(m_ru), _attr(m_uk), _attr(m_en)]
    return t(
        f'<div class="markmap" data-tree=\'{trees[0]}\'></div>',
        f'<div class="markmap" data-tree=\'{trees[1]}\'></div>',
        f'<div class="markmap" data-tree=\'{trees[2]}\'></div>',
        tag="div",
        cls="markmap-lang"
    )


def render_infographic_panel(
    sec_num, icon,
    badge_ru, badge_uk, badge_en,
    title_ru, title_uk, title_en,
    desc_ru, desc_uk, desc_en,
    kpi_cards,
    mermaid_ru, mermaid_uk, mermaid_en,
    ascii_diagram="",
    extra_html=""
):
    kpi_rows = "\n".join([render_kpi_row(*card) for card in kpi_cards])
    
    ascii_html = ""
    if ascii_diagram:
        ascii_html = f'''      <!-- Text Monospace Diagram (ASCII / ANSI) -->
      <details class="ascii-toggle" open>
        <summary class="ascii-toggle-btn"><strong>📟 {t("Текстовая схема (ASCII / ANSI)", "Текстова схема (ASCII / ANSI)", "Text schematic (ASCII / ANSI)")}</strong></summary>
        <pre class="ascii-diagram" style="font-family: 'Roboto Mono', monospace; font-size: 0.82rem; overflow-x: auto; background: #07090e; color: #00e676; padding: 14px; border: 1px solid #1c2333; border-radius: 8px; line-height: 1.25;">{ascii_diagram}</pre>
      </details>'''

    mermaid_block = t(
        f'<div class="mermaid">{mermaid_ru}</div>',
        f'<div class="mermaid">{mermaid_uk}</div>',
        f'<div class="mermaid">{mermaid_en}</div>',
        tag="div",
        cls="mermaid-lang"
    )

    # Mindmaps are rendered with markmap (zoom/pan, mobile-friendly) instead of
    # the wide static mermaid mindmap output that is unreadable on phones.
    is_mindmap = bool(mermaid_ru.strip().lower().startswith("mindmap"))
    if is_mindmap:
        mermaid_block = render_markmap_block(mermaid_ru, mermaid_uk, mermaid_en)
    else:
        # Mark wide horizontal flows so JS can flip them to vertical on phones.
        is_lr = bool(re.search(r"\b(flowchart|graph) LR\b", mermaid_ru, re.IGNORECASE))
        if is_lr:
            cls_attr = ' class="mermaid mermaid-lang" data-flow="lr"'
        else:
            cls_attr = ' class="mermaid mermaid-lang"'
        mermaid_block = t(
            f'<div{cls_attr}>{mermaid_ru}</div>',
            f'<div{cls_attr}>{mermaid_uk}</div>',
            f'<div{cls_attr}>{mermaid_en}</div>',
            tag="div",
            cls="mermaid-lang"
        )

    lbl_metric = t("Показатель", "Показник", "Metric")
    lbl_param = t("Параметр системы", "Параметр системи", "System Parameter")
    lbl_impact = t("Значение для бизнеса / ТУ", "Значення для бізнесу / ТУ", "Business Impact / Technical Spec")

    if getattr(helpers, 'INCLUDE_MERMAID', True):
        badge = t("Mermaid.js // Auto-Layout",
                  "Mermaid.js // Авто-компонування", "Mermaid.js // Auto-Layout")
        diagram_html = f'''      <!-- ARCHITECTURE DIAGRAM BOX -->
      <div class="diagram-box">
        <div class="diagram-box-header">
          <div class="diagram-box-title">
            <span class="diagram-pulse-dot"></span>
            <strong>{t("АРХИТЕКТУРНАЯ СХЕМА И ДИАГРАММА ПОТОКОВ ДАННЫХ", "АРХІТЕКТУРНА СХЕМА ТА ДІАГРАМА ПОТОКІВ ДАНИХ", "ARCHITECTURE & DATAFLOW SCHEMATIC")}</strong>
          </div>
          <span class="diagram-badge">{badge}</span>
        </div>
        <div class="diagram-canvas">
          {mermaid_block}
        </div>
        {ascii_html}
      </div>'''
    else:
        diagram_html = f'''      <!-- ARCHITECTURE DIAGRAM BOX (Text Monospace) -->
      <div class="diagram-box">
        <div class="diagram-box-header">
          <div class="diagram-box-title">
            <strong>{t("АРХИТЕКТУРНАЯ СХЕМА (ASCII / ANSI)", "АРХІТЕКТУРНА СХЕМА (ASCII / ANSI)", "ARCHITECTURE SCHEMATIC (ASCII / ANSI)")}</strong>
          </div>
        </div>
        {ascii_html}
      </div>'''

    return f'''    <!-- =====================================================================
         INFOGRAPHIC & VISUAL DASHBOARD FOR SECTION {sec_num}
         ===================================================================== -->
    <div class="infographic-panel" id="infographic-sec-{sec_num}">
      <div class="infographic-header">
        <div class="infographic-title-wrap">
          <span class="infographic-icon">{icon}</span>
          <div>
            <div class="infographic-eyebrow">
              {t(badge_ru, badge_uk, badge_en)}
            </div>
            <h3 class="infographic-title">
              {t(title_ru, title_uk, title_en)}
            </h3>
          </div>
        </div>
        <div class="infographic-desc">
          {t(desc_ru, desc_uk, desc_en)}
        </div>
      </div>

      <!-- KPI METRIC TABLE (Semantic HTML with CSS-styling fallback) -->
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="18%" align="center">{lbl_metric}</th>
            <th width="38%" align="left">{lbl_param}</th>
            <th width="44%" align="left">{lbl_impact}</th>
          </tr>
        </thead>
        <tbody>
{kpi_rows}
        </tbody>
      </table>

      {extra_html}

{diagram_html}
    </div>
'''

# =============================================================================
# 01. ПРОБЛЕМА РЫНКА (Market Problem)
# =============================================================================
def get_infographic_01():
    kpis = [
        ("38%", "Галлюцинации одиночных LLM", "Галюцинації одиночних LLM", "Single LLM Hallucinations",
         "Ошибки в расчетах смет и нормах ТУ", "Помилки в розрахунках кошторисів і ТУ", "Fatal errors in quotes and engineering specs", "red"),
        ("0", "Прав исполнения в ОС у чат-ботов", "Прав виконання в ОС у чат-ботів", "OS Execution Rights in Web Bots",
         "Изоляция без консоли, Git и ЧПУ", "Ізоляція без консолі, Git та ЧПК", "Complete tool deprivation (text-only prison)", "amber"),
        ("100%", "Зависимость от вендоров США", "Залежність від вендорів США", "US Cloud Vendor Lock-in",
         "Сбой облака = паралич бизнеса", "Збій хмари = параліч бізнесу", "Cloud outage halts enterprise operations", "red"),
        ("0 сек", "Память между сессиями", "Пам'ять між сесіями", "Memory Across Sessions",
         "Потеря корпоративного контекста", "Втрата корпоративного контексту", "Full context loss on browser tab close", "cyan"),
    ]

    m_ru = """flowchart TD
  subgraph Traditional["❌ Одиночный чат-бот (Традиционный ИИ)"]
    direction TB
    A["Запрос клиента в веб-окно"] --> B["Одиночная LLM (Black Box)"]
    B --> C["Слепые галлюцинации (38% ошибок в сметах)"]
    B --> D["Изоляция без инструментов (0 доступа к Git, 1С, ЧПУ)"]
    B --> E["Vendor Lock-in (Сбой API = простой бизнеса)"]
    C & D & E --> F["Убытки, брак сырья и разочарование"]
  end

  subgraph EvaNet["✅ Фабрика агентов EvaLine Network"]
    direction TB
    G["Корпоративная задача"] --> H["Арбитр Консилиума"]
    H --> I["21 MCP Сервер: Linux, Docker, Git, 1С, ЧПУ"]
    H --> J["Перекрестный аудит 94 моделей (Точность 99.4%)"]
    H --> K["Суверенный кластер Франкфурт + Айова (99.9%)"]
    I & J & K --> L["Автономное исполнение и рост прибыли"]
  end

  classDef bad fill:#221015,stroke:#f87171,stroke-width:1px,color:#fca5a5;
  classDef good fill:#0e201a,stroke:#00e676,stroke-width:1px,color:#a7f3d0;
  class A,B,C,D,E,F bad;
  class G,H,I,J,K,L good;"""

    m_uk = """flowchart TD
  subgraph Traditional["❌ Одиночний чат-бот (Традиційний ШІ)"]
    direction TB
    A["Запит клієнта у веб-вікно"] --> B["Одиночна LLM (Black Box)"]
    B --> C["Сліпі галюцинації (38% помилок у кошторисах)"]
    B --> D["Ізоляція без інструментів (0 доступу до Git, 1С, ЧПК)"]
    B --> E["Vendor Lock-in (Збій API = зупинка бізнесу)"]
    C & D & E --> F["Збитки, брак сировини та розчарування"]
  end

  subgraph EvaNet["✅ Фабрика агентів EvaLine Network"]
    direction TB
    G["Корпоративна задача"] --> H["Арбітр Консиліуму"]
    H --> I["21 MCP Сервер: Linux, Docker, Git, 1С, ЧПК"]
    H --> J["Перехресний аудит 94 моделей (Точність 99.4%)"]
    H --> K["Суверенний кластер Франкфурт + Айова (99.9%)"]
    I & J & K --> L["Автономне виконання та зростання прибутку"]
  end

  classDef bad fill:#221015,stroke:#f87171,stroke-width:1px,color:#fca5a5;
  classDef good fill:#0e201a,stroke:#00e676,stroke-width:1px,color:#a7f3d0;
  class A,B,C,D,E,F bad;
  class G,H,I,J,K,L good;"""

    m_en = """flowchart TD
  subgraph Traditional["❌ Standalone Chatbot (Legacy AI)"]
    direction TB
    A["Client prompt in browser window"] --> B["Isolated LLM (Black Box)"]
    B --> C["Blind Hallucinations (38% spec error rate)"]
    B --> D["Tool Deprivation (Zero Linux, Git, ERP or CNC access)"]
    B --> E["Vendor Lock-in (API outage halts operations)"]
    C & D & E --> F["Financial losses and failed adoption"]
  end

  subgraph EvaNet["✅ EvaLine Agent Factory"]
    direction TB
    G["Enterprise objective"] --> H["Consilium Arbiter Engine"]
    H --> I["21 MCP Tool Suite: Bash, Docker, Git, 1C, CNC"]
    H --> J["Multi-LLM Cross Examination (99.4% precision)"]
    H --> K["Sovereign Frankfurt + Iowa Mesh Cluster (99.9%)"]
    I & J & K --> L["Autonomous execution & maximum profitability"]
  end

  classDef bad fill:#221015,stroke:#f87171,stroke-width:1px,color:#fca5a5;
  classDef good fill:#0e201a,stroke:#00e676,stroke-width:1px,color:#a7f3d0;
  class A,B,C,D,E,F bad;
  class G,H,I,J,K,L good;"""

    ascii_art = """+------------------------------------+      +--------------------------------------+
| ❌ ОДИНОЧНЫЙ ЧАТ-БОТ (ПРОБЛЕМА)    |      | ✅ ФАБРИКА EVALINE NETWORK (РЕШЕНИЕ) |
+------------------------------------+      +--------------------------------------+
| • Текстовое окно без доступа к ОС  |  vs  | • 21 MCP сервер с правами в Linux    |
| • 38% галлюцинаций в сметах и ТУ   |      | • Консилиум судей: точность 99.4%    |
| • Зависимость от одной монополии   |      | • 94 модели с автопереключением      |
| • Потеря контекста при рестарте    |      | • 3-слойный RAG (память навсегда)    |
+------------------------------------+      +--------------------------------------+"""

    return render_infographic_panel(
        "01", "⚠️",
        "ИНФОГРАФИКА РАЗДЕЛА 01 // СИСТЕМНЫЙ АУДИТ",
        "ІНФОГРАФІКА РОЗДІЛУ 01 // СИСТЕМНИЙ АУДИТ",
        "SECTION 01 DASHBOARD // RISK AUDIT",
        "Анатомия провала одиночных чат-ботов vs Суверенная фабрика EvaLine",
        "Анатомія провалу одиночних чат-ботів vs Суверенна фабрика EvaLine",
        "Failure Pattern of Standalone Bots vs The EvaLine Agent Factory",
        "Сравнение рисков традиционных одиночных языковых моделей с распределенной агентной фабрикой EvaLine.",
        "Порівняння ризиків традиційних одиночних мовних моделей із розподіленою агентною фабрикою EvaLine.",
        "Comparing the systemic failure modes of isolated language models against the multi-agent EvaLine architecture.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )

# =============================================================================
# 02. ФАБРИКА АГЕНТОВ EVANETWORK (Agent Factory)
# =============================================================================
def get_infographic_02():
    kpis = [
        ("21", "MCP-сервер в едином реестре", "MCP-сервер у єдиному реєстрі", "Connected MCP Tool Servers",
         "Инструменты Linux, Git, Docker, DevTools", "Інструменти Linux, Git, Docker, DevTools", "Full OS, Git, Docker, DB capabilities", "green"),
        ("10", "Специализированных ролей Тетраксиса", "Спеціалізованих ролей Тетраксиса", "Specialized Tetraktys Roles",
         "От Главного Архитектора до Мастера ЧПУ", "Від Головного Архітектора до Майстра ЧПК", "From Chief Architect down to CNC Master", "cyan"),
        ("3", "Слоя корпоративной памяти (RAG)", "Шари корпоративної пам'яті (RAG)", "Layers of Enterprise Memory RAG",
         "ChromaDB, SQLite FTS5, Memory Graph", "ChromaDB, SQLite FTS5, Memory Graph", "ChromaDB, SQLite FTS5, Memory Graph", "purple"),
        ("100%", "Суверенное локальное исполнение", "Суверенне локальне виконання", "Local Sovereign Execution",
         "0% утечки корпоративных данных вовне", "0% витоку корпоративних даних назовні", "Zero data leakage to third-party logs", "amber"),
    ]

    m_ru = """mindmap
  root((Фабрика EvaLine))
    Цифровой Штат (10 Ролей)
      01 Архитектор (Кетер // Стратегия)
      02 Адам (Бина // Бэкенд, Производство, Безопасность)
      03 Ева (Хокма // Фронтенд и Лицо компании)
      04 Арбитр (Тиферет // Консенсус)
      05 Разработчик (Нецах // Кодинг)
      10 Мастер ЧПУ (Малхут // Завод)
    Протокол MCP (21 сервер)
      Системные (Bash, Docker, WireGuard)
      Данные (SQLite, PostgreSQL, Filesystem)
      Автоматизация (Chrome DevTools, Fetch)
      Офис (NotebookLM, Gmail, GDrive)
    Память RAG (0% галлюцинаций)
      ChromaDB (1075 векторов)
      SQLite FTS5 (1086 документов)
      Memory Graph (Семантические связи)"""

    m_uk = """mindmap
  root((Фабрика EvaLine))
    Цифровий Штат (10 Ролей)
      01 Архітектор (Кетер // Стратегія)
      02 Адам (Біна // Бекенд, Виробництво, Безпека)
      03 Ева (Хокма // Фронтенд та Обличчя компанії)
      04 Арбітр (Тіферет // Консенсус)
      05 Розробник (Нецах // Кодинг)
      10 Майстер ЧПК (Малхут // Завод)
    Протокол MCP (21 сервер)
      Системні (Bash, Docker, WireGuard)
      Дані (SQLite, PostgreSQL, Filesystem)
      Автоматизація (Chrome DevTools, Fetch)
      Офіс (NotebookLM, Gmail, GDrive)
    Пам'ять RAG (0% галюцинацій)
      ChromaDB (1075 векторів)
      SQLite FTS5 (1086 документів)
      Memory Graph (Семантичні зв'язки)"""

    m_en = """mindmap
  root((EvaLine Factory))
    Digital Workforce (10 Roles)
      01 Architect (Kether // Strategy)
      02 Adam (Binah // Backend, Production, Security)
      03 Eva (Chokmah // Frontend & Company Face)
      04 Arbiter (Tifereth // Consensus)
      05 Lead Dev (Netzach // Code)
      10 CNC Master (Malkuth // Shopfloor)
    MCP Protocol (21 Servers)
      System (Bash, Docker, WireGuard)
      Data (SQLite, PostgreSQL, Filesystem)
      Automation (Chrome DevTools, Fetch)
      Office (NotebookLM, Gmail, GDrive)
    Memory RAG (Zero Hallucination)
      ChromaDB (1,075 Vectors)
      SQLite FTS5 (1,086 Documents)
      Memory Graph (Entity Relationships)"""

    ascii_art = """+-------------------------------------------------------------------------+
|                  ФАБРИКА АГЕНТОВ EVALINE NETWORK                        |
+------------------------------------+------------------------------------+
|  ЦИФРОВОЙ ШТАТ (10 РОЛЕЙ)          |  21 ИНСТРУМЕНТ MCP                 |
|  • 01. Архитектор (Кетер)          |  • Bash, Linux, Docker, WireGuard  |
|  • 02. Адам (Бэкенд/ЧПУ)           |  • SQLite, Postgres, Filesystem    |
|  • 03. Ева (UI/Фронт/Лицо)        |  • Chrome DevTools, Fetch, API      |
|  • 04. Арбитр Консилиума           +------------------------------------+
|  • 05-10. Разработчик, Мастер ЧПУ  |  ТРЕХСЛОЙНЫЙ RAG (ПАМЯТЬ)          |
|                                    |  • ChromaDB + SQLite FTS5 + Graph  |
+------------------------------------+------------------------------------+"""

    return render_infographic_panel(
        "02", "🏭",
        "ИНФОГРАФИКА РАЗДЕЛА 02 // ФАБРИКА АГЕНТОВ",
        "ІНФОГРАФІКА РОЗДІЛУ 02 // ФАБРИКА АГЕНТІВ",
        "SECTION 02 DASHBOARD // AGENT FACTORY",
        "Интеллект-карта автономного предприятия: штат, инструменты MCP и RAG",
        "Інтелект-карта автономного підприємства: штат, інструменти MCP та RAG",
        "Mind Map of the Autonomous Enterprise: Roles, MCP Tools & Triple RAG",
        "Структурная экосистема цифрового персонала EvaLine: 10 специализированных ролей, 21 сервер инструментов и тройной RAG.",
        "Структурна екосистема цифрового персоналу EvaLine: 10 спеціалізованих ролей, 21 сервер інструментів і потрійний RAG.",
        "Structural ecosystem of EvaLine digital workforce: 10 specialized roles, 21 tool servers, and triple RAG grounding.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )

# =============================================================================
# 03. СИСТЕМА «КОНСИЛИУМ» (Consilium Deliberation Engine)
# =============================================================================
def get_infographic_03():
    kpis = [
        ("99.4%", "Фактическая точность вердиктов", "Фактична точність вердиктів", "Factual Verdict Precision",
         "Полное исключение слепых галлюцинаций", "Повне виключення сліпих галюцинацій", "Total elimination of blind hallucinations", "green"),
        ("4", "Режима состязательной работы", "Режими змагальної роботи", "Adversarial Deliberation Modes",
         "Solo, Broadcast, Dialogue, Consilium", "Solo, Broadcast, Dialogue, Consilium", "Solo, Broadcast, Dialogue, Consilium", "cyan"),
        ("450 ms", "Минимальная задержка (Solo)", "Мінімальна затримка (Solo)", "Minimum Solo Latency",
         "Экспресс-ответы на типовые запросы", "Експрес-відповіді на типові запити", "Sub-second turnaround on routine requests", "amber"),
        ("3-Way", "Перекрестная валидация судей", "Перехресна валідація суддів", "3-Way Cross-Examination",
         "Адам, Ева и независимый Арбитр", "Адам, Ева та незалежний Арбітр", "Adam, Eva and impartial Arbiter", "purple"),
    ]

    m_ru = """sequenceDiagram
  autonumber
  actor User as Бизнес / Оператор
  participant Arbiter as Арбитр Консилиума
  participant RAG as База знаний RAG (ТУ/1С)
  participant Adam as Адам (Бэкенд / Производство / Безопасность)
  participant Eva as Ева (Фронтенд / Лицо компании)
  
  User->>Arbiter: Запрос / Задача расчета сметы
  Arbiter->>RAG: Поиск регламентов (ГОСТ, остатки склада)
  RAG-->>Arbiter: Проверенные факты и лимиты
  Arbiter->>Adam: Экспертиза прочности и безопасность
  Arbiter->>Eva: Клиентский интерфейс и конверсия
  Adam-->>Eva: Ограничения рецептуры полимеров
  Eva-->>Adam: Требования клиента и сроки отгрузки
  Adam->>Arbiter: Технический вердикт и допуски
  Eva->>Arbiter: Коммерческий вердикт и цена
  Arbiter->>User: Синтезированное решение (Точность 99.4%)"""

    m_uk = """sequenceDiagram
  autonumber
  actor User as Бізнес / Оператор
  participant Arbiter as Арбітр Консиліуму
  participant RAG as База знань RAG (ТУ/1С)
  participant Adam as Адам (Бекенд / Виробництво / Безпека)
  participant Eva as Ева (Фронтенд / Обличчя компанії)
  
  User->>Arbiter: Запит / Задача розрахунку кошторису
  Arbiter->>RAG: Пошук регламентів (ГОСТ, залишки складу)
  RAG-->>Arbiter: Перевірені факти та ліміти
  Arbiter->>Adam: Експертиза міцності та безпека
  Arbiter->>Eva: Клієнтський інтерфейс та конверсія
  Adam-->>Eva: Обмеження рецептури полімерів
  Eva-->>Adam: Вимоги клієнта та строки відвантаження
  Adam->>Arbiter: Технічний вердикт та допуски
  Eva->>Arbiter: Комерційний вердикт та ціна
  Arbiter->>User: Синтезоване рішення (Точність 99.4%)"""

    m_en = """sequenceDiagram
  autonumber
  actor User as Enterprise Client
  participant Arbiter as Consilium Arbiter
  participant RAG as Knowledge RAG (Specs/ERP)
  participant Adam as Adam (Backend / Production / Security)
  participant Eva as Eva (Frontend / Company Face)
  
  User->>Arbiter: Request / Complex Specification
  Arbiter->>RAG: Retrieve grounded context (ISO/Inventory)
  RAG-->>Arbiter: Verified grounding facts
  Arbiter->>Adam: Safety, engineering & code audit
  Arbiter->>Eva: Customer experience & commercial value
  Adam-->>Eva: Structural & manufacturing constraints
  Eva-->>Adam: Delivery requirements & client value
  Adam->>Arbiter: Formal engineering verdict
  Eva->>Arbiter: Commercial & communications verdict
  Arbiter->>User: Synthesized consensus decision (99.4% precision)"""

    ascii_art = """+-------------------------------------------------------------------------+
|                  ПРОТОКОЛ ДЕБАТОВ СИСТЕМЫ «КОНСИЛИУМ»                   |
|                                                                         |
|  [Клиент] ---> [Арбитр Консилиума] <---> [Память RAG (ГОСТ, 1С, ТУ)]    |
|                      |                                                  |
|           +----------+----------+                                       |
|           |                     |                                       |
|           v                     v                                       |
|     [АДАМ (CISO)] <---------> [ЕВА (CXO)]                               |
|   Формальный аудит           Клиентский опыт                            |
|   Безопасность и смета       Мультиязычный диалог                       |
|           |                     |                                       |
|           +----------> <--------+                                       |
|                        |                                                |
|             [СИНТЕЗ АРБИТРА (99.4%)] ---> [Финальный результат]         |
+-------------------------------------------------------------------------+"""

    return render_infographic_panel(
        "03", "⚖️",
        "ИНФОГРАФИКА РАЗДЕЛА 03 // КОНСИЛИУМ",
        "ІНФОГРАФІКА РОЗДІЛУ 03 // КОНСИЛІУМ",
        "SECTION 03 DASHBOARD // CONSILIUM CONSENSUS",
        "Протокол состязательных дебатов мультиагентного Консилиума",
        "Протокол змагальних дебатів мультиагентного Консиліуму",
        "Adversarial Deliberation Protocol of the Consilium Multi-Agent Engine",
        "Как система Консилиум исключает галлюцинации через состязательный аудит между Адамом, Евой и Арбитром.",
        "Як система Консиліум виключає галюцинації через змагальний аудит між Адамом, Евою та Арбітром.",
        "How the Consilium engine eliminates hallucinations through adversarial debate between Adam, Eva and Arbiter.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )

# =============================================================================
# 04. МАТРИЦА 94 LLM-МОДЕЛЕЙ (Matrix of 94 LLMs)
# =============================================================================
def get_infographic_04():
    kpis = [
        ("94", "Модели в единой матрице", "Моделі в єдиній матриці", "Total Unified LLM Models",
         "Google, OpenRouter, OmniRoute, OpenCode", "Google, OpenRouter, OmniRoute, OpenCode", "Google, OpenRouter, OmniRoute, OpenCode", "cyan"),
        ("62", "Бесплатные модели ($0.00)", "Безкоштовні моделі ($0.00)", "Zero-Cost Free Models ($0.00)",
         "100% бесплатные квоты Google и OpenRouter", "100% безкоштовні квоти Google та OpenRouter", "100% free production quotas without API bills", "green"),
        ("32", "Коммерческие флагманы", "Комерційні флагмани", "Flagship Commercial Tier",
         "Claude 3.7 Sonnet, DeepSeek R1, Gemini Pro", "Claude 3.7 Sonnet, DeepSeek R1, Gemini Pro", "Claude 3.7 Sonnet, DeepSeek R1, Gemini Pro", "purple"),
        ("120 ms", "Срабатывание Circuit Breaker", "Спрацьовування Circuit Breaker", "Circuit Breaker Failover",
         "Мгновенное переключение на fallback", "Миттєве перемикання на fallback", "Instant failover to healthy alternatives", "amber"),
    ]

    m_ru = """flowchart TD
  Req["Запрос к модели"] --> Router["Интеллектуальный роутер"]
  Router --> Prim{"Первичная модель (напр. gemini-2.5-flash)"}
  Prim -->|Успех 200 OK в пределах 800ms| Res["Возврат клиенту"]
  Prim -->|Таймаут / Ошибка 5xx / Болванка| CB["⚡ Срабатывание Circuit Breaker"]
  CB --> Fallback["Каскад здоровых моделей (Fallback Chain)"]
  Fallback --> Alt1["dots-studio/dots-3-note:free"]
  Alt1 --> Chk1{"Ответ валиден?"}
  Chk1 -->|Да| Res
  Chk1 -->|Нет| Alt2["openrouter/free (Мета-пул)"]
  Alt2 --> Res

  classDef normal fill:#111927,stroke:#38bdf8,stroke-width:1px,color:#e6edf3;
  classDef fail fill:#261216,stroke:#f87171,stroke-width:1px,color:#fca5a5;
  classDef ok fill:#0e201a,stroke:#00e676,stroke-width:1px,color:#a7f3d0;
  class Req,Router,Fallback,Alt1,Alt2 normal;
  class Prim,CB,Chk1 fail;
  class Res ok;"""

    m_uk = """flowchart TD
  Req["Запит до моделі"] --> Router["Інтелектуальний роутер"]
  Router --> Prim{"Первинна модель (напр. gemini-2.5-flash)"}
  Prim -->|Успіх 200 OK в межах 800ms| Res["Повернення клієнту"]
  Prim -->|Таймаут / Помилка 5xx / Болванка| CB["⚡ Спрацьовування Circuit Breaker"]
  CB --> Fallback["Каскад здорових моделей (Fallback Chain)"]
  Fallback --> Alt1["dots-studio/dots-3-note:free"]
  Alt1 --> Chk1{"Відповідь валідна?"}
  Chk1 -->|Так| Res
  Chk1 -->|Ні| Alt2["openrouter/free (Мета-пул)"]
  Alt2 --> Res

  classDef normal fill:#111927,stroke:#38bdf8,stroke-width:1px,color:#e6edf3;
  classDef fail fill:#261216,stroke:#f87171,stroke-width:1px,color:#fca5a5;
  classDef ok fill:#0e201a,stroke:#00e676,stroke-width:1px,color:#a7f3d0;
  class Req,Router,Fallback,Alt1,Alt2 normal;
  class Prim,CB,Chk1 fail;
  class Res ok;"""

    m_en = """flowchart TD
  Req["Client model request"] --> Router["Auto-Routing Engine"]
  Router --> Prim{"Primary Candidate (e.g. gemini-2.5-flash)"}
  Prim -->|Success 200 OK under 800ms| Res["Return verified response"]
  Prim -->|Timeout / 5xx / Junk Stub| CB["⚡ Circuit Breaker Trips"]
  CB --> Fallback["Ranked Fallback Chain (10 Candidates)"]
  Fallback --> Alt1["dots-studio/dots-3-note:free"]
  Alt1 --> Chk1{"Response valid?"}
  Chk1 -->|Yes| Res
  Chk1 -->|No| Alt2["openrouter/free (Dynamic Meta-Pool)"]
  Alt2 --> Res

  classDef normal fill:#111927,stroke:#38bdf8,stroke-width:1px,color:#e6edf3;
  classDef fail fill:#261216,stroke:#f87171,stroke-width:1px,color:#fca5a5;
  classDef ok fill:#0e201a,stroke:#00e676,stroke-width:1px,color:#a7f3d0;
  class Req,Router,Fallback,Alt1,Alt2 normal;
  class Prim,CB,Chk1 fail;
  class Res ok;"""

    ascii_art = """+-------------------------------------------------------------------------+
|                  АВТОМАТИЧЕСКИЙ КАСКАД FAILOVER И ЗАЩИТЫ                |
|                                                                         |
|  [Запрос] ---> [Первичная модель] --(OK)----------------> [200 Ответ]   |
|                      | (Сбой / Таймаут)                         ^       |
|                      v                                          |       |
|            [CIRCUIT BREAKER ТРИП]                               |       |
|                      |                                          |       |
|                      v                                          |       |
|            [Рейтинговый Fallback] ---> [dots-3-note:free] ------+       |
|                      | (Резерв)                                 |       |
|                      +---------------> [openrouter/free] -------+       |
+-------------------------------------------------------------------------+"""

    return render_infographic_panel(
        "04", "🧠",
        "ИНФОГРАФИКА РАЗДЕЛА 04 // МАТРИЦА 94 МОДЕЛЕЙ",
        "ІНФОГРАФІКА РОЗДІЛУ 04 // МАТРИЦЯ 94 МОДЕЛЕЙ",
        "SECTION 04 DASHBOARD // 94-MODEL MATRIX",
        "Архитектура отказоустойчивости: Circuit Breaker и каскад Fallback",
        "Архітектура відмовостійкості: Circuit Breaker та каскад Fallback",
        "Fault-Tolerant Resilience Architecture: Circuit Breaker & Fallback Chain",
        "Автоматическое переключение на здоровые модели за 120ms при сбоях или исчерпании квот.",
        "Автоматичне перемикання на здорові моделі за 120ms при збоях або вичерпанні квот.",
        "Zero-downtime automatic switching across 94 models via circuit breaker and ranked fallback cascades.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )

# =============================================================================
# 05. ЦЕННОСТЬ ДЛЯ БИЗНЕСА И ПРОИЗВОДСТВА (Business Value & Plant ROI)
# =============================================================================
def get_infographic_05():
    kpis = [
        ("-78%", "Снижение затрат на разработку", "Зниження витрат на розробку", "Development Cost Reduction",
         "Автономное написание и аудит кода", "Автономне написання та аудит коду", "Autonomous engineering & rapid iteration", "green"),
        ("12x", "Ускорение расчетов смет и ТУ", "Прискорення розрахунків кошторисів і ТУ", "Quoting & Spec Generation Speedup",
         "С 4 дней до 20 минут в автоматическом режиме", "З 4 днів до 20 хвилин в автоматичному режимі", "From 4 business days down to 20 minutes", "cyan"),
        ("550+ т", "Производство полимеров EVA / мес", "Виробництво полімерів EVA / міс", "EVA Polymer Plant Monthly Capacity",
         "Завод Черноморск (2.8 га, прессы, ЧПУ)", "Завод Чорноморськ (2.8 га, преси, ЧПК)", "Chornomorsk plant (2.8 ha, hot presses, CNC)", "amber"),
        ("48 ч", "Доставка со склада ЕС (Братислава)", "Доставка зі складу ЄС (Братислава)", "EU Delivery from Bratislava Hub",
         "Оптовые поставки листов и матов по Европе", "Оптові поставки листів та матів по Європі", "Rapid dispatch across the European Union", "purple"),
    ]

    m_ru = """flowchart LR
  subgraph Plant["🏭 Завод EVA (Черноморск, 2.8 га)"]
    direction TB
    P1["Гранулы Сэвилена (Borealis/LG)"] --> P2["Автоматическое компаундирование"]
    P2 --> P3["Прессы горячего вспенивания (550+ т/мес)"]
    P3 --> P4["Прецизионный ЧПУ раскрой (G-Code)"]
    P4 --> P5["Контроль качества ISO 9001 / CE"]
  end

  subgraph Logistics["🇪🇺 Европейская логистика"]
    direction TB
    L1["Складской хаб в Братиславе"] --> L2["Отгрузка в Германию, Польшу, Чехию"]
    L2 --> L3["Доставка клиенту за 48 часов"]
  end

  subgraph AIConsilium["🤖 Цифровой надзор EvaLine"]
    direction TB
    A1["Адам: Бэкенд, сметы, ЧПУ раскрой"]
    A2["Ева: Фронтенд, CRM, 6 языков"]
    A3["Юрист-Логист: УКТВЭД, таможня, ISO"]
  end

  AIConsilium -.->|Управление G-кодом| P4
  AIConsilium -.->|Контроль качества| P5
  AIConsilium -.->|Таможенное оформление| L1
  P5 ==> L1"""

    m_uk = """flowchart LR
  subgraph Plant["🏭 Завод EVA (Чорноморськ, 2.8 га)"]
    direction TB
    P1["Гранули Севілену (Borealis/LG)"] --> P2["Автоматичне компаундування"]
    P2 --> P3["Преси гарячого спінювання (550+ т/міс)"]
    P3 --> P4["Прецизійний ЧПК розкрій (G-Code)"]
    P4 --> P5["Контроль якості ISO 9001 / CE"]
  end

  subgraph Logistics["🇪🇺 Європейська логістика"]
    direction TB
    L1["Складський хаб у Братиславі"] --> L2["Відвантаження до Німеччини, Польщі, Чехії"]
    L2 --> L3["Доставка клієнту за 48 годин"]
  end

  subgraph AIConsilium["🤖 Цифровий нагляд EvaLine"]
    direction TB
    A1["Адам: Бекенд, кошториси, ЧПК розкрій"]
    A2["Ева: Фронтенд, CRM, 6 мов"]
    A3["Юрист-Логіст: УКТЗЕД, митниця, ISO"]
  end

  AIConsilium -.->|Керування G-кодом| P4
  AIConsilium -.->|Контроль якості| P5
  AIConsilium -.->|Митне оформлення| L1
  P5 ==> L1"""

    m_en = """flowchart LR
  subgraph Plant["🏭 EVA Plant (Chornomorsk, 2.8 ha)"]
    direction TB
    P1["Raw EVA Granules (Borealis/LG)"] --> P2["Automated Compounding & Blending"]
    P2 --> P3["High-Pressure Hot Foaming (550+ t/mo)"]
    P3 --> P4["CNC Precision Plotter Cutting (G-Code)"]
    P4 --> P5["Quality Control ISO 9001 / CE"]
  end

  subgraph Logistics["🇪🇺 European Logistics Hub"]
    direction TB
    L1["Bratislava Central Warehouse"] --> L2["Dispatch to Germany, Poland, Czechia"]
    L2 --> L3["Delivery to customer within 48h"]
  end

  subgraph AIConsilium["🤖 EvaLine Autonomous Supervision"]
    direction TB
    A1["Adam: Backend, specs & CNC G-Code"]
    A2["Eva: Frontend, CRM & client care"]
    A3["Legal Agent: Customs, EU Directives, ISO"]
  end

  AIConsilium -.->|CNC Automation| P4
  AIConsilium -.->|Quality verification| P5
  AIConsilium -.->|Customs clearance| L1
  P5 ==> L1"""

    ascii_art = """+-------------------------------------------------------------------------+
|                ПРОИЗВОДСТВЕННЫЙ КОНВЕЙЕР И AI-КОНТУР                    |
|                                                                         |
|  [Гранулы EVA] --> [Вспенивание] --> [ЧПУ Раскрой] --> [Контроль ISO]  |
|         ^                 ^                ^                 |          |
|         |                 |                |                 v          |
|  +------+-----------------+----------------+--+      [Хаб Братислава]   |
|  |       ЦИФРОВОЙ НАДЗОР EVALINE NETWORK      |              |          |
|  |  • Адам: Контроль G-кода станков ЧПУ       |              v          |
|  |  • Ева: Клиентский сервис и счета          |      [Клиент в ЕС (48ч)]|
|  |  • Юрист: Таможня, накладные, ISO 9001     |                         |
|  +--------------------------------------------+                         |
+-------------------------------------------------------------------------+"""

    return render_infographic_panel(
        "05", "📈",
        "ИНФОГРАФИКА РАЗДЕЛА 05 // БИЗНЕС И ПРОИЗВОДСТВО",
        "ІНФОГРАФІКА РОЗДІЛУ 05 // БІЗНЕС ТА ВИРОБНИЦТВО",
        "SECTION 05 DASHBOARD // PLANT & BUSINESS VALUE",
        "Интеграция цифровых агентов в реальное производство полимеров EVA",
        "Інтеграція цифрових агентів у реальне виробництво полімерів EVA",
        "End-to-End Shopfloor Integration: From Raw Polymer to EU Delivery",
        "Связка физического завода полимеров (550+ т/мес) с AI-агентами Адамом и Евой.",
        "Зв'язка фізичного заводу полімерів (550+ т/міс) з ШІ-агентами Адамом та Евою.",
        "Direct connection between real physical EVA manufacturing (550+ t/mo) and AI agents.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )

# =============================================================================
# 07. ЕДИНАЯ ЭКОСИСТЕМА ДОМЕНОВ И СЕРВИСОВ (Unified Ecosystem & Public Gateways)
# =============================================================================
def get_infographic_07():
    kpis = [
        ("4", "Ключевых домена в федеративной сети", "Ключових домени у федеративній мережі", "Core Production Domains in Mesh",
         "Рабочая станция, Телеметрия, Манифест, Портал", "Робоча станція, Телеметрія, Маніфест, Портал", "AI Workstation, Telemetry, Manifesto, Gateway", "green"),
        ("99.9%", "Целевой SLA доступности терминалов", "Цільовий SLA доступності терміналів", "SLA Availability across Public Endpoints",
         "Резервирование Caddy v2 HTTP/3 и CNAME", "Резервування Caddy v2 HTTP/3 та CNAME", "Global Edge Proxy with sub-second failover", "cyan"),
        ("250 мс", "Потоковый голос EvaVoice API", "Потоковий голос EvaVoice API", "Real-Time EvaVoice API Latency",
         "FastAPI :8000 WebSocket в реальном времени", "FastAPI :8000 WebSocket у реальному часі", "FastAPI bidirectional WebSocket STT/TTS", "purple"),
        ("360+", "Статей документации Quartz", "Статей документації Quartz", "Technical Documentation Articles (Quartz)",
         "Спецификации API, регламенты ТУ и ГОСТ", "Специфікації API, регламенти ТУ та ДСТУ", "Complete architecture specs, APIs & standards", "amber"),
    ]

    m_ru = """graph TD
  Mesh["🌐 ЕДИНАЯ СЕТЬ EVALINE NETWORK"]
  
  Mesh --> D1["💻 evabot.online\\n(Рабочая станция ИИ, Консилиум & Голос)"]
  Mesh --> D2["📊 evaline.network\\n(TUI-Дашборд телеметрии 94 моделей)"]
  Mesh --> D3["📜 evaline.online\\n(Суверенный манифест & Завод ЭВА)"]
  Mesh --> D4["🧭 evaline.website\\n(Единый навигационный портал)"]
  
  D1 --> API1["🎙️ evabot.online/voice/docs\\n(EvaVoice FastAPI :8000)"]
  D1 --> API2["📚 evabot.online/docs/\\n(База знаний Quartz: 360+ статей)"]

  classDef mesh fill:#0d111a,stroke:#00e676,stroke-width:2px,color:#fff;
  classDef node fill:#161f30,stroke:#38bdf8,stroke-width:1.5px,color:#e6edf3;
  classDef sub fill:#111722,stroke:#ffd600,stroke-width:1px,color:#ffd600;
  class Mesh mesh;
  class D1,D2,D3,D4 node;
  class API1,API2 sub;"""

    m_uk = """graph TD
  Mesh["🌐 ЄДИНА МЕРЕЖА EVALINE NETWORK"]
  
  Mesh --> D1["💻 evabot.online\\n(Робоча станція ШІ, Консиліум & Голос)"]
  Mesh --> D2["📊 evaline.network\\n(TUI-Дашборд телеметрії 94 моделей)"]
  Mesh --> D3["📜 evaline.online\\n(Суверенний маніфест & Завод ЕВА)"]
  Mesh --> D4["🧭 evaline.website\\n(Єдиний навігаційний портал)"]
  
  D1 --> API1["🎙️ evabot.online/voice/docs\\n(EvaVoice FastAPI :8000)"]
  D1 --> API2["📚 evabot.online/docs/\\n(База знань Quartz: 360+ статей)"]

  classDef mesh fill:#0d111a,stroke:#00e676,stroke-width:2px,color:#fff;
  classDef node fill:#161f30,stroke:#38bdf8,stroke-width:1.5px,color:#e6edf3;
  classDef sub fill:#111722,stroke:#ffd600,stroke-width:1px,color:#ffd600;
  class Mesh mesh;
  class D1,D2,D3,D4 node;
  class API1,API2 sub;"""

    m_en = """graph TD
  Mesh["🌐 UNIFIED EVALINE NETWORK MESH"]
  
  Mesh --> D1["💻 evabot.online\\n(AI Workstation, Consilium & Voice)"]
  Mesh --> D2["📊 evaline.network\\n(TUI Telemetry Dashboard 94 LLMs)"]
  Mesh --> D3["📜 evaline.online\\n(Sovereign Manifesto & EVA Plant)"]
  Mesh --> D4["🧭 evaline.website\\n(Central Navigation Gateway)"]
  
  D1 --> API1["🎙️ evabot.online/voice/docs\\n(EvaVoice FastAPI :8000)"]
  D1 --> API2["📚 evabot.online/docs/\\n(Quartz Knowledge Base: 360+ Articles)"]

  classDef mesh fill:#0d111a,stroke:#00e676,stroke-width:2px,color:#fff;
  classDef node fill:#161f30,stroke:#38bdf8,stroke-width:1.5px,color:#e6edf3;
  classDef sub fill:#111722,stroke:#ffd600,stroke-width:1px,color:#ffd600;
  class Mesh mesh;
  class D1,D2,D3,D4 node;
  class API1,API2 sub;"""

    ascii_art = """+-------------------------------------------------------------------------+
|                  ЕДИНАЯ ЭКОСИСТЕМА ДОМЕНОВ EVALINE NETWORK              |
+-------------------------------------------------------------------------+
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
   [evabot.online]          [evaline.network]          [evaline.online]
   Рабочая станция ИИ       TUI-Дашборд телеметрии     Суверенный Манифест
   • Чат с Консилиумом      • Задержки 94 моделей      • Философия суверенитета
   • Голос в реальном вр.   • Нагрузка узлов Франкфурт • Завод полимеров 2.8 га
           │                         │                         │
           ├─────────────────────────┼─────────────────────────┤
           ▼                         ▼                         ▼
   [evabot.online/docs/]   [evabot.online/voice/docs]  [evaline.website]
   База знаний Quartz      FastAPI Swagger UI          Главный навигационный
   • 360+ статей ТУ/ГОСТ   • STT/TTS REST & WebSocket  каталог экосистемы
+-------------------------------------------------------------------------+"""

    return render_infographic_panel(
        "07", "🧭",
        "ИНФОГРАФИКА РАЗДЕЛА 07 // КАТАЛОГ ДОМЕНОВ И СЕРВИСОВ",
        "ІНФОГРАФІКА РОЗДІЛУ 07 // КАТАЛОГ ДОМЕНІВ ТА СЕРВІСІВ",
        "SECTION 07 DASHBOARD // UNIFIED ECOSYSTEM & GATEWAYS",
        "Карта взаимосвязи публичных доменов, рабочих станций и API-шлюзов",
        "Карта взаємозв'язку публічних доменів, робочих станцій та API-шлюзів",
        "Interconnected Map of Public Domains, Operator Workstations & API Gateways",
        "Единый периметр из 4 доменов, базы знаний Quartz и интерактивного голосового сервиса EvaVoice.",
        "Єдиний периметр з 4 доменів, бази знань Quartz та інтерактивного голосового сервісу EvaVoice.",
        "Unified operational perimeter linking four public endpoints, Quartz documentation, and real-time voice streaming.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )

def get_onboarding_gantt():
    m_ru = """gantt
  title Дорожная карта интеграции фабрики агентов EvaLine (30 дней)
  dateFormat  YYYY-MM-DD
  axisFormat  %d.%m
  section 1. Экспресс-аудит (Дни 1-7)
  Интервью ключевых специалистов :a1, 2026-10-01, 3d
  Сбор регламентов, ТУ и прайсов :a2, after a1, 4d
  section 2. Суверенное ядро (Дни 8-14)
  Развертывание локального сервера :b1, after a2, 3d
  Индексация RAG (ChromaDB + FTS5)  :b2, after b1, 4d
  section 3. Подключение MCP (Дни 15-21)
  Интеграция с 1С, ERP и базой данных :c1, after b2, 4d
  Настройка прав и контуров защиты    :c2, after c1, 3d
  section 4. Запуск Консилиума (Дни 22-30)
  Обучение операторов и персонала     :d1, after c2, 4d
  Промышленный запуск 24/7            :d2, after d1, 5d"""

    m_uk = """gantt
  title Дорожня карта інтеграції фабрики агентів EvaLine (30 днів)
  dateFormat  YYYY-MM-DD
  axisFormat  %d.%m
  section 1. Експрес-аудит (Дні 1-7)
  Інтерв'ю ключових спеціалістів :a1, 2026-10-01, 3d
  Збір регламентів, ТУ та прайсів :a2, after a1, 4d
  section 2. Суверенне ядро (Дні 8-14)
  Розгортання локального сервера :b1, after a2, 3d
  Індексація RAG (ChromaDB + FTS5)  :b2, after b1, 4d
  section 3. Підключення MCP (Дні 15-21)
  Інтеграція з 1С, ERP та базою даних :c1, after b2, 4d
  Налаштування прав та контурів захисту :c2, after c1, 3d
  section 4. Запуск Консиліуму (Дні 22-30)
  Навчання операторів та персоналу     :d1, after c2, 4d
  Промисловий запуск 24/7              :d2, after d1, 5d"""

    m_en = """gantt
  title EvaLine Agent Factory Implementation Roadmap (30 Days)
  dateFormat  YYYY-MM-DD
  axisFormat  %d.%m
  section 1. Discovery & Audit (Days 1-7)
  Stakeholder interviews & pain audit :a1, 2026-10-01, 3d
  Document & ERP spec ingestion        :a2, after a1, 4d
  section 2. Sovereign Core (Days 8-14)
  Deploy on-prem/cloud node            :b1, after a2, 3d
  RAG Indexing (ChromaDB + FTS5)       :b2, after b1, 4d
  section 3. MCP Tool Hub (Days 15-21)
  Integrate 1C / ERP / CNC tools       :c1, after b2, 4d
  Security sandboxing & permissions    :c2, after c1, 3d
  section 4. Consilium Go-Live (Days 22-30)
  Staff workshops & shadow runs        :d1, after c2, 4d
  24/7 Autonomous Production Go-Live   :d2, after d1, 5d"""

    mermaid_block = t(
        f'<div class="mermaid">{m_ru}</div>',
        f'<div class="mermaid">{m_uk}</div>',
        f'<div class="mermaid">{m_en}</div>',
        tag="div",
        cls="mermaid-lang"
    )

    ascii_art = """+-------------------------------------------------------------------------+
|               4 ФАЗЫ ВНЕДРЕНИЯ ПОД КЛЮЧ ЗА 30 ДНЕЙ                      |
|                                                                         |
|  [ФАЗА 1: ДНИ 1-7]    Интервью, сбор ТУ, оцифровка документации         |
|  [ФАЗА 2: ДНИ 8-14]   Установка суверенного сервера и индексация RAG    |
|  [ФАЗА 3: ДНИ 15-21]  Подключение 21 MCP к 1С/ERP и станкам ЧПУ         |
|  [ФАЗА 4: ДНИ 22-30]  Обучение команды и ввод Консилиума 24/7 в строй   |
+-------------------------------------------------------------------------+"""

    if getattr(helpers, 'INCLUDE_MERMAID', True):
        return f'''      <!-- Gantt Implementation Roadmap Box -->
      <div class="diagram-box" style="margin-top: 24px;">
        <div class="diagram-box-header">
          <div class="diagram-box-title">
            <span class="diagram-pulse-dot"></span>
            <strong>{t("ДИАГРАММА ГАНТА // ДОРОЖНАЯ КАРТА ВНЕДРЕНИЯ ЗА 30 ДНЕЙ", "ДІАГРАМА ГАНТА // ДОРОЖНЯ КАРТА ВПРОВАДЖЕННЯ ЗА 30 ДНІВ", "GANTT CHART // 30-DAY IMPLEMENTATION ROADMAP")}</strong>
          </div>
          <span class="diagram-badge">Mermaid.js Gantt</span>
        </div>
        <div class="diagram-canvas">
          {mermaid_block}
        </div>
        <details class="ascii-toggle" open>
          <summary class="ascii-toggle-btn"><strong>📟 {t("Текстовый график внедрения (ASCII)", "Текстовий графік впровадження (ASCII)", "Implementation text schedule (ASCII)")}</strong></summary>
          <pre class="ascii-diagram" style="font-family: 'Roboto Mono', monospace; font-size: 0.82rem; overflow-x: auto; background: #07090e; color: #00e676; padding: 14px; border: 1px solid #1c2333; border-radius: 8px; line-height: 1.25;">{ascii_art}</pre>
        </details>
      </div>'''
    else:
        return f'''      <!-- Gantt Implementation Roadmap Box (Text Monospace) -->
      <div class="diagram-box" style="margin-top: 24px;">
        <div class="diagram-box-header">
          <div class="diagram-box-title">
            <strong>{t("ГРАФИК ВНЕДРЕНИЯ (ASCII)", "ГРАФІК ВПРОВАДЖЕННЯ (ASCII)", "IMPLEMENTATION SCHEDULE (ASCII)")}</strong>
          </div>
        </div>
        <details class="ascii-toggle" open>
          <summary class="ascii-toggle-btn"><strong>📟 {t("Текстовый график внедрения (ASCII)", "Текстовий графік впровадження (ASCII)", "Implementation text schedule (ASCII)")}</strong></summary>
          <pre class="ascii-diagram" style="font-family: 'Roboto Mono', monospace; font-size: 0.82rem; overflow-x: auto; background: #07090e; color: #00e676; padding: 14px; border: 1px solid #1c2333; border-radius: 8px; line-height: 1.25;">{ascii_art}</pre>
        </details>
      </div>'''

# =============================================================================
# 07. СУВЕРЕННАЯ ИНФРАСТРУКТУРА (Sovereign Dual-Node Infrastructure)
# =============================================================================
def get_infographic_06():
    kpis = [
        ("99.9%", "Целевой аптайм кластера", "Цільовий аптайм кластера", "Cluster SLA Availability",
         "Двухузловая топология Франкфурт + Айова", "Двовузлова топологія Франкфурт + Айова", "Dual-node active mesh: Frankfurt + Iowa", "green"),
        ("129 ms", "Сквозная задержка WireGuard Mesh", "Наскрізна затримка WireGuard Mesh", "WireGuard Interconnect Latency",
         "Шифрование ChaCha20-Poly1305 в ядре Linux", "Шифрування ChaCha20-Poly1305 в ядрі Linux", "Kernel-level ChaCha20-Poly1305 tunnel", "cyan"),
        ("HTTP/3", "Современный протокол QUIC (Caddy)", "Сучасний протокол QUIC (Caddy)", "Caddy Edge HTTP/3 QUIC",
         "Защита от DDoS и ранний ответ без задержек", "Захист від DDoS та рання відповідь без затримок", "Zero-RTT TLS 1.3 with upstream keep-alive", "purple"),
        ("32 GB", "Оперативной памяти в вычислительном ядре", "Оперативної пам'яті у ядрі обчислень", "Compute Core Dedicated RAM",
         "8 vCPU, локальный NVMe, защита EarlyOOM", "8 vCPU, локальний NVMe, захист EarlyOOM", "8 vCPU, local NVMe storage & earlyoom daemons", "amber"),
    ]

    m_ru = """flowchart TD
  Client(["Клиент / Web / CLI / WhatsApp / SIP"]) -->|HTTPS HTTP/3 QUIC| Edge["Edge Node: evaline-micro-vm (Айова)"]
  
  subgraph EdgeLayer["Пограничный шлюз (Iowa Edge)"]
    Edge --> Caddy["Caddy v2: SSL, DDoS фильтр, Early Response"]
  end
  
  Caddy -->|"Шифрованный туннель WireGuard Mesh (129ms)"| Core["Compute Core: evabot-agent-vm (Франкфурт)"]
  
  subgraph CoreLayer["Вычислительное ядро (Frankfurt Core)"]
    Core --> CoreServer["Node.js / TypeScript Server :3000"]
    CoreServer --> EngineConsilium["Движок Консилиума"]
    CoreServer --> MCPSuite["21 MCP Сервер (Docker, Bash, Git, DBs)"]
    CoreServer --> LocalRAG["Локальная память: ChromaDB + SQLite FTS5"]
  end
  
  CoreLayer -.->|VPN канал| FactoryFloor["ЧПУ станки завода Черноморск"]
  CoreLayer -.->|API шлюз| EUWarehouse["Хаб Братислава (ЕС)"]"""

    m_uk = """flowchart TD
  Client(["Клієнт / Web / CLI / WhatsApp / SIP"]) -->|HTTPS HTTP/3 QUIC| Edge["Edge Node: evaline-micro-vm (Айова)"]
  
  subgraph EdgeLayer["Пограничний шлюз (Iowa Edge)"]
    Edge --> Caddy["Caddy v2: SSL, DDoS фільтр, Early Response"]
  end
  
  Caddy -->|"Шифрований тунель WireGuard Mesh (129ms)"| Core["Compute Core: evabot-agent-vm (Франкфурт)"]
  
  subgraph CoreLayer["Обчислювальне ядро (Frankfurt Core)"]
    Core --> CoreServer["Node.js / TypeScript Server :3000"]
    CoreServer --> EngineConsilium["Двигун Консиліуму"]
    CoreServer --> MCPSuite["21 MCP Сервер (Docker, Bash, Git, DBs)"]
    CoreServer --> LocalRAG["Локальна пам'ять: ChromaDB + SQLite FTS5"]
  end
  
  CoreLayer -.->|VPN канал| FactoryFloor["ЧПК верстати заводу Чорноморськ"]
  CoreLayer -.->|API шлюз| EUWarehouse["Хаб Братислава (ЄС)"]"""

    m_en = """flowchart TD
  Client(["Client / Web / CLI / WhatsApp / SIP"]) -->|HTTPS HTTP/3 QUIC| Edge["Edge Node: evaline-micro-vm (Iowa)"]
  
  subgraph EdgeLayer["Edge Security Layer (Iowa Edge)"]
    Edge --> Caddy["Caddy v2: SSL, DDoS Mitigation, Early Response"]
  end
  
  Caddy -->|"Encrypted WireGuard Mesh Tunnel (129ms)"| Core["Compute Core: evabot-agent-vm (Frankfurt)"]
  
  subgraph CoreLayer["Dedicated Core (Frankfurt Compute Node)"]
    Core --> CoreServer["Node.js / TypeScript Server :3000"]
    CoreServer --> EngineConsilium["Consilium Multi-Agent Engine"]
    CoreServer --> MCPSuite["21 MCP Servers (Docker, Bash, Git, DBs)"]
    CoreServer --> LocalRAG["Sovereign RAG: ChromaDB + SQLite FTS5"]
  end
  
  CoreLayer -.->|Encrypted VPN| FactoryFloor["CNC Plotters at Chornomorsk Plant"]
  CoreLayer -.->|API Gateway| EUWarehouse["Bratislava EU Warehouse"]"""

    ascii_art = """+-------------------------------------------------------------------------+
|                  СУВЕРЕННЫЙ ДВУХУЗЛОВОЙ КЛАСТЕР WIREGUARD               |
|                                                                         |
|  [Интернет-клиенты]                                                     |
|         | (HTTPS / HTTP/3 QUIC)                                         |
|         v                                                               |
|  [EDGE-УЗЕЛ: АЙОВА] ----(WireGuard Mesh: 129ms)----> [CORE: ФРАНКФУРТ]  |
|  • Caddy v2 Reverse Proxy                           • 8 vCPU, 32 GB RAM |
|  • Фильтрация DDoS                                  • Движок Консилиума |
|  • Статический кеш                                  • 21 MCP сервер     |
|                                                     • ChromaDB + FTS5   |
|                                                              |          |
|         +----------------------------------------------------+          |
|         v                                                    v          |
|  [Завод EVA: Черноморск]                             [Хаб: Братислава]  |
+-------------------------------------------------------------------------+"""

    return render_infographic_panel(
        "06", "🌐",
        "ИНФОГРАФИКА РАЗДЕЛА 06 // ИНФРАСТРУКТУРА",
        "ІНФОГРАФІКА РОЗДІЛУ 06 // ІНФРАСТРУКТУРА",
        "SECTION 06 DASHBOARD // CLOUD ARCHITECTURE",
        "Топология суверенного двухузлового кластера Франкфурт ⟷ Айова",
        "Топологія суверенного двовузлового кластера Франкфурт ⟷ Айова",
        "Dual-Node Sovereign Topology: Frankfurt Core ⟷ Iowa Edge",
        "Вычислительный узел в Германии, защитный пограничный шлюз в США и магистраль WireGuard Mesh.",
        "Обчислювальний вузол у Німеччині, захисний пограничний шлюз у США та магістраль WireGuard Mesh.",
        "High-performance compute core in Frankfurt connected to low-latency Iowa edge via encrypted WireGuard mesh.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )

# =============================================================================
# 08. АРХИТЕКТУРА СИСТЕМЫ И ТЕТРАКСИС (System Architecture & Tetraktys)
# =============================================================================
def get_infographic_08():
    kpis = [
        ("10", "Универсальных должностей цифрового штата", "Універсальних посад цифрового штату", "Universal Digital Job Positions",
         "От Главного Архитектора до Мастера ЧПУ", "Від Головного Архітектора до Майстра ЧПК", "Direct alignment from Chief Architect to CNC Master", "green"),
        ("1+2+3+4", "Сакральный Тетраксис Пифагора (=10)", "Сакральний Тетраксис Піфагора (=10)", "Pythagorean Tetraktys (1+2+3+4=10)",
         "4 гармоничных яруса управления", "4 гармонійних яруси управління", "Four harmonious organisational tiers", "cyan"),
        ("10", "Ступеней Древа Сфирот", "Ступенів Дерева Сфірот", "Sephirot Emanation Stages",
         "От Кетер (Замысел) до Малхут (Физический мир)", "Від Кетер (Задум) до Малхут (Фізичний світ)", "From Kether (Vision) down to Malkuth (Physical Plant)", "purple"),
        ("0%", "Конфликтов и дублирования зон", "Конфліктів та дублювання зон", "Zero Role Collision or Ambiguity",
         "Строгие математические и правовые границы", "Суворі математичні та правові межі", "Deterministic responsibility boundaries across all agents", "amber"),
    ]

    m_ru = """graph TD
  K["01. Архитектор // Кетер (Vision & Аксиомы)"]
  B["02. Адам // Бина (Бэкенд & Безопасность & Производство)"]
  C["03. Ева // Хокма (Фронтенд & Лицо компании)"]
  T["04. Арбитр // Тиферет (Консилиум 99.4%)"]
  N["05. Разработчик // Нецах (Код & Git)"]
  H["06. Коммуникатор // Ход (Voice Engine)"]
  Y["07. Хранитель // Йесод (ChromaDB / RAG)"]
  S["08. SRE Админ // Оболочка (WireGuard Mesh)"]
  L["09. Юрист // Врата (УКТВЭД & Compliance)"]
  M["10. Мастер ЧПУ // Малхут (Цех Черноморск)"]

  K --> B & C
  B --> T & N
  C --> T & H
  T --> Y
  N --> S
  H --> L
  Y & S & L --> M

  classDef t1 fill:#1c2333,stroke:#ffd600,stroke-width:2px,color:#ffd600;
  classDef t2 fill:#1c2333,stroke:#38bdf8,stroke-width:2px,color:#38bdf8;
  classDef t3 fill:#1c2333,stroke:#00e5ff,stroke-width:2px,color:#00e5ff;
  classDef t4 fill:#1c2333,stroke:#00e676,stroke-width:2px,color:#00e676;
  class K t1;
  class B,C t2;
  class T,N,H t3;
  class Y,S,L,M t4;"""

    m_uk = """graph TD
  K["01. Архітектор // Кетер (Vision & Аксіоми)"]
  B["02. Адам // Біна (Бекенд & Безпека & Виробництво)"]
  C["03. Ева // Хокма (Фронтенд & Обличчя компанії)"]
  T["04. Арбітр // Тіферет (Консиліум 99.4%)"]
  N["05. Розробник // Нецах (Код & Git)"]
  H["06. Комунікатор // Ход (Voice Engine)"]
  Y["07. Хранитель // Йесод (ChromaDB / RAG)"]
  S["08. SRE Адмін // Оболонка (WireGuard Mesh)"]
  L["09. Юрист // Брама (УКТЗЕД & Compliance)"]
  M["10. Майстер ЧПК // Малхут (Цех Чорноморськ)"]

  K --> B & C
  B --> T & N
  C --> T & H
  T --> Y
  N --> S
  H --> L
  Y & S & L --> M

  classDef t1 fill:#1c2333,stroke:#ffd600,stroke-width:2px,color:#ffd600;
  classDef t2 fill:#1c2333,stroke:#38bdf8,stroke-width:2px,color:#38bdf8;
  classDef t3 fill:#1c2333,stroke:#00e5ff,stroke-width:2px,color:#00e5ff;
  classDef t4 fill:#1c2333,stroke:#00e676,stroke-width:2px,color:#00e676;
  class K t1;
  class B,C t2;
  class T,N,H t3;
  class Y,S,L,M t4;"""

    m_en = """graph TD
  K["01. Architect // Kether (Vision & Axioms)"]
  B["02. Adam // Binah (Backend & Security & Production)"]
  C["03. Eva // Chokmah (Frontend & Company Face)"]
  T["04. Arbiter // Tifereth (Consilium 99.4%)"]
  N["05. Lead Dev // Netzach (Code & Git)"]
  H["06. Voice Spec // Hod (Voice Engine)"]
  Y["07. Memory RAG // Yesod (ChromaDB / RAG)"]
  S["08. SRE Admin // Yesod Shield (WireGuard)"]
  L["09. Legal // Malkuth Gate (Compliance)"]
  M["10. CNC Master // Malkuth (Physical Plant)"]

  K --> B & C
  B --> T & N
  C --> T & H
  T --> Y
  N --> S
  H --> L
  Y & S & L --> M

  classDef t1 fill:#1c2333,stroke:#ffd600,stroke-width:2px,color:#ffd600;
  classDef t2 fill:#1c2333,stroke:#38bdf8,stroke-width:2px,color:#38bdf8;
  classDef t3 fill:#1c2333,stroke:#00e5ff,stroke-width:2px,color:#00e5ff;
  classDef t4 fill:#1c2333,stroke:#00e676,stroke-width:2px,color:#00e676;
  class K t1;
  class B,C t2;
  class T,N,H t3;
  class Y,S,L,M t4;"""

    # Interactive SVG Tetraktys Pyramid with 10 glowing nodes
    svg_pyramid = f'''      <div class="tetraktys-svg-card">
        <div class="tetraktys-svg-header">
          <span class="tetraktys-svg-title">{t("САКРАЛЬНАЯ ПИРАМИДА ТЕТРАКСИСА (1 + 2 + 3 + 4 = 10)", "САКРАЛЬНА ПІРАМІДА ТЕТРАКСИСА (1 + 2 + 3 + 4 = 10)", "SACRED TETRAKTYS PYRAMID (1 + 2 + 3 + 4 = 10)")}</span>
          <span class="diagram-tag">SVG Vector // 10 Nodes</span>
        </div>
        <div style="display: flex; justify-content: center; padding: 20px 10px;">
          <svg viewBox="0 0 700 480" style="max-width: 680px; width: 100%; height: auto; filter: drop-shadow(0 0 15px rgba(0,230,118,0.15));">
            <defs>
              <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffd600" stop-opacity="0.6"/>
                <stop offset="50%" stop-color="#00e5ff" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#00e676" stop-opacity="0.6"/>
              </linearGradient>
            </defs>

            <!-- CONNECTIONS -->
            <line x1="350" y1="60" x2="260" y2="170" stroke="url(#lineGrad)" stroke-width="2" stroke-dasharray="4,4"/>
            <line x1="350" y1="60" x2="440" y2="170" stroke="url(#lineGrad)" stroke-width="2" stroke-dasharray="4,4"/>
            <line x1="260" y1="170" x2="440" y2="170" stroke="url(#lineGrad)" stroke-width="1.5"/>
            
            <line x1="260" y1="170" x2="180" y2="280" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="260" y1="170" x2="350" y2="280" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="440" y1="170" x2="350" y2="280" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="440" y1="170" x2="520" y2="280" stroke="url(#lineGrad)" stroke-width="1.5"/>
            
            <line x1="180" y1="280" x2="110" y2="390" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="180" y1="280" x2="270" y2="390" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="350" y1="280" x2="270" y2="390" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="350" y1="280" x2="430" y2="390" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="520" y1="280" x2="430" y2="390" stroke="url(#lineGrad)" stroke-width="1.5"/>
            <line x1="520" y1="280" x2="590" y2="390" stroke="url(#lineGrad)" stroke-width="1.5"/>

            <!-- TIER I: MONAD (1 NODE) -->
            <g class="svg-node" transform="translate(350, 60)">
              <circle r="36" fill="#141c2b" stroke="#ffd600" stroke-width="3"/>
              <circle r="42" fill="none" stroke="#ffd600" stroke-width="1" opacity="0.4"/>
              <text text-anchor="middle" y="-6" fill="#ffd600" font-family="'Roboto', sans-serif" font-size="12" font-weight="700">01. АРХИТЕКТОР</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="10">Кетер (Kether)</text>
              <text text-anchor="middle" y="24" fill="#ffd600" font-size="11">👑 РЯД I: МОНАДА</text>
            </g>

            <!-- TIER II: DYAD (2 NODES) -->
            <g class="svg-node" transform="translate(260, 170)">
              <circle r="34" fill="#141c2b" stroke="#f87171" stroke-width="2.5"/>
              <text text-anchor="middle" y="-6" fill="#fff" font-family="'Roboto', sans-serif" font-size="12" font-weight="700">02. АДАМ (CISO)</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="10">Бина / Гевура</text>
              <text text-anchor="middle" y="22" fill="#f87171" font-size="10">🛡️ Строгость</text>
            </g>

            <g class="svg-node" transform="translate(440, 170)">
              <circle r="34" fill="#141c2b" stroke="#38bdf8" stroke-width="2.5"/>
              <text text-anchor="middle" y="-6" fill="#fff" font-family="'Roboto', sans-serif" font-size="12" font-weight="700">03. ЕВА (CXO)</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="10">Хокма / Хесед</text>
              <text text-anchor="middle" y="22" fill="#38bdf8" font-size="10">🤝 Мудрость</text>
            </g>

            <!-- TIER III: TRIAD (3 NODES) -->
            <g class="svg-node" transform="translate(180, 280)">
              <circle r="32" fill="#141c2b" stroke="#00e5ff" stroke-width="2"/>
              <text text-anchor="middle" y="-5" fill="#fff" font-family="'Roboto', sans-serif" font-size="11" font-weight="700">04. АРБИТР</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="9.5">Тиферет</text>
              <text text-anchor="middle" y="22" fill="#00e5ff" font-size="9.5">⚖️ Синтез</text>
            </g>

            <g class="svg-node" transform="translate(350, 280)">
              <circle r="32" fill="#141c2b" stroke="#00e5ff" stroke-width="2"/>
              <text text-anchor="middle" y="-5" fill="#fff" font-family="'Roboto', sans-serif" font-size="11" font-weight="700">05. РАЗРАБОТЧИК</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="9.5">Нецах</text>
              <text text-anchor="middle" y="22" fill="#00e5ff" font-size="9.5">⚡ Код / Git</text>
            </g>

            <g class="svg-node" transform="translate(520, 280)">
              <circle r="32" fill="#141c2b" stroke="#00e5ff" stroke-width="2"/>
              <text text-anchor="middle" y="-5" fill="#fff" font-family="'Roboto', sans-serif" font-size="11" font-weight="700">06. ГОЛОС / ХОД</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="9.5">Ход</text>
              <text text-anchor="middle" y="22" fill="#00e5ff" font-size="9.5">🎙️ Речь</text>
            </g>

            <!-- TIER IV: TETRAD (4 NODES) -->
            <g class="svg-node" transform="translate(110, 390)">
              <circle r="30" fill="#141c2b" stroke="#00e676" stroke-width="2"/>
              <text text-anchor="middle" y="-4" fill="#fff" font-family="'Roboto', sans-serif" font-size="10.5" font-weight="700">07. ПАМЯТЬ</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="9">Йесод</text>
              <text text-anchor="middle" y="21" fill="#00e676" font-size="9">💾 RAG</text>
            </g>

            <g class="svg-node" transform="translate(270, 390)">
              <circle r="30" fill="#141c2b" stroke="#00e676" stroke-width="2"/>
              <text text-anchor="middle" y="-4" fill="#fff" font-family="'Roboto', sans-serif" font-size="10.5" font-weight="700">08. SRE / DEVOPS</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="9">Оболочка</text>
              <text text-anchor="middle" y="21" fill="#00e676" font-size="9">🔧 Сеть</text>
            </g>

            <g class="svg-node" transform="translate(430, 390)">
              <circle r="30" fill="#141c2b" stroke="#00e676" stroke-width="2"/>
              <text text-anchor="middle" y="-4" fill="#fff" font-family="'Roboto', sans-serif" font-size="10.5" font-weight="700">09. ЮРИСТ</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="9">Врата</text>
              <text text-anchor="middle" y="21" fill="#00e676" font-size="9">📜 Нормы</text>
            </g>

            <g class="svg-node" transform="translate(590, 390)">
              <circle r="30" fill="#141c2b" stroke="#00e676" stroke-width="2.5"/>
              <circle r="35" fill="none" stroke="#00e676" stroke-width="1" opacity="0.4"/>
              <text text-anchor="middle" y="-4" fill="#00e676" font-family="'Roboto', sans-serif" font-size="10.5" font-weight="700">10. МАСТЕР ЧПУ</text>
              <text text-anchor="middle" y="10" fill="#8b949e" font-family="'Roboto Mono', monospace" font-size="9">Малхут</text>
              <text text-anchor="middle" y="21" fill="#00e676" font-size="9">🏭 Завод</text>
            </g>
          </svg>
        </div>
      </div>'''

    ascii_art = """                      ▲ [РЯД I: МОНАДА — 1 УЗЕЛ]
               01. Архитектор (Chief Architect)
                             Кетер
                               │
                 ▲                           ▲ [РЯД II: ДИАДА — 2 УЗЛА]
     02. Адам (Бэкенд/ЧПУ)              03. Ева (UI / Лицо)
         Бина / Гевура                      Хокма / Хесед
               │                                   │
          ▲                     ▲                     ▲ [РЯД III: ТРИАДА — 3 УЗЛА]
04. Арбитр Консилиума   05. Разработчик (Код)    06. Голос (Ход)
       Тиферет                 Нецах                 Ход
          │                       │                   │
    ▲               ▲                     ▲                  ▲ [РЯД IV: ТЕТРАДА — 4 УЗЛА]
07. Память      08. SRE / DevOps      09. Юрист        10. Мастер ЧПУ
 (ChromaDB)     (WireGuard Mesh)     (Compliance)      (Цех Черноморск)
    Йесод        Оболочка Йесод      Врата Малхут           Малхут"""

    return render_infographic_panel(
        "08", "📐",
        "ИНФОГРАФИКА РАЗДЕЛА 08 // ТЕТРАКСИС И СФИРОТ",
        "ІНФОГРАФІКА РОЗДІЛУ 08 // ТЕТРАКСИС ТА СФІРОТ",
        "SECTION 08 DASHBOARD // TETRAKTYS & SEPHIROT",
        "Сакральная пирамида Тетраксиса Пифагора (1 + 2 + 3 + 4 = 10) и Сфирот",
        "Сакральна піраміда Тетраксиса Піфагора (1 + 2 + 3 + 4 = 10) та Сфірот",
        "Sacred Pythagorean Tetraktys Pyramid (1 + 2 + 3 + 4 = 10) and Sephirot",
        "10 универсальных должностей цифрового штата в строгой геометрической и метафизической гармонии.",
        "10 універсальних посад цифрового штату в суворій геометричній та метафізичній гармонії.",
        "10 universal digital enterprise roles arranged in sacred geometric and metaphysical harmony.",
        kpis, m_ru, m_uk, m_en, ascii_art, extra_html=svg_pyramid
    )

# =============================================================================
# 09. ГЛОССАРИЙ ТЕРМИНОВ (Glossary Mindmap)
# =============================================================================
def get_infographic_09():
    kpis = [
        ("20", "Базовых понятий в глоссарии", "Базових понять у глосарії", "Core Enterprise Concepts",
         "С простыми аналогиями и точными тех. ТУ", "З простими аналогіями та точними тех. ТУ", "Plain-human analogies + technical rigor", "cyan"),
        ("4", "Категории терминов", "Категорії термінів", "Term Categories",
         "Нейросети, Инфраструктура, Производство, Бизнес", "Нейромережі, Інфраструктура, Виробництво, Бізнес", "AI, Infrastructure, EVA Plant, Business ROI", "green"),
        ("100%", "Понимание для инвесторов и цеха", "Розуміння для інвесторів та цеху", "Accessibility for Stakeholders",
         "Доступный язык без заумной терминологии", "Доступна мова без надмірної термінології", "Crystal clarity for boardrooms and shopfloors alike", "amber"),
        ("3", "Языка терминологической базы", "Мови термінологічної бази", "Languages in Knowledge Base",
         "Русский, Українська, English", "Русский, Українська, English", "Russian, Ukrainian, English", "purple"),
    ]

    m_ru = """mindmap
  root((Глоссарий EvaLine))
    Искусственный Интеллект
      Консилиум (Состязательный арбитраж)
      Автономный агент (Цифровой сотрудник)
      LLM Модели (94 нейросети)
      Память RAG (Векторы + Графы)
      Протокол MCP (21 сервер инструментов)
    Инфраструктура и Защита
      WireGuard Mesh (Шифрованный туннель)
      Суверенный кластер (Франкфурт + Айова)
      Edge Caddy v2 (HTTP/3 и DDoS фильтр)
      Circuit Breaker (120ms переключение)
    Производство Полимеров
      Сэвилен (Сополимер EVA)
      Завод Черноморск (2.8 га, 550+ т/мес)
      ЧПУ плоттеры (Раскрой ковриков и матов)
      Прессы горячего формования
    Бизнес и Стандарты
      Zero Vendor Lock-in (Независимость)
      TCO Окупаемость (Возврат инвестиций)
      ISO 9001 (Стандарты качества)
      УКТВЭД (Европейская таможня)"""

    m_uk = """mindmap
  root((Глосарій EvaLine))
    Штучний Інтелект
      Консиліум (Змагальний арбітраж)
      Автономний агент (Цифровий співробітник)
      LLM Моделі (94 нейромережі)
      Пам'ять RAG (Вектори + Графи)
      Протокол MCP (21 сервер інструментів)
    Інфраструктура та Захист
      WireGuard Mesh (Шифрований тунель)
      Суверенний кластер (Франкфурт + Айова)
      Edge Caddy v2 (HTTP/3 та DDoS фільтр)
      Circuit Breaker (120ms перемикання)
    Виробництво Полімерів
      Севілен (Співполімер EVA)
      Завод Чорноморськ (2.8 га, 550+ т/міс)
      ЧПК плотери (Розкрій килимків та матів)
      Преси гарячого формування
    Бізнес та Стандарти
      Zero Vendor Lock-in (Незалежність)
      TCO Окупність (Повернення інвестицій)
      ISO 9001 (Стандарти якості)
      УКТЗЕД (Європейська митниця)"""

    m_en = """mindmap
  root((EvaLine Glossary))
    Artificial Intelligence
      Consilium (Adversarial Deliberation)
      Autonomous Agent (Digital Employee)
      LLM Models (94-model unified fleet)
      RAG Memory (ChromaDB + SQLite FTS5)
      MCP Protocol (21 tool servers)
    Infrastructure & Security
      WireGuard Mesh (ChaCha20-Poly1305)
      Sovereign Cluster (Frankfurt + Iowa)
      Edge Caddy v2 (HTTP/3 QUIC & DDoS)
      Circuit Breaker (120ms failover)
    Polymer Manufacturing
      Sevilen (EVA Copolymer)
      Chornomorsk Plant (2.8 ha, 550+ t/mo)
      CNC Plotters (G-Code cutting)
      High-Pressure Hot Foaming
    Business & Standards
      Zero Vendor Lock-in (Sovereignty)
      TCO & ROI (Rapid Payback)
      ISO 9001 (European Quality CE)
      Customs & Tariffs (Bratislava Hub)"""

    ascii_art = """+-------------------------------------------------------------------------+
|                  ИНТЕЛЛЕКТ-КАРТА ГЛОССАРИЯ EVALINE                      |
|                                                                         |
|  [НЕЙРОСЕТИ & АГЕНТЫ]       [ИНФРАСТРУКТУРА & ЗАЩИТА]                   |
|  • Консилиум (Арбитраж)     • WireGuard Mesh (129ms)                    |
|  • Автономный агент         • Caddy v2 Edge (HTTP/3)                    |
|  • 94 Модели (Free/Paid)    • Circuit Breaker (120ms)                   |
|  • Память RAG               • Суверенное облако                         |
|                                                                         |
|  [ПРОИЗВОДСТВО EVA]         [БИЗНЕС И СТАНДАРТЫ]                        |
|  • Сэвилен (Гранулы)        • Zero Vendor Lock-in                       |
|  • Завод Черноморск         • TCO / Окупаемость                         |
|  • ЧПУ Раскрой              • ISO 9001 / CE                             |
|  • Прессы 550 т/мес         • УКТВЭД / Хаб Братислава                   |
+-------------------------------------------------------------------------+"""

    return render_infographic_panel(
        "09", "📖",
        "ИНФОГРАФИКА РАЗДЕЛА 09 // НАВИГАТОР ТЕРМИНОВ",
        "ІНФОГРАФІКА РОЗДІЛУ 09 // НАВІГАТОР ТЕРМІНІВ",
        "SECTION 09 DASHBOARD // CONCEPT TAXONOMY",
        "Интеллект-карта глоссария: 20 ключевых понятий по 4 направлениям",
        "Інтелект-карта глосарію: 20 ключових понять за 4 напрямками",
        "Concept Taxonomy Mind Map: 20 Core Concepts Across 4 Domains",
        "Быстрая навигация по ключевым технологическим, производственным и бизнес-терминам фабрики EvaLine.",
        "Швидка навігація за ключовими технологічними, виробничими та бізнес-термінами фабрики EvaLine.",
        "Instant visual navigation across core technological, manufacturing and business terms of the EvaLine ecosystem.",
        kpis, m_ru, m_uk, m_en, ascii_art
    )
