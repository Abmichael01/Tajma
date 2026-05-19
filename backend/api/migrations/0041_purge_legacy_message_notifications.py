"""One-time cleanup of legacy chat-message Notification rows.

The notification policy now treats chat messages as transient (banner + push
only) — they are not persisted to the Notification feed. Before this change,
every chat message created a Notification row, so the bell feed is full of
historical message entries that no longer fit the policy.

Delete them so the feed only contains "real" notifications (offers, follows,
ad views, system events) from here on.

Safe to re-run by design: forward operation is an idempotent DELETE; reverse
is a no-op (we never re-create message notification rows).
"""

from django.db import migrations


def purge_message_notifications(apps, schema_editor):
    Notification = apps.get_model('api', 'Notification')
    deleted, _ = Notification.objects.filter(type='message').delete()
    if deleted:
        print(f"  purged {deleted} legacy message notification row(s)")


def noop_reverse(apps, schema_editor):
    # No reverse — the new policy never produces these rows, so there's nothing
    # to restore. Reversing would have no effect either way.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_message_digest_emailed_at'),
    ]

    operations = [
        migrations.RunPython(purge_message_notifications, reverse_code=noop_reverse),
    ]
