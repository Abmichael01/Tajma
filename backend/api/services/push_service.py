"""Unified push notification dispatcher.

Fans push out across three transports:
  - Expo Push (non-chat mobile notifications — uses Expo's cross-platform layer)
  - Firebase Cloud Messaging direct (chat notifications — needs per-chat
    collapse_key and iOS thread-id which Expo Push doesn't expose)
  - Web Push (browsers via VAPID)

Tokens rejected as gone (DeviceNotRegistered / HTTP 410 / FCM Unregistered) are
flagged inactive so we stop wasting requests on them.

Synchronous on purpose — signals call this inline. If push volume grows we can
move the dispatch into a Celery task without changing the call sites.
"""

from __future__ import annotations

import json
import logging
import threading
from typing import Any, Iterable

from django.conf import settings
from exponent_server_sdk import (
    DeviceNotRegisteredError,
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)
from pywebpush import WebPushException, webpush
from requests.exceptions import ConnectionError, HTTPError

from api.models import DeviceToken

logger = logging.getLogger(__name__)

# Firebase Admin is imported lazily so the backend can boot without Firebase
# credentials configured — non-chat features keep working through Expo Push.
_firebase_init_lock = threading.Lock()
_firebase_initialized: bool | None = None  # None=untried, True=ready, False=disabled


def _ensure_firebase_initialized() -> bool:
    """Initialize Firebase Admin SDK once, lazily. Returns True if usable."""
    global _firebase_initialized
    if _firebase_initialized is not None:
        return _firebase_initialized

    with _firebase_init_lock:
        if _firebase_initialized is not None:
            return _firebase_initialized

        cred_path = getattr(settings, "FIREBASE_CREDENTIALS_PATH", "") or ""
        if not cred_path:
            logger.info("push: FIREBASE_CREDENTIALS_PATH not set; FCM disabled")
            _firebase_initialized = False
            return False

        try:
            import firebase_admin
            from firebase_admin import credentials

            # initialize_app raises if already called — guard with _apps check.
            if not firebase_admin._apps:
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            _firebase_initialized = True
            logger.info("push: Firebase Admin initialized from %s", cred_path)
            return True
        except Exception as exc:
            logger.exception("push: Firebase Admin init failed: %s", exc)
            _firebase_initialized = False
            return False


class PushService:
    """Send notifications to all of a user's registered devices."""

    def send_to_user(
        self,
        user_id: int,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
        deep_link: str | None = None,
        channel_id: str = "default_v2",
        category_id: str | None = None,
    ) -> dict[str, int]:
        """Dispatch to every active token. Returns a counts summary.

        channel_id (Android): use per-type channels ("messages", "offers", etc.)
        so users can configure / mute by category in system settings.

        category_id (iOS): notification category — used for action buttons and
        as a grouping hint. Note: Expo Push API does NOT forward iOS
        thread-identifier, so true per-chat collapse requires a Notification
        Service Extension in a custom dev client. Best we can do here is
        consistent categoryId so the OS groups by app + category.
        """
        tokens = list(
            DeviceToken.objects.filter(user_id=user_id, is_active=True)
        )
        if not tokens:
            logger.info("push: user %s has no active device tokens", user_id)
            return {"sent": 0, "failed": 0, "pruned": 0}

        payload = dict(data or {})
        if deep_link:
            payload["deep_link"] = deep_link

        expo_tokens = [t for t in tokens if t.platform == DeviceToken.PLATFORM_EXPO]
        web_tokens = [t for t in tokens if t.platform == DeviceToken.PLATFORM_WEB]
        fcm_tokens = [t for t in tokens if t.platform == DeviceToken.PLATFORM_FCM]

        # Chat notifications use a WhatsApp-style aggregated FCM path: one
        # notification card per user showing the last N unread messages, with
        # collapse_key + thread-id so new messages REPLACE the previous card.
        # Falls back to Expo if the user has no FCM tokens yet.
        is_chat = payload.get("type") == "message"

        if is_chat and fcm_tokens:
            summary = self._build_chat_summary(user_id)
            chat_title = summary["title"] or title
            chat_body = summary["body"] or body
            fcm_summary = self._send_fcm_chat(
                fcm_tokens,
                user_id,
                chat_title,
                chat_body,
                payload,
                badge=summary["count"],
                avatar_url=summary.get("avatar", ""),
            )
            # Skip Expo for chat when FCM is available — avoids duplicate cards.
            expo_summary = {"sent": 0, "failed": 0, "pruned": 0}
        else:
            expo_summary = self._send_expo(
                expo_tokens, title, body, payload, channel_id, category_id
            )
            fcm_summary = {"sent": 0, "failed": 0, "pruned": 0}

        web_summary = self._send_web(web_tokens, title, body, payload)

        return {
            "sent": expo_summary["sent"] + web_summary["sent"] + fcm_summary["sent"],
            "failed": expo_summary["failed"] + web_summary["failed"] + fcm_summary["failed"],
            "pruned": expo_summary["pruned"] + web_summary["pruned"] + fcm_summary["pruned"],
        }

    # ── Chat summary (WhatsApp-style aggregation) ──────────────────────────
    # Queries the recipient's last N unread messages across all chats and
    # formats them into a single notification body. Used by the FCM chat path
    # so each new message REPLACES the previous notification card (via
    # collapse_key) showing the latest 3-4 unread lines.
    _CHAT_BODY_LINES = 3
    _CHAT_LINE_MAXLEN = 50

    def _build_chat_summary(self, user_id: int) -> dict[str, Any]:
        from django.db.models import Q

        from api.models.chat import Message

        base_qs = (
            Message.objects
            .filter(
                Q(chat__participant1_id=user_id) | Q(chat__participant2_id=user_id),
                is_read=False,
            )
            .exclude(sender_id=user_id)
            .exclude(hidden_for_users__id=user_id)
        )
        recent = list(
            base_qs.select_related("sender", "chat").order_by("-created_at")[
                : self._CHAT_BODY_LINES
            ]
        )
        if not recent:
            return {"title": "", "body": "", "count": 0, "chat_ids": []}

        total = base_qs.count()
        sender_ids = {m.sender_id for m in recent}
        chat_ids = list({str(m.chat_id) for m in recent})

        if len(sender_ids) == 1:
            sender_name = (
                recent[0].sender.get_full_name() or recent[0].sender.username
            )
            title = (
                sender_name if total == 1 else f"{sender_name} ({total} messages)"
            )
        else:
            title = f"{total} new messages"

        lines: list[str] = []
        # Reverse to oldest-of-recent first so the newest sits at the bottom
        # of the notification body — matches how WhatsApp orders its preview.
        for msg in reversed(recent):
            preview = (msg.content or "")[: self._CHAT_LINE_MAXLEN]
            if len(sender_ids) > 1:
                name = msg.sender.get_full_name() or msg.sender.username
                lines.append(f"{name}: {preview}")
            else:
                lines.append(preview)

        if total > len(recent):
            lines.append(f"…and {total - len(recent)} more")

        # Use the most-recent message's sender avatar — WhatsApp does the same
        # when a grouped notification spans multiple chats. Resolve to an
        # absolute URL: FCM (and our local-notification renderer) need a fully
        # qualified URL the device can fetch.
        raw_avatar = getattr(recent[0].sender, "avatar", "") or ""
        latest_avatar = self._absolute_avatar_url(raw_avatar)

        return {
            "title": title,
            "body": "\n".join(lines),
            "count": total,
            "chat_ids": chat_ids,
            "avatar": latest_avatar,
        }

    @staticmethod
    def _absolute_avatar_url(raw: str) -> str:
        if not raw:
            return ""
        if raw.startswith(("http://", "https://")):
            return raw
        from django.conf import settings
        from django.core.files.storage import default_storage

        try:
            url = default_storage.url(raw)
        except Exception:
            url = raw
        if url.startswith(("http://", "https://")):
            return url
        base = (getattr(settings, "SITE_URL", "") or "").rstrip("/")
        if not base:
            return ""
        return f"{base}/{url.lstrip('/')}"

    # ── FCM (chat notifications) ───────────────────────────────────────────
    def _send_fcm_chat(
        self,
        tokens: list[DeviceToken],
        user_id: int,
        title: str,
        body: str,
        data: dict[str, Any],
        badge: int = 0,
        avatar_url: str = "",
    ) -> dict[str, int]:
        if not tokens:
            return {"sent": 0, "failed": 0, "pruned": 0}
        if not _ensure_firebase_initialized():
            # Firebase not configured — count as failed so the caller knows
            # delivery didn't happen, but don't crash.
            logger.warning(
                "push: FCM tokens present but firebase-admin not initialized; "
                "skipping %d tokens for user %s", len(tokens), user_id
            )
            return {"sent": 0, "failed": len(tokens), "pruned": 0}

        from firebase_admin import messaging
        from firebase_admin.exceptions import FirebaseError

        sent = failed = pruned = 0
        collapse_id = f"chat:{user_id}"
        # Data-only message: the app builds the local notification itself so
        # it can attach the inline-reply action (FCM `notification` messages
        # can't carry expo-notifications categories to Android). FCM requires
        # string keys AND string values in the data payload.
        merged_data = {
            **data,
            "title": title,
            "body": body,
            "avatar": avatar_url or "",
            "badge": badge,
            "collapse_id": collapse_id,
            "type": "chat_summary",
        }
        string_data = {k: str(v) for k, v in merged_data.items()}

        for dt in tokens:
            message = messaging.Message(
                token=dt.token,
                # No `notification` field — the app handles display via
                # setBackgroundMessageHandler + scheduleNotificationAsync.
                data=string_data,
                android=messaging.AndroidConfig(
                    priority="high",
                    collapse_key=collapse_id,
                ),
                apns=messaging.APNSConfig(
                    headers={
                        "apns-collapse-id": collapse_id,
                        "apns-priority": "10",
                        "apns-push-type": "background",
                    },
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            content_available=True,
                            thread_id=collapse_id,
                        ),
                    ),
                ),
            )
            try:
                messaging.send(message)
                sent += 1
            except messaging.UnregisteredError:
                self._deactivate(dt, "FCM unregistered")
                pruned += 1
            except messaging.SenderIdMismatchError:
                self._deactivate(dt, "FCM sender mismatch")
                pruned += 1
            except FirebaseError as exc:
                logger.warning("push: FCM error for token %s: %s", dt.id, exc)
                failed += 1
            except Exception as exc:
                logger.exception(
                    "push: unexpected FCM error for token %s: %s", dt.id, exc
                )
                failed += 1

        return {"sent": sent, "failed": failed, "pruned": pruned}

    # ── Expo ────────────────────────────────────────────────────────────────
    def _send_expo(
        self,
        tokens: list[DeviceToken],
        title: str,
        body: str,
        data: dict[str, Any],
        channel_id: str = "default_v2",
        category_id: str | None = None,
    ) -> dict[str, int]:
        sent = failed = pruned = 0
        if not tokens:
            return {"sent": 0, "failed": 0, "pruned": 0}

        client = PushClient()
        for dt in tokens:
            if not PushClient.is_exponent_push_token(dt.token):
                # Stored value isn't a valid Expo token — likely a legacy FCM
                # token from before the migration. Prune it.
                self._deactivate(dt, "not an Expo push token")
                pruned += 1
                continue

            message_kwargs = dict(
                to=dt.token,
                title=title,
                body=body,
                data=data,
                sound="default",
                priority="high",
                channel_id=channel_id,
            )
            if category_id:
                message_kwargs["category"] = category_id
            message = PushMessage(**message_kwargs)
            try:
                response = client.publish(message)
                response.validate_response()
                sent += 1
            except DeviceNotRegisteredError:
                self._deactivate(dt, "DeviceNotRegistered")
                pruned += 1
            except (PushTicketError, PushServerError) as exc:
                logger.warning("push: Expo error for token %s: %s", dt.id, exc)
                failed += 1
            except (ConnectionError, HTTPError) as exc:
                logger.warning("push: Expo network error for token %s: %s", dt.id, exc)
                failed += 1
            except Exception as exc:
                logger.exception("push: unexpected Expo error for token %s: %s", dt.id, exc)
                failed += 1

        return {"sent": sent, "failed": failed, "pruned": pruned}

    # ── Web Push ────────────────────────────────────────────────────────────
    def _send_web(
        self,
        tokens: list[DeviceToken],
        title: str,
        body: str,
        data: dict[str, Any],
    ) -> dict[str, int]:
        sent = failed = pruned = 0
        if not tokens:
            return {"sent": 0, "failed": 0, "pruned": 0}

        private_key = getattr(settings, "VAPID_PRIVATE_KEY", "") or ""
        claim_email = getattr(settings, "VAPID_CLAIM_EMAIL", "") or ""
        if not private_key or not claim_email:
            logger.warning("push: VAPID not configured; skipping %d web tokens", len(tokens))
            return {"sent": 0, "failed": len(tokens), "pruned": 0}

        vapid_claims = {"sub": f"mailto:{claim_email}"}
        message = json.dumps({"title": title, "body": body, "data": data})

        for dt in tokens:
            try:
                subscription_info = json.loads(dt.token)
            except (ValueError, TypeError):
                self._deactivate(dt, "malformed web subscription JSON")
                pruned += 1
                continue

            try:
                webpush(
                    subscription_info=subscription_info,
                    data=message,
                    vapid_private_key=private_key,
                    vapid_claims=vapid_claims.copy(),
                    ttl=60 * 60 * 24,
                )
                sent += 1
            except WebPushException as exc:
                status_code = getattr(exc.response, "status_code", None) if exc.response is not None else None
                if status_code in (404, 410):
                    self._deactivate(dt, f"web push HTTP {status_code}")
                    pruned += 1
                else:
                    logger.warning("push: web push error for token %s: %s", dt.id, exc)
                    failed += 1
            except Exception as exc:
                logger.exception("push: unexpected web push error for token %s: %s", dt.id, exc)
                failed += 1

        return {"sent": sent, "failed": failed, "pruned": pruned}

    # ── helpers ─────────────────────────────────────────────────────────────
    @staticmethod
    def _deactivate(dt: DeviceToken, reason: str) -> None:
        DeviceToken.objects.filter(pk=dt.pk).update(is_active=False)
        logger.info("push: deactivated token %s (%s)", dt.id, reason)


push_service = PushService()
