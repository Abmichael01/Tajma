from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q
from django.conf import settings
from api.models import Ad, Category, Region, SavedAd, Review, SearchQuery

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent', 'category_type', 'is_active', 'sort_order')
    list_filter = ('is_active', 'category_type', 'parent')
    search_fields = ('name', 'slug')
    ordering = ('parent__id', 'sort_order', 'name')
    prepopulated_fields = {'slug': ('name',)}
    autocomplete_fields = ['parent']
    
    fieldsets = (
        ('Basic Information', {'fields': ('name', 'slug', 'parent', 'category_type', 'is_active', 'sort_order')}),
        ('Appearance', {'fields': ('icon', 'image_url', 'description')}),
        ('Dynamic Attributes', {
            'fields': ('custom_fields',),
            'description': 'Define custom fields for ads in this category (JS array of objects).'
        }),
    )

@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = (
        'featured_status', 'title', 'seller', 'category', 'ad_type', 
        'price_display', 'status', 'promotion_rank',
        'views', 'created_at', 'image_preview',
    )
    list_filter = (
        'status', 'is_featured', 'ad_type', 'category', 
        'is_negotiable', 'created_at', 'published_at',
    )
    search_fields = ('title', 'description', 'seller__email', 'seller__username', 'slug')
    readonly_fields = (
        'id', 'slug', 'seller', 'ad_type', 'views', 
        'created_at', 'updated_at', 'published_at', 'image_preview',
    )
    autocomplete_fields = ['category', 'seller']
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)
    list_per_page = 25
    actions = ['make_published', 'make_draft', 'make_archived']
    
    fieldsets = (
        ('Basic Information', {'fields': ('id', 'slug', 'title', 'description', 'seller', 'category', 'ad_type')}),
        ('Pricing', {'fields': ('price', 'currency', 'is_negotiable')}),
        ('Media', {'fields': ('images', 'image_preview')}),
        ('Attributes', {'fields': ('attributes',)}),
        ('Status & Metadata', {'fields': ('status', 'is_featured', 'promotion_rank', 'views', 'published_at', 'created_at', 'updated_at')}),
    )
    
    def price_display(self, obj):
        if obj.price:
            return f"{obj.currency} {obj.price:,.2f}"
        return "Contact for price"
    price_display.short_description = 'Price'
    
    def image_preview(self, obj):
        if obj.images and len(obj.images) > 0:
            first_image = obj.images[0]
            if isinstance(first_image, str):
                if first_image.startswith('http'):
                    image_url = first_image
                else:
                    base_url = getattr(settings, 'SITE_URL', 'http://localhost:8000')
                    media_url = getattr(settings, 'MEDIA_URL', '/media/')
                    image_url = f"{base_url}{media_url}{first_image.lstrip('/')}"
                return format_html('<img src="{}" style="max-width: 100px; max-height: 100px; object-fit: cover;" />', image_url)
        return "No image"
    image_preview.short_description = 'Preview'
    
    def featured_status(self, obj):
        if obj.is_featured:
            return format_html(
                '<span style="color: #d4af37; font-weight: bold; border: 1px solid #d4af37; padding: 2px 6px; borderRadius: 4px;">★ FEATURED</span>'
            )
        if obj.promotion_rank == 50:
            return format_html(
                '<span style="color: #2563eb; font-weight: bold; border: 1px solid #2563eb; padding: 2px 6px; borderRadius: 4px;">↑ BOOSTED</span>'
            )
        return format_html('<span style="color: #94a3b8;">Standard</span>')
    featured_status.short_description = 'Tier'
    featured_status.admin_order_field = 'is_featured'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('seller', 'category', 'category__parent')
    
    @admin.action(description='Mark selected ads as published')
    def make_published(self, request, queryset):
        from django.utils import timezone
        updated = queryset.update(status='published', published_at=timezone.now())
        self.message_user(request, f'{updated} ad(s) marked as published.')

    @admin.action(description='Mark selected ads as draft')
    def make_draft(self, request, queryset):
        updated = queryset.update(status='draft')
        self.message_user(request, f'{updated} ad(s) marked as draft.')

    @admin.action(description='Archive selected ads')
    def make_archived(self, request, queryset):
        updated = queryset.update(status='archived')
        self.message_user(request, f'{updated} ad(s) archived.')

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'ad_count', 'is_active', 'sort_order', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'slug')
    readonly_fields = ('created_at', 'updated_at')
    prepopulated_fields = {'slug': ('name',)}
    ordering = ('sort_order', 'name')
    
    def get_queryset(self, request):
        return super().get_queryset(request).annotate(
            ad_count_val=Count('users__ads', filter=Q(users__ads__status='published'))
        )
    
    def ad_count(self, obj):
        return getattr(obj, 'ad_count_val', 0)
    ad_count.short_description = 'Ads Count'

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'ad', 'reviewer', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('comment', 'reviewer__email', 'ad__title')
    readonly_fields = ('id', 'created_at', 'updated_at')
    autocomplete_fields = ['ad', 'reviewer']

@admin.register(SavedAd)
class SavedAdAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ad', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('user__email', 'ad__title')
    readonly_fields = ('id', 'created_at')
    autocomplete_fields = ['user', 'ad']

@admin.register(SearchQuery)
class SearchQueryAdmin(admin.ModelAdmin):
    list_display = ('query', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('query', 'user__email')
    readonly_fields = ('created_at',)
