from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views.category import CategoryViewSet
from api.views.ad import AdViewSet
from api.views.review import ReviewViewSet
from api.views.notification import NotificationViewSet
from api.views.chat import ChatViewSet, MessageViewSet, UserOnlineStatusViewSet
from api.views.saved_ad import SavedAdViewSet
from api.views.region import RegionViewSet
from api.views.media import serve_media

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

urlpatterns = [
    path('auth/', include('api.urls.auth')),
    path('admin/', include('api.urls.admin')),
    path('media/<path:path>', serve_media, name='serve_media'),  # API endpoint for media files
    path('', include(router.urls)),
]

