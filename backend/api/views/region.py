from rest_framework import viewsets, permissions
from rest_framework.response import Response
from django.db.models import Count, Q
from api.models import Region, Ad


class RegionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for getting regions with ad counts.
    """
    queryset = Region.objects.filter(is_active=True)
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'
    
    def list(self, request):
        """
        Get all active regions with their ad counts.
        Returns ALL regions (even with 0 ads).
        """
        regions = self.queryset.order_by('sort_order', 'name')
        
        # Get ad counts for each region
        regions_with_counts = []
        for region in regions:
            ads_count = Ad.objects.filter(
                seller__location=region,
                status='published'
            ).count()
            
            regions_with_counts.append({
                'id': region.id,
                'name': region.name,
                'slug': region.slug,
                'adsCount': ads_count
            })
        
        return Response(regions_with_counts)
    
    def retrieve(self, request, slug=None):
        """
        Get a single region with its ads.
        """
        try:
            region = self.queryset.get(slug=slug)
        except Region.DoesNotExist:
            return Response(
                {'detail': 'Region not found'},
                status=404
            )
        
        # Get ads in this region
        ads = Ad.objects.filter(
            seller__location=region,
            status='published'
        ).select_related('seller', 'category').order_by('-created_at')
        
        # Serialize ads (simplified)
        from api.serializers import AdSerializer
        ads_data = AdSerializer(ads, many=True, context={'request': request}).data
        
        return Response({
            'id': region.id,
            'name': region.name,
            'slug': region.slug,
            'is_active': region.is_active,
            'sort_order': region.sort_order,
            'ads_count': ads.count(),
            'ads': ads_data
        })

