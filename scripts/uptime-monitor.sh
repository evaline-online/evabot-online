#!/usr/bin/env bash
# EvaBot uptime monitor — log health-check failures
LOG="/var/log/evabot-uptime.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
if curl -sf --max-time 5 "http://localhost:3000/api/health" > /dev/null 2>&1; then
  echo "$TIMESTAMP OK" >> "$LOG"
else
  echo "$TIMESTAMP FAIL" >> "$LOG"
fi
