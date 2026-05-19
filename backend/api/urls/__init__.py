from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views.category import CategoryViewSet
from api.views.ad import AdViewSet
from api.views.review import ReviewViewSet
from api.views.notification import NotificationViewSet
from api.views.chat import ChatViewSet, MessageViewSet, UserOnlineStatusViewSet
from api.views.saved_ad import SavedAdViewSet
from api.views.region import RegionViewSet
from api.views.country import CountryViewSet
from api.views.lead import LeadViewSet
from api.views.kyc import KYCViewSet
from api.views.payments import PaymentViewSet, PromotionPackageViewSet
from api.views.media import serve_media
from api.views.search import track_search
from api.views.report import ReportViewSet, SupportMessageViewSet
from api.views.device_token import DeviceTokenView, VapidPublicKeyView

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'ads', AdViewSet, basename='ad')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'chats', ChatViewSet, basename='chat')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'online-status', UserOnlineStatusViewSet, basename='online-status')
router.register(r'saved-ads', SavedAdViewSet, basename='saved-ad')
router.register(r'regions', RegionViewSet, basename='region')
router.register(r'countries', CountryViewSet, basename='country')
router.register(r'leads', LeadViewSet, basename='lead')
router.register(r'kyc', KYCViewSet, basename='kyc') # Added this registration
router.register(r'payments', PaymentViewSet, basename='payment')
router.register(r'promotion-packages', PromotionPackageViewSet, basename='promotion-package')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'support-messages', SupportMessageViewSet, basename='support-message')

urlpatterns = [
    path('auth/', include('api.urls.auth')),
    path('admin/', include('api.urls.admin')),
    path('media/<path:path>', serve_media, name='serve_media'),
    path('track-search/', track_search, name='track_search'),
    path('device-tokens/', DeviceTokenView.as_view(), name='device-tokens'),
    path('push/vapid-key/', VapidPublicKeyView.as_view(), name='push-vapid-key'),
    path('', include(router.urls)),
]

