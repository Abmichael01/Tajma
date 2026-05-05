"""
Custom authentication views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from dj_rest_auth.views import LoginView as BaseLoginView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView

class TokenRefreshView(BaseTokenRefreshView):
    """Custom Token Refresh View"""
    @method_decorator(csrf_exempt, name='dispatch')
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


from api.serializers.user import (
    UserRegistrationSerializer,
    UserDetailsSerializer,
    PasswordChangeSerializer,
    UserLoginSerializer,
    UserUpdateSerializer,
)
from api.models import Review, Notification
from api.services.response_stats import calculate_response_stats_for_seller
from django.db.models import Avg, Count, Q
from api.utils.image_upload import save_uploaded_file


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    """User registration view"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        """Register a new user"""
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Log the user in after registration
            login(request, user)
            tokens = get_tokens_for_user(user)
            return Response(
                {
                    'user': UserDetailsSerializer(user).data,
                    'message': 'Registration successful.',
                    'access': tokens['access'],
                    'refresh': tokens['refresh']
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CSRFView(APIView):
    """View to get CSRF token"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """Return CSRF token"""
        from django.middleware.csrf import get_token
        token = get_token(request)
        return Response({'csrfToken': token})


@method_decorator(csrf_exempt, name='dispatch')
class LoginView(BaseLoginView):
    """Custom login view with CSRF protection"""
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        """Handle login"""
        import logging
        logger = logging.getLogger(__name__)
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        # Use the underlying Django request object for login to ensure session middleware handles it
        login(request._request if hasattr(request, '_request') else request, user)
        
        logger.info(f"💾 LOGIN DEBUG: User {user.id} logged in")
        logger.info(f"💾 SESSION KEY: {request.session.session_key}")
        logger.info(f"💾 SESSION DATA: {dict(request.session.items())}")
        
        tokens = get_tokens_for_user(user)
        response = Response(
            {
                'user': UserDetailsSerializer(user).data,
                'message': 'Login successful.',
                'access': tokens['access'],
                'refresh': tokens['refresh']
              },
              status=status.HTTP_200_OK
          )
        
        return response


@method_decorator(csrf_exempt, name='dispatch')
class PasswordChangeView(APIView):
    """Password change view"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Change user password"""
        serializer = PasswordChangeSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response(
                {'message': 'Password changed successfully.'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class CurrentUserView(APIView):
    """Get current authenticated user"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Return current user details"""
        if not request.user.is_authenticated:
            return Response(
                {'detail': 'Authentication credentials were not provided.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        serializer = UserDetailsSerializer(request.user, context={'request': request})
        data = serializer.data
        
        # Calculate review statistics
        review_stats = Review.objects.filter(seller=request.user).aggregate(
            total_reviews=Count('id'),
            average_rating=Avg('rating'),
            rating_5=Count('id', filter=Q(rating=5)),
            rating_4=Count('id', filter=Q(rating=4)),
            rating_3=Count('id', filter=Q(rating=3)),
            rating_2=Count('id', filter=Q(rating=2)),
            rating_1=Count('id', filter=Q(rating=1)),
        )
        
        # Round average rating
        if review_stats['average_rating']:
            review_stats['average_rating'] = round(float(review_stats['average_rating']), 1)
        else:
            review_stats['average_rating'] = 0.0
            
        data['review_stats'] = review_stats
        
        # Calculate response statistics
        response_stats = calculate_response_stats_for_seller(request.user)
        data['response_stats'] = response_stats
        
        return Response({'user': data}, status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name='dispatch')
class ProfileUpdateView(APIView):
    """User profile update view"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        """Update user profile (partial update)"""
        # Handle FormData file uploads - process file uploads before serializer
        data = request.data.copy()
        
        # If avatar is in request.FILES (FormData upload), process it first
        if 'avatar' in request.FILES:
            uploaded_file = request.FILES['avatar']
            try:
                # Save uploaded file and get path
                saved_path = save_uploaded_file(uploaded_file, folder='avatars')
                # Pass the saved path to serializer (it will handle it as URL/path)
                data['avatar'] = saved_path
            except Exception as e:
                return Response(
                    {'avatar': [f'Failed to process avatar file: {str(e)}']},
                    status=status.HTTP_400_BAD_REQUEST
                )
        serializer = UserUpdateSerializer(
            request.user,
            data=data,
            partial=True
        )
        if serializer.is_valid():
            user = serializer.save()
            
            # If seller-related fields are being updated, mark as seller and setup complete
            seller_fields = ['business_name', 'business_type', 'phone', 'location', 'address']
            if any(field in data for field in seller_fields):
                user.is_seller = True
                # Mark setup as complete if business info is provided
                if data.get('business_name') or data.get('business_type'):
                    user.is_seller_account_setup = True
                user.save()
            
            return Response(
                {
                    'user': UserDetailsSerializer(user).data,
                    'message': 'Profile updated successfully.'
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request):
        """Update user profile (full update)"""
        # Handle FormData file uploads - process file uploads before serializer
        data = request.data.copy()
        
        # If avatar is in request.FILES (FormData upload), process it first
        if 'avatar' in request.FILES:
            uploaded_file = request.FILES['avatar']
            try:
                # Save uploaded file and get path
                saved_path = save_uploaded_file(uploaded_file, folder='avatars')
                # Pass the saved path to serializer (it will handle it as URL/path)
                data['avatar'] = saved_path
            except Exception as e:
                return Response(
                    {'avatar': [f'Failed to process avatar file: {str(e)}']},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        serializer = UserUpdateSerializer(
            request.user,
            data=data
        )
        if serializer.is_valid():
            user = serializer.save()
            
            # If seller-related fields are being updated, mark as seller and setup complete
            seller_fields = ['business_name', 'business_type', 'phone', 'location', 'address']
            if any(field in data for field in seller_fields):
                user.is_seller = True
                # Mark setup as complete if business info is provided
                if data.get('business_name') or data.get('business_type'):
                    user.is_seller_account_setup = True
                user.save()
            
            return Response(
                {
                    'user': UserDetailsSerializer(user).data,
                    'message': 'Profile updated successfully.'
                },
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class LogoutView(APIView):
    """Logout view"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """Logout the current user"""
        logout(request)
        return Response(
            {'message': 'Logout successful.'},
            status=status.HTTP_200_OK
        )
