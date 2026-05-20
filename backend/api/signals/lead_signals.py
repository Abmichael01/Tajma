from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models.lead import Lead
from api.utils.email import send_professional_email


@receiver(post_save, sender=Lead)
def notify_seller_on_new_lead(sender, instance, created, **kwargs):  # noqa: ARG001
    """Sends a 'New Lead' email to the seller when a lead is first created."""
    if not created:
        return

    seller = instance.seller
    if not getattr(seller, 'email_notifications', True):
        return

    context = {
        'user_name': seller.first_name or seller.email.split('@')[0],
        'lead_source': instance.get_first_source_display(),
        'ad_title': instance.ad.title if instance.ad else None,
        'lead_time': instance.created_at,
    }

    send_professional_email(
        subject_key='new_lead',
        template_name='emails/new_lead.html',
        context=context,
        recipient_list=[seller.email],
        language=getattr(seller, 'preferred_language', None),
    )


def notify_seller_lead_renewal(lead):
    """
    Called from the view when an existing lead is renewed after 24+ hours.
    Invoked explicitly (not via signal) so the 24h throttle can be checked first.
    """
    seller = lead.seller
    if not getattr(seller, 'email_notifications', True):
        return

    client_name = (
        f"{lead.client.first_name} {lead.client.last_name}".strip()
        or lead.client.email
    )

    context = {
        'user_name': seller.first_name or seller.email.split('@')[0],
        'client_name': client_name,
        'lead_source': lead.get_last_source_display(),
        'ad_title': lead.ad.title if lead.ad else None,
        'interaction_count': lead.interaction_count,
    }

    send_professional_email(
        subject_key='lead_renewal',
        template_name='emails/lead_renewal.html',
        context=context,
        recipient_list=[seller.email],
        language=getattr(seller, 'preferred_language', None),
    )
