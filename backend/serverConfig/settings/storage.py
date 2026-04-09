# Static and Media Storage settings
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENVIRONMENT = os.getenv('ENV', 'development')

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Email Configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.getenv('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.getenv('EMAIL_USE_SSL', 'False') == 'True'
EMAIL_HOST_USER = os.getenv('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.getenv('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.getenv('DEFAULT_FROM_EMAIL', 'Tajma Marketplace <noreply@tajma.net>')

# Media storage strategy: Cloudinary for production, Local for development
if ENVIRONMENT == 'production' and os.getenv('CLOUDINARY_CLOUD_NAME'):
    CLOUDINARY_STORAGE = {
        'CLOUD_NAME': os.getenv('CLOUDINARY_CLOUD_NAME'),
        'API_KEY': os.getenv('CLOUDINARY_API_KEY'),
        'API_SECRET': os.getenv('CLOUDINARY_API_SECRET'),
    }
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
else:
    # Use local FileSystemStorage for development
    DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
    # Ensure MEDIA_URL and MEDIA_ROOT are used for local serving

# Categories JSON export path
CATEGORIES_JSON_PATH = os.getenv(
    'CATEGORIES_JSON_PATH',
    BASE_DIR.parent / 'frontend' / 'public' / 'cdn' / 'categories.json'
)
