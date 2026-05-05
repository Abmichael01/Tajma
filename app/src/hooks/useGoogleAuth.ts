import { useState } from 'react';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { useQueryClient } from '@tanstack/react-query';
import { useGoogleLogin } from './useAuth';

// Complete the web browser authentication session
WebBrowser.maybeCompleteAuthSession();

export const useGoogleAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthStore();
  const googleLogin = useGoogleLogin();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use backend URL as redirect URI (Google accepts HTTPS URLs)
      // Backend will handle the callback and redirect to app deep link
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
      // Base redirect URI (without mobile_app param for Google)
      const baseRedirectUri = `${apiUrl}/api/auth/google/callback`;
      // Add mobile_app param for backend to know it's from mobile
      const redirectUriWithParam = `${baseRedirectUri}?mobile_app=true`;

      console.log('🔐 Google OAuth - Using redirect URI:', baseRedirectUri);
      console.log('⚠️ Make sure this URI is registered in Google Cloud Console!');

      // Get authorization URL from backend
      // Backend will add mobile_app param to redirect_uri internally
      const { authorization_url } = await authApi.getGoogleAuthUrl(baseRedirectUri + '?mobile_app=true');

      console.log('🔐 Google OAuth - Opening browser...');

      // App deep link scheme for callback (backend will redirect here)
      const appScheme = 'tajma://auth/google/callback';

      // Open in system browser (required by Google - WebViews are blocked)
      // Flow: Google → Backend → App deep link
      const result = await WebBrowser.openAuthSessionAsync(
        authorization_url,
        appScheme
      );

      console.log('🔐 Google OAuth - Browser result:', result.type);

      if (result.type === 'success') {
        // Backend redirected to app deep link: tajma://auth/google/callback?code=xxx&success=true
        // Access the URL from the result (type assertion needed for TypeScript)
        const deepLinkUrl = (result as any).url || '';
        
        if (deepLinkUrl) {
          try {
            const url = new URL(deepLinkUrl);
            const code = url.searchParams.get('code');
            const success = url.searchParams.get('success');
            const errorParam = url.searchParams.get('error');

            if (errorParam) {
              throw new Error(`Google authentication error: ${errorParam}`);
            }

            if (success === 'true' && code) {
              // Backend already processed the OAuth and logged user in
              // Session is set, so we just need to fetch current user
              const userResponse = await authApi.getCurrentUser();
              const { login: setAuthUser } = useAuthStore.getState();
              const tokens = (userResponse as any).access && (userResponse as any).refresh 
                ? { access: (userResponse as any).access, refresh: (userResponse as any).refresh } 
                : undefined;
              setAuthUser(userResponse, tokens);
              
              // Invalidate queries and redirect
              queryClient.invalidateQueries({ queryKey: ['user'] });
              router.replace('/(tabs)');
            } else {
              throw new Error('No authorization code received from Google.');
            }
          } catch (urlError: any) {
            // If URL parsing fails, try to extract code from the deep link string
            const codeMatch = deepLinkUrl.match(/[?&]code=([^&]+)/);
            const successMatch = deepLinkUrl.match(/[?&]success=([^&]+)/);
            
            if (successMatch && successMatch[1] === 'true' && codeMatch) {
              const userResponse = await authApi.getCurrentUser();
              const { login: setAuthUser } = useAuthStore.getState();
              const tokens = (userResponse as any).access && (userResponse as any).refresh 
                ? { access: (userResponse as any).access, refresh: (userResponse as any).refresh } 
                : undefined;
              setAuthUser(userResponse, tokens);
              queryClient.invalidateQueries({ queryKey: ['user'] });
              router.replace('/(tabs)');
            } else {
              throw new Error('Failed to parse OAuth callback URL.');
            }
          }
        } else {
          throw new Error('No callback URL received from OAuth flow.');
        }
      } else if (result.type === 'cancel') {
        // User cancelled the authentication
        setError('Google authentication was cancelled.');
      } else {
        throw new Error('Failed to complete Google authentication.');
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.error || err?.message || 'Failed to authenticate with Google.';
      setError(errorMessage);
      console.error('Google auth error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleGoogleAuth,
    isLoading,
    error,
  };
};

