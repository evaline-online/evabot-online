# -*- coding: utf-8 -*-
import json
from helpers import t, accordion_section, sub_accordion
import infographics_builder

# Import the 20 glossary items from build_full_trilingual_manifesto.py
import sys
sys.path.append('/home/evabot')
from build_full_trilingual_manifesto import GLOSSARY_ITEMS

def render_glossary_cards(items):
    cards = []
    for g in items:
        badge = f'<span class="glossary-category-pill {g["badgeClass"]}">{t(g["categoryNames"]["ru"], g["categoryNames"]["uk"], g["categoryNames"]["en"])}</span>'
        term = f'<div class="glossary-term">{t(g["terms"]["ru"], g["terms"]["uk"], g["terms"]["en"])}</div>'
        
        plain_label = t("Простыми словами:", "Простими словами:", "In Plain English:")
        plain_desc = t(g["plain"]["ru"], g["plain"]["uk"], g["plain"]["en"])
        
        tech_label = t("Техническое определение:", "Технічне визначення:", "Technical Specification:")
        tech_desc = t(g["tech"]["ru"], g["tech"]["uk"], g["tech"]["en"])

        c = f'''        <div class="glossary-card" data-category="{g['category']}">
          <div class="glossary-header">
            {term}
            {badge}
          </div>
          <div class="glossary-plain">
            <strong>{plain_label}</strong> {plain_desc}
          </div>
          <div class="glossary-tech">
            <strong>{tech_label}</strong> {tech_desc}
          </div>
        </div>'''
        cards.append(c)
    return "\n".join(cards)

def get_section_09():
    ai_items = [g for g in GLOSSARY_ITEMS if g['category'] == 'ai']
    poly_items = [g for g in GLOSSARY_ITEMS if g['category'] == 'poly']
    sec_items = [g for g in GLOSSARY_ITEMS if g['category'] == 'sec']

    sub1 = sub_accordion(
        "sub-9-1", "🤖",
        "Вопрос 9.1: Что означают термины ИИ и фабрики агентов простыми словами (9 понятий)?",
        "Питання 9.1: Що означають терміни ШІ та фабрики агентів простими словами (9 понять)?",
        "Question 9.1: What do AI and agentic factory terms mean in plain language (9 terms)?",
        "ШІ & Агенты", "ШІ & Агенти", "AI & Agents",
        f'''<div class="glossary-grid">{render_glossary_cards(ai_items)}</div>'''
    )

    sub2 = sub_accordion(
        "sub-9-2", "🏭",
        "Вопрос 9.2: Что нужно знать о полимерах EVA и технологии завода простыми словами (7 понятий)?",
        "Питання 9.2: Що потрібно знати про полімери EVA та технологію заводу простими словами (7 понять)?",
        "Question 9.2: What essential terms explain EVA polymers and manufacturing (7 terms)?",
        "Полимеры & Завод", "Полімери & Завод", "Polymers & Plant",
        f'''<div class="glossary-grid">{render_glossary_cards(poly_items)}</div>'''
    )

    sub3 = sub_accordion(
        "sub-9-3", "🛡️",
        "Вопрос 9.3: Как расшифровать термины сетевой безопасности и устойчивости простыми словами (4 понятия)?",
        "Питання 9.3: Як розшифрувати терміни мережевої безпеки та стійкості простими словами (4 поняття)?",
        "Question 9.3: How to understand mesh security, dual clusters, and blackout resilience (4 terms)?",
        "Безопасность", "Безпека", "Security",
        f'''<div class="glossary-grid">{render_glossary_cards(sec_items)}</div>'''
    )

    controls = f'''
    <div class="glossary-controls">
      <div class="glossary-tabs">
        <button class="glossary-tab active" data-glossary-filter="all">
          {t("Все 20 понятий", "Всі 20 понять", "All 20 Terms")}
        </button>
        <button class="glossary-tab" data-glossary-filter="ai">
          {t("🤖 Искусственный интеллект", "🤖 Штучний інтелект", "🤖 Artificial Intelligence")}
        </button>
        <button class="glossary-tab" data-glossary-filter="poly">
          {t("🏭 Завод и Полимеры", "🏭 Завод та Полімери", "🏭 Factory & Polymers")}
        </button>
        <button class="glossary-tab" data-glossary-filter="sec">
          {t("🛡️ Сеть и Безопасность", "🛡️ Мережа та Безпека", "🛡️ Network & Security")}
        </button>
      </div>
      <div style="flex: 1; max-width: 380px; min-width: 240px;">
        <input type="text" id="glossary-search" class="matrix-search-input" placeholder="{t('🔍 Найти термин (Консилиум, ЭВА, Шор, RAG...)...', '🔍 Знайти термін (Консиліум, ЕВА, Шор, RAG...)...', '🔍 Search glossary terms (Consilium, EVA, Shore, RAG...)...')}" style="width: 100%;">
      </div>
    </div>
'''

    lead = t(
        "Мы создаем передовые автономные технологии и полимерные материалы, но говорим с клиентами и партнерами на понятном человеческом языке без сложного птичьего жаргона:",
        "Ми створюємо передові автономні технології та полімерні матеріали, але розмовляємо з клієнтами та партнерами зрозумілою людською мовою без складного жаргону:",
        "We engineer frontier autonomous technologies and high-precision polymer materials, communicating with our partners in clear, accessible language free of opaque jargon:"
    )

    info_panel = infographics_builder.get_infographic_09()

    content = f'''      {info_panel}
      <p class="lead-text">{lead}</p>
      {controls}
      {sub1}
      {sub2}
      {sub3}'''

    return accordion_section(
        "glossary", "09",
        "Глоссарий терминов: Простыми словами о высоких технологиях EvaLine",
        "Глосарій термінів: Простими словами про високі технології EvaLine",
        "Plain-Language Glossary: High Technologies in Accessible Terms",
        "20 терминов", "20 термінів", "20 Clear Terms",
        content, open=False
    )
