#!/usr/bin/env bash
# EvaBot Brain Watchdog — detects crash-loops and sends Telegram alert
set -euo pipefail

LOG="/var/log/evabot-brain.log"
ERROR_LOG="/var/log/evabot-brain.error.log"
THRESHOLD=${WATCHDOG_THRESHOLD:-3}       # restarts in WINDOW_MINUTES
WINDOW_MINUTES=${WATCHDOG_WINDOW:-10}
TELEGRAM_TOKEN=${TELEGRAM_BOT_TOKEN:-}
CHAT_ID=${TELEGRAM_CHAT_ID:-}

# Count systemd restarts of evabot-brain in the last N minutes
RESTARTS=$(journalctl -u evabot-brain --since "${WINDOW_MINUTES} minutes ago" --no-pager 2>/dev/null | grep -ci "Started\|Stopping\|exited\|failed" || true)

if [ "$RESTARTS" -ge "$THRESHOLD" ]; then
  MSG="🚨 EvaBot Brain CRASH-LOOP detected! ${RESTARTS} restarts in last ${WINDOW_MINUTES}m."
  echo "$MSG" >> "$ERROR_LOG" 2>/dev/null || true
  if [ -n "$TELEGRAM_TOKEN" ] && [ -n "$CHAT_ID" ]; then
    curl -s "https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage" \
      -d chat_id="$CHAT_ID" \
      -d text="$MSG $(journalctl -u evabot-brain --since "${WINDOW_MINUTES} minutes ago" --no-pager 2>/dev/null | tail -5)" > /dev/null || true
  fi
fi
