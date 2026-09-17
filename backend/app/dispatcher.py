"""Task dispatcher — single entry point for external agents (Telegram, OpenClaw,
Hermes, n8n, voice) to submit work to evabot.online.

Routes by intent:
- "chat"      -> UniversalLlmClient (direct dialog)
- "consilium" -> ConsiliumEngine (multi-agent deliberation)
- "code"      -> OpenHands REST API (autonomous coding agent)
- "status"    -> health summary of the whole agent stack
- "auto"      -> intent classification from the task text
"""

from __future__ import annotations

import asyncio
import os
from typing import Any

import httpx

from .config import settings
from .consilium import CONSILIUM_MODES, PERSONA_IDS, ConsiliumEngine
from .llm_client import UniversalLlmClient
from .logger import logger

DISCH_TASK_TYPES = ("auto", "chat", "consilium", "code", "status", "email", "n8n", "webhook", "telegram_direct")


def _openhands_url() -> str:
    return os.environ.get("OPENHANDS_URL", "http://127.0.0.1:3005").rstrip("/")


def classify_intent(task: str) -> str:
    """Heuristic intent classification for 'auto' tasks."""
    t = (task or "").lower()
    telegram_hints = (
        "напиши в телеграм", "отправь в тг", "сообщение в телеграм", "напиши в тг",
        "сообщение в тг", "telegram message", "send telegram", "напиши @"
    )
    email_hints = (
        "отправь письмо", "напиши email", "отправь email", "разошли",
        "send email", "email to", "send mail", "письмо клиенту"
    )
    code_hints = (
        "код", "code", "реализуй", "implement", "напиши функцию", "напиши скрипт",
        "напиши программу", "функция на", "python", "js", "typescript", "баг", "bug",
        "фикс", "fix", "рефактор", "refactor", "тест", "test", "pull request",
        "pr", "commit", "git", "модуль", "скрипт", "script", "deploy", "api endpoint",
    )
    consilium_hints = (
        "консилиум", "consilium", "реши", "decision", "стратеги", "архитектур",
        "проанализируй варианты", "взвесь", "trade-off", "риск", "совет", "advisory",
        "roadmap",
    )
    if any(h in t for h in telegram_hints):
        return "telegram_direct"
    if any(h in t for h in email_hints):
        return "email"
    if any(h in t for h in code_hints):
        return "code"
    if any(h in t for h in consilium_hints):
        return "consilium"
    return "chat"


async def _run_chat(task: str, opts: dict[str, Any]) -> dict[str, Any]:
    model = opts.get("model") or settings.default_model
    provider = opts.get("provider")
    api_key = opts.get("apiKey")
    persona = opts.get("persona") or "dual"

    client = UniversalLlmClient(api_key or settings.gemini_api_key or None)
    from .prompts import build_system_instruction

    system_instruction = opts.get("systemInstruction") or build_system_instruction(
        persona=persona,
        role=opts.get("role") or None,
        lang=str(opts.get("lang") or "en"),
    )
    history = opts.get("history") or []

    response_text = await client.generate_content(
        model,
        [*history, {"role": "user", "content": task.strip()}],
        system_instruction=system_instruction or settings.default_system_instruction,
        provider=provider,
        api_key=api_key,
    )
    return {
        "executor": "chat",
        "model": model,
        "provider": client.resolve_provider(model, provider),
        "response": response_text,
    }


async def _run_consilium(task: str, opts: dict[str, Any]) -> dict[str, Any]:
    mode = opts.get("mode") or "consilium"
    if mode not in CONSILIUM_MODES:
        raise ValueError(
            f'Invalid "mode": {mode}. Expected one of: {", ".join(sorted(CONSILIUM_MODES))}'
        )
    engine = ConsiliumEngine(opts.get("apiKey") or settings.gemini_api_key or None)
    result = await engine.run(
        {
            "mode": mode,
            "persona": opts.get("persona"),
            "preset": opts.get("preset"),
            "prompt": task.strip(),
            "models": opts.get("models"),
            "participants": opts.get("participants"),
            "rounds": opts.get("rounds") if isinstance(opts.get("rounds"), int) else None,
            "synthesizerModel": opts.get("synthesizerModel"),
            "systemInstruction": opts.get("systemInstruction"),
            "apiKey": opts.get("apiKey"),
            "useKnowledgeBase": bool(opts.get("useKnowledgeBase", True)),
        }
    )
    return {"executor": "consilium", "mode": mode, "result": result}


async def _openhands_create_session(client: httpx.AsyncClient, timeout: int) -> str | None:
    try:
        response = await client.post(
            f"{_openhands_url()}/api/conversations", json={"selected_agent": None}, timeout=timeout
        )
        if response.status_code >= 300:
            return None
    except Exception as exc:  # noqa: BLE001
        logger.error("Dispatcher", f"OpenHands create session failed: {exc}")
        return None
    try:
        data = response.json()
    except Exception:
        return None
    if isinstance(data, dict) and data.get("conversation_id"):
        return str(data["conversation_id"])
    return None


async def _openhands_send_prompt(
    client: httpx.AsyncClient, conversation_id: str, task: str, timeout: int
) -> dict[str, Any]:
    payload = {
        "action": "chat",
        "args": {"content": task},
        "message": task,
    }
    try:
        response = await client.post(
            f"{_openhands_url()}/api/conversations/{conversation_id}/messages",
            json=payload,
            timeout=timeout,
        )
    except Exception as exc:  # noqa: BLE001
        logger.error("Dispatcher", f"OpenHands send prompt failed: {exc}")
        return {"error": str(exc) or "OpenHands send failed"}
    if response.status_code >= 300:
        return {"error": f"OpenHands HTTP {response.status_code}: {response.text[:200]}"}
    try:
        return response.json()
    except Exception:
        return {"raw": response.text[:500]}


async def _run_code(task: str, opts: dict[str, Any]) -> dict[str, Any]:
    timeout = int(opts.get("timeout") or 120)
    wait_seconds = int(opts.get("waitSeconds") or 0)
    async with httpx.AsyncClient() as client:
        conversation_id = await _openhands_create_session(client, timeout)
        if not conversation_id:
            return {
                "executor": "code",
                "openhands": {"reachable": True, "ready": False, "reason": "session-not-created"},
                "error": "OpenHands is not ready (create-session failed). "
                "Check the container: docker logs openhands",
                "fallback": "Try type=chat or type=consilium instead.",
            }
        result = await _openhands_send_prompt(client, conversation_id, task, timeout)
        if wait_seconds > 0:
            await asyncio.sleep(wait_seconds)
    return {
        "executor": "code",
        "conversationId": conversation_id,
        "openhands": {"reachable": True, "ready": True},
        "result": result,
    }


async def _run_status() -> dict[str, Any]:
    checks: dict[str, str] = {}
    targets = {
        "evabot-brain": ("http://127.0.0.1:3000/api/health", 4),
        "openhands": ("http://127.0.0.1:3005/api/conversations", 4),
        "n8n": ("http://127.0.0.1:5678/healthz", 4),
        "evapresence": ("http://127.0.0.1:8095/health", 4),
        "omniroute": ("http://127.0.0.1:20128/v1/models", 4),
    }
    async with httpx.AsyncClient() as client:
        async def _probe(name: str, url: str, t: int) -> None:
            try:
                response = await client.get(url, timeout=t)
                checks[name] = "up" if response.status_code < 400 else f"http-{response.status_code}"
            except Exception:
                checks[name] = "down"

        await asyncio.gather(*(_probe(n, u, t) for n, (u, t) in targets.items()))

    return {"executor": "status", "stack": checks}


async def _run_email(task: str, opts: dict[str, Any]) -> dict[str, Any]:
    n8n_url = os.environ.get("N8N_WEBHOOK_URL", "http://127.0.0.1:5678/webhook/evabot-task")
    payload = {
        "action": "send_email",
        "to": opts.get("to") or opts.get("recipient"),
        "subject": opts.get("subject") or "Message from EvaLine AI Assistant",
        "body": opts.get("body") or task,
        "raw_task": task
    }
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(n8n_url, json=payload, timeout=15)
            return {
                "executor": "email",
                "status": "sent" if resp.status_code < 400 else f"http-{resp.status_code}",
                "n8n_response": resp.text[:200]
            }
        except Exception as exc:
            logger.error("Dispatcher", f"n8n webhook error: {exc}")
            return {"executor": "email", "status": "queued_local", "error": str(exc)}


async def _run_telegram_direct(task: str, opts: dict[str, Any]) -> dict[str, Any]:
    import re
    target = opts.get("target") or opts.get("username")
    message = opts.get("message") or task

    if not target:
        m = re.search(r'@[a-zA-Z0-9_]{4,}', task)
        if m:
            target = m.group(0)

    if not target:
        return {
            "executor": "telegram_direct",
            "status": "error",
            "error": "Recipient @username not found in task or parameters"
        }

    userbot_url = os.environ.get("USERBOT_URL", "http://127.0.0.1:5055/send")
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(userbot_url, json={"target": target, "message": message}, timeout=15)
            data = resp.json()
            if resp.status_code == 200 and data.get("ok"):
                return {
                    "executor": "telegram_direct",
                    "status": "sent",
                    "target": target,
                    "message_id": data.get("message_id")
                }
            return {
                "executor": "telegram_direct",
                "status": "failed",
                "target": target,
                "error": data.get("error", resp.text)
            }
        except Exception as exc:
            return {
                "executor": "telegram_direct",
                "status": "service_unavailable",
                "error": f"Userbot microservice error: {exc}"
            }


async def delegate_task(task: str, opts: dict[str, Any]) -> dict[str, Any]:
    """Dispatch a task to the right executor and return a normalized result."""
    task_type = str(opts.get("type") or opts.get("task_type") or "auto")
    if task_type not in DISCH_TASK_TYPES:
        raise ValueError(
            f'Invalid "type": {task_type}. Expected one of: {", ".join(DISCH_TASK_TYPES)}'
        )

    if task_type == "status":
        return await _run_status()
    if task_type == "code":
        return await _run_code(task, opts)
    if task_type in ("email", "n8n", "webhook"):
        return await _run_email(task, opts)
    if task_type == "telegram_direct":
        return await _run_telegram_direct(task, opts)
    if task_type == "chat":
        return await _run_chat(task, opts)
    if task_type == "consilium":
        return await _run_consilium(task, opts)

    intent = classify_intent(task)
    logger.info("Dispatcher", f"Auto-classified task as: {intent}")
    if intent == "telegram_direct":
        return await _run_telegram_direct(task, opts)
    if intent == "email":
        return await _run_email(task, opts)
    if intent == "code":
        return await _run_code(task, opts)
    if intent == "consilium":
        return await _run_consilium(task, opts)
    return await _run_chat(task, opts)