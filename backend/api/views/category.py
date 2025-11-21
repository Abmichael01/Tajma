from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from api.models import Category
from api.serializers import CategorySerializer, CategoryTreeSerializer
from api.utils.category_exporter import export_categories_to_json


class CategoryViewSet(viewsets.ModelViewSet):
    """
    CRUD API for categories. Supports nested tree retrieval.
    """

    queryset = Category.objects.all().select_related('parent').prefetch_related('children')
    permission_classes = [permissions.IsAdminUser]
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'tree', 'public_tree']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ['list', 'tree']:
            qs = qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        serializer.save()
        export_categories_to_json()

    def perform_update(self, serializer):
        serializer.save()
        export_categories_to_json()

    def perform_destroy(self, instance):
        instance.delete()
        export_categories_to_json()

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def tree(self, request):
        roots = (
            Category.objects.filter(parent__isnull=True, is_active=True)
            .prefetch_related('children__children__children__children')
            .order_by('sort_order', 'name')
        )
        serializer = CategoryTreeSerializer(roots, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def all(self, request):
        serializer = CategorySerializer(self.get_queryset(), many=True)
        return Response(serializer.data)

