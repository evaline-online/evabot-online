# -*- coding: utf-8 -*-
from helpers import t
from models_renderer import models_json_str
from build_full_trilingual_manifesto import GLOSSARY_ITEMS
import json

glossary_json_str = json.dumps(GLOSSARY_ITEMS, ensure_ascii=False)

def get_footer():
    return f'''
  <!-- FOOTER -->
  <footer>
    <p>
      {t("EVALINE NETWORK & EVABOT ONLINE // СУВЕРЕННАЯ ФАБРИКА АВТОНОМНЫХ ИИ-АГЕНТОВ & ПРОИЗВОДСТВО ПОЛИМЕРОВ EVA",
         "EVALINE NETWORK & EVABOT ONLINE // СУВЕРЕННА ФАБРИКА АВТОНОМНИХ ШІ-АГЕНТІВ ТА ВИРОБНИЦТВО ПОЛІМЕРІВ EVA",
         "EVALINE NETWORK & EVABOT ONLINE // SOVEREIGN AUTONOMOUS AGENT FACTORY & PHYSICAL EVA POLYMERS")}
    </p>
    <p style="margin-top: 8px;">
      {t("Физическое производство: Украина, г. Черноморск, ул. Промышленная, 1 • Склад в ЕС: Словакия, г. Братислава, Obchodna 37 • Сертификация ISO 9001:2015 & CE",
         "Фізичне виробництво: Україна, м. Чорноморськ, вул. Промислова, 1 • Склад у ЄС: Словаччина, м. Братислава, Obchodna 37 • Сертифікація ISO 9001:2015 & CE",
         "Physical Production: Ukraine, Chornomorsk, Promyslova 1 • EU Hub: Slovakia, Bratislava, Obchodna 37 • Certified ISO 9001:2015 & CE Directive")}
    </p>
    <p style="margin-top: 8px; color: var(--fg-subtle);">
      {t("Кластер: Франкфурт (8 vCPU Dedicated Core) ⟷ Айова (Edge HTTP/3) ⟷ Защищённый WireGuard Mesh-контур.",
         "Кластер: Франкфурт (8 vCPU Dedicated Core) ⟷ Айова (Edge HTTP/3) ⟷ Захищений WireGuard Mesh-контур.",
         "Cluster: Frankfurt (8 vCPU Dedicated Core) ⟷ Iowa (Edge HTTP/3) ⟷ Encrypted WireGuard Mesh Tunnel.")}
    </p>
  </footer>

</div> <!-- End .container -->
'''

def get_scripts():
    return '''
<!-- MERMAID.JS CDN ENGINE & INITIALIZATION -->
<script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>

<!-- MARKMAP.JS CDN (Markdown Mind Map) -->
<script src="https://cdn.jsdelivr.net/npm/d3@7/dist/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-lib@0.18.12/dist/browser/index.iife.js"></script>
<script src="https://cdn.jsdelivr.net/npm/markmap-view@0.18.12/dist/browser/index.js"></script>

<!-- EMBEDDED MODELS REGISTRY DATA & INTERACTIVE CLIENT ENGINE -->
<script>
  const RAW_MODELS = ''' + models_json_str + ''';
  const GLOSSARY_ITEMS = ''' + glossary_json_str + ''';

  // Mermaid Engine Initialization
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      themeVariables: {
        darkMode: true,
        background: '#07090e',
        mainBkg: '#0d111a',
        nodeBorder: '#00e676',
        primaryColor: '#0e1824',
        primaryTextColor: '#e6edf3',
        primaryBorderColor: 'rgba(0, 230, 118, 0.4)',
        lineColor: '#38bdf8',
        secondaryColor: '#161f30',
        tertiaryColor: '#111722',
        fontFamily: 'Roboto, sans-serif'
      },
      securityLevel: 'loose'
    });
  }

  // Markmap Engine Initialization & Render
  let markmapInstances = new Map();

  async function renderVisibleMarkmap() {
    if (typeof window.markmap === 'undefined' || !window.markmap.Transformer || !window.markmap.Markmap) {
      return;
    }
    const elements = Array.from(document.querySelectorAll('.diagram-canvas .markmap'));
    for (const el of elements) {
      if (el.offsetParent !== null && !el.getAttribute('data-processed')) {
        try {
          const lang = el.getAttribute('data-lang') || currentLang;
          const markdown = el.getAttribute(`data-md-${lang}`) || el.getAttribute('data-md-ru') || '';
          if (!markdown) continue;

          const { Transformer, Markmap } = window.markmap;
          const transformer = new Transformer();
          const { root } = transformer.transform(markdown);

          const svgEl = el.querySelector('svg') || document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          if (!el.querySelector('svg')) {
            el.innerHTML = '';
            el.appendChild(svgEl);
          }
          svgEl.style.maxWidth = '100%';
          svgEl.style.width = '100%';
          svgEl.style.height = 'auto';
          svgEl.style.maxHeight = '70vh';

          Markmap.create(svgEl, {
            autoFit: true,
            duration: 300,
            initialExpandDepth: 3,
            color: (d) => {
              const depth = d.depth || 0;
              const colors = ['#ffd600', '#38bdf8', '#00e5ff', '#00e676', '#b388ff', '#f87171'];
              return colors[depth % colors.length];
            }
          }, root);

          el.setAttribute('data-processed', 'true');
          markmapInstances.set(el, { root, svg: svgEl });
        } catch (err) {
          console.warn('Markmap render error:', err);
        }
      }
    }
  }

  async function renderVisibleMermaid() {
    if (typeof mermaid === 'undefined') return;
    const elements = Array.from(document.querySelectorAll('.mermaid'));
    for (const el of elements) {
      if (el.offsetParent !== null && !el.getAttribute('data-processed')) {
        try {
          await mermaid.run({ nodes: [el] });
          const svg = el.querySelector('svg');
          if (svg) {
            svg.style.maxWidth = '100%';
            svg.style.width = '100%';
            svg.style.height = 'auto';
            svg.removeAttribute('height');
          }
        } catch (err) {
          console.warn('Mermaid render error:', err);
        }
      }
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  let currentLang = urlParams.get('lang') || localStorage.getItem('evaline_lang') || 'ru';
  let currentFilter = 'free';
  let currentSort = 'quality';
  let searchQuery = '';

  let currentGlossaryFilter = 'all';
  let glossarySearchQuery = '';

  // Master Theme Controller: 'cyber', 'raw', 'paper', 'terminal'
  let currentTheme = urlParams.get('theme') || localStorage.getItem('evaline_theme') || 'cyber';

  function setTheme(theme) {
    if (!['cyber', 'raw', 'paper', 'terminal'].includes(theme)) theme = 'cyber';
    currentTheme = theme;
    localStorage.setItem('evaline_theme', theme);
    const styleEl = document.getElementById('main-manifesto-styles');

    // Update theme switcher active button states
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-theme') === theme);
    });

    if (theme === 'raw') {
      if (styleEl) styleEl.disabled = true;
      document.documentElement.setAttribute('data-theme', 'raw');
      // In raw mode, hide Mermaid vector canvas and ensure clean ASCII text art is visible
      document.querySelectorAll('.diagram-canvas').forEach(el => el.style.display = 'none');
      document.querySelectorAll('.ascii-toggle').forEach(el => {
        el.style.display = 'block';
        el.open = true;
      });
    } else {
      if (styleEl) styleEl.disabled = false;
      document.documentElement.setAttribute('data-theme', theme);
      // Restore diagram visibility based on active diagram mode
      if (currentDiagramMode !== 'ascii') {
        document.querySelectorAll('.diagram-canvas').forEach(el => el.style.display = 'block');
        document.querySelectorAll('.diagram-canvas .markmap').forEach(el => el.style.display = 'block');
      }
      if (currentDiagramMode === 'vector') {
        document.querySelectorAll('.ascii-toggle').forEach(el => el.style.display = 'none');
      }
      setTimeout(renderVisibleMermaid, 50);
      setTimeout(renderVisibleMarkmap, 50);
    }
  }

  function toggleStyles() {
    setTheme(currentTheme === 'raw' ? 'cyber' : 'raw');
  }

  // Diagram Display Controller: 'all', 'vector', 'ascii'
  let currentDiagramMode = urlParams.get('diag') || 'all';
  function toggleDiagramMode(mode) {
    if (!['all', 'vector', 'ascii'].includes(mode)) mode = 'all';
    currentDiagramMode = mode;
    document.querySelectorAll('.diagram-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-diag-mode') === mode);
    });
    document.querySelectorAll('.diagram-canvas').forEach(el => {
      el.style.display = (mode === 'ascii' || currentTheme === 'raw') ? 'none' : 'block';
    });
    document.querySelectorAll('.diagram-canvas .markmap').forEach(el => {
      el.style.display = (mode === 'ascii' || currentTheme === 'raw') ? 'none' : 'block';
    });
    document.querySelectorAll('.ascii-toggle').forEach(el => {
      if (mode === 'vector') {
        el.style.display = 'none';
        el.open = false;
      } else if (mode === 'ascii') {
        el.style.display = 'block';
        el.open = true;
      } else {
        el.style.display = 'block';
      }
    });
    if (mode !== 'ascii') {
      setTimeout(renderVisibleMermaid, 50);
      setTimeout(renderVisibleMarkmap, 50);
    }
  }

  // Language Switcher Function
  function setLanguage(lang) {
    if (!['ru', 'uk', 'en'].includes(lang)) lang = 'ru';
    currentLang = lang;
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('data-lang', lang);
    localStorage.setItem('evaline_lang', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-value') === lang);
    });

    // Native attribute manipulation for pure HTML / CSS-off mode
    document.querySelectorAll('.t-ru').forEach(el => {
      if (lang === 'ru') el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    document.querySelectorAll('.t-uk').forEach(el => {
      if (lang === 'uk') el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });
    document.querySelectorAll('.t-en').forEach(el => {
      if (lang === 'en') el.removeAttribute('hidden');
      else el.setAttribute('hidden', '');
    });

    // Update markmap content for new language
    document.querySelectorAll('.diagram-canvas .markmap').forEach(el => {
      el.removeAttribute('data-processed');
    });

    renderModels();
    renderGlossary();
    updateRoiCalc();
    setTimeout(renderVisibleMermaid, 60);
    setTimeout(renderVisibleMarkmap, 60);
  }

  // Global Accordion Controller
  function toggleAllAccordions(isOpen) {
    document.querySelectorAll('details.accordion-section, details.sub-accordion').forEach(d => {
      d.open = isOpen;
    });
    if (isOpen) {
      setTimeout(renderVisibleMermaid, 80);
      setTimeout(renderVisibleMarkmap, 80);
    }
  }

  function formatTokensClient(t) {
    if (t >= 2000000) {
      if (currentLang === 'en') return '2M tokens (~1.5M words)';
      if (currentLang === 'uk') return '2M токенів (~1.5M слів)';
      return '2M токенов (~1.5M слов)';
    }
    if (t >= 1000000) {
      if (currentLang === 'en') return '1M tokens (~750k words)';
      if (currentLang === 'uk') return '1M токенів (~750k слів)';
      return '1M токенов (~750k слов)';
    }
    if (t >= 500000) return '512k ' + (currentLang === 'en' ? 'tokens' : (currentLang === 'uk' ? 'токенів' : 'токенов'));
    if (t >= 200000) return '200k ' + (currentLang === 'en' ? 'tokens' : (currentLang === 'uk' ? 'токенів' : 'токенов'));
    if (t >= 128000) return '128k ' + (currentLang === 'en' ? 'tokens' : (currentLang === 'uk' ? 'токенів' : 'токенов'));
    if (t >= 64000) return '64k ' + (currentLang === 'en' ? 'tokens' : (currentLang === 'uk' ? 'токенів' : 'токенов'));
    if (t >= 32000) return '32k ' + (currentLang === 'en' ? 'tokens' : (currentLang === 'uk' ? 'токенів' : 'токенов'));
    return t ? t + ' ' + (currentLang === 'en' ? 'tokens' : (currentLang === 'uk' ? 'токенів' : 'токенов')) : 'Standard';
  }

  function getProviderClass(p) {
    const s = (p || '').toLowerCase();
    if (s.includes('google')) return 'provider-google';
    if (s.includes('anthropic')) return 'provider-anthropic';
    if (s.includes('deepseek')) return 'provider-deepseek';
    if (s.includes('openai')) return 'provider-openai';
    if (s.includes('meta')) return 'provider-meta';
    if (s.includes('mistral')) return 'provider-mistral';
    if (s.includes('omniroute')) return 'provider-omniroute';
    return 'provider-default';
  }

  function getRecencyBadge(r) {
    if (r >= 95) return '✨ 2026 Fleet';
    if (r >= 80) return '2025 Frontier';
    return 'Standard Fleet';
  }

  function renderModels() {
    const grid = document.getElementById('models-grid');
    if (!grid) return;

    let filtered = RAW_MODELS.filter(m => {
      if (currentFilter === 'free' && !m.isFree) return false;
      if (currentFilter === 'paid' && m.isFree) return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const role = (m.roleHints && m.roleHints[currentLang]) ? m.roleHints[currentLang].toLowerCase() : (m.roleHint || '').toLowerCase();
        const match = m.name.toLowerCase().includes(q) ||
                      m.provider.toLowerCase().includes(q) ||
                      (m.desc && m.desc.toLowerCase().includes(q)) ||
                      role.includes(q);
        if (!match) return false;
      }
      return true;
    });

    if (currentSort === 'quality') {
      filtered.sort((a, b) => (b.quality || 0) - (a.quality || 0));
    } else if (currentSort === 'recency') {
      filtered.sort((a, b) => (b.recency || 0) - (a.recency || 0));
    } else if (currentSort === 'speed') {
      filtered.sort((a, b) => (b.speed || 0) - (a.speed || 0));
    } else if (currentSort === 'price') {
      filtered.sort((a, b) => (a.numPrice || 0) - (b.numPrice || 0));
    }

    if (filtered.length === 0) {
      const emptyMsg = currentLang === 'en' ? 'No models found matching query.' :
                       (currentLang === 'uk' ? 'Моделей за запитом не знайдено.' : 'Моделей по запросу не найдено.');
      grid.innerHTML = '<div style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--fg-muted);">' + emptyMsg + '</div>';
      return;
    }

    grid.innerHTML = filtered.map(m => {
      const pClass = getProviderClass(m.provider);
      const iqBadge = '<span class="metric-pill iq">🧠 IQ: <strong>' + (m.quality || 0) + '</strong>/100</span>';
      const tierBadge = m.isFree
        ? '<span class="metric-pill tier-free">🟢 Free Quota $0.00</span>'
        : '<span class="metric-pill tier-paid">💎 Commercial API</span>';
      const recBadge = '<span class="metric-pill">' + getRecencyBadge(m.recency || 0) + '</span>';
      const ctxBadge = '<span class="metric-pill">📚 ' + formatTokensClient(m.context || 0) + '</span>';

      let priceHtml = '';
      if (m.isFree) {
        const freeD = m.freeDetails || 'Google AI Studio 15 RPM / 1M TPM / 1,500 RPD';
        const costLabel = currentLang === 'en' ? 'Cost: $0.00' : (currentLang === 'uk' ? 'Собівартість: $0.00' : 'Себестоимость: $0.00');
        priceHtml = '<div class="model-pricing-box">' +
                    '<div><span class="price-tag free">100% Free Quota</span> • ' + costLabel + '</div>' +
                    '<div style="color: var(--fg-muted); font-size: 0.72rem;">' + freeD + '</div>' +
                    '</div>';
      } else {
        priceHtml = '<div class="model-pricing-box">' +
                    '<div><span class="price-tag paid">Commercial Tier</span> • In: ' + (m.priceIn || '$0.00') + '</div>' +
                    '<div style="color: var(--fg-muted); font-size: 0.72rem;">Out: ' + (m.priceOut || '$0.00') + ' / 1M Tokens</div>' +
                    '</div>';
      }

      const roleLabel = currentLang === 'en' ? 'Role in Consilium:' : (currentLang === 'uk' ? 'Роль у Консиліумі:' : 'Роль в Консилиуме:');
      const roleText = (m.roleHints && m.roleHints[currentLang]) ? m.roleHints[currentLang] : (m.roleHint || '');

      return '<div class="model-card">' +
             '<div class="model-card-header">' +
             '<div class="model-name">' + m.name + '</div>' +
             '<span class="provider-badge ' + pClass + '">' + m.provider + '</span>' +
             '</div>' +
             '<div class="model-metrics">' + iqBadge + tierBadge + recBadge + ctxBadge + '</div>' +
             '<p class="model-desc">' + (m.desc || '') + '</p>' +
             '<div class="model-role"><strong>' + roleLabel + '</strong> ' + roleText + '</div>' +
             priceHtml +
             '</div>';
    }).join('');
  }

  function renderGlossary() {
    const container = document.getElementById('glossary-container');
    if (!container) return;

    let filtered = GLOSSARY_ITEMS.filter(item => {
      if (currentGlossaryFilter !== 'all' && item.category !== currentGlossaryFilter) return false;
      if (glossarySearchQuery) {
        const q = glossarySearchQuery.toLowerCase();
        const term = (item.terms && item.terms[currentLang]) ? item.terms[currentLang].toLowerCase() : '';
        const plain = (item.plain && item.plain[currentLang]) ? item.plain[currentLang].toLowerCase() : '';
        const tech = (item.tech && item.tech[currentLang]) ? item.tech[currentLang].toLowerCase() : '';
        const match = term.includes(q) || plain.includes(q) || tech.includes(q);
        if (!match) return false;
      }
      return true;
    });

    const plainPrefix = currentLang === 'en' ? 'In Plain English:' : (currentLang === 'uk' ? 'Простими словами:' : 'Простыми словами:');
    const techPrefix = currentLang === 'en' ? 'Technical Specification:' : (currentLang === 'uk' ? 'Технічне визначення:' : 'Техническое определение:');

    container.innerHTML = filtered.map(g => {
      const catName = (g.categoryNames && g.categoryNames[currentLang]) ? g.categoryNames[currentLang] : '';
      const termName = (g.terms && g.terms[currentLang]) ? g.terms[currentLang] : '';
      const plainText = (g.plain && g.plain[currentLang]) ? g.plain[currentLang] : '';
      const techText = (g.tech && g.tech[currentLang]) ? g.tech[currentLang] : '';

      return '<div class="glossary-card" data-category="' + g.category + '">' +
             '<div class="glossary-header">' +
             '<div class="glossary-term">' + termName + '</div>' +
             '<span class="glossary-category-pill ' + g.badgeClass + '">' + catName + '</span>' +
             '</div>' +
             '<div class="glossary-plain"><strong>' + plainPrefix + '</strong> ' + plainText + '</div>' +
             '<div class="glossary-tech"><strong>' + techPrefix + '</strong> ' + techText + '</div>' +
             '</div>';
    }).join('');
  }

  function updateRoiCalc() {
    const staffInput = document.getElementById('slider-staff');
    const ticketsInput = document.getElementById('slider-tickets');
    const wageInput = document.getElementById('slider-wage');

    if (!staffInput || !ticketsInput || !wageInput) return;

    const staff = parseInt(staffInput.value, 10);
    const tickets = parseInt(ticketsInput.value, 10);
    const wage = parseInt(wageInput.value, 10);

    const staffSuffix = currentLang === 'en' ? ' people' : (currentLang === 'uk' ? ' співробітників' : ' человек');
    const ticketSuffix = currentLang === 'en' ? ' requests' : (currentLang === 'uk' ? ' заявок' : ' заявок');
    const wageSuffix = currentLang === 'en' ? ' / hr' : (currentLang === 'uk' ? ' / год' : ' / час');

    document.getElementById('val-staff').textContent = staff + staffSuffix;
    document.getElementById('val-tickets').textContent = tickets.toLocaleString() + ticketSuffix;
    document.getElementById('val-wage').textContent = '$' + wage + wageSuffix;

    const automatedTickets = tickets * 0.85;
    const hoursSaved = Math.round(automatedTickets * 0.20);
    const grossSavings = Math.round(hoursSaved * wage);
    const platformCost = 250;
    const netSavings = Math.max(0, grossSavings - platformCost);
    const roiPercent = Math.round((netSavings / platformCost) * 100);
    const paybackDays = netSavings > 0 ? Math.max(3, Math.round((platformCost / (grossSavings / 30)))) : 30;

    const hoursSuffix = currentLang === 'en' ? ' hrs/mo' : (currentLang === 'uk' ? ' год/міс' : ' ч/мес');
    const daysSuffix = currentLang === 'en' ? ' days' : (currentLang === 'uk' ? ' днів' : ' дней');

    document.getElementById('res-savings').textContent = '$' + netSavings.toLocaleString('en-US');
    document.getElementById('res-hours').textContent = hoursSaved.toLocaleString() + hoursSuffix;
    document.getElementById('res-roi').textContent = roiPercent.toLocaleString('en-US') + '%';
    document.getElementById('res-payback').textContent = paybackDays + daysSuffix;
  }

  async function checkCluster() {
    const indicator = document.getElementById('cluster-status-indicator');
    if (!indicator) return;
    try {
      const res = await fetch('/api/health', { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        // healthy
      }
    } catch (e) {
      // silent fallback
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // All content accordions start closed (no open attribute, and force-close here too)
    document.querySelectorAll('details.accordion-section, details.sub-accordion').forEach(d => {
      d.open = false;
    });

    // Initial theme, language, and diagram mode apply
    setTheme(currentTheme);
    setLanguage(currentLang);
    toggleDiagramMode(currentDiagramMode);

    // Matrix filter tabs
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        renderModels();
      });
    });

    // Matrix search
    const mSearch = document.getElementById('model-search');
    if (mSearch) {
      mSearch.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderModels();
      });
    }

    // Matrix sort
    const mSort = document.getElementById('model-sort');
    if (mSort) {
      mSort.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderModels();
      });
    }

    // Glossary tabs
    document.querySelectorAll('.glossary-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.glossary-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentGlossaryFilter = btn.getAttribute('data-glossary-filter');
        renderGlossary();
      });
    });

    // Glossary search
    const gSearch = document.getElementById('glossary-search');
    if (gSearch) {
      gSearch.addEventListener('input', (e) => {
        glossarySearchQuery = e.target.value;
        renderGlossary();
      });
    }

    checkCluster();
    setInterval(checkCluster, 15000);

    // Event Delegation for Toolbar Actions (data-action buttons)
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.getAttribute('data-action');
      const value = btn.getAttribute('data-value');

      switch (action) {
        case 'set-language':
          setLanguage(value);
          break;
        case 'set-theme':
          setTheme(value);
          break;
        case 'set-diagram-mode':
          toggleDiagramMode(value);
          break;
        case 'toggle-all-accordions':
          toggleAllAccordions(value === 'true');
          break;
      }
    });

    // Dynamic Mermaid/Markmap rendering on details toggle
    document.querySelectorAll('details.accordion-section, details.sub-accordion').forEach(det => {
      det.addEventListener('toggle', () => {
        if (det.open) {
          setTimeout(renderVisibleMermaid, 50);
          setTimeout(renderVisibleMarkmap, 50);
          det.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Initial render of visible diagrams
    setTimeout(renderVisibleMermaid, 150);
    setTimeout(renderVisibleMarkmap, 150);
  });

    // ===== Mindmap TOC builder =====
    function tocActiveLang() {
      return document.documentElement.getAttribute('data-lang') || 'ru';
    }
    function tocText(el) {
      if (!el) return '';
      var lang = tocActiveLang();
      var span = el.querySelector('.t-'+lang);
      if (span && span.textContent.trim()) return span.textContent.trim();
      var any = el.querySelector('.t-ru');
      return (any ? any.textContent : el.textContent) || '';
    }
    function buildTocMindmap() {
      var root = document.getElementById('toc-tree');
      if (!root) return;
      var sections = document.querySelectorAll('details.accordion-section');
      var ul = document.createElement('ul');
      ul.className = 'toc-mindmap-tree';
      sections.forEach(function(sec) {
        if (!sec.id || sec.id === 'manifesto-toc') return;
        var num = sec.querySelector('.summary-num');
        var title = sec.querySelector('.summary-title');
        var item = document.createElement('li');
        var a = document.createElement('a');
        a.href = '#' + sec.id;
        var numTxt = document.createElement('span');
        numTxt.className = 'toc-node-num';
        numTxt.textContent = (num ? num.textContent : '');
        a.appendChild(numTxt);
        var label = document.createElement('span');
        label.textContent = tocText(title) || sec.id;
        a.appendChild(label);
        a.addEventListener('click', function(e) {
          e.preventDefault();
          sec.setAttribute('open','');
          var y = sec.getBoundingClientRect().top + window.scrollY - 20;
          window.scrollTo({top:y, behavior:'smooth'});
          setTimeout(renderVisibleMermaid, 80);
          setTimeout(renderVisibleMarkmap, 80);
        });
        item.appendChild(a);
        var subs = sec.querySelectorAll('details.sub-accordion');
        if (subs.length) {
          var subUl = document.createElement('ul');
          subs.forEach(function(sub) {
            var sTitle = sub.querySelector('.sub-title');
            var li = document.createElement('li');
            li.className = 'toc-sub-item';
            var sa = document.createElement('a');
            sa.href = '#' + sub.id;
            var sLabel = document.createElement('span');
            sLabel.textContent = tocText(sTitle) || sub.id;
            sa.appendChild(sLabel);
            sa.addEventListener('click', function(e) {
              e.preventDefault();
              sub.setAttribute('open','');
              var pdet = sub.closest('details.accordion-section');
              if (pdet) pdet.setAttribute('open','');
              var y = sub.getBoundingClientRect().top + window.scrollY - 20;
              window.scrollTo({top:y, behavior:'smooth'});
              setTimeout(renderVisibleMermaid, 80);
              setTimeout(renderVisibleMarkmap, 80);
            });
            li.appendChild(sa);
            subUl.appendChild(li);
          });
          item.appendChild(subUl);
        }
        ul.appendChild(item);
      });
      root.innerHTML = '';
      root.appendChild(ul);
    }
    setTimeout(buildTocMindmap, 260);
    document.querySelectorAll('[data-action="set-language"]').forEach(function(b){
      b.addEventListener('click', function(){ setTimeout(buildTocMindmap, 90); });
    });

</script>

</body>
</html>
'''
