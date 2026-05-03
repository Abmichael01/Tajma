from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from unittest.mock import patch
from decimal import Decimal

from api.models import Ad, Category, PromotionPackage, Transaction


User = get_user_model()


class PromotionPaymentTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.seller = User.objects.create_user(
            email='seller@example.com',
            username='seller',
            password='password123',
        )
        self.category = Category.objects.create(name='Phones', category_type='product')
        self.ad = Ad.objects.create(
            seller=self.seller,
            category=self.category,
            title='Test Phone',
            description='Clean phone',
            price='1000.00',
            status='published',
        )
        self.client.force_authenticate(self.seller)

    @override_settings(PAYSTACK_SECRET_KEY='sk_test_123')
    def test_promotion_requires_active_admin_package(self):
        response = self.client.post(
            '/api/payments/initiate-promotion/',
            {
                'ad_id': str(self.ad.id),
                'promotion_type': 'boost',
                'days': 7,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Transaction.objects.count(), 0)

    @override_settings(PAYSTACK_SECRET_KEY='sk_test_123')
    @patch('api.views.payments.PaystackService.initialize_transaction')
    def test_promotion_uses_admin_package_price(self, mock_initialize):
        package = PromotionPackage.objects.create(
            name='Weekly Boost',
            promotion_type='boost',
            price='2500.00',
            discount_price='2000.00',
            duration_days=7,
            is_active=True,
        )
        mock_initialize.return_value = {
            'authorization_url': 'https://paystack.example/checkout',
        }

        response = self.client.post(
            '/api/payments/initiate-promotion/',
            {
                'ad_id': str(self.ad.id),
                'promotion_type': 'boost',
                'days': 7,
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        transaction = Transaction.objects.get()
        self.assertEqual(transaction.amount, Decimal(package.current_price))
        self.assertEqual(transaction.metadata['package_id'], str(package.id))
        mock_initialize.assert_called_once()
