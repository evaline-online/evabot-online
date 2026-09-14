# ⚡ EVABOT ONLINE v0.0.1 // ПОВНА СПЕЦИФІКАЦІЯ MARKDOWN TUI ІНТЕРФЕЙСУ

## 👤 [ЕКРАН 1: 3D КІБЕР-ОБЛИЧЧЯ ТА КОНСОЛЬ ПРОМПТІВ LLM]
### 📍 БЛОК 1.1: ІНТЕРАКТИВНА 3D КНОПКА-ОБЛИЧЧЯ З СІТКОЮ ПОЛІГОНІВ
[block:3d_cyber_face]

### 📍 БЛОК 1.2: СТРІЧКА ВВЕДЕННЯ ПРОМПТУ ДЛЯ LLM
**ВВЕДІТЬ ЗАПИТ ДЛЯ EVABOT (v0.0.1):** [input:term-input "введіть запит для LLM агента..."] [НАДІСЛАТИ](action:submitPrompt)

### 📍 БЛОК 1.3: ЖИВИЙ ЧАТ GEMINI CORE
[block:live_chat]

---

## 🖥️ [ЕКРАН 2: ТЕЛЕМЕТРІЯ СЕРВЕРІВ У РЕАЛЬНОМУ ЧАСІ]
### 📍 БЛОК 2.1: ОСНОВНИЙ ОБЧИСЛЮВАЛЬНИЙ ВУЗОЛ (ФРАНКФУРТ c3-standard-8)
[source:gcloud "34.179.253.183 (VPC 10.156.0.2)"]
- **РОЗТАШУВАННЯ:** Франкфурт europe-west3-a | **ЧАС РОБОТИ:** `[metric:uptime]`
- **СПЕЦИФІКАЦІЯ:** 8 vCPU Intel Sapphire Rapids, 32 GB DDR5 RAM, 50 GB NVMe SSD
- **ЖИВЕ НАВАНТАЖЕННЯ CPU:** **[metric:frankfurt_cpu]**
[progress:frankfurt_cpu]
- **ЖИВЕ ВИКОРИСТАННЯ RAM:** **[metric:frankfurt_ram]**
[progress:frankfurt_ram]

| КОМПОНЕНТ | СПЕЦИФІКАЦІЯ | СТАТУС У РЕАЛЬНОМУ ЧАСІ | ЖИВА МЕТРИКА |
| Ядра CPU | 8 vCPU Intel Sapphire Rapids | [ONLINE] ПОТОК | [metric:frankfurt_cpu] |
| Завантаження RAM | 32 GB DDR5 RAM | [ONLINE] ПОТОК | [metric:frankfurt_ram] |
| Диск NVMe | 50 GB NVMe SSD | [ONLINE] ЗМОНТОВАНО | 12.4 GB / 50 GB |

### 📍 БЛОК 2.2: КРАЙНІЙ МІКРО-ВУЗОЛ (АЙОВА e2-micro ALWAYS FREE)
[source:gcloud "136.114.26.252 (VPC 10.128.0.2)"]
- **РОЗТАШУВАННЯ:** Айова us-central1-a | **ТАРИФНИЙ ПЛАН:** GCP Always Free ($0.00 / міс)
- **ЖИВЕ НАВАНТАЖЕННЯ CPU:** **[metric:iowa_cpu]**
[progress:iowa_cpu]
- **ЖИВЕ ВИКОРИСТАННЯ RAM:** **[metric:iowa_ram]**
[progress:iowa_ram]

| КОМПОНЕНТ | СПЕЦИФІКАЦІЯ | ТАРИФНИЙ ПЛАН | СТАТУС |
| Ядра CPU | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| Системна пам'ять | 1 GB RAM | $0.00 / міс (€0.00 / міс) | [metric:iowa_ram] |
| Caddy Сервер | Caddy 2.11.4 | TLS 1.3 Let's Encrypt | [metric:caddy_status] |

---

## 💰 [ЕКРАН 3: ВИТРАТИ ТА БУХГАЛТЕРСЬКИЙ ЖУРНАЛ]
### 📍 БЛОК 3.1: ОГЛЯД OPEX ТА БАЛАНСИ (ЛИШЕ USD $ / EUR €)
- **ОЦІНКА МІСЯЧНОГО OPEX:** **[metric:opex_usd]** (**[metric:opex_eur]**)
- **ЕКОНОМІЯ ALWAYS FREE:** $0.00 / міс (€0.00 / міс)
- **ТАРИФ GOOGLE AI PRO:** $20.00 / міс (€18.50 / міс)

[block:live_accounting]

---

## 📊 [ЕКРАН 4: ІНТЕРАКТИВНА КАНБАН-ДОШКА ЗАДАЧ]
### 📍 БЛОК 4.1: СІТКА РОБОЧОГО ПРОЦЕСУ КЛАСТЕРА

[block:live_kanban]
