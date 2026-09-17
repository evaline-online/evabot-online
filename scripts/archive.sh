#!/usr/bin/env bash
# Full snapshot archive of the entire evabot-online workspace into archive_full/.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$ROOT/archive_full"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$DEST_DIR/evabot_online_full_snapshot_$STAMP.tar.gz"

mkdir -p "$DEST_DIR"

tar --exclude="$DEST_DIR" \
    --exclude="$ROOT/node_modules" \
    --exclude="$ROOT/frontend/node_modules" \
    --exclude="$ROOT/dist" \
    --exclude="$ROOT/frontend/dist" \
    --exclude="__pycache__" \
    --exclude="*.pyc" \
    --exclude=".git" \
    --exclude=".playwright-mcp" \
    -czf "$OUT" -C "$ROOT" .

gzip -t "$OUT"
echo "ok: $OUT ($(du -h "$OUT" | cut -f1))"
