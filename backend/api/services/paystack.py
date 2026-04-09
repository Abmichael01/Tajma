import requests
import json
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

class PaystackService:
    """Paystack API service for Tajma Marketplace"""
    
    BASE_URL = "https://api.paystack.co"
    
    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def initialize_transaction(self, email, amount, reference, metadata=None):
        """
        Initialize a transaction with Paystack.
        Amount should be in the smallest currency unit (e.g., kobo for NGN, or just the amount if XOF is parity 1:1, but usually Paystack expects 100x).
        Actually Paystack XOF/NGN expects 100x.
        """
        url = f"{self.BASE_URL}/transaction/initialize"
        
        # Paystack expects amount in sub-units (e.g. cents/kobo)
        # For XOF, Paystack also uses 100x
        payload = {
            "email": email,
            "amount": int(float(amount) * 100),
            "reference": reference,
            "callback_url": f"{settings.FRONTEND_URL}/payment/verify",
            "metadata": metadata or {}
        }
        
        try:
            response = requests.post(url, headers=self.headers, data=json.dumps(payload))
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status'):
                return response_data.get('data') # contains authorization_url, access_code, reference
            else:
                logger.error(f"Paystack initialization failed: {response_data}")
                return None
        except Exception as e:
            logger.exception(f"Exception during Paystack initialization: {e}")
            return None

    def verify_transaction(self, reference):
        """Verify a transaction status with Paystack"""
        url = f"{self.BASE_URL}/transaction/verify/{reference}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response_data = response.json()
            
            if response.status_code == 200 and response_data.get('status'):
                return response_data.get('data')
            else:
                logger.error(f"Paystack verification failed: {response_data}")
                return None
        except Exception as e:
            logger.exception(f"Exception during Paystack verification: {e}")
            return None
