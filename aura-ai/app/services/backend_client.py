"""
Async HTTP client for talking to the Django backend (aura-be) as a *service*.

Authenticates with the shared service token (X-Service-Token), not a user JWT.
Used to: validate user tokens, fetch a user's macros, and log commands.
"""
import logging
from typing import Any, Dict, List, Optional

import httpx

from app.config import settings

logger = logging.getLogger("aura.backend")


class BackendClient:
    def __init__(self, base_url: Optional[str] = None, service_token: Optional[str] = None):
        self.base_url = (base_url or settings.backend_url).rstrip("/")
        self.service_token = service_token or settings.ai_service_token

    def _headers(self) -> Dict[str, str]:
        return {"X-Service-Token": self.service_token, "Content-Type": "application/json"}

    async def verify_user_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Ask the backend to validate a user JWT. Returns the user dict or None."""
        url = f"{self.base_url}/api/auth/verify-service/"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, json={"token": token}, headers=self._headers())
            if resp.status_code == 200 and resp.json().get("valid"):
                return resp.json().get("user")
        except httpx.HTTPError as exc:
            logger.warning("verify_user_token failed: %s", exc)
        return None

    async def get_user_macros(self, user_id: int) -> List[Dict[str, Any]]:
        """Fetch a user's saved macros (for macro_lookup_node)."""
        url = f"{self.base_url}/api/macros/"
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params={"user_id": user_id}, headers=self._headers())
            if resp.status_code == 200:
                return resp.json()
        except httpx.HTTPError as exc:
            logger.warning("get_user_macros failed: %s", exc)
        return []

    async def log_command(
        self,
        user_id: int,
        raw_transcript: str,
        resolved_intent: str,
        action_payload: Dict[str, Any],
        status: str,
    ) -> bool:
        """Persist a command to the user's history. Returns True on success."""
        url = f"{self.base_url}/api/commands/"
        body = {
            "user_id": user_id,
            "raw_transcript": raw_transcript,
            "resolved_intent": resolved_intent,
            "action_payload": action_payload,
            "status": status,
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, json=body, headers=self._headers())
            if resp.status_code in (200, 201):
                return True
            logger.warning("log_command non-2xx: %s %s", resp.status_code, resp.text)
        except httpx.HTTPError as exc:
            logger.warning("log_command failed: %s", exc)
        return False


backend_client = BackendClient()
