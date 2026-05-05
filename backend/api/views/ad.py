from rest_framework import permissions, viewsets
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from django.db.models import Q, F, Count
from rest_framework.decorators import action

from api.models import Ad, AdView, Category, SavedAd, SearchQuery
from api.serializers import AdSerializer


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.seller_id == request.user.id


class AdViewSet(viewsets.ModelViewSet):
    queryset = (
        Ad.objects.select_related('seller', 'category', 'category__parent')
        .prefetch_related('category__parent__parent', 'saved_by_users', 'translations', 'category__translations')
    )
    serializer_class = AdSerializer
    lookup_field = 'slug'
    from rest_framework.pagination import PageNumberPagination
    pagination_class = PageNumberPagination

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'suggested']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by user if provided
        user_id = self.request.query_params.get('user')
        is_owner_query = False
        if user_id:
            try:
                user_id_int = int(user_id)
                qs = qs.filter(seller_id=user_id_int)
                if self.request.user.is_authenticated and self.request.user.id == user_id_int:
                    is_owner_query = True
            except (ValueError, TypeError):
                pass
        
        # Filter by category slug
        category_slug = self.request.query_params.get('category')
        if category_slug:
            try:
                category = Category.objects.filter(slug=category_slug, is_active=True).first()
                if category:
                    def get_descendant_ids(cat):
                        ids = [cat.id]
                        children = Category.objects.filter(parent=cat, is_active=True)
                        for child in children:
                            ids.extend(get_descendant_ids(child))
                        return ids
                    category_ids = get_descendant_ids(category)
                    qs = qs.filter(category_id__in=category_ids)
                else:
                    qs = qs.filter(category__slug__iexact=category_slug)
            except Exception:
                qs = qs.filter(category__slug=category_slug)
        
        # Search filter - UPDATED for translations
        search = self.request.query_params.get('search')
        if search:
            search_q = (
                Q(translations__title__icontains=search) | 
                Q(translations__description__icontains=search) | 
                Q(seller__email__icontains=search) | 
                Q(seller__username__icontains=search)
            )
            
            # Also search by category names (translated)
            matching_categories = Category.objects.filter(
                Q(slug__icontains=search) | Q(translations__name__icontains=search),
                is_active=True
            ).distinct()
            
            if matching_categories.exists():
                category_ids_to_search = set()
                def get_all_descendant_ids(cat):
                    ids = [cat.id]
                    children = Category.objects.filter(parent=cat, is_active=True)
                    for child in children:
                        ids.extend(get_all_descendant_ids(child))
                    return ids
                
                for category in matching_categories:
                    category_ids_to_search.update(get_all_descendant_ids(category))
                
                if category_ids_to_search:
                    search_q |= Q(category_id__in=list(category_ids_to_search))
            
            qs = qs.filter(search_q).distinct()
        
        # Filter by status
        requested_status = self.request.query_params.get('status')
        user = self.request.user
        is_staff = bool(user.is_authenticated and user.is_staff)
        can_view_unpublished = is_staff or is_owner_query

        if requested_status:
            if can_view_unpublished:
                qs = qs.filter(status=requested_status)
            else:
                qs = qs.filter(status='published')
        elif self.action in ['list', 'retrieve']:
            if is_staff:
                pass
            elif user.is_authenticated:
                qs = qs.filter(Q(status='published') | Q(seller=user))
            else:
                qs = qs.filter(status='published')
        
        # Filter by price range
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            try:
                qs = qs.filter(price__gte=float(min_price))
            except (ValueError, TypeError):
                pass
        if max_price:
            try:
                qs = qs.filter(price__lte=float(max_price))
            except (ValueError, TypeError):
                pass
        
        return qs

    @action(detail=False, methods=['get'])
    def suggested(self, request):
        user = request.user
        interest_categories = []
        if user.is_authenticated:
            viewed_cats = (
                AdView.objects.filter(user=user)
                .values('ad__category_id')
                .annotate(count=Count('ad__category_id'))
                .order_by('-count')[:3]
            )
            interest_categories.extend([vc['ad__category_id'] for vc in viewed_cats])
            saved_cats = (
                SavedAd.objects.filter(user=user)
                .values('ad__category_id')
                .annotate(count=Count('ad__category_id'))
                .order_by('-count')[:2]
            )
            interest_categories.extend([sc['ad__category_id'] for sc in saved_cats])

        interest_categories = list(set(interest_categories))
        if interest_categories:
            qs = Ad.objects.filter(
                Q(category_id__in=interest_categories) | Q(views__gt=50),
                status='published'
            ).exclude(seller=user if user.is_authenticated else None)
        else:
            qs = Ad.objects.filter(status='published')

        qs = qs.select_related('seller', 'category').prefetch_related('translations').order_by('?')[:12]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def featured(self, request):
        qs = Ad.objects.filter(is_featured=True, status='published').select_related('seller', 'category').prefetch_related('translations')[:10]
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        if not (request.user.is_authenticated and request.user.id == instance.seller_id):
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            ip_address = x_forwarded_for.split(',')[0].strip() if x_forwarded_for else request.META.get('REMOTE_ADDR', '127.0.0.1')
            
            is_unique_view = False
            if request.user.is_authenticated:
                view, created = AdView.objects.get_or_create(ad=instance, user=request.user, defaults={'ip_address': ip_address})
                is_unique_view = created
            else:
                view, created = AdView.objects.get_or_create(ad=instance, ip_address=ip_address, user=None, defaults={'ip_address': ip_address})
                is_unique_view = created
            
            if is_unique_view:
                Ad.objects.filter(pk=instance.pk).update(views=F('views') + 1)
                instance.refresh_from_db()
        
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
