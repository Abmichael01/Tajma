import { View, ScrollView, TouchableOpacity, Image } from "react-native";
import { Link, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import FormGroup from "@/components/ui/FormGroup";
import Alert from "@/components/ui/Alert";
import { useRegister } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(1, "First name is required")
      .min(2, "First name must be at least 2 characters"),
    lastName: z
      .string()
      .min(1, "Last name is required")
      .min(2, "Last name must be at least 2 characters"),
    username: z
      .string()
      .min(1, "Username is required")
      .min(3, "Username must be at least 3 characters")
      .regex(
        /^[a-zA-Z0-9_]+$/,
        "Username can only contain letters, numbers, and underscores"
      ),
    email: z.string().email("Email is invalid").min(1, "Email is required"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase and number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: "You must agree to the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterScreen() {
  const router = useRouter();
  const registerMutation = useRegister();
  const { handleGoogleAuth, isLoading: googleLoading, error: googleError } = useGoogleAuth();
  const [formError, setFormError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [signupMethod, setSignupMethod] = useState<"google" | "email" | null>(
    null
  );

  const {
    control,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      agreeToTerms: false,
    },
    mode: "onChange",
  });

  const validateStep1 = async () => {
    const isValid = await trigger(["firstName", "lastName", "username"]);
    if (isValid) {
      setCurrentStep(2);
    }
  };

  const onSubmit = async (data: RegisterFormValues) => {
    setFormError(null); // Clear previous errors
    try {
      await registerMutation.mutateAsync({
        email: data.email,
        username: data.username,
        first_name: data.firstName,
        last_name: data.lastName,
        password: data.password,
        password_confirm: data.confirmPassword,
      });
    } catch (error: any) {
      let errorMessage = "Registration failed. Please try again.";
      
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

  const handleSignupMethodSelect = async (method: "google" | "email") => {
    setSignupMethod(method);
    if (method === "google") {
      try {
        await handleGoogleAuth();
        // Success is handled by useGoogleAuth hook (redirects to home)
      } catch (error) {
        // Error is already handled by useGoogleAuth hook
        console.error("Google signup error:", error);
      }
    }
  };

  if (signupMethod === null) {
    return (
      <View className="flex-1 bg-white">
        {/* Back Button - Fixed */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-4 z-20 flex-row items-center"
        >
          <Ionicons name="chevron-back" size={24} color="#0f172b" />
          <AppText weight="medium" className="ml-1">
            Back
          </AppText>
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
              Create your account
            </AppText>
            <AppText variant="default" center className="mb-8">
              Already have an account?{" "}
              <Link href="/(auth)/login" asChild>
                <AppText weight="semibold" className="text-primary">
                  Sign in
                </AppText>
              </Link>
            </AppText>

            {/* Signup Method Selection */}
            <View className="mb-6">
            <Button
              variant="outline"
              size="lg"
              className="w-full mb-4"
              leftIcon={
                <Ionicons name="logo-google" size={20} color="#4285F4" />
              }
              onPress={() => handleSignupMethodSelect("google")}
              disabled={googleLoading || registerMutation.isPending}
              loading={googleLoading}
            >
              {googleLoading ? "Connecting..." : "Continue with Google"}
            </Button>

            {/* Google Error Alert */}
            {googleError && (
              <Alert variant="destructive" className="mb-4">
                <Alert.Description>{googleError}</Alert.Description>
              </Alert>
            )}

            <Button
              variant="default"
              size="lg"
              className="w-full"
              onPress={() => handleSignupMethodSelect("email")}
            >
              Continue with Email
            </Button>
          </View>
        </View>
        </ScrollView>
    </View>
  );
}

  return (
    <View className="flex-1 bg-white">
      {/* Back Button - Fixed */}
      <TouchableOpacity
        onPress={() => {
          if (currentStep === 1) {
            setSignupMethod(null);
          } else {
            setCurrentStep(1);
          }
        }}
        className="absolute top-12 left-4 z-20 flex-row items-center"
      >
        <Ionicons name="chevron-back" size={24} color="#0f172b" />
        <AppText weight="medium" className="ml-1">
          Back
        </AppText>
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

          {/* Step Indicator */}
          <View className="mb-8">
            <View className="flex-row items-center justify-center">
              {/* Step 1 */}
              <View className="items-center">
                <View
                  className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                    currentStep >= 1
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-300"
                  }`}
                >
                  {currentStep > 1 ? (
                    <Ionicons name="checkmark" size={20} color="#fff" />
                  ) : (
                    <AppText
                      weight="semibold"
                      className={currentStep >= 1 ? "text-white" : "text-gray-400"}
                    >
                      1
                    </AppText>
                  )}
                </View>
                <AppText
                  weight="semibold"
                  className={`mt-2 ${currentStep >= 1 ? "text-primary" : "text-gray-400"}`}
                >
                  Basic Info
                </AppText>
              </View>

              {/* Connector Line */}
              <View
                className={`h-0.5 mx-4 flex-1 ${
                  currentStep > 1 ? "bg-primary" : "bg-gray-300"
                }`}
                style={{ marginTop: -20 }}
              />

              {/* Step 2 */}
              <View className="items-center">
                <View
                  className={`w-10 h-10 rounded-full border-2 items-center justify-center ${
                    currentStep >= 2
                      ? "bg-primary border-primary"
                      : "bg-white border-gray-300"
                  }`}
                >
                  <AppText
                    weight="semibold"
                    className={currentStep >= 2 ? "text-white" : "text-gray-400"}
                  >
                    2
                  </AppText>
                </View>
                <AppText
                  weight="semibold"
                  className={`mt-2 ${currentStep >= 2 ? "text-primary" : "text-gray-400"}`}
                >
                  Account
                </AppText>
              </View>
            </View>
          </View>

          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <View>
              <AppText variant="heading" weight="semibold" className="mb-6">
                Basic Information
              </AppText>

              {/* Form Error Alert */}
              {formError && (
                <Alert variant="destructive" className="mb-6">
                  <Alert.Description>{formError}</Alert.Description>
                </Alert>
              )}

            <FormGroup
              label="First Name"
              required
              error={errors.firstName?.message}
            >
              <Controller
                control={control}
                name="firstName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="John"
                    autoCapitalize="words"
                    autoComplete="given-name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.firstName}
                    leftIcon={
                      <Ionicons name="person-outline" size={20} color="#9ca3af" />
                    }
                  />
                )}
              />
            </FormGroup>

            <FormGroup
              label="Last Name"
              required
              error={errors.lastName?.message}
            >
              <Controller
                control={control}
                name="lastName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="Doe"
                    autoCapitalize="words"
                    autoComplete="family-name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.lastName}
                    leftIcon={
                      <Ionicons name="person-outline" size={20} color="#9ca3af" />
                    }
                  />
                )}
              />
            </FormGroup>

            <FormGroup
              label="Username"
              required
              error={errors.username?.message}
              helperText="Only letters, numbers, and underscores allowed"
            >
              <Controller
                control={control}
                name="username"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="johndoe"
                    autoCapitalize="none"
                    autoComplete="username"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.username}
                    leftIcon={
                      <Ionicons name="person-outline" size={20} color="#9ca3af" />
                    }
                  />
                )}
              />
            </FormGroup>

            <Button
              variant="default"
              size="lg"
              className="w-full mt-4"
              onPress={validateStep1}
            >
              Continue
              </Button>
            </View>
          )}

          {/* Step 2: Account Details */}
          {currentStep === 2 && (
            <View>
              <AppText variant="heading" weight="semibold" className="mb-6">
                Account Details
              </AppText>

              {/* Form Error Alert */}
              {formError && (
                <Alert variant="destructive" className="mb-6">
                  <Alert.Description>{formError}</Alert.Description>
                </Alert>
              )}

            <FormGroup label="Email address" required error={errors.email?.message}>
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
                    onChangeText={onChange}
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
                    autoComplete="new-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.password}
                    leftIcon={
                      <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                    }
                  />
                )}
              />
            </FormGroup>

            <FormGroup
              label="Confirm Password"
              required
              error={errors.confirmPassword?.message}
            >
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    placeholder="••••••••"
                    secureTextEntry
                    showPasswordToggle
                    autoCapitalize="none"
                    autoComplete="new-password"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={!!errors.confirmPassword}
                    leftIcon={
                      <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
                    }
                  />
                )}
              />
            </FormGroup>

            <FormGroup error={errors.agreeToTerms?.message}>
              <Controller
                control={control}
                name="agreeToTerms"
                render={({ field: { onChange, value } }) => (
                  <TouchableOpacity
                    className="flex-row items-start"
                    onPress={() => onChange(!value)}
                  >
                    <View
                      className={`w-5 h-5 border-2 rounded mr-3 mt-0.5 items-center justify-center ${
                        value ? "bg-primary border-primary" : "border-gray-300"
                      }`}
                    >
                      {value && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      )}
                    </View>
                    <View className="flex-1">
                      <AppText variant="default" className="text-gray-700">
                        I agree to the{" "}
                        <AppText weight="semibold" className="text-primary">
                          Terms and Conditions
                        </AppText>{" "}
                        and{" "}
                        <AppText weight="semibold" className="text-primary">
                          Privacy Policy
                        </AppText>
                      </AppText>
                    </View>
                  </TouchableOpacity>
                )}
              />
            </FormGroup>

            <Button
              variant="default"
              size="lg"
              className="w-full mt-4"
              onPress={handleSubmit(onSubmit)}
              disabled={registerMutation.isPending}
              loading={registerMutation.isPending}
            >
              {registerMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
