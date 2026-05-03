"""
Custom Session Authentication that enforces CSRF protection
"""
from rest_framework.authentication import SessionAuthentication
from django.middleware.csrf import get_token


class CSRFEnforcedSessionAuthentication(SessionAuthentication):
    """
    Session authentication with CSRF enforcement.
    This ensures CSRF tokens are validated for all authenticated requests.
    """
    
    def enforce_csrf(self, request):
        """
        Enforce CSRF check for session-based authentication.
        """
        # Get the underlying HttpRequest
        http_request = request._request
        
        # Get CSRF token from headers or cookies
        csrf_token = request.META.get('HTTP_X_CSRFTOKEN') or http_request.COOKIES.get('csrftoken')
        
        if not csrf_token:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('CSRF token missing from request')
        
        # In Django 4.x/5.x, the best way to validate is using process_view on a middleware instance
        from django.middleware.csrf import CsrfViewMiddleware
        
        # Temporarily mock the view as NOT exempt so the middleware actually checks it
        # This is because SessionAuthentication.enforce_csrf is often called AFTER
        # middleware might have already decided to skip it.
        try:
            middleware = CsrfViewMiddleware(lambda x: None)
            # Use the official process_view to perform the full check (Origin, Referer, Token)
            reason = middleware.process_view(http_request, None, (), {})
            
            if reason:
                from rest_framework.exceptions import PermissionDenied
                # The reason is often an HttpResponseForbidden, get its string representation
                reason_text = reason.content.decode('utf-8') if hasattr(reason, 'content') else str(reason)
                raise PermissionDenied(f'CSRF validation failed: {reason_text}')
        except Exception as e:
            from rest_framework.exceptions import PermissionDenied
            if isinstance(e, PermissionDenied):
                raise e
            raise PermissionDenied(f'CSRF enforcement error: {str(e)}')
    
    def authenticate(self, request):
        """
        Authenticate the user and enforce CSRF for state-changing methods.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Get the session-based user from the underlying HttpRequest
        user = getattr(request._request, 'user', None)
        
        logger.debug("Session auth: path=%s method=%s authenticated=%s", request.path, request.method, bool(user and user.is_authenticated))
        
        if not user or not user.is_authenticated:
            return None

        if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            return (user, None)

        try:
            self.enforce_csrf(request)
        except Exception as e:
            logger.warning("Session auth CSRF failed for %s: %s", request.path, str(e))
            raise e
        
        return (user, None)
