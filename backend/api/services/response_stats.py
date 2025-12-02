from __future__ import annotations

from dataclasses import dataclass
from statistics import median
from typing import Dict, List, Optional

from django.contrib.auth import get_user_model
from django.db.models import Prefetch, Q

from api.models import Chat, Message


@dataclass
class ResponseStats:
    total_chats_with_inquiry: int = 0
    answered_chats: int = 0
    chats_within_1h: int = 0
    chats_within_2h: int = 0
    response_times_minutes: List[float] = None

    def to_dict(self) -> Dict[str, Optional[float]]:
        total = self.total_chats_with_inquiry or 0
        answered = self.answered_chats or 0

        # Avoid division by zero
        if total > 0:
            rate_1h = round(100 * (self.chats_within_1h / total))
            rate_2h = round(100 * (self.chats_within_2h / total))
        else:
            rate_1h = 0
            rate_2h = 0

        times = self.response_times_minutes or []
        if times:
            avg_minutes = sum(times) / len(times)
            median_minutes = median(times)
        else:
            avg_minutes = None
            median_minutes = None

        return {
            "total_chats_with_inquiry": total,
            "answered_chats": answered,
            "response_rate_1h": rate_1h,
            "response_rate_2h": rate_2h,
            "avg_response_minutes": round(avg_minutes, 1) if avg_minutes is not None else None,
            "median_response_minutes": round(median_minutes, 1) if median_minutes is not None else None,
        }


def calculate_response_stats_for_seller(user) -> Dict[str, Optional[float]]:
    """
    Calculate response statistics for a given seller based on chat messages.

    For each chat where the seller participates:
      - Find the first message from the other participant (buyer).
      - Find the first reply from the seller after that message.
      - Compute the time delta between the two.

    Buckets:
      - <= 60 minutes  -> within 1 hour
      - <= 120 minutes -> within 2 hours
      - no reply       -> missed
    """

    User = get_user_model()
    if not isinstance(user, User):
        return ResponseStats().to_dict()

    stats = ResponseStats(response_times_minutes=[])

    # Fetch chats where this user is a participant, with messages prefetched
    chats = (
        Chat.objects.filter(Q(participant1=user) | Q(participant2=user))
        .prefetch_related(
            Prefetch(
                "messages",
                queryset=Message.objects.all().order_by("created_at"),
            )
        )
        .only("id", "participant1_id", "participant2_id")
    )

    for chat in chats:
        messages = list(chat.messages.all())
        if not messages:
            continue

        # Determine the other participant (buyer) in this chat
        buyer_id = chat.participant1_id if chat.participant1_id != user.id else chat.participant2_id

        first_buyer_message = None
        first_seller_reply = None

        # Find first buyer message and the first seller reply after it
        for msg in messages:
            if msg.sender_id == buyer_id:
                first_buyer_message = msg
                break

        if not first_buyer_message:
            # No buyer inquiry in this chat
            continue

        # We have an inquiry chat
        stats.total_chats_with_inquiry += 1

        for msg in messages:
            if msg.sender_id == user.id and msg.created_at > first_buyer_message.created_at:
                first_seller_reply = msg
                break

        if not first_seller_reply:
            # Seller never replied
            continue

        stats.answered_chats += 1

        delta = first_seller_reply.created_at - first_buyer_message.created_at
        minutes = delta.total_seconds() / 60.0
        stats.response_times_minutes.append(minutes)

        if minutes <= 60:
            stats.chats_within_1h += 1
            stats.chats_within_2h += 1
        elif minutes <= 120:
            stats.chats_within_2h += 1

    return stats.to_dict()


