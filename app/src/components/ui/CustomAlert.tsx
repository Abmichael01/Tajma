import { View, Modal, TouchableOpacity, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "./AppText";
import Button from "./Button";

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
}

export default function CustomAlert({
  visible,
  title,
  message,
  icon,
  iconColor = "#FF4F18",
  buttons = [{ text: "OK", style: "default" }],
  onDismiss,
}: CustomAlertProps) {
  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable
        className="flex-1 bg-black/50 justify-center items-center px-6"
        onPress={onDismiss}
      >
        <Pressable
          className="bg-white rounded-3xl w-full max-w-sm overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icon Section */}
          {icon && (
            <View className="items-center pt-8 pb-4">
              <View
                className="w-16 h-16 rounded-full items-center justify-center"
                style={{ backgroundColor: `${iconColor}15` }}
              >
                <Ionicons name={icon} size={32} color={iconColor} />
              </View>
            </View>
          )}

          {/* Content Section */}
          <View className={`px-6 ${icon ? "pt-2" : "pt-8"} pb-6`}>
            <AppText
              variant="subheading"
              weight="bold"
              className="text-gray-900 text-center text-xl mb-2"
            >
              {title}
            </AppText>
            {message && (
              <AppText className="text-gray-600 text-center leading-relaxed">
                {message}
              </AppText>
            )}
          </View>

          {/* Buttons Section */}
          <View className="px-6 pb-6 gap-3">
            {buttons.map((button, index) => {
              const isDestructive = button.style === "destructive";
              const isCancel = button.style === "cancel";

              return (
                <TouchableOpacity
                  key={index}
                  onPress={() => handleButtonPress(button)}
                  className={`py-3.5 rounded-full ${
                    isDestructive
                      ? "bg-red-50 border border-red-200"
                      : isCancel
                        ? "bg-gray-100 border border-gray-200"
                        : "bg-primary"
                  }`}
                >
                  <AppText
                    weight="bold"
                    className={`text-center ${
                      isDestructive
                        ? "text-red-600"
                        : isCancel
                          ? "text-gray-700"
                          : "text-white"
                    }`}
                  >
                    {button.text}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
