import {
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import BackButton from "@/components/ui/BackButton";
import Input from "@/components/ui/Input";
import FormGroup from "@/components/ui/FormGroup";
import Alert from "@/components/ui/Alert";
import { useLogin } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const loginSchema = z.object({
  email: z.string().email("Email is invalid").min(1, "Email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const loginMutation = useLogin();
  const {
    handleGoogleAuth,
    isLoading: googleLoading,
    error: googleError,
  } = useGoogleAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
    mode: "onChange",
  });

  const onSubmit = async (data: LoginFormValues) => {
    setFormError(null); // Clear previous errors
    try {
      await loginMutation.mutateAsync({
        email: data.email,
        password: data.password,
      });
    } catch (error: any) {
      let errorMessage = "Login failed. Please try again.";

      if (
        error?.code === "ERR_NETWORK" ||
        error?.message?.includes("Network Error")
      ) {
        errorMessage =
          "Cannot connect to server. Please check your network connection and ensure the backend server is running.";
      } else if (error?.response?.data) {
        // Handle Django validation errors
        const errorData = error.response.data;
        if (errorData.non_field_errors) {
          errorMessage = Array.isArray(errorData.non_field_errors)
            ? errorData.non_field_errors[0]
            : errorData.non_field_errors;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else {
          // Try to extract first error message
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && Array.isArray(errorData[firstKey])) {
            errorMessage = errorData[firstKey][0];
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setFormError(errorMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-white">
          <StatusBar style="auto" />
          {/* Back Button */}
          <BackButton className="top-12 left-4" />

          {/* Scrollable form content */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 16,
              paddingTop: 80,
              paddingBottom: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Logo */}
            <View className="items-center mb-8">
              <Image
                source={require("@/assets/images/logo.png")}
                className="w-32 h-10"
                resizeMode="contain"
              />
            </View>

            <AppText
              variant="heading"
              weight="semibold"
              className="mb-2 text-center"
            >
              Welcome back
            </AppText>
            <AppText variant="default" center className="mb-8">
              Don't have an account?{" "}
              <Link href="/(auth)/register" asChild>
                <AppText weight="semibold" className="text-primary">
                  Sign up for free
                </AppText>
              </Link>
            </AppText>

            {/* Form Error Alert */}
            {formError && (
              <Alert variant="destructive" className="mb-6">
                <Alert.Description>{formError}</Alert.Description>
              </Alert>
            )}

            <FormGroup
              label="Email address"
              required
              error={errors.email?.message}
            >
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    className="py-4 text-lg"
                    placeholder="you@example.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (formError) setFormError(null);
                    }}
                    onBlur={onBlur}
                    error={!!errors.email}
                    leftIcon={
                      <Ionicons
                        name="mail-outline"
                        size={20}
                        color="#9ca3af"
                      />
                    }
                  />
                )}
              />
            </FormGroup>

            <FormGroup
              label="Password"
              required
              error={errors.password?.message}
            >
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    className="py-4 text-lg"
                    placeholder="••••••••"
                    secureTextEntry
                    showPasswordToggle
                    autoCapitalize="none"
                    autoComplete="password"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      if (formError) setFormError(null);
                    }}
                    onBlur={onBlur}
                    error={!!errors.password}
                    leftIcon={
                      <Ionicons
                        name="lock-closed-outline"
                        size={20}
                        color="#9ca3af"
                      />
                    }
                  />
                )}
              />
            </FormGroup>

            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => router.push("/(auth)/forgot-password")}
              >
                <AppText variant="default" className="text-primary">
                  Forgot password?
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View className="flex-row items-center mb-6">
              <View className="flex-1 h-px bg-gray-300" />
              <AppText variant="default" className="mx-4 text-gray-500">
                Or continue with
              </AppText>
              <View className="flex-1 h-px bg-gray-300" />
            </View>

            {/* Google Button */}
            <Button
              variant="secondary"
              size="lg"
              className="w-full"
              leftIcon={
                <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              }
              onPress={handleGoogleAuth}
              disabled={googleLoading || loginMutation.isPending}
              loading={googleLoading}
            >
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </Button>

            {/* Google Error Alert */}
            {googleError && (
              <Alert variant="destructive" className="mt-4">
                <Alert.Description>{googleError}</Alert.Description>
              </Alert>
            )}

            {__DEV__ && (
              <TouchableOpacity
                onPress={() => {
                  setValue("email", "admin@gmail.com");
                  setValue("password", "password123");
                }}
                className="w-full py-2 mt-4 border border-dashed border-primary rounded-full items-center bg-primary/5"
              >
                <AppText weight="medium" className="text-primary text-xs">
                  AUTO-FILL ADMIN (DEV ONLY)
                </AppText>
              </TouchableOpacity>
            )}
          </ScrollView>

          {/* Sign in pinned to the base of the page */}
          <View className="px-4 pt-3 pb-8 bg-white">
            <Button
              size="lg"
              className="w-full"
              onPress={handleSubmit(onSubmit)}
              disabled={loginMutation.isPending || !isValid}
              loading={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
