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
import { Link } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BackButton from "@/components/ui/BackButton";
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
  const registerMutation = useRegister();
  const {
    handleGoogleAuth,
    isLoading: googleLoading,
    error: googleError,
  } = useGoogleAuth();

  const [signupMethod, setSignupMethod] = useState<"google" | "email" | null>(
    null
  );
  const [step, setStep] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    trigger,
    watch,
    formState: { errors, isValid },
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

  const goBack = () => {
    setFormError(null);
    if (step === 2) {
      setStep(1);
    } else {
      // Don't setSignupMethod(null) here if you want to keep the form data visible
      // but if the user wants to go back to picker, we can keep it.
      setSignupMethod(null);
    }
  };

  const goToStep2 = async () => {
    setFormError(null);
    const ok = await trigger(["firstName", "lastName", "username"]);
    if (ok) setStep(2);
  };

  // Validation for each step
  const watchedFields = watch();
  const isStep1Valid =
    watchedFields.firstName?.length >= 2 &&
    watchedFields.lastName?.length >= 2 &&
    watchedFields.username?.length >= 3;

  const isStep2Valid =
    isValid && // Overall schema valid (email, password matching, terms)
    watchedFields.agreeToTerms;

  const onSubmit = async (data: RegisterFormValues) => {
    setFormError(null);
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
      if (
        error?.code === "ERR_NETWORK" ||
        error?.message?.includes("Network Error")
      ) {
        errorMessage =
          "Cannot connect to server. Please check your network connection and ensure the backend server is running.";
      } else if (error?.response?.data) {
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

  // ── Method picker ──────────────────────────────────────────
  if (signupMethod === null) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar style="auto" />
        <BackButton className="top-12 left-4" />

        {/* Top: heading */}
        <View className="px-6 pt-24">
          <View className="items-center mb-6">
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
            Create your account
          </AppText>
          <AppText center className="text-gray-500">
            Already have an account?{" "}
            <Link href="/(auth)/login" asChild>
              <AppText weight="semibold" className="text-primary">
                Sign in
              </AppText>
            </Link>
          </AppText>
        </View>

        {/* Middle: illustration fills the available space, base fades up */}
        <View className="flex-1 items-center justify-center px-6 relative">
          <Image
            source={require("@/assets/images/signup.png")}
            className="w-full h-full"
            resizeMode="contain"
          />
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
            locations={[0, 1]}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: 120,
            }}
          />
        </View>

        {/* Base: stacked action buttons + any error */}
        <View className="px-4 pt-3 pb-8 bg-white">
          {googleError && (
            <Alert variant="destructive" className="mb-3">
              <Alert.Description>{googleError}</Alert.Description>
            </Alert>
          )}

          <Button
            size="lg"
            className="w-full mb-3"
            onPress={() => setSignupMethod("email")}
          >
            Continue with Email
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            leftIcon={
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
            }
            onPress={async () => {
              try {
                await handleGoogleAuth();
              } catch (e) {
                console.error("Google signup error:", e);
              }
            }}
            disabled={googleLoading}
            loading={googleLoading}
          >
            {googleLoading ? "Connecting..." : "Continue with Google"}
          </Button>
        </View>
      </View>
    );
  }

  // ── 2-step grouped wizard ─────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-white">
          <StatusBar style="auto" />
          <BackButton className="top-12 left-4" onPress={goBack} />

          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: 96,
              paddingBottom: 16,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step 1 Fields */}
            <View style={{ display: step === 1 ? "flex" : "none" }}>
              <AppText
                variant="heading"
                weight="semibold"
                className="mb-2"
              >
                Tell us about you
              </AppText>
              <AppText className="mb-8 text-gray-500 leading-6">
                We just need a few quick details to set up your profile.
              </AppText>

              {formError && step === 1 && (
                <Alert variant="destructive" className="mb-6">
                  <Alert.Description>{formError}</Alert.Description>
                </Alert>
              )}

              <FormGroup
                label="First name"
                required
                error={errors.firstName?.message}
              >
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder="John"
                      autoCapitalize="words"
                      autoComplete="given-name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.firstName}
                      leftIcon={
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color="#9ca3af"
                        />
                      }
                    />
                  )}
                />
              </FormGroup>

              <FormGroup
                label="Last name"
                required
                error={errors.lastName?.message}
              >
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder="Doe"
                      autoCapitalize="words"
                      autoComplete="family-name"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.lastName}
                      leftIcon={
                        <Ionicons
                          name="person-outline"
                          size={20}
                          color="#9ca3af"
                        />
                      }
                    />
                  )}
                />
              </FormGroup>

              <FormGroup
                label="Username"
                required
                error={errors.username?.message}
                helperText="Letters, numbers and underscores only."
              >
                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder="johndoe"
                      autoCapitalize="none"
                      autoComplete="username"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={!!errors.username}
                      leftIcon={
                        <Ionicons
                          name="at-outline"
                          size={20}
                          color="#9ca3af"
                        />
                      }
                    />
                  )}
                />
              </FormGroup>
            </View>

            {/* Step 2 Fields */}
            <View style={{ display: step === 2 ? "flex" : "none" }}>
              <AppText
                variant="heading"
                weight="semibold"
                className="mb-2"
              >
                Set up your account
              </AppText>
              <AppText className="mb-8 text-gray-500 leading-6">
                This is what you'll use to sign in.
              </AppText>

              {formError && step === 2 && (
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
                      onChangeText={onChange}
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
                helperText="At least 8 chars with upper, lower and a number."
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
                      autoComplete="new-password"
                      value={value}
                      onChangeText={onChange}
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

              <FormGroup
                label="Confirm password"
                required
                error={errors.confirmPassword?.message}
              >
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
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
                          value
                            ? "bg-primary border-primary"
                            : "border-gray-300"
                        }`}
                      >
                        {value && (
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#fff"
                          />
                        )}
                      </View>
                      <View className="flex-1">
                        <AppText className="text-gray-700">
                          I agree to the{" "}
                          <AppText
                            weight="semibold"
                            className="text-primary"
                          >
                            Terms and Conditions
                          </AppText>{" "}
                          and{" "}
                          <AppText
                            weight="semibold"
                            className="text-primary"
                          >
                            Privacy Policy
                          </AppText>
                        </AppText>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              </FormGroup>
            </View>
          </ScrollView>

          <View className="px-4 pt-3 pb-8 bg-white">
            <Button
              size="lg"
              className="w-full"
              onPress={step === 1 ? goToStep2 : handleSubmit(onSubmit)}
              disabled={
                registerMutation.isPending || (step === 1 ? !isStep1Valid : !isStep2Valid)
              }
              loading={registerMutation.isPending}
            >
              {step === 1
                ? "Continue"
                : registerMutation.isPending
                  ? "Creating account..."
                  : "Create account"}
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
