from django.contrib import admin

from .models import CommandLog


@admin.register(CommandLog)
class CommandLogAdmin(admin.ModelAdmin):
    list_display = ("user", "resolved_intent", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("raw_transcript", "resolved_intent", "user__email")
