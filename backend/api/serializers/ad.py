from rest_framework import serializers
from django.conf import settings
from django.utils import translation
from django.utils.text import slugify

from api.models.ad import Ad, AdTranslation
from api.models.category import Category
from api.serializers.user import UserPublicSerializer, UserSerializer
from api.utils.image_upload import process_images_list
from api.utils.image_url import build_full_image_url
from api.utils.validation import validate_ad_attributes
from api.services.response_stats import calculate_response_stats_for_seller


class CategorySummarySerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'category_type']

    def get_name(self, obj):
        lang = translation.get_language() or 'en'
        trans = obj.translations.filter(language=lang).first() or \
                obj.translations.filter(language='en').first()
        return trans.name if trans else obj.slug


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
    )
    saved_count = serializers.SerializerMethodField()
    is_saved = serializers.SerializerMethodField()

    # Translatable fields (explicitly defined since they are no longer in the model)
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    slug = serializers.CharField(read_only=True)

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
            'images',
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

        if price is not None and price <= 0:
            raise serializers.ValidationError({'price': 'Price must be a positive number.'})

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
        
        title = validated_data.pop('title')
        description = validated_data.pop('description')
        lang = translation.get_language() or 'en'

        if 'status' not in validated_data:
            validated_data['status'] = 'published'
        
        if 'images' in validated_data:
            images = validated_data.pop('images', [])
            if images:
                try:
                    processed_images = process_images_list(images)
                    validated_data['images'] = processed_images
                except Exception as e:
                    raise serializers.ValidationError({'images': f'Error processing images: {str(e)}'})
        
        ad = super().create(validated_data)
        
        # Create original translation
        AdTranslation.objects.create(
            ad=ad,
            language=lang,
            title=title,
            description=description,
            is_original=True,
            is_auto_translated=False
        )
        
        return ad

    def update(self, instance, validated_data):
        validated_data.pop('category', None)
        
        title = validated_data.pop('title', None)
        description = validated_data.pop('description', None)
        lang = translation.get_language() or 'en'

        if 'images' in validated_data:
            images = validated_data.pop('images', [])
            if images:
                try:
                    processed_images = process_images_list(images)
                    validated_data['images'] = processed_images
                except Exception as e:
                    raise serializers.ValidationError({'images': f'Error processing images: {str(e)}'})
        
        instance = super().update(instance, validated_data)
        
        if title or description:
            trans, created = AdTranslation.objects.get_or_create(
                ad=instance,
                language=lang,
                defaults={'is_original': True}
            )
            if title:
                trans.title = title
            if description:
                trans.description = description
            trans.save()
            
        return instance

    def get_category_path(self, obj):
        path = []
        current = obj.category
        lang = translation.get_language() or 'en'
        while current:
            trans = current.translations.filter(language=lang).first() or \
                    current.translations.filter(language='en').first()
            name = trans.name if trans else current.slug
            path.append({'name': name, 'slug': current.slug})
            current = current.parent
        return list(reversed(path))
    
    def get_saved_count(self, obj):
        return obj.saved_by_users.count()
    
    def get_is_saved(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.saved_by_users.filter(user=request.user).exists()
        return False
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        lang = translation.get_language() or 'en'

        # Fetch translation for title, description, and slug
        trans = instance.translations.filter(language=lang).first() or \
                instance.translations.filter(language='en').first()
        
        if trans:
            data['title'] = trans.title
            data['description'] = trans.description
            data['slug'] = trans.slug
        
        if 'images' in data and data['images']:
            image_urls = []
            for image_path in data['images']:
                if isinstance(image_path, str):
                    full_url = build_full_image_url(image_path, request)
                    image_urls.append(full_url if full_url else image_path)
                else:
                    image_urls.append(image_path)
            data['images'] = image_urls
        
        if 'seller' in data and instance.seller:
            try:
                response_stats = calculate_response_stats_for_seller(instance.seller)
                data['seller']['response_stats'] = response_stats
            except Exception:
                pass
        
        return data


class AdminAdSerializer(AdSerializer):
    seller = UserSerializer(read_only=True)


class AdMinimalSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    slug = serializers.SerializerMethodField()

    class Meta:
        model = Ad
        fields = ['id', 'title', 'slug', 'price', 'currency', 'status']
        read_only_fields = fields

    def get_title(self, obj):
        lang = translation.get_language() or 'en'
        trans = obj.translations.filter(language=lang).first() or \
                obj.translations.filter(language='en').first()
        return trans.title if trans else str(obj.id)

    def get_slug(self, obj):
        lang = translation.get_language() or 'en'
        trans = obj.translations.filter(language=lang).first() or \
                obj.translations.filter(language='en').first()
        return trans.slug if trans else str(obj.id)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.images and len(instance.images) > 0:
            request = self.context.get('request')
            data['image'] = build_full_image_url(instance.images[0], request)
        else:
            data['image'] = None
        return data
