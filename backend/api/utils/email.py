import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

logger = logging.getLogger(__name__)

def send_professional_email(subject, template_name, context, recipient_list, from_email=None):
    """
    Sends a professional HTML email using a template.
    
    :param subject: Email subject
    :param template_name: Relative path to the template (e.g., 'emails/new_lead.html')
    :param context: Dict of variables to render in the template
    :param recipient_list: List of recipient emails
    :param from_email: Optional from_email override
    """
    if not recipient_list:
        logger.warning(f"No recipients provided for email: {subject}")
        return False

    # Add global site settings to context if not provided
    if 'site_url' not in context:
        context['site_url'] = getattr(settings, 'FRONTEND_URL', 'https://tajma.net')

    try:
        # Render HTML version
        html_content = render_to_string(template_name, context)
        # Create plain-text fallback
        text_content = strip_tags(html_content)

        if not from_email:
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@tajma.net')

        # Create the email
        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        
        # Send
        result = msg.send()
        
        logger.info(f"Successfully sent professional email '{subject}' to {recipient_list}")
        return result > 0
        
    except Exception as e:
        logger.error(f"Failed to send professional email '{subject}' to {recipient_list}: {str(e)}")
        return False
