# Tajma Premium Marketplace: Progressive Roadmap

This file serves as a persistent record of the project targets and architectural decisions.

## Phase 1: Infrastructure & Core Hardening
- [ ] **Image Storage**: Migrate from local storage to **Cloudinary** (recommended) or **S3**.
- [ ] **Observability**: Integrate **Sentry** for real-time error tracking in Backend, Frontend, and App.
- [ ] **Security**: Finalize CORS/CSRF configurations and implement Rate Limiting for auth endpoints.
- [ ] **Resilience**: Refine 404 and 500 error pages with premium branding.

## Phase 2: Payments & Monetization
- [ ] **Provider**: **Paystack** (XOF support).
- [ ] **Logic**: Implement "Promoted/Featured Ads" system.
- [ ] **Webhooks**: Secure backend handlers for transaction confirmation.

## Phase 3: Trust & Governance
- [ ] **Moderation**: Dedicated admin view for reviewing new ads and KYC (Smile ID).
- [ ] **Reporting**: User-facing report buttons and admin resolution flows.

## Phase 4: Engagement & Platform Parity
- [ ] **Push Notifications**: FCM setup for mobile chat and ad alerts.
- [ ] **Mapping**: Leaflet/Google Maps integration for location discovery.
- [ ] **Deep Linking**: iOS/Android routing for ad sharing.

---
*Last updated: 2026-04-01*
