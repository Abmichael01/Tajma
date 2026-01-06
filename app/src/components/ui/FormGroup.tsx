import { View, ViewProps, KeyboardAvoidingView, Platform } from "react-native";
import { cn } from "@/utils/cn";
import AppText from "./AppText";

interface FormGroupProps extends ViewProps {
  className?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
}

export default function FormGroup({
  className,
  label,
  required = false,
  error,
  helperText,
  children,
  ...props
}: FormGroupProps) {
  return (
    <View className={cn("mb-5", className)} {...props}>
      {label && (
        <AppText variant="default" weight="semibold" className="mb-1">
          {label}
          {required && <AppText className="text-destructive"> *</AppText>}
        </AppText>
      )}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 10}
      >
        {children}
      </KeyboardAvoidingView>
      {error && (
        <AppText variant="default" className="text-destructive mt-1">
          {error}
        </AppText>
      )}
      {helperText && !error && (
        <AppText variant="default" className="text-gray-500 mt-1">
          {helperText}
        </AppText>
      )}
    </View>
  );
}

