# EVABOT ONLINE // ЧИСТЫЙ LIVE-MARKDOWN КОМАНДНЫЙ ЦЕНТР

## [1] ТЕЛЕМЕТРИЯ СЕРВЕРОВ В РЕАЛЬНОМ ВРЕМЕНИ
### УЗЕЛ 1: evabot-agent-vm (ОСНОВНОЙ УЗЕЛ ВО ФРАНКФУРТЕ)
- **РАСПОЛОЖЕНИЕ:** Франкфурт europe-west3-a | **IP:** 34.179.253.183 (VPC 10.156.0.2)
- **ВРЕМЯ РАБОТЫ:** `[metric:uptime]` | **ОБОРУДОВАНИЕ:** 8 vCPU Intel Sapphire Rapids, 32GB RAM
- **ЖИВАЯ НАГРУЗКА CPU:** **[metric:frankfurt_cpu]**
[progress:frankfurt_cpu]
- **ЖИВОЕ ИСПОЛЬЗОВАНИЕ RAM:** **[metric:frankfurt_ram]**
[progress:frankfurt_ram]

| КОМПОНЕНТ | СПЕЦИФИКАЦИЯ | СТАТУС В РЕАЛЬНОМ ВРЕМЕНИ | ЖИВАЯ МЕТРИКА |
| Ядра CPU | 8 vCPU Intel Sapphire Rapids | [ONLINE] ПОТОК | [metric:frankfurt_cpu] |
| Загрузка RAM | 32 GB DDR5 RAM | [ONLINE] ПОТОК | [metric:frankfurt_ram] |
| Накопитель NVMe | 50 GB NVMe SSD | [ONLINE] СМОНТИРОВАНО | 12.4 GB / 50 GB |

### УЗЕЛ 2: evaline-micro-vm (КРАЕВОЙ МИКРО-УЗЕЛ В АЙОВЕ)
- **РАСПОЛОЖЕНИЕ:** Айова us-central1-a | **IP:** 136.114.26.252 (VPC 10.128.0.2)
- **ТАРИФНЫЙ ПЛАН:** GCP Always Free ($0.00 / мес) | **ОС:** Debian 13 (Trixie)
- **ЖИВАЯ НАГРУЗКА CPU:** **[metric:iowa_cpu]**
[progress:iowa_cpu]
- **ЖИВОЕ ИСПОЛЬЗОВАНИЕ RAM:** **[metric:iowa_ram]**
[progress:iowa_ram]

| КОМПОНЕНТ | СПЕЦИФИКАЦИЯ | ТАРИФНЫЙ ПЛАН | СТАТУС |
| Ядра CPU | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| Системная память | 1 GB RAM | $0.00 / мес (€0.00 / мес) | [metric:iowa_ram] |
| Caddy Сервер | Caddy 2.11.4 | TLS 1.3 Let's Encrypt | [metric:caddy_status] |

## [2] ЖИВОЙ ЧАТ GEMINI
### КОНСОЛЬ GEMINI 2.0 PRO
**СТАТУС:** [metric:gemini_status] | **ПРОТОКОЛ:** WSS/TLS1.3

[block:live_chat]

> [!NOTE]
> Вычислительное ядро подключено к моделям Google Gemini в рамках подписки Google AI Pro ($20.00 / месяц).

**ВВОД ЗАПРОСА:** [input:term-input "введите запрос к EvaBot..."] [ОТПРАВИТЬ](action:submitPrompt)

## [3] ФИНАНСОВЫЙ OPEX И БУХГАЛТЕРИЯ (СТРОГО USD $ / EUR €)
### ЕЖЕМЕСЯЧНЫЙ БАЛАНС РАСХОДОВ В РЕАЛЬНОМ ВРЕМЕНИ
- **ОЦЕНКА МЕСЯЧНОГО OPEX:** **[metric:opex_usd]** (**[metric:opex_eur]**)
- **ЭКОНОМИЯ ALWAYS FREE:** $0.00 / мес (€0.00 / мес)
- **ПОДПИСКА GOOGLE AI PRO:** $20.00 / мес (€18.50 / мес)

[block:live_accounting]

## [4] ИНТЕРАКТИВНАЯ КАНБАН-ДОСКА
### СЕТКА РАБОЧЕГО ПРОЦЕССА КЛАСТЕРА

[block:live_kanban]
