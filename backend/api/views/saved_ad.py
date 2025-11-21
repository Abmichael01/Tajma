from rest_framework import status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from django.shortcuts import get_object_or_404

from api.models import Ad, SavedAd
from api.serializers import AdSerializer
from api.pagination import SavedAdPagination


class SavedAdViewSet(ViewSet):
    """ViewSet for managing saved ads (favorites)"""
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = SavedAdPagination
    
    @action(detail=False, methods=['get'], url_path='list')
    def list_saved_ads(self, request):
        """Get all ads saved by the current user (paginated)"""
        saved_ads = SavedAd.objects.filter(user=request.user).select_related(
            'ad', 'ad__seller', 'ad__category'
        ).prefetch_related('ad__saved_by_users').order_by('-created_at')
        
        # Apply pagination
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(saved_ads, request)
        
        if page is not None:
            ads = [saved_ad.ad for saved_ad in page]
            serializer = AdSerializer(ads, many=True, context={'request': request})
            return paginator.get_paginated_response(serializer.data)
        
        # Fallback if pagination is not applied
        ads = [saved_ad.ad for saved_ad in saved_ads]
        serializer = AdSerializer(ads, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], url_path='save')
    def save_ad(self, request, pk=None):
        """Save an ad (add to favorites)"""
        ad = get_object_or_404(Ad, id=pk)
        
        # Check if already saved
        saved_ad, created = SavedAd.objects.get_or_create(
            user=request.user,
            ad=ad
        )
        
        if created:
            return Response({
                'message': 'Ad saved successfully',
                'saved': True
            }, status=status.HTTP_201_CREATED)
        else:
            return Response({
                'message': 'Ad is already saved',
                'saved': True
            }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'], url_path='unsave')
    def unsave_ad(self, request, pk=None):
        """Unsave an ad (remove from favorites)"""
        ad = get_object_or_404(Ad, id=pk)
        
        saved_ad = SavedAd.objects.filter(user=request.user, ad=ad).first()
        if saved_ad:
            saved_ad.delete()
            return Response({
                'message': 'Ad unsaved successfully',
                'saved': False
            }, status=status.HTTP_200_OK)
        else:
            return Response({
                'message': 'Ad was not saved',
                'saved': False
            }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='toggle')
    def toggle_save(self, request, pk=None):
        """Toggle save/unsave an ad"""
        ad = get_object_or_404(Ad, id=pk)
        
        saved_ad = SavedAd.objects.filter(user=request.user, ad=ad).first()
        if saved_ad:
            saved_ad.delete()
            saved = False
            message = 'Ad unsaved successfully'
        else:
            SavedAd.objects.create(user=request.user, ad=ad)
            saved = True
            message = 'Ad saved successfully'
        
        # Get updated ad data
        ad.refresh_from_db()
        serializer = AdSerializer(ad, context={'request': request})
        
        return Response({
            'message': message,
            'saved': saved,
            'ad': serializer.data
        }, status=status.HTTP_200_OK)

