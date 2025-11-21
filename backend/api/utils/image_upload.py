import base64
import uuid
import os
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings

try:
    from PIL import Image
    import io
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    import io


def save_base64_image(base64_string: str, folder: str = 'ads') -> str:
    """
    Save a base64 encoded image to the media storage and return the URL.
    
    Args:
        base64_string: Base64 encoded image string (data:image/...;base64,...)
        folder: Folder name in media root to save the image
        
    Returns:
        URL path to the saved image (relative to MEDIA_URL)
    """
    try:
        # Parse base64 string
        if ',' in base64_string:
            header, data = base64_string.split(',', 1)
        else:
            data = base64_string
        
        # Decode base64 data
        image_data = base64.b64decode(data)
        
        # Determine file extension from header or default to jpg
        if 'data:image/' in base64_string:
            header_part = base64_string.split(',')[0]
            if 'png' in header_part:
                ext = 'png'
            elif 'jpeg' in header_part or 'jpg' in header_part:
                ext = 'jpg'
            elif 'webp' in header_part:
                ext = 'webp'
            elif 'gif' in header_part:
                ext = 'gif'
            else:
                ext = 'jpg'
        else:
            ext = 'jpg'
        
        # Validate and process image if Pillow is available
        if PIL_AVAILABLE:
            try:
                img = Image.open(io.BytesIO(image_data))
                # Convert RGBA to RGB if necessary
                if img.mode == 'RGBA':
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    rgb_img.paste(img, mask=img.split()[3])
                    img = rgb_img
                
                # Resize if too large (max 2000px on longest side)
                max_size = 2000
                if max(img.size) > max_size:
                    img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
                
                # Save to buffer
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=85, optimize=True)
                output.seek(0)
                image_data = output.read()
                ext = 'jpg'  # Always save as JPEG after processing
            except Exception as e:
                # If image processing fails, use original data
                print(f"Image processing warning: {e}")
        
        # Generate unique filename
        filename = f"{uuid.uuid4()}.{ext}"
        file_path = os.path.join(folder, filename)
        
        # Save file using default storage
        saved_path = default_storage.save(file_path, ContentFile(image_data))
        
        # Return URL relative to MEDIA_URL
        return saved_path
        
    except Exception as e:
        print(f"Error saving base64 image: {e}")
        raise ValueError(f"Invalid image data: {str(e)}")


def process_images_list(images: list) -> list:
    """
    Process a list of images (base64 strings or URLs) and return URLs.
    
    Args:
        images: List of base64 strings or existing URLs
        
    Returns:
        List of image URLs (relative to MEDIA_URL or full URLs)
    """
    processed_images = []
    
    for image in images:
        if not image or not isinstance(image, str):
            continue
        
        # Check if it's already a URL (full URL or absolute path)
        if image.startswith('http://') or image.startswith('https://') or image.startswith('/media/'):
            # It's already a URL, keep it as is
            processed_images.append(image)
        # Check if it's a relative path (already saved, like 'ads/uuid.jpg')
        elif '/' in image and not image.startswith('data:'):
            # It's a relative path, keep it (will be converted to full URL in serializer)
            processed_images.append(image)
        # Check if it's a base64 string
        elif 'data:image' in image or 'base64' in image or len(image) > 500:
            # It's a base64 string, save it
            try:
                saved_path = save_base64_image(image)
                processed_images.append(saved_path)
            except Exception as e:
                print(f"Failed to process image: {e}")
                continue
        else:
            # Skip invalid entries
            continue
    
    return processed_images

