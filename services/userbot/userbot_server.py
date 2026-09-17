#!/usr/bin/env python3
"""
EvaBot Telegram Userbot Microservice
Listens on http://127.0.0.1:5055 for direct outbound Telegram messages.
AND listens for incoming Telegram messages (voice/text) via Telethon.
"""

import asyncio
import json
import os
import sys
import tempfile
from aiohttp import web
from telethon import TelegramClient, events
from telethon.tl.types import MessageMediaDocument

# Import local STT/TTS
sys.path.append(os.path.dirname(__file__))
from transcribe import transcribe
from tts import generate_audio, get_audio_duration

CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
SESSION_PATH = os.path.join(os.path.dirname(__file__), "eva_userbot.session")
AUDIO_DIR = os.path.join(os.path.dirname(__file__), "audio")
os.makedirs(AUDIO_DIR, exist_ok=True)

client: TelegramClient = None

def load_config():
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "api_id": os.getenv("TG_API_ID"),
        "api_hash": os.getenv("TG_API_HASH"),
        "phone": os.getenv("TG_PHONE")
    }

async def init_client():
    global client
    cfg = load_config()
    api_id = cfg.get("api_id")
    api_hash = cfg.get("api_hash")
    if not api_id or not api_hash:
        return None
    try:
        session_file = os.path.splitext(SESSION_PATH)[0]
        client = TelegramClient(session_file, int(api_id), api_hash)
        await client.connect()
        return client
    except Exception as e:
        print(f"[Userbot] Client init error: {e}", file=sys.stderr)
        return None

async def handle_health(request):
    is_auth = False
    if client and client.is_connected():
        is_auth = await client.is_user_authorized()
    return web.json_response({
        "status": "online" if is_auth else "unauthorized",
        "authorized": is_auth,
        "session_exists": os.path.exists(SESSION_PATH)
    })

async def handle_send(request):
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"ok": False, "error": "Invalid JSON"}, status=400)

    target = data.get("target")
    message = data.get("message")

    if not target or not message:
        return web.json_response({"ok": False, "error": "target and message required"}, status=400)

    if not client or not client.is_connected():
        await init_client()

    if not client or not await client.is_user_authorized():
        return web.json_response({
            "ok": False,
            "error": "Userbot is not authorized. Please run login.py first."
        }, status=403)

    try:
        sent = await client.send_message(target, message)
        return web.json_response({
            "ok": True,
            "message_id": sent.id,
            "target": target
        })
    except Exception as e:
        return web.json_response({"ok": False, "error": str(e)}, status=500)

async def _is_voice_message(event) -> bool:
    """Check if the incoming message is a voice note."""
    if not event.message.media:
        return False
    media = event.message.media
    if isinstance(media, MessageMediaDocument):
        doc = media.document
        if doc and doc.mime_type and doc.mime_type.startswith('audio/'):
            return True
    return False

async def handle_voice_message(event):
    """Handle incoming voice message: download -> STT -> LLM -> TTS -> reply"""
    try:
        # Download voice file
        # Voice notes are MessageMediaDocument, download directly
        doc = event.message.media.document
        if not doc or not doc.mime_type or not doc.mime_type.startswith('audio/'):
            await event.respond("❌ Не удалось определить голосовое сообщение")
            return

        # Download the file
        try:
            voice_path = await event.message.download_media()
        except Exception as e:
            await event.respond(f"❌ Не удалось загрузить голосовое: {str(e)[:100]}")
            return

        if not voice_path or not os.path.exists(voice_path) or os.path.getsize(voice_path) == 0:
            await event.respond("❌ Пустое голосовое сообщение")
            return

        try:
            # Transcribe with faster-whisper
            result = transcribe(voice_path)
            if not result["ok"]:
                await event.respond(f"❌ Распознавание не удалось: {result.get('error', 'unknown error')}")
                return

            transcript = result["transcript"].strip()
            if not transcript:
                await event.respond("❌ Голосовое сообщение пустое или не распознано")
                return

            # Send transcript as text confirmation
            await event.respond(f"🎤 Распознано: {transcript}")

            # Check if it's a command
            if transcript.startswith('/'):
                await event.respond("⚠️ Команды через голос пока не поддерживаются в этом режиме. Используйте текстовые команды.")
                return

            # Get LLM response from backend
            import aiohttp
            async with aiohttp.ClientSession() as session:
                try:
                    async with session.post(
                        'http://127.0.0.1:3000/api/chat',
                        json={
                            "message": transcript,
                            "model": "eva",
                            "user_id": str(event.sender_id)
                        },
                        timeout=aiohttp.ClientTimeout(total=30)
                    ) as resp:
                        if resp.status == 200:
                            data = await resp.json()
                            llm_response = data.get("response", "").strip()
                        else:
                            # Fallback to direct OmniRoute call
                            async with session.post(
                                'http://127.0.0.1:20128/v1/chat/completions',
                                json={
                                    "model": "eva",
                                    "messages": [{"role": "user", "content": transcript}],
                                    "max_tokens": 500,
                                    "temperature": 0.7
                                },
                                headers={"Authorization": f"Bearer {os.getenv('OMNI_KEY', '')}"},
                                timeout=aiohttp.ClientTimeout(total=30)
                            ) as omni_resp:
                                if omni_resp.status == 200:
                                    omni_data = await omni_resp.json()
                                    llm_response = omni_data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()
                                else:
                                    llm_response = "❌ Не удалось получить ответ от ИИ-ассистента"
                except Exception as e:
                    print(f"[Userbot] LLM call error: {e}")
                    llm_response = f"❌ Ошибка связи с ИИ-ассистентом: {str(e)[:100]}"

            if not llm_response:
                llm_response = "❌ Пустой ответ от ИИ-ассистента"

            # Generate TTS response
            audio_path = os.path.join(AUDIO_DIR, f"reply_{event.message.id}.mp3")
            # Use voice based on detected language
            lang_code = result.get("language", "ru")
            voice_map = {"ru": "ru-RU-DmitryNeural", "uk": "uk-UA-OstapNeural", "en": "en-US-GuyNeural"}
            voice = voice_map.get(lang_code, "ru-RU-DmitryNeural")

            duration = await generate_audio(llm_response, voice, audio_path)

            if duration > 0 and os.path.exists(audio_path):
                # Send voice message
                with open(audio_path, 'rb') as f:
                    await event.respond(file=f, voice_note=True)
            else:
                # Fallback to text response
                await event.respond(llm_response)

            # Cleanup audio file
            try:
                os.unlink(audio_path)
            except:
                pass

        finally:
            # Cleanup voice file
            try:
                os.unlink(voice_path)
            except:
                pass

    except Exception as e:
        print(f"[Userbot] Voice message error: {e}")
        import traceback
        traceback.print_exc()
        await event.respond(f"❌ Внутренняя ошибка обработки голосового сообщения: {str(e)[:100]}")


async def handle_text_message(event):
    """Handle incoming text message"""
    text = event.message.message.strip()
    if not text:
        return

    # Check for secretary mode commands
    if text.lower().startswith('ева, напиши ') or text.lower().startswith('eva, write ') or text.lower().startswith('ево, напиши '):
        await event.respond("👩‍💼 Режим секретаря: функция переадресации сообщений пока в разработке. Используйте /secretary для справки.")
        return

    # For regular text, we could process through LLM too, but for now just acknowledge
    await event.respond("🎤 Для работы с Евой через этого юзербота, пожалуйста, отправляйте голосовые сообщения. Текстовые команды в разработке.")


async def app_factory():
    app = web.Application()
    app.router.add_get("/health", handle_health)
    app.router.add_post("/send", handle_send)
    
    # Initialize Telethon client and event handlers
    telethon_client = await init_client()
    if telethon_client:
        # Register event handlers for incoming messages
        @telethon_client.on(events.NewMessage(incoming=True))
        async def handler(event):
            # Skip our own messages to avoid loops
            if event.out:
                return
            
            # Check message type
            if await _is_voice_message(event):
                await handle_voice_message(event)
            else:
                await handle_text_message(event)
        
        print("[*] Telegram userbot listener started")
    else:
        print("[!] Failed to initialize Telegram client")

    return app

if __name__ == "__main__":
    port = int(os.getenv("USERBOT_PORT", "5055"))
    print(f"[*] Starting EvaBot Userbot HTTP server on 127.0.0.1:{port}")
    web.run_app(app_factory(), host="127.0.0.1", port=port)