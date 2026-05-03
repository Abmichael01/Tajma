from rest_framework import serializers
from api.models.report import Report, SupportMessage
from api.serializers.user import UserMinimalSerializer
from api.serializers.ad import AdMinimalSerializer

class SupportMessageSerializer(serializers.ModelSerializer):
    sender_details = UserMinimalSerializer(source='sender', read_only=True)

    class Meta:
        model = SupportMessage
        fields = ['id', 'report', 'sender', 'sender_details', 'message', 'is_admin_reply', 'created_at']
        read_only_fields = ['id', 'created_at', 'is_admin_reply']


class ReportSerializer(serializers.ModelSerializer):
    """Serializer for user-facing report creation and history"""
    messages = SupportMessageSerializer(many=True, read_only=True)
    reporter_details = UserMinimalSerializer(source='reporter', read_only=True)
    reported_user_details = UserMinimalSerializer(source='reported_user', read_only=True)
    related_ad_details = AdMinimalSerializer(source='related_ad', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_details', 'report_type', 
            'related_ad', 'related_ad_details', 
            'reported_user', 'reported_user_details', 'reason', 
            'description', 'contact_email', 'status', 'messages',
            'created_at', 'updated_at', 'resolved_at'
        ]
        read_only_fields = ['id', 'reporter', 'status', 'created_at', 'updated_at', 'resolved_at']

    def validate(self, attrs):
        report_type = attrs.get('report_type', 'ad')
        related_ad = attrs.get('related_ad')
        reported_user = attrs.get('reported_user')
        request = self.context.get('request')
        current_user = request.user if request and request.user.is_authenticated else None

        if report_type == 'ad':
            if not related_ad:
                raise serializers.ValidationError({'related_ad': 'An ad is required for ad reports.'})
            if current_user and related_ad.seller_id == current_user.id:
                raise serializers.ValidationError({'related_ad': 'You cannot report your own ad.'})
            attrs['reported_user'] = related_ad.seller

        elif report_type == 'user':
            if not reported_user:
                raise serializers.ValidationError({'reported_user': 'A user is required for user reports.'})
            if current_user and reported_user.id == current_user.id:
                raise serializers.ValidationError({'reported_user': 'You cannot report yourself.'})

        else:
            attrs.pop('related_ad', None)
            attrs.pop('reported_user', None)

        return attrs

    def create(self, validated_data):
        # Set reporter from request user if authenticated
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            validated_data['reporter'] = request.user
        return super().create(validated_data)


class AdminReportSerializer(serializers.ModelSerializer):
    reporter_details = UserMinimalSerializer(source='reporter', read_only=True)
    reported_user_details = UserMinimalSerializer(source='reported_user', read_only=True)
    related_ad_details = AdMinimalSerializer(source='related_ad', read_only=True)
    resolved_by_details = UserMinimalSerializer(source='resolved_by', read_only=True)
    messages = SupportMessageSerializer(many=True, read_only=True)
    
    reporter_email = serializers.EmailField(source='contact_email', read_only=True)

    class Meta:
        model = Report
        fields = [
            'id', 'reporter', 'reporter_details', 'report_type', 
            'related_ad', 'related_ad_details', 'reported_user', 
            'reported_user_details', 'reason', 'description', 
            'contact_email', 'reporter_email', 'status', 
            'resolution_note', 'resolved_at', 'resolved_by', 
            'resolved_by_details', 'messages', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'resolved_at', 'resolved_by']
