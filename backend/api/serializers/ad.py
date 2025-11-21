from rest_framework import serializers
from django.conf import settings

from api.models import Ad, Category
from api.serializers.user import UserSerializer
from api.utils.image_upload import process_images_list


class CategorySummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'category_type']


class AdSerializer(serializers.ModelSerializer):
    seller = UserSerializer(read_only=True)
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
        """Override to convert image paths to full URLs in response"""
        data = super().to_representation(instance)
        
        if 'images' in data and data['images']:
            request = self.context.get('request')
            base_url = ''
            if request:
                base_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
            else:
                # Fallback if no request context
                base_url = getattr(settings, 'SITE_URL', '').rstrip('/')
            
            image_urls = []
            for image_path in data['images']:
                if isinstance(image_path, str):
                    # If it's already a full URL, return as is
                    if image_path.startswith('http://') or image_path.startswith('https://'):
                        image_urls.append(image_path)
                    # If it's an absolute path starting with /media/, convert to full URL
                    elif image_path.startswith('/media/'):
                        image_urls.append(f"{base_url}{image_path}")
                    # If it's an absolute path starting with /, convert to full URL
                    elif image_path.startswith('/'):
                        image_urls.append(f"{base_url}{image_path}")
                    else:
                        # Relative path (e.g., 'ads/uuid.jpg'), prepend MEDIA_URL
                        media_url = settings.MEDIA_URL.rstrip('/')
                        image_urls.append(f"{base_url}{media_url}/{image_path}")
            
            data['images'] = image_urls
        
        return data


