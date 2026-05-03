from django.contrib import admin
from api.models import User, KYCVerification, UserOnlineStatus

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'is_active', 'is_seller', 'is_staff', 'kyc_status', 'ad_count_display')
    search_fields = ('email', 'username')
    list_filter = ('is_active', 'is_seller', 'is_staff', 'kyc_status')
    readonly_fields = ('id', 'date_joined', 'last_login')

    def get_queryset(self, request):
        from django.db.models import Count
        return super().get_queryset(request).annotate(ad_count=Count('ads'))

    def ad_count_display(self, obj):
        return obj.ad_count
    ad_count_display.short_description = 'Ads'
    ad_count_display.admin_order_field = 'ad_count'

@admin.register(KYCVerification)
class KYCVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type', 'country', 'status', 'created_at')
    list_filter = ('status', 'document_type', 'country', 'created_at')
    search_fields = ('user__email', 'job_id', 'smile_user_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)
    actions = ['approve_kyc', 'reject_kyc']

    @admin.action(description='Approve KYC & Verify User')
    def approve_kyc(self, request, queryset):
        for kyc in queryset.filter(status='pending'):
            kyc.status = 'verified'
            kyc.save()
            # The model save logic likely updates the user, but we ensure it here
            user = kyc.user
            user.kyc_status = 'verified'
            user.is_verified = True
            user.save()
        self.message_user(request, "Selected KYC documents approved.")

    @admin.action(description='Reject KYC')
    def reject_kyc(self, request, queryset):
        for kyc in queryset.filter(status='pending'):
            kyc.status = 'rejected'
            kyc.save()
            user = kyc.user
            user.kyc_status = 'rejected'
            user.is_verified = False
            user.save()
        self.message_user(request, "Selected KYC documents rejected.")

@admin.register(UserOnlineStatus)
class UserOnlineStatusAdmin(admin.ModelAdmin):
    list_display = ('user', 'is_online', 'last_seen')
    list_filter = ('is_online', 'last_seen')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('last_seen',)
    autocomplete_fields = ['user']
    ordering = ('-is_online', '-last_seen')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')
