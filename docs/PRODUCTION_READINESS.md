# Tajma Production Readiness

Use this before release and after every production environment change.

## Payments And Promotions

- [ ] Create active promotion packages in `/admin/promotions`.
- [ ] Confirm no sellers can promote an ad when no active matching package exists.
- [ ] Set `PAYSTACK_SECRET_KEY` to the live key in the backend production environment.
- [ ] Set the Paystack webhook URL to `https://<api-domain>/api/payments/webhook/`.
- [ ] Verify Paystack webhook signature events create `Promotion` records and update ad placement.
- [ ] Confirm Paystack callback URL points to the live frontend payment verification route.

## Reports And Moderation

- [ ] Submit an ad report from web.
- [ ] Submit an ad report from the mobile app.
- [ ] Confirm admin can reply to, resolve, dismiss, archive ad, warn seller, and suspend seller from `/admin/reports`.
- [ ] Confirm archived ads disappear from public listings.
- [ ] Confirm suspended users cannot log in.

## Mobile Runtime

- [ ] Test splash screen on Android release build.
- [ ] Test splash screen on iOS release build.
- [ ] Test location permission denied, allowed, and revoked states.
- [ ] Test reverse geocoding after placing an ad pin.
- [ ] Test push notifications on a real Android device.
- [ ] Test push notifications on a real iOS device.
- [ ] Test chat keyboard, emoji panel, media upload, image crop, rotate, and flip on real devices.

## Deep Links

- [ ] Replace `YOUR_SHA256_FINGERPRINT` in `frontend/public/.well-known/assetlinks.json`.
- [ ] Confirm `https://tajma.net/.well-known/assetlinks.json` returns HTTP 200 with JSON content.
- [ ] Confirm `https://tajma.net/.well-known/apple-app-site-association` returns HTTP 200 without a forced download header.
- [ ] Test `https://tajma.net/ads/<slug>` opens the app on Android.
- [ ] Test `https://tajma.net/ads/<slug>` opens the app on iOS.

## Observability

- [ ] Set backend `SENTRY_DSN`.
- [ ] Set frontend Sentry org/project values for source map uploads.
- [ ] Set app Sentry org/project values or build environment variables for Expo builds.
- [ ] Confirm one test backend exception is visible in Sentry.
- [ ] Confirm one test frontend exception is visible in Sentry.
- [ ] Confirm one test mobile exception is visible in Sentry.

## Environment

- [ ] Set backend `ENV=production`.
- [ ] Set backend `SECRET_KEY` to a strong production-only value.
- [ ] Set `DEBUG=False`.
- [ ] Set `FRONTEND_URL=https://tajma.net`.
- [ ] Set `CORS_ALLOWED_ORIGINS=https://tajma.net,https://www.tajma.net`.
- [ ] Set `CSRF_TRUSTED_ORIGINS=https://tajma.net,https://www.tajma.net`.
- [ ] Confirm `.env`, `.env.local`, and backup env files are not committed.

## Known Dependency Decision

- [ ] Decide whether to keep SmileID web KYC with the current `validate.js` advisory or replace the web KYC integration.

`pnpm audit --prod` still reports `@smileid/web-components -> validate.js` with no patched upstream release. Do not suppress this audit item unless the team has explicitly accepted the risk.
