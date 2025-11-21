from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied

from api.models import Ad
from api.serializers import AdSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller_id == request.user.id


class AdViewSet(viewsets.ModelViewSet):
    queryset = (
        Ad.objects.select_related('seller', 'category', 'category__parent')
        .prefetch_related('category__parent__parent', 'saved_by_users')
    )
    serializer_class = AdSerializer
    lookup_field = 'slug'

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Debug logging (only in development)
        import logging
        import os
        logger = logging.getLogger(__name__)
        if os.environ.get('DEBUG', 'False').lower() == 'true':
            logger.info(f"AdViewSet.get_queryset - action: {self.action}")
            logger.info(f"Query params: {dict(self.request.query_params)}")
            # Get status distribution for debugging
            from django.db.models import Count
            status_dist = qs.values('status').annotate(count=Count('id'))
            logger.info(f"Status distribution: {list(status_dist)}")
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user')
        is_owner_query = False
        if user_id:
            try:
                user_id_int = int(user_id)
                qs = qs.filter(seller_id=user_id_int)
                # Check if the requesting user is the owner
                if self.request.user.is_authenticated and self.request.user.id == user_id_int:
                    is_owner_query = True
            except (ValueError, TypeError):
                pass
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        elif self.action in ['list', 'retrieve'] and not is_owner_query:
            # Default to published ads for public list/retrieve, unless owner is viewing their own ads
            qs = qs.filter(status='published')
        # If owner is querying their own ads without status filter, show all statuses
        
        return qs

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        ad = serializer.instance
        if ad.seller_id != self.request.user.id:
            raise PermissionDenied('You can only edit your own ads.')
        serializer.save()

    def perform_destroy(self, instance):
        if instance.seller_id != self.request.user.id:
            raise PermissionDenied('You can only delete your own ads.')
        instance.delete()


