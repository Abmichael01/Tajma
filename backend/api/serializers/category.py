from rest_framework import serializers
from django.conf import settings
from django.utils import translation

from api.models import Category, CategoryTranslation
from api.utils.image_upload import save_base64_image
from api.utils.image_url import build_full_image_url


class CategorySerializer(serializers.ModelSerializer):
    name = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    parent_id = serializers.PrimaryKeyRelatedField(
        source='parent',
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )

    def validate_image_url(self, value):
        if not value:
            return ''
        if not isinstance(value, str):
            raise serializers.ValidationError("Invalid image data format.")
        
        if value.startswith('data:image') or (len(value) > 500 and 'base64' in value):
            try:
                saved_path = save_base64_image(value, folder='categories')
                return saved_path
            except Exception as e:
                raise serializers.ValidationError(f"Failed to process image: {str(e)}")
        
        return value

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        lang = translation.get_language() or 'en'
        
        # Fetch translation
        trans = instance.translations.filter(language=lang).first()
        if not trans:
            # Fallback to English
            trans = instance.translations.filter(language='en').first()
        
        if trans:
            data['name'] = trans.name
            data['description'] = trans.description
            
            # Deep translate custom fields
            custom_fields = data.get('custom_fields', [])
            trans_fields = trans.custom_fields_translations
            
            for field in custom_fields:
                field_name = field.get('name')
                if field_name in trans_fields:
                    field_trans = trans_fields[field_name]
                    field['label'] = field_trans.get('label', field.get('label'))
                    
                    # Translate options if they exist
                    options = field.get('options', [])
                    trans_options = field_trans.get('options', {})
                    for opt in options:
                        opt_key = opt.get('value', opt.get('label', ''))
                        if opt_key in trans_options:
                            opt['label'] = trans_options[opt_key]
            
            data['custom_fields'] = custom_fields

        if 'image_url' in data and data['image_url']:
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
    id = serializers.CharField(source='slug')
    name = serializers.CharField(read_only=True)
    description = serializers.CharField(read_only=True)
    subcategories = serializers.SerializerMethodField()
    customFields = serializers.JSONField(source='custom_fields')
    imageUrl = serializers.CharField(source='image_url', required=False, allow_blank=True)
    type = serializers.CharField(source='category_type')
    count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'icon',
            'imageUrl',
            'type',
            'customFields',
            'subcategories',
            'count',
        ]

    def get_count(self, obj):
        from api.models import Ad
        category_ids = self._get_descendant_ids(obj)
        return Ad.objects.filter(category_id__in=category_ids, status='published').count()

    def _get_descendant_ids(self, category):
        ids = [category.id]
        for child in category.children.filter(is_active=True):
            ids.extend(self._get_descendant_ids(child))
        return ids

    def get_subcategories(self, obj):
        children_qs = obj.children.filter(is_active=True).order_by('sort_order', 'slug')
        if not children_qs.exists():
            return []
        serializer = CategoryTreeSerializer(children_qs, many=True, context=self.context)
        return serializer.data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        lang = translation.get_language() or 'en'
        
        trans = instance.translations.filter(language=lang).first() or \
                instance.translations.filter(language='en').first()
        
        if trans:
            data['name'] = trans.name
            data['description'] = trans.description
            
            custom_fields = data.get('customFields', [])
            trans_fields = trans.custom_fields_translations
            for field in custom_fields:
                field_name = field.get('name')
                if field_name in trans_fields:
                    field_trans = trans_fields[field_name]
                    field['label'] = field_trans.get('label', field.get('label'))
                    options = field.get('options', [])
                    trans_options = field_trans.get('options', {})
                    for opt in options:
                        opt_key = opt.get('value', opt.get('label', ''))
                        if opt_key in trans_options:
                            opt['label'] = trans_options[opt_key]
            data['customFields'] = custom_fields

        if data.get('imageUrl'):
            request = self.context.get('request')
            data['imageUrl'] = build_full_image_url(data['imageUrl'], request)
        return data
