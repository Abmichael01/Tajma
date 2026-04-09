import os
import django
from django.conf import settings

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

from api.utils.image_url import build_full_image_url

# Test cases
test_paths = [
    'avatars/test.png',
    '/media/avatars/test.png',
    'ads/item.jpg',
]

print(f"SITE_URL: {settings.SITE_URL}")
print(f"MEDIA_URL: {settings.MEDIA_URL}")

for path in test_paths:
    url = build_full_image_url(path)
    print(f"Input: {path} -> Output: {url}")
