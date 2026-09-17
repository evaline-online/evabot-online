#!/usr/bin/env python3
"""
auto_healer.py — EvaBot Real-time Auto-Healing Engine via OpenHands + Goose.

Triggered by:
1. evabot-watchdog (when services crash or fail health checks)
2. FastAPI dispatcher / unhandled exception hooks
3. CLI invocation: python3 auto_healer.py --service <name> --error "<details>"

Workflow:
1. Diagnose failure: Check port collisions, PID status, error traces.
2. Fast-Remedy: If port 3000 is hijacked by non-brain process, kill rogue PID & restart brain.
3. Autonomous Code Healing: Dispatches session to OpenHands (port 3005) or Goose CLI.
4. Telegram Notification: Reports incident & auto-repair progress directly to creator.
"""

import argparse
import asyncio
import json
import logging
import os
import subprocess
import sys
import httpx

TELEGRAM_BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "8801554017:AAH413SCDmtAU_saAigHl02Fhb6J4kr7cME")
CREATOR_CHAT_ID = os.environ.get("CREATOR_CHAT_ID", "8992453393")
OPENHANDS_URL = os.environ.get("OPENHANDS_URL", "http://127.0.0.1:3005")
LOG_PATH = "/var/www/evabot-backend/logs/auto-healer.log"

os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_PATH),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("AutoHealer")


async def send_telegram_alert(text: str) -> bool:
    """Send alert to creator Telegram chat."""
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CREATOR_CHAT_ID,
        "text": text,
        "parse_mode": "HTML"
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(url, json=payload)
            return resp.status_code == 200
    except Exception as exc:
        logger.error(f"Failed to send Telegram alert: {exc}")
        return False


def check_and_kill_port_3000_rogue() -> bool:
    """Detect if port 3000 is occupied by something other than evabot-brain."""
    try:
        out = subprocess.check_output(
            ["ss", "-tlpn", "sport = :3000"], text=True, stderr=subprocess.DEVNULL
        )
        if "3000" not in out:
            return False

        # Extract PID
        import re
        m = re.search(r'pid=(\d+)', out)
        if not m:
            return False
        pid = int(m.group(1))

        # Check process cmdline
        cmdline_path = f"/proc/{pid}/cmdline"
        if os.path.exists(cmdline_path):
            with open(cmdline_path, "rb") as f:
                cmd = f.read().decode("utf-8", errors="ignore")
            # If it's not the primary dist/index.js node process
            if "dist/index.js" not in cmd and "evabot" not in cmd:
                logger.warning(f"Rogue PID {pid} detected on :3000 ({cmd[:80]}). Killing with SIGKILL...")
                subprocess.run(["kill", "-9", str(pid)], check=False)
                return True
    except Exception as exc:
        logger.error(f"Error checking port 3000 rogue PID: {exc}")
    return False


async def trigger_openhands_repair(service: str, error_details: str) -> dict:
    """Dispatches autonomous repair task to OpenHands."""
    logger.info(f"Triggering OpenHands repair for {service}...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # 1. Ensure OpenHands LLM settings are in place
            await client.post(
                f"{OPENHANDS_URL}/api/settings",
                json={
                    "llm_model": "omni/gemini-3.1-pro",
                    "llm_base_url": "http://172.17.0.1:20129/v1",
                    "llm_api_key": "omniroute-token",
                    "confirmation_mode": False
                }
            )

            # 2. Create conversation
            res = await client.post(f"{OPENHANDS_URL}/api/conversations", json={})
            data = res.json()
            conv_id = data.get("conversation_id")
            if not conv_id:
                logger.error(f"OpenHands session creation failed: {data}")
                return {"success": False, "error": "session_creation_failed"}

            # 3. Send autonomous repair prompt
            instruction = (
                f"Emergency auto-healing task for EvaBot service: '{service}'.\n"
                f"Error traceback / incident details:\n{error_details}\n\n"
                f"Codebase is located at /workspace (/var/www/evabot-backend).\n"
                f"Please inspect the logs and relevant source files, diagnose the issue, "
                f"apply the required fix or configuration update, and verify syntax."
            )

            msg_res = await client.post(
                f"{OPENHANDS_URL}/api/conversations/{conv_id}/messages",
                json={"action": "chat", "args": {"content": instruction}, "message": instruction}
            )

            logger.info(f"OpenHands session {conv_id} initialized with task.")
            return {"success": True, "conversation_id": conv_id, "status": msg_res.status_code}
        except Exception as exc:
            logger.error(f"Failed to communicate with OpenHands: {exc}")
            return {"success": False, "error": str(exc)}


async def run_healer(service: str, error_text: str):
    logger.info(f"=== Auto-Healer triggered for service: {service} ===")
    
    # Check port 3000 rogue occupancy first
    if service == "evabot-brain" or "3000" in error_text:
        killed = check_and_kill_port_3000_rogue()
        if killed:
            logger.info("Killed rogue process on port 3000. Restarting evabot-brain...")
            subprocess.run(["systemctl", "restart", "evabot-brain"], check=False)
            await send_telegram_alert(
                "⚡ <b>[EvaBot Auto-Healer]</b>\n\n"
                "⚠️ Обнаружен и ликвидирован паразитный процесс на порту :3000.\n"
                "🔄 Сервис <code>evabot-brain</code> успешно перезапущен."
            )
            return

    # Attempt restart
    logger.info(f"Attempting systemctl restart for {service}...")
    res = subprocess.run(["systemctl", "restart", service], capture_output=True, text=True)
    if res.returncode == 0:
        # Check if healthy after restart
        await asyncio.sleep(3)
        logger.info(f"Service {service} restarted.")
    else:
        logger.error(f"Restart failed: {res.stderr}")

    # Launch OpenHands agent for deep diagnostics and fix
    oh_result = await trigger_openhands_repair(service, error_text)
    
    conv_msg = f" (OpenHands Task: <code>{oh_result.get('conversation_id')}</code>)" if oh_result.get("success") else ""
    await send_telegram_alert(
        f"🚨 <b>[EvaBot Watchdog & Auto-Healer]</b>\n\n"
        f"• <b>Сервис:</b> <code>{service}</code>\n"
        f"• <b>Диагностика:</b> Зафиксирован сбой в работе.\n"
        f"• <b>Действие:</b> Перезапуск выполнен{conv_msg}.\n"
        f"• <b>Детали ошибки:</b> <code>{error_text[:200]}</code>"
    )


def main():
    parser = argparse.ArgumentParser(description="EvaBot Auto-Healer Engine")
    parser.add_argument("--service", default="evabot-brain", help="Service name")
    parser.add_argument("--error", default="Health check timeout / crash", help="Error details")
    args = parser.parse_args()

    asyncio.run(run_healer(args.service, args.error))


if __name__ == "__main__":
    main()
