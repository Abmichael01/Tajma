import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

export default function AuthLayout() {
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      router.replace("/home");
    }
  }, [isAuthenticated, hasHydrated, router]);

  if (hasHydrated && isAuthenticated) return null;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}

