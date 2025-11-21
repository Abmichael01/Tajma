from rest_framework import permissions
from api.models import Chat


class IsChatParticipant(permissions.BasePermission):
    """
    Permission to check if user is a participant in the chat.
    """
    
    def has_object_permission(self, request, view, obj):
        # For Message objects, check if user is participant in the message's chat
        if hasattr(obj, 'chat'):
            chat = obj.chat
        # For Chat objects, check directly
        elif isinstance(obj, Chat):
            chat = obj
        else:
            return False
        
        # Check if user is participant1 or participant2
        return chat.participant1 == request.user or chat.participant2 == request.user


