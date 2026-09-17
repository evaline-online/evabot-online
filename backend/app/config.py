"""Configuration loader — parses a plain .env file without external dependencies.

Mirrors the original TypeScript `Config.ts` behaviour.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path


def _load_dotenv(env_path: Path | None = None) -> None:
    """Idempotent .env parser. Existing environment variables take precedence."""
    target = env_path or Path(os.getcwd()) / ".env"
    if not target.exists():
        # Fall back to <repo_root>/backend/.env and <repo_root>/.env
        candidates = [
            Path(__file__).resolve().parent.parent / ".env",
            Path(__file__).resolve().parent.parent.parent / ".env",
            Path(os.getcwd()) / "backend" / ".env",
            Path(os.getcwd()) / ".env",
            target,
        ]
        for cand in candidates:
            if cand.exists():
                target = cand
                break
        else:
            return

    try:
        content = target.read_text(encoding="utf-8")
    except OSError:
        return

    for raw_line in content.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {'"', "'"}:
            value = value[1:-1]
        if key and key not in os.environ:
            os.environ[key] = value


_load_dotenv()


def _env_str(key: str, default: str = "") -> str:
    return os.environ.get(key, default).strip()


def _env_int(key: str, default: int) -> int:
    try:
        return int(os.environ.get(key, str(default)).strip())
    except ValueError:
        return default


@dataclass(frozen=True)
class Settings:
    """Central runtime configuration (singleton via `settings`)."""

    gemini_api_key: str = field(default_factory=lambda: _env_str("GEMINI_API_KEY"))
    default_model: str = field(
        default_factory=lambda: _env_str("DEFAULT_MODEL", "gemini-2.5-flash")
    )
    server_port: int = field(default_factory=lambda: _env_int("PORT", 8000))
    server_host: str = field(default_factory=lambda: _env_str("HOST", "0.0.0.0"))

    gemini_base_url: str = field(
        default_factory=lambda: _env_str(
            "GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta"
        )
    )
    omniroute_base_url: str = field(
        default_factory=lambda: _env_str("OMNIROUTE_BASE_URL", "http://100.66.98.4:20128/v1")
    )
    omniroute_api_key: str = field(
        default_factory=lambda: _env_str("OMNIROUTE_API_KEY", "omniroute-default")
    )
    openrouter_base_url: str = field(
        default_factory=lambda: _env_str("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    )
    openrouter_api_key: str = field(default_factory=lambda: _env_str("OPENROUTER_API_KEY"))
    opencode_base_url: str = field(
        default_factory=lambda: _env_str("OPENCODE_BASE_URL", "http://100.66.98.4:20128/v1")
    )
    opencode_api_key: str = field(default_factory=lambda: _env_str("OPENCODE_API_KEY"))

    # Developer Mode — separate backend switch (independent of the frontend toggle).
    # Enables debug fields, verbose instrumentation and dev-only endpoints.
    dev_mode: bool = field(
        default_factory=lambda: _env_str("DEV_MODE", "0").lower() in ("1", "true", "yes", "on")
    )

    supported_currencies: tuple[str, ...] = ("USD", "EUR")

    default_system_instruction: str = field(
        default=(
            "You are EvaBot, an advanced autonomous AI agent. "
            "You provide clear, accurate, concise, and structured answers with code snippets and markdown formatting when relevant. "
            "You operate in English, Ukrainian, and Russian depending on the user's input language. "
            "All financial figures and pricing estimates must strictly be in USD ($) or EUR (€)."
        )
    )


settings = Settings()
