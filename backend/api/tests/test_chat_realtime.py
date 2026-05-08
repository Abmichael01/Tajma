import json
from unittest.mock import patch

from asgiref.sync import async_to_sync
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from api.consumers.unified_chat_consumer import UnifiedChatConsumer
from api.models import Chat, Message
from api.signals.chat_signals import broadcast_message_read_status


class FakeChannelLayer:
    def __init__(self):
        self.calls = []

    async def group_send(self, group_name, message):
        self.calls.append((group_name, message))


class ChatRealtimeContractTest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.sender = User.objects.create_user(
            email="sender@example.com",
            password="password",
            first_name="Sender",
            last_name="User",
        )
        self.reader = User.objects.create_user(
            email="reader@example.com",
            password="password",
            first_name="Reader",
            last_name="User",
        )
        self.chat = Chat.objects.create(
            participant1=self.sender,
            participant2=self.reader,
        )

    def test_rest_read_status_broadcast_reaches_chat_and_user_groups(self):
        message = Message.objects.create(
            chat=self.chat,
            sender=self.sender,
            content="hello",
            is_read=True,
            read_at=timezone.now(),
        )
        fake_layer = FakeChannelLayer()

        with patch("api.signals.chat_signals.get_channel_layer", return_value=fake_layer):
            broadcast_message_read_status(
                chat_id=str(self.chat.id),
                message_ids=[message.id],
                user_id=self.reader.id,
            )

        status_calls = [
            (group_name, payload)
            for group_name, payload in fake_layer.calls
            if payload["type"] == "message_status_update"
        ]

        self.assertEqual(
            {group_name for group_name, _ in status_calls},
            {
                f"chat_{self.chat.id}",
                f"user_{self.sender.id}",
                f"user_{self.reader.id}",
            },
        )
        self.assertTrue(all(payload["chat_id"] == str(self.chat.id) for _, payload in status_calls))

    def test_websocket_mark_read_updates_database_and_broadcasts_status(self):
        message = Message.objects.create(
            chat=self.chat,
            sender=self.sender,
            content="please read me",
        )
        fake_layer = FakeChannelLayer()
        sent_messages = []
        consumer = UnifiedChatConsumer()
        consumer.user = self.reader
        consumer.channel_layer = fake_layer
        consumer.subscribed_chats = {str(self.chat.id)}

        async def fake_send(text_data=None, bytes_data=None, close=False):
            if text_data:
                sent_messages.append(json.loads(text_data))

        consumer.send = fake_send

        async_to_sync(consumer.handle_mark_read)({"chat_id": str(self.chat.id)})
        message.refresh_from_db()

        self.assertTrue(message.is_read)
        self.assertIsNotNone(message.read_at)
        self.assertIn(
            {"type": "marked_read", "chat_id": str(self.chat.id), "count": 1},
            sent_messages,
        )

        status_groups = {
            group_name
            for group_name, payload in fake_layer.calls
            if payload["type"] == "message_status_update"
        }
        self.assertTrue(
            {
                f"chat_{self.chat.id}",
                f"user_{self.sender.id}",
                f"user_{self.reader.id}",
            }.issubset(status_groups)
        )

    def test_typing_broadcast_reaches_active_chat_and_user_groups(self):
        fake_layer = FakeChannelLayer()
        consumer = UnifiedChatConsumer()
        consumer.user = self.sender
        consumer.channel_layer = fake_layer
        consumer.subscribed_chats = {str(self.chat.id)}

        async_to_sync(consumer.handle_typing)(
            {"chat_id": str(self.chat.id), "typing": True}
        )

        typing_calls = [
            (group_name, payload)
            for group_name, payload in fake_layer.calls
            if payload["type"] == "typing_indicator"
        ]

        self.assertEqual(
            {group_name for group_name, _ in typing_calls},
            {
                f"chat_{self.chat.id}",
                f"user_{self.sender.id}",
                f"user_{self.reader.id}",
            },
        )
        self.assertTrue(all(payload["chat_id"] == str(self.chat.id) for _, payload in typing_calls))
        self.assertTrue(all(payload["user_id"] == self.sender.id for _, payload in typing_calls))
        self.assertTrue(all(payload["typing"] is True for _, payload in typing_calls))
