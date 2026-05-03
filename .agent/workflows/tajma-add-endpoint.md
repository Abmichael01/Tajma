---
name: tajma-add-endpoint
description: Scaffold a new API endpoint in the Tajma Django backend following project conventions.
---

# Tajma Add Endpoint Skill

Use this workflow when you need to add a new feature that requires a backend model, serializer, and view.

## Steps

### 1. Create the Model
Add a new file in `backend/api/models/{model_name}.py`.
- Use `uuid.UUIDField` for the ID.
- Inherit from `models.Model`.
- Register the model in `backend/api/models/__init__.py`.

### 2. Create the Serializer
Add a new file in `backend/api/serializers/{model_name}.py`.
- Inherit from `serializers.ModelSerializer`.
- Include necessary fields and validation.
- Register in `backend/api/serializers/__init__.py`.

### 3. Create the ViewSet
Add a new file in `backend/api/views/{model_name}.py`.
- Inherit from `viewsets.ModelViewSet`.
- Set `queryset`, `serializer_class`, and `permission_classes`.
- Register in `backend/api/views/__init__.py`.

### 4. Register the URL
Update `backend/api/urls/__init__.py` to register the new viewset with the router.

### 5. Verify
Run migrations:
```bash
poetry run python manage.py makemigrations
poetry run python manage.py migrate
```

## Conventions
- Always include `created_at` and `updated_at` fields in models.
- Use `permissions.IsAuthenticated` by default.
- Use `pnpm tsc --noEmit` in the frontend if adding corresponding types.
