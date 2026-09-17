#!/usr/bin/env bash
set -euo pipefail
TEXT="${1:-}"
CLS="${2:-sys}"
AGENT="${3:-eva}"
if [ -z "$TEXT" ]; then
  echo "usage: $0 'text' [cls] [agent]" >&2
  exit 1
fi
curl -sS -X POST "http://127.0.0.1:3000/api/live/event" \
  -H "content-type: application/json" \
  -d "{\"text\":\"$TEXT\",\"cls\":\"$CLS\",\"agent\":\"$AGENT\"}"
printf '\n'
