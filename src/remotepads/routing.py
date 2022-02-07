from django.urls import re_path, path

from . import consumers

websocket_urlpatterns = [
    path('ws/pads/', consumers.PadConsumer.as_asgi()),
]