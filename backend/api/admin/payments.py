from django.contrib import admin
from api.models import Transaction, Promotion

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('reference', 'user', 'amount', 'currency', 'status', 'provider', 'created_at')
    list_filter = ('status', 'provider', 'created_at')
    search_fields = ('reference', 'user__email', 'user__username')
    readonly_fields = ('id', 'created_at', 'updated_at')
    ordering = ('-created_at',)

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('ad', 'promotion_type', 'start_at', 'end_at', 'is_active', 'created_at')
    list_filter = ('promotion_type', 'is_active', 'created_at')
    search_fields = ('ad__title', 'ad__slug')
    readonly_fields = ('id', 'created_at')
    ordering = ('-created_at',)
    actions = ['activate', 'deactivate']

    @admin.action(description='Activate selected promotions')
    def activate(self, request, queryset):
        queryset.update(is_active=True)
    
    @admin.action(description='Deactivate selected promotions')
    def deactivate(self, request, queryset):
        queryset.update(is_active=False)
