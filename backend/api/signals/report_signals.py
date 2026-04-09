from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models.report import Report, SupportMessage
from api.models.notification import Notification

@receiver(post_save, sender=SupportMessage)
def notify_on_support_reply(sender, instance, created, **kwargs):
    """
    Send a notification to the user when an admin replies to their report/support ticket.
    """
    if not created or not instance.is_admin_reply:
        return
        
    report = instance.report
    
    # If admin replies, notify the reporter
    if report.reporter:
        Notification.objects.create(
            recipient=report.reporter,
            type='report',
            title='New Support Reply',
            message=f'Support has replied to your ticket: "{instance.message[:40]}..."',
            related_user=instance.sender
        )

@receiver(post_save, sender=Report)
def notify_on_report_resolved(sender, instance, created, **kwargs):
    """
    Send a notification to the user when their report/ticket is resolved.
    """
    if created or instance.status != 'resolved':
        return
    
    # If it was just resolved, notify the reporter
    if instance.reporter and hasattr(instance, '_status_changed') and instance._status_changed:
        Notification.objects.create(
            recipient=instance.reporter,
            type='report',
            title='Ticket Resolved',
            message=f'Your support ticket has been marked as resolved.',
            related_user=instance.resolved_by
        )
