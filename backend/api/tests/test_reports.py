from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIClient

from api.models import Ad, Category, Report


User = get_user_model()


class ReportFlowTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.seller = User.objects.create_user(
            email='seller@example.com',
            username='seller',
            password='password123',
        )
        self.reporter = User.objects.create_user(
            email='reporter@example.com',
            username='reporter',
            password='password123',
        )
        self.admin = User.objects.create_user(
            email='admin@example.com',
            username='admin',
            password='password123',
            is_staff=True,
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

    def test_user_can_report_ad_with_valid_reason(self):
        self.client.force_authenticate(self.reporter)

        response = self.client.post(
            '/api/reports/',
            {
                'report_type': 'ad',
                'related_ad': str(self.ad.id),
                'reason': 'counterfeit',
                'description': 'This looks like a fake listing.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        report = Report.objects.get(id=response.data['id'])
        self.assertEqual(report.reporter, self.reporter)
        self.assertEqual(report.related_ad, self.ad)
        self.assertEqual(report.reported_user, self.seller)
        self.assertEqual(report.status, 'pending')

    def test_user_cannot_report_own_ad(self):
        self.client.force_authenticate(self.seller)

        response = self.client.post(
            '/api/reports/',
            {
                'report_type': 'ad',
                'related_ad': str(self.ad.id),
                'reason': 'scam',
                'description': 'Trying to report my own ad.',
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Report.objects.count(), 0)

    def test_admin_can_dismiss_report(self):
        report = Report.objects.create(
            reporter=self.reporter,
            report_type='ad',
            related_ad=self.ad,
            reported_user=self.seller,
            reason='spam',
            description='This appears suspicious.',
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            f'/api/admin/reports/{report.id}/dismiss/',
            {'resolution_note': 'No issue found.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        report.refresh_from_db()
        self.assertEqual(report.status, 'dismissed')
        self.assertEqual(report.resolved_by, self.admin)
        self.assertEqual(report.messages.count(), 1)

    def test_admin_can_archive_reported_ad(self):
        report = Report.objects.create(
            reporter=self.reporter,
            report_type='ad',
            related_ad=self.ad,
            reported_user=self.seller,
            reason='spam',
            description='This appears suspicious.',
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            f'/api/admin/reports/{report.id}/archive-ad/',
            {'note': 'Archived after review.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.ad.refresh_from_db()
        report.refresh_from_db()
        self.assertEqual(self.ad.status, 'archived')
        self.assertEqual(report.status, 'under_review')
        self.assertEqual(report.messages.count(), 1)

    def test_admin_can_warn_reported_user(self):
        report = Report.objects.create(
            reporter=self.reporter,
            report_type='ad',
            related_ad=self.ad,
            reported_user=self.seller,
            reason='spam',
            description='This appears suspicious.',
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            f'/api/admin/reports/{report.id}/warn-user/',
            {'message': 'Please follow marketplace rules.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self.seller.notifications.count(), 1)
        self.assertEqual(report.messages.count(), 1)

    def test_admin_can_suspend_reported_user(self):
        report = Report.objects.create(
            reporter=self.reporter,
            report_type='ad',
            related_ad=self.ad,
            reported_user=self.seller,
            reason='spam',
            description='This appears suspicious.',
        )
        self.client.force_authenticate(self.admin)

        response = self.client.post(
            f'/api/admin/reports/{report.id}/suspend-user/',
            {'note': 'Repeated policy violations.'},
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.seller.refresh_from_db()
        self.assertFalse(self.seller.is_active)
