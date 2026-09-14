#!/usr/bin/env bash
# ==============================================================================
# EvaLine Ecosystem Unified Health Check
# Checks Core Compute (Frankfurt), Edge Ingress (Iowa), Cloud Run, and Tailscale
# ==============================================================================
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}================================================================================${NC}"
echo -e "${BLUE}        EVALINE / EVABOT ECOSYSTEM HEALTH MONITOR${NC}"
echo -e "${BLUE}================================================================================${NC}"
echo ""

ERRORS=0

check_service() {
    local name="$1"
    local url="$2"
    local expected="${3:-200}"
    local code
    code=$(curl -k -s -o /dev/null -w "%{http_code}" --connect-timeout 5 ${4:+"$4"} ${5:+"$5"} "$url" 2>/dev/null || echo "ERR")
    if [[ "$code" == "$expected" || "$code" == "301" || "$code" == "302" ]]; then
        echo -e "${GREEN}  ✓ [HTTP $code] $name ($url)${NC}"
    else
        echo -e "${RED}  ✗ [HTTP $code] $name ($url) - Expected: $expected${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

echo -e "${CYAN}[1/4] Checking Local Compute Node Services (Frankfurt evabot-agent-vm)...${NC}"
check_service "evabot-brain API" "http://127.0.0.1:3000/api/models/free" "200"
check_service "evabot-voice (FastAPI docs)" "http://127.0.0.1:8000/docs" "200"
check_service "evabot-face (3D Avatar Web)" "http://127.0.0.1:8093/" "200"
check_service "Quartz Documentation Engine" "http://127.0.0.1:8081/" "200"
check_service "OmniRoute LiteLLM" "http://127.0.0.1:20128/health/liveliness" "200"
echo ""

echo -e "${CYAN}[2/4] Checking Local Nginx Ingress Reverse Proxy (:80)...${NC}"
check_service "Nginx -> /face/" "http://127.0.0.1:80/face/" "200"
check_service "Nginx -> /docs/" "http://127.0.0.1:80/docs/" "200"
check_service "Nginx -> /voice/ (FastAPI)" "http://127.0.0.1:80/voice/docs" "200"
echo ""

echo -e "${CYAN}[3/4] Checking Tailscale Connectivity to Iowa Edge Node...${NC}"
if ping -c 1 -W 2 100.125.200.49 >/dev/null 2>&1; then
    echo -e "${GREEN}  ✓ Tailscale ping to evaline-micro-vm (100.125.200.49) OK${NC}"
else
    echo -e "${RED}  ✗ Cannot ping evaline-micro-vm over Tailscale${NC}"
    ERRORS=$((ERRORS + 1))
fi
echo ""

echo -e "${CYAN}[4/4] Checking Serverless & Edge Public Ingress...${NC}"
check_service "Cloud Run: business-tier-api" "https://business-tier-api-873069440066.us-central1.run.app/health" "200"
check_service "Edge: evabot.online (via Iowa Caddy)" "https://136.114.26.252/face/" "200" -H "Host: evabot.online"
check_service "Edge: pro.evaline.online" "http://136.114.26.252/health" "200"
check_service "GCP LB: business.evaline.online" "http://34.49.122.75/health" "200"
echo ""

echo -e "${BLUE}================================================================================${NC}"
if [ "$ERRORS" -eq 0 ]; then
    echo -e "${GREEN}  ALL SYSTEMS HEALTHY & OPERATIONAL (0 errors)${NC}"
else
    echo -e "${RED}  ATTENTION: $ERRORS check(s) reported issues!${NC}"
fi
echo -e "${BLUE}================================================================================${NC}"
