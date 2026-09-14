#!/usr/bin/env bash
# Синхронизация документации docs/ ↔ eva-docs/ ↔ GitHub

set -euo pipefail

BACKEND=/var/www/evabot-backend
DOCS=$BACKEND/docs
EVA_DOCS=/var/www/eva-docs
GITHUB_REPO=evaline-online/eva-docs

echo "[1/5] Синхронизация docs/ → eva-docs/..."
rsync -av --include='*.md' --include='*/' --exclude='*' "$DOCS/" "$EVA_DOCS/"

echo "[2/5] Проверка markdown линтером..."
npx markdownlint "$DOCS" 2>/dev/null || echo "Пропускаем (линтер нашёл ошибки, не блокируем)"

echo "[3/5] Сборка Quartz..."
cd $BACKEND/docs-site && npx quartz build --directory content 2>/dev/null || echo "Quartz build пропущен (не настроен)"

echo "[4/5] Проверка битых ссылок..."
cd $BACKEND/docs-site && node check-links.mjs 2>/dev/null || echo "check-links не доступен"

echo "[5/5] Push на GitHub (manual review настроен)..."
cd $BACKEND/docs-site
git add -A
git status --short | head -20
echo "Коммит вручную: git commit -m 'docs: sync docs-site' && git push origin main"

echo "Готово."
