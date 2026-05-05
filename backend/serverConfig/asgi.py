"""
ASGI config for serverConfig project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
from django.core.asgi import get_asgi_application
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
from django.conf import settings
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.sessions import SessionMiddlewareStack
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

from api.routing import websocket_urlpatterns

from api.middleware.jwt_auth_middleware import JWTAuthMiddlewareStack

# Wrap the HTTP handler with static files handler for development
# This serves static files (CSS, JS, images) when using ASGI servers like daphne
# Note: ASGIStaticFilesHandler only works in DEBUG mode
http_handler = ASGIStaticFilesHandler(django_asgi_app)

# Configure WebSocket handler
# We use JWTAuthMiddlewareStack to support token-based auth (for JWT transition)
# followed by AuthMiddlewareStack for session-based auth compatibility
websocket_handler = JWTAuthMiddlewareStack(
    AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    )
)

if not settings.DEBUG:
    websocket_handler = AllowedHostsOriginValidator(websocket_handler)

application = ProtocolTypeRouter({
    # Django's ASGI application to handle traditional HTTP requests (with static files)
    "http": http_handler,
    
    # WebSocket handler with JWT and session auth middleware
    "websocket": websocket_handler,
})
