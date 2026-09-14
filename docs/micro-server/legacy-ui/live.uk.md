# EVABOT ONLINE // ЧИСТИЙ LIVE-MARKDOWN КОМАНДНИЙ ЦЕНТР

## [1] ТЕЛЕМЕТРІЯ СЕРВЕРІВ У РЕАЛЬНОМУ ЧАСІ
### ВУЗОЛ 1: evabot-agent-vm (ОСНОВНИЙ ВУЗОЛ У ФРАНКФУРТІ)
- **РОЗТАШУВАННЯ:** Франкфурт europe-west3-a | **IP:** 34.179.253.183 (VPC 10.156.0.2)
- **ЧАС РОБОТИ:** `[metric:uptime]` | **ОБЛАДНАННЯ:** 8 vCPU Intel Sapphire Rapids, 32GB RAM
- **ЖИВЕ НАВАНТАЖЕННЯ CPU:** **[metric:frankfurt_cpu]**
[progress:frankfurt_cpu]
- **ЖИВЕ ВИКОРИСТАННЯ RAM:** **[metric:frankfurt_ram]**
[progress:frankfurt_ram]

| КОМПОНЕНТ | СПЕЦИФІКАЦІЯ | СТАТУС У РЕАЛЬНОМУ ЧАСІ | ЖИВА МЕТРИКА |
| Ядра CPU | 8 vCPU Intel Sapphire Rapids | [ONLINE] ПОТОК | [metric:frankfurt_cpu] |
| Завантаження RAM | 32 GB DDR5 RAM | [ONLINE] ПОТОК | [metric:frankfurt_ram] |
| Накопичувач NVMe | 50 GB NVMe SSD | [ONLINE] ЗМОНТОВАНО | 12.4 GB / 50 GB |

### ВУЗОЛ 2: evaline-micro-vm (КРАЙНІЙ МІКРО-ВУЗОЛ В АЙОВІ)
- **РОЗТАШУВАННЯ:** Айова us-central1-a | **IP:** 136.114.26.252 (VPC 10.128.0.2)
- **ТАРИФНИЙ ПЛАН:** GCP Always Free ($0.00 / міс) | **ОС:** Debian 13 (Trixie)
- **ЖИВЕ НАВАНТАЖЕННЯ CPU:** **[metric:iowa_cpu]**
[progress:iowa_cpu]
- **ЖИВЕ ВИКОРИСТАННЯ RAM:** **[metric:iowa_ram]**
[progress:iowa_ram]

| КОМПОНЕНТ | СПЕЦИФІКАЦІЯ | ТАРИФНИЙ ПЛАН | СТАТУС |
| Ядра CPU | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| Системна пам'ять | 1 GB RAM | $0.00 / міс (€0.00 / міс) | [metric:iowa_ram] |
| Caddy Сервер | Caddy 2.11.4 | TLS 1.3 Let's Encrypt | [metric:caddy_status] |

## [2] ЖИВИЙ ЧАТ GEMINI
### КОНСОЛЬ GEMINI 2.0 PRO
**СТАТУС:** [metric:gemini_status] | **ПРОТОКОЛ:** WSS/TLS1.3

[block:live_chat]

> [!NOTE]
> Обчислювальне ядро підключено до моделей Google Gemini у межах підписки Google AI Pro ($20.00 / місяць).

**ВВЕДЕННЯ ЗАПИТУ:** [input:term-input "введіть запит до EvaBot..."] [НАДІСЛАТИ](action:submitPrompt)

## [3] ФІНАНСОВИЙ OPEX ТА БУХГАЛТЕРІЯ (ЛИШЕ USD $ / EUR €)
### МІСЯЧНИЙ БАЛАНС ВИТРАТ У РЕАЛЬНОМУ ЧАСІ
- **ОЦІНКА МІСЯЧНОГО OPEX:** **[metric:opex_usd]** (**[metric:opex_eur]**)
- **ЕКОНОМІЯ ALWAYS FREE:** $0.00 / міс (€0.00 / міс)
- **ПІДПИСКА GOOGLE AI PRO:** $20.00 / міс (€18.50 / міс)

[block:live_accounting]

## [4] ІНТЕРАКТИВНА КАНБАН-ДОШКА
### СІТКА РОБОЧОГО ПРОЦЕСУ КЛАСТЕРА

[block:live_kanban]
