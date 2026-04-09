from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework.filters import SearchFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from api.models import User, Ad, Category, Notification, Chat, Message, KYCVerification, Review, Report, Lead, SupportMessage
from api.serializers import (
    UserSerializer,
    AdSerializer,
    CategorySerializer,
    NotificationSerializer,
    ChatSerializer,
    MessageSerializer,
    LeadSerializer,
    AdminReportSerializer,
    SupportMessageSerializer,
)
from api.serializers.kyc import KYCVerificationSerializer
from api.serializers.review import ReviewSerializer


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
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['email', 'username', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'is_seller', 'is_staff']
    lookup_field = 'id'

    def get_queryset(self):
        return User.objects.all().order_by('-date_joined')

    def get_serializer_class(self):
        return UserSerializer


class AdminAdViewSet(viewsets.ModelViewSet):
    """Admin ad management"""
    queryset = Ad.objects.select_related('seller', 'category').all()
    serializer_class = AdSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['title', 'description', 'seller__email', 'seller__username']
    filterset_fields = {
        'status': ['exact'],
        'ad_type': ['exact'],
        'category__slug': ['exact'],
        'seller_id': ['exact'],
    }
    lookup_field = 'id'

    def get_queryset(self):
        return Ad.objects.select_related('seller', 'category').all().order_by('-created_at')

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
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'slug']
    filterset_fields = ['is_active', 'category_type']
    lookup_field = 'id'

    def get_queryset(self):
        return Category.objects.select_related('parent').all().order_by('parent__id', 'sort_order', 'name')

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
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['title', 'message', 'recipient__email', 'recipient__username']
    filterset_fields = ['type', 'is_read']
    lookup_field = 'id'

    def get_queryset(self):
        return Notification.objects.select_related('recipient', 'related_ad', 'related_user').all().order_by('-created_at')

    def get_serializer_class(self):
        return NotificationSerializer


class AdminChatViewSet(viewsets.ModelViewSet):
    """Admin chat management"""
    queryset = Chat.objects.select_related('participant1', 'participant2', 'ad').prefetch_related('messages').all()
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['participant1__email', 'participant1__username', 'participant2__email', 'participant2__username']
    lookup_field = 'id'

    def get_queryset(self):
        return Chat.objects.select_related('participant1', 'participant2', 'ad').prefetch_related('messages').all().order_by('-last_message_at', '-created_at')

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
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['content', 'sender__email', 'sender__username']
    filterset_fields = ['is_read']
    lookup_field = 'id'

    def get_queryset(self):
        return Message.objects.select_related('chat', 'sender').all().order_by('-created_at')

    def get_serializer_class(self):
        return MessageSerializer


class AdminReportViewSet(viewsets.ModelViewSet):
    """Admin report management"""
    queryset = Report.objects.select_related('reporter', 'reported_user', 'related_ad').all()
    serializer_class = AdminReportSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['description', 'reporter__email', 'reported_user__email', 'related_ad__title']
    filterset_fields = ['status', 'report_type', 'reason']
    lookup_field = 'id'

    def get_queryset(self):
        return Report.objects.select_related('reporter', 'reported_user', 'related_ad').all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def resolve(self, request, id=None):
        """Resolve a report"""
        report = self.get_object()
        report.status = 'resolved'
        report.resolution_note = request.data.get('resolution_note', '')
        report.resolved_by = request.user
        report.resolved_at = timezone.now()
        report.save()
        
        # Add a final message to the thread so user sees the resolution details in history
        SupportMessage.objects.create(
            report=report,
            sender=request.user,
            message=f"Ticket marked as resolved. Resolution Note: {report.resolution_note or 'Problem handled.'}",
            is_admin_reply=True
        )
        
        return Response({'status': 'resolved'})

    @action(detail=True, methods=['post'])
    def reply(self, request, id=None):
        """Send a reply to a user report/support ticket as an admin"""
        report = self.get_object()
        serializer = SupportMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(report=report, sender=request.user, is_admin_reply=True)
            
            # Automatically set to Under Review if it's pending
            if report.status == 'pending':
                report.status = 'under_review'
                report.save()
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminKYCViewSet(viewsets.ModelViewSet):
    """Admin KYC management"""
    queryset = KYCVerification.objects.select_related('user').all()
    serializer_class = KYCVerificationSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['user__email', 'job_id', 'smile_user_id']
    filterset_fields = ['status', 'result', 'country', 'document_type']
    lookup_field = 'id'

    def get_queryset(self):
        return KYCVerification.objects.select_related('user').all().order_by('-created_at')

    @action(detail=True, methods=['post'])
    def approve(self, request, id=None):
        """Manually approve a KYC verification"""
        kyc = self.get_object()
        user = kyc.user
        
        # Update KYC record
        kyc.status = 'completed'
        kyc.result = 'verified'
        kyc.save()
        
        # Update User status
        user.is_verified = True
        user.kyc_status = 'verified'
        user.save()
        
        # Notify user (Optional, but good practice)
        Notification.objects.create(
            recipient=user,
            type='kyc_approved',
            title='Identity Verified',
            message='Your identity has been manually verified by our team. You now have full access to platform features.'
        )
        
        return Response({'status': 'verified'})

    @action(detail=True, methods=['post'])
    def reject(self, request, id=None):
        """Manually reject a KYC verification"""
        kyc = self.get_object()
        user = kyc.user
        reason = request.data.get('reason', 'Verification details were unclear or invalid.')
        
        # Update KYC record
        kyc.status = 'failed'
        kyc.result = 'rejected'
        kyc.save()
        
        # Update User status
        user.is_verified = False
        user.kyc_status = 'rejected'
        user.kyc_notes = reason
        user.save()
        
        # Notify user
        Notification.objects.create(
            recipient=user,
            type='kyc_rejected',
            title='Verification Rejected',
            message=f'Your identity verification was rejected. Reason: {reason}'
        )
        
        return Response({'status': 'rejected'})


class AdminReviewViewSet(viewsets.ModelViewSet):
    """Admin review management"""
    queryset = Review.objects.select_related('reviewer', 'seller', 'ad').all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['comment', 'reviewer__email', 'seller__email', 'ad__title']
    filterset_fields = ['rating']
    lookup_field = 'id'

    def get_queryset(self):
        return Review.objects.select_related('reviewer', 'seller', 'ad').all().order_by('-created_at')


class AdminLeadViewSet(viewsets.ModelViewSet):
    """Admin lead management (interaction analytics)"""
    queryset = Lead.objects.select_related('seller', 'client', 'ad').all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAdminUser]
    pagination_class = AdminPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['seller__email', 'seller__username', 'client__email', 'client__username', 'ad__title']
    filterset_fields = ['first_source', 'last_source', 'messaged', 'ignored']
    lookup_field = 'id'

    def get_queryset(self):
        return Lead.objects.select_related('seller', 'client', 'ad').all().order_by('-created_at')

