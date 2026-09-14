#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import os
import sys
import json
import shutil

sys.path.append('/home/evabot')
sys.path.append('/home/evabot/manifesto_builder')

import helpers
import css_styles
import nav_and_hero
import sections_01_03
import sections_04_07
import section_08
import section_09
import models_renderer
import footer_and_scripts

# =========================================================================
# PATCH-ONLY ADDITIONS — injected at build time so they survive any edits to
# css_styles.py / nav_and_hero.py. (book/linear responsive layer + hub->trillion formula)
# =========================================================================
BOOK_CSS = """
    /* ================= MODULAR RESPONSIVE BOOK LAYER ================= */
    .container { max-width: min(980px, 100%) !important; }
    .kpi-table { table-layout: fixed; width: 100% !important; max-width: 100% !important; min-width: 0; }
    .kpi-table th, .kpi-table td { overflow-wrap: anywhere; word-break: break-word; min-width: 0; }
    .kpi-table { font-size: 0.92rem; }
    .table-responsive, .matrix-controls, .search-sort-bar, .accordion-content,
    .sub-content, .sub-accordion, .diagram-canvas, .infographic-panel, .ascii-diagram {
      max-width: 100%; min-width: 0; box-sizing: border-box;
    }
    .table-responsive, .accordion-content, .sub-content, .ascii-diagram {
      overflow-x: auto; -webkit-overflow-scrolling: touch;
    }
    .search-sort-bar, .matrix-controls { flex-wrap: wrap; gap: 10px; }
    .search-sort-bar input, .search-sort-bar select, .search-sort-bar button,
    .matrix-controls input, .matrix-controls select, .matrix-controls button {
      max-width: 100%; min-width: 0; box-sizing: border-box;
    }
    .formula-line {
      font-family: var(--font-mono, ui-monospace, monospace);
      font-size: clamp(0.9rem, 2.6vw, 1.25rem);
      line-height: 1.55;
      overflow-wrap: anywhere; word-break: break-word;
    }
    .section-header { flex-wrap: wrap; align-items: center; gap: 8px; }
    @media (max-width: 900px) {
      [class*="grid"], [class*="cards"], [class*="columns"], [class*="cols-"] {
        grid-template-columns: 1fr !important;
      }
      .comparison-table, .comparison-table thead, .comparison-table tbody,
      .comparison-table tr, .comparison-table th, .comparison-table td {
        display: block; width: 100%; box-sizing: border-box;
      }
      .comparison-table thead { display: none; }
      .comparison-table td {
        border: none; border-bottom: 1px solid var(--border, rgba(255,255,255,0.12));
        padding: 10px 12px;
      }
      .comparison-table td::before {
        content: attr(data-label);
        display: block; font-family: var(--font-mono, ui-monospace, monospace);
        font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em;
        color: var(--fg-subtle, rgba(255,255,255,0.5)); margin-bottom: 4px;
      }
    }
    @media (max-width: 640px) {
      body { font-size: 15px; }
      .kpi-table { font-size: 0.82rem; }
      .kpi-table th, .kpi-table td { padding: 8px 10px; }
      .ascii-diagram { font-size: 0.66rem; padding: 10px; }
      .formula-line { font-size: 0.95rem; }
    }
"""

def get_formula_html():
    t = helpers.t
    return f"""
  <!-- FORMULA: ONE HUB -> A TRILLION -->
  <section class="section" id="formula-trillion">
    <div class="section-header">
      <div class="section-num">00</div>
      <h2 class="section-title">{t("Формула: от одного центра до триллиона",
        "Формула: від одного центру до трильйона",
        "Formula: From One Hub to a Trillion")}</h2>
    </div>

    <div class="infographic-panel">
      <p class="formula-line">{t("1 центральный хаб → 10 заводов → 100 агентств → 1 000 клиентов → 10 000 агентов → 100 000 сделок → 1 000 000 транзакций → 10 000 000 кликов трафика → 100 000 000 маржинальных операций → 1 000 000 000 000 $ кумулятивного оборота",
        "1 центральний хаб → 10 заводів → 100 агентств → 1 000 клієнтів → 10 000 агентів → 100 000 угод → 1 000 000 транзакцій → 10 000 000 кліків трафіку → 100 000 000 маржинальних операцій → 1 000 000 000 000 $ кумулятивного обороту",
        "1 central hub → 10 plants → 100 agencies → 1,000 clients → 10,000 agents → 100,000 deals → 1,000,000 transactions → 10,000,000 traffic clicks → 100,000,000 margin operations → $1,000,000,000,000 cumulative turnover")}</p>
      <p>{t("Каждый следующий уровень удваивает сеть через три линии монетизации, поэтому один центр со временем достигает триллионного масштаба.",
        "Кожен наступний рівень подвоює мережу через три лінії монетизації, тому один центр з часом досягає трильйонного масштабу.",
        "Each level compounds the network across three monetisation lines, so a single hub naturally scales to a trillion-dollar footprint.")}</p>
    </div>

    <h3 class="section-title" style="font-size:1.1rem;margin:18px 0 10px;">{t("Три линии монетизации",
        "Три лінії монетизації", "Three Monetisation Lines")}</h3>
    <p><strong>{t("1) Продажа токенов EVA / CONSILIUM.","1) Продаж токенів EVA / CONSILIUM.","1) EVA / CONSILIUM token sales.")}</strong> {t("Эмиссия и продажа собственных токенов участникам сети, клиентам и инвесторам; часть выручки возвращается в производство полимеров и рост флота агентов.",
        "Емісія та продаж власних токенів учасникам мережі, клієнтам та інвесторам; частина виручки повертається у виробництво полімерів та зростання флоту агентів.",
        "Issue and sell network tokens to members, clients and investors; a portion of revenue flows back into polymer production and fleet growth.")}</p>
    <p><strong>{t("2) Перепродажа трафика.","2) Перепродаж трафіку.","2) Traffic resale.")}</strong> {t("Закупаем трафик оптом по низкой цене у источников и перепродаём его агентам, агентствам и рекламным кампаниям — арбитраж на разнице между входной и выходной ценой 1 000 кликов.",
        "Закуповуємо трафік оптом за низькою ціною у джерел і перепродаємо його агентам, агентствам та рекламним кампаніям — арбітраж на різниці між вхідною та вихідною ціною 1 000 кліків.",
        "Buy traffic wholesale at low cost and resell it to agents, agencies and ad campaigns — profiting from the spread on every 1,000 clicks.")}</p>
    <p><strong>{t("3) Арбитраж токенов Консилиума.","3) Арбітраж токенів Консиліуму.","3) Consilium token arbitrage.")}</strong> {t("Покупаем токены на одних площадках и периодах ниже, продаём выше — на разнице цен, ликвидности и спот/ф'ючерсов формируется арбитражная маржа.",
        "Купуємо токени на одних майданчиках і періодах дешевше, продаємо дорожче — на різниці цін, ліквідності та спот/ф'ючерсів формується арбітражна маржа.",
        "Buy tokens cheaper across venues and periods and sell higher — price, liquidity and spot/futures spreads create arbitrage margin.")}</p>

    <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%" style="margin-top:16px;">
      <thead>
        <tr>
          <th>{t("Шаг","Крок","Step")}</th>
          <th>{t("Сеть","Мережа","Network")}</th>
          <th>{t("Кумулятивный оборот","Кумулятивний оборот","Cumulative turnover")}</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>1</td><td>{t("1 центр","1 центр","1 hub")}</td><td>$1</td></tr>
        <tr><td>2</td><td>{t("10 заводов","10 заводів","10 plants")}</td><td>$1 000</td></tr>
        <tr><td>3</td><td>{t("100 агентств","100 агентств","100 agencies")}</td><td>$100 000</td></tr>
        <tr><td>4</td><td>{t("1 000 клиентов","1 000 клієнтів","1,000 clients")}</td><td>$10 000 000</td></tr>
        <tr><td>5</td><td>{t("10 000 агентов","10 000 агентів","10,000 agents")}</td><td>$1 000 000 000</td></tr>
        <tr><td>6</td><td>{t("100 000 сделок","100 000 угод","100,000 deals")}</td><td>$100 000 000 000</td></tr>
        <tr><td>7</td><td>{t("1 000 000 транзакций","1 000 000 транзакцій","1,000,000 transactions")}</td><td>$1 000 000 000 000</td></tr>
      </tbody>
    </table>
  </section>
"""

print("Starting Master Compilation of EvaLine Manifesto...")

# =========================================================================
# 1. COMPILE INTERACTIVE TRILINGUAL MANIFESTO (Full Cyber UI + Style Toggle)
# =========================================================================
helpers.set_render_lang(None)
prerendered_models_html = models_renderer.get_prerendered_models()

head_html = """<!DOCTYPE html>
<html lang="ru" data-lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Манифест EvaLine // Фабрика автономных ИИ-агентов, система «Консилиум», Тетраксис ролей и производство полимеров EVA</title>
  <meta name="description" content="Технологический манифест EvaLine: фабрика автономных ИИ-агентов, система Консилиум, матрица из 94 LLM моделей, 10 ролей Тетраксиса и реальное производство полимеров EVA.">
  
  <!-- Complete Roboto Font Family: Roboto, Roboto Mono, Roboto Condensed, Roboto Slab (All weights & styles) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&family=Roboto+Condensed:ital,wght@0,300;0,400;0,700;1,300;1,400;1,700&family=Roboto+Mono:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&family=Roboto+Slab:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  
  <style id="main-manifesto-styles">
""" + css_styles.CSS_CONTENT + BOOK_CSS + """
  </style>
</head>
<body>
"""

nav_hero = nav_and_hero.get_nav_and_hero()
sec1 = sections_01_03.get_section_01()
sec2 = sections_01_03.get_section_02()
sec3 = sections_01_03.get_section_03()
sec4 = sections_04_07.get_section_04(prerendered_models_html)
sec5 = sections_04_07.get_section_05()
sec6 = sections_04_07.get_section_06()
sec7 = sections_04_07.get_section_07()
sec8 = section_08.get_section_08()
sec9 = section_09.get_section_09()
footer = footer_and_scripts.get_footer()
scripts = footer_and_scripts.get_scripts()

full_interactive_html = head_html + nav_hero + get_formula_html() + sec1 + sec2 + sec3 + sec4 + sec5 + sec6 + sec7 + sec8 + sec9 + footer + scripts

# Sanitise: no sticky/fixed UI (product requirement) — applied at build time
full_interactive_html = (full_interactive_html
    .replace('position: sticky;', 'position: static;')
    .replace('background-attachment: fixed;', 'background-attachment: scroll;'))

# =========================================================================
# 2. COMPILE CLEAN STANDALONE SINGLE-LANGUAGE SEMANTIC HTML (For w3m/lynx & Raw)
# =========================================================================
def compile_clean_html(lang):
    helpers.set_render_lang(lang)
    helpers.set_include_mermaid(False)
    lang_models = models_renderer.get_prerendered_models()
    
    titles = {
        'ru': "Манифест EvaLine // Фабрика ИИ-агентов, Консилиум и Завод полимеров EVA (Текстовая версия)",
        'uk': "Маніфест EvaLine // Фабрика ШІ-агентів, Консиліум та Завод полімерів EVA (Текстова версія)",
        'en': "EvaLine Manifesto // Autonomous AI Factory, Consilium Consensus & EVA Polymer Plant (Text Edition)"
    }
    
    clean_head = f"""<!DOCTYPE html>
<html lang="{lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{titles[lang]}</title>
</head>
<body>
"""
    c_nav = nav_and_hero.get_nav_and_hero()
    c_s1 = sections_01_03.get_section_01()
    c_s2 = sections_01_03.get_section_02()
    c_s3 = sections_01_03.get_section_03()
    c_s4 = sections_04_07.get_section_04(lang_models)
    c_s5 = sections_04_07.get_section_05()
    c_s6 = sections_04_07.get_section_06()
    c_s7 = sections_04_07.get_section_07()
    c_s8 = section_08.get_section_08()
    c_s9 = section_09.get_section_09()
    c_foot = footer_and_scripts.get_footer()
    
    clean_html = clean_head + c_nav + get_formula_html() + c_s1 + c_s2 + c_s3 + c_s4 + c_s5 + c_s6 + c_s7 + c_s8 + c_s9 + c_foot + "\n</body>\n</html>"
    clean_html = (clean_html
        .replace('position: sticky;', 'position: static;')
        .replace('background-attachment: fixed;', 'background-attachment: scroll;'))
    return clean_html

print("Generating single-language clean semantic editions...")
html_ru = compile_clean_html('ru')
html_uk = compile_clean_html('uk')
html_en = compile_clean_html('en')

# Reset helpers back to trilingual and enable mermaid for safety
helpers.set_render_lang(None)
helpers.set_include_mermaid(True)

# =========================================================================
# 3. WRITE TARGET ARTIFACTS TO BACKEND AND REPO
# =========================================================================
file_matrix = [
    # Full Interactive Cyber Web UI
    ('/var/www/evabot-backend/public/manifesto.html', full_interactive_html),
    ('/home/evabot/evaline-online/index.html', full_interactive_html),
    ('/home/evabot/evaline-online/public/manifesto.html', full_interactive_html),

    # Single Language Semantic Russian
    ('/var/www/evabot-backend/public/manifesto-ru.html', html_ru),
    ('/home/evabot/evaline-online/public/manifesto-ru.html', html_ru),

    # Single Language Semantic Ukrainian
    ('/var/www/evabot-backend/public/manifesto-uk.html', html_uk),
    ('/home/evabot/evaline-online/public/manifesto-uk.html', html_uk),

    # Single Language Semantic English
    ('/var/www/evabot-backend/public/manifesto-en.html', html_en),
    ('/home/evabot/evaline-online/public/manifesto-en.html', html_en),

    # Raw Semantic Default (Russian)
    ('/var/www/evabot-backend/public/manifesto-raw.html', html_ru),
    ('/home/evabot/evaline-online/public/manifesto-raw.html', html_ru),
]

for file_path, content in file_matrix:
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"[+] Wrote {file_path} ({len(content)} bytes)")

# Ensure models_catalog.json is present
with open('/home/evabot/evaline-online/models_catalog.json', 'w', encoding='utf-8') as f:
    json.dump(models_renderer.raw_models, f, ensure_ascii=False, indent=2)
print("[+] Synced models_catalog.json")

# Ensure manifesto.txt is synced across all required spots
txt_source = '/var/www/evabot-backend/public/manifesto.txt'
if os.path.exists(txt_source):
    shutil.copy(txt_source, '/home/evabot/evaline-online/public/manifesto.txt')
    shutil.copy(txt_source, '/home/evabot/evaline-online/manifesto.txt')
    shutil.copy(txt_source, '/var/www/evabot-backend/pages/evaline.online.unui.txt')
    print("[+] Synced manifesto.txt across public, repo root, and pages/")

# Ensure MANIFESTO.md (Markdown export) is available on the web server root
for md_out in ['/var/www/evabot-backend/public/MANIFESTO.md',
               '/home/evabot/evaline-online/public/MANIFESTO.md']:
    try:
        shutil.copy('/home/evabot/evaline-online/MANIFESTO.md', md_out)
    except (OSError, shutil.SameFileError):
        pass
print("[+] Synced MANIFESTO.md to public/")

print("Master Compilation Finished Successfully!")
