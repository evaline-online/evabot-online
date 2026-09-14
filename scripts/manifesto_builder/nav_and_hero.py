# -*- coding: utf-8 -*-
import helpers
from helpers import t

def get_nav_and_hero():
    return f'''
<header class="top-nav" role="banner">
  <div class="brand-row">
    <a href="https://evaline.online" class="brand-title">
      <span class="logo-gem">◆</span> EVALINE NETWORK (EVANET)
    </a>
    <div class="cluster-status-pill" id="cluster-status-indicator">
      <span class="pulse-dot"></span>
      {t("Кластер Активен: Франкфурт (8 vCPU) ⟷ Айова (Edge HTTP/3)",
         "Кластер Активний: Франкфурт (8 vCPU) ⟷ Айова (Edge HTTP/3)",
         "Cluster Online: Frankfurt (8 vCPU) ⟷ Iowa (Edge HTTP/3)")}
    </div>
  </div>

  <!-- Master Controls Toolbar: Language, Themes, Accordions, Diagrams, Export -->
  <details class="toolbar-accordion" id="header-accordion">
    <summary class="toolbar-summary">⚙ {t("Панель управления (Язык / Оформление / Секции / Схемы / Экспорт)", "Панель керування (Мова / Оформлення / Секції / Схеми / Експорт)", "Control Panel (Language / Style / Sections / Diagrams / Export)")}</summary>
  <div class="toolbar-container" role="toolbar" aria-label="Manifesto Controls">
    <div class="toolbar-group">
      <span class="toolbar-label">{t("Язык:", "Мова:", "Lang:")}</span>
      <div class="btn-group lang-switcher" role="group" aria-label="Language Selector">
        <button type="button" class="lang-btn active" data-lang="ru" onclick="setLanguage('ru')">RU</button>
        <button type="button" class="lang-btn" data-lang="uk" onclick="setLanguage('uk')">UK</button>
        <button type="button" class="lang-btn" data-lang="en" onclick="setLanguage('en')">EN</button>
      </div>
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">{t("Оформление:", "Оформлення:", "Style:")}</span>
      <div class="btn-group theme-switcher" role="group" aria-label="Theme Selector">
        <button type="button" class="theme-btn active" data-theme="cyber" onclick="setTheme('cyber')" title="Киберпанк (Неон / Dark)">
          🎨 {t("Киберпанк", "Кіберпанк", "Cyber UI")}
        </button>
        <button type="button" class="theme-btn" data-theme="raw" onclick="setTheme('raw')" title="Чистый HTML без стилей оформления">
          📄 {t("Без стилей", "Без стилів", "Raw HTML")}
        </button>
        <button type="button" class="theme-btn" data-theme="paper" onclick="setTheme('paper')" title="Бумажный светлый минимализм">
          ☀️ {t("Бумага", "Папір", "Paper Light")}
        </button>
        <button type="button" class="theme-btn" data-theme="terminal" onclick="setTheme('terminal')" title="Зеленый моноширинный терминал">
          📟 {t("Терминал", "Термінал", "Terminal")}
        </button>
      </div>
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">{t("Секции:", "Секції:", "Sections:")}</span>
      <div class="btn-group" role="group" aria-label="Accordion Controls">
        <button type="button" class="btn-ctrl" onclick="toggleAllAccordions(true)" title="Развернуть все секции">
          ▾ {t("Развернуть", "Розгорнути", "Expand")}
        </button>
        <button type="button" class="btn-ctrl" onclick="toggleAllAccordions(false)" title="Свернуть все секции">
          ▸ {t("Свернуть", "Згорнути", "Collapse")}
        </button>
      </div>
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">{t("Схемы:", "Схеми:", "Diagrams:")}</span>
      <div class="btn-group diagram-switcher" role="group" aria-label="Diagram Mode">
        <button type="button" class="diagram-btn active" data-diag-mode="all" onclick="toggleDiagramMode('all')" title="Отображать векторные и текстовые схемы">
          📊 {t("Все", "Всі", "All")}
        </button>
        <button type="button" class="diagram-btn" data-diag-mode="vector" onclick="toggleDiagramMode('vector')" title="Только векторные Mermaid-диаграммы">
          ✨ {t("Вектор", "Вектор", "Vector")}
        </button>
        <button type="button" class="diagram-btn" data-diag-mode="ascii" onclick="toggleDiagramMode('ascii')" title="Только текстовые ASCII-схемы">
          📟 ASCII
        </button>
      </div>
    </div>

    <div class="toolbar-group">
      <span class="toolbar-label">{t("Экспорт:", "Експорт:", "Export:")}</span>
      <div class="btn-group" role="group" aria-label="Export Formats">
        <a href="/manifesto.txt" class="btn-ctrl" target="_blank" title="curl https://evaline.online/manifesto.txt">
          💻 ANSI TXT
        </a>
        <a href="/MANIFESTO.md" class="btn-ctrl" target="_blank" title="Открыть чистый исходный Markdown">
          📖 Markdown
        </a>
      </div>
    </div>
  </div>
  </details>
</header>

<div class="container">

  <!-- HERO SECTION -->
  <section class="hero">
    <div class="hero-eyebrow">
      {t("СУВЕРЕННАЯ АГЕНТСКАЯ ФАБРИКА & РЕАЛЬНОЕ ПРОИЗВОДСТВО ПОЛИМЕРОВ",
         "СУВЕРЕННА АГЕНТСЬКА ФАБРИКА ТА РЕАЛЬНЕ ВИРОБНИЦТВО ПОЛІМЕРІВ",
         "SOVEREIGN AGENT FACTORY & PHYSICAL POLYMER MANUFACTURING")}
    </div>
    <h1 class="hero-title">
      {t("МАНИФЕСТ EVALINE // АВТОНОМНЫЙ ШТАТ ИИ-АГЕНТОВ, СИСТЕМА «КОНСИЛИУМ» И МАТЕРИАЛЬНЫЙ СУВЕРЕНИТЕТ",
         "МАНІФЕСТ EVALINE // АВТОНОМНИЙ ШТАТ ШІ-АГЕНТІВ, СИСТЕМА «КОНСИЛІУМ» ТА МАТЕРІАЛЬНИЙ СУВЕРЕНІТЕТ",
         "EVALINE MANIFESTO // AUTONOMOUS AI AGENT FLEET, CONCILIUM CONSENSUS & PHYSICAL SOVEREIGNTY")}
    </h1>
    <p class="hero-desc">
      {t("Инженерно-производственный манифест первого суверенного альянса физической индустрии полимеров EVA и распределенной фабрики автономных цифровых сотрудников. Мы ликвидируем монополию одиночных чат-ботов, галлюцинации и человеческую рутину через состязательный дебат 94 языковых моделей и прямое роботизированное управление станками ЧПУ.",
         "Інженерно-виробничий маніфест першого суверенного альянсу фізичної індустрії полімерів EVA та розподіленої фабрики автономних цифрових співробітників. Ми ліквідуємо монополію одиночних чат-ботів, галюцинації та людську рутину через змагальний дебат 94 мовних моделей та пряме роботизоване керування верстатами ЧПК.",
         "Engineering and manufacturing manifesto of the first sovereign alliance uniting physical EVA polymer production with an autonomous digital employee factory. We eliminate single-chatbot monopolies, hallucinations, and routine human fatigue through adversarial consensus across 94 LLMs and direct CNC robotic execution.")}
    </p>

    <!-- Quick Jump Links -->
    <div class="hero-links" style="display: flex; gap: 12px; flex-wrap: wrap; margin-top: 24px;">
      <a href="#monetization-top" class="btn-ctrl" style="text-decoration: none; padding: 8px 16px; border-color: rgba(255,214,0,0.6);">
        🪙 <span class="t-ru">Топ-20 автономного заработка</span><span class="t-uk" hidden>Топ-20 автономного заробітку</span><span class="t-en" hidden>Top-20 Autonomous Earning</span>
      </a>
      <a href="#models-matrix" class="btn-ctrl" style="text-decoration: none; padding: 8px 16px;">
        📊 {t("Матрица 94 LLM-моделей", "Матриця 94 LLM-моделей", "94-Model LLM Matrix")}
      </a>
      <a href="#business-solutions" class="btn-ctrl" style="text-decoration: none; padding: 8px 16px;">
        🏭 {t("Решения для бизнеса & Завод", "Рішення для бізнесу та Завод", "Business Solutions & Plant")}
      </a>
      <a href="#roi-calculator" class="btn-ctrl" style="text-decoration: none; padding: 8px 16px;">
        💰 {t("Калькулятор окупаемости ROI", "Калькулятор окупності ROI", "Interactive ROI Calculator")}
      </a>
      <a href="#glossary" class="btn-ctrl" style="text-decoration: none; padding: 8px 16px;">
        📖 {t("Глоссарий 20 терминов", "Глосарій 20 термінів", "20-Term Plain Glossary")}
      </a>
    </div>
  </section>
  <hr class="section-divider">
'''
