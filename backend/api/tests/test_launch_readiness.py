import os
from django.test import TestCase, override_settings
from django.conf import settings
from unittest.mock import patch

class LaunchReadinessTest(TestCase):
    """
    Tests to ensure Phase 5 production readiness changes are correctly implemented.
    Verifies storage strategy, security hardening, and API throttling.
    """

    def test_throttle_rates(self):
        """Verify the new throttle rates are correctly loaded (500/5000)"""
        throttle_rates = settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
        self.assertEqual(throttle_rates.get('anon'), '500/day')
        self.assertEqual(throttle_rates.get('user'), '5000/day')

    def test_cors_and_csrf_trusted_origins(self):
        """Verify tajma.net is in the trusted origins"""
        self.assertIn('https://tajma.net', settings.CSRF_TRUSTED_ORIGINS)
        self.assertIn('https://www.tajma.net', settings.CSRF_TRUSTED_ORIGINS)

    def test_security_cookie_logic(self):
        """
        Verify security cookie logic behaves correctly based on ENV.
        We check the current state (development) first.
        """
        env = os.getenv('ENV', 'development')
        if env == 'development':
            self.assertFalse(settings.SESSION_COOKIE_SECURE)
            self.assertFalse(settings.CSRF_COOKIE_SECURE)
        elif env == 'production':
            self.assertTrue(settings.SESSION_COOKIE_SECURE)
            self.assertTrue(settings.CSRF_COOKIE_SECURE)

    def test_storage_strategy_fallback(self):
        """
        Verify that in development, we always use FileSystemStorage.
        """
        env = os.getenv('ENV', 'development')
        if env == 'development':
            from django.core.files.storage import FileSystemStorage, storages
            storage = storages['default']
            self.assertTrue(isinstance(storage, FileSystemStorage))

    def test_well_known_assets_presence(self):
        """Verify the deep link assets are in place (checked via backend test for convenience)"""
        frontend_public = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public')
        apple_path = os.path.join(frontend_public, '.well-known', 'apple-app-site-association')
        assetlinks_path = os.path.join(frontend_public, '.well-known', 'assetlinks.json')
        
        self.assertTrue(os.path.exists(apple_path), "apple-app-site-association is missing")
        self.assertTrue(os.path.exists(assetlinks_path), "assetlinks.json is missing")

