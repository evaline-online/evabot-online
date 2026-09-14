# ⚡ EVABOT ONLINE v0.0.1 // ПОЛНАЯ СПЕЦИФИКАЦИЯ MARKDOWN TUI ИНТЕРФЕЙСА

## 👤 [ЭКРАН 1: 3D КИБЕР-ЛИЦО И КОНСОЛЬ ПРОМПТОВ LLM]
### 📍 БЛОК 1.1: ИНТЕРАКТИВНАЯ 3D КНОПКА-ЛИЦО С СЕТКОЙ ПОЛИГОНОВ
[block:3d_cyber_face]

### 📍 БЛОК 1.2: СТРОКА ВВОДА ПРОМПТА ДЛЯ LLM
**ВВЕДИТЕ ЗАПРОС ДЛЯ EVABOT (v0.0.1):** [input:term-input "введите запрос для LLM агента..."] [ОТПРАВИТЬ](action:submitPrompt)

### 📍 БЛОК 1.3: ЖИВОЙ ЧАТ GEMINI CORE
[block:live_chat]

---

## 🖥️ [ЭКРАН 2: ТЕЛЕМЕТРИЯ СЕРВЕРОВ В РЕАЛЬНОМ ВРЕМЕНИ]
### 📍 БЛОК 2.1: ОСНОВНОЙ ВЫЧИСЛИТЕЛЬНЫЙ УЗЕЛ (ФРАНКФУРТ c3-standard-8)
[source:gcloud "34.179.253.183 (VPC 10.156.0.2)"]
- **РАСПОЛОЖЕНИЕ:** Франкфурт europe-west3-a | **ВРЕМЯ РАБОТЫ:** `[metric:uptime]`
- **СПЕЦИФИКАЦИЯ:** 8 vCPU Intel Sapphire Rapids, 32 GB DDR5 RAM, 50 GB NVMe SSD
- **ЖИВАЯ НАГРУЗКА CPU:** **[metric:frankfurt_cpu]**
[progress:frankfurt_cpu]
- **ЖИВОЕ ИСПОЛЬЗОВАНИЕ RAM:** **[metric:frankfurt_ram]**
[progress:frankfurt_ram]

| КОМПОНЕНТ | СПЕЦИФИКАЦИЯ | СТАТУС В РЕАЛЬНОМ ВРЕМЕНИ | ЖИВАЯ МЕТРИКА |
| Ядра CPU | 8 vCPU Intel Sapphire Rapids | [ONLINE] ПОТОК | [metric:frankfurt_cpu] |
| Загрузка RAM | 32 GB DDR5 RAM | [ONLINE] ПОТОК | [metric:frankfurt_ram] |
| Диск NVMe | 50 GB NVMe SSD | [ONLINE] СМОНТИРОВАНО | 12.4 GB / 50 GB |

### 📍 БЛОК 2.2: КРАЕВОЙ МИКРО-УЗЕЛ (АЙОВА e2-micro ALWAYS FREE)
[source:gcloud "136.114.26.252 (VPC 10.128.0.2)"]
- **РАСПОЛОЖЕНИЕ:** Айова us-central1-a | **ТАРИФНЫЙ ПЛАН:** GCP Always Free ($0.00 / мес)
- **ЖИВАЯ НАГРУЗКА CPU:** **[metric:iowa_cpu]**
[progress:iowa_cpu]
- **ЖИВОЕ ИСПОЛЬЗОВАНИЕ RAM:** **[metric:iowa_ram]**
[progress:iowa_ram]

| КОМПОНЕНТ | СПЕЦИФИКАЦИЯ | ТАРИФНЫЙ ПЛАН | СТАТУС |
| Ядра CPU | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| Системная память | 1 GB RAM | $0.00 / мес (€0.00 / мес) | [metric:iowa_ram] |
| Caddy Сервер | Caddy 2.11.4 | TLS 1.3 Let's Encrypt | [metric:caddy_status] |

---

## 💰 [ЭКРАН 3: РАСХОДЫ И БУХГАЛТЕРСКИЙ ЖУРНАЛ]
### 📍 БЛОК 3.1: ОБЗОР OPEX И БАЛАНСЫ (СТРОГО USD $ / EUR €)
- **ОЦЕНКА МЕСЯЧНОГО OPEX:** **[metric:opex_usd]** (**[metric:opex_eur]**)
- **ЭКОНОМИЯ ALWAYS FREE:** $0.00 / мес (€0.00 / мес)
- **ТАРИФ GOOGLE AI PRO:** $20.00 / мес (€18.50 / мес)

[block:live_accounting]

---

## 📊 [ЭКРАН 4: ИНТЕРАКТИВНАЯ КАНБАН-ДОСКА ЗАДАЧ]
### 📍 БЛОК 4.1: СЕТКА РАБОЧЕГО ПРОЦЕССА КЛАСТЕРА

[block:live_kanban]
