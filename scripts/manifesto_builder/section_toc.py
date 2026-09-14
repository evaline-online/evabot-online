# -*- coding: utf-8 -*-
"""Mindmap TOC module: nested accordion tree of all sections built from live DOM."""

def get_section_toc():
    return f'''
  <details class="accordion-section toc-mindmap" id="manifesto-toc">
    <summary class="accordion-summary">
      <span class="summary-num">[TOC]</span>
      <span class="summary-title"><strong>Карта Манифеста — Mindmap-оглавление (вложенные аккордеоны)</strong></span>
      <span class="summary-badge"><a href="#problem-statement" class="toc-toplink" onclick="event.stopPropagation();return true;">&#9881; К первой секции</a></span>
    </summary>
    <div class="accordion-content">
      <p class="lead-text" style="font-size:0.92em;opacity:0.85;">Дерево секций и под-параграфов. Разверните ветку и кликните заголовок, чтобы перейти к раскрытому аккордеону. Язык обновления автоматический.</p>
      <div id="toc-tree-root"><ul class="toc-mindmap-tree" id="toc-tree"><li class="toc-loading">Оглавление строится из живой структуры документа…</li></ul></div>
    </div>
  </details>
  <hr class="section-divider">
'''
