---
name: tajma-audit
description: Perform a rapid sanity check across Backend, Frontend, and App to ensure environment health.
---

# Tajma Audit Skill

Use this workflow to verify the project status after big changes or before a demo.

## Checks

### 1. Environment Variables
Verify `.env` files exist in:
- `backend/.env`
- `frontend/.env.local`
- `app/.env` (or project config)

### 2. Backend Health
Check if the backend starts and responds:
```bash
cd backend && poetry run python manage.py check
```

### 3. Frontend Build
Check for lint or type errors:
```bash
cd frontend && pnpm biome check . && pnpm tsc --noEmit
```

### 4. Third-Party Check
Ensure critical keys are present:
- `SMILE_ID_API_KEY`
- `PAYSTACK_SECRET_KEY`
- `CLOUDINARY_URL` (if production)

### 5. Roadmap Sync
Read `project_roadmap.md` and check if current work matches priorities.

## Success Criteria
- [ ] No TypeScript errors in Frontend/App.
- [ ] Backend migrations are up to date.
- [ ] CORS/Allowed Origins matched in both Backend and Frontend.
