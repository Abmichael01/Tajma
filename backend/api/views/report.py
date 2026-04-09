from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from api.models.report import Report, SupportMessage
from api.serializers.report import ReportSerializer, SupportMessageSerializer

class ReportViewSet(viewsets.ModelViewSet):
    """
    Public ViewSet for users to create reports/support requests 
     and view their own report history.
    """
    serializer_class = ReportSerializer
    permission_classes = [permissions.AllowAny] # Allow guest reports via email

    def get_queryset(self):
        # Users can only see reports they filed
        if self.request.user.is_authenticated:
            return Report.objects.filter(reporter=self.request.user).order_by('-created_at')
        # Guests can't list reports
        return Report.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reply(self, request, pk=None):
        """Allow user to reply to their own support ticket"""
        report = self.get_object()
        serializer = SupportMessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(report=report, sender=request.user, is_admin_reply=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SupportMessageViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing support thread messages.
    """
    serializer_class = SupportMessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Users can see messages matching their reports
        return SupportMessage.objects.filter(
            report__reporter=self.request.user
        ).order_by('created_at')

    def perform_create(self, serializer):
        # When user creates a message, check they own the report
        report = serializer.validated_data.get('report')
        if report.reporter != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to message this report.")
        serializer.save(sender=self.request.user, is_admin_reply=False)
