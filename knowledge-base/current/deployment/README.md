# 🚀 Deployment Documentation

**Модульная структура deployment docs**

---

## 📂 Содержание

### [`MONOREPO.md`](./MONOREPO.md)
Monorepo структура и Git workflow:
- Структура папок
- Деплой на 2 GCP сервера
- CI/CD через GitHub Actions
- Ручной deploy через deploy-sync.sh

### Конфиги
- [`../../config/Caddyfile`](../../config/Caddyfile) — reverse proxy + WAF
- [`../../config/fail2ban-filter.conf`](../../config/fail2ban-filter.conf) — fail2ban filter
- [`../../config/fail2ban-jail.conf`](../../config/fail2ban-jail.conf) — fail2ban jail

### CI/CD
- [`.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml) — автодеплой

---

**Last Updated:** 2026-09-07  
**Deployment Version:** v0.0.2
