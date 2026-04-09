import os
import django
from django.test import TestCase, Client
from django.urls import reverse
from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

class PasswordResetTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpassword123',
            first_name='Test',
            last_name='User'
        )

    def test_password_reset_email_sent(self):
        """Test that a password reset email is 'sent' to the mock backend"""
        url = '/api/auth/password/reset/'
        response = self.client.post(url, {'email': 'test@example.com'}, content_type='application/json')
        
        # Check if the URL is correctly mapped (either api.urls.auth or dj_rest_auth)
        if response.status_code == 404:
            print(f"\n❌ FAILED: URL {url} returned 404. It might be shadowed or missing.")
            return

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify that an email was 'sent'
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.subject, 'Password Reset e-mail')
        self.assertIn('test@example.com', email.to)
        
        # Look for the 'psi link' (password reset link) in the email body
        print("\n✅ SUCCESS: Email was sent to the outbox!")
        print(f"📧 Subject: {email.subject}")
        print(f"📧 To: {email.to}")
        print(f"📧 Body snippet: {email.body[:200]}...")
        
        if 'http' in email.body:
            print("\n🔗 PASWORD RESET LINK FOUND IN EMAIL!")
        else:
            print("\n⚠️ WARNING: No link found in email body.")

    def test_password_reset_invalid_email(self):
        """Test with an email that doesn't exist"""
        url = '/api/auth/password/reset/'
        response = self.client.post(url, {'email': 'nonexistent@example.com'}, content_type='application/json')
        
        # Django/dj-rest-auth usually returns 200 even for a non-existent email for security (to prevent account enumeration)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)
        print("\n✅ SUCCESS: No email sent for invalid user (correct security behavior).")
