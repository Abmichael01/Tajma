from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.utils import timezone

from api.models import Chat, Message, UserOnlineStatus
from api.serializers import (
    ChatSerializer, 
    ChatDetailSerializer, 
    MessageSerializer,
    UserOnlineStatusSerializer
)
from api.permissions import IsChatParticipant
from api.signals.chat_signals import broadcast_message_read_status
from api.pagination import MessagePagination


class ChatViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing chats.
    - List: Get all chats for the current user
    - Create: Create a new chat (or get existing one)
    - Retrieve: Get chat details with messages
    - Update: Update chat (e.g., mark as read)
    """
    
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatDetailSerializer
        return ChatSerializer
    
    def get_queryset(self):
        """Return chats where current user is a participant"""
        user = self.request.user
        # Optimize queryset - select related for foreign keys, but don't prefetch all messages
        # The serializer will efficiently get last message using .last() which uses LIMIT 1
        return Chat.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).select_related(
            'participant1', 'participant2', 'ad'
        ).distinct()
    
    def get_serializer_context(self):
        """Ensure request context is always passed to serializer"""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def perform_create(self, serializer):
        """Create chat - ensure current user is participant1"""
        user = self.request.user
        participant2_id = serializer.validated_data.get('participant2_id')
        
        # Set participant1 to current user
        serializer.save(participant1=user)
    
    @action(detail=False, methods=['post'])
    def get_or_create(self, request):
        """
        Get existing chat or create new one.
        Used when starting a conversation from an ad or profile.
        """
        participant2_id = request.data.get('participant2_id')
        ad_id = request.data.get('ad_id')
        
        if not participant2_id:
            return Response(
                {'detail': 'participant2_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if chat already exists
        # Handle case where ad_id might be None
        if ad_id:
            chat = Chat.objects.filter(
                Q(participant1=request.user, participant2_id=participant2_id, ad_id=ad_id) |
                Q(participant1_id=participant2_id, participant2=request.user, ad_id=ad_id)
            ).first()
        else:
            chat = Chat.objects.filter(
                Q(participant1=request.user, participant2_id=participant2_id, ad__isnull=True) |
                Q(participant1_id=participant2_id, participant2=request.user, ad__isnull=True)
            ).first()
        
        if chat:
            serializer = ChatDetailSerializer(chat, context={'request': request})
            return Response(serializer.data)
        
        # Create new chat
        chat_data = {
            'participant1_id': request.user.id,
            'participant2_id': participant2_id,
        }
        if ad_id:
            chat_data['ad_id'] = ad_id
        
        serializer = self.get_serializer(data=chat_data)
        serializer.is_valid(raise_exception=True)
        chat = serializer.save()
        
        serializer = ChatDetailSerializer(chat, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark all messages in chat as read for current user.
        Uses REST API to update database, then broadcasts via WebSocket.
        """
        chat = self.get_object()
        user = request.user
        
        # Get message IDs before updating (for broadcasting)
        unread_messages = chat.messages.filter(
            is_read=False
        ).exclude(sender=user)
        message_ids = list(unread_messages.values_list('id', flat=True))
        
        # Mark all unread messages (not sent by current user) as read
        updated = unread_messages.update(
            is_read=True,
            read_at=timezone.now()
        )
        
        # Broadcast read status updates via WebSocket
        if updated > 0 and message_ids:
            broadcast_message_read_status(
                chat_id=str(chat.id),
                message_ids=message_ids,
                user_id=user.id
            )
        
        return Response({
            'message': f'{updated} messages marked as read',
            'count': updated
        })


class MessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing messages.
    - List: Get messages for a chat (paginated, newest first)
    - Create: Send a new message
    - Retrieve: Get a single message
    - Update: Update message (e.g., edit)
    - Destroy: Delete message
    """
    
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated, IsChatParticipant]
    pagination_class = MessagePagination
    
    def get_queryset(self):
        """Return messages for chats where current user is a participant"""
        chat_id = self.request.query_params.get('chat')
        user = self.request.user
        
        if chat_id:
            # Verify user is participant in this chat
            chat = Chat.objects.filter(
                Q(id=chat_id) & (Q(participant1=user) | Q(participant2=user))
            ).first()
            if chat:
                # Return messages ordered by newest first (for pagination)
                # Frontend will reverse to show oldest at top, newest at bottom
                return Message.objects.filter(chat=chat).order_by('-created_at')
            return Message.objects.none()
        
        # Return all messages from user's chats
        user_chats = Chat.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        )
        return Message.objects.filter(chat__in=user_chats).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Create message - set sender and update chat's last_message_at"""
        message = serializer.save(sender=self.request.user)
        
        # Update chat's last_message_at
        message.chat.update_last_message_time()
    
    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        """
        Mark message as read.
        Uses REST API to update database, then signal broadcasts via WebSocket.
        """
        message = self.get_object()
        message.mark_as_read()  # This triggers post_save signal which broadcasts
        serializer = self.get_serializer(message)
        return Response(serializer.data)


class UserOnlineStatusViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user online status.
    - List: Get online status for multiple users
    - Retrieve: Get online status for a user
    - Update: Update online status (set online/offline)
    """
    
    serializer_class = UserOnlineStatusSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Return online status for current user or all users"""
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return UserOnlineStatus.objects.filter(user_id=user_id)
        return UserOnlineStatus.objects.all()
    
    @action(detail=False, methods=['post'])
    def set_online(self, request):
        """Set current user as online"""
        status_obj, created = UserOnlineStatus.objects.get_or_create(
            user=request.user
        )
        status_obj.set_online()
        serializer = self.get_serializer(status_obj)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def set_offline(self, request):
        """Set current user as offline"""
        status_obj, created = UserOnlineStatus.objects.get_or_create(
            user=request.user
        )
        status_obj.set_offline()
        serializer = self.get_serializer(status_obj)
        return Response(serializer.data)

