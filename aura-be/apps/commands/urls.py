from django.urls import path

from .views import CommandLogListCreateView

urlpatterns = [
    path("", CommandLogListCreateView.as_view(), name="command-list-create"),
]
