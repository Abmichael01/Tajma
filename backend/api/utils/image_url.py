"""
Utility functions for building full image URLs from request context
"""
from django.conf import settings


def build_full_image_url(image_path, request=None):
    """
    Build a full URL for an image path using the request's host.
    This automatically works for both website and mobile app.
    
    Args:
        image_path: Relative image path (e.g., 'avatars/uuid.jpg' or '/media/avatars/uuid.jpg')
        request: Django request object (optional, but recommended)
    
    Returns:
        Full URL string (e.g., 'https://example.com/api/media/avatars/uuid.jpg')
    """
    if not image_path:
        return None
    
    # If it's already a full URL, return as is
    if image_path.startswith('http://') or image_path.startswith('https://'):
        return image_path
    
    # Use request to build absolute URI (automatically gets host from request)
    if request:
        # Remove leading slash if present
        clean_path = image_path.lstrip('/')
        # Build full URL using request's host
        return request.build_absolute_uri(f'/api/media/{clean_path}')
    
    # Fallback: use settings if no request (should rarely happen)
    site_url = getattr(settings, 'SITE_URL', 'http://localhost:8000').rstrip('/')
    clean_path = image_path.lstrip('/')
    return f"{site_url}/api/media/{clean_path}"

