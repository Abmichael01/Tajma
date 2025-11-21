from django.urls import include, path
from rest_framework.routers import DefaultRouter

from api.views.category import CategoryViewSet
from api.views.ad import AdViewSet
from api.views.review import ReviewViewSet
from api.views.notification import NotificationViewSet
from api.views.chat import ChatViewSet, MessageViewSet, UserOnlineStatusViewSet
from api.views.saved_ad import SavedAdViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'ads', AdViewSet, basename='ad')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'chats', ChatViewSet, basename='chat')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'online-status', UserOnlineStatusViewSet, basename='online-status')
router.register(r'saved-ads', SavedAdViewSet, basename='saved-ad')

urlpatterns = [
    path('auth/', include('api.urls.auth')),
    path('', include(router.urls)),
]

