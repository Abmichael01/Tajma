from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.db.models import Q, F

from api.models import Ad, AdView, Category
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
        
        # Filter by category slug - include all child categories
        category_slug = self.request.query_params.get('category')
        if category_slug:
            try:
                # Get the category by slug
                category = Category.objects.filter(slug=category_slug, is_active=True).first()
                if category:
                    # Get all descendant category IDs (including the category itself)
                    def get_descendant_ids(cat):
                        """Recursively get all descendant category IDs"""
                        ids = [cat.id]
                        children = Category.objects.filter(parent=cat, is_active=True)
                        for child in children:
                            ids.extend(get_descendant_ids(child))
                        return ids
                    
                    category_ids = get_descendant_ids(category)
                    # Filter ads by category or any of its descendants
                    qs = qs.filter(category_id__in=category_ids)
                else:
                    # Fallback to exact match if category not found
                    qs = qs.filter(category__slug=category_slug)
            except Exception:
                # Fallback to exact match on any error
                qs = qs.filter(category__slug=category_slug)
        
        # Search filter
        search = self.request.query_params.get('search')
        if search:
            # Build base search query for title, description, seller info
            search_q = Q(title__icontains=search) | Q(description__icontains=search) | Q(seller__email__icontains=search) | Q(seller__username__icontains=search)
            
            # Also search by category slugs (including all parent categories up to root)
            # Find all categories whose slug or name contains the search term
            matching_categories = Category.objects.filter(
                Q(slug__icontains=search) | Q(name__icontains=search),
                is_active=True
            )
            
            if matching_categories.exists():
                # Get all category IDs to search
                category_ids_to_search = set()
                
                def get_all_descendant_ids(cat):
                    """Get category ID and all descendant category IDs (children, grandchildren, etc.)"""
                    ids = [cat.id]
                    children = Category.objects.filter(parent=cat, is_active=True)
                    for child in children:
                        ids.extend(get_all_descendant_ids(child))
                    return ids
                
                # For each matching category:
                # 1. Include the category itself and all its descendants
                # 2. This way, if searching for "electronics", we get all ads in "electronics" and subcategories
                for category in matching_categories:
                    category_ids_to_search.update(get_all_descendant_ids(category))
                
                if category_ids_to_search:
                    # Add category filter to search query
                    # This will match ads whose category (or any parent in the path) matches the search
                    search_q |= Q(category_id__in=list(category_ids_to_search))
            
            qs = qs.filter(search_q)
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status)
        elif self.action in ['list', 'retrieve'] and not is_owner_query:
            # Default to published ads for public list/retrieve, unless owner is viewing their own ads
            qs = qs.filter(status='published')
        # If owner is querying their own ads without status filter, show all statuses
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            try:
                min_price_decimal = float(min_price)
                qs = qs.filter(price__gte=min_price_decimal)
            except (ValueError, TypeError):
                pass
        if max_price:
            try:
                max_price_decimal = float(max_price)
                qs = qs.filter(price__lte=max_price_decimal)
            except (ValueError, TypeError):
                pass
        
        # Filter by seller location / region
        region_slug = self.request.query_params.get('region')
        region_id = self.request.query_params.get('region_id')
        seller_location = self.request.query_params.get('seller_location')
        
        if region_slug:
            qs = qs.filter(seller__location__slug=region_slug)
        elif region_id:
            try:
                qs = qs.filter(seller__location_id=int(region_id))
            except (ValueError, TypeError):
                pass
        elif seller_location:
            # If a generic location string is provided, try to match region name
            qs = qs.filter(seller__location__name__icontains=seller_location)
        
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

    def get_client_ip(self, request):
        """
        Get the client's IP address from the request.
        Handles proxies and load balancers.
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR', '127.0.0.1')
        return ip

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single ad and increment view count for unique views.
        Views are tracked by IP address (for anonymous users) or by user (for authenticated users).
        Views are not counted if the viewer is the ad owner.
        """
        instance = self.get_object()
        
        # Don't count views if the viewer is the ad owner
        if not (request.user.is_authenticated and request.user.id == instance.seller_id):
            # Get client IP address
            ip_address = self.get_client_ip(request)
            
            # Determine if this is a unique view
            is_unique_view = False
            
            if request.user.is_authenticated:
                # For authenticated users, track by user (one view per user per ad)
                # Use get_or_create to handle race conditions atomically
                view, created = AdView.objects.get_or_create(
                    ad=instance,
                    user=request.user,
                    defaults={'ip_address': ip_address}
                )
                is_unique_view = created
            else:
                # For anonymous users, track by IP (one view per IP per ad)
                # Use get_or_create to handle race conditions atomically
                view, created = AdView.objects.get_or_create(
                    ad=instance,
                    ip_address=ip_address,
                    user=None,
                    defaults={'ip_address': ip_address}
                )
                is_unique_view = created
            
            # Only increment the view count if this is a unique view
            if is_unique_view:
                # Use F() expression for atomic increment to avoid race conditions
                Ad.objects.filter(pk=instance.pk).update(views=F('views') + 1)
                # Refresh the instance to get updated views count
                instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


