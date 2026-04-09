import os
import sys
import django
from django.conf import settings

# Setup Django Environment
sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

def verify_launch_readiness():
    print("🚀 Verifying Tajma Launch Readiness Settings...")
    
    errors = 0
    
    # 1. Throttling
    throttle_rates = settings.REST_FRAMEWORK.get('DEFAULT_THROTTLE_RATES', {})
    if throttle_rates.get('anon') == '500/day' and throttle_rates.get('user') == '5000/day':
        print("✅ Throttling: CORRECT (Anon: 500/day, User: 5000/day)")
    else:
        print(f"❌ Throttling: INCORRECT (Got: {throttle_rates})")
        errors += 1
        
    # 2. Trusted Origins
    if 'https://tajma.net' in settings.CSRF_TRUSTED_ORIGINS:
        print("✅ Trusted Origins: CORRECT (tajma.net included)")
    else:
        print("❌ Trusted Origins: INCORRECT (tajma.net missing)")
        errors += 1
        
    # 3. Security Cookies (Environment Dependent)
    env = os.getenv('ENV', 'development')
    print(f"📍 Current Environment: {env}")
    
    if env == 'development':
        if not settings.SESSION_COOKIE_SECURE and not settings.CSRF_COOKIE_SECURE:
            print("✅ Security Cookies: CORRECT for development (Secure=False)")
        else:
            print("❌ Security Cookies: INCORRECT for development")
            errors += 1
    elif env == 'production':
        if settings.SESSION_COOKIE_SECURE and settings.CSRF_COOKIE_SECURE:
            print("✅ Security Cookies: CORRECT for production (Secure=True)")
        else:
            print("❌ Security Cookies: INCORRECT for production")
            errors += 1
            
    # 4. Storage Strategy
    from django.core.files.storage import FileSystemStorage, storages
    
    # In newer Django, we check settings.STORAGES or the default storage instance
    default_storage_class = settings.DEFAULT_FILE_STORAGE
    if env == 'development':
        if 'FileSystemStorage' in default_storage_class:
            print("✅ Storage Strategy: CORRECT for development (Local FileSystem)")
        else:
            print(f"❌ Storage Strategy: INCORRECT for development (Got: {default_storage_class})")
            errors += 1
    
    # 5. Deep Linking Assets
    frontend_public = os.path.join(settings.BASE_DIR.parent, 'frontend', 'public')
    apple_path = os.path.join(frontend_public, '.well-known', 'apple-app-site-association')
    assetlinks_path = os.path.join(frontend_public, '.well-known', 'assetlinks.json')
    
    if os.path.exists(apple_path) and os.path.exists(assetlinks_path):
        print("✅ Deep Linking Assets: CORRECT (Both .well-known files exist)")
    else:
        print("❌ Deep Linking Assets: INCORRECT (Files missing in frontend/public)")
        errors += 1
        
    print("-" * 40)
    if errors == 0:
        print("🎉 ALL LAUNCH READINESS CHECKS PASSED!")
    else:
        print(f"⚠️ FAILED {errors} CHECKS. Please review settings.")

if __name__ == "__main__":
    verify_launch_readiness()
