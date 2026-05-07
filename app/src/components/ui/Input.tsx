import { TextInput, TextInputProps, View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import { useState } from "react";

interface InputProps extends TextInputProps {
  className?: string;
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  multiline?: boolean;
}

export default function Input({
  className,
  error,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  secureTextEntry,
  multiline,
  ...props
}: InputProps & { multiline?: boolean }) { // Explicitly add multiline to props destructuring
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry || showPasswordToggle;

  return (
    <View className="relative w-full">
      {leftIcon && (
        <View className="absolute left-4 top-0 bottom-0 z-10 justify-center items-center pointer-events-none">
          {leftIcon}
        </View>
      )}
      <TextInput
        className={cn(
          "px-5 py-4 w-full bg-gray-50 border text-gray-900 text-base",
          multiline ? "rounded-2xl" : "rounded-full", // Full rounded for single line
          leftIcon ? "pl-12" : "",
          (rightIcon || secureTextEntry) ? "pr-12" : "",
          error ? "border-red-500" : "border-gray-200 focus:border-primary",
          "disabled:opacity-50",
          className
        )}
        secureTextEntry={secureTextEntry && !isPasswordVisible}
        style={{
          fontFamily: "WorkSans-Regular",
        }}
        placeholderTextColor="#9ca3af"
        multiline={multiline}
        {...props}
      />
      {(rightIcon || secureTextEntry) && (
        <View
          style={{
            position: "absolute",
            right: 16,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          {secureTextEntry ? (
            <Pressable
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={({ pressed }) => [{ padding: 4, opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={20}
                color="#9ca3af"
              />
            </Pressable>
          ) : (
            rightIcon
          )}
        </View>
      )}
    </View>
  );
}

