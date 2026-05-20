import logging
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

from api.utils.email_strings import (
    build_strings,
    get_subject,
    SUPPORTED as SUPPORTED_EMAIL_LANGUAGES,
    DEFAULT as DEFAULT_EMAIL_LANGUAGE,
)

logger = logging.getLogger(__name__)


def _normalize_language(lang):
    """Coerce a user-provided language string to a supported code, else default."""
    if not lang:
        return DEFAULT_EMAIL_LANGUAGE
    code = str(lang).lower().split("-")[0].split("_")[0]
    return code if code in SUPPORTED_EMAIL_LANGUAGES else DEFAULT_EMAIL_LANGUAGE


def send_professional_email(
    subject=None,
    template_name=None,
    context=None,
    recipient_list=None,
    from_email=None,
    *,
    subject_key=None,
    language=None,
):
    """Send an HTML email, optionally localized by recipient language.

    Localization model: one HTML template per email type, with translatable
    text injected via `{{ s.foo }}` placeholders. The `s` dict is built from
    api.utils.email_strings.build_strings(subject_key, language).

    Backwards-compatible: calls that pass `subject` + `template_name` still
    work and render in English (no `s` available unless subject_key passed too).

    New (preferred) usage:
        send_professional_email(
            subject_key='new_lead',
            template_name='emails/new_lead.html',
            context={...},
            recipient_list=[user.email],
            language=user.preferred_language,
        )
    """
    context = context or {}
    if not recipient_list:
        logger.warning("send_professional_email called with no recipients (subject=%s)", subject or subject_key)
        return False

    lang = _normalize_language(language)

    # Inject translatable strings into context when we know the template key.
    if subject_key:
        context.setdefault("s", build_strings(subject_key, lang))
        if subject is None:
            subject = get_subject(subject_key, lang)

    if not subject:
        logger.error("send_professional_email needs subject or subject_key")
        return False

    context.setdefault("site_url", getattr(settings, "FRONTEND_URL", "https://tajma.net"))
    context.setdefault("language", lang)
    context.setdefault("subject", subject)

    try:
        html_content = render_to_string(template_name, context)
        text_content = strip_tags(html_content)
        from_email = from_email or getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@tajma.net")

        msg = EmailMultiAlternatives(subject, text_content, from_email, recipient_list)
        msg.attach_alternative(html_content, "text/html")
        sent = msg.send()

        logger.info("Sent email '%s' [lang=%s, key=%s] to %s", subject, lang, subject_key, recipient_list)
        return sent > 0
    except Exception as e:
        logger.error("Failed to send email '%s' to %s: %s", subject, recipient_list, e)
        return False
