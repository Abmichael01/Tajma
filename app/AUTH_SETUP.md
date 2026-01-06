# Django Cookie Authentication in React Native

## Overview

This app uses Django's session-based authentication with cookies. Unlike web browsers, React Native doesn't automatically handle cookies, so we need to use special libraries and configurations.

## How It Works

### 1. **Cookie Management**
- Django sets session cookies (usually `sessionid`) in HTTP responses
- Axios is configured with `withCredentials: true` to automatically send/receive cookies
- React Native's fetch API (used by axios) handles cookies automatically when `credentials: 'include'` is set
- No additional cookie management library needed!

### 2. **CSRF Token Handling**
- Django requires CSRF tokens for POST/PUT/DELETE requests
- The CSRF token is returned in the API response (not just cookies)
- We fetch it on app start using `useCSRFToken()` hook
- The token is stored in AsyncStorage and automatically added to request headers via axios interceptor

### 3. **Session Management**
- Django uses server-side sessions stored in the database
- The session ID is sent as a cookie (`sessionid`)
- When you login, Django creates a session and sends the session cookie
- All subsequent requests include this cookie automatically (via `withCredentials: true`)
- The session persists until logout or expiration

### 4. **Authentication State**
- **Zustand Store**: `src/store/authStore.ts`
- Stores user data and authentication state
- Persisted to AsyncStorage for offline access
- Automatically syncs with server on app start

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the app root:
```
EXPO_PUBLIC_API_URL=http://your-backend-url:8000
```

For development, use your local IP or ngrok URL:
```
EXPO_PUBLIC_API_URL=http://192.168.1.100:8000
# or
EXPO_PUBLIC_API_URL=https://your-ngrok-url.ngrok.io
```

### 2. Backend Configuration
Ensure your Django backend has CORS configured to accept requests from your React Native app:

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8081",  # Expo dev server
    "exp://192.168.1.100:8081",  # Your local IP
    # Add your production URLs
]

CORS_ALLOW_CREDENTIALS = True  # Important for cookies!

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = False  # Set to True in production with HTTPS
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False  # Must be False to read in React Native
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
```

### 3. API Client Configuration
The API client (`src/api/apiClient.ts`) is already configured with:
- `withCredentials: true` - Sends cookies with requests
- CSRF token interceptor - Automatically adds CSRF token to headers
- Error handling - Handles 401/403 errors and CSRF token refresh

## Usage

### Login
```typescript
import { useLogin } from '@/hooks/useAuth';

const loginMutation = useLogin();
await loginMutation.mutateAsync({
  email: 'user@example.com',
  password: 'password123'
});
```

### Register
```typescript
import { useRegister } from '@/hooks/useAuth';

const registerMutation = useRegister();
await registerMutation.mutateAsync({
  email: 'user@example.com',
  first_name: 'John',
  last_name: 'Doe',
  password: 'password123',
  password_confirm: 'password123'
});
```

### Get Current User
```typescript
import { useCurrentUser } from '@/hooks/useAuth';

const { data: user, isLoading } = useCurrentUser();
```

### Check Authentication
```typescript
import { useAuthStore } from '@/store/authStore';

const { isAuthenticated, user } = useAuthStore();
```

## Important Notes

1. **Development**: Use your local IP address or ngrok for testing. `localhost` won't work on physical devices.

2. **Cookies**: Axios with `withCredentials: true` automatically handles cookies (session cookies are sent/received automatically). No additional cookie management needed!

3. **CSRF Tokens**: Stored in AsyncStorage when received from the API. Must be fetched before making POST/PUT/DELETE requests. The `useCSRFToken()` hook handles this automatically.

4. **Session Persistence**: User data is stored in AsyncStorage and synced with the server on app start.

5. **Error Handling**: 401 errors automatically clear auth state. 403 errors trigger CSRF token refresh and retry.

## Testing

1. Start your Django backend
2. Update `EXPO_PUBLIC_API_URL` in `.env`
3. Run the app: `pnpm start`
4. Test login/register flows
5. Check that cookies are being sent in network requests

## Troubleshooting

### Cookies not being sent
- Check that `withCredentials: true` is set in axios config
- Verify CORS settings allow credentials
- Ensure backend URL is correct (not localhost on physical device)
- Cookies are handled automatically by axios - no manual cookie management needed

### CSRF token errors
- Make sure `useCSRFToken()` is called before making POST requests
- Check that CSRF token is being returned in the API response
- Verify CSRF token is stored in AsyncStorage and added to request headers
- Check AsyncStorage permissions if token isn't being saved

### 401 Unauthorized
- Session may have expired - user will be logged out automatically
- Check that session cookie is being sent with requests
- Verify backend session middleware is configured correctly

