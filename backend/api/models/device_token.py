import uuid

from django.conf import settings
from django.db import models


class DeviceToken(models.Model):
    """One row per (user, device). Replaces the legacy `User.fcm_device_token`
    single-token-per-user assumption so push reaches every signed-in device."""

    PLATFORM_EXPO = "expo"
    PLATFORM_WEB = "web"
    PLATFORM_FCM = "fcm"
    PLATFORM_CHOICES = [
        (PLATFORM_EXPO, "Expo (iOS/Android)"),
        (PLATFORM_WEB, "Web Push"),
        (PLATFORM_FCM, "Firebase Cloud Messaging (native iOS/Android)"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_tokens",
    )
    # Expo tokens: short string `ExponentPushToken[xxxx]`.
    # Web tokens: JSON-encoded PushSubscription (endpoint + keys), can run ~500 chars.
    token = models.TextField()
    platform = models.CharField(max_length=10, choices=PLATFORM_CHOICES)
    user_agent = models.CharField(max_length=255, blank=True, default="")
    is_active = models.BooleanField(default=True)
    last_seen = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["user", "token"], name="unique_user_device_token"
            ),
        ]
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["platform", "is_active"]),
        ]

    def __str__(self) -> str:
        suffix = self.token[-12:] if len(self.token) > 12 else self.token
        return f"{self.user_id}/{self.platform}/…{suffix}"
