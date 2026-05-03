from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import F, Count, Sum
from django.db.models.functions import TruncMonth
from django.utils.timezone import now
from api.models import Ad
from api.models.lead import Lead
from api.serializers.lead import LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):
    """
    API endpoint for leads.
    Sellers see their leads. Buyers trigger leads via record-interaction.
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]
    csrf_exempt = True

    def get_queryset(self):
        qs = Lead.objects.filter(seller=self.request.user).select_related(
            'client', 'ad'
        )
        # Exclude ignored leads unless explicitly requested
        if self.request.query_params.get('include_ignored') != 'true':
            qs = qs.exclude(ignored=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=True, methods=['patch'])
    def mark_messaged(self, _request, pk=None):  # pk required by DRF URL dispatch
        lead = self.get_object()
        lead.messaged = True
        lead.save()
        return Response({'status': 'lead marked as messaged'})

    @action(detail=True, methods=['patch'])
    def mark_ignored(self, _request, pk=None):  # pk required by DRF URL dispatch
        lead = self.get_object()
        lead.ignored = True
        lead.save()
        return Response({'status': 'lead ignored'})

    @action(detail=False, methods=['post'], url_path='record-interaction')
    def record_interaction(self, request):
        """
        Record a buyer action. Creates one lead per (seller, client, ad) pair.
        Repeated actions renew the lead instead of creating duplicates.
        sources_used accumulates every unique action type the buyer has taken.
        """
        seller_id = request.data.get('seller_id')
        source = request.data.get('source')
        ad_id = request.data.get('ad_id') or None
        allowed_sources = {'phone_view', 'profile_view', 'save_ad'}

        if not seller_id or not source:
            return Response(
                {'error': 'seller_id and source are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if source not in allowed_sources:
            return Response(
                {'error': 'Invalid lead source'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if str(request.user.id) == str(seller_id):
            return Response(
                {'error': 'Cannot create a lead for yourself'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if ad_id:
            ad = Ad.objects.filter(id=ad_id).only('seller_id').first()
            if not ad:
                return Response(
                    {'error': 'Ad not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            if str(ad.seller_id) != str(seller_id):
                return Response(
                    {'error': 'seller_id must match the ad seller'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        lead, created = Lead.objects.get_or_create(
            seller_id=seller_id,
            client=request.user,
            ad_id=ad_id,
            defaults={
                'first_source': source,
                'last_source': source,
                'sources_used': [source],
                'interaction_count': 1,
            }
        )

        if not created:
            sources = list(set((lead.sources_used or []) + [source]))
            hours_since = (now() - lead.last_interacted_at).total_seconds() / 3600
            should_notify = hours_since >= 24

            Lead.objects.filter(pk=lead.pk).update(
                interaction_count=F('interaction_count') + 1,
                last_source=source,
                sources_used=sources,
                last_interacted_at=now(),
                ignored=False,  # Un-ignore if buyer comes back
            )

            if should_notify:
                lead.refresh_from_db()
                from api.signals.lead_signals import notify_seller_lead_renewal
                notify_seller_lead_renewal(lead)

        lead.refresh_from_db()
        serializer = self.get_serializer(lead)
        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
        )

    @action(detail=False, methods=['get'], url_path='monthly-stats')
    def monthly_stats(self, request):
        """Monthly breakdown of leads for the authenticated seller."""
        stats = (
            Lead.objects.filter(seller=request.user)
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(
                new_leads=Count('id'),
                total_interactions=Sum('interaction_count'),
            )
            .order_by('-month')
        )

        return Response([
            {
                'month': entry['month'].strftime('%Y-%m'),
                'new_leads': entry['new_leads'],
                'total_interactions': entry['total_interactions'] or 0,
            }
            for entry in stats
        ])
