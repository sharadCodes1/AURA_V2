"""Application configuration, loaded from environment / .env."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Backend (aura-be)
    backend_url: str = "http://localhost:8000"
    ai_service_token: str = "shared-secret-change-me"

    # JWT validation. If jwt_secret_key is set, user tokens are verified locally
    # (HS256, sharing aura-be's Django SECRET_KEY). If empty, fall back to the
    # backend's /api/auth/verify-service/ endpoint.
    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"

    # STT
    whisper_model_size: str = "base"

    # Wake word for hands-free conversation mode.
    wake_word: str = "hi aura"

    # Conversational LLM (Google Gemini). If gemini_api_key is set, the agent uses
    # Gemini for intent + chat + grounded answers; otherwise it falls back to the
    # offline rule-based matcher.
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    gemini_grounding: bool = True  # enable Google Search grounding for live data

    # What the assistant calls the user.
    user_name: str = "Sharad"

    # Optional LLM intent fallback (legacy / unused)
    llm_api_key: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8001


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
