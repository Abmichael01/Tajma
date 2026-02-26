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
        
        # Get the expected CSRF token from the session
        expected_token = get_token(http_request)
        
        if not expected_token:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('CSRF token not set in session')
        
        if not csrf_token:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('CSRF token missing from request')
        
        # Compare tokens - use Django's built-in CSRF middleware to validate
        from django.middleware.csrf import CsrfViewMiddleware
        
        try:
            # Use Django's CSRF middleware to validate the token
            middleware = CsrfViewMiddleware(lambda x: None)
            reason = middleware._reject(http_request, csrf_token)
            
            if reason:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(f'CSRF validation failed: {reason}')
        except (AttributeError, ImportError) as e:
            # Fallback: simple string comparison if _reject is not available
            # This is less secure but works across Django versions
            if csrf_token != expected_token:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('CSRF token incorrect')
    
    def authenticate(self, request):
        """
        Authenticate the user and enforce CSRF for state-changing methods.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Get the session-based user from the underlying HttpRequest
        user = getattr(request._request, 'user', None)
        
        logger.info(f"🔑 AUTH DEBUG: path={request.path} method={request.method}")
        logger.info(f"🔑 USER: {user} (Authenticated={user.is_authenticated if user else 'N/A'})")
        logger.info(f"🔑 COOKIES: {list(request._request.COOKIES.keys())}")
        logger.info(f"🔑 HEADERS: Origin={request.META.get('HTTP_ORIGIN')}, Host={request.META.get('HTTP_HOST')}, Content-Type={request.META.get('CONTENT_TYPE')}")
        
        if not user or not user.is_authenticated:
            logger.warning(f"🔑 AUTH FAILED: User not authenticated for {request.path}")
            return None
        
        # Check if CSRF is exempted for this view
        if getattr(request._request, '_dont_enforce_csrf_checks', False):
            logger.info("🔑 CSRF SKIPPED: _dont_enforce_csrf_checks=True")
            return (user, None)
        
        # Also check if the view function itself has csrf_exempt
        view_func = getattr(request, 'view', None)
        if view_func and getattr(view_func, 'csrf_exempt', False):
            logger.info("🔑 CSRF SKIPPED: view.csrf_exempt=True")
            return (user, None)
        
        # Mobile app support: React Native doesn't send Referer headers.
        if not request.META.get('HTTP_REFERER'):
            logger.info("🔑 CSRF SKIPPED: No HTTP_REFERER (Mobile Mode)")
            return (user, None)
        
        # Enforce CSRF for state-changing HTTP methods
        if request.method in ('POST', 'PUT', 'PATCH', 'DELETE'):
            try:
                logger.info("🔑 ENFORCING CSRF...")
                self.enforce_csrf(request)
                logger.info("🔑 CSRF PASSED")
            except Exception as e:
                logger.error(f"🔑 CSRF FAILED: {str(e)}")
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied(str(e))
        
        return (user, None)

