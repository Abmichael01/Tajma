import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from api.models import Notification
from api.serializers import NotificationSerializer
from api.services.push_service import push_service

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Notification)
def send_notification_via_websocket(sender, instance, created, **kwargs):
    """
    Send notification to user via WebSocket when a new notification is created.
    """
    if created:
        logger.info(f"📡 Signal triggered: Notification {instance.id} created for user {instance.recipient.id}")
        
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("⚠️ Channel layer not available - cannot send WebSocket notification")
            return
        
        logger.info(f"📤 Serializing notification {instance.id}...")
        # Serialize the notification
        serializer = NotificationSerializer(instance)
        notification_data = serializer.data
        
        # Convert UUIDs and other non-serializable types to strings
        def make_serializable(obj):
            if isinstance(obj, dict):
                return {k: make_serializable(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [make_serializable(item) for item in obj]
            elif hasattr(obj, 'isoformat'):  # datetime
                return obj.isoformat()
            elif hasattr(obj, '__str__') and not isinstance(obj, (str, int, float, bool, type(None))):
                return str(obj)
            return obj
        
        serializable_notification = make_serializable(notification_data)
        logger.info(f"✅ Notification serialized: {serializable_notification.get('title', 'N/A')}")
        logger.info(f"📋 Notification ID: {serializable_notification.get('id')}")
        logger.info(f"📋 Notification type: {serializable_notification.get('type')}")
        logger.info(f"📋 Related ad: {serializable_notification.get('related_ad')}")
        logger.info(f"📋 Related ad slug: {serializable_notification.get('related_ad_slug')}")
        logger.debug(f"📋 Full serialized notification: {serializable_notification}")
        
        # Send to user's notification group
        group_name = f'notifications_{instance.recipient.id}'
        logger.info(f"📨 Sending to WebSocket group: {group_name}")
        logger.info(f"📋 Channel layer type: {type(channel_layer)}")
        
        try:
            message_payload = {
                'type': 'notification_message',
                'notification': serializable_notification,
            }
            logger.info(f"📤 Calling group_send with payload type: {message_payload['type']}")
            logger.debug(f"📋 Full payload: {message_payload}")
            
            async_to_sync(channel_layer.group_send)(
                group_name,
                message_payload
            )
            logger.info(f"✅ Notification message sent to WebSocket group {group_name}")
            logger.info(f"📊 Checking if group exists...")
        except Exception as e:
            logger.error(f"❌ Failed to send notification message via WebSocket: {e}", exc_info=True)
            import traceback
            logger.error(f"❌ Traceback: {traceback.format_exc()}")
        
        # Also send updated unread count
        try:
            unread_count = Notification.objects.filter(
                recipient=instance.recipient,
                is_read=False
            ).count()
            
            logger.info(f"📊 Sending unread count update: {unread_count} unread notifications")
            async_to_sync(channel_layer.group_send)(
                group_name,
                {
                    'type': 'notification_count',
                    'count': unread_count,
                }
            )
            logger.info(f"✅ Unread count sent: {unread_count}")
        except Exception as e:
            logger.error(f"❌ Failed to send unread count via WebSocket: {e}", exc_info=True)

        # Fan-out push to every active device token (Expo + Web).
        try:
            # Build a deep link the client can route to without extra lookups.
            # Chat-type notifications go to the conversation; everything else
            # falls back to the related ad page.
            deep_link = ''
            if instance.related_chat_id:
                deep_link = f'/messages/{instance.related_chat_id}'
            elif instance.related_ad_id and getattr(instance.related_ad, 'slug', None):
                deep_link = f'/ads/{instance.related_ad.slug}'

            summary = push_service.send_to_user(
                user_id=instance.recipient_id,
                title=instance.title,
                body=instance.message,
                data={
                    'notification_id': str(instance.id),
                    'type': instance.type,
                    'ad_id': str(instance.related_ad_id) if instance.related_ad_id else '',
                    'chat_id': str(instance.related_chat_id) if instance.related_chat_id else '',
                    'deep_link': deep_link,
                },
            )
            logger.info(
                "push fan-out for notification %s: %s",
                instance.id, summary,
            )
        except Exception as e:
            logger.error(f"❌ Push fan-out failed: {e}", exc_info=True)

