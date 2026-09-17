"""ModelRegistry — Python port of `src/models/ModelRegistry.ts`.

Loads the 56-model catalog from `models_catalog.json` (extracted verbatim from
the original TypeScript source) and exposes the same helper API, including
token estimation and USD/EUR cost calculation.
"""

from __future__ import annotations

import json
import math
import re
from pathlib import Path
from typing import Any

_CATALOG_PATH = Path(__file__).resolve().parent / "models_catalog.json"


def _load_catalog() -> list[dict[str, Any]]:
    with _CATALOG_PATH.open(encoding="utf-8") as fh:
        return json.load(fh)


COMPLETE_GOOGLE_MODEL_CATALOG: list[dict[str, Any]] = _load_catalog()
GEMINI_MODELS = COMPLETE_GOOGLE_MODEL_CATALOG

_FREE_STATUS = "100% Free Quota Available"
_PAID_STATUS = "Paid / Pay-As-You-Go Only"


class ModelRegistry:
    @staticmethod
    def get_all_models() -> list[dict[str, Any]]:
        return [dict(m) for m in COMPLETE_GOOGLE_MODEL_CATALOG]

    @staticmethod
    def get_model_by_id(model_id: str) -> dict[str, Any] | None:
        for m in COMPLETE_GOOGLE_MODEL_CATALOG:
            if m["id"] == model_id:
                return dict(m)
        return None

    @staticmethod
    def is_valid_model(model_id: str) -> bool:
        return any(m["id"] == model_id for m in COMPLETE_GOOGLE_MODEL_CATALOG)

    @staticmethod
    def get_default_model() -> dict[str, Any]:
        for m in COMPLETE_GOOGLE_MODEL_CATALOG:
            if m.get("recommended"):
                return dict(m)
        return dict(COMPLETE_GOOGLE_MODEL_CATALOG[0])

    @staticmethod
    def get_categories() -> list[str]:
        seen: list[str] = []
        for m in COMPLETE_GOOGLE_MODEL_CATALOG:
            cat = m["category"]
            if cat not in seen:
                seen.append(cat)
        return seen

    @staticmethod
    def get_models_by_category(category: str) -> list[dict[str, Any]]:
        return [dict(m) for m in COMPLETE_GOOGLE_MODEL_CATALOG if m["category"] == category]

    @staticmethod
    def get_free_models() -> list[dict[str, Any]]:
        return [
            dict(m)
            for m in COMPLETE_GOOGLE_MODEL_CATALOG
            if m["pricing"]["freeTierStatus"] == _FREE_STATUS
        ]

    @staticmethod
    def get_paid_only_models() -> list[dict[str, Any]]:
        return [
            dict(m)
            for m in COMPLETE_GOOGLE_MODEL_CATALOG
            if m["pricing"]["freeTierStatus"] == _PAID_STATUS
        ]

    @staticmethod
    def get_google_models() -> list[dict[str, Any]]:
        return [
            dict(m) for m in COMPLETE_GOOGLE_MODEL_CATALOG if m["provider"] == "Google DeepMind"
        ]

    @staticmethod
    def get_openrouter_models() -> list[dict[str, Any]]:
        return [
            dict(m)
            for m in COMPLETE_GOOGLE_MODEL_CATALOG
            if m["category"].startswith("OpenRouter") or m["provider"] == "OpenRouter"
        ]

    @staticmethod
    def _resolve_ids(top_ids: list[str]) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for model_id in top_ids:
            model = ModelRegistry.get_model_by_id(model_id)
            if model:
                result.append(model)
        return result

    @staticmethod
    def get_top_coding_models() -> list[dict[str, Any]]:
        return ModelRegistry._resolve_ids(
            [
                "anthropic/claude-3.7-sonnet",
                "openai/o3-mini",
                "deepseek/deepseek-r1:free",
                "qwen/qwen-2.5-coder-32b-instruct:free",
                "anthropic/claude-3.5-sonnet",
                "gemini-2.5-pro",
                "openai/gpt-4o",
                "gemini-2.0-flash-thinking-exp",
                "mistralai/codestral-2501",
                "meta-llama/llama-3.3-70b-instruct:free",
            ]
        )

    @staticmethod
    def get_top10_paid_smartest_models() -> list[dict[str, Any]]:
        return ModelRegistry._resolve_ids(
            [
                "claude-3-7-sonnet",
                "gemini-2.5-pro",
                "claude-3-5-sonnet",
                "mistral-large-2411",
                "codestral-2501",
                "llama-3.1-405b-instruct",
                "llama-3.2-90b-vision-instruct",
                "command-r-plus",
                "jamba-1.5-large",
                "claude-3-5-haiku",
            ]
        )

    @staticmethod
    def get_top10_free_models() -> list[dict[str, Any]]:
        return ModelRegistry._resolve_ids(
            [
                "gemini-2.5-flash",
                "gemini-2.0-flash",
                "gemini-2.0-flash-lite",
                "deepseek/deepseek-r1:free",
                "meta-llama/llama-3.3-70b:free",
                "qwen/qwen-2.5-coder-32b-instruct:free",
                "google/gemini-2.0-flash-exp:free",
                "gemma-2-27b-it",
                "gemma-2-9b-it",
                "mistralai/mistral-7b-instruct:free",
            ]
        )

    @staticmethod
    def estimate_tokens(text: str) -> int:
        """~3.8 chars per token for code & multilingual."""
        if not text:
            return 0

        return max(1, math.ceil(len(text) / 3.8))

    @staticmethod
    def parse_rate(rate_str: str) -> dict[str, float]:
        """Extract free/paid rates from a pricing string like '$0.00 (Free) / $1.25 (Paid)'."""
        if not rate_str:
            return {"freeRate": 0.0, "paidRate": 0.0}

        paid_match = re.search(r"[\$€]\s*([0-9.]+)\s*\(Paid\)", rate_str, re.IGNORECASE)
        free_match = re.search(r"[\$€]\s*([0-9.]+)\s*\(Free\)", rate_str, re.IGNORECASE)

        if paid_match:
            paid_rate = float(paid_match.group(1)) or 0.0
            free_rate = float(free_match.group(1)) if free_match else 0.0
            return {"freeRate": free_rate, "paidRate": paid_rate}

        plain_match = re.search(r"([0-9.]+)", rate_str)
        rate = float(plain_match.group(1)) if plain_match else 0.0
        return {"freeRate": rate, "paidRate": rate}

    @staticmethod
    def calculate_cost(model_id: str, prompt_tokens: int, completion_tokens: int) -> dict[str, Any]:
        """Returns the exact TokenCostEstimate structure (mirror of TS)."""
        model = ModelRegistry.get_model_by_id(model_id)
        is_free = bool(model and model["pricing"]["freeTierStatus"] == _FREE_STATUS)

        pricing = (model or {}).get("pricing", {})
        in_usd = ModelRegistry.parse_rate(pricing.get("inputPer1MTokensUSD", "$0.00"))
        out_usd = ModelRegistry.parse_rate(pricing.get("outputPer1MTokensUSD", "$0.00"))
        in_eur = ModelRegistry.parse_rate(pricing.get("inputPer1MTokensEUR", "\u20ac0.00"))
        out_eur = ModelRegistry.parse_rate(pricing.get("outputPer1MTokensEUR", "\u20ac0.00"))

        commercial_value_usd = (
            prompt_tokens * in_usd["paidRate"] + completion_tokens * out_usd["paidRate"]
        ) / 1_000_000
        commercial_value_eur = (
            prompt_tokens * in_eur["paidRate"] + completion_tokens * out_eur["paidRate"]
        ) / 1_000_000

        cost_usd = 0.0 if is_free else commercial_value_usd
        cost_eur = 0.0 if is_free else commercial_value_eur

        def format_cost(val: float, is_free_flag: bool, symbol: str) -> str:
            if is_free_flag:
                return f"{symbol}0.00 (100% Free Quota)"
            if val == 0:
                return f"{symbol}0.00"
            if val < 0.0001:
                return f"{symbol}{val:.6f}"
            if val < 0.01:
                return f"{symbol}{val:.4f}"
            return f"{symbol}{val:.2f}"

        return {
            "modelId": (model or {}).get("id", model_id),
            "modelName": (model or {}).get("name", model_id),
            "promptTokens": prompt_tokens,
            "completionTokens": completion_tokens,
            "totalTokens": prompt_tokens + completion_tokens,
            "costUSD": cost_usd,
            "costEUR": cost_eur,
            "commercialValueUSD": commercial_value_usd,
            "commercialValueEUR": commercial_value_eur,
            "formattedUSD": format_cost(cost_usd, is_free, "$"),
            "formattedEUR": format_cost(cost_eur, is_free, "\u20ac"),
            "isFreeTier": is_free,
        }


def resolve_provider(model_id: str) -> str:
    """Map a model id to its LLM provider route (mirror of UniversalLlmClient.resolveProvider)."""
    if model_id.startswith("google/gemini") or model_id.startswith("google/"):
        return "openrouter"
    if model_id.startswith("openrouter/"):
        return "openrouter"
    if model_id.startswith("omniroute/"):
        return "omniroute"
    if model_id.startswith("opencode/"):
        return "opencode"
    model = ModelRegistry.get_model_by_id(model_id)
    if model:
        provider = model.get("provider", "")
        if provider in ("OpenRouter",):
            return "openrouter"
        if provider == "OmniRoute":
            return "omniroute"
        if provider == "OpenCode AI":
            return "opencode"
        if "vertex" in (model.get("protocol") or ""):
            return "google"
        if provider in ("Anthropic", "Meta", "Mistral AI", "AI21 Labs", "Cohere", "DeepSeek"):
            # Via Google Cloud Model Garden / Vertex partner models
            return "google-vertex"
    return "google"
