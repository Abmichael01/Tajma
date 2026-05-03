import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import AppText from "@/components/ui/AppText";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CustomAlert from "@/components/ui/CustomAlert";
import { useAlert } from "@/hooks/useAlert";
import { useChangePassword } from "@/hooks/useAuth";

export default function ChangePasswordForm() {
  const changePasswordMutation = useChangePassword();
  const { alertConfig, showAlert, hideAlert } = useAlert();

  const [formData, setFormData] = useState({
    old_password: "",
    new_password: "",
    new_password_confirm: "",
  });

  const handleSubmit = () => {
    if (formData.new_password !== formData.new_password_confirm) {
      showAlert({
        title: "Error",
        message: "New passwords do not match",
        icon: "alert-circle-outline",
        iconColor: "#ef4444",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    if (formData.new_password.length < 8) {
      showAlert({
        title: "Error",
        message: "Password must be at least 8 characters long",
        icon: "alert-circle-outline",
        iconColor: "#ef4444",
        buttons: [{ text: "OK" }],
      });
      return;
    }

    changePasswordMutation.mutate(formData, {
      onSuccess: () => {
        showAlert({
          title: "Success",
          message: "Password changed successfully",
          icon: "checkmark-circle-outline",
          iconColor: "#10b981",
          buttons: [{ text: "Great!" }],
        });
        setFormData({
          old_password: "",
          new_password: "",
          new_password_confirm: "",
        });
      },
      onError: (error: any) => {
        const message =
          error.response?.data?.message ||
          "Failed to change password. Please check your current password.";
        showAlert({
          title: "Error",
          message: message,
          icon: "alert-circle-outline",
          iconColor: "#ef4444",
          buttons: [{ text: "Try Again" }],
        });
      },
    });
  };

  return (
    <View className="flex-1">
      <ScrollView
        className="flex-1 px-6 pt-8"
        showsVerticalScrollIndicator={false}
      >
        <AppText
          weight="bold"
          className="text-gray-400 text-[11px] uppercase tracking-widest mb-6 ml-2"
        >
          Security Settings
        </AppText>

        <View className="bg-white border border-gray-100 rounded-[32px] p-6 mb-6 shadow-sm">
          <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">
            Current Password
          </AppText>
          <Input
            value={formData.old_password}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, old_password: text }))
            }
            placeholder="••••••••"
            secureTextEntry
            className="mb-4"
          />

          <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">
            New Password
          </AppText>
          <Input
            value={formData.new_password}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, new_password: text }))
            }
            placeholder="••••••••"
            secureTextEntry
            className="mb-4"
          />

          <AppText weight="semibold" className="text-gray-700 mb-2 ml-1">
            Confirm New Password
          </AppText>
          <Input
            value={formData.new_password_confirm}
            onChangeText={(text) =>
              setFormData((prev) => ({ ...prev, new_password_confirm: text }))
            }
            placeholder="••••••••"
            secureTextEntry
            className="mb-4"
          />
        </View>

        <View className="bg-blue-50 p-4 rounded-2xl mb-8 border border-blue-100">
          <AppText className="text-blue-700 text-xs leading-5">
            Password should be at least 8 characters long and include a mix of
            uppercase, lowercase, numbers, and symbols for better security.
          </AppText>
        </View>

        <Button
          onPress={handleSubmit}
          loading={changePasswordMutation.isPending}
          className="py-4 rounded-full shadow-xl"
        >
          <AppText weight="bold" className="text-white text-lg">
            Update Password
          </AppText>
        </Button>

        <View className="h-20" />
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        icon={alertConfig.icon}
        iconColor={alertConfig.iconColor}
        buttons={alertConfig.buttons}
        onDismiss={hideAlert}
      />
    </View>
  );
}
