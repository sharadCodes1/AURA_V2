import secrets

from django.db import models


def _generate_token():
    return secrets.token_urlsafe(48)


class ServiceToken(models.Model):
    """
    A named token for service-to-service auth (e.g. the AI service calling this backend).

    The simplest path is the single shared secret in settings.AI_SERVICE_TOKEN, which
    IsAIService checks first. This model exists so you can additionally issue/rotate
    per-service tokens from the admin without a redeploy.
    """

    name = models.CharField(max_length=100, unique=True)
    token = models.CharField(max_length=128, unique=True, default=_generate_token)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        state = "active" if self.is_active else "disabled"
        return f"{self.name} ({state})"
