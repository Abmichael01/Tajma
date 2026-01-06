import { View, ViewProps, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

interface SkeletonProps extends ViewProps {
  className?: string;
  variant?: "default" | "circular" | "text";
}

export default function Skeleton({ 
  className, 
  variant = "default",
  ...props 
}: SkeletonProps) {
  const fadeAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim]);

  const baseStyles = "bg-gray-200";
  
  const variantStyles = {
    default: "rounded",
    circular: "rounded-full",
    text: "rounded h-4",
  };

  return (
    <Animated.View
      className={cn(baseStyles, variantStyles[variant], className)}
      style={[{ opacity: fadeAnim }, props.style]}
      {...props}
    />
  );
}

