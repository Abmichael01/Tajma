import json
import logging
import uuid
import asyncio
from types import SimpleNamespace

from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

from api.models import Chat, Message, UserOnlineStatus
from api.utils.link_preview import extract_url, get_link_preview

logger = logging.getLogger(__name__)
User = get_user_model()


class UnifiedChatConsumer(AsyncWebsocketConsumer):
    """
    Unified WebSocket consumer for all chat functionality.
    Handles both individual chat messages and chat list updates over a single connection.
    Similar to WhatsApp/Telegram architecture.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = None
        self.user_group_name = None  # For chat events: chat_events_{user_id}
        self.user_messages_group_name = None  # For messages: user_{user_id}
        self.subscribed_chats = set()  # Track which chats this connection is subscribed to
        self.ping_task = None  # Server-side ping task
        self.last_pong_time = None  # Track last pong received
    
    async def connect(self):
        """Handle WebSocket connection"""
        self.user = self.scope.get('user')
        logger.info(f"Unified Chat WebSocket connection attempt - User: {self.user}, Anonymous: {self.user.is_anonymous if self.user else 'No user'}")
        
        if not self.user or self.user.is_anonymous:
            logger.warning("Unified Chat WebSocket connection rejected: User is anonymous")
            # Accept first to ensure close code is transmitted properly
            await self.accept()
            await self.close(code=4001, reason="User is anonymous")
            return
        
        # Always join user-level group for chat list updates
        self.user_group_name = f'chat_events_{self.user.id}'
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        
        # Always join user-level group for receiving ALL messages (WhatsApp/Telegram pattern)
        # This ensures user receives messages for all chats, not just subscribed ones
        self.user_messages_group_name = f'user_{self.user.id}'
        await self.channel_layer.group_add(self.user_messages_group_name, self.channel_name)
        logger.info(f"User {self.user.id} joined user-level message group: {self.user_messages_group_name}")
        
        # Set user as online
        await self.set_user_online(self.user.id)
        
        await self.accept()
        logger.info(f"Unified Chat WebSocket connected: User {self.user.id}")
        
        # Send connection confirmation
        await self.send(text_data=json.dumps({
            'type': 'connection',
            'message': 'Connected to unified chat',
            'user_id': str(self.user.id)
        }))
        
        # Start server-side ping task (like WhatsApp/Telegram)
        # Server sends ping every 30 seconds to check if client is alive
        # Initialize last_pong_time to None - will be set when first ping is sent
        self.last_pong_time = None
        self.ping_task = asyncio.create_task(self.server_ping_loop())
    
    async def server_ping_loop(self):
        """
        Server-side ping loop to keep connection alive (like WhatsApp).
        Purpose: Keep connection active, NOT to detect dead connections.
        WhatsApp keeps connections alive indefinitely - they don't close on ping failures.
        If connection actually dies (network error, etc.), client will automatically reconnect.
        """
        try:
            # Wait a bit before starting to allow connection to stabilize
            await asyncio.sleep(5)
            
            logger.info(f"Started server ping loop for user {self.user.id} - keeping connection alive")
            
            while True:
                # Send ping to client to keep connection alive
                # This prevents timeouts from proxies, firewalls, and idle connections
                try:
                    await self.send(text_data=json.dumps({'type': 'ping'}))
                    logger.debug(f"📤 Sent keep-alive ping to user {self.user.id}")
                except Exception as e:
                    # If we can't send ping, connection might be dead - let it close naturally
                    logger.warning(f"Error sending ping to user {self.user.id}: {e} - connection may be dead")
                    break
                
                # Wait 30 seconds before next ping
                await asyncio.sleep(30)
                    
        except asyncio.CancelledError:
            logger.debug(f"Server ping loop cancelled for user {self.user.id}")
        except Exception as e:
            logger.error(f"Error in server ping loop for user {self.user.id}: {e}")
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Cancel server ping task
        if self.ping_task:
            self.ping_task.cancel()
            try:
                await self.ping_task
            except asyncio.CancelledError:
                pass
        
        # Leave all subscribed chat groups
        for chat_id in list(self.subscribed_chats):
            await self.unsubscribe_from_chat(chat_id)
        
        # Leave user-level groups
        if self.user_group_name:
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        if self.user_messages_group_name:
            await self.channel_layer.group_discard(self.user_messages_group_name, self.channel_name)
        
        # Set user as offline
        if self.user and not self.user.is_anonymous:
            await self.set_user_offline(self.user.id)
        
        logger.info(f"Unified Chat WebSocket disconnected: User {self.user.id if self.user else 'unknown'}, code: {close_code}")
    
    async def receive(self, text_data):
        """Handle incoming WebSocket messages"""
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'ping':
                # Client ping - respond with pong and update last pong time
                self.last_pong_time = timezone.now()
                logger.debug(f"Received client ping from user {self.user.id}, responding with pong")
                await self.send(text_data=json.dumps({'type': 'pong'}))
            elif message_type == 'pong':
                # Client pong response to server ping - update last pong time
                self.last_pong_time = timezone.now()
                logger.info(f"✅ Received pong from user {self.user.id} - connection alive")
            elif message_type == 'subscribe':
                # Subscribe to a specific chat
                await self.handle_subscribe(data)
            elif message_type == 'unsubscribe':
                # Unsubscribe from a specific chat
                await self.handle_unsubscribe(data)
            elif message_type == 'message':
                # Handle new message (requires subscription to chat)
                await self.handle_new_message(data)
            elif message_type == 'typing':
                # Handle typing indicator (requires subscription to chat)
                await self.handle_typing(data)
            elif message_type == 'mark_read':
                # Handle mark as read (requires subscription to chat)
                await self.handle_mark_read(data)
            elif message_type == 'mark_all_delivered':
                # Handle mark all messages as delivered when user comes online
                await self.handle_mark_all_delivered()
            else:
                logger.warning(f"Unknown message type: {message_type}")
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': f'Unknown message type: {message_type}'
                }))
        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
        except Exception as e:
            logger.error(f"Error processing message: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Internal server error'
            }))
    
    async def handle_subscribe(self, data):
        """Subscribe to a specific chat"""
        chat_id = data.get('chat_id')
        if not chat_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'chat_id is required for subscription'
            }))
            return
        
        # Validate UUID format
        try:
            chat_id = str(uuid.UUID(str(chat_id)))
        except (ValueError, TypeError):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid chat_id format'
            }))
            return
        
        # Verify user is a participant
        is_participant = await self.verify_chat_participant(chat_id, self.user)
        if not is_participant:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are not a participant in this chat'
            }))
            return
        
        # Subscribe to chat group
        await self.subscribe_to_chat(chat_id)
        
        await self.send(text_data=json.dumps({
            'type': 'subscribed',
            'chat_id': chat_id
        }))
    
    async def handle_unsubscribe(self, data):
        """Unsubscribe from a specific chat"""
        chat_id = data.get('chat_id')
        if not chat_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'chat_id is required for unsubscription'
            }))
            return
        
        try:
            chat_id = str(uuid.UUID(str(chat_id)))
        except (ValueError, TypeError):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid chat_id format'
            }))
            return
        
        await self.unsubscribe_from_chat(chat_id)
        
        await self.send(text_data=json.dumps({
            'type': 'unsubscribed',
            'chat_id': chat_id
        }))
    
    async def subscribe_to_chat(self, chat_id):
        """Subscribe to a chat group"""
        if chat_id in self.subscribed_chats:
            return  # Already subscribed
        
        chat_group_name = f'chat_{chat_id}'
        await self.channel_layer.group_add(chat_group_name, self.channel_name)
        self.subscribed_chats.add(chat_id)
        logger.info(f"User {self.user.id} subscribed to chat {chat_id}")
    
    async def unsubscribe_from_chat(self, chat_id):
        """Unsubscribe from a chat group"""
        if chat_id not in self.subscribed_chats:
            return  # Not subscribed
        
        chat_group_name = f'chat_{chat_id}'
        await self.channel_layer.group_discard(chat_group_name, self.channel_name)
        self.subscribed_chats.discard(chat_id)
        logger.info(f"User {self.user.id} unsubscribed from chat {chat_id}")
    
    async def handle_new_message(self, data):
        """Handle new message creation"""
        chat_id = data.get('chat_id')
        if not chat_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'chat_id is required'
            }))
            return
        
        # Validate chat_id
        try:
            chat_id = str(uuid.UUID(str(chat_id)))
        except (ValueError, TypeError):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid chat_id format'
            }))
            return
        
        # Check if subscribed to this chat
        if chat_id not in self.subscribed_chats:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You must subscribe to this chat first'
            }))
            return
        
        content = data.get('content', '').strip()
        if not content:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Message content cannot be empty'
            }))
            return
        
        # Verify user is a participant
        is_participant = await self.verify_chat_participant(chat_id, self.user)
        if not is_participant:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are not a participant in this chat'
            }))
            return
        
        parent_message_id = data.get('parent_message_id')
        client_id = data.get('client_id')
        
        # Create message in database
        message = await self.create_message(chat_id, self.user, content, parent_message_id, client_id)
        if not message:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to create message'
            }))
            return
        
        # Serialize message
        message_data = await self.serialize_message(message)
        
        # Check if message was delivered immediately (recipient was online)
        was_delivered_immediately = bool(message_data.get('delivered_at'))
        
        # Send to chat group (all subscribers will receive - for active chats)
        chat_group_name = f'chat_{chat_id}'
        await self.channel_layer.group_send(
            chat_group_name,
            {
                'type': 'chat_message',
                'message': message_data,
                'chat_id': chat_id
            }
        )
        
        # ALSO send to user-level groups (WhatsApp/Telegram pattern)
        # This ensures ALL participants receive the message, regardless of subscription
        participant_ids = await self.get_chat_participant_ids(chat_id)
        for user_id in participant_ids:
            user_messages_group = f'user_{user_id}'
            await self.channel_layer.group_send(
                user_messages_group,
                {
                    'type': 'user_message',
                    'message': message_data,
                    'chat_id': chat_id
                }
            )
            logger.debug(f"📤 Sent message {message.id} to user-level group: {user_messages_group}")
        
        # If message was delivered immediately, broadcast delivery status update to sender
        if was_delivered_immediately:
            # Broadcast to both chat group and user groups
            await self.channel_layer.group_send(
                chat_group_name,
                {
                    'type': 'message_status_update',
                    'message': message_data,
                    'chat_id': chat_id
                }
            )
            # Also broadcast to user groups so sender sees delivery status
            for user_id in participant_ids:
                user_messages_group = f'user_{user_id}'
                await self.channel_layer.group_send(
                    user_messages_group,
                    {
                        'type': 'message_status_update',
                        'message': message_data,
                        'chat_id': chat_id
                    }
                )
            logger.info(f"✅ Broadcasted instant delivery status for message {message.id}")
        
        # Broadcast chat event to each participant so chat list can update
        await self.broadcast_chat_event(message_data, chat_id)
    
    async def handle_typing(self, data):
        """Handle typing indicator"""
        chat_id = data.get('chat_id')
        if not chat_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'chat_id is required'
            }))
            return
        
        # Validate chat_id
        try:
            chat_id = str(uuid.UUID(str(chat_id)))
        except (ValueError, TypeError):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid chat_id format'
            }))
            return
        
        # Check if subscribed
        if chat_id not in self.subscribed_chats:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You must subscribe to this chat first'
            }))
            return
        
        is_typing = data.get('typing', False)
        
        # Send typing indicator to chat group
        chat_group_name = f'chat_{chat_id}'
        await self.channel_layer.group_send(
            chat_group_name,
            {
                'type': 'typing_indicator',
                'user_id': self.user.id,
                'user_name': self.user.get_full_name() or self.user.email.split('@')[0],
                'typing': is_typing,
                'chat_id': chat_id
            }
        )

        # Also send typing to participant-level groups so chat lists can show
        # typing even when the conversation is not currently open.
        participant_ids = await self.get_chat_participant_ids(chat_id)
        for user_id in participant_ids:
            await self.channel_layer.group_send(
                f'user_{user_id}',
                {
                    'type': 'typing_indicator',
                    'user_id': self.user.id,
                    'user_name': self.user.get_full_name() or self.user.email.split('@')[0],
                    'typing': is_typing,
                    'chat_id': chat_id
                }
            )
    
    async def handle_mark_read(self, data):
        """Handle mark as read request (like WhatsApp/Telegram - via WebSocket)"""
        chat_id = data.get('chat_id')
        if not chat_id:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'chat_id is required'
            }))
            return
        
        # Validate chat_id
        try:
            chat_id = str(uuid.UUID(str(chat_id)))
        except (ValueError, TypeError):
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid chat_id format'
            }))
            return
        
        # Check if subscribed
        if chat_id not in self.subscribed_chats:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You must subscribe to this chat first'
            }))
            return
        
        # Verify user is a participant
        is_participant = await self.verify_chat_participant(chat_id, self.user)
        if not is_participant:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'You are not a participant in this chat'
            }))
            return
        
        # Mark messages as read
        result = await self.mark_messages_as_read(chat_id, self.user)
        
        if result['updated'] > 0:
            # 1. Broadcast read status updates via WebSocket (updates ticks in active chats)
            await self.broadcast_read_status_updates(chat_id, result['message_ids'])
            
            # 2. Broadcast chat event to participants (refreshes unread counts in chat list)
            # This ensures unread count goes to 0 instantly on all devices
            await self.broadcast_chat_event({}, chat_id)
            
            await self.send(text_data=json.dumps({
                'type': 'marked_read',
                'chat_id': chat_id,
                'count': result['updated']
            }))
        else:
            await self.send(text_data=json.dumps({
                'type': 'marked_read',
                'chat_id': chat_id,
                'count': 0
            }))
    
    # ========== Channel Layer Event Handlers ==========
    
    async def chat_message(self, event):
        """Send message to WebSocket (called by channel layer for chat group)"""
        message = event['message']
        chat_id = event.get('chat_id')
        
        # Mark message as delivered when recipient receives it
        message_id = message.get('id')
        sender_data = message.get('sender', {})
        sender_id = sender_data.get('id') if isinstance(sender_data, dict) else None
        
        if message_id and sender_id and sender_id != self.user.id:
            # This user is receiving the message, mark as delivered
            was_delivered = await self.mark_message_delivered(message_id)
            
            # If message was just marked as delivered, broadcast update
            if was_delivered:
                updated_message = await self.get_message_data(message_id)
                if updated_message:
                    updated_message_data = await self.serialize_message(updated_message)
                    chat_group_name = f'chat_{chat_id}'
                    await self.channel_layer.group_send(
                        chat_group_name,
                        {
                            'type': 'message_status_update',
                            'message': updated_message_data,
                            'chat_id': chat_id
                        }
                    )
        
        # Send message to WebSocket - only if chat_id is available
        if chat_id:
            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': message,
                'chat_id': chat_id
            }))
        else:
            # Fallback: try to get chat_id from message data
            message_chat_id = message.get('chat') if isinstance(message.get('chat'), str) else None
            if message_chat_id:
                await self.send(text_data=json.dumps({
                    'type': 'message',
                    'message': message,
                    'chat_id': message_chat_id
                }))
            else:
                logger.warning(f"Could not send message to WebSocket - missing chat_id for message {message.get('id')}")
    
    async def user_message(self, event):
        """Send message to WebSocket (called by channel layer for user-level group - WhatsApp/Telegram pattern)"""
        # This handler receives messages from user-level groups
        # It ensures ALL messages for this user are received, regardless of chat subscription
        message = event['message']
        chat_id = event.get('chat_id')
        
        # Mark message as delivered when recipient receives it
        message_id = message.get('id')
        sender_data = message.get('sender', {})
        sender_id = sender_data.get('id') if isinstance(sender_data, dict) else None
        
        if message_id and sender_id and sender_id != self.user.id:
            # This user is receiving the message, mark as delivered
            was_delivered = await self.mark_message_delivered(message_id)
            
            # If message was just marked as delivered, broadcast update to both chat and user groups
            if was_delivered:
                updated_message = await self.get_message_data(message_id)
                if updated_message:
                    updated_message_data = await self.serialize_message(updated_message)
                    chat_group_name = f'chat_{chat_id}'
                    
                    # Broadcast to chat group (for active subscribers)
                    await self.channel_layer.group_send(
                        chat_group_name,
                        {
                            'type': 'message_status_update',
                            'message': updated_message_data,
                            'chat_id': chat_id
                        }
                    )
                    
                    # Also broadcast to user groups (for all participants)
                    participant_ids = await self.get_chat_participant_ids(chat_id)
                    for user_id in participant_ids:
                        user_messages_group = f'user_{user_id}'
                        await self.channel_layer.group_send(
                            user_messages_group,
                            {
                                'type': 'message_status_update',
                                'message': updated_message_data,
                                'chat_id': chat_id
                            }
                        )
        
        # Send message to WebSocket - always send, regardless of subscription
        if chat_id:
            await self.send(text_data=json.dumps({
                'type': 'message',
                'message': message,
                'chat_id': chat_id
            }))
            logger.debug(f"📨 Sent message {message_id} to user {self.user.id} via user-level group")
        else:
            # Fallback: try to get chat_id from message data
            message_chat_id = message.get('chat') if isinstance(message.get('chat'), str) else None
            if message_chat_id:
                await self.send(text_data=json.dumps({
                    'type': 'message',
                    'message': message,
                    'chat_id': message_chat_id
                }))
            else:
                logger.warning(f"Could not send message to WebSocket - missing chat_id for message {message.get('id')}")
    
    async def typing_indicator(self, event):
        """Send typing indicator to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'user_id': event['user_id'],
            'user_name': event['user_name'],
            'typing': event['typing'],
            'chat_id': event.get('chat_id')
        }))
    
    async def message_status_update(self, event):
        """Send message status update (e.g., delivered, read receipt) to WebSocket"""
        message = event['message']
        chat_id = event.get('chat_id')
        
        # Log for debugging
        message_id = message.get('id') if isinstance(message, dict) else None
        is_read = message.get('is_read') if isinstance(message, dict) else False
        logger.debug(f"Sending status update for message {message_id} in chat {chat_id} - is_read: {is_read}")
        
        await self.send(text_data=json.dumps({
            'type': 'message_status_update',
            'message': message,
            'chat_id': chat_id
        }))
    
    async def chat_event(self, event):
        """Send chat list update to WebSocket (called by channel layer)"""
        payload = event.get('payload', {})
        await self.send(text_data=json.dumps(payload, default=str))
    
    # ========== Database Helpers ==========
    
    @database_sync_to_async
    def verify_chat_participant(self, chat_id, user):
        """Verify user is a participant in the chat"""
        try:
            chat = Chat.objects.get(id=chat_id)
            return chat.participant1 == user or chat.participant2 == user
        except Chat.DoesNotExist:
            return False
    
    @database_sync_to_async
    def create_message(self, chat_id, sender, content, parent_message_id=None, client_id=None):
        """Create a new message in the database"""
        try:
            chat = Chat.objects.select_related('participant1', 'participant2').get(id=chat_id)
            
            # Determine recipient (the other participant)
            recipient = chat.participant2 if chat.participant1.id == sender.id else chat.participant1
            
            # Check if recipient is online (WhatsApp/Telegram pattern: instant delivery)
            is_recipient_online = False
            try:
                recipient_status = UserOnlineStatus.objects.get(user=recipient)
                is_recipient_online = recipient_status.is_online
            except UserOnlineStatus.DoesNotExist:
                pass
            
            # Create message
            message_data = {
                'chat': chat,
                'sender': sender,
                'content': content,
                'client_id': client_id
            }
            
            if parent_message_id:
                try:
                    message_data['parent_message_id'] = parent_message_id
                except Exception as e:
                    logger.warning(f"Invalid parent_message_id: {parent_message_id}")

            # Extract and fetch link preview if content is text
            url = extract_url(content)
            if url:
                preview = get_link_preview(url)
                if preview:
                    message_data['link_url'] = preview['url']
                    message_data['link_title'] = preview['title']
                    message_data['link_description'] = preview['description']
                    message_data['link_image'] = preview['image']

            message = Message.objects.create(**message_data)
            
            # If recipient is online, mark as delivered immediately
            if is_recipient_online:
                message.delivered_at = timezone.now()
                message.save(update_fields=['delivered_at'])
                logger.info(f"✅ Message {message.id} marked as delivered immediately (recipient {recipient.id} is online)")
            
            # Update chat's last_message_at
            chat.update_last_message_time()
            return message
        except Exception as e:
            logger.error(f"Error creating message: {e}", exc_info=True)
            return None
    
    @database_sync_to_async
    def serialize_message(self, message):
        """Serialize message for WebSocket"""
        from api.serializers import MessageSerializer
        
        # Refresh message from DB to get latest delivered_at
        if hasattr(message, 'pk'):
            try:
                message = Message.objects.get(pk=message.pk)
            except Message.DoesNotExist:
                pass
        
        serializer = MessageSerializer(message, context={'request': self._get_mock_request(self.user)})
        data = serializer.data
        
        # Convert UUIDs and other non-serializable types to strings
        def make_serializable(obj):
            """Recursively convert UUIDs, datetimes, etc. to strings"""
            if isinstance(obj, uuid.UUID):
                return str(obj)
            elif isinstance(obj, dict):
                return {key: make_serializable(value) for key, value in obj.items()}
            elif isinstance(obj, list):
                return [make_serializable(item) for item in obj]
            elif hasattr(obj, 'isoformat'):  # datetime objects
                return obj.isoformat()
            return obj
        
        return make_serializable(data)
    
    @database_sync_to_async
    def set_user_online(self, user_id):
        """Set user as online"""
        try:
            user = User.objects.get(id=user_id)
            status_obj, created = UserOnlineStatus.objects.get_or_create(user=user)
            status_obj.set_online()
        except User.DoesNotExist:
            logger.warning(f"User {user_id} not found when setting online")
    
    @database_sync_to_async
    def set_user_offline(self, user_id):
        """Set user as offline"""
        try:
            user = User.objects.get(id=user_id)
            status_obj = UserOnlineStatus.objects.get(user=user)
            status_obj.set_offline()
        except (User.DoesNotExist, UserOnlineStatus.DoesNotExist):
            pass
    
    async def broadcast_chat_event(self, message_data, chat_id):
        """Broadcast chat summary + last message to each participant's user-level group"""
        participant_ids = await self.get_chat_participant_ids(chat_id)
        if not participant_ids:
            return
        
        for user_id in participant_ids:
            chat_data = await self.serialize_chat_for_user(chat_id, user_id)
            payload = {
                'type': 'chat_event',
                'payload': {
                    'type': 'chat_event',
                    'chat_id': str(chat_id),
                    'chat': chat_data,
                    'message': message_data,
                }
            }
            await self.channel_layer.group_send(
                f'chat_events_{user_id}',
                payload
            )
    
    @database_sync_to_async
    def get_chat_participant_ids(self, chat_id):
        try:
            chat = Chat.objects.only('participant1_id', 'participant2_id').get(id=chat_id)
            return [chat.participant1_id, chat.participant2_id]
        except Chat.DoesNotExist:
            return []
    
    @database_sync_to_async
    def serialize_chat_for_user(self, chat_id, user_id):
        from api.serializers import ChatSerializer
        
        try:
            # Ensure ad relationship is loaded to prevent N+1 queries and ensure ad data is available
            chat = Chat.objects.select_related('participant1', 'participant2', 'ad').get(id=chat_id)
            user = User.objects.get(id=user_id)
        except (Chat.DoesNotExist, User.DoesNotExist):
            return {}
        
        fake_request = self._get_mock_request(user)
        serializer = ChatSerializer(chat, context={'request': fake_request})
        return serializer.data

    def _get_mock_request(self, user):
        """Create a mock request object for serialization"""
        from types import SimpleNamespace
        from django.conf import settings
        
        request = SimpleNamespace(user=user)
        
        def mock_build_absolute_uri(location):
            site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000').rstrip('/')
            return f"{site_url}{location}"
            
        request.build_absolute_uri = mock_build_absolute_uri
        return request
    
    async def handle_mark_all_delivered(self):
        """Mark all unread messages as delivered when user comes online"""
        try:
            count, chat_ids, message_ids = await self.mark_all_messages_delivered(self.user.id)
            logger.info(f"✅ User {self.user.id} came online, marked {count} messages as delivered")
            
            # Broadcast message status updates for all affected messages
            # This will notify senders that their messages were delivered
            for message_id in message_ids:
                message = await self.get_message_data(message_id)
                if message:
                    message_data = await self.serialize_message(message)
                    chat_id = str(message.chat_id)
                    chat_group_name = f'chat_{chat_id}'
                    
                    # Broadcast status update to all chat participants
                    await self.channel_layer.group_send(
                        chat_group_name,
                        {
                            'type': 'message_status_update',
                            'message': message_data,
                            'chat_id': chat_id
                        }
                    )
            
            # Broadcast chat events to update chat list for all affected chats
            for chat_id in chat_ids:
                await self.broadcast_chat_event({}, str(chat_id))
            
            # Notify the user that messages were marked as delivered
            await self.send(text_data=json.dumps({
                'type': 'all_messages_delivered',
                'count': count
            }))
        except Exception as e:
            logger.error(f"Error marking all messages as delivered: {e}", exc_info=True)
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Failed to mark messages as delivered'
            }))
    
    @database_sync_to_async
    def mark_message_delivered(self, message_id):
        """Mark message as delivered when recipient receives it"""
        try:
            message = Message.objects.get(id=message_id)
            # Only mark as delivered if not already delivered and recipient is receiving it
            if not message.delivered_at and message.sender_id != self.user.id:
                message.delivered_at = timezone.now()
                message.save(update_fields=['delivered_at'])
                logger.debug(f"✅ Message {message_id} marked as delivered to user {self.user.id}")
                return True
        except Message.DoesNotExist:
            logger.warning(f"Message {message_id} not found when marking as delivered")
        except Exception as e:
            logger.error(f"Error marking message as delivered: {e}", exc_info=True)
        return False
    
    @database_sync_to_async
    def mark_all_messages_delivered(self, user_id):
        """Mark all unread messages sent to this user as delivered"""
        try:
            # Get all chats where this user is a participant
            user_chats = Chat.objects.filter(
                models.Q(participant1_id=user_id) | models.Q(participant2_id=user_id)
            )
            
            # Get all messages sent to this user that are not yet delivered
            messages = Message.objects.filter(
                chat__in=user_chats,
                delivered_at__isnull=True
            ).exclude(
                sender_id=user_id  # Exclude messages sent by this user
            )
            
            # Get message IDs before updating
            message_ids = list(messages.values_list('id', flat=True))
            
            # Mark all as delivered
            count = messages.update(delivered_at=timezone.now())
            
            return count, list(user_chats.values_list('id', flat=True)), message_ids
        except Exception as e:
            logger.error(f"Error marking all messages as delivered: {e}", exc_info=True)
            return 0, [], []
    
    @database_sync_to_async
    def get_message_data(self, message_id):
        """Get message data"""
        try:
            message = Message.objects.get(id=message_id)
            return message
        except Message.DoesNotExist:
            return None
    
    @database_sync_to_async
    def mark_messages_as_read(self, chat_id, user):
        """Mark all unread messages in chat as read for current user"""
        try:
            chat = Chat.objects.get(id=chat_id)
            # Get unread messages (not sent by current user)
            unread_messages = chat.messages.filter(
                is_read=False
            ).exclude(sender=user)
            
            message_ids = list(unread_messages.values_list('id', flat=True))
            
            # Mark as read
            updated = unread_messages.update(
                is_read=True,
                read_at=timezone.now()
            )
            
            return {
                'updated': updated,
                'message_ids': message_ids
            }
        except Chat.DoesNotExist:
            return {'updated': 0, 'message_ids': []}
        except Exception as e:
            logger.error(f"Error marking messages as read: {e}", exc_info=True)
            return {'updated': 0, 'message_ids': []}
    
    async def broadcast_read_status_updates(self, chat_id, message_ids):
        """Broadcast read status updates for messages (like WhatsApp/Telegram)"""
        if not message_ids:
            logger.warning(f"No message IDs to broadcast for chat {chat_id}")
            return
        
        chat_group_name = f'chat_{chat_id}'
        
        logger.info(f"📤 Broadcasting read status updates for {len(message_ids)} messages in chat {chat_id}")
        
        # Get updated messages and broadcast each one
        for message_id in message_ids:
            updated_message = await self.get_message_data(message_id)
            if updated_message:
                updated_message_data = await self.serialize_message(updated_message)
                
                # Verify the message is marked as read
                is_read = updated_message_data.get('is_read', False)
                read_at = updated_message_data.get('read_at')
                logger.info(f"📤 Broadcasting read status for message {message_id} - is_read: {is_read}, read_at: {read_at}")
                
                # Broadcast to chat group (for active subscribers inside this chat)
                await self.channel_layer.group_send(
                    chat_group_name,
                    {
                        'type': 'message_status_update',
                        'message': updated_message_data,
                        'chat_id': chat_id
                    }
                )
                
                # ALSO broadcast to user-level groups (WhatsApp/Telegram pattern)
                # This ensures the sender sees blue ticks even if they are on the chat list page
                participant_ids = await self.get_chat_participant_ids(chat_id)
                for user_id in participant_ids:
                    user_messages_group = f'user_{user_id}'
                    await self.channel_layer.group_send(
                        user_messages_group,
                        {
                            'type': 'message_status_update',
                            'message': updated_message_data,
                            'chat_id': chat_id
                        }
                    )
                logger.info(f"✅ Broadcasted read status update for message {message_id} to global groups")
            else:
                logger.warning(f"Could not find message {message_id} to broadcast read status")
