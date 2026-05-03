from rest_framework import serializers
from django.conf import settings

from api.models import Ad, Category
from api.serializers.user import UserPublicSerializer, UserSerializer
from api.utils.image_upload import process_images_list
from api.utils.image_url import build_full_image_url
from api.utils.validation import validate_ad_attributes
from api.services.response_stats import calculate_response_stats_for_seller


class CategorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'category_type']


class AdSerializer(serializers.ModelSerializer):
    seller = UserPublicSerializer(read_only=True)
    category = serializers.SlugRelatedField(
        slug_field='slug',
        queryset=Category.objects.filter(is_active=True),
    )
    category_details = CategorySummarySerializer(source='category', read_only=True)
    category_path = serializers.SerializerMethodField()
    images = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        allow_empty=True,
        write_only=False
    )
    saved_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    class Meta:
        model = Ad
        fields = [
            'id',
            'slug',
            'title',
            'description',
            'ad_type',
            'category',
            'category_details',
            'category_path',
            'price',
            'currency',
            'is_negotiable',
            'attributes',
            'images',  # Handled by SerializerMethodField
            'status',
            'views',
            'saved_count',
            'is_saved',
            'published_at',
            'created_at',
            'updated_at',
            'seller',
            'location_name',
            'latitude',
            'longitude',
            'is_featured',
            'promotion_rank',
        ]
        read_only_fields = [
            'id',
            'slug',
            'seller',
            'ad_type',
            'views',
            'published_at',
            'created_at',
            'updated_at',
            'is_featured',
            'promotion_rank',
        ]

    def validate_category(self, category: Category):
        if category.children.filter(is_active=True).exists():
            raise serializers.ValidationError('Please select the most specific subcategory.')
        return category

    def validate_images(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError('Images must be a list.')
        if len(value) > 10:
            raise serializers.ValidationError('A maximum of 10 images is allowed.')
        return value

    def validate(self, attrs):
        category = attrs.get('category') or getattr(self.instance, 'category', None)
        price = attrs.get('price')
        ad_type = category.category_type if category else None

        # Allow null price for products (user can select "Contact for price" on frontend)
        # Price validation is handled on frontend - backend accepts null for flexibility
        if price is not None and price <= 0:
            raise serializers.ValidationError({'price': 'Price must be a positive number.'})

        # Validate dynamic attributes against category custom_fields
        attributes = attrs.get('attributes') or getattr(self.instance, 'attributes', {})
        if category and attributes:
            custom_fields = category.custom_fields or []
            if isinstance(custom_fields, list):
                validate_ad_attributes(custom_fields, attributes)

        attrs['ad_type'] = ad_type
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['seller'] = request.user
        
        # Ensure status is set (defaults to 'published' from model, but ensure it's explicit)
        if 'status' not in validated_data:
            validated_data['status'] = 'published'
        
        # Process images: convert base64 to files and save
        if 'images' in validated_data:
            images = validated_data.pop('images', [])
            if images:
                try:
                    processed_images = process_images_list(images)
                    validated_data['images'] = processed_images
                except Exception as e:
                    raise serializers.ValidationError({'images': f'Error processing images: {str(e)}'})
        
        ad = super().create(validated_data)
        
        # Debug: Log the created ad status
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Created ad: {ad.id}, status: {ad.status}, slug: {ad.slug}")
        
        return ad


    def update(self, instance, validated_data):
        # Prevent category changes once the ad is created to avoid inconsistent data
        validated_data.pop('category', None)
        
        # Process images: convert base64 to files and save
        if 'images' in validated_data:
            images = validated_data.pop('images', [])
            if images:
                try:
                    # Process all images (both base64 and existing URLs)
                    # The process_images_list function handles both cases
                    processed_images = process_images_list(images)
                    validated_data['images'] = processed_images
                except Exception as e:
                    raise serializers.ValidationError({'images': f'Error processing images: {str(e)}'})
        
        return super().update(instance, validated_data)

    def get_category_path(self, obj):
        path = []
        current = obj.category
        while current:
            path.append({'name': current.name, 'slug': current.slug})
            current = current.parent
        return list(reversed(path))
    
    def get_saved_count(self, obj):
        """Get the number of users who saved this ad"""
        return obj.saved_by_users.count()
    
    def get_is_saved(self, obj):
        """Check if the current user has saved this ad"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by_users.filter(user=request.user).exists()
        return False
    
    def to_representation(self, instance):
        """Override to convert image paths to full URLs in response and add response_stats to seller"""
        data = super().to_representation(instance)
        
        if 'images' in data and data['images']:
            request = self.context.get('request')
            image_urls = []
            for image_path in data['images']:
                if isinstance(image_path, str):
                    # Use helper function to build full URL from request
                    full_url = build_full_image_url(image_path, request)
                    image_urls.append(full_url if full_url else image_path)
                else:
                    image_urls.append(image_path)
            
            data['images'] = image_urls
        
        # Add response_stats to seller if seller exists
        if 'seller' in data and instance.seller:
            try:
                response_stats = calculate_response_stats_for_seller(instance.seller)
                data['seller']['response_stats'] = response_stats
            except Exception:
                # If calculation fails, just don't include response_stats
                pass
        
        return data


class AdminAdSerializer(AdSerializer):
    seller = UserSerializer(read_only=True)


class AdMinimalSerializer(serializers.ModelSerializer):
    """Lightweight serializer for Ad (used in nested serializers)"""
    class Meta:
        model = Ad
        fields = ['id', 'title', 'slug', 'price', 'currency', 'status']
        read_only_fields = fields

    def to_representation(self, instance):
        """Include the first image if available"""
        data = super().to_representation(instance)
        if instance.images and len(instance.images) > 0:
            request = self.context.get('request')
            data['image'] = build_full_image_url(instance.images[0], request)
        else:
            data['image'] = None
        return data
