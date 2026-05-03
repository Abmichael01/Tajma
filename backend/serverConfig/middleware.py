"""
Custom middleware for handling CSRF protection with React Native apps.
"""
from django.middleware.csrf import CsrfViewMiddleware
from django.utils.deprecation import MiddlewareMixin


class CustomCsrfMiddleware(CsrfViewMiddleware, MiddlewareMixin):
    """
    Custom CSRF middleware that handles React Native and mobile app requests.
    """
    
    def process_view(self, request, callback, callback_args, callback_kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        # Only respect explicit csrf_exempt markers. Mobile clients must still
        # provide X-CSRFToken for unsafe authenticated API requests.
        if request.path.startswith('/api/'):
            if getattr(callback, 'csrf_exempt', False):
                logger.debug("CSRF middleware: exempt view for %s", request.path)
                return None

        logger.debug("CSRF middleware: path=%s method=%s", request.path, request.method)
        
        return super().process_view(request, callback, callback_args, callback_kwargs)
    
    def _check_referer(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        # React Native does not send Referer. For API clients, allow a missing
        # Referer only when a CSRF header is present; token validation still runs.
        if request.path.startswith('/api/'):
            if not request.META.get('HTTP_REFERER'):
                if request.META.get('HTTP_X_CSRFTOKEN'):
                    logger.debug("CSRF middleware: allowing header-token API request without referer")
                    return
                return super()._check_referer(request)
            logger.debug("CSRF middleware: validating referer for %s", request.path)
            return super()._check_referer(request)
        
        return super()._check_referer(request)
