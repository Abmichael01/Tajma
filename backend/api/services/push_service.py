"""Unified push notification dispatcher.

Replaces the legacy FCMService. Sends to every active DeviceToken for a user,
fanning out across platforms (Expo for mobile, Web Push for browsers). Tokens
that the upstream provider rejects as gone (DeviceNotRegistered / HTTP 410)
are flagged inactive so we stop wasting requests on them.

Synchronous on purpose — signals call this inline. If push volume grows we can
move the dispatch into a Celery task without changing the call sites.
"""

from __future__ import annotations

import json
import logging
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


class PushService:
    """Send notifications to all of a user's registered devices."""

    def send_to_user(
        self,
        user_id: int,
        title: str,
        body: str,
        data: dict[str, Any] | None = None,
        deep_link: str | None = None,
        channel_id: str = "default",
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

        expo_summary = self._send_expo(
            expo_tokens, title, body, payload, channel_id, category_id
        )
        web_summary = self._send_web(web_tokens, title, body, payload)

        return {
            "sent": expo_summary["sent"] + web_summary["sent"],
            "failed": expo_summary["failed"] + web_summary["failed"],
            "pruned": expo_summary["pruned"] + web_summary["pruned"],
        }

    # ── Expo ────────────────────────────────────────────────────────────────
    def _send_expo(
        self,
        tokens: list[DeviceToken],
        title: str,
        body: str,
        data: dict[str, Any],
        channel_id: str = "default",
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
