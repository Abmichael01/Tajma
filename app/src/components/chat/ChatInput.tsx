/**
 * ChatInput.tsx — WhatsApp-exact voice recording (2025 unified model)
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │  SINGLE TAP  → recording starts + auto-locks immediately            │
 * │              → shows locked UI: delete / pause-resume / send        │
 * │                                                                     │
 * │  LONG PRESS  → recording starts, mic button scales up 1.3×         │
 * │              → "Slide to cancel ←" hint appears in bubble           │
 * │              → lock 🔒 indicator floats above mic button            │
 * │              → slide LEFT > 80px  → cancel (pop haptic + sound)    │
 * │              → slide UP  > 60px  → lock (magnetic snap + haptic)   │
 * │              → RELEASE (≥ 1 s)    → send (whoosh sound + haptic)   │
 * │              → RELEASE (< 1 s)    → discard (warning haptic)       │
 * │                                                                     │
 * │  SOUNDS  — replace SND_* consts with require("../assets/…") paths  │
 * │  HAPTICS — impact on start, notif-success on lock,                 │
 * │            notif-warning on cancel/too-short, impact-medium on send │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * Gesture engine:  react-native-gesture-handler
 *   Gesture.Simultaneous(LongPress, Pan)
 *   LongPress(minDuration=0) fires on touch-down → starts recording
 *   Pan tracks movement  → cancel / lock / release-to-send
 *
 * Audio:     expo-audio   (m4a/aac, 44100 Hz, metered)
 * Sounds:    expo-audio   (short WAV clips — optional, gracefully skipped)
 * Animation: react-native-reanimated  (UI-thread only)
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View, TextInput, Pressable, Platform, Alert,
    Keyboard, StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
    useAudioRecorder, IOSOutputFormat, AudioQuality,
    useAudioRecorderState, requestRecordingPermissionsAsync,
    setAudioModeAsync,
} from "expo-audio";
import { AudioPlayer } from "expo-audio";
import * as Haptics from "expo-haptics";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import Animated, {
    useSharedValue, useAnimatedStyle,
    withSpring, withTiming, withRepeat, withSequence,
    runOnJS, interpolate, Easing, cancelAnimation,
    type SharedValue,
} from "react-native-reanimated";
import { EmojiKeyboard, type EmojiType } from "rn-emoji-keyboard";
import AppText from "@/components/ui/AppText";

// ─── Config ───────────────────────────────────────────────────────────────────
const CANCEL_X = -80;   // px leftward → cancel
const LOCK_Y = -60;   // px upward   → lock
const MIN_MS = 1000;  // discard if shorter than 1 s (same as WhatsApp)

// ─── Sound assets ─────────────────────────────────────────────────────────────
// Replace nulls with: require("../assets/sounds/record_start.wav") etc.
// The component works fine without sounds — they're purely cosmetic.
const SND_START: any = null; // soft camera-shutter click
const SND_SEND: any = null; // upward whoosh
const SND_CANCEL: any = null; // short descending pop
const SND_LOCK: any = null; // satisfying snap/click

async function playFX(_asset: any, _vol = 0.8) {
    // Sound assets are optional — currently all null.
    // When real assets are added, use expo-audio's AudioPlayer.
    if (!_asset) return;
}

// Haptic + sound combos (called from JS thread)
function hStart() { playFX(SND_START, 0.7); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
function hSend() { playFX(SND_SEND, 0.9); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); }
function hCancel() { playFX(SND_CANCEL, 0.8); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }
function hLock() { playFX(SND_LOCK, 0.7); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }
function hTooShort() { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); }

// ─── WaveBar ──────────────────────────────────────────────────────────────────
const BAR_COUNT = 26;
const BAR_MIN = 3;
const BAR_MAX = 30;

function dbToH(db: number): number {
    "worklet";
    const c = Math.max(-55, Math.min(0, db));
    return BAR_MIN + ((c + 55) / 55) * (BAR_MAX - BAR_MIN);
}

const WaveBar = React.memo(({
    metering, isActive, index, total,
}: { metering: SharedValue<number>; isActive: boolean; index: number; total: number }) => {
    const st = useAnimatedStyle(() => {
        if (!isActive) return { height: BAR_MIN, opacity: 0.25 };
        const center = 1 - Math.abs((index / total) - 0.5) * 0.7;
        const jitter = Math.sin(index * 1.9 + metering.value * 0.06) * 0.2 + 1;
        const h = Math.max(BAR_MIN, Math.min(BAR_MAX, dbToH(metering.value) * center * jitter));
        return {
            height: withSpring(h, { damping: 5, stiffness: 220 }),
            opacity: withTiming(isActive ? 1 : 0.2, { duration: 100 }),
        };
    });
    return (
        <Animated.View style={[{
            width: 3.5, borderRadius: 2, backgroundColor: "#FF4F18", marginHorizontal: 1,
        }, st]} />
    );
});

const LiveWaveform = React.memo(({
    metering, isActive,
}: { metering: SharedValue<number>; isActive: boolean }) => (
    <View style={styles.waveformContainer}>
        {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <WaveBar key={i} metering={metering} isActive={isActive} index={i} total={BAR_COUNT} />
        ))}
    </View>
));

// ─── Slide-to-cancel hint (inline, long-press mode only) ─────────────────────
const CancelHint = React.memo(({ translateX }: { translateX: SharedValue<number> }) => {
    const st = useAnimatedStyle(() => ({
        opacity: withTiming(translateX.value < -8 ? 1 : 0.6, { duration: 100 }),
        transform: [{ translateX: translateX.value * 0.15 }], // Slight follow
    }));
    return (
        <Animated.View style={[styles.cancelHint, st]} pointerEvents="none">
            <Ionicons name="chevron-back" size={13} color="#9CA3AF" />
            <AppText style={styles.cancelText}>Slide to cancel</AppText>
        </Animated.View>
    );
});

// ─── Lock indicator (floats above mic, long-press mode only) ─────────────────
const LockIndicator = React.memo(({ translateY }: { translateY: SharedValue<number> }) => {
    const st = useAnimatedStyle(() => {
        const p = Math.min(1, Math.abs(Math.min(0, translateY.value)) / 60);
        const mag = translateY.value < -45;
        const isLocked = translateY.value < LOCK_Y;

        return {
            opacity: withTiming(p > 0.05 ? 1 : 0, { duration: 100 }),
            transform: [
                { translateY: withSpring(p > 0.05 ? 0 : 20, { damping: 13, stiffness: 120 }) },
                { scale: withSpring(isLocked ? 1.05 : mag ? 1.02 : 1, { damping: 8, stiffness: 150 }) },
            ],
        };
    });
    return (
        <Animated.View style={[styles.lockContainer, st]}>
            <View style={styles.lockTrack}>
                <Ionicons name="lock-closed" size={18} color="#9CA3AF" style={{ marginBottom: 4 }} />
                <Ionicons name="chevron-up" size={16} color="#9CA3AF" />
                <Ionicons name="chevron-up" size={16} color="#9CA3AF" style={{ marginTop: -10, opacity: 0.6 }} />
                <Ionicons name="chevron-up" size={16} color="#9CA3AF" style={{ marginTop: -10, opacity: 0.3 }} />
            </View>
        </Animated.View>
    );
});

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatInputProps {
    onSend: (text: string) => void;
    onTypingChange?: (isTyping: boolean) => void;
    onImageSelect?: (asset: ImagePicker.ImagePickerAsset) => void;
    onAudioSelect?: (uri: string, duration: number) => void;
    onDocumentSelect?: (result: DocumentPicker.DocumentPickerResult) => void;
    disabled?: boolean;
    replyTo?: any;
    onCancelReply?: () => void;
}

// ─── ChatInput ────────────────────────────────────────────────────────────────
export default function ChatInput({
    onSend, onTypingChange, onImageSelect, onAudioSelect,
    onDocumentSelect, disabled, replyTo, onCancelReply,
}: ChatInputProps) {

    // JS-thread state
    const [text, setText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [showEmoji, setShowEmoji] = useState(false);
    const [showAttachSheet, setShowAttachSheet] = useState(false);

    // Shared values (UI thread)
    const micX = useSharedValue(0);
    const micY = useSharedValue(0);
    const micScale = useSharedValue(1);
    const dotScale = useSharedValue(1);
    const metering = useSharedValue(-60);
    const isLockedSV = useSharedValue(false); // locked mode
    const isCancelSV = useSharedValue(false); // cancelled — separate from locked!

    // JS refs
    const recStartRef = useRef(0);       // Date.now() when recorder.record() resolved
    const isPreparingRef = useRef(false);
    const isProcessRef = useRef(false);
    const isPausedRef = useRef(false);   // ref so stopRecording closure doesn't go stale
    const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    // ── Audio recorder ──────────────────────────────────────────────────────────
    const recorder = useAudioRecorder({
        isMeteringEnabled: true,
        extension: ".m4a",
        sampleRate: 44100,
        numberOfChannels: 1,
        bitRate: 128000,
        android: { extension: ".m4a", outputFormat: "mpeg4", audioEncoder: "aac", sampleRate: 44100 },
        ios: { extension: ".m4a", outputFormat: IOSOutputFormat.MPEG4AAC, audioQuality: AudioQuality.HIGH, sampleRate: 44100 },
        web: { mimeType: "audio/webm", bitsPerSecond: 128000 },
    });
    const recState = useAudioRecorderState(recorder, 80);

    useEffect(() => { metering.value = recState.metering ?? -60; }, [recState.metering]);

    const formatDuration = (secs: number) =>
        `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, "0")}`;

    // ── Reset everything ────────────────────────────────────────────────────────
    const resetUI = useCallback(() => {
        setIsRecording(false);
        setIsLocked(false);
        setIsPaused(false);
        isLockedSV.value = false;
        isCancelSV.value = false;
        metering.value = -60;
        micX.value = withSpring(0, { damping: 15 });
        micY.value = withSpring(0, { damping: 15 });
        micScale.value = withSpring(1, { damping: 15 });
    }, []);

    // ── Start recording ─────────────────────────────────────────────────────────
    // autoLock=true  → single-tap path: immediately enters locked mode
    // autoLock=false → long-press path: shows slide/lock UI until finger lifts
    const startRecording = useCallback(async (autoLock: boolean) => {
        if (isPreparingRef.current || isProcessRef.current || recorder.isRecording) return;
        isPreparingRef.current = true;
        
        try {
            // Re-request permissions just in case
            const { status } = await requestRecordingPermissionsAsync();
            if (status !== "granted") {
                Alert.alert("Permission Required", "Microphone access is needed to record voice messages.");
                resetUI();
                return;
            }

            // Important: Set audio mode for recording BEFORE preparing
            await setAudioModeAsync({
                allowsRecording: true,
                playsInSilentMode: true,
                interruptionMode: "doNotMix",
                shouldPlayInBackground: false,
            });

            await recorder.prepareToRecordAsync();
            
            // Final check before starting
            if (isProcessRef.current) {
                isPreparingRef.current = false;
                return;
            }

            hStart();
            setIsRecording(true);
            micScale.value = withSpring(1.3, { damping: 10, stiffness: 150 });

            await recorder.record();
            recStartRef.current = Date.now();

            if (autoLock) {
                setIsLocked(true);
                isLockedSV.value = true;
                micScale.value = withSpring(1, { damping: 14 });
                micX.value = withSpring(0);
                micY.value = withSpring(0);
            }
        } catch (err) {
            console.error("[ChatInput] startRecording failed:", err);
            Alert.alert("Recording Error", "Could not start voice recording. Please try again.");
            resetUI();
        } finally {
            isPreparingRef.current = false;
        }
    }, [recorder, resetUI]);

    // ── Stop & optionally send ──────────────────────────────────────────────────
    const resetAudioMode = () => {
        setTimeout(async () => {
            try {
                await setAudioModeAsync({
                    allowsRecording: false,
                    playsInSilentMode: true,
                    interruptionMode: "mixWithOthers",
                });
            } catch (e) { }
        }, 100);
    };

    const stopRecording = useCallback(async (shouldSend: boolean) => {
        if (isProcessRef.current) return;
        isProcessRef.current = true;

        // Capture BEFORE resetUI clears recorder
        const capturedUri = recorder.uri;
        const capturedMs = (recorder.currentTime ?? 0) * 1000;
        const elapsed = Date.now() - recStartRef.current;

        resetUI();

        try {
            const tooShort = elapsed < MIN_MS;
            const doSend = shouldSend && !tooShort;

            if (!doSend) {
                if (shouldSend && tooShort) hTooShort();
                if (recorder.isRecording) { try { await recorder.stop(); } catch (_) { } }
                resetAudioMode();
                return;
            }

            hSend();
            if (isPausedRef.current) {
                try { await recorder.record(); } catch (_) { }
                await new Promise((r) => setTimeout(r, 60));
            }
            if (recorder.isRecording) await recorder.stop();
            resetAudioMode();

            const uri = recorder.uri ?? capturedUri;
            if (uri && onAudioSelect) onAudioSelect(uri, capturedMs);
        } catch (err) {
            console.error("[ChatInput] stopRecording:", err);
        } finally {
            setTimeout(() => { isProcessRef.current = false; }, 300);
        }
    }, [recorder, resetUI, onAudioSelect]);

    // ── Cancel (no send) ────────────────────────────────────────────────────────
    const cancelRecording = useCallback(async () => {
        if (isProcessRef.current) return;
        isProcessRef.current = true;
        resetUI();
        hCancel();
        try {
            if (recorder.isRecording) { try { await recorder.stop(); } catch (_) { } }
            resetAudioMode();
        } finally {
            setTimeout(() => { isProcessRef.current = false; }, 300);
        }
    }, [recorder, resetUI]);

    // ── Lock ─────────────────────────────────────────────────────────────────────
    const lockRecording = useCallback(() => {
        setIsLocked(true);
        isLockedSV.value = true;
        micX.value = withSpring(0, { damping: 14 });
        micY.value = withSpring(0, { damping: 14 });
        micScale.value = withSpring(1, { damping: 12 });
        hLock();
    }, []);

    // ── Pause / resume ───────────────────────────────────────────────────────────
    const togglePause = useCallback(async () => {
        try {
            if (isPausedRef.current) {
                await recorder.record();
                setIsPaused(false);
            } else {
                await recorder.pause();
                setIsPaused(true);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (err) {
            console.error("[ChatInput] togglePause:", err);
        }
    }, [recorder]);

    // ── GESTURE ──────────────────────────────────────────────────────────────────
    //
    // 1. Single Tap = Start recording & immediately Lock (WhatsApp style)
    // 2. Long Press = Start recording, hold to record.
    // 3. Pan (during Long Press) = Slide Left to Cancel, Slide Up to Lock.

    const tap = Gesture.Tap()
        .maxDuration(250)
        .onEnd(() => {
            runOnJS(startRecording)(true);
        });

    const longPress = Gesture.LongPress()
        .minDuration(250)
        .shouldCancelWhenOutside(false)
        .onStart(() => {
            runOnJS(startRecording)(false);
        });

    const pan = Gesture.Pan()
        .minDistance(0)
        .shouldCancelWhenOutside(false)
        .onUpdate((e) => {
            if (isCancelSV.value || isLockedSV.value) return;

            micX.value = Math.min(0, e.translationX) * 0.55;
            micY.value = Math.min(0, e.translationY) * 0.60;

            // Cancel
            if (e.translationX < CANCEL_X) {
                isCancelSV.value = true;
                runOnJS(cancelRecording)();
            }
            // Lock
            else if (e.translationY < LOCK_Y && !isLockedSV.value) {
                isLockedSV.value = true;
                micY.value = withSpring(LOCK_Y - 20, { damping: 10, stiffness: 200 }); // Snap up
                runOnJS(lockRecording)();
            }
        })
        .onEnd(() => {
            // Only stop recording if they let go WITHOUT locking or cancelling
            if (isCancelSV.value || isLockedSV.value) return;
            runOnJS(stopRecording)(true);
        })
        .onFinalize(() => {
            if (!isLockedSV.value) {
                micX.value = withSpring(0, { damping: 15 });
                micY.value = withSpring(0, { damping: 15 });
                micScale.value = withSpring(1, { damping: 15 });
            }
        });

    // Make Tap and LongPress mutually exclusive, but let Pan run with LongPress
    const gesture = Gesture.Exclusive(
        tap,
        Gesture.Simultaneous(longPress, pan)
    );

    // ── Animated styles ──────────────────────────────────────────────────────────
    const micAnimStyle = useAnimatedStyle(() => {
        const dist = Math.sqrt(micX.value ** 2 + micY.value ** 2);
        const dragFactor = interpolate(dist, [0, 70], [1, 0.84], "clamp");
        const scale = isLockedSV.value
            ? micScale.value
            : micScale.value * dragFactor;
        return {
            transform: [
                { translateX: isLockedSV.value ? 0 : micX.value },
                { translateY: isLockedSV.value ? 0 : micY.value },
                { scale },
            ],
        };
    });

    // Pulsing red dot
    useEffect(() => {
        if (isRecording && !isPaused) {
            dotScale.value = withRepeat(
                withSequence(
                    withTiming(1.35, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(0.8, { duration: 500, easing: Easing.inOut(Easing.ease) }),
                ),
                -1, true,
            );
        } else {
            cancelAnimation(dotScale);
            dotScale.value = withTiming(isPaused ? 0.5 : 1, { duration: 200 });
        }
    }, [isRecording, isPaused]);

    const dotStyle = useAnimatedStyle(() => ({
        transform: [{ scale: dotScale.value }],
        opacity: withTiming(isPaused ? 0.4 : 1, { duration: 150 }),
    }));

    // ── Text input helpers ───────────────────────────────────────────────────────
    const handleTextChange = useCallback((t: string) => {
        setText(t);
        onTypingChange?.(t.trim().length > 0);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
        if (t.trim().length > 0)
            typingTimeout.current = setTimeout(() => onTypingChange?.(false), 3000);
    }, [onTypingChange]);

    const handleSend = useCallback(() => {
        const msg = text.trim();
        if (!msg) return;
        setText("");
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSend(msg);
        onTypingChange?.(false);
        if (typingTimeout.current) clearTimeout(typingTimeout.current);
    }, [text, onSend, onTypingChange]);

    const handleEmojiSelect = useCallback((emoji: EmojiType) => {
        setText((p) => p + emoji.emoji);
        onTypingChange?.(true);
    }, [onTypingChange]);

    const toggleEmoji = useCallback(() => {
        if (showEmoji) {
            setShowEmoji(false);
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            Keyboard.dismiss();
            setTimeout(() => setShowEmoji(true), 100);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, [showEmoji]);

    useEffect(() => {
        const sub = Keyboard.addListener("keyboardDidShow", () => setShowEmoji(false));
        return () => sub.remove();
    }, []);

    const handlePickImage = useCallback(async () => {
        if (!onImageSelect) return;
        const p = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!p.granted) { Alert.alert("Permission Required", "Camera roll access needed."); return; }
        const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
        if (!r.canceled && r.assets?.length) onImageSelect(r.assets[0]);
    }, [onImageSelect]);

    const handlePickCamera = useCallback(async () => {
        if (!onImageSelect) return;
        const p = await ImagePicker.requestCameraPermissionsAsync();
        if (!p.granted) { Alert.alert("Permission Required", "Camera access needed."); return; }
        const r = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.8 });
        if (!r.canceled && r.assets?.length) onImageSelect(r.assets[0]);
    }, [onImageSelect]);

    const handlePickDocument = useCallback(async () => {
        if (!onDocumentSelect) return;
        const r = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
        if (!r.canceled) onDocumentSelect(r);
    }, [onDocumentSelect]);

    const handleAttachPress = useCallback(() => {
        Keyboard.dismiss();
        setShowEmoji(false);
        setShowAttachSheet(true);
    }, []);

    // ── Render ───────────────────────────────────────────────────────────────────
    const hasText = text.trim().length > 0;
    const showRecordUI = isRecording || isLocked;

    return (
        <View style={styles.wrapper}>

            {/* Attachment Sheet */}
            {showAttachSheet && (
                <>
                    <Pressable
                        style={StyleSheet.absoluteFill as any}
                        onPress={() => setShowAttachSheet(false)}
                    />
                    <View style={styles.attachSheet}>
                        <Pressable style={styles.attachOption} onPress={() => { setShowAttachSheet(false); handlePickCamera(); }}>
                            <View style={styles.attachIcon}><Ionicons name="camera" size={26} color="#FF4F18" /></View>
                            <AppText style={styles.attachLabel}>Camera</AppText>
                        </Pressable>
                        <Pressable style={styles.attachOption} onPress={() => { setShowAttachSheet(false); handlePickImage(); }}>
                            <View style={styles.attachIcon}><Ionicons name="image" size={26} color="#FF4F18" /></View>
                            <AppText style={styles.attachLabel}>Gallery</AppText>
                        </Pressable>
                        <Pressable style={styles.attachOption} onPress={() => { setShowAttachSheet(false); handlePickDocument(); }}>
                            <View style={styles.attachIcon}><Ionicons name="document-text" size={26} color="#FF4F18" /></View>
                            <AppText style={styles.attachLabel}>Document</AppText>
                        </Pressable>
                    </View>
                </>
            )}

            {/* Reply bar */}
            {replyTo && (
                <View style={styles.replyBar}>
                    <View style={styles.replyContent}>
                        <AppText weight="bold" style={styles.replyName}>
                            {replyTo?.sender?.full_name ?? "Replying to"}
                        </AppText>
                        <AppText style={styles.replyText} numberOfLines={1}>
                            {replyTo?.content ?? "Message"}
                        </AppText>
                    </View>
                    <Pressable onPress={onCancelReply} style={styles.replyClose} hitSlop={8}>
                        <Ionicons name="close-circle" size={20} color="#667781" />
                    </Pressable>
                </View>
            )}

            <View style={styles.row}>

                {/* Input bubble */}
                <View style={styles.inputBubble}>
                    {!showRecordUI ? (
                        <>
                            <Pressable onPress={handleAttachPress} disabled={disabled} style={styles.iconBtn} hitSlop={6}>
                                <Ionicons name="add-circle-outline" size={26} color="#FF4F18" />
                            </Pressable>

                            <Pressable onPress={toggleEmoji} style={styles.iconBtn} hitSlop={6}>
                                <Ionicons name={showEmoji ? "keypad" : "happy-outline"} size={22} color="#667781" />
                            </Pressable>

                            <TextInput
                                ref={inputRef}
                                value={text}
                                onChangeText={handleTextChange}
                                onSubmitEditing={handleSend}
                                blurOnSubmit={false}
                                placeholder="Type a message..."
                                placeholderTextColor="#94A3B8"
                                multiline
                                style={styles.textInput}
                                editable={!disabled}
                                onFocus={() => setShowEmoji(false)}
                            />

                            <Pressable onPress={handlePickImage} disabled={disabled} style={styles.iconBtn} hitSlop={6}>
                                <Ionicons name="camera-outline" size={22} color="#667781" />
                            </Pressable>
                        </>
                    ) : (
                        /* Recording UI */
                        <View style={[styles.recordingRow, { backgroundColor: '#FFF5F2', borderRadius: 26 }]}>

                            {/* Delete — locked mode only */}
                            {isLocked && (
                                <Pressable onPress={cancelRecording} style={styles.recordBtn} hitSlop={10}>
                                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                                </Pressable>
                            )}

                            {/* Pulsing dot */}
                            <Animated.View style={[styles.recDot, dotStyle]} />

                            {/* Timer */}
                            <AppText style={[styles.timer, isPaused && styles.timerPaused]}>
                                {formatDuration(Math.floor(recState.durationMillis / 1000))}
                            </AppText>

                            {/* "Slide to cancel" — long-press mode only (NOT locked) */}
                            {!isLocked && <CancelHint translateX={micX} />}

                            {/* Waveform */}
                            <View style={{ flex: 1 }}>
                                <LiveWaveform metering={metering} isActive={isRecording && !isPaused} />
                            </View>

                            {/* Pause — locked mode only */}
                            {isLocked && (
                                <Pressable onPress={togglePause} style={styles.recordBtn} hitSlop={10}>
                                    <Ionicons name={isPaused ? "mic" : "pause"} size={22} color="#FF4F18" />
                                </Pressable>
                            )}
                        </View>
                    )}
                </View>

                {/* Right action button */}
                <View style={styles.micWrapper}>

                    {/* Lock indicator — long-press mode only */}
                    {isRecording && !isLocked && <LockIndicator translateY={micY} />}

                    {hasText ? (
                        /* Send text */
                        <Pressable onPress={handleSend} disabled={disabled} style={styles.actionBtn}>
                            <Ionicons name="send" size={20} color="white" />
                        </Pressable>

                    ) : isLocked ? (
                        /* Locked: pressing sends */
                        <Pressable onPress={() => stopRecording(true)} style={styles.actionBtn}>
                            <Ionicons name="send" size={20} color="white" />
                        </Pressable>

                    ) : (
                        /* Mic: tap = auto-lock, hold = long-press flow */
                        <GestureDetector gesture={gesture}>
                            <Animated.View style={micAnimStyle}>
                                <View
                                    style={[styles.actionBtn, disabled && styles.actionBtnDisabled]}
                                >
                                    <Ionicons name="mic" size={20} color="white" />
                                </View>
                            </Animated.View>
                        </GestureDetector>
                    )}
                </View>
            </View>

            {showEmoji && (
                <View style={{ height: 320, width: "100%", backgroundColor: "#F5F5F5" }}>
                    <EmojiKeyboard
                        onEmojiSelected={handleEmojiSelect}
                        theme={{ container: '#F5F5F5' }}
                        expandable={false}
                        hideHeader={true}
                    />
                </View>
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    wrapper: { backgroundColor: "#F5F5F5" },

    replyBar: {
        flexDirection: "row", alignItems: "center",
        paddingHorizontal: 12, paddingVertical: 8,
        backgroundColor: "white",
        borderTopWidth: 1, borderTopColor: "#F3F4F6", minHeight: 56,
    },
    replyContent: {
        flex: 1, borderLeftWidth: 3, borderLeftColor: "#FF4F18",
        paddingLeft: 8, backgroundColor: "#F9FAFB", padding: 6, borderRadius: 4,
    },
    replyName: { fontSize: 12, color: "#FF4F18" },
    replyText: { fontSize: 12, color: "#6B7280", marginTop: 1 },
    replyClose: { marginLeft: 8, padding: 4 },

    row: {
        flexDirection: "row", alignItems: "flex-end",
        paddingHorizontal: 10, paddingVertical: 10, gap: 8,
    },

    inputBubble: {
        flex: 1, flexDirection: "row", alignItems: "center",
        backgroundColor: "white",
        borderRadius: 26, borderWidth: 1, borderColor: "#E5E7EB",
        paddingHorizontal: 6, paddingVertical: 6, minHeight: 48,
    },
    iconBtn: { padding: 4 },
    textInput: {
        flex: 1, fontSize: 16, color: "#1F2937",
        paddingHorizontal: 6, minHeight: 36, maxHeight: 120,
        textAlignVertical: "center",
        paddingTop: Platform.OS === "android" ? 0 : undefined,
        paddingBottom: Platform.OS === "android" ? 0 : undefined,
    },

    recordingRow: {
        flex: 1, flexDirection: "row", alignItems: "center",
        paddingHorizontal: 4, gap: 6, overflow: "hidden",
    },
    recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#EF4444" },
    timer: { fontSize: 15, fontWeight: "600", color: "#1F2937", minWidth: 42 },
    timerPaused: { opacity: 0.5 },
    recordBtn: { padding: 4 },

    cancelHint: { flexDirection: "row", alignItems: "center", gap: 2 },
    cancelText: { fontSize: 12, color: "#9CA3AF" },

    waveformContainer: {
        flexDirection: "row", alignItems: "center",
        height: 36, overflow: "hidden",
    },

    lockContainer: {
        position: "absolute", bottom: 56,
        alignSelf: "center", alignItems: "center", zIndex: 10,
    },
    lockTrack: {
        width: 48, height: 130, borderRadius: 24,
        backgroundColor: "white",
        alignItems: "center", paddingTop: 14,
        shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
        borderWidth: 1, borderColor: "#E5E7EB",
    },

    micWrapper: {
        width: 48, height: 48,
        alignItems: "center", justifyContent: "center", zIndex: 10,
    },
    actionBtn: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: "#FF4F18",
        alignItems: "center", justifyContent: "center",
        elevation: 2, shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
    },
    actionBtnDisabled: { backgroundColor: "#D1D5DB" },

    attachSheet: {
        flexDirection: "row", justifyContent: "space-around",
        backgroundColor: "white",
        paddingHorizontal: 16, paddingVertical: 16,
        borderTopWidth: 1, borderTopColor: "#F3F4F6",
    },
    attachOption: {
        alignItems: "center", gap: 6, flex: 1,
    },
    attachIcon: {
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: "#FFF5F2",
        alignItems: "center", justifyContent: "center",
        borderWidth: 1, borderColor: "#FFE0D8",
    },
    attachLabel: {
        fontSize: 12, color: "#4B5563",
    },
});
