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
        
        # Skip CSRF check for API endpoints if they are marked as csrf_exempt
        # or if they are coming from a mobile/non-browser client (no referer)
        if request.path.startswith('/api/'):
            # If the view is explicitly exempt, it will be handled by the parent
            if getattr(callback, 'csrf_exempt', False):
                logger.info(f"🛡️ CSRF MIDDLEWARE: path={request.path} - View is exempt")
                return None
                
            # React Native apps don't typically have Referer headers.
            if not request.META.get('HTTP_REFERER'):
                logger.info(f"🛡️ CSRF MIDDLEWARE: path={request.path} - No referer, skipping check")
                return None

        # Log details for web browsers
        logger.info(f"🛡️ CSRF MIDDLEWARE: path={request.path} method={request.method}")
        logger.info(f"🛡️ CSRF COOKIES: {list(request.COOKIES.keys())}")
        logger.info(f"🛡️ CSRF REFERER: {request.META.get('HTTP_REFERER')}")
        
        return super().process_view(request, callback, callback_args, callback_kwargs)
    
    def _check_referer(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        # Skip referer check for API endpoints (React Native doesn't send Referer by default)
        if request.path.startswith('/api/'):
            if not request.META.get('HTTP_REFERER'):
                logger.info(f"🛡️ CSRF MIDDLEWARE: path={request.path} - Allowing referer-less request")
                return True
            logger.info(f"🛡️ CSRF MIDDLEWARE: path={request.path} - Validating referer: {request.META.get('HTTP_REFERER')}")
            return super()._check_referer(request)
        
        return super()._check_referer(request)

