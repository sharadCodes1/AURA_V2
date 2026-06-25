"""
Validates a user's access token (issued by aura-be).

Two strategies:
  1. LOCAL (default, fast): verify the HS256 signature with the shared SECRET_KEY
     (settings.jwt_secret_key, which must equal aura-be's Django SECRET_KEY).
  2. REMOTE fallback: if no secret is configured, call the backend's
     /api/auth/verify-service/ endpoint.

Returns the user_id on success, or None.
"""
import logging
from typing import Optional

import jwt

from app.config import settings
from app.services.backend_client import backend_client

logger = logging.getLogger("aura.auth")


def validate_token_local(token: str) -> Optional[int]:
    """Verify locally with the shared signing key. Returns user_id or None."""
    if not settings.jwt_secret_key:
        return None
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={"verify_aud": False},
        )
    except jwt.PyJWTError as exc:
        logger.info("Local JWT validation failed: %s", exc)
        return None

    if payload.get("token_type") != "access":
        return None
    user_id = payload.get("user_id")
    return int(user_id) if user_id is not None else None


async def validate_token(token: str) -> Optional[int]:
    """
    Resolve a user token to a user_id.
    Tries local verification first; if no local key is set, asks the backend.
    """
    if not token:
        return None

    user_id = validate_token_local(token)
    if user_id is not None:
        return user_id

    if not settings.jwt_secret_key:  # only hit the network if local is not configured
        user = await backend_client.verify_user_token(token)
        if user:
            return int(user["id"])
    return None
