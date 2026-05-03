from django.contrib import admin
from api.models import Report, SupportMessage

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'report_type', 'subject_link', 'reporter', 'status', 'created_at')
    list_filter = ('report_type', 'status', 'reason', 'created_at')
    search_fields = ('description', 'reporter__email', 'related_ad__title', 'reported_user__username')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    actions = ['mark_under_review', 'mark_resolved', 'mark_dismissed', 'archive_ad', 'suspend_user']

    def subject_link(self, obj):
        from django.urls import reverse
        from django.utils.html import format_html
        if obj.report_type == 'ad' and obj.related_ad:
            url = reverse('admin:api_ad_change', args=[obj.related_ad.pk])
            return format_html('<a href="{}">Ad: {}</a>', url, obj.related_ad.title)
        if obj.report_type == 'user' and obj.reported_user:
            url = reverse('admin:api_user_change', args=[obj.reported_user.pk])
            return format_html('<a href="{}">User: {}</a>', url, obj.reported_user.email)
        return "Internal / Support"
    subject_link.short_description = 'Subject'

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

    @admin.action(description='[CS] Archive Reported Ad & Resolve')
    def archive_ad(self, request, queryset):
        if not request.user.is_staff:
            return
        from django.utils import timezone
        ads_count = 0
        for report in queryset.filter(report_type='ad', related_ad__isnull=False):
            report.related_ad.status = 'archived'
            report.related_ad.save()
            report.status = 'resolved'
            report.resolved_at = timezone.now()
            report.resolved_by = request.user
            report.resolution_note = "Auto-archived via Admin Action"
            report.save()
            ads_count += 1
        self.message_user(request, f'Archived {ads_count} ads and resolved related reports.')

    @admin.action(description='[CS] Suspend Reported User & Resolve')
    def suspend_user(self, request, queryset):
        if not request.user.is_staff:
            return
        from django.utils import timezone
        users_count = 0
        for report in queryset.filter(report_type='user', reported_user__isnull=False):
            report.reported_user.is_active = False
            report.reported_user.save()
            report.status = 'resolved'
            report.resolved_at = timezone.now()
            report.resolved_by = request.user
            report.resolution_note = "User suspended via Admin Action"
            report.save()
            users_count += 1
        self.message_user(request, f'Suspended {users_count} users and resolved related reports.')

@admin.register(SupportMessage)
class SupportMessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'report', 'sender', 'is_admin_reply', 'created_at')
    list_filter = ('is_admin_reply', 'created_at')
    search_fields = ('message', 'sender__email')
    readonly_fields = ('id', 'created_at')
    autocomplete_fields = ['report', 'sender']
