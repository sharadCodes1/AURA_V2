"""Production settings."""
from .base import *  # noqa: F401,F403

DEBUG = False

# Security hardening — enable behind HTTPS.
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 60 * 60 * 24 * 30  # 30 days
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CORS_ALLOW_ALL_ORIGINS stays False here; CORS_ALLOWED_ORIGINS from env applies.
