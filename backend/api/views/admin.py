from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from api.models import User, Ad, Category, Notification, Chat, Message
from api.serializers import (
    UserSerializer,
    AdSerializer,
    CategorySerializer,
    NotificationSerializer,
    ChatSerializer,
    MessageSerializer,
)


class AdminPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100


class AdminStatsViewSet(viewsets.ViewSet):
    """Admin statistics endpoint"""
    permission_classes = [permissions.IsAdminUser]

    def list(self, request):
        """Get dashboard statistics"""
        now = timezone.now()
        last_24h = now - timedelta(hours=24)

        stats = {
            'total_users': User.objects.count(),
            'total_ads': Ad.objects.count(),
            'active_ads': Ad.objects.filter(status='published').count(),
            'pending_ads': Ad.objects.filter(status='draft').count(),
            'draft_ads': Ad.objects.filter(status='draft').count(),
            'archived_ads': Ad.objects.filter(status='archived').count(),
            'total_categories': Category.objects.count(),
            'active_categories': Category.objects.filter(is_active=True).count(),
            'total_notifications': Notification.objects.count(),
            'unread_notifications': Notification.objects.filter(is_read=False).count(),
            'total_chats': Chat.objects.count(),
            'total_messages': Message.objects.count(),
            'recent_activity_24h': {
                'new_users': User.objects.filter(date_joined__gte=last_24h).count(),
                'new_ads': Ad.objects.filter(created_at__gte=last_24h).count(),
                'new_messages': Message.objects.filter(created_at__gte=last_24h).count(),
            }
        }

        return Response(stats)


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin user management"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by is_active
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by is_seller
        is_seller = self.request.query_params.get('is_seller')
        if is_seller is not None:
            queryset = queryset.filter(is_seller=is_seller.lower() == 'true')
        
        # Filter by is_staff
        is_staff = self.request.query_params.get('is_staff')
        if is_staff is not None:
            queryset = queryset.filter(is_staff=is_staff.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search)
            )
        
        return queryset.order_by('-date_joined')

    def get_serializer_class(self):
        return UserSerializer


class AdminAdViewSet(viewsets.ModelViewSet):
    """Admin ad management"""
    queryset = Ad.objects.select_related('seller', 'category').all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by ad_type
        ad_type = self.request.query_params.get('ad_type')
        if ad_type:
            queryset = queryset.filter(ad_type=ad_type)
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        
        # Filter by seller/user
        seller_id = self.request.query_params.get('seller')
        if seller_id:
            try:
                queryset = queryset.filter(seller_id=int(seller_id))
            except (ValueError, TypeError):
                pass
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(seller__email__icontains=search) |
                Q(seller__username__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        return AdSerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Add category_name and only include main image (first image) for each ad
        if 'results' in response.data:
            for ad in response.data['results']:
                if 'category_details' in ad and ad['category_details']:
                    ad['category_name'] = ad['category_details'].get('name', ad.get('category', ''))
                else:
                    ad['category_name'] = ad.get('category', '')
                
                # Only include the main image (first image) in the list view
                if 'images' in ad and isinstance(ad['images'], list) and len(ad['images']) > 0:
                    ad['images'] = [ad['images'][0]]  # Keep only the first image
                else:
                    ad['images'] = []  # Empty array if no images
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        # Add category_name
        if 'category_details' in response.data and response.data['category_details']:
            response.data['category_name'] = response.data['category_details'].get('name', response.data.get('category', ''))
        else:
            response.data['category_name'] = response.data.get('category', '')
        return response


class AdminCategoryViewSet(viewsets.ModelViewSet):
    """Admin category management"""
    queryset = Category.objects.select_related('parent').all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by is_active
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filter by category_type
        category_type = self.request.query_params.get('category_type')
        if category_type:
            queryset = queryset.filter(category_type=category_type)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(slug__icontains=search)
            )
        
        return queryset.order_by('parent__id', 'sort_order', 'name')

    def get_serializer_class(self):
        return CategorySerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Add parent_name to each category
        if 'results' in response.data:
            for category in response.data['results']:
                if category.get('parent'):
                    try:
                        parent = Category.objects.get(id=category['parent'])
                        category['parent_name'] = parent.name
                    except Category.DoesNotExist:
                        category['parent_name'] = None
                else:
                    category['parent_name'] = None
        return response

    def retrieve(self, request, *args, **kwargs):
        response = super().retrieve(request, *args, **kwargs)
        # Add parent_name
        if response.data.get('parent'):
            try:
                parent = Category.objects.get(id=response.data['parent'])
                response.data['parent_name'] = parent.name
            except Category.DoesNotExist:
                response.data['parent_name'] = None
        else:
            response.data['parent_name'] = None
        return response

    def perform_create(self, serializer):
        serializer.save()
        # Export categories to JSON (if you have this functionality)
        try:
            from api.utils.category_exporter import export_categories_to_json
            export_categories_to_json()
        except ImportError:
            pass

    def perform_update(self, serializer):
        serializer.save()
        try:
            from api.utils.category_exporter import export_categories_to_json
            export_categories_to_json()
        except ImportError:
            pass

    def perform_destroy(self, instance):
        instance.delete()
        try:
            from api.utils.category_exporter import export_categories_to_json
            export_categories_to_json()
        except ImportError:
            pass


class AdminNotificationViewSet(viewsets.ModelViewSet):
    """Admin notification management"""
    queryset = Notification.objects.select_related('recipient', 'related_ad', 'related_user').all()
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by type
        notification_type = self.request.query_params.get('type')
        if notification_type:
            queryset = queryset.filter(type=notification_type)
        
        # Filter by is_read
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(message__icontains=search) |
                Q(recipient__email__icontains=search) |
                Q(recipient__username__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        return NotificationSerializer


class AdminChatViewSet(viewsets.ModelViewSet):
    """Admin chat management"""
    queryset = Chat.objects.select_related('participant1', 'participant2', 'ad').prefetch_related('messages').all()
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(participant1__email__icontains=search) |
                Q(participant1__username__icontains=search) |
                Q(participant2__email__icontains=search) |
                Q(participant2__username__icontains=search)
            )
        
        return queryset.order_by('-last_message_at', '-created_at')

    def get_serializer_class(self):
        return ChatSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        # Add message count
        data = serializer.data
        data['message_count'] = instance.messages.count()
        return Response(data)

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Add message count to each chat
        if 'results' in response.data:
            chat_ids = [chat['id'] for chat in response.data['results']]
            chat_objs = {str(chat.id): chat for chat in Chat.objects.filter(id__in=chat_ids).prefetch_related('messages')}
            for chat in response.data['results']:
                chat_obj = chat_objs.get(chat['id'])
                if chat_obj:
                    chat['message_count'] = chat_obj.messages.count()
                else:
                    chat['message_count'] = 0
        return response


class AdminMessageViewSet(viewsets.ModelViewSet):
    """Admin message management"""
    queryset = Message.objects.select_related('chat', 'sender').all()
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    lookup_field = 'id'

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by is_read
        is_read = self.request.query_params.get('is_read')
        if is_read is not None:
            queryset = queryset.filter(is_read=is_read.lower() == 'true')
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(content__icontains=search) |
                Q(sender__email__icontains=search) |
                Q(sender__username__icontains=search)
            )
        
        return queryset.order_by('-created_at')

    def get_serializer_class(self):
        return MessageSerializer

