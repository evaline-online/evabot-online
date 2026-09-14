# 📚 EvaBot Online — Documentation Index

**Главный индекс всей документации проекта**

**Last Updated:** 2026-09-14 (v0.0.4)

---

## 🚀 Быстрый старт

- [**README.md**](../README.md) — главная страница проекта
- [**QUICK_START.md**](../QUICK_START.md) — быстрое руководство по запуску
- [**CHANGELOG.md**](./changelog/CHANGELOG.md) — история версий
- [**COMMANDS.md**](./COMMANDS.md) — руководство по системным и чат командам
- [**GLOSSARY.md**](./GLOSSARY.md) — термины и понятия экосистемы EvaBot / EvaLine

---

## 📂 Модульная структура документации

### 📋 [changelog/](./changelog/)

История изменений по версиям

- [README.md](./changelog/README.md) — index
- [CHANGELOG.md](./changelog/CHANGELOG.md) — полная сводка изменений

### 🏗️ [architecture/](./architecture/)

Архитектура системы и устойчивость

- [README.md](./architecture/README.md) — index
- [ARCHITECTURE.md](./architecture/ARCHITECTURE.md) — полная архитектура узлов (Compute Node / Edge Ingress)
- [EVALINE_EVABOT_CAPABILITIES_MANIFESTO.md](./architecture/EVALINE_EVABOT_CAPABILITIES_MANIFESTO.md) — глобальный манифест возможностей и устойчивости во время войны
- [GOOGLE_ECOSYSTEM_AGENT_FACTORY_ARCHITECTURE.md](./architecture/GOOGLE_ECOSYSTEM_AGENT_FACTORY_ARCHITECTURE.md) — архитектура автономной фабрики агентов на Google Cloud & Colab Pro
- [SEPHIROT_CONSILIUM.md](./architecture/SEPHIROT_CONSILIUM.md) — консилиум сефирот и мета-агентов

### 🖥️ [UI / UX Спецификации](./UI_SPECIFICATION.md)

- [UI_SPECIFICATION.md](./UI_SPECIFICATION.md) — универсальная линейная построчная спецификация 3 режимов (NoCSS, TUI, Web-CSS), без всплывающих окон, с адаптивной сеткой для мобильных и десктопов

### 🛠️ [ops/](./ops/) — Эксплуатация и Инфраструктурные Runbooks

- [SECRETS_MANAGER.md](./ops/SECRETS_MANAGER.md) — управление секретами и аудит биллинга Google Cloud
- [SAFE_DEPLOY.md](./ops/SAFE_DEPLOY.md) — регламент безопасного деплоя между Frankfurt и Iowa
- [SECURE_SSH_ACCESS.md](./ops/SECURE_SSH_ACCESS.md) — настройка и безопасность SSH доступа
- [MODEL_REGISTRY_SYNC.md](./ops/MODEL_REGISTRY_SYNC.md) — синхронизация моделей и каталога
- [CLOUD_TTS.md](./ops/CLOUD_TTS.md) — настройка и интеграция Edge-TTS и Cloud TTS
- [CLOUD_STT.md](./ops/CLOUD_STT.md) — голосовой ввод и Whisper STT
- [CLOUD_TRANSLATE.md](./ops/CLOUD_TRANSLATE.md) — автоперевод и многоязычность (UK/EN/RU/PL/DE/ES)
- [TELEGRAM_BOT.md](./ops/TELEGRAM_BOT.md) — интеграция с Telegram Bot API
- [DESKTOP_AUDIT.md](./ops/DESKTOP_AUDIT.md) — инвентаризация проектов и репозиториев рабочего стола
- [EVALINE_ONLINE_INGEST.md](./ops/EVALINE_ONLINE_INGEST.md) — сборка и загрузка данных базы знаний
- [OPENCODE_EXTENSIONS.md](./ops/OPENCODE_EXTENSIONS.md) — расширения и интеграции для OpenCode
- [OPENCODE_APPLIED.md](./ops/OPENCODE_APPLIED.md) — примененные патчи и конфигурации

### 📊 [reports/](./reports/)

Генеральные отчеты и финансовые сводки

- [SESSION_FINAL_REPORT_2026-09-07.md](./reports/SESSION_FINAL_REPORT_2026-09-07.md) — итоговый генеральный отчет сессии

### 🛡️ [security/](./security/)

Безопасность и аудиты

- [README.md](./security/README.md) — index
- [SECURITY_AUDIT.md](./security/SECURITY_AUDIT.md) — аудит v0.0.2
- [AUDIT-2026-09-09.md](./security/AUDIT-2026-09-09.md) — аудит безопасности v0.0.3

### 🤖 [models/](./models/)

AI модели и маршрутизация

- [README.md](./models/README.md) — index
- [MODELS_CATALOG.md](./models/MODELS_CATALOG.md) — каталог 78 моделей
- [GEMINI_QUOTA_VERIFICATION.md](./models/GEMINI_QUOTA_VERIFICATION.md) — верификация квот Gemini

### 🗺️ [roadmap/](./roadmap/)

Планы развития

- [README.md](./roadmap/README.md) — index
- [ROADMAP.md](./roadmap/ROADMAP.md) — полный roadmap

### 📋 [kanban/](./kanban/)

Канбан доска

- [README.md](./kanban/README.md) — index
- [KANBAN.md](./kanban/KANBAN.md) — текущие задачи

### 🚀 [deployment/](./deployment/)

Деплой и CI/CD

- [README.md](./deployment/README.md) — index
- [MONOREPO.md](./deployment/MONOREPO.md) — monorepo инструкции

### 📜 [WORKLOG.md](../WORKLOG.md)

Журнал событий (главный файл, транслируется в `/api/worklog`)

### 🏛️ [history/evabot-v0/](./history/evabot-v0/) — Архив модульной версии v0

Историческая документация (08.09.2026), сведённая с микро-сервера в единый источник правды

- [README.md](./history/evabot-v0/README.md) — index
- `evabot_modular_architecture.{ru,en,uk}.md` — полная архитектура v0
- `evabot_v001_release.{ru,en,uk}.md` — релиз v0.0.1

### 💾 [micro-server/](./micro-server/) — Архив микросервера (Iowa)

Документация, сведённая с микро-сервера `100.125.200.49` (Iowa) — мультиязычные версии, база знаний, UI v1, доменные спецификации

- `architecture/` — локализованные архитектурные спецификации (EN/RU/UK)
- `audit/` — отчёты аудита и диагностики (EN/RU/UK)
- `knowledge-base/` — гибридная база знаний (177 md на 6 языках) + dossier компании
- `pages/` — доменные спецификации (.unui.md)
- `legacy-ui/` — архив интерфейса v1 (en/uk/ru)
- `frontend/` — frontend тесты
- `user_guide.{en,ru,uk}.md` — руководство пользователя
- `audit_and_diagnosis.{en,ru,uk}.md` — отчёты аудита

---
- `evabot_cli_verification.{ru,en,uk}.md` — верификация CLI
- `evabot_full_documentation.{ru,en,uk}.md` — полная документация

---

## 🔗 Governace и Синхронизация

- [**DOCS_GOVERNANCE.md**](./DOCS_GOVERNANCE.md) — архитектура Единого Источника Правды, конвенции, процесс обновления
- `docs-central.sh` — скрипт синхронизации (master → eva-docs → GitHub → knowledge-base → micro-server)

---

## 📊 Статистика документации

| Категория | Файлов | Строк |
| ----------- | -------- | ------- |
| Главная (корень) | 6 | ~1,200 |
| ops/ | 12 | ~3,100 |
| architecture/ | 4 | ~1,800 |
| UI/UX & Commands | 3 | ~1,400 |
| security/ | 3 | ~600 |
| models/ | 3 | ~500 |
| roadmap/ & kanban/ | 4 | ~510 |
| changelog/ & deployment/ | 4 | ~390 |
| history/evabot-v0/ | 13 | ~2,400 |
| micro-server/ | 232 | ~30,000 |
| **ИТОГО** | **285** | **~42,400** |

---

## 🔍 Поиск

Используй `grep -r "ваш запрос" docs/` для поиска по всей документации или веб-версию `https://evabot.online/docs/`.

---

**Maintained by:** EvaBot Engineering Team  
**License:** Proprietary © 2026 Evaline Corporation
