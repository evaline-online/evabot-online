# EvaBot Online — Повна Документація Чистого Live-Markdown Двигуна (`evabot_full_documentation.uk.md`)

> **Версія системи:** v2.7.0 (Чиста Архітектура Live-Markdown)  
> **Живий Продакшн URL:** [https://evabot.online](https://evabot.online)  
> **Репозиторій GitHub:** [`evabot-online/evaline-online`](https://github.com/evabot-online/evaline-online)  

---

## 1. Загальний опис системи

EvaBot Online був повністю перебудований з чистого аркуша на **100% Чистій Архітектурі Live-Markdown**. Система використовує звичайний Markdown як єдине джерело правди для веб та CLI інтерфейсів, з підтримкою телеметрії у реальному часі кожні 1000 мс, ASCII прогрес-барами, живим чатом, інтерактивним Канбаном та бухгалтерією.

---

## 2. Інфраструктура та Обчислювальні Вузли

| Назва Вузла | Клауд Провайдер | Тип Машини | Регіон та Зона | Внутрішня / Зовнішня IP | Тарифний План | Призначення |
|---|---|---|---|---|---|---|
| `evaline-micro-vm` | Google Cloud | `e2-micro` | `us-central1-a` (Айова) | `10.128.0.2` / `136.114.26.252` | GCP Always Free ($0.00/міс) | Caddy TLS 1.3 Крайній Проксі |
| `evabot-agent-vm` | Google Cloud | `c3-standard-8` | `europe-west3-a` (Франкфурт) | `10.156.0.2` / `34.179.253.183` | On-Demand (~$300.00/міс) | Основне обчислювальне ядро AI |

---

## 3. Фінансовий OPEX та Бухгалтерія

- **Сувора Валютна Політика:** Усі фінансові розрахунки, баланси та тарифи ведуться виключно у валютах **USD ($)** та **EUR (€)**.
- **Оцінка Загального OPEX:** ~$325.00 / міс (~€300.00 / міс)
- **Економія Always Free:** $0.00 / міс для мікро-вузла
- **Тариф Google AI Pro:** $20.00 / міс (€18.50 / міс)

---

## 4. Телеметрія в Реальному Часі та Двигун Live Markdown

- **`LiveMarkdownEngine` (`src/core/LiveMarkdownEngine.ts`)**:
  - Працює з тактом у 1000 мс для обчислення завантаження CPU, пам'яті RAM, секунд роботи та фінансових підсумків.
  - Автоматично замінює метричні теги (`[metric:frankfurt_cpu]`, `[metric:iowa_ram]`, `[metric:uptime]`).
  - Генерирує динамічні ASCII прогрес-бари (`[progress:frankfurt_cpu]`).
  - Парсить Markdown безпосередньо у високоплотну построчну NO-CSS HTML TUI табличну сітку та вкладені аккордеони `<details><summary>`.

---

## 5. Автоматичні CI Тести (`npm test`)

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
