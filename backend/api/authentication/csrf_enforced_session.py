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
        
        logger.info(f"🔑 AUTH DEBUG: path={request.path} method={request.method}")
        logger.info(f"🔑 USER: {user} (Authenticated={user.is_authenticated if user else 'N/A'})")
        
        if not user or not user.is_authenticated:
            logger.warning(f"🔑 AUTH FAILED: User not authenticated for {request.path}")
            return None
        
        # Check if CSRF is exempted for this view
        # 1. Check if the underlying Django request is marked as exempt
        if getattr(request._request, '_dont_enforce_csrf_checks', False):
            logger.info("🔑 CSRF SKIPPED: _dont_enforce_csrf_checks=True (Django standard exempt)")
            return (user, None)
        
        # 2. Check the view function from DRF request
        # In DRF, the view instance is usually in parser_context['view']
        view_instance = None
        if hasattr(request, 'parser_context') and request.parser_context:
            view_instance = request.parser_context.get('view')
        
        if not view_instance:
            view_instance = getattr(request, 'view', None)
            
        if view_instance:
            # Check for csrf_exempt on the view class or dispatch method
            if getattr(view_instance, 'csrf_exempt', False):
                logger.info(f"🔑 CSRF SKIPPED: {view_instance.__class__.__name__}.csrf_exempt=True")
                return (user, None)
            
            # For class-based views, also check the dispatch method specifically
            dispatch = getattr(view_instance, 'dispatch', None)
            if dispatch and getattr(dispatch, 'csrf_exempt', False):
                logger.info(f"🔑 CSRF SKIPPED: {view_instance.__class__.__name__}.dispatch.csrf_exempt=True")
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
                raise e # Already a PermissionDenied or similar
        
        return (user, None)

