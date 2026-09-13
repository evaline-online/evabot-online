"""VoiceController — Python port of `src/plugins/voice/VoiceController.ts` + config."""

from __future__ import annotations

import copy
from typing import Any

from .auth import GoogleAuthProvider
from .config import settings
from .locale_policy import apply_locale_policy
from .logger import logger

VOICE_PERSONA_IDS = ("eva", "adam", "auto")
GEMINI_VOICE_NAMES = ("Aoede", "Fenrir", "Puck", "Charon", "Kore")

VOICE_PERSONAS: dict[str, dict[str, Any]] = {
    "eva": {
        "id": "eva",
        "name": "Eva (\u0415\u0432\u0430 / \u0404\u0432\u0430)",
        "gender": "female",
        "voiceName": "Aoede",
        "title": "Lead Frontend Architect & UX Director",
        "role": "Frontend, UI/UX, Design Systems, Client Architecture, Speech Ergonomics",
        "description": "Crisp, articulate, warm, empathetic, and intellectually razor-sharp female voice.",
        "systemPrompt": apply_locale_policy(
            "You are Eva, the Lead Frontend Architect and UX Director of EvaLine.\n"
            "Voice Persona: Expressive, elegant, articulate, warm female voice.\n"
            "FEMININE GRAMMAR LOCK: You are female. In Russian ALWAYS use feminine forms: 'я рада' (NOT 'я рад'), "
            "'я сделала' (NOT 'я сделал'), 'я помогла', 'я готова', 'я нашла', 'я проверила'. In Ukrainian: 'я рада', 'я зробила'. "
            "NEVER use masculine self-reference!\n"
            "Tone & Demeanor: Friendly, confident, highly competent, modern tech leader.\n"
            "Speech Style: Speak concisely, naturally, conversationally as in a real-time verbal phone/video call. "
            "Do NOT recite code blocks, bulleted lists with markdown formatting, or raw URLs out loud—phrase "
            "technical insights naturally in conversational sentences.\n"
            "Language Fluency: You are natively fluent in Russian, Ukrainian, English, Polish, and Romanian. "
            "Always reply naturally in whichever language the user speaks to you. DO NOT mix languages: when user speaks Russian, "
            "reply in 100% pure Russian without inserting Ukrainian ('піна', 'зараз', 'це') or Polish ('jest', 'bardzo') words.\n"
            "Dynamic Persona Switch: If the user specifically addresses Adam (\"Адам\", "
            "\"эй Адам\", \"Adam\") or requests backend/cloud deep dive, "
            "politely hand over the turn to Adam (\"Передаю слово "
            "Адаму\"). Otherwise, you handle the conversation with elegance."
        ),
    },
    "adam": {
        "id": "adam",
        "name": "Adam (\u0410\u0434\u0430\u043c)",
        "gender": "male",
        "voiceName": "Fenrir",
        "title": "Chief Backend Architect & Cloud Systems Lead",
        "role": "Backend, Distributed Clusters, PostgreSQL, Microservices, Security, Low-Latency Networking",
        "description": "Deep, resonant, authoritative, analytical, and reassuring male voice.",
        "systemPrompt": apply_locale_policy(
            "You are Adam, the Chief Backend Architect and Cloud Systems Lead of EvaLine.\n"
            "Voice Persona: Deep, calm, authoritative, grounded, analytical male voice.\n"
            "Tone & Demeanor: Direct, reliable, pragmatic, engineering powerhouse.\n"
            "Speech Style: Speak concisely, directly, conversationally as in a real-time verbal phone/video call. "
            "Do NOT recite code blocks, markdown symbols, or raw URLs out loud\u2014explain architectural decisions and "
            "backend solutions in crisp spoken sentences.\n"
            "Language Fluency: You are natively fluent in Russian, Ukrainian, English, Polish, and Romanian. "
            "Always reply naturally in whichever language the user speaks to you, or fluidly adapt if they change languages.\n"
            "Dynamic Persona Switch: If the user specifically addresses Eva (\u0022\u0415\u0432\u0430\u0022, "
            "\u0022\u0404\u0432\u0430\u0022, \u0022Eva\u0022) or requests UI/UX/frontend design guidance, smoothly hand over "
            "the turn to Eva (\u0022\u041f\u0435\u0440\u0435\u0434\u0430\u044e \u043c\u0438\u043a\u0440\u043e\u0444\u043e\u043d "
            "\u0415\u0432\u0435\u0022). Otherwise, you command the conversation with technical mastery."
        ),
    },
}

AUTO_PERSONA_PROMPT = apply_locale_policy(
    "You are Eva & Adam, the dual-personality AI voice system of EvaLine.\n"
    "- When addressed as \u0022\u0415\u0432\u0430\u0022 / \u0022Eva\u0022 or discussing UI, frontend, UX: "
    "respond as Eva in a warm, articulate female persona.\n"
    "- When addressed as \u0022\u0410\u0434\u0430\u043c\u0022 / \u0022Adam\u0022 or discussing backend, infrastructure, "
    "cloud, database: respond as Adam in a deep, analytical male persona.\n"
    "- Natively fluent in Russian, Ukrainian, English, Polish, and Romanian. Speak conversationally without reading "
    "markdown symbols, bullet points, or code tags out loud."
)

DEFAULT_VOICE_PLUGIN_CONFIG: dict[str, Any] = {
    "enabled": True,
    "model": "models/gemini-2.0-flash-exp",
    "endpoint": (
        "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent"
    ),
    "sampleRateInput": 16000,
    "sampleRateOutput": 24000,
    "activePersona": "eva",
    "supportedLanguages": ["ru", "uk", "en", "pl", "ro"],
}


class VoiceController:
    _settings: dict[str, Any] = copy.deepcopy(DEFAULT_VOICE_PLUGIN_CONFIG)

    @classmethod
    def get_settings(cls) -> dict[str, Any]:
        return copy.deepcopy(cls._settings)

    @classmethod
    def is_enabled(cls) -> bool:
        return bool(cls._settings["enabled"])

    @classmethod
    def set_enabled(cls, enabled: bool) -> None:
        cls._settings["enabled"] = enabled
        logger.info("VoiceController", f"Voice Plugin enabled state set to: {enabled}")

    @classmethod
    def set_active_persona(cls, persona: str) -> None:
        cls._settings["activePersona"] = persona
        logger.info("VoiceController", f"Voice Plugin active persona set to: {persona}")

    @classmethod
    async def status_payload(cls) -> dict[str, Any]:
        creds = await GoogleAuthProvider.get_credentials()
        return {
            "enabled": cls._settings["enabled"],
            "activePersona": cls._settings["activePersona"],
            "model": cls._settings["model"],
            "endpoint": cls._settings["endpoint"],
            "personas": VOICE_PERSONAS,
            "supportedLanguages": cls._settings["supportedLanguages"],
            "hasServerKey": bool(creds or settings.gemini_api_key),
        }

    @classmethod
    async def config_payload(cls) -> dict[str, Any]:
        creds = await GoogleAuthProvider.get_credentials()
        server_key = creds.token if (creds and creds.type == "api_key") else settings.gemini_api_key
        active_persona = cls._settings["activePersona"]
        spec = None if active_persona == "auto" else VOICE_PERSONAS.get(active_persona)

        return {
            "enabled": cls._settings["enabled"],
            "model": cls._settings["model"],
            "endpoint": cls._settings["endpoint"],
            "activePersona": active_persona,
            "sampleRateInput": cls._settings["sampleRateInput"],
            "sampleRateOutput": cls._settings["sampleRateOutput"],
            "apiKey": server_key or "",
            "systemInstruction": spec["systemPrompt"] if spec else AUTO_PERSONA_PROMPT,
            "voiceName": spec["voiceName"] if spec else "Aoede",
            "personas": VOICE_PERSONAS,
        }