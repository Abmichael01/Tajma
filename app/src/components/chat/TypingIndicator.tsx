import { useEffect, useRef } from "react";
import { View, Animated } from "react-native";
import Avatar from "@/components/ui/Avatar";

interface TypingIndicatorProps {
  avatarSrc?: string | null;
  userName: string;
}

export default function TypingIndicator({ avatarSrc, userName }: TypingIndicatorProps) {
  // Animated values for the three dots
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Stagger the animation for each dot
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animations = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animations.start();

    return () => {
      animations.stop();
    };
  }, [dot1, dot2, dot3]);

  const dotStyle = (animatedValue: Animated.Value) => ({
    opacity: animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.4, 1],
    }),
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View className="mb-3 flex-row justify-start">
      <View className="flex-row gap-2 max-w-[75%]">
        <Avatar
          src={avatarSrc}
          alt={userName}
          size={36}
        />

        <View className="flex items-start">
          <View className="px-4 py-3 rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm">
            <View className="flex-row gap-1">
              <Animated.View 
                className="w-2 h-2 bg-gray-500 rounded-full"
                style={dotStyle(dot1)}
              />
              <Animated.View 
                className="w-2 h-2 bg-gray-500 rounded-full"
                style={dotStyle(dot2)}
              />
              <Animated.View 
                className="w-2 h-2 bg-gray-500 rounded-full"
                style={dotStyle(dot3)}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
