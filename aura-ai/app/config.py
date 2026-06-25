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

    # Optional LLM intent fallback
    llm_api_key: str = ""

    # Server
    host: str = "0.0.0.0"
    port: int = 8001


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
