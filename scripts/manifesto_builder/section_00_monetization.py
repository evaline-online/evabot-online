#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# SECTION 00: Top-20 Autonomous Earning Streams (Monetization module)
# Inserted at the very top of the manifesto, right after the hero.

_SECTION_00_HTML = r"""
  <!-- =========================================================================
       SECTION 00: MONETIZATION TOP — AUTONOMOUS EARNING STREAMS
       ========================================================================= -->
  <details class="accordion-section" open id="monetization-top">
    <summary class="accordion-summary">
      <span class="summary-num">[00]</span>
      <span class="summary-title"><strong class="t-ru">Топ-20 вариантов автономного заработка на ферме: как инфраструктура окупает сама себя</strong><strong class="t-uk" hidden>Топ-20 варіантів автономного заробітку на фермі: як інфраструктура окупає сама себе</strong><strong class="t-en" hidden>Top-20 Autonomous Earning Streams for the Farm: How the Infrastructure Pays for Itself</strong></span>
      <span class="summary-badge">[<span class="t-ru">Монетизация 24/7</span><span class="t-uk" hidden>Монетизація 24/7</span><span class="t-en" hidden>Monetization 24/7</span>]</span>
    </summary>
    <div class="accordion-content">
      <p style="margin: 0 0 16px 0;">
        <span class="t-ru">Помимо прямого решения бизнес- и производственных задач (Consilium, ЧПУ, аудит), ферма EvaLine — это круглосуточный генератор пассивных и полупассивных доходов. 8 vCPU / 32 ГБ RAM во Франкфурте, Edge-шлюз в Айове, шлюз 94 LLM-моделей, n8n-автоматизации, голосовой движок и docs-платформа могут продавать себя сами — через API, подписки, контент и white-label. Ниже — реестр из 20 потоков дохода, ранжированных от самых быстрых к запуску до самых масштабируемых.</span><span class="t-uk" hidden>Окрім прямого розв'язання бізнес- та виробничих задач (Consilium, ЧПК, аудит), ферма EvaLine — це цілодобовий генератор пасивних та напівпасивних доходів. 8 vCPU / 32 ГБ ОЗУ у Франкфурті, Edge-шлюз в Айові, шлюз 94 LLM-моделей, n8n-автоматизації, голосовий рушій і docs-платформа можуть продавати себе самі — через API, підписки, контент та white-label. Нижче — реєстр із 20 потоків доходу, ранжованих від найшвидших до запуску до найбільш масштабованих.</span><span class="t-en" hidden>Beyond directly solving business and production tasks (Consilium, CNC, audits), the EvaLine farm is a 24/7 generator of passive and semi-passive income. 8 vCPU / 32 GB RAM in Frankfurt, the Iowa edge gateway, a 94-model LLM gateway, n8n automations, the voice engine, and the docs platform can sell themselves — via API, subscriptions, content, and white-label deals. Below is a registry of 20 revenue streams, ranked from fastest to launch to most scalable.</span>
      </p>

      <!-- REVENUE SCENARIOS KPI -->
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%">
        <thead>
          <tr>
            <th width="20%" align="center"><span class="t-ru">Сценарий</span><span class="t-uk" hidden>Сценарій</span><span class="t-en" hidden>Scenario</span></th>
            <th width="40%" align="left"><span class="t-ru">Состав дохода</span><span class="t-uk" hidden>Склад доходу</span><span class="t-en" hidden>Income Mix</span></th>
            <th width="40%" align="left"><span class="t-ru">Потенциал против OpEx $257.54/мес</span><span class="t-uk" hidden>Потенціал проти OpEx $257.54/міс</span><span class="t-en" hidden>Potential vs OpEx $257.54/mo</span></th>
          </tr>
        </thead>
        <tbody>
          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">~$500–1,000/мес</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Консервативный: 2–3 API-клиента + 1 бот-подписка</span><span class="t-uk" hidden>Консервативний: 2–3 API-клієнти + 1 бот-підписка</span><span class="t-en" hidden>Conservative: 2–3 API clients + 1 bot subscription</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Покрывает OpEx ×2–4, ферма выходит в плюс за 1–2 недели</span><span class="t-uk" hidden>Покриває OpEx ×2–4, ферма виходить у плюс за 1–2 тижні</span><span class="t-en" hidden>Covers OpEx ×2–4, farm breaks even within 1–2 weeks</span></small></td>
          </tr>
          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">~$2,500–5,000/мес</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Базовый: SaaS-подписки + консилиум-аудиты + контент</span><span class="t-uk" hidden>Базовий: SaaS-підписки + консиліум-аудити + контент</span><span class="t-en" hidden>Baseline: SaaS subscriptions + Consilium audits + content</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">OpEx покрывается на 10–20×, маржа &gt;85% на free-quota моделях</span><span class="t-uk" hidden>OpEx покривається на 10–20×, маржа &gt;85% на free-quota моделях</span><span class="t-en" hidden>OpEx covered 10–20×, &gt;85% margin on free-quota models</span></small></td>
          </tr>
          <tr class="kpi-row kpi-purple">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">~$10,000+/мес</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Амбициозный: white-label франшиза + корпоративные SaaS-контракты</span><span class="t-uk" hidden>Амбіційний: white-label франшиза + корпоративні SaaS-контракти</span><span class="t-en" hidden>Ambitious: white-label franchise + enterprise SaaS contracts</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Масштабируется без роста персонала — только клонирование пайплайнов</span><span class="t-uk" hidden>Масштабується без зростання персоналу — лише клонування пайплайнів</span><span class="t-en" hidden>Scales without headcount growth — only pipeline cloning</span></small></td>
          </tr>
        </tbody>
      </table>

      <!-- TOP-20 REGISTRY -->
      <table class="kpi-table" border="1" cellpadding="8" cellspacing="0" width="100%" style="margin-top: 16px;">
        <thead>
          <tr>
            <th width="4%" align="center">№</th>
            <th width="24%" align="left"><span class="t-ru">Вариант заработка</span><span class="t-uk" hidden>Варіант заробітку</span><span class="t-en" hidden>Earning Stream</span></th>
            <th width="46%" align="left"><span class="t-ru">Как ферма это делает автономно</span><span class="t-uk" hidden>Як ферма це робить автономно</span><span class="t-en" hidden>How the Farm Does It Autonomously</span></th>
            <th width="26%" align="left"><span class="t-ru">Модель дохода</span><span class="t-uk" hidden>Модель доходу</span><span class="t-en" hidden>Revenue Model</span></th>
          </tr>
        </thead>
        <tbody>
          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">01</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">EvaBot-as-a-Service: аренда ИИ-сотрудников</span><span class="t-uk" hidden>EvaBot-as-a-Service: оренда ШІ-співробітників</span><span class="t-en" hidden>EvaBot-as-a-Service: renting AI employees</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Клиент получает выделенного агента (чат + голос + мониторинг) на нашей ферме; квоты 62 бесплатных моделей делают себестоимость ≈ $0</span><span class="t-uk" hidden>Клієнт отримує виділеного агента (чат + голос + моніторинг) на нашій фермі; квоти 62 безкоштовних моделей роблять собівартість ≈ $0</span><span class="t-en" hidden>Client gets a dedicated agent (chat + voice + monitoring) on our farm; 62 free-model quotas make cost ≈ $0</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Подписка $99–$999/мес на сотрудника</span><span class="t-uk" hidden>Підписка $99–$999/міс на співробітника</span><span class="t-en" hidden>Subscription $99–$999/mo per employee</span></small></td>
          </tr>
          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">02</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Реселлинг API-доступа к шлюзу 94 LLM (OmniRoute)</span><span class="t-uk" hidden>Реселінг API-доступу до шлюзу 94 LLM (OmniRoute)</span><span class="t-en" hidden>Reselling API access to the 94-LLM gateway (OmniRoute)</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Единый OpenAI-совместимый эндпоинт с автороутингом между free-quota и платными моделями; наценка на токены при себестоимости free-tier ≈ $0</span><span class="t-uk" hidden>Єдиний OpenAI-сумісний ендпоінт з автороутингом між free-quota та платними моделями; націнка на токени при собівартості free-tier ≈ $0</span><span class="t-en" hidden>Single OpenAI-compatible endpoint with auto-routing between free-quota and paid models; token markup at ≈ $0 free-tier cost</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Наценка 30–100% на токены + тариф за запрос</span><span class="t-uk" hidden>Націнка 30–100% на токени + тариф за запит</span><span class="t-en" hidden>30–100% token markup + per-request pricing</span></small></td>
          </tr>
          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">03</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Консилиум-аудиты решений под ключ</span><span class="t-uk" hidden>Консиліум-аудити рішень під ключ</span><span class="t-en" hidden>Turnkey Consilium decision audits</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Состязательный дебат 94 моделей по вопросу клиента → протокол, риски, вердикт консенсуса; полностью агентный прогон</span><span class="t-uk" hidden>Змагальний дебат 94 моделей із питання клієнта → протокол, ризики, вердикт консенсусу; повністю агентний прогін</span><span class="t-en" hidden>Adversarial debate of 94 models on the client's question → protocol, risks, consensus verdict; fully agentic run</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Разовые аудиты $150–$1,500</span><span class="t-uk" hidden>Разові аудити $150–$1,500</span><span class="t-en" hidden>One-off audits $150–$1,500</span></small></td>
          </tr>
          <tr class="kpi-row kpi-green">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">04</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Агентные боты для мессенджеров под ключ</span><span class="t-uk" hidden>Агентні боти для месенджерів під ключ</span><span class="t-en" hidden>Turnkey agent bots for messengers</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Telegram / WhatsApp / Viber / Messenger: приём заказов, поддержка, CRM-интеграция через n8n-пайплайны фермы</span><span class="t-uk" hidden>Telegram / WhatsApp / Viber / Messenger: прийом замовлень, підтримка, CRM-інтеграція через n8n-пайплайни ферми</span><span class="t-en" hidden>Telegram / WhatsApp / Viber / Messenger: order intake, support, CRM integration via farm n8n pipelines</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$49–$299/мес за бота + setup fee</span><span class="t-uk" hidden>$49–$299/міс за бота + setup fee</span><span class="t-en" hidden>$49–$299/mo per bot + setup fee</span></small></td>
          </tr>
          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">05</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">White-label франшиза «цифровых сотрудников»</span><span class="t-uk" hidden>White-label франшиза «цифрових співробітників»</span><span class="t-en" hidden>White-label franchise of "digital employees"</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Партнёр получает клон фабрики (скрипты, Caddy, консилиум, брендинг) и продаёт в своём регионе; мы — лицензия и поддержка</span><span class="t-uk" hidden>Партнер отримує клон фабрики (скрипти, Caddy, консиліум, брендінг) і продає у своєму регіоні; ми — ліцензія та підтримка</span><span class="t-en" hidden>Partner gets a farm clone (scripts, Caddy, Consilium, branding) and resells regionally; we provide license and support</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Лицензия $500–$5,000 + роялти 10–20%</span><span class="t-uk" hidden>Ліцензія $500–$5,000 + роялті 10–20%</span><span class="t-en" hidden>License $500–$5,000 + 10–20% royalty</span></small></td>
          </tr>
          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">06</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Автономный контент-конвейер (SEO, карточки, переводы)</span><span class="t-uk" hidden>Автономний контент-конвеєр (SEO, картки, переклади)</span><span class="t-en" hidden>Autonomous content pipeline (SEO, product cards, translations)</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Трёхъязычный штат агентов генерирует статьи, описания товаров, локализацию EN/UK/RU и публикует по расписанию через docs-платформу</span><span class="t-uk" hidden>Тримовний штат агентів генерує статті, описи товарів, локалізацію EN/UK/RU та публікує за розкладом через docs-платформу</span><span class="t-en" hidden>The trilingual agent fleet generates articles, product descriptions, EN/UK/RU localization, and publishes on schedule via the docs platform</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Оплата за статью / пакет / месячный SLA</span><span class="t-uk" hidden>Оплата за статтю / пакет / місячний SLA</span><span class="t-en" hidden>Per article / package / monthly SLA</span></small></td>
          </tr>
          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">07</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Автономные медиа-каналы (Telegram, YouTube, лонгриды)</span><span class="t-uk" hidden>Автономні медіа-канали (Telegram, YouTube, лонгріди)</span><span class="t-en" hidden>Autonomous media channels (Telegram, YouTube, longreads)</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Агенты ведут тематические каналы (ИИ-индустрия, автоматизация заводов): копирайтинг, монтаж текстов, аудит качества — без человека</span><span class="t-uk" hidden>Агенти ведуть тематичні канали (ШІ-індустрія, автоматизація заводів): копірайтинг, монтаж текстів, аудит якості — без людини</span><span class="t-en" hidden>Agents run niche channels (AI industry, plant automation): copywriting, text editing, QA — no human</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Реклама, донаты, платные подписки канала</span><span class="t-uk" hidden>Реклама, донати, платні підписки каналу</span><span class="t-en" hidden>Ads, donations, paid channel subscriptions</span></small></td>
          </tr>
          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">08</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Продажа промпт-библиотек и агентных шаблонов</span><span class="t-uk" hidden>Продаж промпт-бібліотек і агентних шаблонів</span><span class="t-en" hidden>Selling prompt libraries and agent templates</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Реестр боевых пайплайнов (консилиум, аудит, CNC-контур) упаковывается в шаблоны для n8n / LangChain / OpenRouter</span><span class="t-uk" hidden>Реєстр бойових пайплайнів (консиліум, аудит, CNC-контур) пакується в шаблони для n8n / LangChain / OpenRouter</span><span class="t-en" hidden>The battle-tested pipeline registry (Consilium, audit, CNC loop) packaged as templates for n8n / LangChain / OpenRouter</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Разовые продажи + маркетплейс-комиссии</span><span class="t-uk" hidden>Разові продажі + маркетплейс-комісії</span><span class="t-en" hidden>One-off sales + marketplace commissions</span></small></td>
          </tr>
          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">09</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Отраслевая разведка по подписке (дайджесты)</span><span class="t-uk" hidden>Галузева розвідка за підпискою (дайджести)</span><span class="t-en" hidden>Industry intelligence digests by subscription</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Ежедневный мониторинг цен, конкурентов, нормативов (CE, ISO, REACH) и новостей рынка EVA-полимеров с вердиктом консилиума</span><span class="t-uk" hidden>Щоденний моніторинг цін, конкурентів, нормативів (CE, ISO, REACH) та новин ринку EVA-полімерів із вердиктом консиліуму</span><span class="t-en" hidden>Daily monitoring of prices, competitors, standards (CE, ISO, REACH), and EVA polymer market news with a Consilium verdict</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$29–$199/мес за подписчика</span><span class="t-uk" hidden>$29–$199/міс за підписника</span><span class="t-en" hidden>$29–$199/mo per subscriber</span></small></td>
          </tr>
          <tr class="kpi-row kpi-cyan">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">10</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Голосовые AI-ассистенты для приёмных и горячих линий</span><span class="t-uk" hidden>Голосові ШІ-асистенти для приймалень і гарячих ліній</span><span class="t-en" hidden>Voice AI assistants for front desks and hotlines</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Голосовой движок фермы (RU/UK/EN) отвечает на звонки 24/7, квалифицирует заявку, передаёт в CRM или на CNC-производство</span><span class="t-uk" hidden>Голосовий рушій ферми (RU/UK/EN) відповідає на дзвінки 24/7, кваліфікує заявку, передає в CRM або на CNC-виробництво</span><span class="t-en" hidden>The farm's voice engine (RU/UK/EN) answers calls 24/7, qualifies leads, and routes them to CRM or CNC production</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Аренда линии $99–$499/мес + минуты</span><span class="t-uk" hidden>Оренда лінії $99–$499/міс + хвилини</span><span class="t-en" hidden>Line rental $99–$499/mo + per-minute</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">11</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Микроуслуги автоматизации на фриланс-маркетплейсах</span><span class="t-uk" hidden>Мікросервіси автоматизації на фриланс-маркетплейсах</span><span class="t-en" hidden>Automation microservices on freelance marketplaces</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Парсинг, мониторинг цен, генерация отчётов, батч-обработка данных — выполняются агентами, продаются как gig-услуги</span><span class="t-uk" hidden>Парсинг, моніторинг цін, генерація звітів, батч-обробка даних — виконуються агентами, продаються як gig-послуги</span><span class="t-en" hidden>Scraping, price monitoring, report generation, batch data processing — executed by agents, sold as gig services</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Оплата за задачу, высокая маржа</span><span class="t-uk" hidden>Оплата за задачу, висока маржа</span><span class="t-en" hidden>Per-task pricing, high margin</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">12</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Приватные LLM-консилиумы on-premise для чувствительных данных</span><span class="t-uk" hidden>Приватні LLM-консиліуми on-premise для чутливих даних</span><span class="t-en" hidden>Private on-premise LLM consiliums for sensitive data</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Компаниям, которым нельзя отдавать данные в облако, — выделенный консилиум на нашей ноде с закрытым контуром и NDA</span><span class="t-uk" hidden>Компаніям, яким не можна віддавати дані в хмару, — виділений консиліум на нашій ноді із закритим контуром і NDA</span><span class="t-en" hidden>For companies that cannot send data to the cloud — a dedicated consilium on our node in a closed loop under NDA</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$500–$3,000/мес за выделенную ноду</span><span class="t-uk" hidden>$500–$3,000/міс за виділену ноду</span><span class="t-en" hidden>$500–$3,000/mo per dedicated node</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">13</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">n8n-автоматизации под ключ</span><span class="t-uk" hidden>n8n-автоматизації під ключ</span><span class="t-en" hidden>Turnkey n8n automations</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Ферма проектирует и хостит workflow-автоматизации (почта → CRM → счёт → отчёт) на своём Docker-инстансе n8n</span><span class="t-uk" hidden>Ферма проєктує та хостить workflow-автоматизації (пошта → CRM → рахунок → звіт) на своєму Docker-інстансі n8n</span><span class="t-en" hidden>The farm designs and hosts workflow automations (email → CRM → invoice → report) on its Docker n8n instance</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$100–$1,000 за workflow + хостинг</span><span class="t-uk" hidden>$100–$1,000 за workflow + хостинг</span><span class="t-en" hidden>$100–$1,000 per workflow + hosting</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">14</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Знаниевые базы и документация как продукт</span><span class="t-uk" hidden>Знанієві бази та документація як продукт</span><span class="t-en" hidden>Knowledge bases and documentation as a product</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Nginx docs-платформа и knowledge-base фермы превращаются в отраслевые вики/справочники по подписке (стандарты, ГОСТ/ISO/CE)</span><span class="t-uk" hidden>Nginx docs-платформа та knowledge-base ферми перетворюються на галузеві вікі/довідники за підпискою (стандарти, ДСТУ/ISO/CE)</span><span class="t-en" hidden>The Nginx docs platform and farm knowledge base become industry wikis/reference hubs by subscription (GOST/ISO/CE standards)</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Подписка $19–$99/мес + реклама</span><span class="t-uk" hidden>Підписка $19–$99/міс + реклама</span><span class="t-en" hidden>Subscription $19–$99/mo + ads</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">15</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Обучающие курсы и демо-стенд «агентные фабрики»</span><span class="t-uk" hidden>Навчальні курси та демо-стенд «агентні фабрики»</span><span class="t-en" hidden>Courses and demo stand on building "agent factories"</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Живой кластер — это учебник: курс по автономным агентам с лабораторными на реальной ферме (консилиум, роутинг, деплой)</span><span class="t-uk" hidden>Живий кластер — це підручник: курс з автономних агентів із лабораторними на реальній фермі (консиліум, роутинг, деплой)</span><span class="t-en" hidden>The live cluster is the textbook: a course on autonomous agents with labs on a real farm (consilium, routing, deploy)</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$99–$499 за курс + корпоративные воркшопы</span><span class="t-uk" hidden>$99–$499 за курс + корпоративні воркшопи</span><span class="t-en" hidden>$99–$499 per course + corporate workshops</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">16</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Партнёрские (affiliate) воронки автономными агентами</span><span class="t-uk" hidden>Партнерські (affiliate) воронки автономними агентами</span><span class="t-en" hidden>Affiliate funnels run by autonomous agents</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Агенты пишут обзоры инструментов/API/железа с реальным опытом эксплуатации фермы и монетизируют партнёрские ссылки</span><span class="t-uk" hidden>Агенти пишуть огляди інструментів/API/заліза з реальним досвідом експлуатації ферми та монетизують партнерські посилання</span><span class="t-en" hidden>Agents write reviews of tools/APIs/hardware based on real farm operations experience and monetize affiliate links</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Комиссии 5–30% с рефералов</span><span class="t-uk" hidden>Комісії 5–30% з рефералів</span><span class="t-en" hidden>5–30% referral commissions</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">17</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Продажа датасетов и телеметрии эффективности агентов</span><span class="t-uk" hidden>Продаж датасетів і телеметрії ефективності агентів</span><span class="t-en" hidden>Selling datasets and agent-performance telemetry</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Анонимизированные логи консилиумов, роутинга и стоимости прогона — ценный датасет для ML-команд и research-групп</span><span class="t-uk" hidden>Анонімізовані логи консиліумів, роутингу та вартості прогону — цінний датасет для ML-команд і research-груп</span><span class="t-en" hidden>Anonymized consilium/routing/cost logs — a valuable dataset for ML teams and research groups</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Датасеты $200–$5,000 / research-партнёрства</span><span class="t-uk" hidden>Датасети $200–$5,000 / research-партнерства</span><span class="t-en" hidden>Datasets $200–$5,000 / research partnerships</span></small></td>
          </tr>
          <tr class="kpi-row kpi-amber">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">18</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Микро-SaaS: калькуляторы, планировщики, ROI-стенды</span><span class="t-uk" hidden>Мікро-SaaS: калькулятори, планувальники, ROI-стенди</span><span class="t-en" hidden>Micro-SaaS: calculators, planners, ROI stands</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Freemium-инструменты (как ROI-калькулятор манифеста): бесплатный расчёт → платный PDF-аудит и экспорт</span><span class="t-uk" hidden>Freemium-інструменти (як ROI-калькулятор маніфесту): безкоштовний розрахунок → платний PDF-аудит і експорт</span><span class="t-en" hidden>Freemium tools (like the manifesto ROI calculator): free calculation → paid PDF audit and export</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$5–$49 разово / freemium-конверсия</span><span class="t-uk" hidden>$5–$49 разово / freemium-конверсія</span><span class="t-en" hidden>$5–$49 one-off / freemium conversion</span></small></td>
          </tr>
          <tr class="kpi-row kpi-purple">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">19</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">Аренда edge-мощностей и хостинг легальных сервисов</span><span class="t-uk" hidden>Оренда edge-потужностей і хостинг легальних сервісів</span><span class="t-en" hidden>Renting edge capacity and hosting legal services</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Свободные мощности dual-node меша (HTTP/3 Caddy, Tailscale) сдаются под статики, прокси легальных API и staging-окружения</span><span class="t-uk" hidden>Вільні потужності dual-node мешу (HTTP/3 Caddy, Tailscale) здаються під статики, проксі легальних API та staging-оточення</span><span class="t-en" hidden>Spare dual-node mesh capacity (HTTP/3 Caddy, Tailscale) rented for statics, legal API proxies, and staging environments</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$20–$200/мес за хостинг-слот</span><span class="t-uk" hidden>$20–$200/міс за хостинг-слот</span><span class="t-en" hidden>$20–$200/mo per hosting slot</span></small></td>
          </tr>
          <tr class="kpi-row kpi-purple">
            <td class="kpi-val-cell" align="center"><strong class="kpi-val">20</strong></td>
            <td class="kpi-lbl-cell"><strong><span class="t-ru">AI-контроль качества чужого контента (верификация как услуга)</span><span class="t-uk" hidden>ШІ-контроль якості чужого контенту (верифікація як сервіс)</span><span class="t-en" hidden>AI quality control for third-party content (verification-as-a-service)</span></strong></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">Состязательный аудит (CISO/QA-агенты фермы) проверяет тексты, сметы, ТЗ и дипфейк-риски заказчика на галлюцинации и ошибки</span><span class="t-uk" hidden>Змагальний аудит (CISO/QA-агенти ферми) перевіряє тексти, кошториси, ТЗ і дипфейк-ризики замовника на галюцинації та помилки</span><span class="t-en" hidden>Adversarial audit (farm CISO/QA agents) checks client texts, quotes, specs, and deepfake risks for hallucinations and errors</span></small></td>
            <td class="kpi-sub-cell"><small><span class="t-ru">$50–$500 за верификацию / месячный SLA</span><span class="t-uk" hidden>$50–$500 за верифікацію / місячний SLA</span><span class="t-en" hidden>$50–$500 per verification / monthly SLA</span></small></td>
          </tr>
        </tbody>
      </table>

      <p style="margin: 16px 0 0 0;" class="dim-note">
        <small><span class="t-ru">Ключевой принцип: себестоимость большинства потоков ≈ $0 благодаря 62 бесплатным моделям (free-quota) — маржа практически полностью идёт в покрытие OpEx $257.54/мес и рост фермы. Каждый поток запускается существующими агентами без найма персонала.</span><span class="t-uk" hidden>Ключовий принцип: собівартість більшості потоків ≈ $0 завдяки 62 безкоштовним моделям (free-quota) — маржа практично повністю йде на покриття OpEx $257.54/міс та зростання ферми. Кожен поток запускається наявними агентами без найму персоналу.</span><span class="t-en" hidden>Key principle: the cost basis of most streams is ≈ $0 thanks to 62 free-quota models — margin goes almost entirely to covering the $257.54/mo OpEx and farm growth. Every stream is launched by existing agents with zero hiring.</span></small>
      </p>
    </div>
  </details>
  <hr class="section-divider">
"""

def get_section_00():
    return _SECTION_00_HTML
