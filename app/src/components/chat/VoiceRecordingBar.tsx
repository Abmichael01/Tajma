import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions, Pressable } from 'react-native';
import Animated, {
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue,
    useDerivedValue,
    runOnUI,
    interpolate,
    Extrapolate,
    SharedValue,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';
import { useAudioRecorderState, AudioRecorder } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const SAMPLES_COUNT = 32;

interface VoiceRecordingBarProps {
    recorder: AudioRecorder;
    onCancel: () => void;
    onLock: () => void;
    isLocked: boolean;
    isPaused?: boolean;
    onTogglePause?: () => void;
    onSend?: () => void;
}

// Sub-component for individual bars to maximize performance
const WaveBar = React.memo(({ index, samplesBuffer }: { index: number, samplesBuffer: SharedValue<number[]> }) => {
    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: samplesBuffer.value[index] || 4,
        };
    });

    return (
        <Animated.View
            style={[
                {
                    width: 3,
                    backgroundColor: '#FF4F18',
                    borderRadius: 1.5,
                },
                animatedStyle
            ]}
        />
    );
});

// Shimmering "Slide to cancel" component
const ShimmerText = React.memo(({ isLocked }: { isLocked: boolean }) => {
    const shim = useSharedValue(-100);

    useEffect(() => {
        if (!isLocked) {
            shim.value = withRepeat(
                withTiming(150, { duration: 1500 }),
                -1,
                false
            );
        }
    }, [isLocked]);

    const animatedStyle = useAnimatedStyle(() => {
        const translateX = interpolate(shim.value, [-100, 150], [-100, 150]);
        return {
            transform: [{ translateX }],
        };
    });

    if (isLocked) return null;

    return (
        <View style={styles.slideContainer}>
            <View style={{ flexDirection: 'row', alignItems: 'center', overflow: 'hidden' }}>
                <AppText className="text-gray-400 text-xs mr-1">
                    Slide to cancel
                </AppText>
                <Animated.View style={[styles.shimmer, animatedStyle]}>
                    <LinearGradient
                        colors={['transparent', 'rgba(255,255,255,0.8)', 'transparent']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={{ flex: 1 }}
                    />
                </Animated.View>
            </View>
            <Ionicons name="chevron-back" size={16} color="#9ca3af" className="ml-1" />
        </View>
    );
});

const VoiceRecordingBar = ({
    recorder,
    onCancel,
    onLock,
    isLocked,
    isPaused,
    onTogglePause,
    onSend,
}: VoiceRecordingBarProps) => {
    // 1. High-frequency state polling (isolated to this component)
    const recorderState = useAudioRecorderState(recorder, 80); // Even faster for responsiveness

    // 2. Multi-thread synced waveform buffer
    const samplesBuffer = useSharedValue<number[]>(new Array(SAMPLES_COUNT).fill(4));

    // 3. UI Thread calculations
    const getBarHeight = (db: number) => {
        'worklet';
        let normalized = (db + 65) / 60;
        if (db > 0) normalized = Math.min(1, db);
        return Math.max(4, Math.min(36, (normalized || 0) * 36));
    };

    // Update buffer when metering changes
    useEffect(() => {
        if (recorderState.metering !== undefined && !isPaused) {
            const newHeight = getBarHeight(recorderState.metering);
            // Push to buffer on UI thread if possible, or just update value
            const newBuffer = [...samplesBuffer.value.slice(1), newHeight];
            samplesBuffer.value = newBuffer;
        }
    }, [recorderState.metering, isPaused]);

    // Entrance and Pulse animations
    const containerOpacity = useSharedValue(0);
    const pulseScale = useSharedValue(1);

    useEffect(() => {
        containerOpacity.value = withTiming(1, { duration: 250 });
        if (!isPaused) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.2, { duration: 400 }),
                    withTiming(1, { duration: 400 })
                ),
                -1,
                true
            );
        } else {
            pulseScale.value = withTiming(1);
        }
    }, [isPaused]);

    const formatDuration = (ms: number) => {
        const totalSec = Math.floor((ms || 0) / 1000);
        const mins = Math.floor(totalSec / 60);
        const secs = totalSec % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const pulseStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <View style={styles.content}>
                {/* Visual Feedback: Red Pulse */}
                {!isPaused && (
                    <Animated.View style={[styles.indicator, pulseStyle]}>
                        <View style={styles.redDot} />
                    </Animated.View>
                )}

                {/* Accuracy Timer */}
                <AppText weight="bold" className={`text-lg ml-2 min-w-[50px] ${isPaused ? 'text-gray-400' : 'text-gray-800'}`}>
                    {formatDuration(recorderState.durationMillis)}
                </AppText>

                {/* High-Performance Waveform */}
                <View className="flex-1 flex-row items-center justify-start gap-[4px] px-4 overflow-hidden h-10">
                    {Array.from({ length: SAMPLES_COUNT }).map((_, i) => (
                        <WaveBar key={i} index={i} samplesBuffer={samplesBuffer} />
                    ))}
                </View>

                {/* Interaction Controls */}
                <View className="flex-row items-center gap-2 pr-1">
                    {isLocked ? (
                        <View className="flex-row items-center gap-1">
                            <Pressable onPress={onCancel} className="p-2 hit-slop-10">
                                <Ionicons name="trash-outline" size={24} color="#ef4444" />
                            </Pressable>
                            <Pressable onPress={onTogglePause} className="p-2 hit-slop-10">
                                {isPaused ? (
                                    <View className="w-9 h-9 rounded-full bg-[#FF4F18] items-center justify-center">
                                        <Ionicons name="mic" size={20} color="white" />
                                    </View>
                                ) : (
                                    <Ionicons name="pause" size={26} color="#FF4F18" />
                                )}
                            </Pressable>
                            <Pressable onPress={onSend} className="p-2 bg-[#FF4F18] rounded-full w-9 h-9 items-center justify-center hit-slop-10">
                                <Ionicons name="send" size={18} color="white" />
                            </Pressable>
                        </View>
                    ) : (
                        <ShimmerText isLocked={isLocked} />
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        backgroundColor: '#F9F9F9',
        justifyContent: 'center',
        paddingHorizontal: 16,
        zIndex: 1000,
        elevation: 10,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    indicator: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 79, 24, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    redDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF4F18',
    },
    slideContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        position: 'relative',
        width: 120,
    },
    shimmer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 40,
        opacity: 0.5,
    }
});

export default React.memo(VoiceRecordingBar);
