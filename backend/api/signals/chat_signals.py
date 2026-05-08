"""
Signal handlers for chat-related models.
Broadcasts messages via WebSocket when created via REST API.
"""
import json
import logging
import uuid
from types import SimpleNamespace

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from api.models import Message, Chat, UserOnlineStatus, Notification
from api.serializers import MessageSerializer, ChatSerializer
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import models

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
            # Check if recipient is online and mark as delivered immediately (WhatsApp/Telegram pattern)
            chat = instance.chat
            recipient = chat.participant2 if chat.participant1_id == instance.sender_id else chat.participant1
            
            is_recipient_online = False
            try:
                recipient_status = UserOnlineStatus.objects.get(user=recipient)
                is_recipient_online = recipient_status.is_online
            except UserOnlineStatus.DoesNotExist:
                pass
            
            # If recipient is online, mark as delivered immediately
            if is_recipient_online and not instance.delivered_at:
                instance.delivered_at = timezone.now()
                instance.save(update_fields=['delivered_at'])
                # Re-serialize to include delivered_at
                serializer = MessageSerializer(instance)
                message_data = make_serializable(serializer.data)
                logger.info(f"✅ Message {instance.id} marked as delivered immediately (recipient {recipient.id} is online)")
            
            # New message - broadcast to chat room (for active subscribers)
            async_to_sync(channel_layer.group_send)(
                chat_group_name,
                {
                    'type': 'chat_message',
                    'message': message_data,
                    'chat_id': chat_id  # Ensure chat_id is included
                }
            )
            
            # ALSO broadcast to user-level groups (WhatsApp/Telegram pattern)
            # This ensures ALL participants receive the message, regardless of subscription
            participant_ids = [chat.participant1_id, chat.participant2_id]
            for user_id in participant_ids:
                user_messages_group = f'user_{user_id}'
                async_to_sync(channel_layer.group_send)(
                    user_messages_group,
                    {
                        'type': 'user_message',
                        'message': message_data,
                        'chat_id': chat_id
                    }
                )
                logger.debug(f"✅ Broadcasted message {instance.id} to user-level group: {user_messages_group}")
            
            logger.info(f"✅ Broadcasted new message {instance.id} to chat {chat_id} and user groups")
            
            # If message was delivered immediately, broadcast delivery status update
            if is_recipient_online and instance.delivered_at:
                async_to_sync(channel_layer.group_send)(
                    chat_group_name,
                    {
                        'type': 'message_status_update',
                        'message': message_data,
                        'chat_id': chat_id
                    }
                )
                # Also broadcast to user groups
                for user_id in participant_ids:
                    user_messages_group = f'user_{user_id}'
                    async_to_sync(channel_layer.group_send)(
                        user_messages_group,
                        {
                            'type': 'message_status_update',
                            'message': message_data,
                            'chat_id': chat_id
                        }
                    )
                logger.info(f"✅ Broadcasted instant delivery status for message {instance.id}")
            
            # Also broadcast chat event to update chat list
            broadcast_chat_event_for_message(instance, message_data)

            # 🚀 Create System Notification (which triggers FCM push)
            try:
                if instance.sender_id != recipient.id:
                    # Check if we should send notification (rate limiting/duplicates)
                    if Notification.should_send_notification(
                        recipient=recipient,
                        notification_type='message',
                        related_user=instance.sender,
                        related_ad=chat.ad
                    ):
                        Notification.objects.create(
                            recipient=recipient,
                            type='message',
                            title=f'New message from {instance.sender.get_full_name()}',
                            message=instance.content[:100] + ('...' if len(instance.content) > 100 else ''),
                            related_user=instance.sender,
                            related_ad=chat.ad
                        )
                        logger.info(f"✅ Created notification for message {instance.id} for user {recipient.id}")
            except Exception as e:
                logger.error(f"❌ Failed to create notification for message {instance.id}: {e}")
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

                participant_ids = [instance.chat.participant1_id, instance.chat.participant2_id]
                for user_id in participant_ids:
                    async_to_sync(channel_layer.group_send)(
                        f'user_{user_id}',
                        {
                            'type': 'message_status_update',
                            'message': message_data,
                            'chat_id': chat_id
                        }
                    )
                
                logger.info(f"✅ Broadcasted read status update for message {instance.id} in chat {chat_id}")
        
    except Exception as e:
        logger.error(f"❌ Error broadcasting message {instance.id}: {e}", exc_info=True)


@receiver(post_save, sender=Chat)
def broadcast_chat_on_create_or_update(sender, instance, created, **kwargs):
    """
    Broadcast chat events via WebSocket when created or updated.
    - On creation: broadcasts new chat to both participants
    - On update: broadcasts chat update (e.g., when last_message_at changes)
    This ensures chats created/updated via REST API are also broadcast via WebSocket
    to update the chat list for both participants.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer not configured, skipping chat broadcast")
            return
        
        # Check if this is a relevant update (last_message_at or created_at changed)
        update_fields = kwargs.get('update_fields', None)
        if not created and update_fields:
            # Only broadcast if last_message_at or updated_at changed
            if 'last_message_at' not in update_fields and 'updated_at' not in update_fields:
                return
        
        # Ensure relationships are loaded
        chat = Chat.objects.select_related('ad', 'participant1', 'participant2').get(id=instance.id)
        participant_ids = [chat.participant1_id, chat.participant2_id]
        
        # Broadcast chat event to both participants
        event_type = 'chat_created' if created else 'chat_updated'
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
                            'type': event_type,
                            'chat_id': str(chat.id),
                            'chat': chat_data,
                        }
                    }
                )
                
                logger.info(f"✅ Broadcasted chat {chat.id} ({event_type}) to user {user_id}")
            except User.DoesNotExist:
                logger.warning(f"User {user_id} not found when broadcasting chat event")
            except Exception as e:
                logger.error(f"Error broadcasting chat event for user {user_id}: {e}", exc_info=True)
                
    except Exception as e:
        logger.error(f"❌ Error broadcasting chat {instance.id}: {e}", exc_info=True)


def broadcast_chat_event_for_message(message_instance, message_data):
    """
    Broadcast chat event to update chat list for both participants.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        # Ensure ad relationship is loaded to prevent N+1 queries and ensure ad data is available
        chat = Chat.objects.select_related('ad', 'participant1', 'participant2').get(id=message_instance.chat.id)
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
                        'message': message_data,
                        'chat_id': chat_id
                    }
                )

                participant_ids = [message.chat.participant1_id, message.chat.participant2_id]
                for user_id in participant_ids:
                    async_to_sync(channel_layer.group_send)(
                        f'user_{user_id}',
                        {
                            'type': 'message_status_update',
                            'message': message_data,
                            'chat_id': chat_id
                        }
                    )
                
                logger.debug(f"✅ Broadcasted read status for message {message.id}")
            except Exception as e:
                logger.error(f"Error broadcasting read status for message {message.id}: {e}", exc_info=True)
                
    except Exception as e:
        logger.error(f"Error in broadcast_message_read_status: {e}", exc_info=True)


@receiver(post_delete, sender=Message)
def delete_attachment_on_message_delete(sender, instance, **kwargs):
    """
    Delete the attachment file from storage when the message is deleted.
    """
    if instance.attachment:
        try:
            # delete() method of FileField takes 'save' argument. 
            # We set it to False to avoid saving the model instance again.
            instance.attachment.delete(save=False)
            logger.info(f"✅ Successfully deleted attachment for message {instance.id}")
        except Exception as e:
            logger.error(f"❌ Error deleting attachment for message {instance.id}: {e}")
