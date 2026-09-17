"""UniversalLlmClient + GeminiClient — Python port of the TypeScript originals.

Handles:
- Google Gemini (generativelanguage.googleapis.com) via `:generateContent` /
  `:streamGenerateContent` (SSE).
- OpenAI-compatible providers: OmniRoute, OpenRouter, OpenCode Go
  (stream/unary chat completions).
"""

from __future__ import annotations

import json
from typing import Any, Callable

import httpx

from .auth import GoogleAuthProvider
from .config import settings
from .logger import logger
from .model_registry import ModelRegistry

LlmProvider = str  # 'google' | 'omniroute' | 'openrouter' | 'opencode'

SIGNAL_TYPE = Any  # asyncio cancel handle; kept opaque

DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"


class ChatMessage:
    def __init__(self, role: str, parts: list[dict[str, str]]) -> None:
        self.role = role
        self.parts = parts

    def to_dict(self) -> dict[str, Any]:
        return {"role": self.role, "parts": self.parts}


# ---------------------------------------------------------------------------
# GeminiClient
# ---------------------------------------------------------------------------
class GeminiClient:
    def __init__(self, api_key_or_token: str | None = None) -> None:
        self._explicit_token: str | None = None
        self._token_type: str = "api_key"
        self.base_url: str = settings.gemini_base_url

        if api_key_or_token:
            self.set_api_key(api_key_or_token)

    def set_api_key(self, api_key: str) -> None:
        self._explicit_token = api_key.strip()
        self._token_type = "api_key"

    def set_bearer_token(self, token: str) -> None:
        self._explicit_token = token.strip()
        self._token_type = "bearer"

    def has_api_key(self) -> bool:
        return bool(self._explicit_token and len(self._explicit_token) > 5)

    async def _resolve_auth(self) -> dict[str, str]:
        if self._explicit_token and len(self._explicit_token) > 5:
            if self._token_type == "bearer":
                return {"Authorization": f"Bearer {self._explicit_token}"}
            return {"x-goog-api-key": self._explicit_token}

        creds = await GoogleAuthProvider.get_credentials()
        if creds:
            if creds.type == "bearer":
                return {"Authorization": f"Bearer {creds.token}"}
            return {"x-goog-api-key": creds.token}

        raise RuntimeError(
            "Google AI credentials not configured. Please supply an API key "
            "in the interface or configure Google Cloud credentials."
        )

    @staticmethod
    def _build_payload(
        contents: list[dict[str, Any]],
        system_instruction: str | None,
        temperature: float | None,
        max_output_tokens: int | None,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "contents": contents,
            "generationConfig": {
                "temperature": temperature if temperature is not None else 0.7,
                "maxOutputTokens": max_output_tokens if max_output_tokens is not None else 4096,
            },
        }
        if system_instruction:
            payload["system_instruction"] = {"parts": [{"text": system_instruction}]}
        return payload

    async def generate_content(
        self,
        model: str,
        contents: list[dict[str, Any]],
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        system_instruction: str | None = None,
        signal: SIGNAL_TYPE = None,
    ) -> str:
        auth_headers = await self._resolve_auth()
        url = f"{self.base_url}/models/{_urlquote(model)}:generateContent"
        if "x-goog-api-key" in auth_headers:
            url += f"?key={auth_headers['x-goog-api-key']}"

        payload = self._build_payload(contents, system_instruction, temperature, max_output_tokens)

        logger.debug("GeminiClient", f"Sending unary request to {model}")
        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                url,
                headers={"Content-Type": "application/json", **auth_headers},
                json=payload,
            )

        if response.status_code >= 400:
            err_text = response.text
            try:
                err_json = response.json()
                if err_json.get("error", {}).get("message"):
                    err_text = err_json["error"]["message"]
            except Exception:
                pass
            logger.error("GeminiClient", f"HTTP Error {response.status_code}: {err_text}")
            raise RuntimeError(f"Google AI API Error ({response.status_code}): {err_text}")

        data = response.json()
        candidate = (data.get("candidates") or [{}])[0]
        content_parts = candidate.get("content", {}).get("parts") or []
        if not content_parts:
            if candidate.get("finishReason"):
                return f"[Completed with reason: {candidate['finishReason']}]"
            return "[No response text received from model]"

        return "".join(p.get("text", "") for p in content_parts if p.get("text"))

    async def stream_content(
        self,
        model: str,
        contents: list[dict[str, Any]],
        on_chunk: Callable[[str], None],
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        system_instruction: str | None = None,
        signal: SIGNAL_TYPE = None,
    ) -> str:
        auth_headers = await self._resolve_auth()
        url = f"{self.base_url}/models/{_urlquote(model)}:streamGenerateContent?alt=sse"
        if "x-goog-api-key" in auth_headers:
            url += f"&key={auth_headers['x-goog-api-key']}"

        payload = self._build_payload(contents, system_instruction, temperature, max_output_tokens)

        logger.debug("GeminiClient", f"Starting stream request to {model}")
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                url,
                headers={"Content-Type": "application/json", **auth_headers},
                json=payload,
            ) as response:
                if response.status_code >= 400:
                    err_text = (await response.aread()).decode(errors="replace")
                    try:
                        err_json = json.loads(err_text)
                        if err_json.get("error", {}).get("message"):
                            err_text = err_json["error"]["message"]
                    except Exception:
                        pass
                    logger.error(
                        "GeminiClient", f"Stream HTTP Error {response.status_code}: {err_text}"
                    )
                    raise RuntimeError(f"Google AI API Error ({response.status_code}): {err_text}")

                full_text = ""
                async for line in response.aiter_lines():
                    line = line.strip()
                    if not line.startswith("data: "):
                        continue
                    json_str = line[6:].strip()
                    if json_str == "[DONE]":
                        continue
                    try:
                        parsed = json.loads(json_str)
                    except Exception:
                        continue
                    parts = (parsed.get("candidates") or [{}])[0].get("content", {}).get(
                        "parts"
                    ) or []
                    for part in parts:
                        text = part.get("text")
                        if text:
                            full_text += text
                            on_chunk(text)

                return full_text


def _urlquote(model: str) -> str:
    from urllib.parse import quote

    return quote(model, safe="")


# ---------------------------------------------------------------------------
# UniversalLlmClient
# ---------------------------------------------------------------------------
class UniversalMessage:
    def __init__(self, role: str, content: str) -> None:
        self.role = role
        self.content = content

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


class UniversalLlmClient:
    def __init__(self, api_key_or_token: str | None = None) -> None:
        self.gemini_client = GeminiClient(api_key_or_token or settings.gemini_api_key or None)

    def resolve_provider(self, model: str, explicit_provider: str | None = None) -> str:
        if explicit_provider:
            return explicit_provider

        m = model.lower()
        if m.startswith("omniroute/"):
            return "omniroute"
        if m.startswith("opencode/"):
            return "opencode"
        if m.startswith("openrouter/") or m.endswith(":free"):
            return "openrouter"

        model_info = ModelRegistry.get_model_by_id(model)
        if model_info:
            category = model_info.get("category", "")
            tier = model_info.get("tier", "")
            provider = model_info.get("provider", "")
            if (
                category.startswith("OpenRouter")
                or tier == "OpenRouter Paid"
                or tier == "100% Free Community"
                or provider == "OpenRouter"
            ):
                return "openrouter"
            if (
                category.startswith("OmniRoute")
                or tier == "OmniRoute Daemon"
                or provider == "OmniRoute"
            ):
                return "omniroute"
            if (
                category.startswith("OpenCode")
                or tier == "OpenCode Platform"
                or provider == "OpenCode AI"
            ):
                return "opencode"
            if provider == "Google DeepMind":
                return "google"

        if any(
            m.startswith(prefix)
            for prefix in (
                "anthropic/",
                "openai/",
                "deepseek/",
                "qwen/",
                "mistralai/",
                "microsoft/",
                "x-ai/",
                "cohere/",
                "meta-llama/",
            )
        ):
            return "openrouter"

        return "google"

    def normalize_to_universal(self, messages: list[Any]) -> list[UniversalMessage]:
        if not messages:
            return []
        first = messages[0]
        if isinstance(first, dict) and "parts" in first:
            return [
                UniversalMessage(
                    role="assistant" if m["role"] == "model" else "user",
                    content="\n".join(p.get("text", "") for p in m.get("parts", [])),
                )
                for m in messages
            ]
        return [UniversalMessage(m["role"], m["content"]) for m in messages]

    @staticmethod
    def to_gemini_format(
        messages: list[UniversalMessage], default_system: str | None = None
    ) -> tuple[list[dict[str, Any]], str | None]:
        system_instruction = default_system
        contents: list[dict[str, Any]] = []
        for msg in messages:
            if msg.role == "system":
                system_instruction = (
                    f"{system_instruction}\n{msg.content}" if system_instruction else msg.content
                )
            else:
                contents.append(
                    {
                        "role": "model" if msg.role == "assistant" else "user",
                        "parts": [{"text": msg.content}],
                    }
                )
        return contents, system_instruction

    @staticmethod
    def _clean_model_id(model: str, provider: str) -> str:
        if provider == "omniroute" and model.startswith("omniroute/"):
            return model.replace("omniroute/", "")
        if provider == "opencode" and model.startswith("opencode/"):
            return model.replace("opencode/", "")
        if provider == "openrouter" and model.startswith("openrouter/"):
            return model.replace("openrouter/", "")
        return model

    def _get_provider_endpoint_config(
        self, provider: str, options_api_key: str | None = None
    ) -> tuple[str, dict[str, str]]:
        if provider == "omniroute":
            url = f"{settings.omniroute_base_url}/chat/completions"
            api_key = options_api_key or settings.omniroute_api_key or "omniroute-token"
            return url, {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
            }
        if provider == "openrouter":
            url = f"{settings.openrouter_base_url}/chat/completions"
            api_key = options_api_key or settings.openrouter_api_key or ""
            return url, {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {api_key}",
                "HTTP-Referer": "https://evabot.online",
                "X-Title": "EvaBot Autonomous Agent",
            }
        url = f"{settings.opencode_base_url}/chat/completions"
        api_key = options_api_key or settings.opencode_api_key or "opencode-token"
        return url, {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "X-Client": "EvaBot-OpenCode-Go-Adapter",
        }

    def _build_openai_messages(
        self, messages: list[UniversalMessage], system_instruction: str | None = None
    ) -> list[dict[str, str]]:
        formatted: list[dict[str, str]] = []
        effective_system = system_instruction or settings.default_system_instruction
        if effective_system:
            formatted.append({"role": "system", "content": effective_system})
        for msg in messages:
            role = (
                "assistant"
                if msg.role == "assistant"
                else ("system" if msg.role == "system" else "user")
            )
            formatted.append({"role": role, "content": msg.content})
        return formatted

    async def generate_content(
        self,
        model: str,
        messages: list[Any],
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        system_instruction: str | None = None,
        provider: str | None = None,
        api_key: str | None = None,
        signal: SIGNAL_TYPE = None,
    ) -> str:
        resolved_provider = self.resolve_provider(model, provider)
        universal_msgs = self.normalize_to_universal(messages)
        logger.debug(
            "UniversalLlmClient",
            f"Generating unary response via provider: {resolved_provider} [model: {model}]",
        )

        if resolved_provider == "google":
            contents, sys_instr = self.to_gemini_format(
                universal_msgs, system_instruction or settings.default_system_instruction
            )
            if api_key:
                self.gemini_client.set_api_key(api_key)
            return await self.gemini_client.generate_content(
                model,
                contents,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                system_instruction=sys_instr,
                signal=signal,
            )

        return await self._generate_openai_compatible(
            resolved_provider,
            model,
            universal_msgs,
            temperature,
            max_output_tokens,
            system_instruction,
            api_key,
            signal,
        )

    async def stream_content(
        self,
        model: str,
        messages: list[Any],
        on_chunk: Callable[[str], None],
        temperature: float | None = None,
        max_output_tokens: int | None = None,
        system_instruction: str | None = None,
        provider: str | None = None,
        api_key: str | None = None,
        signal: SIGNAL_TYPE = None,
    ) -> str:
        resolved_provider = self.resolve_provider(model, provider)
        universal_msgs = self.normalize_to_universal(messages)
        logger.debug(
            "UniversalLlmClient",
            f"Streaming response via provider: {resolved_provider} [model: {model}]",
        )

        if resolved_provider == "google":
            contents, sys_instr = self.to_gemini_format(
                universal_msgs, system_instruction or settings.default_system_instruction
            )
            if api_key:
                self.gemini_client.set_api_key(api_key)
            return await self.gemini_client.stream_content(
                model,
                contents,
                on_chunk,
                temperature=temperature,
                max_output_tokens=max_output_tokens,
                system_instruction=sys_instr,
                signal=signal,
            )

        return await self._stream_openai_compatible(
            resolved_provider,
            model,
            universal_msgs,
            on_chunk,
            temperature,
            max_output_tokens,
            system_instruction,
            api_key,
            signal,
        )

    async def _generate_openai_compatible(
        self,
        provider: str,
        model: str,
        messages: list[UniversalMessage],
        temperature: float | None,
        max_output_tokens: int | None,
        system_instruction: str | None,
        api_key: str | None,
        signal: SIGNAL_TYPE = None,
    ) -> str:
        url, headers = self._get_provider_endpoint_config(provider, api_key)
        target_model = self._clean_model_id(model, provider)
        payload = {
            "model": target_model,
            "messages": self._build_openai_messages(messages, system_instruction),
            "temperature": temperature if temperature is not None else 0.7,
            "max_tokens": max_output_tokens if max_output_tokens is not None else 4096,
            "stream": False,
        }

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(url, headers=headers, json=payload)

        if response.status_code >= 400:
            err_text = self._extract_openai_error(response)
            logger.error(
                "UniversalLlmClient", f"{provider} API Error {response.status_code}: {err_text}"
            )
            raise RuntimeError(f"{provider.upper()} API Error ({response.status_code}): {err_text}")

        data = response.json()
        output = (data.get("choices") or [{}])[0].get("message", {}).get("content")
        if not isinstance(output, str):
            return "[No content returned by model]"
        return output

    async def _stream_openai_compatible(
        self,
        provider: str,
        model: str,
        messages: list[UniversalMessage],
        on_chunk: Callable[[str], None],
        temperature: float | None,
        max_output_tokens: int | None,
        system_instruction: str | None,
        api_key: str | None,
        signal: SIGNAL_TYPE = None,
    ) -> str:
        url, headers = self._get_provider_endpoint_config(provider, api_key)
        target_model = self._clean_model_id(model, provider)
        payload = {
            "model": target_model,
            "messages": self._build_openai_messages(messages, system_instruction),
            "temperature": temperature if temperature is not None else 0.7,
            "max_tokens": max_output_tokens if max_output_tokens is not None else 4096,
            "stream": True,
        }

        full_text = ""
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as response:
                if response.status_code >= 400:
                    err_text = (await response.aread()).decode(errors="replace")
                    try:
                        err_json = json.loads(err_text)
                        err_text = err_json.get("error", {}).get("message") or err_json.get(
                            "message", err_text
                        )
                    except Exception:
                        pass
                    logger.error(
                        "UniversalLlmClient",
                        f"{provider} Stream Error {response.status_code}: {err_text}",
                    )
                    raise RuntimeError(
                        f"{provider.upper()} Stream Error ({response.status_code}): {err_text}"
                    )

                async for line in response.aiter_lines():
                    line_text = line.strip()
                    if not line_text.startswith("data: "):
                        continue
                    data_str = line_text[6:].strip()
                    if data_str == "[DONE]":
                        continue
                    try:
                        parsed = json.loads(data_str)
                    except Exception:
                        continue
                    delta = (parsed.get("choices") or [{}])[0].get("delta", {}).get("content")
                    if delta:
                        full_text += delta
                        on_chunk(delta)

        return full_text

    @staticmethod
    def _extract_openai_error(response: httpx.Response) -> str:
        err_text = response.text
        try:
            err_json = response.json()
            err_text = err_json.get("error", {}).get("message", "") or err_json.get(
                "message", err_text
            )
        except Exception:
            pass
        return err_text
