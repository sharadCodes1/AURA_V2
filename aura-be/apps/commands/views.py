from django.contrib.auth import get_user_model
from rest_framework import generics
from rest_framework.exceptions import ValidationError

from apps.service_auth.permissions import IsAIService

from .models import CommandLog
from .serializers import CommandLogSerializer

User = get_user_model()


class IsAuthenticatedOrAIService(IsAIService):
    """
    Allow either an authenticated end user (JWT) or the AI service (service token).

    - Frontend reads its own history with a user JWT.
    - The AI service writes logs (on a user's behalf) with the shared service token.
    """

    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return True
        return super().has_permission(request, view)


class CommandLogListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/commands/ — list the caller's command history, or log a new command."""

    serializer_class = CommandLogSerializer
    permission_classes = [IsAuthenticatedOrAIService]

    def _is_user_request(self):
        return bool(self.request.user and self.request.user.is_authenticated)

    def get_queryset(self):
        if self._is_user_request():
            return CommandLog.objects.filter(user=self.request.user)
        # Service request: optionally scope to ?user_id= for inspection.
        qs = CommandLog.objects.all()
        user_id = self.request.query_params.get("user_id")
        return qs.filter(user_id=user_id) if user_id else qs

    def perform_create(self, serializer):
        if self._is_user_request():
            serializer.save(user=self.request.user)
            return
        # Service request must name the owning user.
        user_id = serializer.validated_data.pop("user_id", None)
        if not user_id:
            raise ValidationError({"user_id": "Required when logging via the service token."})
        user = User.objects.filter(pk=user_id).first()
        if not user:
            raise ValidationError({"user_id": "Unknown user."})
        serializer.save(user=user)
