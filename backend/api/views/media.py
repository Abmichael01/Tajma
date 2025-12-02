"""
Media file serving view with CORS headers to bypass browser extension blocking
"""
from django.http import FileResponse, Http404
from django.conf import settings
from django.views.decorators.cache import cache_control
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
import os


@api_view(['GET'])
@permission_classes([AllowAny])
@cache_control(max_age=3600, public=True)
def serve_media(request, path):
    """
    Serve media files with proper CORS headers to bypass browser extension blocking.
    
    Usage: /api/media/ads/filename.jpg
    """
    # Construct full file path
    file_path = os.path.join(settings.MEDIA_ROOT, path)
    
    # Security: Ensure the file is within MEDIA_ROOT
    file_path = os.path.normpath(file_path)
    media_root = os.path.normpath(settings.MEDIA_ROOT)
    
    if not file_path.startswith(media_root):
        raise Http404("File not found")
    
    # Check if file exists
    if not os.path.exists(file_path) or not os.path.isfile(file_path):
        raise Http404("File not found")
    
    # Determine content type
    content_type = 'application/octet-stream'
    if path.lower().endswith('.jpg') or path.lower().endswith('.jpeg'):
        content_type = 'image/jpeg'
    elif path.lower().endswith('.png'):
        content_type = 'image/png'
    elif path.lower().endswith('.gif'):
        content_type = 'image/gif'
    elif path.lower().endswith('.webp'):
        content_type = 'image/webp'
    
    # Serve file with CORS headers
    response = FileResponse(
        open(file_path, 'rb'),
        content_type=content_type
    )
    
    # Add CORS headers
    response['Access-Control-Allow-Origin'] = '*'
    response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    response['Access-Control-Allow-Headers'] = 'Content-Type'
    response['Cache-Control'] = 'public, max-age=3600'
    
    return response


