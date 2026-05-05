# Auth and Allauth settings

INSTALLED_APPS_AUTH = [
    'django.contrib.auth',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.sites',  # Required for allauth
    
    # Third party apps
    'django.contrib.admin',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'rest_framework_simplejwt.token_blacklist',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',  # Google provider
]

# Django allauth settings
SITE_ID = 1

# Allauth settings
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'none'  # Set to 'mandatory' if you want email verification
ACCOUNT_UNIQUE_EMAIL = True

# Social account settings
SOCIALACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_QUERY_EMAIL = True

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# dj-rest-auth settings
REST_AUTH = {
    'USE_JWT': True,
    'SESSION_LOGIN': False,
    'USE_SESSION_AUTH': False,
    'TOKEN_MODEL': None,
    'USER_DETAILS_SERIALIZER': 'api.serializers.user.UserDetailsSerializer',
    'LOGIN_SERIALIZER': 'api.serializers.user.UserLoginSerializer',
    'PASSWORD_CHANGE_SERIALIZER': 'api.serializers.user.PasswordChangeSerializer',
    'PASSWORD_RESET_SERIALIZER': 'api.serializers.user.PasswordResetSerializer',
    'JWT_AUTH_HTTPONLY': False,
}

from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

import os
# Google OAuth settings
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'APP': {
            'client_id': os.getenv('GOOGLE_OAUTH_CLIENT_ID', ''),
            'secret': os.getenv('GOOGLE_OAUTH_CLIENT_SECRET', ''),
            'key': ''
        },
        'OAUTH_PKCE_ENABLED': True,
    }
}
