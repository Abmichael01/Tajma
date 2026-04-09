from rest_framework import serializers
from api.models import Transaction, Promotion, Ad

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = [
            'id', 'reference', 'amount', 'currency', 
            'status', 'provider', 'metadata', 'created_at'
        ]
        read_only_fields = fields

class PromotionSerializer(serializers.ModelSerializer):
    ad_title = serializers.CharField(source='ad.title', read_only=True)
    
    class Meta:
        model = Promotion
        fields = [
            'id', 'ad', 'ad_title', 'promotion_type', 
            'start_at', 'end_at', 'is_active', 'created_at'
        ]
        read_only_fields = ['id', 'is_active', 'created_at']

class PaymentInitiateSerializer(serializers.Serializer):
    ad_id = serializers.UUIDField()
    promotion_type = serializers.ChoiceField(choices=Promotion.PROMOTION_TYPE_CHOICES)
    # Optional amount override or specific package ID could go here
