from django.contrib import admin
from django.utils.html import format_html
from api.models import Notification, Chat, Message, Lead

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'recipient', 'type', 'is_read', 'created_at')
    list_filter = ('type', 'is_read', 'created_at')
    search_fields = ('title', 'message', 'recipient__email', 'recipient__username')
    readonly_fields = ('id', 'created_at', 'read_at')
    autocomplete_fields = ['recipient', 'related_ad', 'related_user']
    actions = ['mark_as_read', 'mark_as_unread']

    @admin.action(description='Mark selected notifications as read')
    def mark_as_read(self, request, queryset):
        from django.utils import timezone
        queryset.filter(is_read=False).update(is_read=True, read_at=timezone.now())

    @admin.action(description='Mark selected notifications as unread')
    def mark_as_unread(self, request, queryset):
        queryset.filter(is_read=True).update(is_read=False, read_at=None)

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'participant1', 'participant2', 'last_message_at', 'created_at')
    list_filter = ('created_at', 'last_message_at')
    search_fields = ('participant1__email', 'participant2__email', 'ad__title')
    readonly_fields = ('id', 'created_at', 'updated_at', 'last_message_at')
    autocomplete_fields = ['participant1', 'participant2', 'ad']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('participant1', 'participant2', 'ad')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'sender', 'content_preview', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('content', 'sender__email')
    readonly_fields = ('id', 'created_at', 'updated_at', 'read_at')
    autocomplete_fields = ['chat', 'sender']
    
    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('chat', 'sender')

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ('id', 'seller', 'client', 'ad', 'first_source', 'messaged', 'created_at')
    list_filter = ('first_source', 'messaged', 'created_at')
    search_fields = ('seller__email', 'client__email', 'ad__title')
    readonly_fields = ('created_at', 'last_interacted_at')
    autocomplete_fields = ['seller', 'client', 'ad']
