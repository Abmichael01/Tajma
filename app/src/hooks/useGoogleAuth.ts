import { useState } from "react";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { useQueryClient } from "@tanstack/react-query";

// Complete the web browser authentication session
WebBrowser.maybeCompleteAuthSession();

const getDeepLinkParam = (url: string, param: string): string | null => {
  const match = url.match(new RegExp(`[?&]${param}=([^&]+)`));
  return match ? decodeURIComponent(match[1].replace(/\+/g, " ")) : null;
};

export const useGoogleAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { login: setAuthUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Use backend URL as redirect URI (Google accepts HTTPS URLs)
      // Backend will handle the callback and redirect to app deep link
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000";
      // Base redirect URI (without mobile_app param for Google)
      const baseRedirectUri = `${apiUrl}/api/auth/google/callback`;

      console.log("🔐 Google OAuth - Using redirect URI:", baseRedirectUri);
      console.log(
        "⚠️ Make sure this URI is registered in Google Cloud Console!",
      );

      // Get authorization URL from backend
      const { authorization_url } = await authApi.getGoogleAuthUrl(
        baseRedirectUri,
        { mobileApp: true },
      );

      console.log("🔐 Google OAuth - Opening browser...");

      // App deep link scheme for callback (backend will redirect here).
      // Three slashes (no host) so expo-linking parses the rest as path
      // and expo-router matches app/src/app/auth/google/callback.tsx.
      const appScheme = "tajma:///auth/google/callback";

      // Open in system browser (required by Google - WebViews are blocked)
      // Flow: Google → Backend → App deep link
      const result = await WebBrowser.openAuthSessionAsync(
        authorization_url,
        appScheme,
      );

      console.log("🔐 Google OAuth - Browser result:", result.type);

      if (result.type === "success") {
        // Backend redirected to app deep link:
        // tajma://auth/google/callback?success=true&exchange_token=xxx
        // Access the URL from the result (type assertion needed for TypeScript)
        const deepLinkUrl = (result as any).url || "";

        if (deepLinkUrl) {
          const success = getDeepLinkParam(deepLinkUrl, "success");
          const exchangeToken = getDeepLinkParam(deepLinkUrl, "exchange_token");
          const errorParam = getDeepLinkParam(deepLinkUrl, "error");

          if (errorParam) {
            throw new Error(`Google authentication error: ${errorParam}`);
          }

          if (success === "true" && exchangeToken) {
            const authResponse =
              await authApi.exchangeGoogleMobileToken(exchangeToken);
            const tokens =
              authResponse.access && authResponse.refresh
                ? { access: authResponse.access, refresh: authResponse.refresh }
                : undefined;
            setAuthUser(authResponse.user, tokens);
            queryClient.invalidateQueries({ queryKey: ["user"] });
            router.replace("/(tabs)");
          } else {
            throw new Error(
              "No mobile exchange token received from Google sign-in.",
            );
          }
        } else {
          throw new Error("No callback URL received from OAuth flow.");
        }
      } else if (result.type === "cancel") {
        // User cancelled the authentication
        setError("Google authentication was cancelled.");
      } else {
        throw new Error("Failed to complete Google authentication.");
      }
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to authenticate with Google.";
      setError(errorMessage);
      console.error("Google auth error:", err);
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
