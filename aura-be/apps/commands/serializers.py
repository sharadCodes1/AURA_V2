from rest_framework import serializers

from .models import CommandLog


class CommandLogSerializer(serializers.ModelSerializer):
    # Optional: the AI service (service-token auth) supplies the owning user id when
    # logging on a user's behalf. Frontend (user JWT) requests ignore this and use request.user.
    user_id = serializers.IntegerField(write_only=True, required=False)

    class Meta:
        model = CommandLog
        fields = (
            "id",
            "user_id",
            "raw_transcript",
            "resolved_intent",
            "action_payload",
            "status",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
