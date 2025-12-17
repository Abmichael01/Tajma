# Google OAuth Setup for Mobile App

## Common "Access Blocked" Error Solutions

### 1. **OAuth Consent Screen Configuration**

Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials/consent):

1. **Publishing Status**: 
   - If your app is in "Testing" mode, you must:
     - Add test users in the "Test users" section
     - OR publish the app to "In production"
   - To publish: Click "PUBLISH APP" button and confirm

2. **User Type**:
   - For development: Use "External" and add test users
   - For production: Publish the app

### 2. **Redirect URI Configuration**

In Google Cloud Console → APIs & Services → Credentials → Your OAuth 2.0 Client ID:

**Add these Authorized Redirect URIs:**

For Mobile App (using backend callback):
```
https://interavailable-lexi-instigative.ngrok-free.dev/api/auth/google/callback
```

**IMPORTANT**: 
- The path is `/api/auth/google/callback` (with `/api/` prefix)
- NOT `/auth/google/callback` (without `/api/`)
- Must match EXACTLY including the `/api/` prefix

**Important**: 
- The redirect URI must match EXACTLY (including protocol, domain, path)
- No trailing slashes
- Must be HTTPS for production (not HTTP)

### 3. **OAuth Client Type**

For mobile apps, you can use:
- **Web application** type (recommended for this setup)
- Make sure the redirect URI is added to "Authorized redirect URIs"

### 4. **Testing Checklist**

- [ ] OAuth consent screen is published OR test users are added
- [ ] Redirect URI is registered in Google Cloud Console
- [ ] Redirect URI matches exactly (case-sensitive, no trailing slash)
- [ ] Using system browser (not WebView) - `expo-web-browser` handles this
- [ ] Backend is accessible from the device
- [ ] Google OAuth credentials (client_id, client_secret) are configured in backend

### 5. **Debugging**

Check the console logs:
- Redirect URI being used
- Authorization URL received
- OAuth result type

Common errors:
- `redirect_uri_mismatch`: URI not registered or doesn't match exactly
- `access_denied`: App not published or user not in test users list
- `invalid_client`: Client ID/Secret misconfigured

### 6. **Current Implementation**

The app uses:
- **Redirect URI**: `${API_URL}/api/auth/google/callback`
- **Browser**: System browser via `expo-web-browser`
- **Flow**: 
  1. App requests auth URL from backend
  2. Opens Google OAuth in system browser
  3. User authenticates
  4. Google redirects to backend callback
  5. Backend exchanges code for token
  6. Backend returns user data
  7. App logs user in

Make sure the backend URL redirect URI is registered in Google Cloud Console!

