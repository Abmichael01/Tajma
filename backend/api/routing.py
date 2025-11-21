from django.urls import re_path
from api.consumers.notification_consumer import NotificationConsumer
from api.consumers.unified_chat_consumer import UnifiedChatConsumer

websocket_urlpatterns = [
    re_path(r'^ws/notifications/$', NotificationConsumer.as_asgi()),
    # Unified chat WebSocket - handles both chat messages and chat list updates
    # Single connection per user (like WhatsApp/Telegram)
    re_path(r'^ws/chat/$', UnifiedChatConsumer.as_asgi()),
]

