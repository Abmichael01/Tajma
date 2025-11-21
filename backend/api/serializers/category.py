from rest_framework import serializers

from api.models import Category


class CategorySerializer(serializers.ModelSerializer):
    parent_id = serializers.PrimaryKeyRelatedField(
        source='parent',
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )

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

