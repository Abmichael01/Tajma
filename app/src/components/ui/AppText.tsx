import { Text as RNText, TextProps as RNTextProps } from "react-native";
import { cn } from "@/utils/cn";

interface AppTextProps extends RNTextProps {
  variant?: "default" | "heading" | "subheading" | "caption" | "label";
  weight?: "normal" | "medium" | "semibold" | "bold";
  center?: boolean;
  className?: string;
}

export default function AppText({
  children,
  variant = "default",
  weight = "normal",
  center = false,
  className,
  style,
  ...props
}: AppTextProps) {
  const variantStyles = {
    default: "text-lg text-gray-900",
    heading: "text-3xl text-gray-900",
    subheading: "text-xl text-gray-800",
    caption: "text-sm text-gray-500",
    label: "text-sm text-gray-700",
  };

  const weightStyles = {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  };

  const fontFamilyMap = {
    normal: "Quicksand-Regular",
    medium: "Quicksand-Medium",
    semibold: "Quicksand-SemiBold",
    bold: "Quicksand-Bold",
  };

  return (
    <RNText
      className={cn(
        "font-work-sans",
        variantStyles[variant],
        weightStyles[weight],
        center && "text-center",
        className
      )}
      style={[
        { 
          fontFamily: fontFamilyMap[weight],
          fontWeight: "normal" as const, // Use "normal" since weight is in font name
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

