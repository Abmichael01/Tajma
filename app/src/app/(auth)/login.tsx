import { View, ScrollView, TouchableOpacity, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
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
  const { handleGoogleAuth, isLoading: googleLoading, error: googleError } = useGoogleAuth();
  const [formError, setFormError] = useState<string | null>(null);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
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
      
      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        errorMessage = "Cannot connect to server. Please check your network connection and ensure the backend server is running.";
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
    <View className="flex-1 bg-white">
      {/* Back Button - Fixed */}
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute top-12 left-4 z-20 flex-row items-center"
      >
        <Ionicons name="chevron-back" size={24} color="#0f172b" />
        <AppText weight="medium" className="ml-1">Back</AppText>
      </TouchableOpacity>

      {/* Form Content */}
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16, paddingTop: 80, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Logo */}
          <View className="items-center mb-8">
            <Image
              source={require("@/assets/images/logo.jpg")}
              className="w-32 h-10"
              resizeMode="contain"
            />
          </View>

          <AppText variant="heading" weight="semibold" className="mb-2 text-center">
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

          {/* Google Button */}
          <Button
            variant="outline"
            size="lg"
            className="w-full mb-6"
            leftIcon={<Ionicons name="logo-google" size={20} color="#4285F4" />}
            onPress={handleGoogleAuth}
            disabled={googleLoading || loginMutation.isPending}
            loading={googleLoading}
          >
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>

          {/* Google Error Alert */}
          {googleError && (
            <Alert variant="destructive" className="mb-6">
              <Alert.Description>{googleError}</Alert.Description>
            </Alert>
          )}

          {/* Divider */}
          <View className="flex-row items-center mb-6">
            <View className="flex-1 h-px bg-gray-300" />
            <AppText variant="default" className="mx-4 text-gray-500">
              Or continue with email
            </AppText>
            <View className="flex-1 h-px bg-gray-300" />
          </View>

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
                    <Ionicons name="mail-outline" size={20} color="#9ca3af" />
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
                    <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                  }
                />
              )}
            />
          </FormGroup>

          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity
              className="flex-row items-center"
              onPress={() => {
                // TODO: Navigate to forgot password
                console.log("Forgot password");
              }}
            >
              <AppText variant="default" className="text-primary">
                Forgot password?
              </AppText>
            </TouchableOpacity>
          </View>

          <Button
            variant="default"
            size="lg"
            className="w-full"
            onPress={handleSubmit(onSubmit)}
            disabled={loginMutation.isPending}
            loading={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}
