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
}

export default function Input({
  className,
  error,
  leftIcon,
  rightIcon,
  showPasswordToggle = false,
  secureTextEntry,
  ...props
}: InputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = secureTextEntry || showPasswordToggle;

  return (
    <View className="relative">
      {leftIcon && (
        <View
          style={{
            position: "absolute",
            left: 16,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
          pointerEvents="none"
        >
          {leftIcon}
        </View>
      )}
      <TextInput
        className={cn(
          "px-8 py-4 w-full min-w-0 bg-transparent border text-lg",
          props.multiline ? "rounded-xl" : "rounded-full",
          leftIcon ? "pl-12" : "",
          (rightIcon || isPassword) ? "pr-12" : "",
          error ? "border-destructive" : "border-input",
          "disabled:opacity-50",
          className
        )}
        secureTextEntry={isPassword && !isPasswordVisible}
        style={{
          fontFamily: "WorkSans-Regular",
        }}
        placeholderTextColor="#9ca3af"
        {...props}
      />
      {(rightIcon || isPassword) && (
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
          {isPassword ? (
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

