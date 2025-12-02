from django.urls import path
from rest_framework.routers import DefaultRouter

from api.views.admin import (
    AdminStatsViewSet,
    AdminUserViewSet,
    AdminAdViewSet,
    AdminCategoryViewSet,
    AdminNotificationViewSet,
    AdminChatViewSet,
    AdminMessageViewSet,
)

router = DefaultRouter()
router.register(r'stats', AdminStatsViewSet, basename='admin-stats')
router.register(r'users', AdminUserViewSet, basename='admin-user')
router.register(r'ads', AdminAdViewSet, basename='admin-ad')
router.register(r'categories', AdminCategoryViewSet, basename='admin-category')
router.register(r'notifications', AdminNotificationViewSet, basename='admin-notification')
router.register(r'chats', AdminChatViewSet, basename='admin-chat')
router.register(r'messages', AdminMessageViewSet, basename='admin-message')

urlpatterns = router.urls



