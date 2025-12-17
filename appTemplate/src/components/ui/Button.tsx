import { TouchableOpacity, View, ActivityIndicator, TouchableOpacityProps } from "react-native";
import { cn } from "@/utils/cn";
import AppText from "./AppText";
import { ReactNode } from "react";

interface ButtonProps extends Omit<TouchableOpacityProps, "children"> {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export default function Button({
  children,
  onPress,
  variant = "default",
  size = "md",
  disabled = false,
  loading = false,
  className,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  const baseStyles = "rounded-full items-center justify-center flex-row";
  
  const variantStyles = {
    default: "bg-primary active:bg-primary-700",
    outline: "bg-transparent border border-primary active:bg-primary-50",
    ghost: "bg-transparent active:bg-muted",
    destructive: "bg-destructive active:bg-destructive/90",
    secondary: "bg-secondary active:bg-secondary-700",
  };

  const sizeStyles = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4",
  };

  const textVariantStyles = {
    default: "text-primary-foreground",
    outline: "text-primary",
    ghost: "text-foreground",
    destructive: "text-destructive-foreground",
    secondary: "text-secondary-foreground",
  };

  const textSizeStyles = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        (disabled || loading) && "opacity-50",
        className
      )}
      {...props}
    >
      {loading && (
        <View className="mr-2">
          <ActivityIndicator 
            size="small" 
            color={
              variant === "default" || variant === "destructive" || variant === "secondary"
                ? "#FFFFFF" 
                : variant === "outline"
                ? "#1a1f3a"
                : "#374151"
            } 
          />
        </View>
      )}
      {!loading && leftIcon && (
        <View className="mr-2">
          {leftIcon}
        </View>
      )}
      <AppText
        variant="default"
        weight="semibold"
        className={cn(
          textVariantStyles[variant],
          textSizeStyles[size]
        )}
      >
        {children}
      </AppText>
      {!loading && rightIcon && (
        <View className="ml-2">
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
}

