from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from api.models.lead import Lead
from api.serializers.lead import LeadSerializer, LeadUpdateSerializer

class LeadViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows leads to be viewed or edited.
    Sellers can view their leads.
    Users can create leads (triggered by actions).
    """
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # A seller should only see leads for them
        # A user should only see leads they created? 
        # Actually, mostly sellers care about this.
        user = self.request.user
        return Lead.objects.filter(seller=user)

    def perform_create(self, serializer):
        # When creating, the current user is probably the client
        # BUT the logic to create might come from the frontend sending seller_id
        # We should ensure client is the current user if not provided
        if 'client' not in self.request.data:
            serializer.save(client=self.request.user)
        else:
            serializer.save()

    @action(detail=True, methods=['patch'])
    def mark_messaged(self, request, pk=None):
        lead = self.get_object()
        lead.messaged = True
        lead.save()
        return Response({'status': 'lead marked as messaged'})

    @action(detail=False, methods=['post'], url_path='record-interaction')
    def record_interaction(self, request):
        """
        Custom endpoint to record interaction smoothly.
        Expects: seller_id, source, ad_id (optional)
        """
        seller_id = request.data.get('seller_id')
        source = request.data.get('source')
        ad_id = request.data.get('ad_id')
        
        if not seller_id or not source:
            return Response({'error': 'seller_id and source are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Update or create lead
        lead, created = Lead.objects.update_or_create(
            seller_id=seller_id,
            client=request.user,
            source=source,
            ad_id=ad_id,
            defaults={'messaged': False} # Reset or keep? User said "help them keep track"
        )
        
        serializer = self.get_serializer(lead)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
