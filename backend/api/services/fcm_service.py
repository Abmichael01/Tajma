import logging
import os
import firebase_admin
from firebase_admin import credentials, messaging
from django.conf import settings

logger = logging.getLogger(__name__)

class FCMService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FCMService, cls).__new__(cls)
        return cls._instance

    def initialize(self):
        if self._initialized:
            return
        
        try:
            # Look for service account file in environment or settings
            cert_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_JSON')
            
            if cert_path and os.path.exists(cert_path):
                cred = credentials.Certificate(cert_path)
                firebase_admin.initialize_app(cred)
                self._initialized = True
                logger.info("FCM Service initialized successfully with service account.")
            else:
                # In development or if not provided, try default initialization
                # This works if running on Google Cloud with proper IAM roles
                try:
                    firebase_admin.initialize_app()
                    self._initialized = True
                    logger.info("FCM Service initialized with default credentials.")
                except Exception as e:
                    logger.warning(f"FCM Service could not be initialized: {e}. Push notifications will be disabled.")
        except Exception as e:
            logger.error(f"Error initializing FCM Service: {e}")

    def send_to_user(self, user, title, body, data=None):
        """Send a notification to a specific user's device"""
        if not self._initialized:
            self.initialize()
            if not self._initialized: return None

        if not user.fcm_device_token:
            logger.info(f"User {user.email} has no fcm_device_token. Skipping notification.")
            return None

        # Create message payload
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=user.fcm_device_token,
            android=messaging.AndroidConfig(
                priority='high',
                notification=messaging.AndroidNotification(
                    channel_id='default',
                    color='#FF4F18',
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(badge=1),
                ),
            ),
        )

        try:
            response = messaging.send(message)
            logger.info(f"Successfully sent FCM notification to {user.email}: {response}")
            return response
        except Exception as e:
            logger.error(f"Error sending FCM notification to {user.email}: {e}")
            return None

    def send_multicast(self, tokens, title, body, data=None):
        """Send a notification to multiple device tokens"""
        if not self._initialized:
            self.initialize()
            if not self._initialized: return None

        if not tokens: return None

        message = messaging.MulticastMessage(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            tokens=tokens,
        )

        try:
            response = messaging.send_multicast(message)
            logger.info(f"Sent multicast FCM notification: {response.success_count} successes, {response.failure_count} failures")
            return response
        except Exception as e:
            logger.error(f"Error sending multicast FCM notification: {e}")
            return None

# Global singleton
fcm_service = FCMService()
