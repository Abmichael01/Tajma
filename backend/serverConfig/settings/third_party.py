# Third-party apps settings
import os

ENVIRONMENT = os.getenv('ENV', 'development')

INSTALLED_APPS_THIRD_PARTY = [
    'rest_framework',
    'corsheaders',
    'django_filters',  # For advanced filtering
    'channels',  # Django Channels for WebSocket support
]

# REST Framework settings
DEFAULT_AUTHENTICATION_CLASSES = [
    'api.authentication.csrf_enforced_session.CSRFEnforcedSessionAuthentication',
]

if ENVIRONMENT != 'production':
    DEFAULT_AUTHENTICATION_CLASSES.append('rest_framework.authentication.BasicAuthentication')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': DEFAULT_AUTHENTICATION_CLASSES,
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '500/day',
        'user': '5000/day',
        'auth_attempt': '10/minute',
        'kyc_initiate': '5/day',
    }
}

# CORS settings
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True

cors_origins_str = os.getenv(
    'CORS_ALLOWED_ORIGINS',
    'http://localhost:3000,http://127.0.0.1:3000,'
    'http://localhost:3005,http://127.0.0.1:3005,'
    'http://localhost:8081,http://127.0.0.1:8081,'
    'https://tajma.net,https://www.tajma.net'
)
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_str.split(',') if origin.strip()]

# Session settings
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_SECURE = os.getenv('ENV', 'development') == 'production'
SESSION_COOKIE_AGE = 604800  # 7 days
SESSION_SAVE_EVERY_REQUEST = True
SESSION_EXPIRE_AT_BROWSER_CLOSE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = os.getenv('ENV', 'development') == 'production'
CSRF_USE_SESSIONS = False  # Keep CSRF in cookies for easier access by mobile

# Cookie Domains
SESSION_COOKIE_DOMAIN = os.getenv('SESSION_COOKIE_DOMAIN', None)
CSRF_COOKIE_DOMAIN = os.getenv('CSRF_COOKIE_DOMAIN', None)

# CSRF trusted origins
csrf_origins_str = os.getenv('CSRF_TRUSTED_ORIGINS', 
    'http://localhost:3000,http://127.0.0.1:3000,'
    'http://localhost:3005,http://127.0.0.1:3005,'
    'http://192.168.1.152:3000,http://10.74.80.221:3005,'
    'http://192.168.1.152:3005,'
    'http://localhost:8081,http://127.0.0.1:8081,'
    'http://192.168.1.152:8081,http://10.74.80.221:8081,'
    'https://interavailable-lexi-instigative.ngrok-free.dev,'
    'https://tajma.net,https://www.tajma.net')
CSRF_TRUSTED_ORIGINS = [origin.strip() for origin in csrf_origins_str.split(',') if origin.strip()]

# Frontend URL for OAuth redirects
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Site URL for absolute URL generation (webhooks, callbacks, etc.)
SITE_URL = os.getenv('SITE_URL', 'http://localhost:8000')

# Django Channels Configuration
if ENVIRONMENT == 'production':
    redis_url = os.getenv('REDIS_URL')
    if redis_url:
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {
                    "hosts": [redis_url],
                },
            },
        }
    else:
        CHANNEL_LAYERS = {
            'default': {
                'BACKEND': 'channels_redis.core.RedisChannelLayer',
                'CONFIG': {
                    "hosts": [(os.getenv('REDIS_HOST', '127.0.0.1'), int(os.getenv('REDIS_PORT', 6379)))],
                },
            },
        }
else:
    CHANNEL_LAYERS = {
        'default': {
            'BACKEND': 'channels.layers.InMemoryChannelLayer',
        },
    }

# Smile ID Configuration
SMILE_ID_PARTNER_ID = os.getenv('SMILE_ID_PARTNER_ID', '')
SMILE_ID_API_KEY = os.getenv('SMILE_ID_API_KEY', '')
SMILE_ID_SANDBOX = os.getenv('SMILE_ID_SANDBOX', 'True') == 'True'
SMILE_ID_CALLBACK_URL = f"{SITE_URL}/api/kyc/webhook/"
SMILE_ID_CONFIG_PATH = os.getenv('SMILE_ID_CONFIG_PATH', '')

# External providers
# [NEW] Paystack Configuration
PAYSTACK_SECRET_KEY = os.getenv('PAYSTACK_SECRET_KEY', '')
PAYSTACK_PUBLIC_KEY = os.getenv('PAYSTACK_PUBLIC_KEY', '')
