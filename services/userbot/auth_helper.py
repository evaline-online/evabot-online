#!/usr/bin/env python3
"""
Two-step Telethon auth helper for non-blocking CLI/API login.
"""

import asyncio
import json
import os
import sys
from telethon import TelegramClient

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
SESSION_FILE = os.path.join(BASE_DIR, "eva_userbot")
TEMP_AUTH_PATH = os.path.join(BASE_DIR, "auth_state.json")

def get_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

async def send_code(phone: str):
    cfg = get_config()
    api_id = cfg["api_id"]
    api_hash = cfg["api_hash"]

    client = TelegramClient(SESSION_FILE, api_id, api_hash)
    await client.connect()

    if await client.is_user_authorized():
        me = await client.get_me()
        await client.disconnect()
        return {"status": "already_authorized", "user": me.first_name, "id": me.id}

    sent = await client.send_code_request(phone)
    # Save auth state
    with open(TEMP_AUTH_PATH, "w", encoding="utf-8") as f:
        json.dump({
            "phone": phone,
            "phone_code_hash": sent.phone_code_hash
        }, f)

    await client.disconnect()
    return {
        "status": "code_sent",
        "phone": phone,
        "phone_code_hash": sent.phone_code_hash
    }

async def verify_code(code: str, password: str = None):
    if not os.path.exists(TEMP_AUTH_PATH):
        return {"status": "error", "message": "No active auth request found. Run send_code first."}

    with open(TEMP_AUTH_PATH, "r", encoding="utf-8") as f:
        state = json.load(f)

    phone = state["phone"]
    phone_code_hash = state["phone_code_hash"]

    cfg = get_config()
    api_id = cfg["api_id"]
    api_hash = cfg["api_hash"]

    client = TelegramClient(SESSION_FILE, api_id, api_hash)
    await client.connect()

    try:
        await client.sign_in(phone=phone, code=code, phone_code_hash=phone_code_hash)
    except Exception as e:
        if "password" in str(e).lower() and password:
            await client.sign_in(password=password)
        else:
            await client.disconnect()
            return {"status": "error", "message": str(e)}

    me = await client.get_me()
    await client.disconnect()

    # update config.json with phone
    cfg["phone"] = phone
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)

    if os.path.exists(TEMP_AUTH_PATH):
        os.remove(TEMP_AUTH_PATH)

    return {
        "status": "success",
        "user": me.first_name,
        "username": me.username,
        "id": me.id
    }

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else ""
    if action == "send":
        phone = sys.argv[2]
        res = asyncio.run(send_code(phone))
        print(json.dumps(res, ensure_ascii=False))
    elif action == "verify":
        code = sys.argv[2]
        pwd = sys.argv[3] if len(sys.argv) > 3 else None
        res = asyncio.run(verify_code(code, pwd))
        print(json.dumps(res, ensure_ascii=False))
    else:
        print("Usage: auth_helper.py send <phone> OR auth_helper.py verify <code> [password]")
