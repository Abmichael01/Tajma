from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q

from api.models import Ad, Category, User, Notification, Chat, Message, UserOnlineStatus, SavedAd, Region


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'category_type', 'is_active', 'sort_order')
    list_filter = ('is_active', 'category_type', 'parent')
    search_fields = ('name', 'slug')
    ordering = ('parent__id', 'sort_order', 'name')
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['parent']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'is_active', 'is_seller', 'is_staff')
    search_fields = ('email', 'username')
    list_filter = ('is_active', 'is_seller', 'is_staff')


@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'seller',
        'category',
        'ad_type',
        'price_display',
        'status',
        'views',
        'created_at',
        'published_at',
        'image_preview',
    )
    list_filter = (
        'status',
        'ad_type',
        'category',
        'is_negotiable',
        'created_at',
        'published_at',
    )
    search_fields = (
        'title',
        'description',
        'seller__email',
        'seller__username',
        'slug',
    )
    readonly_fields = (
        'id',
        'slug',
        'seller',
        'ad_type',
        'views',
        'created_at',
        'updated_at',
        'published_at',
        'image_preview',
    )
    autocomplete_fields = ['category', 'seller']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    list_per_page = 25
    actions = ['make_published', 'make_draft', 'make_archived']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'slug', 'title', 'description', 'seller', 'category', 'ad_type')
        }),
        ('Pricing', {
            'fields': ('price', 'currency', 'is_negotiable')
        }),
        ('Media', {
            'fields': ('images', 'image_preview')
        }),
        ('Attributes', {
            'fields': ('attributes',),
            'classes': ('collapse',)
        }),
        ('Status & Metadata', {
            'fields': ('status', 'views', 'published_at', 'created_at', 'updated_at')
        }),
    )
    
    def price_display(self, obj):
        """Display price with currency"""
        if obj.price:
            return f"{obj.currency} {obj.price:,.2f}"
        return "Contact for price"
    price_display.short_description = 'Price'
    
    def image_preview(self, obj):
        """Display first image as preview"""
        if obj.images and len(obj.images) > 0:
            first_image = obj.images[0]
            # Handle both URL and path formats
            if isinstance(first_image, str):
                if first_image.startswith('http'):
                    image_url = first_image
                elif first_image.startswith('/'):
                    from django.conf import settings
                    base_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                    image_url = f"{base_url}{first_image}"
                else:
                    from django.conf import settings
                    base_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                    media_url = getattr(settings, 'MEDIA_URL', '/media/')
                    image_url = f"{base_url}{media_url}{first_image}"
                
                return format_html(
                    '<img src="{}" style="max-width: 100px; max-height: 100px; object-fit: cover;" />',
                    image_url
                )
        return "No image"
    image_preview.short_description = 'Preview'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('seller', 'category', 'category__parent')
    
    @admin.action(description='Mark selected ads as published')
    def make_published(self, request, queryset):
        """Bulk action to publish ads"""
        from django.utils import timezone
        updated = queryset.update(status='published', published_at=timezone.now())
        self.message_user(request, f'{updated} ad(s) marked as published.')
    make_published.short_description = 'Mark selected ads as published'
    
    @admin.action(description='Mark selected ads as draft')
    def make_draft(self, request, queryset):
        """Bulk action to mark ads as draft"""
        updated = queryset.update(status='draft')
        self.message_user(request, f'{updated} ad(s) marked as draft.')
    make_draft.short_description = 'Mark selected ads as draft'
    
    @admin.action(description='Archive selected ads')
    def make_archived(self, request, queryset):
        """Bulk action to archive ads"""
        updated = queryset.update(status='archived')
        self.message_user(request, f'{updated} ad(s) archived.')
    make_archived.short_description = 'Archive selected ads'


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'recipient',
        'type',
        'is_read',
        'related_ad_link',
        'related_user_link',
        'created_at',
        'read_at',
    )
    list_filter = (
        'type',
        'is_read',
        'created_at',
        'read_at',
    )
    search_fields = (
        'title',
        'message',
        'recipient__email',
        'recipient__username',
        'related_ad__title',
        'related_ad__slug',
    )
    readonly_fields = (
        'id',
        'created_at',
        'read_at',
    )
    autocomplete_fields = ['recipient', 'related_ad', 'related_user']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    list_per_page = 50
    actions = ['mark_as_read', 'mark_as_unread']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('id', 'recipient', 'type', 'title', 'message')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Related Objects', {
            'fields': ('related_ad', 'related_user'),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',)
        }),
    )
    
    def related_ad_link(self, obj):
        """Display link to related ad"""
        if obj.related_ad:
            url = f'/admin/api/ad/{obj.related_ad.id}/change/'
            return format_html('<a href="{}">{}</a>', url, obj.related_ad.title[:50])
        return '-'
    related_ad_link.short_description = 'Related Ad'
    related_ad_link.admin_order_field = 'related_ad__title'
    
    def related_user_link(self, obj):
        """Display link to related user"""
        if obj.related_user:
            url = f'/admin/api/user/{obj.related_user.id}/change/'
            return format_html('<a href="{}">{}</a>', url, obj.related_user.email)
        return '-'
    related_user_link.short_description = 'Related User'
    related_user_link.admin_order_field = 'related_user__email'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('recipient', 'related_ad', 'related_user')
    
    @admin.action(description='Mark selected notifications as read')
    def mark_as_read(self, request, queryset):
        """Bulk action to mark notifications as read"""
        from django.utils import timezone
        updated = queryset.filter(is_read=False).update(is_read=True, read_at=timezone.now())
        self.message_user(request, f'{updated} notification(s) marked as read.')
    mark_as_read.short_description = 'Mark selected notifications as read'
    
    @admin.action(description='Mark selected notifications as unread')
    def mark_as_unread(self, request, queryset):
        """Bulk action to mark notifications as unread"""
        updated = queryset.filter(is_read=True).update(is_read=False, read_at=None)
        self.message_user(request, f'{updated} notification(s) marked as unread.')
    mark_as_unread.short_description = 'Mark selected notifications as unread'


@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'participant1',
        'participant2',
        'ad_link',
        'last_message_at',
        'created_at',
        'message_count',
    )
    list_filter = (
        'created_at',
        'last_message_at',
    )
    search_fields = (
        'participant1__email',
        'participant1__username',
        'participant2__email',
        'participant2__username',
        'ad__title',
        'ad__slug',
    )
    readonly_fields = (
        'id',
        'created_at',
        'updated_at',
        'last_message_at',
    )
    autocomplete_fields = ['participant1', 'participant2', 'ad']
    date_hierarchy = 'created_at'
    ordering = ('-last_message_at', '-created_at')
    list_per_page = 50
    
    fieldsets = (
        ('Participants', {
            'fields': ('participant1', 'participant2')
        }),
        ('Related Ad', {
            'fields': ('ad',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('id', 'created_at', 'updated_at', 'last_message_at')
        }),
    )
    
    def ad_link(self, obj):
        """Display link to related ad"""
        if obj.ad:
            url = f'/admin/api/ad/{obj.ad.id}/change/'
            return format_html('<a href="{}">{}</a>', url, obj.ad.title[:50])
        return '-'
    ad_link.short_description = 'Related Ad'
    ad_link.admin_order_field = 'ad__title'
    
    def message_count(self, obj):
        """Display count of messages in chat"""
        return obj.messages.count()
    message_count.short_description = 'Messages'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related and prefetch_related"""
        qs = super().get_queryset(request)
        return qs.select_related('participant1', 'participant2', 'ad').prefetch_related('messages')


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'chat_link',
        'sender',
        'content_preview',
        'is_read',
        'read_at',
        'created_at',
    )
    list_filter = (
        'is_read',
        'created_at',
        'read_at',
    )
    search_fields = (
        'content',
        'sender__email',
        'sender__username',
        'chat__id',
    )
    readonly_fields = (
        'id',
        'created_at',
        'updated_at',
        'read_at',
    )
    autocomplete_fields = ['chat', 'sender']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    list_per_page = 50
    
    fieldsets = (
        ('Message', {
            'fields': ('id', 'chat', 'sender', 'content')
        }),
        ('Status', {
            'fields': ('is_read', 'read_at')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def chat_link(self, obj):
        """Display link to chat"""
        url = f'/admin/api/chat/{obj.chat.id}/change/'
        return format_html('<a href="{}">Chat {}</a>', url, str(obj.chat.id)[:8])
    chat_link.short_description = 'Chat'
    chat_link.admin_order_field = 'chat__id'
    
    def content_preview(self, obj):
        """Display preview of message content"""
        if len(obj.content) > 50:
            return obj.content[:50] + '...'
        return obj.content
    content_preview.short_description = 'Content'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('chat', 'sender', 'chat__participant1', 'chat__participant2')


@admin.register(UserOnlineStatus)
class UserOnlineStatusAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'is_online',
        'last_seen',
    )
    list_filter = (
        'is_online',
        'last_seen',
    )
    search_fields = (
        'user__email',
        'user__username',
    )
    readonly_fields = (
        'last_seen',
    )
    autocomplete_fields = ['user']
    ordering = ('-is_online', '-last_seen')
    list_per_page = 50
    
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Status', {
            'fields': ('is_online', 'last_seen')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('user')


@admin.register(SavedAd)
class SavedAdAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'ad',
        'created_at',
    )
    list_filter = (
        'created_at',
    )
    search_fields = (
        'user__email',
        'user__username',
        'ad__title',
        'ad__slug',
    )
    readonly_fields = (
        'created_at',
    )
    autocomplete_fields = ['user', 'ad']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    list_per_page = 50
    
    fieldsets = (
        ('Saved Ad', {
            'fields': ('user', 'ad', 'created_at')
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        qs = super().get_queryset(request)
        return qs.select_related('user', 'ad', 'ad__seller', 'ad__category')


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = (
        'name',
        'slug',
        'ad_count',
        'is_active',
        'sort_order',
        'created_at',
    )
    list_filter = (
        'is_active',
        'created_at',
    )
    search_fields = (
        'name',
        'slug',
    )
    readonly_fields = (
        'created_at',
        'updated_at',
    )
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('sort_order', 'name')
    list_per_page = 50
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'slug', 'is_active', 'sort_order')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        """Optimize queryset with ad count annotation"""
        qs = super().get_queryset(request)
        return qs.annotate(
            ad_count=Count('users__ads', filter=models.Q(users__ads__status='published'))
        )
    
    def ad_count(self, obj):
        """Display count of published ads in this region"""
        return getattr(obj, 'ad_count', 0)
    ad_count.short_description = 'Ads Count'
    ad_count.admin_order_field = 'ad_count'

