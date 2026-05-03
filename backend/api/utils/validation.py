from typing import List, Dict, Any
from rest_framework.exceptions import ValidationError

def validate_ad_attributes(category_custom_fields: List[Dict[str, Any]], ad_attributes: Dict[str, Any]):
    """
    Validates ad attributes against a category's custom_fields definition.
    
    Expected category_custom_fields format:
    [
      {
        "name": "field_name",
        "type": "text" | "number" | "select" | "checkbox" | "textarea" | "array" | "tags",
        "required": true,
        "options": ["opt1", "opt2"] (only for select)
      }
    ]
    """
    if not category_custom_fields:
        return
    
    if ad_attributes is None:
        ad_attributes = {}

    errors = {}
    
    # Map field names to their config
    field_configs = {field['name']: field for field in category_custom_fields if 'name' in field}
    
    # Check for required fields and validate values
    for field_name, config in field_configs.items():
        value = ad_attributes.get(field_name)
        field_type = config.get('type', 'text')
        is_required = config.get('required', False)
        
        # Check if required field is present and not empty
        if is_required:
            if value is None or value == '' or (isinstance(value, list) and len(value) == 0):
                errors[field_name] = f"This field is required."
                continue
        
        # If value is provided, validate its type/options
        if value is not None and value != '':
            if field_type == 'number':
                try:
                    float(value)
                except (ValueError, TypeError):
                    errors[field_name] = "Must be a valid number."
            
            elif field_type == 'select':
                options = config.get('options', [])
                if options and value not in options:
                    errors[field_name] = f"Invalid option. Must be one of: {', '.join(options)}"
            
            elif field_type == 'checkbox':
                if not isinstance(value, bool):
                    errors[field_name] = "Must be a boolean."
            
            elif field_type == 'array' or field_type == 'tags':
                if not isinstance(value, list):
                    errors[field_name] = "Must be a list."
                    
    if errors:
        raise ValidationError(errors)
