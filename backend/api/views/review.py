from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Avg, Count, Q

from api.models import Review, Ad
from api.serializers import ReviewSerializer, ReviewCreateSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing reviews.
    - List: Get all reviews (filterable by ad, seller, reviewer)
    - Create: Create a new review (requires authentication)
    - Retrieve: Get a single review
    - Update: Update own review (requires authentication)
    - Destroy: Delete own review (requires authentication)
    """
    
    queryset = Review.objects.select_related('reviewer', 'seller', 'ad').all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ReviewCreateSerializer
        return ReviewSerializer
    
    def get_queryset(self):
        """Filter reviews by ad, seller, or reviewer"""
        queryset = super().get_queryset()
        
        ad_id = self.request.query_params.get('ad')
        seller_id = self.request.query_params.get('seller')
        reviewer_id = self.request.query_params.get('reviewer')
        
        if ad_id:
            queryset = queryset.filter(ad_id=ad_id)
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)
        if reviewer_id:
            queryset = queryset.filter(reviewer_id=reviewer_id)
        
        return queryset.order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create review and ensure user is authenticated"""
        serializer.save(reviewer=self.request.user)
    
    def perform_update(self, serializer):
        """Only allow updating own reviews"""
        review = self.get_object()
        if review.reviewer != self.request.user:
            raise permissions.PermissionDenied('You can only update your own reviews.')
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only allow deleting own reviews"""
        if instance.reviewer != self.request.user:
            raise permissions.PermissionDenied('You can only delete your own reviews.')
        instance.delete()
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def stats(self, request):
        """
        Get review statistics for a seller or ad.
        Query params: seller (user ID) or ad (ad ID)
        """
        seller_id = request.query_params.get('seller')
        ad_id = request.query_params.get('ad')
        
        if not seller_id and not ad_id:
            return Response(
                {'error': 'Please provide either "seller" or "ad" query parameter.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = Review.objects.all()
        
        if seller_id:
            queryset = queryset.filter(seller_id=seller_id)
        elif ad_id:
            queryset = queryset.filter(ad_id=ad_id)
        
        stats = queryset.aggregate(
            total_reviews=Count('id'),
            average_rating=Avg('rating'),
            rating_5=Count('id', filter=Q(rating=5)),
            rating_4=Count('id', filter=Q(rating=4)),
            rating_3=Count('id', filter=Q(rating=3)),
            rating_2=Count('id', filter=Q(rating=2)),
            rating_1=Count('id', filter=Q(rating=1)),
        )
        
        # Round average rating to 1 decimal place
        if stats['average_rating']:
            stats['average_rating'] = round(float(stats['average_rating']), 1)
        else:
            stats['average_rating'] = 0.0
        
        return Response(stats)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def mark_helpful(self, request, pk=None):
        """Mark a review as helpful"""
        review = self.get_object()
        review.helpful_count += 1
        review.save(update_fields=['helpful_count'])
        return Response({'helpful_count': review.helpful_count})

