from django.contrib.auth.signals import user_logged_in
from django.dispatch import receiver
from api.utils.email import send_professional_email
from django.utils import timezone

@receiver(user_logged_in)
def notify_user_on_signin(sender, request, user, **kwargs):
    """
    Triggers a security email notification when a user logs in.
    """
    # Respect user notification preferences
    if not getattr(user, 'email_notifications', True):
        return

    # Get client IP if possible
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')

    subject = "New Sign-in Detected on Tajma"
    context = {
        'user_name': user.first_name or user.email.split('@')[0],
        'user_email': user.email,
        'login_time': timezone.now(),
        'ip_address': ip,
    }
    
    send_professional_email(
        subject=subject,
        template_name='emails/new_signin.html',
        context=context,
        recipient_list=[user.email]
    )
