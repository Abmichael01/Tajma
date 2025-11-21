"""
Custom authentication views
"""
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import login, logout
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from dj_rest_auth.views import LoginView as BaseLoginView

from api.serializers.user import (
    UserRegistrationSerializer,
    UserDetailsSerializer,
    PasswordChangeSerializer,
    UserLoginSerializer,
    UserUpdateSerializer,
)


@method_decorator(csrf_protect, name='dispatch')
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
            return Response(
                {
                    'user': UserDetailsSerializer(user).data,
                    'message': 'Registration successful.'
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


@method_decorator(csrf_protect, name='dispatch')
class LoginView(BaseLoginView):
    """Custom login view with CSRF protection"""
    serializer_class = UserLoginSerializer
    
    def post(self, request, *args, **kwargs):
        """Handle login"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        login(request, user)
        
        return Response(
            {
                'user': UserDetailsSerializer(user).data,
                'message': 'Login successful.'
            },
            status=status.HTTP_200_OK
        )


@method_decorator(csrf_protect, name='dispatch')
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


@method_decorator(csrf_protect, name='dispatch')
class ProfileUpdateView(APIView):
    """User profile update view"""
    permission_classes = [IsAuthenticated]
    
    def patch(self, request):
        """Update user profile (partial update)"""
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        if serializer.is_valid():
            user = serializer.save()
            
            # If seller-related fields are being updated, mark as seller and setup complete
            seller_fields = ['business_name', 'business_type', 'phone', 'location', 'address']
            if any(field in request.data for field in seller_fields):
                user.is_seller = True
                # Mark setup as complete if business info is provided
                if request.data.get('business_name') or request.data.get('business_type'):
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
        serializer = UserUpdateSerializer(
            request.user,
            data=request.data
        )
        if serializer.is_valid():
            user = serializer.save()
            
            # If seller-related fields are being updated, mark as seller and setup complete
            seller_fields = ['business_name', 'business_type', 'phone', 'location', 'address']
            if any(field in request.data for field in seller_fields):
                user.is_seller = True
                # Mark setup as complete if business info is provided
                if request.data.get('business_name') or request.data.get('business_type'):
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

