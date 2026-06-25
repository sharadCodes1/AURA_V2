from django.conf import settings
from django.db import models


class Macro(models.Model):
    """A user-defined command chain triggered by a spoken phrase."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="macros",
    )
    trigger_phrase = models.CharField(max_length=255)
    actions = models.JSONField(default=list)  # ordered list of action-payload steps
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        # A user shouldn't have two macros with the same trigger phrase.
        constraints = [
            models.UniqueConstraint(
                fields=["user", "trigger_phrase"],
                name="unique_trigger_per_user",
            )
        ]

    def __str__(self):
        return f"{self.trigger_phrase} ({self.user})"
