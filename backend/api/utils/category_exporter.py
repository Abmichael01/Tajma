import json
from pathlib import Path
from typing import Dict, List

from django.conf import settings
from django.db.models import Count, Q

from api.models import Category, Ad


def build_category_tree() -> List[Dict]:
    categories = Category.objects.filter(is_active=True).order_by('sort_order', 'name')
    by_parent = {}
    for category in categories:
        by_parent.setdefault(category.parent_id, []).append(category)

    # Pre-calculate ad counts for all categories (only published ads)
    ad_counts = dict(
        Ad.objects
        .filter(status='published')
        .values('category')
        .annotate(count=Count('id'))
        .values_list('category', 'count')
    )

    def serialize(category: Category) -> Dict:
        children = [serialize(child) for child in by_parent.get(category.id, [])]
        
        # Calculate total count: this category's ads + all children's ads
        direct_count = ad_counts.get(category.id, 0)
        children_count = sum(child.get('count', 0) for child in children)
        total_count = direct_count + children_count
        
        return {
            'id': category.slug,
            'name': category.name,
            'slug': category.slug,
            'icon': category.icon or 'Package',
            'imageUrl': category.image_url,
            'type': category.category_type,
            'description': category.description,
            'customFields': category.custom_fields or [],
            'count': total_count,  # Total ads in this category and all subcategories
            'subcategories': children,
        }

    return [serialize(category) for category in by_parent.get(None, [])]


def export_categories_to_json() -> Path:
    data = build_category_tree()
    configured_path = getattr(settings, 'CATEGORIES_JSON_PATH', settings.BASE_DIR / 'category_data.json')
    output_path = Path(configured_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return output_path
