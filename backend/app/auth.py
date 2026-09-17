"""Google Cloud / Google AI ambient authentication — mirrors `GoogleAuthProvider.ts`.

Precedence:
1. GEMINI_API_KEY environment variable / .env
2. Google ADC refresh-token exchange (evabot.online@gmail.com)
3. Google Compute Engine VM Metadata Server
4. Local gcloud CLI access token
"""

from __future__ import annotations

import json
import os
import subprocess
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

try:
    import httpx
except ImportError:  # pragma: no cover
    httpx = None  # type: ignore[assignment]

from .logger import logger


@dataclass
class AuthCredentials:
    token: str
    type: str  # 'bearer' | 'api_key'
    source: str
    account: str


GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GCE_METADATA_URL = (
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token"
)


class GoogleAuthProvider:
    _cached: Optional[AuthCredentials] = None
    _expires_at: float = 0.0

    @classmethod
    async def get_credentials(cls) -> Optional[AuthCredentials]:
        now = time.time()
        if cls._cached and now < cls._expires_at:
            return cls._cached

        # 1. Environment variable
        env_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if env_key:
            cls._cached = AuthCredentials(
                token=env_key,
                type="api_key",
                source="Environment (GEMINI_API_KEY)",
                account="evabot.online@gmail.com",
            )
            cls._expires_at = now + 24 * 3600
            return cls._cached

        # 2. ADC refresh-token exchange
        adc_token = await cls._exchange_adc_refresh_token()
        if adc_token:
            cls._cached = AuthCredentials(
                token=adc_token,
                type="bearer",
                source="Google ADC (evabot.online@gmail.com)",
                account="evabot.online@gmail.com",
            )
            cls._expires_at = now + 50 * 60
            logger.info(
                "GoogleAuthProvider", "Authenticated automatically via Google ADC refresh token"
            )
            return cls._cached

        # 3. GCE metadata server
        gce_token = await cls._fetch_gce_metadata_token()
        if gce_token:
            cls._cached = AuthCredentials(
                token=gce_token,
                type="bearer",
                source="Google Compute Engine Service Account",
                account="evabot.online@gmail.com",
            )
            cls._expires_at = now + 50 * 60
            logger.info(
                "GoogleAuthProvider", "Authenticated automatically via GCE Metadata Service"
            )
            return cls._cached

        # 4. gcloud CLI
        gcloud_token = cls._fetch_gcloud_cli_token()
        if gcloud_token:
            cls._cached = AuthCredentials(
                token=gcloud_token,
                type="bearer",
                source="Google Cloud SDK (gcloud)",
                account="evabot.online@gmail.com",
            )
            cls._expires_at = now + 30 * 60
            logger.info("GoogleAuthProvider", "Authenticated automatically via gcloud CLI")
            return cls._cached

        return None

    @staticmethod
    async def _fetch_gce_metadata_token() -> Optional[str]:
        if httpx is None:
            return None
        try:
            async with httpx.AsyncClient(timeout=1.0) as client:
                resp = await client.get(GCE_METADATA_URL, headers={"Metadata-Flavor": "Google"})
            if resp.status_code == 200:
                data = resp.json()
                return data.get("access_token")
        except Exception:
            return None
        return None

    @classmethod
    async def _exchange_adc_refresh_token(cls) -> Optional[str]:
        if httpx is None:
            return None
        candidates = [
            Path.home() / ".config/gcloud/legacy_credentials/evabot.online@gmail.com/adc.json",
            Path.home() / ".config/gcloud/application_default_credentials.json",
            Path("/home/fedor/.config/gcloud/legacy_credentials/evabot.online@gmail.com/adc.json"),
        ]
        client_id = client_secret = refresh_token = None
        for p in candidates:
            if not p.exists():
                continue
            try:
                raw = json.loads(p.read_text(encoding="utf-8"))
                if raw.get("refresh_token") and raw.get("client_id") and raw.get("client_secret"):
                    client_id = raw["client_id"]
                    client_secret = raw["client_secret"]
                    refresh_token = raw["refresh_token"]
                    break
            except Exception:
                continue

        if not (client_id and client_secret and refresh_token):
            return None

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.post(
                    GOOGLE_TOKEN_URL,
                    data={
                        "client_id": client_id,
                        "client_secret": client_secret,
                        "refresh_token": refresh_token,
                        "grant_type": "refresh_token",
                    },
                )
            if resp.status_code == 200:
                return resp.json().get("access_token")
        except Exception:
            return None
        return None

    @staticmethod
    def _fetch_gcloud_cli_token() -> Optional[str]:
        try:
            out = subprocess.run(
                ["gcloud", "auth", "print-access-token"],
                capture_output=True,
                text=True,
                timeout=3,
                check=False,
            )
            token = out.stdout.strip()
            if token.startswith("ya29."):
                return token
        except Exception:
            return None
        return None
