from rest_framework import serializers
from api.models import Country

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name', 'code', 'flag_emoji', 'is_active', 'sort_order']
