# Google OAuth Setup Guide

## For Frontend (Next.js) - localhost

### Google Cloud Console Setup:
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Add Authorized Redirect URI:
   ```
   http://localhost:3000/auth/google/callback
   ```
4. Save

### Test:
- Open http://localhost:3000/login on your computer
- Click "Continue with Google"
- Should work!

---

## For Mobile App (Expo) - Phone Testing

### Step 1: Check your app.json
File: `app/app.json`

Make sure you have a scheme defined:
```json
{
  "expo": {
    "scheme": "tajma"
  }
}
```

### Step 2: Install packages (DONE)
```bash
npx expo install expo-auth-session expo-web-browser expo-crypto
```

### Step 3: Create Google Auth Hook

File: `app/src/hooks/useGoogleAuth.ts`

```typescript
import { useEffect } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const router = useRouter();
  const { login: setAuthUser } = useAuthStore();

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '177609841386-2bbq2n5h4shobvkrl694ei1sjhaitvu1.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleLogin(response.authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleLogin = async (accessToken: string | undefined) => {
    if (!accessToken) return;

    try {
      // Get user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();
      
      // Send to your backend to create/login user
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8005';
      const response = await fetch(`${apiUrl}/api/auth/google/mobile/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken, user_info: userInfo }),
      });
      
      const data = await response.json();
      setAuthUser(data.user);
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Google login error:', error);
      alert('Failed to complete Google login');
    }
  };

  return { promptAsync, isLoading: !request };
};
```

### Step 4: Add to Login Screen

File: `app/src/app/(auth)/login.tsx`

Add the Google Sign-In button:

```tsx
import { useGoogleAuth } from '@/hooks/useGoogleAuth';

// In your component:
const { promptAsync, isLoading } = useGoogleAuth();

// Add button:
<Pressable
  onPress={() => promptAsync()}
  disabled={isLoading}
  className="bg-white border border-gray-300 rounded-lg p-4 flex-row items-center justify-center"
>
  {/* Google Icon SVG here */}
  <AppText>Continue with Google</AppText>
</Pressable>
```

### Step 5: Create Backend Endpoint

File: `backend/api/views/google_auth.py`

Add new endpoint for mobile:

```python
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def google_mobile_callback(request):
    """Handle Google OAuth for mobile app"""
    access_token = request.data.get('access_token')
    user_info = request.data.get('user_info')
    
    if not access_token or not user_info:
        return Response({'error': 'Missing data'}, status=400)
    
    email = user_info.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=400)
    
    # Get or create user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=email,
            username=email.split('@')[0],
            first_name=user_info.get('given_name', ''),
            last_name=user_info.get('family_name', ''),
            avatar=user_info.get('picture'),
        )
    
    # Create social account
    SocialAccount.objects.get_or_create(
        provider='google',
        uid=str(user_info.get('id', '')),
        defaults={'user': user, 'extra_data': user_info}
    )
    
    return Response({
        'user': UserDetailsSerializer(user).data,
        'message': 'Success'
    })
```

### Step 6: Add URL Route

File: `backend/api/urls/auth.py`

```python
path('google/mobile/', google_mobile_callback),
```

### Step 7: Google Cloud Console - Mobile Redirect URI

After you run `npx expo start`, Expo will show you the redirect URI.
It will look something like:
```
exp://192.168.1.152:8081
```

OR if published:
```
tajma://
```

Add this to Google Cloud Console Authorized Redirect URIs.

---

## Testing

### Frontend:
1. `cd frontend && pnpm dev`
2. Open browser: http://localhost:3000/login
3. Click Google sign-in
4. Should redirect to Google and back

### Mobile:
1. `cd app && pnpm lan`
2. Open app on phone
3. Tap Google sign-in button
4. Browser opens, sign in with Google
5. Returns to app, logged in!

---

## Troubleshooting

**"redirect_uri_mismatch" error:**
- Check Google Cloud Console redirect URIs match EXACTLY
- No trailing slashes
- Check http vs https

**Mobile not working:**
- Make sure expo-auth-session is installed
- Check app.json has a scheme
- Verify backend endpoint exists

**Frontend not working:**
- Backend must be running on port 8005
- Check FRONTEND_URL in backend/.env
- Clear browser cache

