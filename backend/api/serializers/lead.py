from rest_framework import serializers
from api.models.lead import Lead
from api.serializers.user import UserSerializer
from api.serializers.ad import AdSerializer


class LeadSerializer(serializers.ModelSerializer):
    client_detail = UserSerializer(source='client', read_only=True)
    ad_detail = AdSerializer(source='ad', read_only=True)
    first_source_display = serializers.CharField(source='get_first_source_display', read_only=True)
    last_source_display = serializers.CharField(source='get_last_source_display', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'seller', 'client', 'client_detail',
            'ad', 'ad_detail',
            'first_source', 'first_source_display',
            'last_source', 'last_source_display',
            'sources_used',
            'interaction_count', 'messaged', 'ignored',
            'created_at', 'last_interacted_at',
        ]
        read_only_fields = ['id', 'created_at', 'last_interacted_at', 'interaction_count', 'sources_used']

    def validate(self, data):
        if data.get('client') == data.get('seller'):
            raise serializers.ValidationError("Seller cannot be their own lead.")
        return data


class LeadUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lead
        fields = ['messaged']
