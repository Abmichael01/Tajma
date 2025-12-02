from rest_framework import serializers
from api.models import Notification
from api.serializers.user import UserSummarySerializer


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notification model"""
    
    # Ensure IDs are serialized as strings (UUIDs)
    id = serializers.UUIDField(read_only=True)
    recipient = UserSummarySerializer(read_only=True, allow_null=True)
    related_ad = serializers.PrimaryKeyRelatedField(read_only=True, allow_null=True)
    related_user = serializers.PrimaryKeyRelatedField(read_only=True, allow_null=True)
    
    # Additional fields for convenience
    related_ad_title = serializers.CharField(source='related_ad.title', read_only=True, allow_null=True)
    related_ad_slug = serializers.CharField(source='related_ad.slug', read_only=True, allow_null=True)
    related_user_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Notification
        fields = [
            'id',
            'recipient',
            'type',
            'title',
            'message',
            'is_read',
            'related_ad',
            'related_ad_title',
            'related_ad_slug',
            'related_user',
            'related_user_name',
            'created_at',
            'read_at',
        ]
        read_only_fields = ['id', 'recipient', 'created_at', 'read_at']
    
    def to_representation(self, instance):
        """Convert the notification to a dictionary representation"""
        data = super().to_representation(instance)
        
        # Ensure all ID fields are strings (UUIDs)
        if data.get('id'):
            data['id'] = str(data['id'])
        if data.get('related_ad'):
            data['related_ad'] = str(data['related_ad'])
        if data.get('related_user'):
            data['related_user'] = str(data['related_user']) if isinstance(data['related_user'], (int, str)) else data['related_user']
        # recipient is now a nested object, so we don't need to convert it
        
        # Ensure datetime fields are ISO format strings
        if data.get('created_at'):
            if hasattr(data['created_at'], 'isoformat'):
                data['created_at'] = data['created_at'].isoformat()
        if data.get('read_at'):
            if hasattr(data['read_at'], 'isoformat'):
                data['read_at'] = data['read_at'].isoformat()
        
        return data
    
    def get_related_user_name(self, obj):
        """Get related user's display name"""
        if obj.related_user:
            return obj.related_user.get_full_name() or obj.related_user.email.split('@')[0]
        return None


class NotificationCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating notifications"""
    
    class Meta:
        model = Notification
        fields = [
            'recipient',
            'type',
            'title',
            'message',
            'related_ad',
            'related_user',
        ]
    
    def create(self, validated_data):
        """Create notification and send via WebSocket if possible"""
        notification = super().create(validated_data)
        
        # Send via WebSocket (will be handled by consumer)
        # This is done via signals to avoid circular imports
        return notification

