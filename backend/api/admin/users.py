from django.contrib import admin
from api.models import User, KYCVerification, UserOnlineStatus

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('email', 'username', 'is_active', 'is_seller', 'is_staff', 'kyc_status')
    search_fields = ('email', 'username')
    list_filter = ('is_active', 'is_seller', 'is_staff', 'kyc_status')
    readonly_fields = ('id', 'date_joined', 'last_login')

@admin.register(KYCVerification)
class KYCVerificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_type', 'country', 'status', 'created_at')
    list_filter = ('status', 'document_type', 'country', 'created_at')
    search_fields = ('user__email', 'job_id', 'smile_user_id')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)

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
