# -*- coding: utf-8 -*-
"""
Helper formatting functions for the Trilingual Manifesto.
"""

CURRENT_LANG = None  # None for trilingual (<span class="t-ru">...), or 'ru', 'uk', 'en'
INCLUDE_MERMAID = True

def set_render_lang(lang):
    global CURRENT_LANG
    CURRENT_LANG = lang

def set_include_mermaid(val):
    global INCLUDE_MERMAID
    INCLUDE_MERMAID = bool(val)

def t(ru, uk, en, tag="span", cls=""):
    if CURRENT_LANG == 'ru':
        c = f' class="{cls}"' if cls else ''
        return f'<{tag}{c}>{ru}</{tag}>'
    elif CURRENT_LANG == 'uk':
        c = f' class="{cls}"' if cls else ''
        return f'<{tag}{c}>{uk}</{tag}>'
    elif CURRENT_LANG == 'en':
        c = f' class="{cls}"' if cls else ''
        return f'<{tag}{c}>{en}</{tag}>'
    else:
        c = f' class="{cls} ' if cls else ' class="'
        return f'<{tag}{c}t-ru">{ru}</{tag}><{tag}{c}t-uk" hidden>{uk}</{tag}><{tag}{c}t-en" hidden>{en}</{tag}>'

def p_t(ru, uk, en, cls=""):
    return t(ru, uk, en, tag="p", cls=cls)

def div_t(ru, uk, en, cls=""):
    return t(ru, uk, en, tag="div", cls=cls)

def accordion_section(sec_id, num, title_ru, title_uk, title_en, badge_ru, badge_uk, badge_en, content, open=False):
    op = ' open' if open else ''
    badge_html = f'<span class="summary-badge">[{t(badge_ru, badge_uk, badge_en, tag="span")}]</span>' if badge_ru else ''
    legend_text = f"{num}. {title_ru}"
    return f'''  <!-- =========================================================================
       SECTION {num}: {sec_id.upper()}
       ========================================================================= -->
  <fieldset class="module-box" data-section="{sec_id}">
    <legend class="module-title">{legend_text}</legend>
  <details class="accordion-section"{op} id="{sec_id}">
    <summary class="accordion-summary">
      <span class="summary-num">[{num}]</span>
      <span class="summary-title">{t(title_ru, title_uk, title_en, tag="strong")}</span>
      {badge_html}
    </summary>
    <div class="accordion-content">
{content}
    </div>
  </details>
  <hr class="section-divider">
'''

def sub_accordion(sub_id, icon, title_ru, title_uk, title_en, badge_ru, badge_uk, badge_en, content, open=False):
    op = ' open' if open else ''
    badge_html = f' <span class="sub-badge">[{t(badge_ru, badge_uk, badge_en, tag="span")}]</span>' if badge_ru else ''
    icon_str = f'<span class="sub-icon">{icon}</span> ' if icon else ''
    return f'''    <details class="sub-accordion"{op} id="{sub_id}">
      <summary class="sub-summary">
        {icon_str}<span class="sub-title">{t(title_ru, title_uk, title_en, tag="strong")}</span>{badge_html}
      </summary>
      <div class="sub-content">
{content}
      </div>
    </details>
'''
