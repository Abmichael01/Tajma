import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    interpolate,
    runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface SwipeableMessageProps {
    children: React.ReactNode;
    onSwipe: () => void;
    isMe: boolean;
}

const SWIPE_THRESHOLD = 70;

export default function SwipeableMessage({ children, onSwipe }: SwipeableMessageProps) {
    const translateX = useSharedValue(0);
    const hapticFired = useSharedValue(false);

    function triggerHaptic() {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    function triggerSwipe() {
        onSwipe();
    }

    const pan = Gesture.Pan()
        .activeOffsetX(15)             // Only activate after 15px rightward drag (clear intent)
        .failOffsetY([-20, 20])        // Generous vertical slack so diagonals still work
        .failOffsetX(-15)              // Fail on leftward movement
        .onUpdate((e) => {
            'worklet';
            translateX.value = interpolate(
                e.translationX, [0, 150], [0, 90], 'clamp'
            );

            // Fire haptic once when crossing threshold
            if (translateX.value >= 40 && !hapticFired.value) {
                hapticFired.value = true;
                runOnJS(triggerHaptic)();
            }
        })
        .onEnd(() => {
            'worklet';
            if (translateX.value >= SWIPE_THRESHOLD) {
                runOnJS(triggerSwipe)();
            }
            translateX.value = withTiming(0, { duration: 200 });
            hapticFired.value = false;
        });

    const rowStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    const iconStyle = useAnimatedStyle(() => {
        const clamp = Math.min(translateX.value / SWIPE_THRESHOLD, 1);
        return {
            opacity: interpolate(clamp, [0, 0.3, 1], [0, 0.5, 1]),
            transform: [
                { scale: interpolate(clamp, [0, 1], [0.5, 1.15]) },
            ],
        };
    });

    return (
        <View style={{ position: 'relative' }}>
            {/* Reply icon — always on left (rightward swipe) */}
            <Animated.View
                style={[{
                    position: 'absolute',
                    left: 10,
                    top: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    zIndex: 0,
                }, iconStyle]}
                pointerEvents="none"
            >
                <View style={{ backgroundColor: 'rgba(0,0,0,0.08)', padding: 8, borderRadius: 20 }}>
                    <Ionicons name="arrow-undo-outline" size={20} color="#FF4F18" />
                </View>
            </Animated.View>

            <GestureDetector gesture={pan}>
                <Animated.View style={rowStyle}>
                    {children}
                </Animated.View>
            </GestureDetector>
        </View>
    );
}
