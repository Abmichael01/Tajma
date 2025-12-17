from rest_framework import serializers
from django.conf import settings

from api.models import Category
from api.utils.image_upload import save_base64_image
from api.utils.image_url import build_full_image_url


class CategorySerializer(serializers.ModelSerializer):
    # Use a more flexible field for image_url so we can accept both URLs and base64 strings.
    # The model still stores it as a URLField, but we convert/normalize it in validate_image_url.
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    parent_id = serializers.PrimaryKeyRelatedField(
        source='parent',
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )

    def validate_image_url(self, value):
        """Process base64 image if provided, otherwise use URL as-is."""
        if not value:
            # Allow empty / null image
            return ''

        # Ensure we are working with a string
        if not isinstance(value, str):
            raise serializers.ValidationError("Invalid image data format.")
        
        # Check if it's a base64 string
        if value.startswith('data:image') or (len(value) > 500 and 'base64' in value):
            try:
                # Save base64 image and return the relative path (e.g. 'categories/uuid.jpg')
                saved_path = save_base64_image(value, folder='categories')
                return saved_path
            except Exception as e:
                raise serializers.ValidationError(f"Failed to process image: {str(e)}")
        
        # It's already a URL or path, return as-is
        return value

    def to_representation(self, instance):
        """Override to convert image_url to full URL in response using request's host"""
        data = super().to_representation(instance)
        
        if 'image_url' in data and data['image_url']:
            request = self.context.get('request')
            data['image_url'] = build_full_image_url(data['image_url'], request)
        
        return data

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'image_url',
            'category_type',
            'custom_fields',
            'parent_id',
            'sort_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['slug', 'created_at', 'updated_at']


class CategoryTreeSerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'image_url',
            'category_type',
            'custom_fields',
            'parent_id',
            'children',
        ]

    def get_children(self, obj):
        children_qs = obj.children.filter(is_active=True).order_by('sort_order', 'name')
        serializer = CategoryTreeSerializer(children_qs, many=True, context=self.context)
        return serializer.data

