from rest_framework import viewsets, permissions
from api.models import Country
from api.serializers.country import CountrySerializer
from rest_framework.pagination import PageNumberPagination

class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for getting countries.
    """
    queryset = Country.objects.filter(is_active=True)
    serializer_class = CountrySerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = PageNumberPagination
