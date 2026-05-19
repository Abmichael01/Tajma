"""Copy legacy Chat.is_muted into the per-user muted_by M2M.

The mute model is changing from a single bool on the chat row (global mute —
muting affects both participants, which is wrong) to a per-user M2M (each user
mutes independently — matches WhatsApp/Telegram).

For existing rows where is_muted=True, we don't know WHICH participant muted,
so the safe move is to add BOTH participants to muted_by. Worst case the
non-muting party loses pushes they wanted; they can unmute from the UI.

Forward only — is_muted is dropped in the next migration. Reverse is a noop.
"""

from django.db import migrations


def copy_is_muted_to_muted_by(apps, schema_editor):
    Chat = apps.get_model('api', 'Chat')
    migrated = 0
    for chat in Chat.objects.filter(is_muted=True).iterator():
        chat.muted_by.add(chat.participant1_id, chat.participant2_id)
        migrated += 1
    if migrated:
        print(f"  migrated {migrated} muted chat(s) to per-user muted_by")


def noop_reverse(apps, schema_editor):
    # is_muted is removed in 0044; there's nothing to restore to.
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0042_alter_chat_options_chat_hidden_for_users_and_more'),
    ]

    operations = [
        migrations.RunPython(copy_is_muted_to_muted_by, reverse_code=noop_reverse),
    ]
