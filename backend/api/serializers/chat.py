from rest_framework import serializers
from api.models import Chat, Message, UserOnlineStatus, Ad
from api.serializers.user import UserSummarySerializer
from api.utils.image_url import build_full_image_url


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for Message model"""
    sender = UserSummarySerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    chat = serializers.PrimaryKeyRelatedField(queryset=Chat.objects.all(), write_only=True)
    parent_message = serializers.SerializerMethodField()
    parent_message_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    
    class Meta:
        model = Message
        fields = [
            'id', 'chat', 'sender', 'sender_id', 'content', 'attachment', 'message_type',
            'is_read', 'read_at', 'delivered_at', 'created_at', 'updated_at',
            'parent_message', 'parent_message_id', 'client_id',
            'link_url', 'link_title', 'link_description', 'link_image'
        ]
        read_only_fields = ['id', 'sender', 'read_at', 'delivered_at', 'created_at', 'updated_at', 'parent_message', 'link_title', 'link_description', 'link_image']
    
    def get_parent_message(self, obj):
        if obj.parent_message:
            # Avoid infinite recursion by not serializing the parent's parent
            return {
                'id': str(obj.parent_message.id),
                'content': obj.parent_message.content,
                'message_type': obj.parent_message.message_type,
                'sender': UserSummarySerializer(obj.parent_message.sender).data
            }
        return None

    def validate_attachment(self, value):
        """Check if attachment size is within limits (20MB)"""
        if value:
            # 20MB = 20 * 1024 * 1024 bytes
            max_size = 20 * 1024 * 1024
            if value.size > max_size:
                raise serializers.ValidationError("File size cannot exceed 20MB.")
        return value

    def validate_chat(self, value):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            raise serializers.ValidationError("Authentication is required.")
        if value.participant1_id != user.id and value.participant2_id != user.id:
            raise serializers.ValidationError("You are not a participant in this chat.")
        return value

    def validate(self, attrs):
        attrs = super().validate(attrs)
        parent_message_id = attrs.get('parent_message_id')
        chat = attrs.get('chat') or getattr(self.instance, 'chat', None)

        if parent_message_id and chat:
            if not Message.objects.filter(id=parent_message_id, chat=chat).exists():
                raise serializers.ValidationError({
                    'parent_message_id': 'Parent message must belong to the same chat.'
                })
        return attrs

    def to_representation(self, instance):
        """Ensure UUIDs are converted to strings and attachments have absolute URLs"""
        data = super().to_representation(instance)
        
        # Handle chat field conversion to string UUID
        if hasattr(instance, 'chat') and instance.chat:
            data['chat'] = str(instance.chat.id)
        
        # Ensure absolute URL for attachment
        if instance.attachment:
            request = self.context.get('request')
            data['attachment'] = build_full_image_url(instance.attachment.url, request)

        
        return data
    
    def create(self, validated_data):
        # Set sender from request user if not provided
        request = self.context.get('request')
        if request and request.user:
            validated_data['sender'] = request.user
        return super().create(validated_data)


class ChatSerializer(serializers.ModelSerializer):
    """Serializer for Chat model with basic info"""
    participant1 = UserSummarySerializer(read_only=True)
    participant2 = UserSummarySerializer(read_only=True)
    participant1_id = serializers.IntegerField(write_only=True)
    participant2_id = serializers.IntegerField(write_only=True)
    ad = serializers.PrimaryKeyRelatedField(queryset=Ad.objects.all(), required=False, allow_null=True, read_only=False)
    ad_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    ad_title = serializers.CharField(source='ad.title', read_only=True, allow_null=True)
    ad_slug = serializers.CharField(source='ad.slug', read_only=True, allow_null=True)
    ad_image = serializers.SerializerMethodField()
    ad_price = serializers.SerializerMethodField()
    ad_currency = serializers.CharField(source='ad.currency', read_only=True, allow_null=True)
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Chat
        fields = [
            'id', 'participant1', 'participant1_id', 'participant2', 'participant2_id',
            'ad', 'ad_id', 'ad_title', 'ad_slug', 'ad_image', 'ad_price', 'ad_currency',
            'created_at', 'updated_at', 'last_message_at', 'last_message', 'unread_count',
            'is_muted'
        ]
        read_only_fields = ['id', 'participant1', 'participant2', 'created_at', 'updated_at', 'last_message_at']
    
    def get_ad_image(self, obj):
        """Get the first image from the ad as absolute URL"""
        from django.conf import settings
        import logging
        
        logger = logging.getLogger(__name__)
        
        # Check if ad exists and is loaded
        if not obj.ad:
            logger.debug(f"Chat {obj.id}: No ad associated, returning None for ad_image")
            return None
        
        # Check if ad has images attribute
        if not hasattr(obj.ad, 'images'):
            logger.warning(f"Chat {obj.id}: Ad {obj.ad.id} does not have 'images' attribute")
            return None
        
        # Check if images exist
        if not obj.ad.images:
            logger.debug(f"Chat {obj.id}: Ad {obj.ad.id} has no images")
            return None
        
        # Initialize image_path and extract from images
        image_path = None
        # Handle both list and string formats
        if isinstance(obj.ad.images, list) and len(obj.ad.images) > 0:
            image_path = obj.ad.images[0]
        elif isinstance(obj.ad.images, str):
            image_path = obj.ad.images
        
        if not image_path:
            logger.debug(f"Chat {obj.id}: Ad {obj.ad.id} images field is empty or invalid")
            return None
        try:
            request = self.context.get('request')
            # Build full URL using unified utility
            return build_full_image_url(image_path, request)

        except Exception as e:
            logger.error(f"Chat {obj.id}: Error processing ad image for ad {obj.ad.id}: {e}", exc_info=True)
        return None
    
    def get_ad_price(self, obj):
        """Get formatted price from the ad"""
        if obj.ad and obj.ad.price:
            return str(obj.ad.price)
        return None
    
    def get_last_message(self, obj):
        """Get the last message in the chat"""
        try:
            last_msg = obj.messages.last()
            if last_msg:
                # Pass context to MessageSerializer to ensure proper serialization
                serializer = MessageSerializer(last_msg, context=self.context)
                return serializer.data
        except Exception as e:
            # Log error but don't fail the entire serialization
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error serializing last message for chat {obj.id}: {e}")
        return None
    
    def get_unread_count(self, obj):
        """Get count of unread messages for the current user"""
        try:
            request = self.context.get('request')
            if not request or not request.user:
                return 0
            return obj.messages.filter(is_read=False).exclude(sender=request.user).count()
        except Exception as e:
            # Log error but don't fail the entire serialization
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Error getting unread count for chat {obj.id}: {e}")
            return 0
    
    def validate(self, data):
        """Ensure participant1 and participant2 are different"""
        participant1_id = data.get('participant1_id')
        participant2_id = data.get('participant2_id')
        
        if participant1_id == participant2_id:
            raise serializers.ValidationError("Participants must be different users")
        
        return data
    
    def create(self, validated_data):
        # Get user objects
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        p1_id = validated_data.pop('participant1_id')
        p2_id = validated_data.pop('participant2_id')
        
        # Handle ad_id if present - convert to ad object
        ad_id = validated_data.pop('ad_id', None)
        if ad_id:
            from api.models import Ad
            try:
                validated_data['ad'] = Ad.objects.get(id=ad_id)
            except Ad.DoesNotExist:
                raise serializers.ValidationError({'ad_id': f'Ad with id {ad_id} does not exist'})
        
        # Ensure consistent ordering: smaller ID is participant1
        if p1_id > p2_id:
            p1_id, p2_id = p2_id, p1_id
        
        participant1 = User.objects.get(id=p1_id)
        participant2 = User.objects.get(id=p2_id)
        
        validated_data['participant1'] = participant1
        validated_data['participant2'] = participant2
        
        return super().create(validated_data)


class ChatDetailSerializer(ChatSerializer):
    """Detailed serializer for Chat with messages"""
    messages = MessageSerializer(many=True, read_only=True)
    
    class Meta(ChatSerializer.Meta):
        fields = ChatSerializer.Meta.fields + ['messages']


class UserOnlineStatusSerializer(serializers.ModelSerializer):
    """Serializer for UserOnlineStatus"""
    user = UserSummarySerializer(read_only=True)
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    
    class Meta:
        model = UserOnlineStatus
        fields = ['user', 'user_id', 'is_online', 'last_seen']
        read_only_fields = ['user', 'user_id', 'is_online', 'last_seen']
