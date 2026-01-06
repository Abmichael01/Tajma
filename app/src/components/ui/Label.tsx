import { Text, TextProps } from "react-native";
import { cn } from "@/utils/cn";
import AppText from "./AppText";

interface LabelProps extends TextProps {
  className?: string;
  required?: boolean;
  error?: boolean;
}

export default function Label({
  children,
  className,
  required = false,
  error = false,
  ...props
}: LabelProps) {
  return (
    <AppText
      variant="default"
      weight="semibold"
      className={cn(
        "mb-1",
        error && "text-destructive",
        className
      )}
      {...props}
    >
      {children}
      {required && <Text className="text-destructive"> *</Text>}
    </AppText>
  );
}

