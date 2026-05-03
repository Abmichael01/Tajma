import os
import django
import json
import sys

# Setup Django
sys.path.append('/home/urkelcodes/Desktop/MyProjects/Clients/tajma/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import Category, Ad
from api.serializers.ad import AdSerializer
from rest_framework.exceptions import ValidationError
from django.contrib.auth import get_user_model

User = get_user_model()

def test_validation():
    print("Starting attributes validation test...")
    
    # 1. Ensure we have a test user
    user, _ = User.objects.get_or_create(username='testauditor', email='auditor@test.com')
    
    # 2. Create a test category with custom fields
    cat, _ = Category.objects.get_or_create(
        name="Test Audit Category",
        slug="test-audit-cat",
        defaults={
            'custom_fields': [
                {"name": "color", "type": "select", "label": "Color", "required": True, "options": ["Red", "Blue"]},
                {"name": "year", "type": "number", "label": "Year", "required": False}
            ]
        }
    )
    # Force update fields in case it existed
    cat.custom_fields = [
        {"name": "color", "type": "select", "label": "Color", "required": True, "options": ["Red", "Blue"]},
        {"name": "year", "type": "number", "label": "Year", "required": False}
    ]
    cat.save()
    
    print(f"Created/Updated Category: {cat.name} with custom_fields: {json.dumps(cat.custom_fields)}")

    # 3. Test Case: Missing required field
    print("\nTest Case 1: Missing required field 'color'...")
    serializer = AdSerializer(data={
        'title': 'Test Ad',
        'description': 'Test description',
        'category': cat.slug,
        'price': 100,
        'attributes': {'year': 2023}
    }, context={'request': type('obj', (object,), {'user': user})})
    
    try:
        serializer.is_valid(raise_exception=True)
        print("❌ Failed: Should have raised ValidationError for missing 'color'")
    except ValidationError as e:
        print(f"✅ Success: Caught expected error: {json.dumps(e.detail)}")

    # 4. Test Case: Invalid option
    print("\nTest Case 2: Invalid option for 'color'...")
    serializer = AdSerializer(data={
        'title': 'Test Ad',
        'description': 'Test description',
        'category': cat.slug,
        'price': 100,
        'attributes': {'color': 'Green', 'year': 2023}
    }, context={'request': type('obj', (object,), {'user': user})})
    
    try:
        serializer.is_valid(raise_exception=True)
        print("❌ Failed: Should have raised ValidationError for invalid color 'Green'")
    except ValidationError as e:
        print(f"✅ Success: Caught expected error: {json.dumps(e.detail)}")

    # 5. Test Case: Valid data
    print("\nTest Case 3: Valid data...")
    serializer = AdSerializer(data={
        'title': 'Test Ad',
        'description': 'Test description',
        'category': cat.slug,
        'price': 100,
        'attributes': {'color': 'Red', 'year': 2023}
    }, context={'request': type('obj', (object,), {'user': user})})
    
    if serializer.is_valid():
        print("✅ Success: Serializer is valid for correct attributes")
    else:
        print(f"❌ Failed: Serializer should be valid. Errors: {json.dumps(serializer.errors)}")

if __name__ == "__main__":
    test_validation()
