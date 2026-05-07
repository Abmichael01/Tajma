import { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import AppText from "@/components/ui/AppText";
import Alert from "@/components/ui/Alert";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";

export default function GoogleCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCallback = async () => {
      try {
        const exchangeToken = params.exchange_token as string | undefined;
        const errorParam = params.error as string | undefined;

        if (errorParam) {
          setError(`Google authentication error: ${errorParam}`);
          setTimeout(() => {
            router.replace("/(auth)/login");
          }, 3000);
          return;
        }

        if (!exchangeToken) {
          setError("No mobile exchange token received from Google.");
          setTimeout(() => {
            router.replace("/(auth)/login");
          }, 3000);
          return;
        }

        const authResponse =
          await authApi.exchangeGoogleMobileToken(exchangeToken);
        const tokens =
          authResponse.access && authResponse.refresh
            ? { access: authResponse.access, refresh: authResponse.refresh }
            : undefined;

        setAuthUser(authResponse.user, tokens);
        queryClient.invalidateQueries({ queryKey: ["user"] });
        router.replace("/(tabs)");
      } catch (err: any) {
        const errorMessage =
          err?.response?.data?.error ||
          err?.message ||
          "Failed to authenticate with Google.";
        setError(errorMessage);
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 5000);
      }
    };

    processCallback();
  }, [params, queryClient, router, setAuthUser]);

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
      <ActivityIndicator size="large" color="#FF4F18" />
      <AppText variant="default" className="mt-4 text-gray-600">
        Setting up your account...
      </AppText>
    </View>
  );
}
