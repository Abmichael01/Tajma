"""API tests for Wave 1 chat-list + message hide/delete behavior.

Covers the routes added in views/chat.py:
- Chat: hide, unhide, archive, unarchive, pin, unpin, mark_unread, per-user mute
- Message: scope=me (soft hide) and scope=everyone (hard delete + 60-min window)
- Auto-unhide signal on new incoming message
- Per-user mute actually suppresses push fan-out
"""

from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Chat, Message


class ChatHideDeleteAPITest(TestCase):
    def setUp(self):
        User = get_user_model()
        self.alice = User.objects.create_user(
            email="alice@example.com", password="x", first_name="Alice", last_name="A"
        )
        self.bob = User.objects.create_user(
            email="bob@example.com", password="x", first_name="Bob", last_name="B"
        )
        self.chat = Chat.objects.create(participant1=self.alice, participant2=self.bob)
        self.client = APIClient()

    def _as(self, user):
        self.client.force_authenticate(user)
        return self.client

    # ── Chat list filtering ────────────────────────────────────────────────

    def test_hide_chat_removes_from_caller_list_only(self):
        # Alice hides; Bob still sees the chat.
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/hide/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertTrue(resp.data["is_hidden"])

        alice_list = self._as(self.alice).get("/api/chats/").data
        bob_list = self._as(self.bob).get("/api/chats/").data
        alice_ids = [c["id"] for c in alice_list.get("results", alice_list)]
        bob_ids = [c["id"] for c in bob_list.get("results", bob_list)]
        self.assertNotIn(str(self.chat.id), alice_ids)
        self.assertIn(str(self.chat.id), bob_ids)

    def test_new_message_auto_unhides_chat(self):
        self.chat.hidden_for_users.add(self.alice)
        # Bob sends a message — the post_save signal should unhide for Alice.
        Message.objects.create(
            chat=self.chat, sender=self.bob, content="ping", message_type="text"
        )
        self.chat.refresh_from_db()
        self.assertFalse(self.chat.hidden_for_users.filter(id=self.alice.id).exists())

    def test_archive_excludes_from_default_list_visible_with_query_param(self):
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/archive/")
        default = self._as(self.alice).get("/api/chats/").data
        archived = self._as(self.alice).get("/api/chats/?archived=true").data
        default_ids = [c["id"] for c in default.get("results", default)]
        archived_ids = [c["id"] for c in archived.get("results", archived)]
        self.assertNotIn(str(self.chat.id), default_ids)
        self.assertIn(str(self.chat.id), archived_ids)

    def test_unarchive_works_on_already_archived_chat(self):
        """Regression: list queryset excludes archived chats, but the unarchive
        action must still find them. Same applies to unhide."""
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/archive/")
        # Unarchive should succeed even though the chat is archived.
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/unarchive/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.chat.refresh_from_db()
        self.assertFalse(self.chat.is_archived)
        # And it reappears in the default list.
        default = self._as(self.alice).get("/api/chats/").data
        ids = [c["id"] for c in default.get("results", default)]
        self.assertIn(str(self.chat.id), ids)

    def test_unhide_works_on_already_hidden_chat(self):
        """Regression: list queryset excludes hidden chats, but unhide must
        still find them."""
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/hide/")
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/unhide/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        default = self._as(self.alice).get("/api/chats/").data
        ids = [c["id"] for c in default.get("results", default)]
        self.assertIn(str(self.chat.id), ids)

    def test_pin_sets_pinned_at_and_serializer_reports_is_pinned(self):
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/pin/")
        self.chat.refresh_from_db()
        self.assertIsNotNone(self.chat.pinned_at)

        listing = self._as(self.alice).get("/api/chats/").data
        rows = listing.get("results", listing)
        row = next(r for r in rows if r["id"] == str(self.chat.id))
        self.assertTrue(row["is_pinned"])
        self.assertIsNotNone(row["pinned_at"])

    def test_unpin_clears_pinned_at(self):
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/pin/")
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/unpin/")
        self.chat.refresh_from_db()
        self.assertIsNone(self.chat.pinned_at)

    # ── Per-user mute ──────────────────────────────────────────────────────

    def test_mute_is_per_user(self):
        self._as(self.alice).post(
            f"/api/chats/{self.chat.id}/mute/", {"is_muted": True}, format="json"
        )
        # Serializer's is_muted is computed against request.user.
        alice_view = self._as(self.alice).get(f"/api/chats/{self.chat.id}/").data
        bob_view = self._as(self.bob).get(f"/api/chats/{self.chat.id}/").data
        self.assertTrue(alice_view["is_muted"])
        self.assertFalse(bob_view["is_muted"])

    def test_unmute_removes_user_from_muted_by(self):
        self._as(self.alice).post(
            f"/api/chats/{self.chat.id}/mute/", {"is_muted": True}, format="json"
        )
        self._as(self.alice).post(
            f"/api/chats/{self.chat.id}/mute/", {"is_muted": False}, format="json"
        )
        self.chat.refresh_from_db()
        self.assertFalse(self.chat.muted_by.filter(id=self.alice.id).exists())

    # ── Mark unread ────────────────────────────────────────────────────────

    def test_mark_unread_flips_latest_incoming_message(self):
        msg = Message.objects.create(
            chat=self.chat, sender=self.bob, content="hi", message_type="text",
            is_read=True, read_at=timezone.now(),
        )
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/mark_unread/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        msg.refresh_from_db()
        self.assertFalse(msg.is_read)
        self.assertIsNone(msg.read_at)

    def test_mark_unread_returns_400_when_no_incoming_messages(self):
        Message.objects.create(
            chat=self.chat, sender=self.alice, content="my own msg", message_type="text"
        )
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/mark_unread/")
        self.assertEqual(resp.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Message delete: scope=me ───────────────────────────────────────────

    def test_message_delete_scope_me_hides_for_caller_only(self):
        msg = Message.objects.create(
            chat=self.chat, sender=self.bob, content="from bob", message_type="text"
        )
        resp = self._as(self.alice).delete(f"/api/messages/{msg.id}/?scope=me")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        # Row still exists; alice's queryset excludes it; bob's includes it.
        self.assertTrue(Message.objects.filter(id=msg.id).exists())
        alice_msgs = self._as(self.alice).get(f"/api/messages/?chat={self.chat.id}").data
        bob_msgs = self._as(self.bob).get(f"/api/messages/?chat={self.chat.id}").data
        a_ids = [m["id"] for m in alice_msgs.get("results", alice_msgs)]
        b_ids = [m["id"] for m in bob_msgs.get("results", bob_msgs)]
        self.assertNotIn(str(msg.id), a_ids)
        self.assertIn(str(msg.id), b_ids)

    def test_bulk_delete_scope_me_hides_only_for_caller(self):
        m1 = Message.objects.create(
            chat=self.chat, sender=self.bob, content="m1", message_type="text"
        )
        m2 = Message.objects.create(
            chat=self.chat, sender=self.bob, content="m2", message_type="text"
        )
        resp = self._as(self.alice).post(
            "/api/messages/bulk_delete/",
            {"message_ids": [str(m1.id), str(m2.id)], "scope": "me"},
            format="json",
        )
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)
        # Both rows still exist.
        self.assertEqual(Message.objects.filter(id__in=[m1.id, m2.id]).count(), 2)

    # ── Message delete: scope=everyone window enforcement ──────────────────

    def test_delete_for_everyone_within_window_hard_deletes(self):
        msg = Message.objects.create(
            chat=self.chat, sender=self.alice, content="recent", message_type="text"
        )
        resp = self._as(self.alice).delete(f"/api/messages/{msg.id}/?scope=everyone")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Message.objects.filter(id=msg.id).exists())

    def test_delete_for_everyone_outside_window_is_forbidden(self):
        msg = Message.objects.create(
            chat=self.chat, sender=self.alice, content="old", message_type="text"
        )
        # Force created_at outside the 60-min window.
        Message.objects.filter(id=msg.id).update(
            created_at=timezone.now() - timedelta(hours=2)
        )
        resp = self._as(self.alice).delete(f"/api/messages/{msg.id}/?scope=everyone")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Message.objects.filter(id=msg.id).exists())

    def test_delete_for_everyone_on_others_message_is_forbidden(self):
        msg = Message.objects.create(
            chat=self.chat, sender=self.bob, content="not mine", message_type="text"
        )
        resp = self._as(self.alice).delete(f"/api/messages/{msg.id}/?scope=everyone")
        self.assertEqual(resp.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(Message.objects.filter(id=msg.id).exists())

    # ── Per-user clear ─────────────────────────────────────────────────────

    def test_clear_chat_hides_all_messages_for_caller_only(self):
        m1 = Message.objects.create(
            chat=self.chat, sender=self.alice, content="from alice", message_type="text"
        )
        m2 = Message.objects.create(
            chat=self.chat, sender=self.bob, content="from bob", message_type="text"
        )
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/clear/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 2)

        # Messages still exist on disk.
        self.assertTrue(Message.objects.filter(id__in=[m1.id, m2.id]).count() == 2)
        # Alice sees none; Bob sees both.
        alice_msgs = self._as(self.alice).get(f"/api/messages/?chat={self.chat.id}").data
        bob_msgs = self._as(self.bob).get(f"/api/messages/?chat={self.chat.id}").data
        a_ids = [m["id"] for m in alice_msgs.get("results", alice_msgs)]
        b_ids = [m["id"] for m in bob_msgs.get("results", bob_msgs)]
        self.assertEqual(a_ids, [])
        self.assertEqual(set(b_ids), {str(m1.id), str(m2.id)})

    def test_messages_sent_after_clear_are_visible_to_caller(self):
        Message.objects.create(
            chat=self.chat, sender=self.bob, content="before clear", message_type="text"
        )
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/clear/")
        # Bob sends a fresh message — alice should see it.
        new_msg = Message.objects.create(
            chat=self.chat, sender=self.bob, content="after clear", message_type="text"
        )
        alice_msgs = self._as(self.alice).get(f"/api/messages/?chat={self.chat.id}").data
        a_ids = [m["id"] for m in alice_msgs.get("results", alice_msgs)]
        self.assertEqual(a_ids, [str(new_msg.id)])

    def test_clear_is_idempotent(self):
        Message.objects.create(
            chat=self.chat, sender=self.alice, content="msg", message_type="text"
        )
        self._as(self.alice).post(f"/api/chats/{self.chat.id}/clear/")
        # Calling twice shouldn't error or duplicate through-rows.
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/clear/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

    def test_clear_empty_chat_returns_200_count_0(self):
        resp = self._as(self.alice).post(f"/api/chats/{self.chat.id}/clear/")
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(resp.data["count"], 0)

    # ── Mute actually blocks push fan-out ───────────────────────────────────

    def test_muted_recipient_does_not_receive_push(self):
        """When Alice has muted the chat, Bob sending a message should NOT
        result in push_service.send_to_user being called for Alice. The WS
        transient banner still fires (chat is just muted, not blocked)."""
        self.chat.muted_by.add(self.alice)

        with patch("api.signals.chat_signals.push_service") as mock_push:
            Message.objects.create(
                chat=self.chat,
                sender=self.bob,
                content="should be silent",
                message_type="text",
            )

        # The signal should NOT have called send_to_user for the muted recipient.
        self.assertEqual(mock_push.send_to_user.call_count, 0)

    def test_unmuted_recipient_receives_push(self):
        """Sanity check: when nobody muted, push IS called."""
        with patch("api.signals.chat_signals.push_service") as mock_push:
            Message.objects.create(
                chat=self.chat,
                sender=self.bob,
                content="this should ring",
                message_type="text",
            )

        self.assertEqual(mock_push.send_to_user.call_count, 1)
        # And it was called targeting Alice (the recipient).
        called_kwargs = mock_push.send_to_user.call_args.kwargs
        self.assertEqual(called_kwargs["user_id"], self.alice.id)

    def test_mute_is_per_user_in_push_path(self):
        """Bob muting his side should not affect Alice. When Bob sends a
        message, Alice still gets a push (she hasn't muted)."""
        self.chat.muted_by.add(self.bob)  # Bob muted — irrelevant to Alice's pushes

        with patch("api.signals.chat_signals.push_service") as mock_push:
            Message.objects.create(
                chat=self.chat,
                sender=self.bob,
                content="alice should still hear this",
                message_type="text",
            )

        self.assertEqual(mock_push.send_to_user.call_count, 1)
        self.assertEqual(mock_push.send_to_user.call_args.kwargs["user_id"], self.alice.id)

    def test_default_scope_is_everyone_for_backward_compat(self):
        # No ?scope param — old mobile clients still get hard delete behavior.
        msg = Message.objects.create(
            chat=self.chat, sender=self.alice, content="legacy delete", message_type="text"
        )
        resp = self._as(self.alice).delete(f"/api/messages/{msg.id}/")
        self.assertEqual(resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Message.objects.filter(id=msg.id).exists())
