from rest_framework import serializers
from api.models import Transaction, Promotion, Ad, PromotionPackage

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

class PromotionPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromotionPackage
        fields = [
            'id', 'name', 'description', 'promotion_type', 
            'price', 'discount_price', 'duration_days', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        price = attrs.get('price', getattr(self.instance, 'price', None))
        discount_price = attrs.get('discount_price', getattr(self.instance, 'discount_price', None))

        if discount_price is not None and price is not None and discount_price >= price:
            raise serializers.ValidationError({
                'discount_price': 'Discount price must be lower than the regular price.'
            })

        return attrs

class PaymentInitiateSerializer(serializers.Serializer):
    ad_id = serializers.UUIDField()
    promotion_type = serializers.ChoiceField(choices=Promotion.PROMOTION_TYPE_CHOICES)
    days = serializers.IntegerField(min_value=1, default=7)
