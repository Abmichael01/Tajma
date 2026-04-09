from django.core.files.storage import default_storage

def build_full_image_url(image_path, request=None):
    """
    Build a full URL for an image path.
    Supports local storage and Cloudinary.
    
    Args:
        image_path: Relative image path (e.g., 'ads/uuid.jpg')
    
    Returns:
        Full URL or relative path string.
    """
    if not image_path:
        return None
    
    # If it's already a full URL (external), return as is
    if image_path.startswith('http://') or image_path.startswith('https://'):
        return image_path
    
    # If using Cloudinary, default_storage.url() returns a full URL
    try:
        url = default_storage.url(image_path)
        if url.startswith('http'):
            return url
    except Exception:
        pass

    # Fallback/Local dev logic
    # Strip any existing prefixes to avoid double prefixing
    clean_path = image_path.replace('/api/media/', '', 1).replace('/media/', '', 1).lstrip('/')
    
    # Always return a relative path starting with /api/media/
    return f'/api/media/{clean_path}'




