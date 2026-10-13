# Tajma Marketplace

Tajma is a web and mobile marketplace connecting buyers and sellers across
Niger, Mali, and Burkina Faso. It helps individuals and businesses advertise
products and services, discover local listings, and communicate directly
through built-in messaging.

## Industry and business idea

**Industry:** E-commerce and online classifieds.

Tajma brings local commerce into one platform where users can list items such
as electronics, vehicles, and property, offer services, and find relevant
listings by category and location. Seller profiles, reviews, and reporting
tools support trust between marketplace participants.

## Features

- Account registration, sign-in, and user profiles.
- Ad creation and editing, category browsing, search, and location filters.
- Seller onboarding and seller profiles.
- Buyer and seller chat, notifications, and saved ads.
- Reviews, user reports, and administrative moderation tools.
- English, French, and Hausa localization.
- Web and mobile interfaces backed by a shared API.

## Technology stack

| Component | Technologies |
| --- | --- |
| Web frontend | Next.js, React, TypeScript, Tailwind CSS |
| Mobile app | Expo, React Native, Expo Router, TypeScript, NativeWind |
| Backend | Python, Django, Django REST Framework |
| Realtime messaging | Django Channels and WebSockets |
| Background processing | Celery and Redis |
| Client data and state | TanStack Query and Zustand |

## Repository structure

```text
frontend/          Next.js web application and administration interface
app/               Expo mobile application
backend/           Django API, data models, and backend services
scripts/           Development and localization utilities
project_roadmap.md  Project targets and planned improvements
```

The web and mobile applications manage their JavaScript dependencies in their
respective `package.json` files. Backend dependencies are declared in
`backend/pyproject.toml` and managed with Poetry. Each application requires its
own environment configuration for API connectivity and enabled integrations.

See the [project roadmap](project_roadmap.md) for planned development work.
