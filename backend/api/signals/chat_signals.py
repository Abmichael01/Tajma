"""
Signal handlers for chat-related models.
Broadcasts messages via WebSocket when created via REST API.
"""
import json
import logging
import uuid
from types import SimpleNamespace

from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from api.models import Message, Chat
from api.serializers import MessageSerializer, ChatSerializer
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)
User = get_user_model()


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


@receiver(post_save, sender=Message)
def broadcast_message_on_create(sender, instance, created, **kwargs):
    """
    Broadcast new message via WebSocket when created.
    This ensures messages created via REST API are also broadcast via WebSocket.
    Also broadcasts read status updates when messages are marked as read.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not configured, skipping message broadcast")
            return
        
        # Serialize message
        serializer = MessageSerializer(instance)
        message_data = make_serializable(serializer.data)
        
        chat_id = str(instance.chat.id)
        chat_group_name = f'chat_{chat_id}'
        
        if created:
            # New message - broadcast to chat room
            async_to_sync(channel_layer.group_send)(
                chat_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data,
                    'chat_id': chat_id  # Ensure chat_id is included
                }
            )
            
            logger.info(f"✅ Broadcasted new message {instance.id} to chat {chat_id}")
            
            # Also broadcast chat event to update chat list
            broadcast_chat_event_for_message(instance, message_data)
        else:
            # Message updated (e.g., marked as read) - broadcast status update
            # Only broadcast if read status changed
            if 'is_read' in kwargs.get('update_fields', []) or kwargs.get('update_fields') is None:
                async_to_sync(channel_layer.group_send)(
                    chat_group_name,
                    {
                        'type': 'message_status_update',
                        'message': message_data,
                        'chat_id': chat_id  # Ensure chat_id is included
                    }
                )
                
                logger.info(f"✅ Broadcasted read status update for message {instance.id} in chat {chat_id}")
        
    except Exception as e:
        logger.error(f"❌ Error broadcasting message {instance.id}: {e}", exc_info=True)


def broadcast_chat_event_for_message(message_instance, message_data):
    """
    Broadcast chat event to update chat list for both participants.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        chat = message_instance.chat
        participant_ids = [chat.participant1_id, chat.participant2_id]
        
        for user_id in participant_ids:
            try:
                user = User.objects.get(id=user_id)
                # Serialize chat for this user
                fake_request = SimpleNamespace(user=user)
                chat_serializer = ChatSerializer(chat, context={'request': fake_request})
                chat_data = make_serializable(chat_serializer.data)
                
                # Send to user's chat events group
                async_to_sync(channel_layer.group_send)(
                    f'chat_events_{user_id}',
                    {
                        'type': 'chat_event',
                        'payload': {
                            'type': 'chat_event',
                            'chat_id': str(chat.id),
                            'chat': chat_data,
                            'message': message_data,
                        }
                    }
                )
                
                logger.debug(f"✅ Broadcasted chat event for user {user_id}, chat {chat.id}")
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found when broadcasting chat event")
            except Exception as e:
                logger.error(f"Error broadcasting chat event for user {user_id}: {e}", exc_info=True)
                
    except Exception as e:
        logger.error(f"Error in broadcast_chat_event_for_message: {e}", exc_info=True)


def broadcast_message_read_status(chat_id, message_ids, user_id):
    """
    Broadcast read status updates for messages.
    Called manually from REST API views when using bulk update (.update()).
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not configured, skipping read status broadcast")
            return
        
        from api.models import Message
        
        # Get updated messages
        messages = Message.objects.filter(id__in=message_ids).select_related('sender', 'chat')
        
        chat_group_name = f'chat_{chat_id}'
        
        # Broadcast each message's updated status
        for message in messages:
            try:
                serializer = MessageSerializer(message)
                message_data = make_serializable(serializer.data)
                
                # Broadcast to chat room
                async_to_sync(channel_layer.group_send)(
                    chat_group_name,
                    {
                        'type': 'message_status_update',
                        'message': message_data
                    }
                )
                
                logger.debug(f"✅ Broadcasted read status for message {message.id}")
            except Exception as e:
                logger.error(f"Error broadcasting read status for message {message.id}: {e}", exc_info=True)
                
    except Exception as e:
        logger.error(f"Error in broadcast_message_read_status: {e}", exc_info=True)

