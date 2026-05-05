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
import { useTranslation } from "react-i18next";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import BackButton from "@/components/ui/BackButton";
import FormGroup from "@/components/ui/FormGroup";
import Alert from "@/components/ui/Alert";
import { useRegister } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

type RegisterFormValues = z.infer<ReturnType<typeof getRegisterSchema>>;

const getRegisterSchema = (t: any) => z
  .object({
    firstName: z
      .string()
      .min(1, t("auth.validation.firstNameRequired"))
      .min(2, t("auth.validation.firstNameMin")),
    lastName: z
      .string()
      .min(1, t("auth.validation.lastNameRequired"))
      .min(2, t("auth.validation.lastNameMin")),
    username: z
      .string()
      .min(1, t("auth.validation.usernameRequired"))
      .min(3, t("auth.validation.usernameMin"))
      .regex(
        /^[a-zA-Z0-9_]+$/,
        t("auth.validation.usernameRegex")
      ),
    email: z.string().email(t("auth.validation.emailInvalid")).min(1, t("auth.validation.emailRequired")),
    password: z
      .string()
      .min(8, t("auth.validation.passwordMin"))
      .regex(
        /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        t("auth.validation.passwordRegex")
      ),
    confirmPassword: z.string().min(1, t("auth.validation.confirmPasswordRequired")),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: t("auth.validation.agreeToTerms"),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: t("auth.validation.passwordsDoNotMatch"),
    path: ["confirmPassword"],
  });

export default function RegisterScreen() {
  const { t } = useTranslation();
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
    resolver: zodResolver(getRegisterSchema(t)),
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
      let errorMessage = t("auth.failedToCreate", { defaultValue: "Registration failed. Please try again." });
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
            {t("auth.createAccount")}
          </AppText>
          <AppText center className="text-gray-500">
            {t("auth.alreadyHaveAccount")}{" "}
            <Link href="/(auth)/login" asChild>
              <AppText weight="semibold" className="text-primary">
                {t("auth.signIn")}
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
            {t("auth.continueWithEmail")}
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
            {googleLoading ? t("auth.connecting") : t("auth.continueWithGoogle")}
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
                {t("auth.tellUsAboutYou")}
              </AppText>
              <AppText className="mb-8 text-gray-500 leading-6">
                {t("auth.detailsSetupProfile")}
              </AppText>

              {formError && step === 1 && (
                <Alert variant="destructive" className="mb-6">
                  <Alert.Description>{formError}</Alert.Description>
                </Alert>
              )}

              <FormGroup
                label={t("auth.firstName")}
                required
                error={errors.firstName?.message}
              >
                <Controller
                  control={control}
                  name="firstName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder={t("auth.firstNamePlaceholder")}
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
                label={t("auth.lastName")}
                required
                error={errors.lastName?.message}
              >
                <Controller
                  control={control}
                  name="lastName"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder={t("auth.lastNamePlaceholder")}
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
                label={t("auth.username")}
                required
                error={errors.username?.message}
                helperText={t("auth.usernameHelper")}
              >
                <Controller
                  control={control}
                  name="username"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder={t("auth.usernamePlaceholder")}
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
                {t("auth.setupAccount")}
              </AppText>
              <AppText className="mb-8 text-gray-500 leading-6">
                {t("auth.setupAccountDesc")}
              </AppText>

              {formError && step === 2 && (
                <Alert variant="destructive" className="mb-6">
                  <Alert.Description>{formError}</Alert.Description>
                </Alert>
              )}

              <FormGroup
                label={t("auth.emailAddress")}
                required
                error={errors.email?.message}
              >
                <Controller
                  control={control}
                  name="email"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder={t("auth.emailPlaceholder")}
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
                label={t("auth.password")}
                required
                error={errors.password?.message}
                helperText={t("auth.passwordHelper")}
              >
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder={t("auth.passwordPlaceholder")}
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
                label={t("auth.confirmPassword")}
                required
                error={errors.confirmPassword?.message}
              >
                <Controller
                  control={control}
                  name="confirmPassword"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      className="py-4 text-lg"
                      placeholder={t("auth.passwordPlaceholder")}
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
                          {t("auth.agreeTo")}{" "}
                          <AppText
                            weight="semibold"
                            className="text-primary"
                          >
                            {t("auth.termsConditions")}
                          </AppText>{" "}
                          {t("auth.and")}{" "}
                          <AppText
                            weight="semibold"
                            className="text-primary"
                          >
                            {t("auth.privacyPolicy")}
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
                ? t("common.continue")
                : registerMutation.isPending
                  ? t("auth.creatingAccount")
                  : t("auth.register")}
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
