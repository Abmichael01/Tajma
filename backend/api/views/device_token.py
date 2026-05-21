import logging

from django.conf import settings
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from api.models import DeviceToken

logger = logging.getLogger(__name__)


class DeviceTokenView(APIView):
    """Register / unregister a push notification token for the authenticated user.

    Replaces the legacy `/auth/fcm-token/` endpoint with multi-device support.
    The same row is reused if a (user, token) pair already exists, so re-running
    register on every app launch is safe and idempotent.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = (request.data.get("token") or "").strip()
        platform = (request.data.get("platform") or "").strip()
        user_agent = (request.data.get("user_agent") or "")[:255]

        if not token:
            return Response({"detail": "token is required."}, status=status.HTTP_400_BAD_REQUEST)
        if platform not in {
            DeviceToken.PLATFORM_EXPO,
            DeviceToken.PLATFORM_WEB,
            DeviceToken.PLATFORM_FCM,
        }:
            return Response(
                {"detail": "platform must be 'expo', 'web', or 'fcm'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # If the same token was registered to a different user (e.g. shared
        # device after logout/login), reassign rather than violate uniqueness.
        DeviceToken.objects.filter(token=token).exclude(user=request.user).update(
            is_active=False
        )

        obj, created = DeviceToken.objects.update_or_create(
            user=request.user,
            token=token,
            defaults={
                "platform": platform,
                "user_agent": user_agent,
                "is_active": True,
            },
        )
        logger.info(
            "device token %s for user %s (platform=%s)",
            "registered" if created else "refreshed",
            request.user.id,
            platform,
        )
        return Response(
            {"id": str(obj.id), "created": created},
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def delete(self, request):
        token = (request.data.get("token") or "").strip()
        if not token:
            return Response({"detail": "token is required."}, status=status.HTTP_400_BAD_REQUEST)

        deleted, _ = DeviceToken.objects.filter(user=request.user, token=token).delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


class VapidPublicKeyView(APIView):
    """Public endpoint — exposes the VAPID public key so browsers can subscribe
    to web push notifications. The matching private key stays on the server."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        public_key = getattr(settings, "VAPID_PUBLIC_KEY", "") or ""
        if not public_key:
            return Response(
                {"detail": "Web push is not configured on this server."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        return Response({"public_key": public_key})
