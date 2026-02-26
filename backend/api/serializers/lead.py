from rest_framework import serializers
from api.models.lead import Lead
from api.serializers.user import UserSerializer
from api.serializers.ad import AdSerializer

class LeadSerializer(serializers.ModelSerializer):
    client_detail = UserSerializer(source='client', read_only=True)
    ad_detail = AdSerializer(source='ad', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'seller', 'client', 'client_detail', 'ad', 'ad_detail', 
            'source', 'messaged', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, data):
        # Ensure client and seller are different
        if data.get('client') == data.get('seller'):
            raise serializers.ValidationError("Seller cannot be their own lead.")
        return data

class LeadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['messaged']
