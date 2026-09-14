# EVABOT ONLINE // РЕАКТИВНИЙ ДВИГУН MARKDOWN-LIVE

## [МОНІТОР ЖИВИХ МЕТРИК]
### ОСНОВНИЙ ВУЗОЛ У ФРАНКФУРТІ: evabot-agent-vm (c3-standard-8)
[source:gcloud "34.179.253.183 (VPC 10.156.0.2)"]
- **НАВАНТАЖЕННЯ CPU:** [metric:frankfurt_cpu]
- **ВИКОРИСТАННЯ ПАМ'ЯТІ:** [metric:frankfurt_ram]
[progress:18.1 100 "Шкала RAM Франкфурт"]

| МЕТРИКА | ЖИВЕ ЗНАЧЕННЯ | ДЖЕРЕЛО ДАНИХ | СТАТУС |
| Ядра CPU | 8 vCPU Intel Sapphire Rapids | `gcloud compute ssh` | [metric:frankfurt_cpu] |
| Завантаження RAM | [metric:frankfurt_ram] | `systemd-telemetry` | [ONLINE] НОРМА |
| Сховище NVMe | 50 GB NVMe SSD | `lsblk /mnt/disks/evabot-data` | [ONLINE] НОРМА |

### КРАЙНІЙ МІКРО-ВУЗОЛ В АЙОВІ: evaline-micro-vm (e2-micro Always Free)
[source:gcloud "136.114.26.252 (VPC 10.128.0.2)"]
- **НАВАНТАЖЕННЯ CPU:** [metric:iowa_cpu]
- **ВИКОРИСТАННЯ ПАМ'ЯТІ:** [metric:iowa_ram]
[progress:41.2 100 "Шкала RAM Айова"]

| МЕТРИКА | ЖИВЕ ЗНАЧЕННЯ | ТАРИФНИЙ ПЛАН | СТАТУС |
| Ядра CPU | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| Завантаження RAM | [metric:iowa_ram] | $0.00 / міс (€0.00 / міс) | [ONLINE] НОРМА |
| Caddy Сервер | [metric:caddy_status] | Автоматичний Let's Encrypt | [ONLINE] АКТИВНИЙ |

### ФІНАНСОВИЙ ЖУРНАЛ OPEX (ЛИШЕ USD $ / EUR €)
[source:gcp_billing "us-central1-a & europe-west3-a"]
- **ОЦІНКА МІСЯЧНОГО OPEX:** [metric:opex_usd] ([metric:opex_eur])
- **СТАТУС МОДЕЛІ GEMINI CORE:** [metric:gemini_status]
[progress:325 350 "Використання місячного бюджету"]
