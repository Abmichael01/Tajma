import React from "react";
import { View, ViewProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cn } from "@/utils/cn";
import AppText from "./AppText";

interface AlertProps extends ViewProps {
  variant?: "default" | "destructive" | "warning" | "info";
  className?: string;
  children: React.ReactNode;
}

interface AlertTitleProps {
  className?: string;
  children: React.ReactNode;
}

interface AlertDescriptionProps {
  className?: string;
  children: React.ReactNode;
}

const Alert = ({
  variant = "default",
  className,
  children,
  ...props
}: AlertProps) => {
  const variantStyles = {
    default: "bg-blue-50 border-blue-200",
    destructive: "bg-red-50 border-red-200",
    warning: "bg-yellow-50 border-yellow-200",
    info: "bg-blue-50 border-blue-200",
  };

  const iconColors = {
    default: "#3b82f6", // blue-500
    destructive: "#ef4444", // red-500
    warning: "#f59e0b", // yellow-500
    info: "#3b82f6", // blue-500
  };

  return (
    <View
      className={cn(
        "rounded-lg border p-4 flex-row items-start",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === "destructive" && (
        <View className="mr-3">
          <Ionicons
            name="alert-circle"
            size={20}
            color={iconColors[variant]}
          />
        </View>
      )}
      {variant === "warning" && (
        <View className="mr-3">
          <Ionicons
            name="warning"
            size={20}
            color={iconColors[variant]}
          />
        </View>
      )}
      {(variant === "default" || variant === "info") && (
        <View className="mr-3">
          <Ionicons
            name="information-circle"
            size={20}
            color={iconColors[variant]}
          />
        </View>
      )}
      <View className="flex-1">{children}</View>
    </View>
  );
};

const AlertTitle = ({ className, children }: AlertTitleProps) => {
  return (
    <AppText weight="semibold" className={cn("mb-1", className)}>
      {children}
    </AppText>
  );
};

const AlertDescription = ({ className, children }: AlertDescriptionProps) => {
  return (
    <AppText
      variant="default"
      className={cn("text-sm text-gray-800", className)}
    >
      {children}
    </AppText>
  );
};

Alert.Title = AlertTitle;
Alert.Description = AlertDescription;

export default Alert;
