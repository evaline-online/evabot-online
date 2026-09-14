# Safe Deploy & Instant Rollback

> EN + RU · `scripts/safe-deploy.sh` · `scripts/rollback.sh` · target: `evabot-brain.service` (evabot.online)

## EN — Concept

Every deploy is a **release tarball** + a **health gate** + **automatic rollback**.
No docker, no rsync — plain `tar.gz` snapshots in `backups/releases/`.

```
npm run build  ──fail──> ABORT (nothing touched, site keeps running)
     │ok
     ▼
tar.gz snapshot  ──> backups/releases/<YYYYMMDD-HHMMSS>.tar.gz  (+ .manifest.txt)
     ▼
sudo systemctl restart evabot-brain
     ▼
health gate ≤ 30s:  GET /api/health → "status":"online"
                    POST /api/models/command {"command":"/help"} → HTTP 200
     ├──pass──> write CURRENT pointer → DEPLOY SUCCESS (green)
     └──fail──> AUTOMATIC ROLLBACK: extract previous release, restart,
                re-verify health → "ROLLBACK DONE" (red), exit 1
```

Guarantees:

- **Build broken** → deploy aborts before touching the service.
- **Service broken after restart** → previous release restored automatically within ~30s.
- **Retention**: last 10 releases kept (`*.tar.gz` with `^[0-9]{8}-[0-9]{6}` names); older pruned with their manifests. `pre-rollback-*` snapshots are never auto-pruned.
- **Never touched**: `data/`, `logs/`, `.env` — tarballs contain only `dist/`, `public/`, `package.json`, `package-lock.json`, `docs-site/public/` (if present).
- **Idempotent & portable**: works from repo root or `scripts/` (REPO_ROOT resolved via `dirname $0/..`), uses `set -euo pipefail`.

## EN — Usage

```bash
cd /var/www/evabot-backend
npm run deploy          # safe deploy: build → snapshot → restart → health gate → auto-rollback
npm run rollback        # interactive: list releases, pick number
npm run rollback 20260908-185500   # direct rollback by timestamp
```

`rollback.sh` safety: before restoring, it snapshots the CURRENT live state as
`backups/releases/pre-rollback-<now>.tar.gz` — so a rollback is itself reversible.
After success it updates the `CURRENT` pointer. On health-gate failure it prints
`journalctl` tail and exits 1.

## EN — Recovery from partial failure

| Situation | Recovery |
|---|---|
| Build fails | Nothing happens. Fix code, re-run `npm run deploy`. |
| Health gate fails, auto-rollback succeeded | Site is on the previous release. Investigate `journalctl -u evabot-brain -n 100`, fix, re-deploy. |
| Health gate fails, no previous release (very first deploy) | Script keeps the new `CURRENT` and exits 1 with instructions. Restore manually: `tar -xzf backups/releases/<ts>.tar.gz -C /var/www/evabot-backend && sudo systemctl restart evabot-brain`. |
| Rollback itself fails health gate | Both releases suspect. Use `pre-rollback-*.tar.gz`, then bisect releases manually: `tar -xzf <chosen>.tar.gz -C /var/www/evabot-backend`. |
| Service down, node code unknown | `journalctl -u evabot-brain -n 200`, restore the last known-good tarball from `backups/releases/` (manifests record git HEAD). |

## EN — Manifest & retention

Each release has `<ts>.manifest.txt`:

```
release: 20260908-185500
git_head: 6197510abc...
date: 2026-09-08T18:55:00Z
npm_version: 0.1.0
contents: dist public package.json package-lock.json docs-site/public
```

`backups/releases/CURRENT` holds the live release timestamp (single line).
Prune policy: keep 10 newest timestamped releases; `pre-rollback-*` snapshots are manual, prune by hand when confident.

---

## RU — Концепция

Каждый деплой = **tar-снапшот релиза** + **health-гейт** + **автоматический откат**.
Docker и rsync не нужны — обычные `tar.gz` в `backups/releases/`.

```
npm run build  ──ошибка──> ABORT (сервис не тронут, сайт работает)
     │ok
     ▼
tar.gz снапшот ──> backups/releases/<ГГГГММДД-ЧЧММСС>.tar.gz (+ .manifest.txt)
     ▼
sudo systemctl restart evabot-brain
     ▼
health-гейт ≤ 30с:  GET /api/health → "status":"online"
                    POST /api/models/command {"command":"/help"} → HTTP 200
     ├──проход──> записывается CURRENT → ДЕПЛОЙ УСПЕШЕН (зелёный вывод)
     └──провал──> АВТООТКАТ: распаковка предыдущего релиза, restart,
                 повторная проверка → "ROLLBACK DONE" (красный), exit 1
```

Гарантии:

- **Сломанная сборка** → деплой прерывается до перезапуска сервиса.
- **Сервис сломался после рестарта** → предыдущий релиз восстанавливается автоматически за ~30 секунд.
- **Хранение**: последние 10 релизов (`*.tar.gz` с именами `^[0-9]{8}-[0-9]{6}`); более старые удаляются вместе с манифестами. Снапшоты `pre-rollback-*` автоматически не удаляются.
- **Никогда не затрагиваются**: `data/`, `logs/`, `.env` — в tarball входят только `dist/`, `public/`, `package.json`, `package-lock.json`, `docs-site/public/` (если есть).
- **Идемпотентность**: работает из корня репо и из `scripts/`, `set -euo pipefail`.

## RU — Использование

```bash
cd /var/www/evabot-backend
npm run deploy          # безопасный деплой: сборка → снапшот → рестарт → гейт → автооткат
npm run rollback        # интерактивно: список релизов, выбор по номеру
npm run rollback 20260908-185500   # прямой откат по timestamp
```

Безопасность `rollback.sh`: перед восстановлением текущее живое состояние
сохраняется как `backups/releases/pre-rollback-<now>.tar.gz` — то есть откат
сам обратим. Успех обновляет указатель `CURRENT`. При провале гейта печатается
`journalctl` и скрипт выходит с кодом 1.

## RU — Восстановление при частичном сбое

| Ситуация | Действие |
|---|---|
| Сборка упала | Ничего не произошло. Исправить код, повторить `npm run deploy`. |
| Гейт провален, автооткат сработал | Сайт на предыдущем релизе. Смотреть `journalctl -u evabot-brain -n 100`, исправить, задеплоить снова. |
| Гейт провален, предыдущего релиза нет (самый первый деплой) | Скрипт записывает `CURRENT` и выходит с кодом 1. Ручное восстановление: `tar -xzf backups/releases/<ts>.tar.gz -C /var/www/evabot-backend && sudo systemctl restart evabot-brain`. |
| Откат сам провалил гейт | Подозрительны оба релиза — использовать `pre-rollback-*.tar.gz`, далее перебирать релизы вручную. |
| Сервис лежит, причина неизвестна | `journalctl -u evabot-brain -n 200`; восстановить последний заведомо рабочий tarball (в манифесте записан git HEAD). |

## RU — Манифест и политика хранения

Каждый релиз сопровождается `<ts>.manifest.txt` (git HEAD, дата UTC, npm-версия).
`backups/releases/CURRENT` — построчный указатель текущего живого релиза.
Ротация: хранятся 10 последних релизов; `pre-rollback-*` снапшоты удаляются вручную.
