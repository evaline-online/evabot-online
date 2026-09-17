#!/usr/bin/env python3
"""
Interactive login wizard for EvaBot Telegram Userbot.
Run this script once from the console to authenticate your Telegram account.
"""

import asyncio
import json
import os
import sys
from telethon import TelegramClient

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_PATH = os.path.join(BASE_DIR, "config.json")
SESSION_FILE = os.path.join(BASE_DIR, "eva_userbot")

async def main():
    print("==================================================")
    print("   EvaBot Telegram Userbot — Мастер авторизации   ")
    print("==================================================")
    print("Для работы юзербота требуются API_ID и API_HASH с сайта:")
    print("👉 https://my.telegram.org (раздел 'API development tools')\n")

    api_id = os.getenv("TG_API_ID")
    api_hash = os.getenv("TG_API_HASH")

    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r") as f:
                cfg = json.load(f)
                api_id = cfg.get("api_id", api_id)
                api_hash = cfg.get("api_hash", api_hash)
        except Exception:
            pass

    if not api_id:
        api_id = input("Введите Telegram API_ID (число): ").strip()
    else:
        print(f"Используем API_ID: {api_id}")

    if not api_hash:
        api_hash = input("Введите Telegram API_HASH (строка): ").strip()
    else:
        print(f"Используем API_HASH: {api_hash[:4]}...{api_hash[-4:]}")

    phone = input("Введите номер телефона аккаунта (+380... / +48...): ").strip()

    # Сохраняем конфиг
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump({"api_id": int(api_id), "api_hash": api_hash, "phone": phone}, f, indent=2)

    print("\nПодключаемся к Telegram...")
    client = TelegramClient(SESSION_FILE, int(api_id), api_hash)
    await client.start(phone=phone)

    me = await client.get_me()
    print("\n==================================================")
    print(f"✅ Успешно авторизован аккаунт: {me.first_name} (@{me.username or 'без юзернейма'})")
    print(f"ID аккаунта: {me.id}")
    print(f"Файл сессии сохранен: {SESSION_FILE}.session")
    print("Теперь служба evabot-userbot.service может отправлять прямые сообщения!")
    print("==================================================")
    await client.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
