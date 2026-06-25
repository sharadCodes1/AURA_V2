from rest_framework import serializers

from .models import Macro


class MacroSerializer(serializers.ModelSerializer):
    class Meta:
        model = Macro
        fields = ("id", "trigger_phrase", "actions", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_actions(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("actions must be a list of action steps.")
        return value
