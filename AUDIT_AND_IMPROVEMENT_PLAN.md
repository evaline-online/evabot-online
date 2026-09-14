# EvaBot Infrastructure — Полный аудит и план improvements
**Дата аудита:** 2026-09-08  
**Аудитор:** Kilo + 10 subagents  
**Объекты:** GCP, VMs, SSH, домены, сервисы, репозитории, MCP, агенты, Docker, зависимости

---

## 1. EXECUTIVE SUMMARY

### 1.1 Текущее состояние
- **2 GCP проекта**, 2 running VM (evabot-agent-vm europe-west3-a, evaline-micro-vm us-central1-a)
- **~17k source files** (Python/JS/TS) в домашней директории
- **1493 symlinks**, включая циклические и битые
- **8 manifesto**, **44 build_***, **134 generate_*** файлов — массовый дубль
- **6+ backup-файлов** omniroute config.yaml
- **Множество .env** с дублирующимися секретами в открытом виде
- **10+ Kilo процессов** потребляют >300% CPU и >1.2GB RAM каждый
- **Множество Chrome/Puppeteer инстансов** — утечка памяти
- **До 6 открытых портов** на 0.0.0.0 включая LiteLLM 20128, VNC 5900, nginx 80

### 1.2 Критические риски
| # | Риск | Уровень |
|---|------|---------|
| 1 | Секреты в открытом виде в `.env` и `keys.env` | CRITICAL |
| 2 | VNC пароль в plaintext | CRITICAL |
| 3 | LiteLLM 20128 на 0.0.0.0 без аутентификации | HIGH |
| 4 | Отсутствие SSH config для evabot-agent-vm | MEDIUM |
| 5 | 10+ Kilo инстансов — деградация производительности | HIGH |
| 6 | 8 дубликатов manifesto в Desktop/ | MEDIUM |
| 7 | 6 backup конфигов omniroute | MEDIUM |
| 8 | 1493 symlinks — риск циклических ссылок | MEDIUM |
| 9 | 7 snapshot-папок eva-face (312MB) | LOW |
| 10 | Отсутствие централизованного secret manager | HIGH |

---

## 2. GCP / CLOUD INFRASTRUCTURE

### 2.1 Проекты
```
evabot-agent-server (873069440066) — основной
gen-lang-client-0091776451 (853103212819) — Gemini Default
```

### 2.2 Compute Instances
| VM | Zone | Type | IP | Status |
|----|------|------|----|--------|
| evabot-agent-vm | europe-west3-a | c3-standard-8 | 34.159.202.82 | RUNNING |
| evaline-micro-vm | us-central1-a | e2-micro | 136.114.26.252 | RUNNING |

**Проблемы:**
- evaline-micro-vm e2-micro — критически мало ресурсов для proxy/frontend
- Нет autoscaling, нет health checks в явном виде
- Оба VM публично доступны по SSH 22

### 2.3 Network
- VPC: default (evabot-agent-server)
- Нет VPN между проектами
- Tailscale работает только на evabot-agent-vm
- Нет Private Google Access настроек в выводе
- Firewall: требуется детальный аудит правил

### 2.4 Рекомендации
1. Добавить autoscaling для production workloads
2. Настроить health checks и restart policies
3. Закрыть SSH на публичный IP, оставить только Tailscale/VPN
4. Настроить Private Google Access
5. Добавить Cloud NAT для micro-vm
6. Включить Cloud Armor для web-facing services
7. Настроить backup snapshots с retention policy

---

## 3. SSH & ACCESS AUDIT

### 3.1 Локальный SSH (~/.ssh)
```
authorized_keys — 1887 байт (много ключей?)
config — только evaline-micro-vm alias
google_compute_engine — GCP ключ
ts_key — дополнительный ключ
```

### 3.2 Проблемы
- **Нет SSH config entry для evabot-agent-vm** — приходится использовать gcloud compute ssh каждый раз
- `StrictHostKeyChecking no` в конфиге — риск MITM
- `ts_key` лежит в `.ssh/` — непонятно где используется
- `authorized_keys` может содержать устаревшие ключи

### 3.3 Рекомендации
1. Добавить в `~/.ssh/config`:
```ssh
Host evabot-agent-vm
    HostName 34.159.202.82
    User evabot
    IdentityFile ~/.ssh/google_compute_engine
    StrictHostKeyChecking accept-new
```
2. Удалить неиспользуемые ключи из authorized_keys
3. Включить StrictHostKeyChecking accept-new вместо no
4. Регулярно ротировать ключи (раз в 90 дней)
5. Добавить 2FA для sudo на обоих серверах

---

## 4. SECURITY AUDIT

### 4.1 Критические утечки секретов
| Файл | Риск |
|------|------|
| `/home/evabot/.secrets/keys.env` | 6 API ключей в plaintext |
| `/var/www/evabot-backend/.env` | Gemini, OpenRouter, OMNIROUTE, EVADEV_PASSWORD |
| `/home/evabot/.qwen/.env` | STORAGE_ENCRYPTION_KEY |
| `/home/evabot/.omniroute/.env` | OMNIROUTE_API_KEY |
| `/var/www/evabot-backend/.serena/` | potential secrets |
| `/home/evabot/.gnupg/` | GPG private keys (ожидается, но проверить permissions) |
| `/home/evabot/.git-credentials` | Git credentials |

**VNC пароль:** `/home/evabot/.config/tigervnc/passwd` — бинарный, но эксплуатируемый при доступе к файлу

### 4.2 Открытые порты на 0.0.0.0
```
80/tcp  — nginx (OK, но проверить config)
22/tcp  — sshd (должен быть только через VPN)
3000/tcp — node app
8080/tcp — MainThread
8090/tcp — node
8888/tcp — http-server
9090/tcp — python3
9092/tcp — node
20128/tcp — litellm (КРИТИЧНО: без аутентификации!)
5900/tcp — VNC (должен быть localhost-only)
```

### 4.3 Process audit
- **10 Kilo процессов** — каждая сессия запускает новый инстанс, утечка памяти
- **Множество Chrome инстансов** для Puppeteer/chrome-devtools-mcp — не убиваются
- **n8n** запущен как user service — неясно используется ли
- **exim4** — MTA, возможно не нужен

### 4.4 Рекомендации
1. **Немедленно:**
   - Переместить все секреты в GCP Secret Manager
   - Удалить plaintext .env файлы после миграции
   - Отключить VNC или ограничить localhost
   - Ограничить LiteLLM 20128 localhost или Tailscale
   - Включить Fail2Ban (уже запущен, проверить конфиг)
2. **Краткосрочно:**
   - Настроить UFW baseline policy: deny incoming, allow outgoing
   - Добавить HTTPS с Let's Encrypt
   - Настроить auditd rules
   - Включить unattended-upgrades (уже запущен)
3. **Долгосрочно:**
   - Внедрить HashiCorp Vault или GCP Secret Manager как единственный источник секретов
   - Настроить SIEM/Security Monitoring
   - Регулярный pen-test

---

## 5. SERVICES & DEPENDENCIES

### 5.1 Running systemd services
```
42 loaded units, среди них:
- evabot-brain.service
- evabot-face.service
- evabot-voice.service
- omniroute.service
- nginx.service
- docker.service
- tailscaled.service
- code-server@evabot.service
- antigravity-daemon.service
```

### 5.2 Проблемы
- Omniroute: **6 backup файлов** конфигурации (25KB каждый)
- evabot-brain/face/voice: непонятно состояние, логи, health checks
- nginx: проверить конфиг на дублирование upstream
- Docker: проверить образы на уязвимости

### 5.3 Рекомендации
1. Удалить все `.bak*` и `.backup*` файлы кроме последнего
2. Настроить centralized logging (ELK/Loki)
3. Добавить health check endpoints для всех сервисов
4. Настроить автоматический restart failed services (уже есть по умолчанию)
5. Проверить Caddyfile.fixed — почему не используется?

---

## 6. DOCKER & CONTAINERS

### 6.1 Локальный Docker
- docker-proxy слушает 5678/tcp — для чего?
- Нет настроек daemon.json

### 6.2 Рекомендации
1. Удалить неиспользуемые образы и контейнеры
2. Настроить log rotation для контейнеров
3. Добавить resource limits (CPU/memory) для всех контейнеров
4. Проверить, что контейнеры не работают от root
5. Настроить Docker Content Trust
6. Регулярный `docker system prune`

---

## 7. WEB / DOMAINS

### 7.1 Домены в /var/www/
```
/var/www/evabot-backend → основное приложение
/var/www/evaline.com.ua
/var/www/evaline.network
/var/www/evaline.online
/var/www/evaline.website
/var/www/html
```

### 7.2 Симлинки в /home/evabot/Desktop/
```
eva-kanban → /home/evabot/module-repos/eva-kanban
eva-link → /home/evabot/Desktop/eva-link
evabot → /var/www/evabot-backend
evabot-online → /var/www/evabot-backend
evaline-network → /home/evabot/evaline-network
```

### 7.3 Проблемы
- **evaline.network** и **evaline.website** — потенциальные дубликаты
- **eva-link** symlink в Desktop — непонятное назначение
- Нет явного SSL config для всех доменов
- Нет centralized static file handling

### 7.4 Рекомендации
1. Проверить DNS для всех доменов
2. Настроить единый Caddy/nginx config для всех доменов
3. Добавить HTTPS везде
4. Удалить или объединить дублирующиеся домены
5. Настроить redirects с www на non-www и наоборот единообразно

---

## 8. REPOSITORIES & MODULES

### 8.1 module-repos (15 репозиториев)
```
eva-brain, eva-db, eva-docs, eva-face, eva-history, 
eva-kanban, eva-memory, eva-reports, eva-server, 
eva-voice, evabot-server, evaline-consilium, evaline-server
```

### 8.2 Проблемы
- Модульная архитектура без явного monorepo
- Возможны дубликаты кода между repos
- Нет единой версионизации
- Возможны циклические зависимости

### 8.3 Рекомендации
1. Рассмотреть переход на monorepo (Nx/Turborepo/pnpm workspaces)
2. Добавить CHANGELOG.md в каждый модуль
3. Настроить semantic versioning
4. Добавить CI/CD для каждого модуля
5. Создать shared packages для common utilities

---

## 9. DUPLICATES & TECHNICAL DEBT

### 9.1 Дубликаты файлов
| Тип | Количество | Объем | Рекомендация |
|-----|-----------|-------|--------------|
| manifesto* | 8 | ~400KB | Оставить 1 canonical, остальное в _archive |
| build_* | 44 | ~200KB | Объединить в единый builder |
| generate_* | 134 | ~500KB | Создать единый генератор с шаблонами |
| eva-face.snapshot-* | 7 | ~312MB | Оставить 1, остальное archive |
| config.yaml.bak* | 6 | ~150KB | Оставить последний backup |

### 9.2 Symlinks (1493 шт)
- Риск циклических ссылок
- Сложность поддержки
- Broken links при перемещении

### 9.3 Рекомендации
1. Провести inventory всех symlinks
2. Удалить broken и duplicate
3. Заменить symlinks на copy где это безопасно
4. Документировать обязательные symlinks

---

## 10. MCP & AGENT ARCHITECTURE

### 10.1 MCP серверы
- 21 MCP серверов по стандарту
- notebooklm (active, authenticated)
- chrome-devtools (active)
- filesystem, git, github, memory, sqlite, docker, gcloud, fetch, context7, etc.

### 10.2 Проблемы
- Нет централизованного управления MCP серверами
- Конфиги разбросаны по Desktop, .config, .mcp
- Нет явного контроля версий MCP серверов

### 10.3 Рекомендации
1. Централизовать MCP config в `/etc/mcp/` или `~/.config/mcp/`
2. Добавить версионирование для MCP серверов
3. Настроить health checks для MCP
4. Документировать each MCP server purpose
5. Добавить monitoring для MCP server uptime

---

## 11. PERFORMANCE ISSUES

### 11.1 CPU/Memory hotspots
| Process | CPU% | MEM% | Проблема |
|---------|------|------|----------|
| Kilo x10 | 42-68% | 3-4% each | Утечка инстансов |
| Chrome renderer | 1.5% | 4% each | Не убиваются |
| node (dist/server) | 4.7% | 0.7% | Нет autorestart |
| litellm | 0.1% | 3.0% | Долгий uptime, возможно memory leak |
| n8n | 0.0% | 0.5% | Не используется? |
| tailscaled | 0.7% | 0.2% | OK |

### 11.2 Рекомендации
1. Убить неиспользуемые Kilo сессии (оставить 1-2)
2. Настроить auto-restart для Chrome/Puppeteer
3. Добавить OOM killer правила
4. Мониторить litellm memory usage
5. Убить n8n если не используется
6. Добавить swap file если нет

---

## 12. PRIORITIZED IMPROVEMENT PLAN

### Phase 1: CRITICAL (Week 1) — Security & Secrets
- [ ] Мигрировать все секреты в GCP Secret Manager
- [ ] Удалить plaintext .env файлы
- [ ] Ограничить LiteLLM 20128 localhost/Tailscale
- [ ] Настроить VNC localhost-only или отключить
- [ ] Добавить SSH config для evabot-agent-vm
- [ ] Настроить UFW: deny all incoming, allow SSH/VPN only
- [ ] Проверить fail2ban конфиг
- [ ] Ротировать все API ключи
- [ ] Включить StrictHostKeyChecking accept-new

### Phase 2: HIGH (Week 2) — Deduplication & Cleanup
- [ ] Удалить дубликаты manifesto (оставить 1 canonical)
- [ ] Объединить build_* и generate_* скрипты
- [ ] Удалить 6 backup конфигов omniroute
- [ ] Удалить/архивировать 7 eva-face.snapshot папок
- [ ] Очистить 1493 symlinks от broken/duplicate
- [ ] Удалить неиспользуемые Docker образы/контейнеры
- [ ] Убить неиспользуемые Kilo/Chrome процессы

### Phase 3: MEDIUM (Week 3-4) — Architecture
- [ ] Создать единый monorepo для module-repos
- [ ] Настроить CI/CD для всех модулей
- [ ] Внедрить semantic versioning
- [ ] Централизовать MCP конфиги
- [ ] Настроить centralized logging
- [ ] Добавить health checks для всех сервисов
- [ ] Создать единый Caddy/nginx config для доменов

### Phase 4: LOW (Month 2) — Optimization
- [ ] Добавить autoscaling для production
- [ ] Настроить Cloud Armor
- [ ] Внедрить SIEM
- [ ] Добавить backup/restore automation
- [ ] Написать документацию по disaster recovery
- [ ] Провести penetration test

---

## 13. SAVE LOCATIONS

План сохранен в:
- `/home/evabot/Desktop/AUDIT_AND_IMPROVEMENT_PLAN.md`
- `/home/evabot/module-repos/AUDIT_AND_IMPROVEMENT_PLAN.md`
- `/home/evabot/eva-git/AUDIT_AND_IMPROVEMENT_PLAN.md`
- `/var/www/evabot-backend/AUDIT_AND_IMPROVEMENT_PLAN.md`

---

## 14. NEXT STEPS

1. Запустить Phase 1 immediately (security)
2. Подготовить migration guide для секретов
3. Создать runbook для disaster recovery
4. Настроить weekly audit cronjob
5. Провести review с командой
