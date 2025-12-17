"""
Custom middleware for handling CSRF protection with React Native apps.
"""
from django.middleware.csrf import CsrfViewMiddleware
from django.utils.deprecation import MiddlewareMixin


class CustomCsrfMiddleware(CsrfViewMiddleware, MiddlewareMixin):
    """
    Custom CSRF middleware that skips referer checking for API endpoints.
    React Native apps don't send Referer headers by default, so we allow requests
    without referer for API paths if they have a valid CSRF token.
    """
    
    def _check_referer(self, request):
        # Skip referer check for API endpoints (React Native doesn't send Referer by default)
        # If Referer header is present, validate it; otherwise allow if it's an API endpoint
        if request.path.startswith('/api/'):
            # If no referer header, allow it for API endpoints
            if not request.META.get('HTTP_REFERER'):
                return True
            # If referer is present, validate it normally
            return super()._check_referer(request)
        
        return super()._check_referer(request)

