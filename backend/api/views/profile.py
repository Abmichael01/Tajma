import logging
from django.contrib.auth import get_user_model
from django.db.models import Avg, Count, Q
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from api.serializers.user import UserDetailsSerializer
from api.models import Review, Notification

logger = logging.getLogger(__name__)


class UserProfileView(APIView):
    """Public endpoint to fetch user profile details by slug."""

    permission_classes = [AllowAny]

    def get(self, request, slug):
        User = get_user_model()

        try:
            user = User.objects.get(username__iexact=slug)
        except User.DoesNotExist:
            try:
                user = User.objects.get(email__iexact=slug)
            except User.DoesNotExist:
                return Response(
                    {'detail': 'User not found.'},
                    status=status.HTTP_404_NOT_FOUND
                )

        # Send notification if profile is viewed by authenticated user (not the owner)
        # Only send once per day per viewer
        if request.user.is_authenticated and request.user.id != user.id:
            if Notification.should_send_notification(
                recipient=user,
                notification_type='ad_view',
                related_user=request.user
            ):
                try:
                    viewer_name = request.user.get_full_name() or request.user.email.split('@')[0]
                    Notification.objects.create(
                        recipient=user,
                        type='ad_view',  # Using ad_view type for profile views
                        title='Profile Viewed',
                        message=f'{viewer_name} viewed your profile',
                        related_user=request.user,
                    )
                    logger.info(f"✅ Profile view notification created: {user.id} viewed by {request.user.id}")
                except Exception as e:
                    logger.error(f"❌ Failed to create profile view notification: {e}", exc_info=True)
            else:
                logger.info(f"⏭️ Skipping profile view notification: Already sent today by {request.user.id} to {user.id}")

        serializer = UserDetailsSerializer(user)
        data = serializer.data
        
        # Calculate review statistics
        review_stats = Review.objects.filter(seller=user).aggregate(
            total_reviews=Count('id'),
            average_rating=Avg('rating'),
            rating_5=Count('id', filter=Q(rating=5)),
            rating_4=Count('id', filter=Q(rating=4)),
            rating_3=Count('id', filter=Q(rating=3)),
            rating_2=Count('id', filter=Q(rating=2)),
            rating_1=Count('id', filter=Q(rating=1)),
        )
        
        # Round average rating to 1 decimal place
        if review_stats['average_rating']:
            review_stats['average_rating'] = round(float(review_stats['average_rating']), 1)
        else:
            review_stats['average_rating'] = 0.0
        
        data['review_stats'] = review_stats
        return Response(data, status=status.HTTP_200_OK)

