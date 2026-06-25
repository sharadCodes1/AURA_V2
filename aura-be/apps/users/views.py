from django.contrib.auth import get_user_model
from rest_framework import generics, permissions
from rest_framework_simplejwt.views import TokenObtainPairView

from apps.service_auth.permissions import IsAIService

from .serializers import (
    EmailTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
)

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — create a new account."""

    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — return {access, refresh, user}."""

    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]


class MeView(generics.RetrieveAPIView):
    """GET /api/auth/me/ — current user's profile."""

    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class VerifyServiceView(generics.GenericAPIView):
    """
    POST /api/auth/verify-service/ — the AI service validates a user JWT here.

    Authenticated by the shared service token (X-Service-Token), NOT a user JWT.
    The user JWT to validate is passed in the body as {"token": "<access>"}.
    Returns the resolved user profile on success.
    """

    permission_classes = [IsAIService]

    def post(self, request, *args, **kwargs):
        from rest_framework.response import Response
        from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
        from rest_framework_simplejwt.tokens import AccessToken

        raw = request.data.get("token")
        if not raw:
            return Response({"valid": False, "detail": "Missing 'token'."}, status=400)
        try:
            access = AccessToken(raw)
        except (TokenError, InvalidToken):
            return Response({"valid": False, "detail": "Invalid or expired token."}, status=401)

        try:
            user = User.objects.get(pk=access["user_id"])
        except User.DoesNotExist:
            return Response({"valid": False, "detail": "User not found."}, status=401)

        return Response({"valid": True, "user": UserSerializer(user).data})
