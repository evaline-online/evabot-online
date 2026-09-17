#!/usr/bin/env bash
# watchdog.sh — EvaBot Real-Time Production Watchdog & Diagnostics Engine.
#
# Monitored Core Targets:
#   1. evabot-brain   (:3000 /api/health)
#   2. evabot-voice   (:8000 /api/health)
#   3. evabot-userbot (:5055 /status)
#   4. openhands      (:3005 /)
#   5. n8n            (:5678 /healthz)
#   6. omniroute      (:20128 /health/liveliness)
#
# Rogue Port 3000 Protection:
#   Kills any rogue process trying to bind to :3000 and restarts evabot-brain.
#
# Auto-Healing:
#   Threshold >= 3 consecutive failures triggers auto_healer.py (OpenHands + Goose + Telegram alerts).

set -u
LOG_DIR="/var/www/evabot-backend/logs"
LOG_FILE="${LOG_DIR}/watchdog.log"
FAIL_DIR="${LOG_DIR}/watchdog_fails"
AUTO_HEALER="/var/www/evabot-backend/backend/venv/bin/python /var/www/evabot-backend/services/auto_healer.py"
FAIL_THRESHOLD=3

mkdir -p "${LOG_DIR}" "${FAIL_DIR}"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "${LOG_FILE}"
}

# 1. Anti-Hijack Guard for Port 3000
check_port_3000() {
  local pids
  pids=$(ss -tlpn sport = :3000 2>/dev/null | grep -o 'pid=[0-9]*' | cut -d= -f2)
  for pid in ${pids}; do
    if [ -d "/proc/${pid}" ]; then
      local cmd
      cmd=$(tr '\0' ' ' < "/proc/${pid}/cmdline" 2>/dev/null || echo "")
      # Valid brain process runs node dist/server/server.js
      if [[ "${cmd}" != *"dist/server/server.js"* && "${cmd}" != *"evabot"* ]]; then
        log "ALERT: Rogue process (PID ${pid}: ${cmd:0:80}) hijacking port 3000! Terminating..."
        sudo kill -9 "${pid}" 2>/dev/null || true
        sudo systemctl restart evabot-brain
      fi
    fi
  done
}

probe_http() {
  local url="$1"
  local timeout="${2:-6}"
  curl -s -o /dev/null -m "${timeout}" -w '%{http_code}' "${url}" 2>/dev/null || echo "000"
}

check_service() {
  local name="$1"
  local url="$2"
  local unit_name="$3"
  local fail_file="${FAIL_DIR}/${name}.fails"

  local count=0
  [ -f "${fail_file}" ] && count=$(cat "${fail_file}" 2>/dev/null || echo 0)

  local code
  code=$(probe_http "${url}")

  if [[ "${code}" =~ ^(200|204|302|301|307|308)$ ]]; then
    if [ "${count}" -gt 0 ]; then
      log "[OK] Service ${name} recovered after ${count} failed probe(s) (HTTP ${code})"
      echo 0 > "${fail_file}"
    fi
  else
    count=$((count + 1))
    echo "${count}" > "${fail_file}"
    log "[WARN] Service ${name} UNHEALTHY (${count}/${FAIL_THRESHOLD}) — ${url} returned HTTP ${code}"

    if [ "${count}" -ge "${FAIL_THRESHOLD}" ]; then
      log "[CRITICAL] Service ${name} reached failure threshold (${count})! Triggering Auto-Healer..."
      ${AUTO_HEALER} --service "${unit_name}" --error "Health check failed at ${url} with HTTP ${code}" >> "${LOG_FILE}" 2>&1 &
      echo 0 > "${fail_file}"
    fi
  fi
}

# Run diagnostics cycle
check_port_3000

check_service "evabot-brain"   "http://127.0.0.1:3000/api/health"         "evabot-brain"
check_service "evabot-voice"   "http://127.0.0.1:8000/api/health"         "evabot-voice"
check_service "evabot-userbot" "http://127.0.0.1:5055/health"             "evabot-userbot"
check_service "openhands"      "http://127.0.0.1:3005/"                   "docker-openhands"
check_service "n8n"            "http://127.0.0.1:5678/healthz"            "docker-n8n"
check_service "omniroute"      "http://127.0.0.1:20128/health/liveliness" "omniroute"

log "Watchdog heartbeat cycle completed successfully."
