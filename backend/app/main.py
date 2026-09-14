"""EvaBot Online — FastAPI backend entrypoint.

Strictly backend (Python). Serves the JSON/SSE API consumed by the TS frontend.
"""

from __future__ import annotations

import asyncio
import os
import time
import uuid
from collections.abc import AsyncIterator
from typing import Any

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

from .auth import GoogleAuthProvider
from .ansi import boot_banner, status_bar as ansi_status_bar
from .config import settings
from .consilium import CONSILIUM_MODES, ConsiliumEngine, PERSONA_IDS
from .corporate_roles import CORPORATE_ROLES, list_corporate_roles
from .diagnostics import run_diagnostics
from .llm_client import UniversalLlmClient
from .logger import logger
from .model_registry import ModelRegistry
from .prompts import build_system_instruction
from .voice import VoiceController

app = FastAPI(
    title="EvaBot Online API",
    version="v0.0.1 MVP",
    description="Backend for EvaBot & Evaline Online (Chernomorsk, Ukraine & Bratislava, Slovakia). Backend: Python/FastAPI, Frontend: TypeScript.",
    # Root path behind the nginx /voice/ proxy prefix. Without it, the Swagger
    # UI at /voice/docs embeds absolute /openapi.json → 404 behind the proxy.
    root_path=os.environ.get('FASTAPI_ROOT_PATH', ''),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

EXPLICIT_USER_MODELS = ("models/gemini-2.0-flash-exp",)

# Developer Mode — runtime toggle (backed by DEV_MODE env at boot, flippable via API).
_runtime_dev_mode: bool = settings.dev_mode


def is_dev_mode() -> bool:
    return _runtime_dev_mode


def set_dev_mode(value: bool) -> bool:
    global _runtime_dev_mode
    _runtime_dev_mode = bool(value)
    return _runtime_dev_mode


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _unified_model(model: str) -> str:
    """Normalize frontend 'models/<id>' to catalog ids."""
    for prefix in ("models/",):
        if model.startswith(prefix):
            return model[len(prefix):]
    if model.startswith("omniroute/"):
        return model
    return model


# ---------------------------------------------------------------------------
# Boot / health / telemetry endpoints
# ---------------------------------------------------------------------------
@app.get("/api/health")
async def api_health() -> JSONResponse:
    creds = await GoogleAuthProvider.get_credentials()
    return JSONResponse(
        {
            "status": "online",
            "version": "v0.0.1 MVP",
            "server": "evabot-online-edge",
            "uptimeSeconds": int(round(time.time() - _BOOT_TIME)),
            "memoryUsageMb": _memory_mb(),
            "availableModels": len(ModelRegistry.get_all_models()),
            "devMode": is_dev_mode(),
            "hasServerApiKey": bool(creds),
            "authSource": creds.source if creds else "None",
            "account": creds.account if creds else "evabot.online@gmail.com",
            "supportedProviders": ["google", "omniroute", "openrouter", "opencode"],
            "omnirouteEndpoint": settings.omniroute_base_url,
            "availableRolesCount": len(CORPORATE_ROLES),
        }
    )


@app.get("/api/diagnostics/boot")
async def api_diagnostics_boot(model: str = Query(default="gemini-3.8-flash")) -> JSONResponse:
    report = await run_diagnostics(active_model_id=model)
    return JSONResponse(report)


@app.get("/api/config")
async def api_config() -> JSONResponse:
    return JSONResponse(
        {
            "productName": "EvaBot Online",
            "version": "v0.0.1 MVP",
            "server": "evabot-online-edge",
            "base": "Chernomorsk, Ukraine (UA) & Bratislava, Slovakia",
            "manufacturing": "Chernomorsk, Promyslova st. 1",
            "euHub": "Bratislava, Obchodna 37",
            "localePolicy": {
                "currencies": list(settings.supported_currencies),
                "financialStandard": "USD ($) & EUR (€) only",
                "zeroTolerance": "Aggressor state references are strictly prohibited.",
            },
            "devMode": is_dev_mode(),
            "defaultModel": settings.default_model,
            "availableModels": len(ModelRegistry.get_all_models()),
            "supportedProviders": ["google", "omniroute", "openrouter", "opencode"],
            "voice": {
                "enabled": VoiceController.is_enabled(),
                "activePersona": VoiceController.get_settings().get("activePersona", "auto"),
            },
            "commands": [
                {"cmd": "/help", "desc": "Terminal command reference"},
                {"cmd": "/about", "desc": "About EvaBot Online, EvaLine corp & GCP cluster"},
                {"cmd": "/models [filter]", "desc": "Model catalog with USD/EUR pricing"},
                {"cmd": "/compare", "desc": "Top-10 coding models comparison"},
                {"cmd": "/model <id>", "desc": "Switch active model"},
                {"cmd": "/mode <chat|dialog|interview|consilium>", "desc": "Switch operational mode"},
                {"cmd": "/consilium <topic>", "desc": "Run multi-agent AI consilium deliberation"},
                {"cmd": "/persona <eva|adam|dual>", "desc": "Switch co-pilot persona"},
                {"cmd": "/db <hybrid|postgres|qdrant|ephemeral>", "desc": "Route knowledge base"},
                {"cmd": "/preset <top10_paid|top10_free>", "desc": "Consilium preset"},
                {"cmd": "/boot", "desc": "Re-run boot diagnostics"},
                {"cmd": "/config", "desc": "Show backend configuration"},
                {"cmd": "/dev", "desc": "Show Developer Mode runtime status"},
                {"cmd": "/ansi", "desc": "Show raw ANSI of the boot banner (dev)"},
                {"cmd": "/onboarding", "desc": "Replay the interactive 10-step onboarding"},
                {"cmd": "/clear", "desc": "Purge terminal screen"},
            ],
            "dev": {
                "runtime": {
                    "bootTimeEpochSec": int(round(_BOOT_TIME)),
                    "env": {
                        "DEV_MODE": is_dev_mode(),
                        "GEMINI_API_KEY_SET": bool(settings.gemini_api_key),
                        "OMNIROUTE_ENDPOINT": settings.omniroute_base_url,
                        "OPENROUTER_KEY_SET": bool(settings.openrouter_api_key),
                    },
                }
            },
        }
    )


@app.post("/api/config/dev-mode")
async def api_config_dev_mode(payload: dict[str, Any] | None = None) -> JSONResponse:
    """Runtime Developer Mode toggle (independent per-boot; env DEV_MODE is the boot default)."""
    payload = payload or {}
    if isinstance(payload.get("enabled"), bool):
        set_dev_mode(bool(payload["enabled"]))
    else:
        set_dev_mode(not is_dev_mode())
    return JSONResponse({"success": True, "devMode": is_dev_mode()})


@app.get("/api/text/boot-banner")
async def api_text_boot_banner() -> JSONResponse:
    """Universal text content — canonical ANSI "screen art" (terminal == web == mobile)."""
    import datetime

    return JSONResponse(
        {
            "type": "ansi",
            "content": boot_banner(),
            "generatedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        }
    )


@app.get("/api/models")
async def api_models(scope: str | None = Query(default=None)) -> JSONResponse:
    if scope == "top10_paid":
        models = ModelRegistry.get_top10_paid_smartest_models()
    elif scope == "top10_free":
        models = ModelRegistry.get_top10_free_models()
    else:
        models = ModelRegistry.get_all_models()
    return JSONResponse(
        {
            "models": models,
            "categories": ModelRegistry.get_categories(),
            "defaultModel": settings.default_model,
        }
    )


@app.get("/api/roles")
async def api_roles() -> JSONResponse:
    roles_list = list_corporate_roles()
    return JSONResponse({"roles": roles_list, "count": len(roles_list)})


@app.get("/api/database/status")
async def api_database_status() -> JSONResponse:
    return JSONResponse(
        {
            "activeDatabase": "hybrid",
            "databases": [
                {
                    "id": "hybrid",
                    "name": "EvaLine Hybrid DB (PostgreSQL + Qdrant)",
                    "type": "Relational & Semantic RAG",
                    "status": "CONNECTED \U0001f7e2",
                    "latencyMs": 4,
                    "source": "postgres[public.arch_docs] + qdrant[evaline_core]",
                    "docsIndexed": 1420,
                },
                {
                    "id": "postgres",
                    "name": "Company PostgreSQL Production",
                    "type": "Relational SQL",
                    "status": "READY \U0001f7e2",
                    "latencyMs": 8,
                    "source": "postgres://production-db.internal:5432/evaline_corp",
                    "docsIndexed": 9540,
                },
                {
                    "id": "qdrant",
                    "name": "Qdrant Distributed Vector Cluster",
                    "type": "Dense Embeddings (Cosine >= 0.78)",
                    "status": "READY \U0001f7e2",
                    "latencyMs": 11,
                    "source": "qdrant.internal:6333 [evaline_embeddings]",
                    "docsIndexed": 45000,
                },
                {
                    "id": "ephemeral",
                    "name": "Ephemeral Local Memory Vault",
                    "type": "In-Memory Context",
                    "status": "ISOLATED \u26aa",
                    "latencyMs": 0,
                    "source": "Session memory only",
                    "docsIndexed": 0,
                },
            ],
        }
    )


@app.get("/api/persona")
async def api_persona() -> JSONResponse:
    return JSONResponse(
        {
            "personas": [
                {
                    "id": "eva",
                    "name": "Eva (\u0415\u0432\u0430)",
                    "gender": "Female (\u2640)",
                    "role": "Lead Frontend Architect & UX Director",
                    "focus": "Frontend, UI/UX, Design Systems, Typography, Web Speech, Client Architecture",
                    "voiceType": "Neural Female Voice",
                    "preferredModel": "gemini-3.8-flash",
                },
                {
                    "id": "adam",
                    "name": "Adam (\u0410\u0434\u0430\u043c)",
                    "gender": "Male (\u2642)",
                    "role": "Chief Backend Architect & Cloud Systems Lead",
                    "focus": "Backend, Distributed Systems, Cloud Clusters, PostgreSQL, Microservices, Security",
                    "voiceType": "Deep Neural Male Voice",
                    "preferredModel": "gemini-3.1-pro",
                },
                {
                    "id": "dual",
                    "name": "Eva & Adam (\u0414\u0432\u043e\u0439\u043d\u043e\u0439 \u0442\u0430\u043d\u0434\u0435\u043c)",
                    "gender": "Dual (\u2640+\u2642)",
                    "role": "Full-Stack Synergistic Co-Pilots",
                    "focus": "Frontend Strategy (Eva) + Backend Rigor (Adam) Operating in Tandem",
                    "voiceType": "Dual Alternating Voice",
                    "preferredModel": "gemini-3.1-pro",
                },
            ],
        }
    )


@app.get("/api/voice/status")
async def api_voice_status() -> JSONResponse:
    return JSONResponse(await VoiceController.status_payload())


@app.get("/api/voice/config")
async def api_voice_config() -> JSONResponse:
    return JSONResponse(await VoiceController.config_payload())


@app.post("/api/voice/toggle")
async def api_voice_toggle(payload: dict[str, Any] | None = None) -> JSONResponse:
    payload = payload or {}
    if isinstance(payload.get("enabled"), bool):
        VoiceController.set_enabled(bool(payload["enabled"]))
    else:
        VoiceController.set_enabled(not VoiceController.is_enabled())
    return JSONResponse({"success": True, "enabled": VoiceController.is_enabled()})


@app.post("/api/voice/persona")
async def api_voice_persona(payload: dict[str, Any]) -> JSONResponse:
    persona = payload.get("persona")
    if persona not in ("eva", "adam", "auto"):
        raise HTTPException(status_code=400, detail='Invalid persona. Expected: "eva", "adam", or "auto"')
    VoiceController.set_active_persona(persona)
    return JSONResponse({"success": True, "activePersona": VoiceController.get_settings()["activePersona"]})


# ---------------------------------------------------------------------------
# Chat / Consilium
# ---------------------------------------------------------------------------
@app.get("/api/chat/health")
async def api_chat_health() -> JSONResponse:
    return JSONResponse({"ok": True})


@app.post("/api/chat")
async def api_chat(payload: dict[str, Any]) -> JSONResponse:
    message = payload.get("message")
    if not isinstance(message, str) or not message:
        raise HTTPException(status_code=400, detail='Missing or invalid "message" parameter')

    target_model = _unified_model(str(payload.get("model") or settings.default_model))
    history = payload.get("history") or []
    api_key = payload.get("apiKey")
    system_instruction = str(payload.get("systemInstruction") or "")
    if not system_instruction:
        system_instruction = build_system_instruction(
            persona=str(payload.get("persona") or "dual"),
            role=payload.get("role") or None,
            lang=str(payload.get("lang") or "en"),
        )
    provider = payload.get("provider")

    client = UniversalLlmClient(api_key or settings.gemini_api_key or None)
    messages = [*history, {"role": "user", "content": message.strip()}]

    try:
        response_text = await client.generate_content(
            target_model,
            messages,
            system_instruction=system_instruction or settings.default_system_instruction,
            provider=provider,
            api_key=api_key,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Server", f"Chat error: {exc}")
        msg = str(exc)
        status = 401 if "credentials" in msg or "API key" in msg else 500
        return JSONResponse({"error": msg or "Internal server error"}, status_code=status)

    prompt_tokens = ModelRegistry.estimate_tokens(
        " ".join(
            m.get("parts", [{"text": m.get("content", "")}])[0]["text"] if m.get("parts") else m.get("content", "")
            for m in messages
        )
        + " " + str(system_instruction or "")
    )
    completion_tokens = ModelRegistry.estimate_tokens(response_text)
    cost = ModelRegistry.calculate_cost(target_model, prompt_tokens, completion_tokens)

    return JSONResponse(
        {
            "response": response_text,
            "model": target_model,
            "provider": client.resolve_provider(target_model, provider),
            "usage": {
                "promptTokens": prompt_tokens,
                "completionTokens": completion_tokens,
                "totalTokens": prompt_tokens + completion_tokens,
            },
            "cost": cost,
        }
    )


@app.post("/api/chat/stream")
async def api_chat_stream(payload: dict[str, Any]) -> StreamingResponse:
    message = payload.get("message")
    if not isinstance(message, str) or not message:
        return JSONResponse({"error": 'Missing or invalid "message" parameter'}, status_code=400)

    target_model = _unified_model(str(payload.get("model") or settings.default_model))
    history = payload.get("history") or []
    api_key = payload.get("apiKey")
    system_instruction = str(payload.get("systemInstruction") or "")
    if not system_instruction:
        system_instruction = build_system_instruction(
            persona=str(payload.get("persona") or "dual"),
            role=payload.get("role") or None,
            lang=str(payload.get("lang") or "en"),
        )
    provider = payload.get("provider")

    client = UniversalLlmClient(api_key or settings.gemini_api_key or None)
    messages = [*history, {"role": "user", "content": message.strip()}]

    async def event_stream() -> AsyncIterator[str]:
        queue: asyncio.Queue = asyncio.Queue()
        sentinel = object()

        async def pump() -> str:
            try:
                return await client.stream_content(
                    target_model,
                    messages,
                    lambda chunk: queue.put_nowait(f"data: {_json_dumps({'chunk': chunk})}\n\n"),
                    system_instruction=system_instruction or settings.default_system_instruction,
                    provider=provider,
                    api_key=api_key,
                )
            except Exception as exc:  # noqa: BLE001
                logger.error("Server", f"Stream error: {exc}")
                queue.put_nowait(f"data: {_json_dumps({'error': str(exc)})}\n\n")
                return ""
            finally:
                queue.put_nowait(sentinel)

        task = asyncio.create_task(pump())

        while True:
            item = await queue.get()
            if item is sentinel:
                break
            yield item

        full_text = await task
        prompt_tokens = ModelRegistry.estimate_tokens(
            " ".join(
                m.get("parts", [{"text": m.get("content", "")}])[0]["text"] if m.get("parts") else m.get("content", "")
                for m in messages
            )
            + " " + str(system_instruction or "")
        )
        completion_tokens = ModelRegistry.estimate_tokens(full_text)
        cost = ModelRegistry.calculate_cost(target_model, prompt_tokens, completion_tokens)
        yield f"data: {_json_dumps({'done': True, 'fullText': full_text, 'model': target_model, 'usage': {'promptTokens': prompt_tokens, 'completionTokens': completion_tokens, 'totalTokens': prompt_tokens + completion_tokens}, 'cost': cost})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@app.post("/api/consilium")
async def api_consilium(payload: dict[str, Any]) -> JSONResponse:
    prompt = payload.get("prompt")
    if not isinstance(prompt, str) or not prompt:
        raise HTTPException(status_code=400, detail='Missing or invalid "prompt" parameter')

    mode = payload.get("mode") or "consilium"
    if mode not in CONSILIUM_MODES:
        raise HTTPException(
            status_code=400,
            detail=f'Invalid "mode" parameter. Expected one of: {", ".join(sorted(CONSILIUM_MODES))}',
        )

    persona = payload.get("persona")
    if persona is not None and persona not in PERSONA_IDS:
        raise HTTPException(status_code=400, detail='Invalid "persona". Expected: "eva", "adam", "dual"')

    engine = ConsiliumEngine(payload.get("apiKey") or settings.gemini_api_key or None)

    try:
        result = await engine.run(
            {
                "mode": mode,
                "persona": payload.get("persona"),
                "preset": payload.get("preset"),
                "prompt": prompt.strip(),
                "models": payload.get("models"),
                "participants": payload.get("participants"),
                "rounds": payload.get("rounds") if isinstance(payload.get("rounds"), int) else None,
                "synthesizerModel": payload.get("synthesizerModel"),
                "systemInstruction": payload.get("systemInstruction"),
                "apiKey": payload.get("apiKey"),
                "useKnowledgeBase": bool(payload.get("useKnowledgeBase", True)),
            }
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Server", f"Consilium error: {exc}")
        return JSONResponse({"error": str(exc) or "Consilium execution error"}, status_code=500)

    return JSONResponse({"success": True, "result": result})


# ---------------------------------------------------------------------------
# Static frontend hosting (dev convenience; frontend is a separate Vite app)
# ---------------------------------------------------------------------------
@app.get("/")
async def api_root() -> JSONResponse:
    return JSONResponse(
        {
            "service": "EvaBot Online Backend (Python/FastAPI)",
            "version": "v0.0.1 MVP",
            "api": "REST + SSE",
            "frontend": "Separate TypeScript + Vite application",
            "endpoints": [
                "/api/health",
                "/api/config",
                "/api/config/dev-mode",
                "/api/diagnostics/boot",
                "/api/models",
                "/api/roles",
                "/api/database/status",
                "/api/persona",
                "/api/text/boot-banner",
                "/api/chat",
                "/api/chat/stream",
                "/api/consilium",
                "/api/voice/status",
                "/api/voice/config",
                "/api/voice/toggle",
                "/api/voice/persona",
            ],
        }
    )


def _memory_mb() -> int:
    import resource

    return int(resource.getrusage(resource.RUSAGE_SELF).ru_maxrss / 1024)


_BOOT_TIME = time.time()


def _json_dumps(data: Any) -> str:
    import json

    return json.dumps(data, ensure_ascii=False)


def start() -> None:
    import uvicorn

    logger.info("Server", f"\u26a1 EvaBot FastAPI Server listening on http://{settings.server_host}:{settings.server_port}")
    uvicorn.run("app.main:app", host=settings.server_host, port=settings.server_port, log_level="info")


if __name__ == "__main__":
    start()