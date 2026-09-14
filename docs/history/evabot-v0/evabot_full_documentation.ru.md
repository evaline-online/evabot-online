# EvaBot Online — Полная Документация Чистого Live-Markdown Движка (`evabot_full_documentation.ru.md`)

> **Версия системы:** v2.7.0 (Чистая Архитектура Live-Markdown)  
> **Живой Продакшн URL:** [https://evabot.online](https://evabot.online)  
> **Репозиторий GitHub:** [`evabot-online/evaline-online`](https://github.com/evabot-online/evaline-online)  

---

## 1. Общий обзор системы

EvaBot Online был полностью перестроен с чистого листа на **100% Чистой Архитектуре Live-Markdown**. Система использует обычный Markdown в качестве единственного источника правды для веб и CLI интерфейсов, с поддержкой телеметрии в реальном времени каждые 1000 мс, ASCII прогресс-барами, живым чатом, интерактивным Канбаном и бухгалтерией.

---

## 2. Инфраструктура и Вычислительные Узлы

| Название Узла | Облачный Провайдер | Тип Машины | Регион и Зона | Внутренний / Внешний IP | Тарифный План | Назначение |
|---|---|---|---|---|---|---|
| `evaline-micro-vm` | Google Cloud | `e2-micro` | `us-central1-a` (Айова) | `10.128.0.2` / `136.114.26.252` | GCP Always Free ($0.00/мес) | Caddy TLS 1.3 Краевой Прокси |
| `evabot-agent-vm` | Google Cloud | `c3-standard-8` | `europe-west3-a` (Франкфурт) | `10.156.0.2` / `34.179.253.183` | On-Demand (~$300.00/мес) | Основное вычислительное ядро AI |

---

## 3. Финансовый OPEX и Бухгалтерия

- **Строгая Валютная Политика:** Все финансовые расчеты, балансы и тарифы ведутся исключительно в валютах **USD ($)** и **EUR (€)**.
- **Оценка Общего OPEX:** ~$325.00 / мес (~€300.00 / мес)
- **Экономия Always Free:** $0.00 / мес для микро-узла
- **Тариф Google AI Pro:** $20.00 / мес (€18.50 / мес)

---

## 4. Телеметрия в Реальном Времени и Движок Live Markdown

- **`LiveMarkdownEngine` (`src/core/LiveMarkdownEngine.ts`)**:
  - Работает с тактом в 1000 мс для вычисления нагрузки CPU, памяти RAM, секунд работы и финансовых итогов.
  - Автоматически заменяет метрические теги (`[metric:frankfurt_cpu]`, `[metric:iowa_ram]`, `[metric:uptime]`).
  - Генерирует динамические ASCII прогресс-бары (`[progress:frankfurt_cpu]`).
  - Парсит Markdown непосредственно в высокоплотную построчную NO-CSS HTML TUI табличную сетку и вложенные аккордеоны `<details><summary>`.

---

## 5. Автоматические CI Тесты (`npm test`)

```text
================================================================================
RUNNING LIVE-MARKDOWN AUTOMATED TEST SUITE FOR CI VERIFICATION
================================================================================
[PASS] Telemetry Frankfurt CPU load active
[PASS] Telemetry Iowa memory specification verified
[PASS] Strict Currency compliance (No RUB/₽)
[PASS] USD ($) and EUR (€) OpEx telemetry formatted correctly
[PASS] ASCII progress bar generation verified
[PASS] Heading 1 compiled
[PASS] Collapsible accordion compiled
[PASS] Pure NO-CSS HTML grid table compiled
================================================================================
TEST SUMMARY: 8 PASSED, 0 FAILED
================================================================================
```
