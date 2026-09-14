# EVABOT ONLINE // REACTIVE MARKDOWN-LIVE ENGINE

## [LIVE METRICS MONITOR]
### FRANKFURT PRIMARY NODE: evabot-agent-vm (c3-standard-8)
[source:gcloud "34.179.253.183 (VPC 10.156.0.2)"]
- **CPU LOAD:** [metric:frankfurt_cpu]
- **MEMORY USAGE:** [metric:frankfurt_ram]
[progress:18.1 100 "RAM Load Bar"]

| METRIC | LIVE VALUE | SOURCE POINTER | STATUS |
| CPU Cores | 8 vCPU Intel Sapphire Rapids | `gcloud compute ssh` | [metric:frankfurt_cpu] |
| RAM Load | [metric:frankfurt_ram] | `systemd-telemetry` | [ONLINE] HEALTHY |
| Storage | 50 GB NVMe SSD | `lsblk /mnt/disks/evabot-data` | [ONLINE] HEALTHY |

### IOWA EDGE MICRO NODE: evaline-micro-vm (e2-micro Always Free)
[source:gcloud "136.114.26.252 (VPC 10.128.0.2)"]
- **CPU LOAD:** [metric:iowa_cpu]
- **MEMORY USAGE:** [metric:iowa_ram]
[progress:41.2 100 "Micro RAM Load Bar"]

| METRIC | LIVE VALUE | PRICING TIER | STATUS |
| CPU Cores | 2 vCPU burstable | GCP Always Free | [metric:iowa_cpu] |
| RAM Load | [metric:iowa_ram] | $0.00 / mo (€0.00 / mo) | [ONLINE] HEALTHY |
| Caddy Reverse Proxy | [metric:caddy_status] | Automated Let's Encrypt | [ONLINE] ACTIVE |

### FINANCIAL OPEX LEDGER (USD $ / EUR € ONLY)
[source:gcp_billing "us-central1-a & europe-west3-a"]
- **MONTHLY ESTIMATED OPEX:** [metric:opex_usd] ([metric:opex_eur])
- **GEMINI CORE MODEL STATUS:** [metric:gemini_status]
[progress:325 350 "Monthly Budget Utilization"]
