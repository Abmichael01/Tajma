---
name: tajma-sync-types
description: Ensure TypeScript type definitions in frontend and app match backend Django models and serializers.
---

# Tajma Sync Types Skill

Use this workflow whenever you modify a backend model or serializer to ensure frontend stability.

## Steps

### 1. Identify Changes
List the fields changed or added in `backend/api/models/` or `backend/api/serializers/`.

### 2. Update Frontend Types
Update `frontend/src/api/types.ts`.
- Match the TypeScript interface to the DRF serializer output.
- Use `ISOString` for dates.
- Use optional fields `?` where appropriate.

### 3. Update App Types
Update `app/src/api/types.ts`.
- Ensure it matches the frontend types for consistency.

### 4. Verify TypeScript
Run type checks in both directories:
```bash
# Frontend
cd frontend && pnpm tsc --noEmit

# App
cd app && pnpm tsc --noEmit
```

## Conventions
- Use `export interface` for types.
- Maintain alphabetical order in `types.ts` where possible.
- Use Unions for status strings (e.g., `status: 'pending' | 'active' | 'archived'`).
