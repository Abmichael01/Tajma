"""
Google OAuth authentication using django-allauth's adapter system
This uses allauth's social account adapter for proper user creation
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from allauth.socialaccount.models import SocialAccount
from django.conf import settings
from api.serializers.user import UserDetailsSerializer
from api.models.user import User


@csrf_exempt
@api_view(['GET'])
@permission_classes([AllowAny])
def google_login(request):
    """
    Initiate Google OAuth login using django-allauth
    Returns the authorization URL
    """
    from urllib.parse import urlencode
    
    try:
        redirect_uri = request.GET.get('redirect_uri', f'{settings.FRONTEND_URL}/auth/google/callback')
        # CRITICAL: Remove trailing slash - Google is very strict about exact match
        redirect_uri = redirect_uri.rstrip('/')
        
        google_config = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
        app_config = google_config.get('APP', {})
        client_id = app_config.get('client_id', '')
        
        if not client_id:
            return Response(
                {'error': 'Google OAuth client ID not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Log redirect URI for debugging
        if settings.DEBUG:
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f'Google OAuth redirect_uri: {redirect_uri}')
        
        # Build Google OAuth URL using allauth's approach
        params = {
            'client_id': client_id,
            'redirect_uri': redirect_uri,  # Must match EXACTLY what's in Google Cloud Console
            'response_type': 'code',
            'scope': 'openid email profile',
            'access_type': 'online',
        }
        
        authorization_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
        
        return Response({
            'authorization_url': authorization_url,
            'redirect_uri': redirect_uri,  # Return for debugging
        })
    except Exception as e:
        import traceback
        return Response(
            {
                'error': str(e),
                'traceback': traceback.format_exc() if settings.DEBUG else None
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def google_callback(request):
    """
    Handle Google OAuth callback using django-allauth
    """
    import requests
    import logging
    
    logger = logging.getLogger(__name__)
    
    code = request.data.get('code')
    redirect_uri = request.data.get('redirect_uri', f'{settings.FRONTEND_URL}/auth/google/callback')
    redirect_uri = redirect_uri.rstrip('/')
    
    if not code:
        return Response(
            {'error': 'Authorization code is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        google_config = settings.SOCIALACCOUNT_PROVIDERS.get('google', {})
        app_config = google_config.get('APP', {})
        client_id = app_config.get('client_id', '')
        client_secret = app_config.get('secret', '')
        
        if not client_id or not client_secret:
            return Response(
                {'error': 'Google OAuth credentials not configured'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Exchange code for token
        token_response = requests.post(
            'https://oauth2.googleapis.com/token',
            data={
                'code': code,
                'client_id': client_id,
                'client_secret': client_secret,
                'redirect_uri': redirect_uri,
                'grant_type': 'authorization_code',
            }
        )
        
        if token_response.status_code != 200:
            error_data = token_response.json() if token_response.text else {}
            error_msg = error_data.get('error_description') or error_data.get('error') or 'Failed to exchange code for token'
            return Response(
                {'error': error_msg, 'details': error_data if settings.DEBUG else None},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        token_data = token_response.json()
        access_token = token_data.get('access_token')
        
        if not access_token:
            return Response(
                {'error': 'Access token not received'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get user info from Google
        user_info_response = requests.get(
            'https://www.googleapis.com/oauth2/v2/userinfo',
            headers={'Authorization': f'Bearer {access_token}'}
        )
        
        if user_info_response.status_code != 200:
            return Response(
                {'error': f'Failed to get user info: {user_info_response.status_code}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user_info = user_info_response.json()
        email = user_info.get('email')
        
        if not email:
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create user
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # Create new user
            first_name = user_info.get('given_name', '')
            last_name = user_info.get('family_name', '')
            username = email.split('@')[0]
            
            # Ensure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}_{counter}"
                counter += 1
            
            # Create user
            user = User.objects.create_user(
                email=email,
                username=username,
                first_name=first_name,
                last_name=last_name,
                avatar=user_info.get('picture'),
            )
        
        # Create or update social account using allauth
        google_id = str(user_info.get('id', ''))
        if google_id:
            social_account, created = SocialAccount.objects.get_or_create(
                provider='google',
                uid=google_id,
                defaults={'user': user, 'extra_data': user_info}
            )
            if not created:
                social_account.user = user
                social_account.extra_data = user_info
                social_account.save()
        
        # Log the user in
        login(request._request, user)
        
        return Response({
            'user': UserDetailsSerializer(user).data,
            'message': 'Google authentication successful'
        })
        
    except Exception as e:
        import traceback
        logger.error(f'Google callback error: {e}\n{traceback.format_exc()}')
        return Response(
            {
                'error': str(e),
                'traceback': traceback.format_exc() if settings.DEBUG else None
            },
            status=status.HTTP_400_BAD_REQUEST
        )

