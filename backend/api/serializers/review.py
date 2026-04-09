from rest_framework import serializers
from django.conf import settings
from api.models import Review, Ad
from api.serializers.user import UserSummarySerializer
from api.utils.image_url import build_full_image_url


class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for Review model"""
    
    reviewer = UserSummarySerializer(read_only=True)
    reviewer_name = serializers.SerializerMethodField()
    reviewer_avatar = serializers.SerializerMethodField()
    ad_title = serializers.CharField(source='ad.title', read_only=True)
    ad_slug = serializers.CharField(source='ad.slug', read_only=True)
    
    class Meta:
        model = Review
        fields = [
            'id',
            'ad',
            'ad_title',
            'ad_slug',
            'reviewer',
            'reviewer_name',
            'reviewer_avatar',
            'seller',
            'rating',
            'comment',
            'helpful_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'seller', 'created_at', 'updated_at', 'helpful_count']
    
    def get_reviewer_name(self, obj):
        """Get reviewer's display name"""
        if obj.reviewer:
            return obj.reviewer.get_full_name() or obj.reviewer.email.split('@')[0]
        return 'Anonymous'
    
    def get_reviewer_avatar(self, obj):
        """Get reviewer's avatar URL, normalized to full URL using request's host"""
        if not obj.reviewer or not obj.reviewer.avatar:
            return None
        
        request = self.context.get('request')
        return build_full_image_url(obj.reviewer.avatar, request)
    
    def validate_ad(self, ad):
        """Ensure ad exists and is published"""
        if ad.status != 'published':
            raise serializers.ValidationError('You can only review published ads.')
        return ad
    
    def validate(self, attrs):
        """Ensure reviewer is not the seller"""
        ad = attrs.get('ad') or getattr(self.instance, 'ad', None)
        reviewer = self.context['request'].user
        
        if ad and reviewer == ad.seller:
            raise serializers.ValidationError('You cannot review your own ad.')
        
        return attrs
    
    def create(self, validated_data):
        """Create review and set seller automatically"""
        validated_data['reviewer'] = self.context['request'].user
        validated_data['seller'] = validated_data['ad'].seller
        return super().create(validated_data)


class ReviewCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for creating reviews"""
    
    class Meta:
        model = Review
        fields = ['ad', 'rating', 'comment']
    
    def validate_ad(self, ad):
        """Ensure ad exists and is published"""
        if ad.status != 'published':
            raise serializers.ValidationError('You can only review published ads.')
        return ad
    
    def validate(self, attrs):
        """Ensure reviewer is not the seller"""
        ad = attrs.get('ad')
        reviewer = self.context['request'].user
        
        if ad and reviewer == ad.seller:
            raise serializers.ValidationError('You cannot review your own ad.')
        
        return attrs
    
    def create(self, validated_data):
        """Create review and set reviewer and seller automatically"""
        validated_data['reviewer'] = self.context['request'].user
        validated_data['seller'] = validated_data['ad'].seller
        return super().create(validated_data)

