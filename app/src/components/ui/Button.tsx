import { Pressable, View, ActivityIndicator, PressableProps } from "react-native";
import { cn } from "@/utils/cn";
import AppText from "./AppText";

interface ButtonProps extends Omit<PressableProps, "children"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const baseStyles = "flex-row items-center justify-center rounded-full";

  const variantStyles = {
    primary: "bg-primary",
    secondary: "bg-secondary",
    outline: "bg-transparent border-2 border-primary",
    ghost: "bg-transparent",
  };

  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4",
  };

  const textVariantStyles = {
    primary: "text-white",
    secondary: "text-white",
    outline: "text-primary",
    ghost: "text-primary",
  };

  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const disabledStyles = "opacity-50";

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && disabledStyles,
        className
      )}
      style={({ pressed }) => [
        {
          opacity: pressed && !isDisabled ? 0.8 : 1,
        },
      ]}
    >
      <View className="flex-row items-center gap-2">
        {loading && (
          <ActivityIndicator
            size="small"
            color={variant === "outline" || variant === "ghost" ? "#cb234a" : "#fff"}
          />
        )}
        {!loading && leftIcon && leftIcon}
        <AppText
          weight="semibold"
          className={cn(
            textVariantStyles[variant],
            textSizeStyles[size]
          )}
        >
          {children}
        </AppText>
        {!loading && rightIcon && rightIcon}
      </View>
    </Pressable>
  );
}
