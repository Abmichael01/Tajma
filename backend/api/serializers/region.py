from rest_framework import serializers
from api.models import Region, Ad

class RegionSerializer(serializers.ModelSerializer):
    adsCount = serializers.SerializerMethodField()
    parent_name = serializers.ReadOnlyField(source='parent.name')

    class Meta:
        model = Region
        fields = ['id', 'name', 'slug', 'level', 'parent', 'parent_name', 'adsCount', 'is_active', 'sort_order']

    def get_adsCount(self, obj):
        # Optimized count: directly in region or descendants
        # For the admin list, we might want to cache this or use a simple count
        # To keep it fast for pagination, we'll do a simple filter
        descendant_ids = Region.objects.filter(
            parent_id=obj.id
        ).values_list('id', flat=True)
        
        # Level 3 (Communes) don't have children in this schema usually
        # but let's be safe for Level 1/2
        all_ids = [obj.id] + list(descendant_ids)
        if obj.level == 1:
            # Include grandchildren for Region level
            grandchildren_ids = Region.objects.filter(
                parent_id__in=descendant_ids
            ).values_list('id', flat=True)
            all_ids += list(grandchildren_ids)

        return Ad.objects.filter(
            seller__location_id__in=all_ids,
            status='published'
        ).count()
