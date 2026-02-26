from rest_framework import serializers
from api.models import KYCVerification

class KYCVerificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = KYCVerification
        fields = [
            'id', 'job_id', 'smile_user_id', 'document_type', 
            'country', 'status', 'result', 'created_at', 'updated_at'
        ]
        read_only_fields = fields

class KYCInitiateSerializer(serializers.Serializer):
    country = serializers.CharField(default='NE')
    id_type = serializers.ChoiceField(
        choices=['NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE'],
        default='NATIONAL_ID'
    )
    callback_url = serializers.URLField(required=False)
