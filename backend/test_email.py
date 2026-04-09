import os
import django
import sys
from django.core.mail import send_mail
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'serverConfig.settings')
django.setup()

def test_email(use_console=False):
    if use_console:
        # Override backend to console for local testing
        settings.EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
        print("Using CONSOLE backend (emails will print here, no SMTP needed)")
    else:
        print(f"Using SMTP backend with host: {settings.EMAIL_HOST}")
    
    print(f"Sending from: {settings.DEFAULT_FROM_EMAIL}")
    print(f"To: {settings.EMAIL_HOST_USER}")
    
    try:
        subject = 'Tajma Email Test'
        message = 'This is a test email from the Tajma system to verify email logic.'
        recipient_list = [settings.EMAIL_HOST_USER or 'test@example.com']
        
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            recipient_list,
            fail_silently=False,
        )
        print("\n✅ Success! The email logic executed correctly.")
        if use_console:
            print("Look above for the email content printed in the console.")
        else:
            print("The email was sent via SMTP. Check your inbox.")
            
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        if not use_console:
            print("\nSMTP Error detected. Try running with '--console' to test logic instead of connection:")
            print("poetry run python test_email.py --console")

if __name__ == "__main__":
    use_console = '--console' in sys.argv
    test_email(use_console=use_console)
