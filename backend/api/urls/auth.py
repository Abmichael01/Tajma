"""
Authentication URL patterns
"""
from django.urls import path
from dj_rest_auth.views import PasswordResetView, PasswordResetConfirmView
from api.views.auth import RegisterView, CSRFView, PasswordChangeView, LoginView, ProfileUpdateView, CurrentUserView, LogoutView, TokenRefreshView
from api.views.profile import UserProfileView, UserBlockView, UserUnblockView
from api.views.google_auth import google_login, google_callback

# app_name = 'auth'  # Removed to avoid shadowing dj_rest_auth and fix NoReverseMatch

urlpatterns = [
    path('login/', LoginView.as_view(), name='login'),
    path('register/', RegisterView.as_view(), name='register'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('csrf/', CSRFView.as_view(), name='csrf'),
    path('user/', CurrentUserView.as_view(), name='current-user'),
    path('password/change/', PasswordChangeView.as_view(), name='password-change'),
    path('profile/update/', ProfileUpdateView.as_view(), name='profile-update'),
    path('profile/<slug:slug>/', UserProfileView.as_view(), name='profile-detail'),
    path('profile/<slug:slug>/block/', UserBlockView.as_view(), name='user-block'),
    path('profile/<slug:slug>/unblock/', UserUnblockView.as_view(), name='user-unblock'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # Password Reset
    path('password/reset/', PasswordResetView.as_view(), name='password_reset'),
    path('password/reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm_base'),
    path('password/reset/confirm/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    
    # Google OAuth (using django-allauth adapter)
    path('google/', google_login, name='google-login'),
    path('google/callback/', google_callback, name='google-callback'),
]
