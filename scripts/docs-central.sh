#!/usr/bin/env bash
# =============================================================================
# EVA DOCS CENTRAL SYNC — Единый Источник Правды (Single Source of Truth)
# -----------------------------------------------------------------------------
# Доказывает: docs/ (master) → eva-docs (Quartz+GitHub), knowledge-base (RAG),
#             micro-server, NotebookLM (манифест для MCP-ингаста).
#
# Правило: ЕДИНСТВЕННОЕ место, где редактируются .md-документы — это
#          /var/www/evabot-backend/docs/.  Все остальные копии — производные.
#
# Запуск:  ./docs-central.sh [--dry-run]
#   --dry-run — только показать, что будет синхронизировано, ничего не менять.
#
# Архитектура (звезда):
#                       ┌────────────────────────────┐
#                       │  docs/  (MASTER, 39 .md)   │
#                       └─────────────┬──────────────┘
#                  ┌─────────┬─────────┼─────────┬──────────┐
#                  ▼         ▼         ▼         ▼          ▼
#             eva-docs  knowledge-   micro-    GitHub    NotebookLM
#             (Quartz)  base/current server  eva-docs      (манифест)
# =============================================================================

set -euo pipefail

# ---------------------------------------------------------------------------
# Конфигурация
# ---------------------------------------------------------------------------
BACKEND=/var/www/evabot-backend
DOCS="$BACKEND/docs"                      # ← МАСТЕР
EVA_DOCS=/var/www/eva-docs                # Quartz site content + GitHub repo
DOCS_SITE="$BACKEND/docs-site"            # Quartz build (content → symlink eva-docs)
KB_CURRENT="$BACKEND/knowledge-base/current"  # RAG-зеркало проекта
PUBLIC="$DOCS_SITE/public"                # Собранный Quartz сайт (права для nginx)
MICRO_HOST=evabot@100.125.200.49
MICRO_DEST=/var/www/eva-docs
GITHUB_REMOTE=origin
LOGFILE="$BACKEND/scripts/logs/docs-central.log"

DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

TS=$(date '+%Y-%m-%d %H:%M:%S')
run() {
  if $DRY_RUN; then
    echo "  [dry-run] $*"
  else
    "$@"
  fi
}

echo "===== EVA DOCS CENTRAL SYNC ($TS) ====="
[ -n "$LOGFILE" ] && echo "Log: $LOGFILE"
$DRY_RUN && echo "Режим: DRY RUN (ничего не меняется)"

# ---------------------------------------------------------------------------
# [0/7] Preflight
# ---------------------------------------------------------------------------
echo "[0/7] Preflight..."
for cmd in rsync git ssh; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "  ERROR: $cmd не найден"; exit 1; }
done
test -f "$DOCS/DOCUMENTATION_INDEX.md" && echo "  ✓ docs/ — источник правды ($(find "$DOCS" -name '*.md' | wc -l) .md)"
test -d "$EVA_DOCS/.git" && echo "  ✓ eva-docs/ — git-репозиторий ($(git -C "$EVA_DOCS" branch --show-current))"
test -L "$DOCS_SITE/content" && echo "  ✓ docs-site/content → symlink на eva-docs"

mkdir -p "$KB_CURRENT"

# ---------------------------------------------------------------------------
# [1/7] Синхронизация docs/ → eva-docs/ (Quartz content + GitHub)
# ---------------------------------------------------------------------------
echo "[1/7] docs/ → eva-docs/ (только *.md, не разрушительно)..."
# Только .md файлы и каталоги; файлы живут ТОЛЬКО в eva-docs (agents/, domains/, index.md,
# README.md, CHANGELOG.md, ops/BILLING_ACCOUNTING.md) не затрагиваются.
run rsync -av --checksum --include='*.md' --include='*/' --exclude='*' "$DOCS/" "$EVA_DOCS/"

# ---------------------------------------------------------------------------
# [2/7] Сборка Quartz statc-сайта
# ---------------------------------------------------------------------------
echo "[2/7] Сборка Quartz (docs-site → public/)..."
if $DRY_RUN; then
  echo "  [dry-run] npx quartz build --directory content"
else
  (cd "$DOCS_SITE" && npx quartz build --directory content) 2>&1 | tail -20 || echo "  ⚠️ Quartz build не удался (см. выше) — продолжаем"
  chmod -R o+rX "$PUBLIC" 2>/dev/null || true
fi

# ---------------------------------------------------------------------------
# [3/7] knowledge-base/current (RAG) — зеркало .md для векторного ингаста
# ---------------------------------------------------------------------------
echo "[3/7] docs/ → knowledge-base/current/ (RAG)..."
run rsync -a --checksum --include='*.md' --include='*/' --exclude='*' "$DOCS/" "$KB_CURRENT/"

# ---------------------------------------------------------------------------
# [4/7] Micro-сервер
# ---------------------------------------------------------------------------
echo "[4/7] docs/ → micro-server ($MICRO_HOST:$MICRO_DEST)..."
if $DRY_RUN; then
  echo "  [dry-run] ssh $MICRO_HOST mkdir -p $MICRO_DEST"
  echo "  [dry-run] rsync -av [$DOCS/ → $MICRO_HOST:$MICRO_DEST]"
elif ssh -o ConnectTimeout=5 -o BatchMode=yes "$MICRO_HOST" "sudo -n mkdir -p '$MICRO_DEST'" 2>/dev/null; then
  rsync -av --checksum --rsync-path="sudo rsync" --include='*.md' --include='*/' --exclude='*' "$DOCS/" "$MICRO_HOST:$MICRO_DEST/"
else
  echo "  ⚠️ micro-server недоступен — пропускаем (проверь ssh-ключи)"
fi

# ---------------------------------------------------------------------------
# [5/7] GitHub eva-docs — коммит и push
# ---------------------------------------------------------------------------
echo "[5/7] GitHub push (evaline-online/eva-docs)..."
if $DRY_RUN; then
  echo "  [dry-run] git commit + git push origin main"
else
  cd "$EVA_DOCS"
  git add -A
  CHANGES=$(git status --short | wc -l)
  if [ "$CHANGES" -eq 0 ]; then
    echo "  ✓ нет изменений — уже актуально"
  else
    git status --short | head -20
    git commit -m "docs: central sync $(date '+%Y-%m-%d %H:%M')" >/dev/null &&
      git push "$GITHUB_REMOTE" main && echo "  ✓ pushed"
  fi
fi

# ---------------------------------------------------------------------------
# [6/7] NotebookLM — манифест для MCP-ингаста
# ---------------------------------------------------------------------------
echo "[6/7] NotebookLM — манифест изменённых файлов..."
if $DRY_RUN; then
  echo "  [dry-run] генерация docs/NOTES_FOR_INGEST.md"
else
  {
    echo "# NotebookLM Ingest Manifest"
    echo ""
    echo "Автогенерация: $(date '+%Y-%m-%d %H:%M')"
    echo ""
    echo "## Добавить в ноутбук 'antigravity':"
    echo ""
    # Файлы, изменённые после последней синхронизации
    if [ -f "$EVA_DOCS/LAST_SYNC.txt" ]; then
      find "$DOCS" -name '*.md' -newer "$EVA_DOCS/LAST_SYNC.txt" -print 2>/dev/null | sort
    else
      echo "(первая синхронизация — все .md файлы)"
      find "$DOCS" -name '*.md' -print | sort
    fi
  } > "$DOCS/NOTES_FOR_INGEST.md" || echo "  ⚠️ манифест не сгенерён"
  ADD_COUNT=$(wc -l < "$DOCS/NOTES_FOR_INGEST.md" 2>/dev/null || echo 0)
  echo "  📋 $DOCS/NOTES_FOR_INGEST.md ($ADD_COUNT строк). Добавь через MCP:"
  echo "     notebooklm add_source type=text → ноутбук antigravity"
fi

# ---------------------------------------------------------------------------
# [7/7] Метаданные
# ---------------------------------------------------------------------------
echo "[7/7] LAST_SYNC..."
run date '+%Y-%m-%d %H:%M:%S' > "$EVA_DOCS/LAST_SYNC.txt" || true
run cp "$EVA_DOCS/LAST_SYNC.txt" "$DOCS/LAST_SYNC.txt"
echo "  ✓ LAST_SYNC: $(cat "$DOCS/LAST_SYNC.txt" 2>/dev/null || echo $TS)"

echo ""
echo "===== SYNC DONE $(date '+%H:%M:%S') ====="
echo "Мастер: $DOCS  |  Quartz public/: $DOCS_SITE/public"