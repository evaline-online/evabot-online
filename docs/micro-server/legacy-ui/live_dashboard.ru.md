# EVABOT ONLINE // РЕАКТИВНЫЙ ДВИЖОК MARKDOWN-LIVE

## [МОНИТОР ЖИВЫХ МЕТРИК]
### ОСНОВНОЙ УЗЕЛ ВО ФРАНКФУРТЕ: evabot-agent-vm (c3-standard-8)
[source:gcloud "34.179.253.183 (VPC 10.156.0.2)"]
- **НАГРУЗКА CPU:** [metric:frankfurt_cpu]
- **ИСПОЛЬЗОВАНИЕ ПАМЯТИ:** [metric:frankfurt_ram]
[progress:18.1 100 "Шкала RAM Франкфурт"]

| МЕТРИКА | ЖИВОЕ ЗНАЧЕНИЕ | ИСТОЧНИК ДАННЫХ | СТАТУС |
| Ядра CPU | 8 vCPU Intel Sapphire Rapids | `gcloud compute ssh` | [metric:frankfurt_cpu] |
| Загрузка RAM | [metric:frankfurt_ram] | `systemd-telemetry` | [ONLINE] НОРМА |
| Хранилище NVMe | 50 GB NVMe SSD | `lsblk /mnt/disks/evabot-data` | [ONLINE] НОРМА |

### КРАЕВОЙ МИКРО-УЗЕЛ В АЙОВЕ: evaline-micro-vm (e2-micro Always Free)
[source:gcloud "136.114.26.252 (VPC 10.128.0.2)"]
- **НАГРУЗКА CPU:** [metric:iowa_cpu]
- **ИСПОЛЬЗОВАНИЕ ПАМЯТИ:** [metric:iowa_ram]
[progress:41.2 100 "Шкала RAM Айова"]

| МЕТРИКА | ЖИВОЕ ЗНАЧЕНИЕ | ТАРИФНЫЙ ПЛАН | СТАТУС |
| Ядра CPU | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| Загрузка RAM | [metric:iowa_ram] | $0.00 / мес (€0.00 / мес) | [ONLINE] НОРМА |
| Caddy Сервер | [metric:caddy_status] | Автоматический Let's Encrypt | [ONLINE] АКТИВЕН |

### ФИНАНСОВЫЙ ЖУРНАЛ OPEX (СТРОГО USD $ / EUR €)
[source:gcp_billing "us-central1-a & europe-west3-a"]
- **ОЦЕНКА МЕСЯЧНОГО OPEX:** [metric:opex_usd] ([metric:opex_eur])
- **СТАТУС МОДЕЛИ GEMINI CORE:** [metric:gemini_status]
[progress:325 350 "Использование месячного бюджета"]
