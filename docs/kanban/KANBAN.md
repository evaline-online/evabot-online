# 🟢 Kanban: EvaBot Online (Core Engine & Web Cyber-Terminal)

> **Репозиторий:** [`evabot-online`](https://github.com/evaline-online/evabot-online)
> **Локальный путь:** `/var/www/evabot-backend`
> **Публичный адрес:** [https://evabot.online](https://evabot.online)
> **Роль в кластере:** Основное вычислительное ядро (Frankfurt `100.66.98.4:3000`), маршрутизация LLM, API Hub, TUI & Web Client.
> **Обновлено:** 2026-09-09 (сводный список задач из сессий opencode; + новые задачи проверки evaline.online)

---

## 🔥 Сводный статус (по данным opencode.db, 09.09.2026)

> 214 задач в todo-таблицах сессий: **136 ✅ выполнено · 26 ⏳ в процессе · 52 ⬜ в ожидании**

---

## ⚡ В работе / Спринт 1

### EvaBot — память и персонализация
- [x] **TASK-1**: Команда `/commands` — полный список с описанием, usage, алиасами, сортировка по приоритету + алфавиту.
- [x] **TASK-2**: Система памяти пользователей — SQLite-модуль `UserMemory` (имена, предпочтения, история).
- [x] **TASK-343**: Жесткая языковая фиксация (Language Mirroring) UK/RU/EN на всех уровнях.
- [x] **TASK-346**: Полный селф-хостинг вариативного шрифта Roboto (woff2 100..900) + переключатель [CSS:ON/OFF].
- [x] **TASK-350**: Индексация базы знаний EvaLine в SQLite FTS5 (1438 чанков) и ChromaDB (1075 векторов).
- [x] **TASK-351**: Интеграция Edge-TTS нейро-голосов (uk-UA-PolinaNeural, ru-RU-DmitryNeural).
- [x] **TASK-354**: Прохождение всех 33 тест-сьютов бэкенда (85.7% statement coverage).
- [ ] **TASK-3**: Интеграция `UserMemory` в `terminal-chat.ts` (персональный подход) — ⏳ в процессе.
- [ ] **TASK-4**: Команда `/user` (или `/memory`) для просмотра/редактирования профиля пользователя — ⏳ в процессе.
- [ ] **TASK-5**: Прогнать lint/typecheck и тесты после интеграции памяти — ⬜ в ожидании.
- [ ] **TASK-373 (P1)**: Сохранение истории диалогов в `localStorage` + кнопка «Экспорт в Markdown/JSON».
- [ ] **TASK-374 (P2)**: Поиск и теги по моделям флота в диалоговом окне настроек.

### EvaBot — голос, персона, роли
- [x] **TASK-6**: Персонаж Евы — женская идентичность (голос/манеры/стиль), PersonaPolicy + роли Ева/Адам.
- [x] **TASK-7**: Команды `/idea`, `/error`, `/bug`, `/errors` реализованы.
- [x] **TASK-8**: Фикс `/voice/docs` + голосовой пайплайн (язык ⇄ голос).
- [x] **TASK-9**: Синк документации — 15 файлов, sync-скрипт, docs-site build.
- [x] **TASK-10**: Safe deploy + мгновенный откат (scripts + docs).
- [x] **TASK-11**: Финальная верификация: tsc=0, npm test 34/35, safe deploy SUCCESS.
- [ ] **TASK-12**: Браузерное тестирование `/idea /error /bug /errors`, Евы, 3 тем, голоса — ⏳ в процессе.
- [ ] **TASK-360 (P1)**: Полноценный WebAudio голосовой ввод и воспроизведение в `src/web/app.ts` через `/voice/`.
- [ ] **TASK-15**: Все каналы: Telegram (отключён), eva-face/*3d, docs, бизнес-тир Cloud Run — ⬜ в ожидании.
- [ ] **TASK-16**: Починить: модель `auto` зависает, Telegram без токена, nginx без микрофона — ⬜ в ожидании.

### EvaBot — модели и MCP
- [x] **TASK-320**: Команда `/auto` + `AutoModelRouter.ts` (умный переключатель бесплатных моделей).
- [x] **TASK-321**: Фикс сломанных fallback-цепочек (ghost omni/cf-*) в ModelRatings + маппинг провайдеров.
- [x] **TASK-329**: `/auto` в ModelCommand, CLI, TelegramBot; AutoRouter в ChatEngine + ChatRouter.
- [x] **TASK-330**: Тест `auto_model_router.test.ts` + реестр в suite.
- [x] **TASK-331**: Build (tsc) + полный тест-ран — без регрессий.
- [x] **TASK-332**: Обновление docs/kanban/KANBAN.md + docs/COMMANDS.md.
- [x] **TASK-333**: Restart evabot-brain.service + live smoke-test `/auto`.
- [x] **TASK-8x**: Отчёт по MCP-серверам (23 шт) сохранён в markdown; taskmaster убран.
- [ ] **TASK-17**: Полное тестирование каждого MCP / LSP, демонстрация работы, топ-5 основных — ⬜ в ожидании.
- [ ] **TASK-18**: Лимиты и расходы: GCP billing, TTS/STT usage, AccountingEngine — ⬜ в ожидании.
- [ ] **TASK-19**: Промо-коды/бесплатные модели: проверить ALL free-модели (openrouter/free, omni/*, gemini) — ⏳ в процессе.

### EvaBot — консилиум и субагенты
- [ ] **TASK-20**: Консилиум 10 агентов по Тетраксису/Сефирот (Бог→Адам+Ева+7 помощников) — дизайн — ⏳ в процессе.
- [ ] **TASK-21**: Нагрузочный тест: 10 агентов консилиума + 10 суб-агентов opencode — ⬜ в ожидании.
- [ ] **TASK-22**: Защита от зависаний: watchdog, фолбэки, переключение на альтернативы — ⏳ в процессе.
- [ ] **TASK-23**: `/services` `/servers` — описания, метрики, выбор моделей/сервисов — ⏳ в процессе.
- [ ] **TASK-24**: `/products` — база продуктов компании + матрица «кто что знает» — ⏳ в процессе.
- [ ] **TASK-25**: `/news` — теги новостей (Одеса, война, рынок EVA) + сбор свежих — ⏳ в процессе.

### EvaBot — данные и знания
- [ ] **TASK-26**: Данные компании Evaline с украинских сайтов (учредители, уставный капитал, ЕДРПОУ, КВЕД, доли) — ⏳ в процессе.
- [ ] **TASK-27**: EvaBot знает о серверах/сервисах/компании/агентах — документация и прописать в базу знаний — ⬜ в ожидании.
- [ ] **TASK-28**: История/память/поиск: `/history /memory /search /find` + автодополнение слов — ⬜ в ожидании.
- [ ] **TASK-29**: SQLite FTS5 / ChromaDB — подключение разных БД (plaintext → sql → vector) — ⬜ в ожидании.
- [ ] **TASK-30**: Синхронизация: npm build + restart evabot-brain + nginx /docs + проверка сайта — ⏳ в процессе.

### Сайт evaline.online (манифест/презентация)
- [x] **Этап 0**: Semantic HTML — rewrite `compile_manifesto.py`, CSS/JS в отдельные файлы; убрать inline onclick.
- [x] **Этап 1.1**: Design Tokens & Modern Reset (CSS custom properties, fluid clamp).
- [x] **Этап 1.2**: Layout System (Container, Grid, Container Queries, aspect-ratio).
- [x] **Этап 1.3**: Fluid Typography (clamp steps, Roboto VF).
- [x] **Этап 1.4**: Components — Accordion, Diagram Box, Mermaid/Markmap, KPI, ROI, Matrix, Glossary.
- [x] **Этап 1.5**: Themes CSS-only (cyber/paper/terminal/raw, print stylesheet).
- [x] **Этап 1.6**: Fluid Breakpoints (container queries first).
- [x] **Этап 2.1–2.8**: Core JS Utils, Mermaid Engine, Markmap Engine, Theme/Lang toggle, Accordion Enhancements, Models Matrix (virtual scroll), ROI Calculator, Cluster Health.
- [x] **Этап 2.9**: Performance (requestIdleCallback, defer/module, SW offline-first) — ⏳ в процессе.
- [x] **Этап 3**: Build Script (ESBuild, minify, asset copy) + Deploy Sync (deploy-sync.sh, GitHub, EvaBrain, EvaFace).
- [ ] **Этап 4**: QA/A11y/Perf (Lighthouse ≥90, axe 0 violations, keyboard, SR, print, no-JS, 3G) — ⏳ в процессе.
- [ ] **Этап 5**: Docs (AGENTS.md, STYLEGUIDE.md, CHANGELOG.md) — ⏳ в процессе.
- [ ] **Этап 6**: SW Service Worker offline — ⏳ в процессе (субагент 05:15).
- [x] **TASK-31**: Список ВСЕХ моделей построчно (94 шт) + топ-20 + даты релиза/обновления.
- [x] **TASK-32**: ASCII-логотип figlet slant + `.hero-ascii` CSS.
- [x] **TASK-33**: Тема neon3d — пересобрана во всех 4 версиях.
- [ ] **TASK-34**: Отчёт по 3D-библиотекам (встроить в ответ) — ⏳ в процессе.
- [ ] **TASK-35**: Адаптивная 3D-цепочка neon3d живьём в браузере — ⬜ в ожидании (было заблокировано chrome-devtools).
- [ ] **TASK-36**: До-проработать terminal/raw для text-браузеров (w3m/lynx) — ⬜ в ожидании.

### Проверка evaline.online (новые задачи от 09.09)
- [ ] **CHK-1**: Проверить, что evaline.online работает со стилями И без стилей (CSS ON/OFF, NOCSS-режим).
- [ ] **CHK-2**: Полная проверка evaline.online от и до — каждый код/текст/функция, разные размеры экрана, со стилями и без.
- [ ] **CHK-3**: Модуль «Путь к триллиону» — цены (бесплатно→суперагенты), схемы заработка на AI-агентствах/дата-центрах/серверах, кейсы до $1T, интеграция в сайт.
- [ ] **CHK-4**: Блок-аккордеон «Топ профессий»: топ-30 оплачиваемых + топ-30 важных/полезных + топ-30 LLM-агентов на базе Consilium.

### Репозитории и модульность (git)
- [x] **R1-1**: Аудит зашитых GitHub-токенов; ротация на `gh auth`; обновлены remotes.
- [x] **R1-2**: Удалены backups/*.tar.gz из git history; добавлен .gitignore.
- [x] **R1-3**: Branch protection на main (PR + 1 approval, force-push block).
- [x] **R2-1**: sync-modules.sh — синк 12 модульных репозиториев.
- [x] **R2-2**: docs-site/content → symlink → eva-docs (дедупликация).
- [x] **R2-3**: evaline.com.ua DNS + Caddy block на micro (136.114.26.252).
- [x] **R3-1**: GitHub Actions CI/CD enhanced (sync-modules step + smoke tests).
- [x] **R3-2**: Watchdog timer + Telegram alert via systemd (5-min interval).
- [x] **R3-3**: Uptime cron monitor (every 5 min) на main + micro VM.
- [x] **R4-1**: Архивация 5 устаревших репо (archived=True).
- [x] **R4-2**: v0.2.0 changelog entries + CHANGELOG.md во всех репо.
- [x] **TASK-37**: Созданы модульные репозитории: eva-face, eva-brain, eva-voice, evaline-consilium, eva-db, eva-history, eva-memory, eva-server, evaline-server, evabot-server, eva-docs, eva-reports, eva-kanban, eva-git.
- [x] **TASK-38**: План 1 проект = 1 папка + 1 архив сохранён в eva-plans.
- [x] **TASK-39**: Проверить, что все папки серверов ассоциированы с GitHub-репозиториями — ⏳ в процессе.

### Безопасность
- [x] **SEC-1**: Проверка authorized_keys (не потерять доступ).
- [x] **SEC-2**: fail2ban + sshd-джейл на обоих серверах.
- [x] **SEC-3**: GCP: удалены allow-vnc и default-allow-rdp.
- [x] **SEC-4**: SSH: отключены пароли извне (Match для Tailscale/домашнего IP).
- [x] **SEC-5**: Nginx: блокировка .env и dotfiles (404).
- [x] **SEC-6**: GCP: убран открытый 3000, ограничен 8090.
- [x] **SEC-7**: Хост-iptables: закрыты внешние порты сервисов + persistence.
- [x] **SEC-8**: Финальная верификация всех фиксов.
- [x] **SEC-9**: Снят тег `http-server` с evabot-agent-vm.
- [ ] **SEC-10**: Hardening Index до 90+ — ⬜ в ожидании (было 72).
- [ ] **SEC-11**: Завершить фоновые сканы (ClamAV, debsums, rkhunter, aide) + итоговый отчёт — ⬜ в ожидании.

### Аудит сайтов и серверов
- [ ] **AUD-1**: Проверить доступность всех доменов и IP (curl/HTTP) — ⏳ в процессе.
- [ ] **AUD-2**: Проверить Caddy конфиг на evaline-micro-vm — ⬜ в ожидании.
- [ ] **AUD-3**: Проверить бэкенд API на evabot-agent-vm — ⬜ в ожидании.
- [ ] **AUD-4**: Проверить nginx/docs-site на evaline-micro-vm — ⬜ в ожидании.
- [ ] **AUD-5**: Проверить GitHub Actions CI/CD pipeline — ⬜ в ожидании.
- [ ] **AUD-6**: Проверить deploy-sync.sh и safe-deploy.sh логику — ⬜ в ожидании.
- [ ] **AUD-7**: Проверить sync-docs.sh и docs-site сборку — ⬜ в ожидании.
- [ ] **AUD-8**: Проверить sync-modules.sh — ⬜ в ожидании.
- [ ] **AUD-9**: Проверить DNS записи и SSL сертификаты — ⬜ в ожидании.
- [ ] **AUD-10**: Проверить здоровье сервисов systemd — ⬜ в ожидании.
- [ ] **AUD-11**: Сгенерировать итоговый отчёт аудита — ⬜ в ожидании.

### 3D-голова (eva-face / eva-face-3d)
- [x] **FACE-1**: Snapshot-бэкап версии головы (snapshot-diff-halfblock-20260907-2333).
- [x] **FACE-2**: Python HTTP сервер для раздачи OBJ + веб-страницы.
- [x] **FACE-3**: HTML/JS с 5 режимами Canvas (тени, цвет, освещение), 3D-матричная голова.
- [x] **FACE-4**: Терминальная версия с теми же 5 режимами (ANSI color).
- [x] **FACE-5**: Shared engine head.js (генератор голов, Node + browser), build.js → faces.json + viewer.html + head3d.html.
- [x] **FACE-6**: Terminal-вьюер (collection + animated head) + браузерный viewer, синхронизация ?t=.
- [ ] **FACE-7**: Изучить структуру головы (headmodel_m0_default.ts) — ⏳ в процессе.
- [ ] **FACE-8**: Скриншот текущего лица (front/profile) для оценки — ⬜ в ожидании.
- [ ] **FACE-9**: Улучшить геометрию головы до «идеальной» версии — ⬜ в ожидании.
- [ ] **FACE-10**: FPS ≥ 60, адаптация рендера под слабые устройства, бенчмарки — ⬜ в ожидании.
- [ ] **FACE-11**: Лицо следит за мышкой/тачем; фронт при запуске — ⬜ в ожидании.
- [ ] **FACE-12**: Открыть по внешнему IP и домену `evabot.online/face` — ⬜ в ожидании (был ERR_CONNECTION_REFUSED).

---

## 📋 Бэклог фич
- [ ] **FEAT-101 (P2)**: Поддержка переключения тем оформления в веб-интерфейсе: Cyber Neon, Matrix CRT, Clean Day.
- [ ] **FEAT-102 (P2)**: Встраиваемый плавающий виджет 3D-аватара прямо в чате `evabot.online`.
- [ ] **FEAT-103 (P1)**: Доведение покрытия тестами фронтенда (`vitest`) с 35% до 60%.
- [ ] **FEAT-104 (P2)**: Экспорт диалогов в Telegram-бот и сохранение избранных ответов консилиума.
- [ ] **FEAT-105**: Универсальная команда `/add` (файлы/участники/контекст/БД/ссылки-источники) + `/file`.
- [ ] **FEAT-106**: Проверка покрытия тестами фронтенда и бэкенда в % (отчёт).
- [ ] **FEAT-107**: Снять вертикальный скролл на evaline.network на малых экранах; резиновая адаптивная вёрстка от портретного минимума.

---

## ✅ Завершено (v0.1.0)
- [x] **TASK-343**: Жесткая языковая фиксация (Language Mirroring) UK/RU/EN на всех уровнях.
- [x] **TASK-346**: Полный селф-хостинг вариативного шрифта Roboto (woff2 100..900) + переключатель [CSS:ON/OFF].
- [x] **TASK-350**: Индексация базы знаний EvaLine в SQLite FTS5 (1438 чанков) и ChromaDB (1075 векторов).
- [x] **TASK-351**: Интеграция Edge-TTS нейро-голосов (uk-UA-PolinaNeural, ru-RU-DmitryNeural).
- [x] **TASK-354**: Прохождение всех 33 тест-сьютов бэкенда (85.7% statement coverage).
- [x] **TASK-363 (P0)**: Починить маршрутизацию `/face/` на edge-шлюзе Caddy (проксирование на EvaBrain :80).
- [x] **TASK-8x**: Отчёт по MCP (23 шт, markdown) + удаление taskmaster.
- [x] **TASK-31..33**: Все модели построчно, ASCII-лого, тема neon3d.
- [x] **Этапы 0–2.8, 3**: evaline.online — семантика, темы, компоненты, движки схем, сборка и деплой.
- [x] **R1–R4**: Репозитории/модули — токены, CI/CD, watchdog, cron, архивация.
- [x] **SEC-1..9**: Безопасность — fail2ban, порты, пароли, harden-fixes, тег http-server снят.
- [x] **FACE-1..6**: 3D-голова — 5 режимов, терминал + браузер.