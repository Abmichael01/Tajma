import { useEffect, useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import AppText from '@/components/ui/AppText';
import { useGoogleLogin } from '@/hooks/useAuth';
import Alert from '@/components/ui/Alert';

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const googleLogin = useGoogleLogin();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const code = params.code as string | undefined;
        const errorParam = params.error as string | undefined;

        if (errorParam) {
          setError(`Google authentication error: ${errorParam}`);
          setIsProcessing(false);
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 3000);
          return;
        }

        if (!code) {
          setError('No authorization code received from Google.');
          setIsProcessing(false);
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 3000);
          return;
        }

        // Get redirect URI (should match what was sent to backend)
        const redirectUri = `tajma://auth/google/callback`;

        // Exchange code for user info via backend
        await googleLogin.mutateAsync({
          code,
          redirectUri,
        });

        // Success - user is now logged in (handled by useGoogleLogin hook which redirects to home)
      } catch (err: any) {
        const errorMessage = err?.response?.data?.error || err?.message || 'Failed to authenticate with Google.';
        setError(errorMessage);
        setIsProcessing(false);
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 5000);
      }
    };

    processCallback();
  }, [params, router, googleLogin]);

  if (error) {
    return (
      <View className="flex-1 bg-white justify-center items-center px-4">
        <Alert variant="destructive" className="mb-4">
          <Alert.Description>{error}</Alert.Description>
        </Alert>
        <AppText variant="default" className="text-gray-600 text-center">
          Redirecting to login...
        </AppText>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white justify-center items-center">
      <ActivityIndicator size="large" color="#cb234a" />
      <AppText variant="default" className="mt-4 text-gray-600">
        Setting up your account...
      </AppText>
    </View>
  );
}

