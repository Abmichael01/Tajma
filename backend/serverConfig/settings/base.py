from pathlib import Path
import os
from dotenv import load_dotenv
from django.core.exceptions import ImproperlyConfigured

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

ENVIRONMENT = os.getenv('ENV', 'development')

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    if ENVIRONMENT == 'production':
        raise ImproperlyConfigured('SECRET_KEY must be set in production.')
    SECRET_KEY = 'django-insecure-dev-only-change-me'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'False' if ENVIRONMENT == 'production' else 'True') == 'True'

# Get allowed hosts from environment or use defaults
allowed_hosts_str = os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,0.0.0.0,192.168.1.152,10.208.33.221')
ALLOWED_HOSTS = [host.strip() for host in allowed_hosts_str.split(',') if host.strip()]

# Force HTTPS in production
if ENVIRONMENT == 'production':
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    SECURE_SSL_REDIRECT = os.getenv('SECURE_SSL_REDIRECT', 'True') == 'True'
    SECURE_HSTS_SECONDS = int(os.getenv('SECURE_HSTS_SECONDS', '31536000'))
    SECURE_HSTS_INCLUDE_SUBDOMAINS = os.getenv('SECURE_HSTS_INCLUDE_SUBDOMAINS', 'True') == 'True'
    SECURE_HSTS_PRELOAD = os.getenv('SECURE_HSTS_PRELOAD', 'True') == 'True'

ROOT_URLCONF = 'serverConfig.urls'
WSGI_APPLICATION = 'serverConfig.wsgi.application'
ASGI_APPLICATION = 'serverConfig.asgi.application'

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'api.User'

# Sentry Configuration
import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

SENTRY_DSN = os.getenv('SENTRY_DSN')
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=float(os.getenv('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
        send_default_pii=os.getenv('SENTRY_SEND_DEFAULT_PII', 'False') == 'True',
        environment=ENVIRONMENT,
    )
