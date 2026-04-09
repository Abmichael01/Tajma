from django.contrib import admin
from api.models import Report, SupportMessage

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'report_type', 'related_ad', 'reported_user', 'reason', 'status', 'created_at')
    list_filter = ('report_type', 'status', 'reason', 'created_at')
    search_fields = ('description', 'reporter__email', 'related_ad__title', 'reported_user__username')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    actions = ['mark_under_review', 'mark_resolved', 'mark_dismissed']

    @admin.action(description='Mark as Under Review')
    def mark_under_review(self, request, queryset):
        queryset.update(status='under_review')

    @admin.action(description='Mark as Resolved')
    def mark_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='resolved', resolved_at=timezone.now(), resolved_by=request.user)

    @admin.action(description='Mark as Dismissed')
    def mark_dismissed(self, request, queryset):
        queryset.update(status='dismissed')

@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'report', 'sender', 'is_admin_reply', 'created_at')
    list_filter = ('is_admin_reply', 'created_at')
    search_fields = ('message', 'sender__email')
    readonly_fields = ('id', 'created_at')
    autocomplete_fields = ['report', 'sender']
