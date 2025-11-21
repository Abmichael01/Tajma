import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


class NotificationConsumer(AsyncWebsocketConsumer):
    """WebSocket consumer for real-time notifications"""
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope.get('user')
        
        # Log connection attempt
        logger.info(f"WebSocket connection attempt - User: {self.user}, Anonymous: {self.user.is_anonymous if self.user else 'No user'}")
        
        # Only allow authenticated users
        if not self.user or self.user.is_anonymous:
            logger.warning("WebSocket connection rejected: User is anonymous")
            await self.close(code=4001)  # 4001 = Unauthorized
            return
        
        # Create a unique group name for this user
        self.user_group_name = f'notifications_{self.user.id}'
        
        # Add user to their notification group
        await self.channel_layer.group_add(
            self.user_group_name,
            self.channel_name
        )
        
        await self.accept()
        logger.info(f"WebSocket connected for user {self.user.id}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Remove user from their notification group
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(
                self.user_group_name,
                self.channel_name
            )
    
    async def receive(self, text_data):
        """Handle messages received from WebSocket"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Respond to ping with pong
                await self.send(text_data=json.dumps({
                    'type': 'pong'
                }))
        except json.JSONDecodeError:
            pass
    
    async def notification_message(self, event):
        """Send notification to WebSocket"""
        logger.info(f"📨 Consumer received notification_message event")
        logger.info(f"👤 User: {self.user.id if self.user else 'unknown'}")
        logger.info(f"📦 Event keys: {list(event.keys())}")
        logger.info(f"📦 Event type: {event.get('type', 'N/A')}")
        
        # Convert notification data to JSON-serializable format
        notification_data = event.get('notification', {})
        logger.info(f"📦 Notification data received: {notification_data.get('title', 'N/A')}")
        logger.debug(f"📋 Full notification data: {notification_data}")
        
        # Convert UUIDs and other non-serializable types to strings
        if isinstance(notification_data, dict):
            serializable_data = {}
            for key, value in notification_data.items():
                if hasattr(value, '__str__'):
                    # Convert UUIDs, dates, etc. to strings
                    if hasattr(value, 'isoformat'):  # datetime objects
                        serializable_data[key] = value.isoformat()
                    else:
                        serializable_data[key] = str(value)
                elif isinstance(value, (dict, list)):
                    # Recursively handle nested structures
                    serializable_data[key] = self._make_serializable(value)
                else:
                    serializable_data[key] = value
        else:
            serializable_data = notification_data
        
        # Send message to WebSocket
        try:
            message = json.dumps({
                'type': 'notification',
                'notification': serializable_data
            })
            await self.send(text_data=message)
            logger.info(f"✅ Notification sent via WebSocket to user {self.user.id}: {serializable_data.get('title', 'N/A')}")
        except Exception as e:
            logger.error(f"❌ Failed to send notification via WebSocket: {e}", exc_info=True)
    
    def _make_serializable(self, obj):
        """Recursively convert non-serializable objects to strings"""
        if isinstance(obj, dict):
            return {k: self._make_serializable(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._make_serializable(item) for item in obj]
        elif hasattr(obj, 'isoformat'):  # datetime
            return obj.isoformat()
        elif hasattr(obj, '__str__') and not isinstance(obj, (str, int, float, bool, type(None))):
            return str(obj)
        return obj
    
    async def notification_count(self, event):
        """Send notification count update to WebSocket"""
        count = event['count']
        logger.info(f"📊 Sending notification count update to user {self.user.id if self.user else 'unknown'}: {count}")
        try:
            await self.send(text_data=json.dumps({
                'type': 'notification_count',
                'count': count
            }))
            logger.info(f"✅ Notification count sent: {count}")
        except Exception as e:
            logger.error(f"❌ Failed to send notification count via WebSocket: {e}", exc_info=True)

