"""
ASGI config for voteme project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
import remotepads.routing
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voteme.settings')

# application = get_asgi_application()
application = ProtocolTypeRouter({
    "http": get_asgi_application(),
     "websocket": AuthMiddlewareStack(
        URLRouter(
            remotepads.routing.websocket_urlpatterns
        )
    ),
})