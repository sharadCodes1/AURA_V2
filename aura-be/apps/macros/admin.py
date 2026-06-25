from django.contrib import admin

from .models import Macro


@admin.register(Macro)
class MacroAdmin(admin.ModelAdmin):
    list_display = ("trigger_phrase", "user", "created_at")
    search_fields = ("trigger_phrase", "user__email")
