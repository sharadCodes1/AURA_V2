from django.conf import settings
from django.db import models


class CommandLog(models.Model):
    class Status(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"
        AMBIGUOUS = "ambiguous", "Ambiguous"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="commands",
    )
    raw_transcript = models.TextField()
    resolved_intent = models.CharField(max_length=100)
    action_payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=Status.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.resolved_intent} [{self.status}] @ {self.created_at:%Y-%m-%d %H:%M}"
