from rest_framework import generics

from apps.commands.views import IsAuthenticatedOrAIService

from .models import Macro
from .serializers import MacroSerializer


class _ScopedMacroQuerysetMixin:
    """
    Scopes macros to the current user (JWT) or to ?user_id= for service-token reads
    (the AI service's macro_lookup_node fetches a given user's macros).
    """

    def _is_user_request(self):
        return bool(self.request.user and self.request.user.is_authenticated)

    def get_queryset(self):
        if self._is_user_request():
            return Macro.objects.filter(user=self.request.user)
        user_id = self.request.query_params.get("user_id")
        qs = Macro.objects.all()
        return qs.filter(user_id=user_id) if user_id else qs.none()


class MacroListCreateView(_ScopedMacroQuerysetMixin, generics.ListCreateAPIView):
    """GET/POST /api/macros/ — list or create the user's macros."""

    serializer_class = MacroSerializer
    permission_classes = [IsAuthenticatedOrAIService]

    def perform_create(self, serializer):
        # Creation is a user-only action (frontend macro builder).
        serializer.save(user=self.request.user)


class MacroDetailView(_ScopedMacroQuerysetMixin, generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/macros/<id>/ — manage a single macro."""

    serializer_class = MacroSerializer
    permission_classes = [IsAuthenticatedOrAIService]
