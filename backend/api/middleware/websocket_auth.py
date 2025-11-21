from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.contrib.sessions.models import Session
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)

User = get_user_model()


@database_sync_to_async
def get_user_from_session(session_key):
    """Get user from session key"""
    try:
        session = Session.objects.get(session_key=session_key)
        session_data = session.get_decoded()
        user_id = session_data.get('_auth_user_id')
        if user_id:
            return User.objects.get(pk=user_id)
    except (Session.DoesNotExist, User.DoesNotExist, KeyError) as e:
        logger.debug(f"Session lookup failed: {e}")
    return None


class WebSocketAuthMiddleware(BaseMiddleware):
    """
    Custom middleware to authenticate WebSocket connections using Django sessions.
    This works with session-based authentication from the HTTP API.
    """
    
    async def __call__(self, scope, receive, send):
        # Extract session key from cookies
        # WebSocket headers come as list of tuples: [(b'cookie', b'sessionid=...'), ...]
        session_key = None
        
        # Extract cookies from headers
        headers = dict(scope.get('headers', []))
        
        # Try to get session key from cookies
        if b'cookie' in headers:
            cookie_header = headers[b'cookie'].decode('utf-8')
            for cookie in cookie_header.split(';'):
                cookie = cookie.strip()
                if cookie.startswith('sessionid='):
                    session_key = cookie.split('=', 1)[1]
                    break
        
        # If not in cookies, try query string (for testing)
        if not session_key:
            query_string = scope.get('query_string', b'').decode('utf-8')
            if query_string:
                params = parse_qs(query_string)
                session_key = params.get('sessionid', [None])[0]
        
        # Get user from session
        if session_key:
            user = await get_user_from_session(session_key)
            if user:
                scope['user'] = user
                logger.debug(f"WebSocket authenticated user: {user.id}")
            else:
                scope['user'] = AnonymousUser()
                logger.debug("WebSocket: No user found for session")
        else:
            scope['user'] = AnonymousUser()
            logger.debug("WebSocket: No session key found")
        
        return await super().__call__(scope, receive, send)


def WebSocketAuthMiddlewareStack(inner):
    """Stack WebSocket auth middleware"""
    return WebSocketAuthMiddleware(inner)

