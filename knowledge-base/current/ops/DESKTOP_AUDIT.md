---
title: "Desktop Audit Report"
date: "2026-09-07"
tags:
  - "ops"
  - "audit"
  - "desktop"
description: "Аудит содержимого ~/Desktop с классификацией и планом реорганизации"
---

# Desktop Audit Report

**Дата:** 2026-09-07 · **Узел:** `evabot-agent-vm` · **Режим:** report-only (ничего не перемещено и не удалено)

## Сводка

| Путь | Размер | Классификация | Рекомендация |
| --- | --- | --- | --- |
| `_archive/` | 239M (238 988 491 B) | ARCHIVE | Оставить, сжать в tar.zst; `legacy_prototypes/` — вне docs-миграции |
| `evaline-com-ua/` | 27M (27 271 145 B) | DUPLICATE | Удалить после diff-сверки (см. ниже) |
| `antigravity/` | 708K | PRODUCTION | Разобрать: md → docs-repo, sites/ → projects/ |
| `gcloud/` | 153K (152 971 B) | TEST | stubs/ и generate_stubs_*.js — TEST; отчёт перенесён в docs |
| `opencode/` | 58K | TEST | eval-скрипты TEST; отчёты перенесены в docs |
| `omniroute/` | 21K | TEST | логи TEST; отчёты перенесены в docs |
| `ssh-bridge/` | 18K | PRODUCTION | Скрипты оставить; отчёты перенесены в docs |
| `mcp-servers.json` | 4K | PRODUCTION | Референс конфигурации MCP — оставить |
| `AGENTS.md` | 4K | DUPLICATE | Копия отличается от репо — перенесена в docs как `dev/AGENTS-desktop.md` |
| `evabot` (symlink) | 0 | PRODUCTION | Симлинк на `/var/www/evabot-backend` — оставить |
| `evabot-online` (symlink) | 0 | DUPLICATE | Дубликат симлинка `evabot` → удалить один из двух |
| `Antigravity-CLI.desktop` | 4K | JUNK | Проверить target; если бинаря нет — удалить |
| `Antigravity-IDE.desktop` | 4K | JUNK | Проверить target; если бинаря нет — удалить |
| `Kilo-Code.desktop` | 4K | TEST | Рабочий лаунчер — переместить в `~/.local/share/applications/` |

## Детали решений

### evaline-com-ua (27M) — DUPLICATE

- Корневые `README.{ru,uk,en}.md` и вложенный каталог `evaline-com-ua/` с собственной копией
  тех же README/REPORT — вложенные копии отличаются от корневых (не байт-в-байт), это старый
  слепок сайта-прототипа.
- `evaline-knowledge-base/` (17M) содержит файлы, отсутствующие в `/var/www/evabot-backend/knowledge-base/`
  (README.\*, agent_tool.py, build_knowledge_base.py) — это прототипная версия, а не рабочий каталог.
- **Рекомендация:** сверить `diff -r` с текущим репо, затем перенести уникальные артефакты
  в `_archive/` и удалить каталог.

### _archive (239M) — ARCHIVE

- `legacy_prototypes/` (239M): ASCII, INSTALL, consilium, eva-face, eva-link и др. — вне скоупа
  документации, не копировался в docs-site.
- `reports_sep2026/` (116K): 6 из 7 отчётов байт-идентичны `docs/reports/*` (проверено `cmp`) —
  в docs-site включена только уникальная белая книга; дубликаты зафиксированы через `aliases`.
- **Рекомендация:** упаковать весь каталог в один архив и держать вне рабочего стола.

### antigravity (860K) — PRODUCTION (частично)

- `KANBAN.md`, `WORKLOG.md`, `AGENTS.md` отличаются от repo-версий (`diff` подтвердил) —
  перенесены в docs-site как отдельные файлы с суффиксами `-desktop`/`-antigravity`.
- `sites/` содержит заготовки 4 доменов (evabot.online, evaline.network, evaline.online,
  evaline.website) — кандидат в `projects/`.
- `logs/` пуст, `worklog.log`/`worklog.tsv` — рабочие журналы.

### *.desktop — JUNK/TEST

- Все три файла — валидные .desktop-записи, но лежат на рабочем столе как заглушки.
  `Kilo-Code.desktop` ссылается на существующий `/usr/local/bin/kilocode`; два Antigravity-файла
  — заглушки (JUNK), целевые бинари не проверены.

## Предлагаемая новая структура Desktop

```text
~/Desktop/
├── evabot -> /var/www/evabot-backend   # единственный симлинк
├── projects/                           # активные проекты
│   ├── antigravity-sites/              # sites/ из Desktop/antigravity
│   ├── gcloud-stubs/                   # Desktop/gcloud (кроме отчёта)
│   └── ssh-bridge/                     # Desktop/ssh-bridge (скрипты)
└── docs-repo/                          # источники, уже консолидированные в docs-site
    └── (пусто — всё перенесено в /var/www/evabot-backend/docs-site/content)
```

## Статус виконання (2026-09-07)

**Режим:** безпкове прибирання — нічого не видалено, все переміщено в `~/Desktop/_archive/cleanup-2026-09-07/` зі збереженням структури.

| Елемент | Дія | Новий шлях |
| --- | --- | --- |
| `Antigravity-CLI.desktop` (342 B) | переміщено | `_archive/cleanup-2026-09-07/Antigravity-CLI.desktop` |
| `Antigravity-IDE.desktop` (272 B) | переміщено | `_archive/cleanup-2026-09-07/Antigravity-IDE.desktop` |
| `Kilo-Code.desktop` (252 B) | переміщено | `_archive/cleanup-2026-09-07/Kilo-Code.desktop` |
| `mcp-servers.json` (3 982 B) | переміщено | `_archive/cleanup-2026-09-07/mcp-servers.json` |
| `evaline-com-ua/` (27 271 145 B) | переміщено (дублікат підтверджено: `cmp` по README.uk.md, scripts/convert_evaline.py, site/en/wholesale.md, site/ru/index.md, site/SUMMARY.md — усі ідентичні репо; `diff -rq` nested site — 0 відмінностей) | `_archive/cleanup-2026-09-07/evaline-com-ua/` |
| `opencode/` (57 858 B) | переміщено (усередині лише eval-артефакти: звіти, JSON, скрипти, логи, __pycache__) | `_archive/cleanup-2026-09-07/opencode/` |
| `omniroute/` (21 110 B) | переміщено (звіти + порожній logs/) | `_archive/cleanup-2026-09-07/omniroute/` |

- **Звільнено з поверхні Desktop: 27 354 961 B (~26.1 MiB).**
- Залишено навмисно: симлінки `evabot`/`evabot-online`, `AGENTS.md`, `antigravity/`, `gcloud/`, `ssh-bridge/`, `_archive/`, а також `ascii-art/` (активна робота від 2026-09-07, відсутня в оригінальному аудиті).
- Строром * `*.log`/`*.tmp` на корені Desktop не виявлено.
- Створено `~/Desktop/README.md` з описом нової структури.

## Зв'язане консолідації

- Отчёты Desktop → `reports/` и `models/` (см. [[index]])
- SSH-bridge и gcloud → `ops/` ([[ops/ssh-bridge/REPORT|SSH Bridge]], [[ops/GCLOUD_SERVERS_AUDIT_REPORT|GCloud Audit]])

---

Back to [[index]]
