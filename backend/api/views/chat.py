from datetime import timedelta

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from django.db.models import Q, F
from django.utils import timezone

from api.models import Chat, Message, UserOnlineStatus, UserOnlineStatus

# Window within which a user can "delete for everyone" their own message.
# After this, only "delete for me" (per-user hide) is allowed. Mirrors the
# WhatsApp UX — that one is ~2 hours; we pick 60 min as a tighter default that
# still covers typo-and-resend cases without enabling stealth-edit-then-deny.
DELETE_FOR_EVERYONE_WINDOW = timedelta(minutes=60)
from api.utils.link_preview import extract_url, get_link_preview
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
    
    permission_classes = [permissions.IsAuthenticated, IsChatParticipant]
    csrf_exempt = True
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ChatDetailSerializer
        return ChatSerializer
    
    def get_queryset(self):
        """Return chats where current user is a participant.

        For the list endpoint: excludes chats the user has hidden (per-user
        soft-delete) and archived chats. Clients request archived chats with
        ?archived=true. Pinned chats sort to the top (Chat.Meta.ordering does
        this globally).

        For detail actions (retrieve + the @action endpoints like unarchive,
        unhide, archive, hide, pin, mute, etc.): DO NOT apply the hide/archive
        filter. Those actions explicitly target a chat that may be archived or
        hidden — filtering would 404 them every time. The participant check
        still applies so you can only act on your own chats.
        """
        user = self.request.user

        qs = Chat.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        ).select_related(
            'participant1', 'participant2', 'ad'
        ).distinct()

        if self.action == 'list':
            qs = qs.exclude(hidden_for_users=user)
            archived_param = self.request.query_params.get('archived', '').lower()
            want_archived = archived_param in ('1', 'true', 'yes')
            if want_archived:
                qs = qs.filter(is_archived=True)
            else:
                qs = qs.filter(is_archived=False)

        return qs
    
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
    
    @action(detail=True, methods=['post'])
    def clear(self, request, pk=None):
        """Per-user clear: hide every message in the chat from the caller's view.

        Adds the caller to Message.hidden_for_users for all messages currently
        in the chat. The other participant continues to see everything. New
        messages sent after this call are visible to the caller (they're not
        in hidden_for_users).
        """
        chat = self.get_object()
        user = request.user
        message_ids = list(chat.messages.values_list('id', flat=True))
        if not message_ids:
            return Response({'message': 'Chat already empty', 'count': 0})
        # Bulk insert into the M2M through-table — one query per the ORM's
        # M2M add semantics. For chats with thousands of messages this is
        # still O(1) round-trips; the through table inserts are batched.
        through = Message.hidden_for_users.through
        through.objects.bulk_create(
            [through(message_id=mid, user_id=user.id) for mid in message_ids],
            ignore_conflicts=True,  # idempotent if user clears twice
        )
        return Response({'message': 'Chat cleared for you', 'count': len(message_ids)})

    @action(detail=True, methods=['post'])
    def mute(self, request, pk=None):
        """Toggle mute for the requesting user (per-user, not global).

        Body: {"is_muted": true|false}. Defaults to true (mute).
        Adds/removes the caller from chat.muted_by — does not affect the other
        participant's mute state.
        """
        chat = self.get_object()
        user = request.user
        is_muted = bool(request.data.get('is_muted', True))
        if is_muted:
            chat.muted_by.add(user)
        else:
            chat.muted_by.remove(user)
        return Response({
            'message': 'Chat muted' if is_muted else 'Chat unmuted',
            'is_muted': is_muted,
        })

    @action(detail=True, methods=['post'])
    def hide(self, request, pk=None):
        """Soft-delete the chat for the requesting user only.

        The other participant continues to see the chat normally. If they send
        a new message, the chat reappears in our list (auto-unhide signal).
        """
        chat = self.get_object()
        chat.hidden_for_users.add(request.user)
        return Response({'message': 'Chat hidden', 'is_hidden': True})

    @action(detail=True, methods=['post'])
    def unhide(self, request, pk=None):
        """Restore a previously hidden chat for the requesting user."""
        chat = self.get_object()
        chat.hidden_for_users.remove(request.user)
        return Response({'message': 'Chat restored', 'is_hidden': False})

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive the chat. Shared between participants (WhatsApp semantics)."""
        chat = self.get_object()
        if not chat.is_archived:
            chat.is_archived = True
            chat.save(update_fields=['is_archived', 'updated_at'])
        return Response({'message': 'Chat archived', 'is_archived': True})

    @action(detail=True, methods=['post'])
    def unarchive(self, request, pk=None):
        """Unarchive the chat."""
        chat = self.get_object()
        if chat.is_archived:
            chat.is_archived = False
            chat.save(update_fields=['is_archived', 'updated_at'])
        return Response({'message': 'Chat unarchived', 'is_archived': False})

    @action(detail=True, methods=['post'])
    def pin(self, request, pk=None):
        """Pin the chat to the top of the list (shared between participants)."""
        chat = self.get_object()
        chat.pinned_at = timezone.now()
        chat.save(update_fields=['pinned_at', 'updated_at'])
        return Response({
            'message': 'Chat pinned',
            'pinned_at': chat.pinned_at.isoformat(),
        })

    @action(detail=True, methods=['post'])
    def unpin(self, request, pk=None):
        """Unpin the chat."""
        chat = self.get_object()
        if chat.pinned_at is not None:
            chat.pinned_at = None
            chat.save(update_fields=['pinned_at', 'updated_at'])
        return Response({'message': 'Chat unpinned', 'pinned_at': None})

    @action(detail=True, methods=['post'])
    def mark_unread(self, request, pk=None):
        """Mark the latest message in the chat as unread for the current user.

        The unread badge on the client is driven by Message.is_read filtered to
        messages NOT sent by the current user. Flipping the most-recent
        non-self message to is_read=False makes the chat reappear as unread.
        """
        chat = self.get_object()
        user = request.user
        latest = (
            chat.messages.exclude(sender=user)
            .order_by('-created_at')
            .first()
        )
        if not latest:
            return Response(
                {'detail': 'No incoming messages to mark unread.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if latest.is_read:
            latest.is_read = False
            latest.read_at = None
            latest.save(update_fields=['is_read', 'read_at', 'updated_at'])
        return Response({'message': 'Chat marked unread', 'message_id': str(latest.id)})


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
    csrf_exempt = True
    pagination_class = MessagePagination
    
    def _scope_from_request(self):
        """Read 'scope' from query params or body. Defaults to 'everyone' for
        backward compatibility with existing mobile clients that don't pass it.
        Valid values: 'me' (per-user soft hide), 'everyone' (hard delete)."""
        scope = (
            self.request.query_params.get('scope')
            or self.request.data.get('scope')
            or 'everyone'
        )
        scope = str(scope).lower()
        if scope not in ('me', 'everyone'):
            raise ValidationError({'scope': "Must be 'me' or 'everyone'."})
        return scope

    def perform_destroy(self, instance):
        """Soft delete-for-me OR hard delete-for-everyone (own + within window).

        - scope=me: add caller to instance.hidden_for_users (always allowed,
          even for messages from the other party).
        - scope=everyone: caller must be sender AND within
          DELETE_FOR_EVERYONE_WINDOW of created_at. Hard deletes the row.
        """
        user = self.request.user
        scope = self._scope_from_request()

        if scope == 'me':
            instance.hidden_for_users.add(user)
            return

        # scope == 'everyone'
        if instance.sender_id != user.id:
            raise PermissionDenied(
                "Only the sender can delete a message for everyone."
            )
        age = timezone.now() - instance.created_at
        if age > DELETE_FOR_EVERYONE_WINDOW:
            raise PermissionDenied(
                f"This message is older than {int(DELETE_FOR_EVERYONE_WINDOW.total_seconds() // 60)} "
                "minutes — you can only delete it for yourself."
            )
        instance.delete()

    def get_queryset(self):
        """Return messages for chats where current user is a participant.

        Excludes messages the user has hidden (per-user delete-for-me).
        """
        chat_id = self.request.query_params.get('chat')
        user = self.request.user

        if chat_id:
            # Verify user is participant in this chat
            chat = Chat.objects.filter(
                Q(id=chat_id) & (Q(participant1=user) | Q(participant2=user))
            ).first()
            if chat:
                return (
                    Message.objects.filter(chat=chat)
                    .exclude(hidden_for_users=user)
                    .order_by('-created_at')
                )
            return Message.objects.none()

        user_chats = Chat.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        )
        return (
            Message.objects.filter(chat__in=user_chats)
            .exclude(hidden_for_users=user)
            .order_by('-created_at')
        )
    
    def perform_create(self, serializer):
        """Create message - set sender and update chat's last_message_at"""
        # Get content from data
        content = self.request.data.get('content', '')
        
        # Link preview data
        extra_data = {}
        url = extract_url(content)
        if url:
            preview = get_link_preview(url)
            if preview:
                extra_data['link_url'] = preview['url']
                extra_data['link_title'] = preview['title']
                extra_data['link_description'] = preview['description']
                extra_data['link_image'] = preview['image']

        # Client-side ID for deduplication
        client_id = self.request.data.get('client_id')
        if client_id:
            extra_data['client_id'] = client_id

        message = serializer.save(sender=self.request.user, **extra_data)
        
        # Update chat's last_message_at
        message.chat.update_last_message_time()
    
    @action(detail=False, methods=['post'])
    def bulk_delete(self, request):
        """Delete multiple messages.

        Body: {"message_ids": [...], "scope": "me" | "everyone"}.
        - scope=me (default if omitted is 'everyone' for backward-compat): add
          caller to hidden_for_users on each message they're allowed to see.
        - scope=everyone: each must be caller's own message AND within
          DELETE_FOR_EVERYONE_WINDOW. Mixed batches partially fail loudly.
        """
        message_ids = request.data.get('message_ids', [])
        if not message_ids:
            return Response(
                {'detail': 'message_ids is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        scope = str(request.data.get('scope', 'everyone')).lower()
        if scope not in ('me', 'everyone'):
            return Response(
                {'detail': "scope must be 'me' or 'everyone'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        user_chats = Chat.objects.filter(
            Q(participant1=user) | Q(participant2=user)
        )

        if scope == 'me':
            # User can hide any visible message — own or other party's.
            messages = Message.objects.filter(
                id__in=message_ids,
                chat__in=user_chats,
            )
            count = 0
            for msg in messages:
                msg.hidden_for_users.add(user)
                count += 1
            return Response({
                'message': f'{count} messages hidden',
                'count': count,
                'scope': 'me',
            })

        # scope == 'everyone' — own messages within the window only.
        cutoff = timezone.now() - DELETE_FOR_EVERYONE_WINDOW
        messages = Message.objects.filter(
            id__in=message_ids,
            sender=user,
            chat__in=user_chats,
            created_at__gte=cutoff,
        )
        count = messages.count()
        messages.delete()
        rejected = len(message_ids) - count
        return Response({
            'message': f'{count} messages deleted',
            'count': count,
            'rejected': rejected,
            'scope': 'everyone',
        })

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
        """Return online status for people the current user is chatting with"""
        user = self.request.user
        user_id = self.request.query_params.get('user_id')
        
        if user_id:
            # Only allow looking up specific users
            return UserOnlineStatus.objects.filter(user_id=user_id)
        
        # Default: return statuses of all users the current user is chatting with
        # This is more efficient than the previous default which only returned current user
        from django.db.models import Q
        chats = Chat.objects.filter(Q(participant1=user) | Q(participant2=user))
        
        # Get IDs of all participants in these chats
        participant_ids = set()
        for chat in chats:
            participant_ids.add(chat.participant1_id)
            participant_ids.add(chat.participant2_id)
        
        return UserOnlineStatus.objects.filter(user_id__in=participant_ids)
    
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

