"""
Authentication URL patterns
"""
from django.urls import path
from api.views.auth import RegisterView, CSRFView, PasswordChangeView, LoginView, ProfileUpdateView, CurrentUserView, LogoutView
from api.views.profile import UserProfileView, UserBlockView, UserUnblockView
from api.views.google_auth import google_login, google_callback

app_name = 'auth'

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
    
    # Google OAuth (using django-allauth adapter)
    path('google/', google_login, name='google-login'),
    path('google/callback/', google_callback, name='google-callback'),
]

