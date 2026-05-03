from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.conf import settings
from api.models import Region
from api.utils.image_upload import save_base64_image, save_uploaded_file
from api.utils.image_url import build_full_image_url

User = get_user_model()


class PasswordResetSerializer(serializers.Serializer):
    """
    Serializer for password reset request.
    Overrides default to provide custom HTML template and frontend_url context.
    """
    email = serializers.EmailField()

    def validate_email(self, value):
        from django.contrib.auth.forms import PasswordResetForm
        from django.contrib.auth import get_user_model
        
        UserModel = get_user_model()
        
        class CustomPasswordResetForm(PasswordResetForm):
            def get_users(self, email):
                """Override get_users to allow users without usable passwords (e.g. Google OAuth) to reset"""
                email_field_name = UserModel.get_email_field_name()
                active_users = UserModel._default_manager.filter(
                    **{
                        "%s__iexact" % email_field_name: email,
                        "is_active": True,
                    }
                )
                return (
                    u for u in active_users
                    if u.email.lower() == email.lower()
                )

        self.reset_form = CustomPasswordResetForm(data={'email': value})
        if not self.reset_form.is_valid():
            raise serializers.ValidationError(self.reset_form.errors)
        return value

    def save(self):
        request = self.context.get('request')
        opts = {
            'use_https': request.is_secure() if request else False,
            'from_email': getattr(settings, 'DEFAULT_FROM_EMAIL'),
            'request': request,
            'email_template_name': 'registration/password_reset_email.html',
            'html_email_template_name': 'registration/password_reset_email_html.html',
            'extra_email_context': {
                'frontend_url': settings.FRONTEND_URL,
            }
        }
        self.reset_form.save(**opts)


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    full_name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
            'phone',
            'location',
            'address',
            'is_seller',
            'is_seller_account_setup',
            'business_name',
            'business_type',
            'website',
            'bio',
            'is_verified',
            'is_staff',
            'is_active',
            'kyc_status',
            'kyc_notes',
            'email_notifications',
            'sms_notifications',
            'marketing_notifications',
            'date_joined',
            'last_login',
        ]
        read_only_fields = [
            'id',
            'email',
            'is_verified',
            'date_joined',
            'last_login',
        ]
    
    def get_full_name(self, obj):
        """Return the full name of the user"""
        return obj.get_full_name()
    
    def get_location(self, obj):
        """Return the region name as a string"""
        if obj.location:
            return obj.location.name
        return None
    
    def to_representation(self, instance):
        """Override to normalize avatar URL to full URL using request's host"""
        data = super().to_representation(instance)
        
        if 'avatar' in data and data['avatar']:
            request = self.context.get('request')
            data['avatar'] = build_full_image_url(data['avatar'], request)
        
        return data


class UserPublicSerializer(serializers.ModelSerializer):
    """Public profile shape safe for ads and profile pages."""

    full_name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
            'phone',
            'location',
            'is_seller',
            'is_seller_account_setup',
            'business_name',
            'business_type',
            'website',
            'bio',
            'is_verified',
            'date_joined',
        ]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_location(self, obj):
        if obj.location:
            return obj.location.name
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('avatar'):
            request = self.context.get('request')
            data['avatar'] = build_full_image_url(data['avatar'], request)
        return data


class UserUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating user profile"""
    location = serializers.PrimaryKeyRelatedField(
        queryset=Region.objects.all(),
        required=False,
        allow_null=True
    )
    # Use a flexible field for avatar - can accept URLs, base64 strings
    # File uploads are handled in the view before reaching serializer
    avatar = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'avatar',
            'phone',
            'location',
            'address',
            'business_name',
            'business_type',
            'website',
            'bio',
            'email_notifications',
            'sms_notifications',
            'marketing_notifications',
        ]
        extra_kwargs = {
            'username': {'required': False},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate_username(self, value):
        """Validate that username is unique if provided"""
        if value:
            user = self.instance
            if User.objects.filter(username=value).exclude(pk=user.pk).exists():
                raise serializers.ValidationError('A user with this username already exists.')
        return value
    
    def validate_avatar(self, value):
        """Process base64 avatar image if provided, otherwise use URL as-is."""
        if not value:
            # Allow empty / null avatar
            return None

        # Ensure we are working with a string (file uploads are processed in view)
        if not isinstance(value, str):
            raise serializers.ValidationError("Invalid avatar data format.")
        
        # Check if it's a base64 string
        if value.startswith('data:image') or (len(value) > 500 and 'base64' in value):
            try:
                # Save base64 image and return the relative path (e.g. 'avatars/uuid.jpg')
                saved_path = save_base64_image(value, folder='avatars')
                return saved_path
            except Exception as e:
                raise serializers.ValidationError(f"Failed to process avatar image: {str(e)}")
        
        # It's already a URL or path (from file upload processed in view), return as-is
        return value


class UserDetailsSerializer(serializers.ModelSerializer):
    """Serializer for user details endpoint"""
    
    full_name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
            'phone',
            'location',
            'address',
            'is_seller',
            'is_seller_account_setup',
            'business_name',
            'business_type',
            'website',
            'bio',
            'is_verified',
            'is_staff',
            'is_active',
            'kyc_status',
            'kyc_notes',
            'email_notifications',
            'sms_notifications',
            'marketing_notifications',
            'date_joined',
            'last_login',
        ]
        read_only_fields = [
            'id',
            'email',
            'is_verified',
            'date_joined',
            'last_login',
        ]
    
    def get_full_name(self, obj):
        """Return the full name of the user"""
        return obj.get_full_name()
    
    def get_location(self, obj):
        """Return the region name as a string"""
        if obj.location:
            return obj.location.name
        return None
    
    def to_representation(self, instance):
        """Override to normalize avatar URL to full URL using request's host"""
        data = super().to_representation(instance)
        
        if 'avatar' in data and data['avatar']:
            request = self.context.get('request')
            data['avatar'] = build_full_image_url(data['avatar'], request)
        
        return data


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = [
            'email',
            'username',
            'first_name',
            'last_name',
            'password',
            'password_confirm',
        ]
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
        }
    
    def validate(self, attrs):
        """Validate that passwords match"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        return attrs
    
    def validate_email(self, value):
        """Validate that email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value
    
    def validate_username(self, value):
        """Validate that username is unique"""
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return value
    
    def create(self, validated_data):
        """Create a new user"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(
            password=password,
            **validated_data
        )
        return user


class UserLoginSerializer(serializers.Serializer):
    """Serializer for user login"""
    
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate user credentials"""
        email = attrs.get('email')
        password = attrs.get('password')
        
        if email and password:
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                raise serializers.ValidationError('Invalid email or password.')
            
            if not user.check_password(password):
                raise serializers.ValidationError('Invalid email or password.')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled.')
            
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Must include "email" and "password".')
        
        return attrs


class UserSummarySerializer(serializers.ModelSerializer):
    """Lightweight serializer for user summary (used in nested serializers)"""
    
    full_name = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id',
            'email',
            'username',
            'first_name',
            'last_name',
            'full_name',
            'avatar',
            'location',
        ]
        read_only_fields = fields
    
    def get_full_name(self, obj):
        """Return the full name of the user"""
        return obj.get_full_name()
    
    def get_location(self, obj):
        """Return the region name as a string"""
        if obj.location:
            return obj.location.name
        return None
    
    def to_representation(self, instance):
        """Override to normalize avatar URL to full URL using request's host"""
        data = super().to_representation(instance)
        
        if 'avatar' in data and data['avatar']:
            request = self.context.get('request')
            data['avatar'] = build_full_image_url(data['avatar'], request)
        
        return data


UserMinimalSerializer = UserSummarySerializer


class PasswordChangeSerializer(serializers.Serializer):
    """Serializer for password change"""
    
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        """Validate passwords"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'New passwords do not match.'
            })
        return attrs
    
    def validate_old_password(self, value):
        """Validate old password"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
