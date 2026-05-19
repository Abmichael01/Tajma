"""Generate a VAPID keypair for Web Push.

Run once per environment. Paste the printed values into the matching env vars
(VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_CLAIM_EMAIL). Rotating these will
invalidate every existing browser subscription, so do it deliberately.
"""

import base64

from django.core.management.base import BaseCommand
from py_vapid import Vapid


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


class Command(BaseCommand):
    help = "Generate a VAPID public/private keypair for Web Push notifications."

    def handle(self, *args, **options):
        vapid = Vapid()
        vapid.generate_keys()

        # Public key: 65-byte uncompressed P-256 point, base64url for browsers.
        public_numbers = vapid.public_key.public_numbers()
        raw_public = b"\x04" + public_numbers.x.to_bytes(32, "big") + public_numbers.y.to_bytes(32, "big")
        public_b64 = _b64url(raw_public)

        # Private key: 32-byte scalar, base64url for pywebpush.
        private_value = vapid.private_key.private_numbers().private_value
        raw_private = private_value.to_bytes(32, "big")
        private_b64 = _b64url(raw_private)

        self.stdout.write(self.style.SUCCESS("VAPID keypair generated.\n"))
        self.stdout.write("Add these to your env (or .env file):\n")
        self.stdout.write(f"VAPID_PUBLIC_KEY={public_b64}")
        self.stdout.write(f"VAPID_PRIVATE_KEY={private_b64}")
        self.stdout.write("VAPID_CLAIM_EMAIL=admin@yourdomain.com")
        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING(
                "The public key is also what the web client uses when calling "
                "PushManager.subscribe(). It is exposed via GET /api/push/vapid-key/."
            )
        )
