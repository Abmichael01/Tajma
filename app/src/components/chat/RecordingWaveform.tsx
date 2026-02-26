import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Canvas, Path, Skia, Line, vec } from '@shopify/react-native-skia';
import { SharedValue, useDerivedValue, withSpring, withTiming, useSharedValue } from 'react-native-reanimated';

interface RecordingWaveformProps {
    metering: SharedValue<number>; // Amplitude from -160 to 0 (dB)
    isRecording: boolean;
    width?: number;
    height?: number;
}

const BAR_COUNT = 30;
const BAR_GAP = 3;
const MIN_BAR_HEIGHT = 4;

export const RecordingWaveform = ({ metering, isRecording, width = 150, height = 40 }: RecordingWaveformProps) => {
    // Normalize metering to 0-1 range
    // -60dB is usually silence, 0dB is max
    const normalizedMetering = useDerivedValue(() => {
        if (!isRecording) return 0;
        const value = Math.max(0, (metering.value + 60) / 60);
        return withSpring(value, { damping: 15, stiffness: 100 });
    });

    // Maintain an array of bar heights in a shared value array (conceptually)
    // To avoid 60fps JS updates, we transform the metering into a set of paths in useDerivedValue
    const bars = useMemo(() => Array.from({ length: BAR_COUNT }, (_, i) => i), []);

    const path = useDerivedValue(() => {
        const p = Skia.Path.Make();
        const barWidth = (width - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT;

        // We'll generate a "shifting" effect or just static bars that react to pulse
        for (let i = 0; i < BAR_COUNT; i++) {
            // Simple random-ish but responsive bars
            const seed = (Math.sin(i * 0.5) + 1) / 2;
            const h = Math.max(MIN_BAR_HEIGHT, normalizedMetering.value * height * (0.5 + seed * 0.5));
            const x = i * (barWidth + BAR_GAP);
            const y = (height - h) / 2;

            p.addRRect(Skia.RRectXY(Skia.XYWHRect(x, y, barWidth, h), 2, 2));
        }
        return p;
    }, [width, height]);

    return (
        <View style={{ width, height, justifyContent: 'center' }}>
            <Canvas style={{ flex: 1 }}>
                <Path path={path} color="#FF4F18" />
            </Canvas>
        </View>
    );
};

export default RecordingWaveform;
