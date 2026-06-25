"""Root URL configuration."""
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health(_request):
    return JsonResponse({"status": "ok", "service": "aura-be"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/auth/", include("apps.users.urls")),
    path("api/commands/", include("apps.commands.urls")),
    path("api/macros/", include("apps.macros.urls")),
]
