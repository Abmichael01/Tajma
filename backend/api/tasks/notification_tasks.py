"""Periodic notification tasks.

Currently houses the unread-message digest sweep. The policy:

- Chat messages do NOT create persistent Notification rows. They fire a
  transient WS banner + an OS push immediately (see chat_signals.py).
- If a recipient still hasn't read a message 10 minutes later, this task
  bundles every stale unread thread for that user into a single email digest
  and stamps the messages so we never email about them twice.

Run via Celery beat (see CELERY_BEAT_SCHEDULE in settings/third_party.py).
"""

from __future__ import annotations

import logging
from collections import defaultdict
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from api.models import Message
from api.utils.email import send_professional_email

logger = logging.getLogger(__name__)

# Wait this long after a message is sent before deciding the recipient missed
# it. Keeps the digest from emailing for messages the user just hadn't gotten
# to yet on an active session.
DIGEST_DELAY_MINUTES = 10

# Cap per-user list size so a runaway sender can't blow up the email body.
MAX_CHATS_PER_EMAIL = 25


@shared_task
def send_unread_message_digest() -> dict[str, int]:
    """Bundle stale unread messages into one email per recipient.

    Returns a counts summary (users_emailed, messages_stamped, skipped_no_email)
    so the Celery result/log is easy to scan.
    """
    cutoff = timezone.now() - timedelta(minutes=DIGEST_DELAY_MINUTES)

    candidates = (
        Message.objects.filter(
            is_read=False,
            digest_emailed_at__isnull=True,
            created_at__lt=cutoff,
        )
        .select_related(
            'chat',
            'chat__ad',
            'chat__participant1',
            'chat__participant2',
            'sender',
        )
        .order_by('chat_id', 'created_at')
    )

    # Group by recipient → chat. Each chat collapses into one digest row
    # (sender, ad title, last preview, unread count).
    by_recipient: dict[int, list[Message]] = defaultdict(list)
    for message in candidates:
        chat = message.chat
        if chat.participant1_id == message.sender_id:
            recipient_id = chat.participant2_id
        else:
            recipient_id = chat.participant1_id

        # Defensive — a message to oneself would have nothing to digest.
        if recipient_id == message.sender_id:
            continue

        by_recipient[recipient_id].append(message)

    users_emailed = 0
    messages_stamped = 0
    skipped_no_email = 0

    for recipient_id, messages in by_recipient.items():
        recipient = _pick_recipient(messages[0])
        if not recipient or not recipient.email:
            skipped_no_email += 1
            logger.info(
                "digest: skipping user %s (no email) — %d unread messages",
                recipient_id, len(messages),
            )
            continue

        chat_rows = _build_chat_rows(messages)
        if not chat_rows:
            continue

        # Cap to keep the email reasonable. The remaining unread messages will
        # still appear in the inbox; we just won't list them all in the email.
        truncated = len(chat_rows) > MAX_CHATS_PER_EMAIL
        if truncated:
            chat_rows = chat_rows[:MAX_CHATS_PER_EMAIL]

        total_unread = sum(row['unread_count'] for row in chat_rows)
        subject = _build_subject(total_unread, len(chat_rows))

        delivered = send_professional_email(
            subject=subject,
            template_name='emails/unread_message_digest.html',
            context={
                'recipient_name': recipient.get_full_name() or recipient.username,
                'chat_rows': chat_rows,
                'total_unread': total_unread,
                'total_chats': len(chat_rows),
                'truncated': truncated,
            },
            recipient_list=[recipient.email],
        )

        if not delivered:
            logger.warning(
                "digest: email send failed for user %s; will retry on next sweep",
                recipient_id,
            )
            continue

        stamped = _stamp_digested(messages)
        users_emailed += 1
        messages_stamped += stamped
        logger.info(
            "digest: emailed %s — %d unread across %d chats (stamped %d msgs)",
            recipient.email, total_unread, len(chat_rows), stamped,
        )

    summary = {
        'users_emailed': users_emailed,
        'messages_stamped': messages_stamped,
        'skipped_no_email': skipped_no_email,
    }
    logger.info("digest sweep complete: %s", summary)
    return summary


def _pick_recipient(message: Message):
    chat = message.chat
    if chat.participant1_id == message.sender_id:
        return chat.participant2
    return chat.participant1


def _build_chat_rows(messages: list[Message]) -> list[dict]:
    """Collapse a flat list of unread messages into one row per chat."""
    by_chat: dict = defaultdict(list)
    for message in messages:
        by_chat[message.chat_id].append(message)

    rows = []
    for chat_messages in by_chat.values():
        chat_messages.sort(key=lambda m: m.created_at)
        last = chat_messages[-1]
        sender = last.sender
        ad = last.chat.ad
        rows.append({
            'chat_id': str(last.chat_id),
            'sender_name': sender.get_full_name() or sender.username,
            'ad_title': getattr(ad, 'title', None) if ad else None,
            'preview': _preview(last),
            'unread_count': len(chat_messages),
            'last_at': last.created_at,
        })

    # Newest activity first so the most relevant chat is at the top of the email.
    rows.sort(key=lambda r: r['last_at'], reverse=True)
    return rows


def _preview(message: Message) -> str:
    """Short text snippet for the email row. Falls back to a type label for
    non-text messages so the user still sees something meaningful."""
    if message.content:
        return message.content[:120] + ('…' if len(message.content) > 120 else '')
    label_by_type = {
        'image': '📷 Photo',
        'audio': '🎙 Voice note',
        'document': '📎 Document',
    }
    return label_by_type.get(message.message_type, 'New message')


def _build_subject(total_unread: int, chat_count: int) -> str:
    if chat_count == 1:
        return f'You have {total_unread} unread message{"" if total_unread == 1 else "s"} on Tajma'
    return f'You have {total_unread} unread messages from {chat_count} chats on Tajma'


def _stamp_digested(messages: list[Message]) -> int:
    """Mark the digested messages so the next sweep skips them. Bulk update by
    id to avoid N+1 saves."""
    ids = [m.id for m in messages]
    if not ids:
        return 0
    now = timezone.now()
    return Message.objects.filter(id__in=ids).update(digest_emailed_at=now)
