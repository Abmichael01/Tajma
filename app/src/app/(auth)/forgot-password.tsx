import {
  View,
  Image,
  ScrollView,
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
import { useTranslation } from "react-i18next";

const getForgotPasswordSchema = (t: any) =>
  z.object({
    email: z
      .string()
      .email(t("auth.validation.emailInvalid"))
      .min(1, t("auth.validation.emailRequired")),
  });

type ForgotPasswordValues = z.infer<ReturnType<typeof getForgotPasswordSchema>>;

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(getForgotPasswordSchema(t)),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      // TODO: wire to backend password-reset endpoint when available.
      // Intentionally optimistic: always show the success screen so we don't
      // leak which emails are registered.
      await new Promise((resolve) => setTimeout(resolve, 600));
      setSubmittedEmail(data.email);
      setSubmitted(true);
    } catch (error: any) {
      setFormError(error?.message ?? t("auth.resetSendFailure"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar style="auto" />
        <BackButton className="top-12 left-4" />

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            paddingHorizontal: 24,
            paddingTop: 80,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center mb-6">
              <Ionicons name="mail-outline" size={36} color="#FF4F18" />
            </View>
            <AppText
              variant="heading"
              weight="semibold"
              className="text-center mb-3"
            >
              {t("auth.checkEmail")}
            </AppText>
            <AppText className="text-center text-gray-500 leading-6">
              {t("auth.resetInstructionsSent")}
              {"\n"}
              <AppText weight="semibold" className="text-gray-900">
                {submittedEmail}
              </AppText>
            </AppText>
          </View>
        </ScrollView>

        <View className="px-4 pt-3 pb-8 bg-white">
          <Button
            size="lg"
            className="w-full"
            onPress={() => router.replace("/(auth)/login")}
          >
            {t("auth.backToSignIn")}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View className="flex-1 bg-white">
          <StatusBar style="auto" />
          <BackButton className="top-12 left-4" />

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
              {t("auth.forgotPasswordTitle")}
            </AppText>
            <AppText center className="mb-8 text-gray-500 leading-6">
              {t("auth.forgotPasswordDesc")}
            </AppText>

            {formError && (
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
                    placeholder={t("auth.emailPlaceholder")}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoFocus
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

            <View className="items-center mt-2">
              <AppText className="text-gray-500">
                {t("auth.rememberedIt")}{" "}
                <Link href="/(auth)/login" asChild>
                  <AppText weight="semibold" className="text-primary">
                    {t("auth.signIn")}
                  </AppText>
                </Link>
              </AppText>
            </View>
          </ScrollView>

          <View className="px-4 pt-3 pb-8 bg-white">
            <Button
              size="lg"
              className="w-full"
              onPress={handleSubmit(onSubmit)}
              disabled={isSubmitting}
              loading={isSubmitting}
            >
              {isSubmitting ? t("auth.sending") : t("auth.sendResetLink")}
            </Button>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}
