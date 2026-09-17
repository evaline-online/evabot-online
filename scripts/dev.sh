#!/usr/bin/env bash
# Local dev: FastAPI backend (:8000) + Vite frontend dev server (:5173, proxy /api -> :8000).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cleanup() {
  kill "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo ">> Starting backend (uvicorn :8000)..."
(cd "$ROOT/backend" && python3 run.py) &
BACKEND_PID=$!

echo ">> Starting frontend (vite :5173)..."
(cd "$ROOT/frontend" && npx vite --port 5173 --strictPort) &
FRONTEND_PID=$!

echo ">> EvaBot Online: http://localhost:5173 (API on :8000)"
wait
