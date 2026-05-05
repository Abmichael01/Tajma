from django.db import close_old_connections
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.contrib.auth import get_user_model
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from urllib.parse import parse_qs
import logging

logger = logging.getLogger(__name__)
User = get_user_model()

@database_sync_to_async
def get_user(user_id):
    try:
        return User.objects.get(id=user_id)
    except User.DoesNotExist:
        return AnonymousUser()

class JWTAuthMiddleware:
    """
    Custom middleware for Django Channels to authenticate users via JWT in the query string.
    Expected format: ws://.../?token=<JWT_TOKEN>
    """
    def __init__(self, inner):
        self.inner = inner

    async def __call__(self, scope, receive, send):
        # Close old database connections to prevent usage of timed out connections
        close_old_connections()

        # Get the token from query string
        query_string = parse_qs(scope["query_string"].decode("utf8"))
        token = query_string.get("token")

        if not token:
            scope["user"] = AnonymousUser()
        else:
            token = token[0]
            try:
                # Validate the token using SimpleJWT's UntypedToken
                # This validates the signature and expiration
                validated_token = UntypedToken(token)
                
                # Get user_id from the payload
                user_id = validated_token.get("user_id")
                
                if user_id:
                    scope["user"] = await get_user(user_id)
                else:
                    logger.warning("WebSocket JWT payload missing user_id")
                    scope["user"] = AnonymousUser()
            except (InvalidToken, TokenError) as e:
                logger.warning(f"WebSocket JWT Authentication failed: {e}")
                scope["user"] = AnonymousUser()
            except Exception as e:
                logger.error(f"Unexpected error in WebSocket JWT Auth: {e}")
                scope["user"] = AnonymousUser()

        return await self.inner(scope, receive, send)

def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(inner)
