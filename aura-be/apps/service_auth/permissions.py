import hmac

from django.conf import settings
from rest_framework.permissions import BasePermission

SERVICE_TOKEN_HEADER = "X-Service-Token"


class IsAIService(BasePermission):
    """
    Grants access only to callers presenting a valid service token in the
    `X-Service-Token` header.

    Validity is checked against:
      1. settings.AI_SERVICE_TOKEN (the shared secret), and
      2. any active ServiceToken row in the database.

    Comparison is constant-time to avoid timing attacks.
    """

    message = "Invalid or missing service token."

    def has_permission(self, request, view):
        presented = request.headers.get(SERVICE_TOKEN_HEADER, "")
        if not presented:
            return False

        shared = getattr(settings, "AI_SERVICE_TOKEN", "")
        if shared and hmac.compare_digest(presented, shared):
            return True

        # Fall back to DB-issued tokens (lazy import to avoid app-registry issues).
        from .models import ServiceToken

        for token in ServiceToken.objects.filter(is_active=True).values_list("token", flat=True):
            if hmac.compare_digest(presented, token):
                return True
        return False
