import requests
import time
import hashlib
import hmac
import base64
import json
from django.conf import settings
from django.utils import timezone

class SmileIDClient:
    """
    Minimal Smile ID client using requests.
    """
    def __init__(self):
        self.partner_id = settings.SMILE_ID_PARTNER_ID
        self.api_key = settings.SMILE_ID_API_KEY
        self.is_sandbox = settings.SMILE_ID_SANDBOX
        self.base_url = "https://api.smileidentity.com/v1" if not self.is_sandbox else "https://sandbox.smileidentity.com/v1"

    def _generate_signature(self, timestamp):
        """
        Generate signature for Smile ID API.
        """
        message = f"{timestamp}{self.partner_id}sid_request"
        signature = hmac.new(
            self.api_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(signature).decode('utf-8')

    def get_web_token(self, user_id, job_id, job_type=6, id_type=None, country=None):
        """
        Get a web token for Hosted Web/Smart Camera.
        Job Type 6 is Document Verification.
        """
        url = f"{self.base_url}/token"
        timestamp = int(time.time() * 1000)
        
        payload = {
            "partner_id": self.partner_id,
            "timestamp": timestamp,
            "signature": self._generate_signature(timestamp),
            "user_id": user_id,
            "job_id": job_id,
            "job_type": job_type,
            "callback_url": settings.SMILE_ID_CALLBACK_URL
        }
        
        if id_type:
            payload["id_type"] = id_type
        if country:
            payload["country"] = country
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Smile ID Token Error: {e}")
            return None

    def get_job_status(self, user_id, job_id):
        """
        Poll job status (if webhook fails or for immediate check).
        """
        url = f"{self.base_url}/job_status"
        timestamp = int(time.time() * 1000)
        
        payload = {
            "partner_id": self.partner_id,
            "timestamp": timestamp,
            "signature": self._generate_signature(timestamp),
            "user_id": user_id,
            "job_id": job_id
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Smile ID Status Error: {e}")
            return None
