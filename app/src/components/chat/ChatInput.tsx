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
import { useTranslation } from "react-i18next";
import {
  View,
  TextInput,
  Pressable,
  Platform,
  Alert,
  Keyboard,
  StyleSheet,
  Animated as RNAnimated,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  useAudioRecorder,
  IOSOutputFormat,
  AudioQuality,
  useAudioRecorderState,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
} from "expo-audio";
import * as Haptics from "expo-haptics";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
  interpolate,
  Easing,
  cancelAnimation,
  type SharedValue,
} from "react-native-reanimated";
import AppText from "@/components/ui/AppText";

// ─── Config ───────────────────────────────────────────────────────────────────
// Thresholds tuned to match WhatsApp's recorder feel. CANCEL_X tighter than
// stock so small-thumbed users can reach it; LOCK_Y matches WA's ~100px.
const CANCEL_X = -80; // px leftward → cancel
const LOCK_Y = -100; // px upward   → lock
const LOCK_ATTRACT_RANGE = 30; // px before LOCK_Y where magnetic snap kicks in
const RUBBER_X = 0.75; // horizontal rubber-band coefficient
const RUBBER_Y = 0.75; // vertical rubber-band coefficient
const MIN_MS = 600; // discard if shorter than this (matches WhatsApp)

// ─── Sound assets ─────────────────────────────────────────────────────────────
// Placeholder sounds generated via ffmpeg — swap with curated SFX later.
// Keep filenames stable so swapping requires zero code changes.
const SND_START = require("../../../assets/sounds/record_start.m4a");
const SND_SEND = require("../../../assets/sounds/record_send.m4a");
const SND_CANCEL = require("../../../assets/sounds/record_cancel.m4a");
const SND_LOCK = require("../../../assets/sounds/lock.m4a");

// One player per SFX, lazy-initialised on first use. Reused across triggers
// via seekTo(0) so back-to-back plays don't allocate.
const sfxPlayers = new Map<number, AudioPlayer>();
function playFX(asset: number | null, vol = 0.8) {
  if (!asset) return;
  try {
    let p = sfxPlayers.get(asset);
    if (!p) {
      p = createAudioPlayer(asset);
      sfxPlayers.set(asset, p);
    }
    p.volume = vol;
    p.seekTo(0);
    p.play();
  } catch {
    // SFX are purely cosmetic — never let a playback error break recording.
  }
}

// Haptic + sound combos (called from JS thread)
function hStart() {
  playFX(SND_START, 0.7);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
function hSend() {
  playFX(SND_SEND, 0.9);
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
function hCancel() {
  playFX(SND_CANCEL, 0.8);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
function hLock() {
  playFX(SND_LOCK, 0.7);
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
function hTooShort() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}

// ─── WaveBar ──────────────────────────────────────────────────────────────────
const BAR_COUNT = 26;
const BAR_MIN = 3;
const BAR_MAX = 30;

function dbToH(db: number): number {
  "worklet";
  const c = Math.max(-55, Math.min(0, db));
  return BAR_MIN + ((c + 55) / 55) * (BAR_MAX - BAR_MIN);
}

const WaveBar = React.memo(
  ({
    metering,
    isActive,
    index,
    total,
  }: {
    metering: SharedValue<number>;
    isActive: boolean;
    index: number;
    total: number;
  }) => {
    const st = useAnimatedStyle(() => {
      if (!isActive) return { height: BAR_MIN, opacity: 0.25 };
      const center = 1 - Math.abs(index / total - 0.5) * 0.7;
      const jitter = Math.sin(index * 1.9 + metering.value * 0.06) * 0.2 + 1;
      const h = Math.max(
        BAR_MIN,
        Math.min(BAR_MAX, dbToH(metering.value) * center * jitter),
      );
      return {
        height: withSpring(h, { damping: 5, stiffness: 220 }),
        opacity: withTiming(isActive ? 1 : 0.2, { duration: 100 }),
      };
    });
    return (
      <Animated.View
        style={[
          {
            width: 3.5,
            borderRadius: 2,
            backgroundColor: "#FF4F18",
            marginHorizontal: 1,
          },
          st,
        ]}
      />
    );
  },
);
WaveBar.displayName = "WaveBar";

const LiveWaveform = React.memo(
  ({
    metering,
    isActive,
  }: {
    metering: SharedValue<number>;
    isActive: boolean;
  }) => (
    <View style={styles.waveformContainer}>
      {Array.from({ length: BAR_COUNT }).map((_, i) => (
        <WaveBar
          key={i}
          metering={metering}
          isActive={isActive}
          index={i}
          total={BAR_COUNT}
        />
      ))}
    </View>
  ),
);
LiveWaveform.displayName = "LiveWaveform";

// ─── Slide-to-cancel hint (inline, long-press mode only) ─────────────────────
const CancelHint = React.memo(
  ({ translateX }: { translateX: SharedValue<number> }) => {
    const { t } = useTranslation();
    const st = useAnimatedStyle(() => ({
      opacity: withTiming(translateX.value < -8 ? 1 : 0.6, { duration: 100 }),
      transform: [{ translateX: translateX.value * 0.15 }], // Slight follow
    }));
    return (
      <Animated.View style={[styles.cancelHint, st]} pointerEvents="none">
        <Ionicons name="chevron-back" size={13} color="#9CA3AF" />
        <AppText style={styles.cancelText}>{t('chat.slideToCancelHint')}</AppText>
      </Animated.View>
    );
  },
);
CancelHint.displayName = "CancelHint";

// ─── Lock indicator (floats above mic, long-press mode only) ─────────────────
// Visible from the moment recording starts (at 0.55 opacity) so users see the
// lock target before they need it. Fills to full opacity + brand colour as
// the finger enters the magnetic attract range.
const LockIndicator = React.memo(
  ({ translateY }: { translateY: SharedValue<number> }) => {
    const containerStyle = useAnimatedStyle(() => {
      const dy = translateY.value;
      const dragProgress = Math.min(1, Math.abs(Math.min(0, dy)) / 60);
      const isLocked = dy < LOCK_Y;
      const inAttract = dy < LOCK_Y + LOCK_ATTRACT_RANGE;

      return {
        opacity: withTiming(0.55 + dragProgress * 0.45, { duration: 120 }),
        transform: [
          {
            scale: withSpring(isLocked ? 1.1 : inAttract ? 1.06 : 1, {
              damping: 9,
              stiffness: 160,
            }),
          },
        ],
      };
    });

    const lockIconStyle = useAnimatedStyle(() => {
      const inAttract = translateY.value < LOCK_Y + LOCK_ATTRACT_RANGE;
      return {
        transform: [{ scale: withSpring(inAttract ? 1.15 : 1, { damping: 10 }) }],
      };
    });

    return (
      <Animated.View style={[styles.lockContainer, containerStyle]}>
        <View style={styles.lockTrack}>
          <Animated.View style={lockIconStyle}>
            <Ionicons
              name="lock-closed"
              size={18}
              color="#FF4F18"
              style={{ marginBottom: 4 }}
            />
          </Animated.View>
          <Ionicons name="chevron-up" size={16} color="#9CA3AF" />
          <Ionicons
            name="chevron-up"
            size={16}
            color="#9CA3AF"
            style={{ marginTop: -10, opacity: 0.6 }}
          />
          <Ionicons
            name="chevron-up"
            size={16}
            color="#9CA3AF"
            style={{ marginTop: -10, opacity: 0.3 }}
          />
        </View>
      </Animated.View>
    );
  },
);
LockIndicator.displayName = "LockIndicator";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatInputProps {
  onSend: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  onAudioSelect?: (uri: string, duration: number) => void;
  disabled?: boolean;
  replyTo?: any;
  onCancelReply?: () => void;
  /** True when keyboard is up OR a bottom panel is open (parent owns this). */
  isBottomAreaActive?: boolean;
  /** Which bottom panel is active, if any. Drives icon-swap behavior. */
  activePanel?: "sticker" | "attachment" | null;
  /** Tap handlers for the two icons. Parent decides what to do. */
  onToggleSticker?: () => void;
  onToggleAttachment?: () => void;
  /** Quick-camera shortcut (the camera icon on the right of the input). */
  onPickCamera?: () => void;
  /** Parent bumps this counter to request input focus (e.g., closing panel). */
  shouldFocusInputSignal?: number;
}

// ─── ChatInput ────────────────────────────────────────────────────────────────
export default function ChatInput({
  onSend,
  onTypingChange,
  onAudioSelect,
  disabled,
  replyTo,
  onCancelReply,
  isBottomAreaActive = false,
  activePanel = null,
  onToggleSticker,
  onToggleAttachment,
  onPickCamera,
  shouldFocusInputSignal,
}: ChatInputProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  // JS-thread state
  const [text, setText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Shared values (UI thread)
  const micX = useSharedValue(0);
  const micY = useSharedValue(0);
  const micScale = useSharedValue(1);
  const dotScale = useSharedValue(1);
  const metering = useSharedValue(-60);
  const isLockedSV = useSharedValue(false);
  const isCancelSV = useSharedValue(false);
  const hasHapticNearLock = useSharedValue(false);
  const hasHapticNearCancel = useSharedValue(false);

  // JS refs
  const recStartRef = useRef(0); // Date.now() when recorder.record() resolved
  const isPreparingRef = useRef(false);
  const isProcessRef = useRef(false);
  const isPausedRef = useRef(false); // ref so stopRecording closure doesn't go stale
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Parent bumps shouldFocusInputSignal to ask us to focus the TextInput
  // (e.g., when the sticker drawer is being closed).
  useEffect(() => {
    if (shouldFocusInputSignal && shouldFocusInputSignal > 0) {
      inputRef.current?.focus();
    }
  }, [shouldFocusInputSignal]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ── Audio recorder ──────────────────────────────────────────────────────────
  const recorder = useAudioRecorder({
    isMeteringEnabled: true,
    extension: ".m4a",
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    android: {
      extension: ".m4a",
      outputFormat: "mpeg4",
      audioEncoder: "aac",
      sampleRate: 44100,
    },
    ios: {
      extension: ".m4a",
      outputFormat: IOSOutputFormat.MPEG4AAC,
      audioQuality: AudioQuality.HIGH,
      sampleRate: 44100,
    },
    web: { mimeType: "audio/webm", bitsPerSecond: 128000 },
  });
  const recState = useAudioRecorderState(recorder, 80);

  useEffect(() => {
    metering.value = recState.metering ?? -60;
  }, [metering, recState.metering]);

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
  }, [isCancelSV, isLockedSV, metering, micScale, micX, micY]);

  // ── Start recording ─────────────────────────────────────────────────────────
  // autoLock=true  → single-tap path: immediately enters locked mode
  // autoLock=false → long-press path: shows slide/lock UI until finger lifts
  const startRecording = useCallback(
    async (autoLock: boolean) => {
      if (
        isPreparingRef.current ||
        isProcessRef.current ||
        recorder.isRecording
      )
        return;
      isPreparingRef.current = true;

      try {
        // Re-request permissions just in case
        const { status } = await requestRecordingPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            t('create_ad.images.permissionRequired'),
            t('chat.micPermissionRequired'),
          );
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
        Alert.alert(
          t('common.error'),
          t('chat.recordingError'),
        );
        resetUI();
      } finally {
        isPreparingRef.current = false;
      }
    },
    [isLockedSV, micScale, micX, micY, recorder, resetUI],
  );

  // ── Stop & optionally send ──────────────────────────────────────────────────
  const resetAudioMode = () => {
    setTimeout(async () => {
      try {
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          interruptionMode: "mixWithOthers",
        });
      } catch {}
    }, 100);
  };

  const stopRecording = useCallback(
    async (shouldSend: boolean) => {
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
          if (recorder.isRecording) {
            try {
              await recorder.stop();
            } catch {}
          }
          resetAudioMode();
          return;
        }

        hSend();
        if (isPausedRef.current) {
          try {
            await recorder.record();
          } catch {}
          await new Promise((r) => setTimeout(r, 60));
        }
        if (recorder.isRecording) await recorder.stop();
        resetAudioMode();

        const uri = recorder.uri ?? capturedUri;
        if (uri && onAudioSelect) onAudioSelect(uri, capturedMs);
      } catch (err) {
        console.error("[ChatInput] stopRecording:", err);
      } finally {
        setTimeout(() => {
          isProcessRef.current = false;
        }, 300);
      }
    },
    [recorder, resetUI, onAudioSelect],
  );

  // ── Cancel (no send) ────────────────────────────────────────────────────────
  const cancelRecording = useCallback(async () => {
    if (isProcessRef.current) return;
    isProcessRef.current = true;
    resetUI();
    hCancel();
    try {
      if (recorder.isRecording) {
        try {
          await recorder.stop();
        } catch {}
      }
      resetAudioMode();
    } finally {
      setTimeout(() => {
        isProcessRef.current = false;
      }, 300);
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
  }, [isLockedSV, micScale, micX, micY]);

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

  // Tap & LongPress thresholds tuned tight: 150ms tap is unambiguous, and
  // 180ms longPress fires fast enough that "hold to record" feels immediate.
  // The 30ms gap between them prevents tap/longPress races.
  const tap = Gesture.Tap()
    .maxDuration(150)
    .onEnd(() => {
      runOnJS(startRecording)(true);
    });

  const longPress = Gesture.LongPress()
    .minDuration(180)
    .shouldCancelWhenOutside(false)
    .onStart(() => {
      runOnJS(startRecording)(false);
    });

  // minDistance(8) kills jitter from micro-touches that aren't real drags.
  const pan = Gesture.Pan()
    .minDistance(8)
    .shouldCancelWhenOutside(false)
    .onUpdate((e) => {
      if (isCancelSV.value || isLockedSV.value) return;

      // Rubber-band: visual movement is dampened so user feels resistance.
      micX.value = e.translationX * RUBBER_X;
      let visualY = Math.min(0, e.translationY) * RUBBER_Y;

      // Magnetic snap toward the lock target: when the finger is within
      // LOCK_ATTRACT_RANGE px of the lock threshold, add an upward pull so
      // the lock track reads as a discoverable target.
      const dy = e.translationY;
      if (dy < LOCK_Y + LOCK_ATTRACT_RANGE && dy > LOCK_Y) {
        const proximity = (LOCK_Y + LOCK_ATTRACT_RANGE - dy) / LOCK_ATTRACT_RANGE;
        visualY -= proximity * 25;
      }
      micY.value = visualY;

      // Haptic tick once when approaching "Cancel" threshold.
      if (e.translationX < CANCEL_X + 30 && !hasHapticNearCancel.value) {
        hasHapticNearCancel.value = true;
        runOnJS(Haptics.selectionAsync)();
      } else if (e.translationX >= CANCEL_X + 30) {
        hasHapticNearCancel.value = false;
      }

      // Haptic tick once when entering lock attract range.
      if (e.translationY < LOCK_Y + LOCK_ATTRACT_RANGE && !hasHapticNearLock.value) {
        hasHapticNearLock.value = true;
        runOnJS(Haptics.selectionAsync)();
      } else if (e.translationY >= LOCK_Y + LOCK_ATTRACT_RANGE) {
        hasHapticNearLock.value = false;
      }

      // Trigger Cancel
      if (e.translationX < CANCEL_X) {
        isCancelSV.value = true;
        runOnJS(cancelRecording)();
      }
      // Trigger Lock
      else if (e.translationY < LOCK_Y && !isLockedSV.value) {
        isLockedSV.value = true;
        // Visual snap-up into the lock track.
        micY.value = withSpring(LOCK_Y - 40, { damping: 12, stiffness: 200 });
        runOnJS(lockRecording)();
      }
    })
    .onEnd(() => {
      if (isCancelSV.value || isLockedSV.value) return;
      runOnJS(stopRecording)(true);
    })
    .onFinalize(() => {
      hasHapticNearLock.value = false;
      hasHapticNearCancel.value = false;
      if (!isLockedSV.value) {
        micX.value = withSpring(0, { damping: 15 });
        micY.value = withSpring(0, { damping: 15 });
        micScale.value = withSpring(1, { damping: 15 });
      }
    });

  // Make Tap and LongPress mutually exclusive, but let Pan run with LongPress
  const gesture = Gesture.Exclusive(tap, Gesture.Simultaneous(longPress, pan));

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
          withTiming(1.35, {
            duration: 500,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(0.8, { duration: 500, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      cancelAnimation(dotScale);
      dotScale.value = withTiming(isPaused ? 0.5 : 1, { duration: 200 });
    }
  }, [dotScale, isPaused, isRecording]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: withTiming(isPaused ? 0.4 : 1, { duration: 150 }),
  }));

  // ── Text input helpers ───────────────────────────────────────────────────────
  const handleTextChange = useCallback(
    (t: string) => {
      setText(t);
      onTypingChange?.(t.trim().length > 0);
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      if (t.trim().length > 0)
        typingTimeout.current = setTimeout(() => onTypingChange?.(false), 3000);
    },
    [onTypingChange],
  );

  const handleSend = useCallback(() => {
    const msg = text.trim();
    if (!msg) return;
    setText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSend(msg);
    onTypingChange?.(false);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
  }, [text, onSend, onTypingChange]);


  // ── Render ───────────────────────────────────────────────────────────────────
  const hasText = text.trim().length > 0;
  const showRecordUI = isRecording || isLocked;

  // Animated reply height
  const replyAnim = useRef(new RNAnimated.Value(0)).current;
  useEffect(() => {
    RNAnimated.spring(replyAnim, {
      toValue: replyTo ? 1 : 0,
      useNativeDriver: false,
      friction: 8,
      tension: 50,
    }).start();
  }, [replyTo, replyAnim]);

  const replyHeight = replyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <View style={styles.wrapper}>
      {/* Reply bar */}
      <RNAnimated.View
        style={[
          styles.replyBar,
          { height: replyHeight, opacity: replyAnim, overflow: "hidden" },
        ]}
      >
        <View style={styles.replyContent}>
          <View className="flex-1">
            <AppText weight="bold" style={styles.replyName} numberOfLines={1}>
              {replyTo?.sender?.full_name ??
                replyTo?.sender?.username ??
                "Replying to"}
            </AppText>
            <AppText style={styles.replyText} numberOfLines={1}>
              {replyTo?.message_type === "image"
                ? "📷 Photo"
                : replyTo?.message_type === "audio"
                  ? "🎤 Voice Message"
                  : replyTo?.message_type === "document"
                    ? "📄 Document"
                    : (replyTo?.content ?? "Message")}
            </AppText>
          </View>
          <Pressable
            onPress={onCancelReply}
            style={styles.replyClose}
            hitSlop={8}
          >
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </Pressable>
        </View>
      </RNAnimated.View>

      <View
        style={[
          styles.row,
          {
            paddingBottom:
              isBottomAreaActive
                ? 6
                : Math.max(insets.bottom, 6),
          },
        ]}
      >
        {/* Input bubble */}
        <View style={styles.inputBubble}>
          {!showRecordUI ? (
            <>
              <Pressable
                onPress={onToggleAttachment}
                disabled={disabled}
                style={styles.iconBtn}
                hitSlop={6}
              >
                {activePanel === "attachment" ? (
                  <Ionicons name="keypad-outline" size={28} color="#FF4F18" />
                ) : (
                  <Ionicons name="add-circle" size={28} color="#FF4F18" />
                )}
              </Pressable>

              <Pressable
                onPress={onToggleSticker}
                style={styles.iconBtn}
                hitSlop={6}
              >
                {activePanel === "sticker" ? (
                  <Ionicons name="keypad-outline" size={24} color="#64748B" />
                ) : (
                  <MaterialCommunityIcons
                    name="sticker-emoji"
                    size={24}
                    color="#64748B"
                  />
                )}
              </Pressable>

              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={handleTextChange}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
                placeholder={t('chat.placeholder')}
                placeholderTextColor="#94A3B8"
                multiline
                style={styles.textInput}
                editable={!disabled}
                onFocus={() => {
                  // Parent's keyboard listener will close any open panel.
                }}
              />

              <Pressable
                onPress={onPickCamera}
                disabled={disabled}
                style={styles.iconBtn}
                hitSlop={6}
              >
                <Ionicons name="camera-outline" size={24} color="#64748B" />
              </Pressable>
            </>
          ) : (
            /* Recording UI */
            <View
              style={[
                styles.recordingRow,
                { backgroundColor: "#FFF5F2", borderRadius: 26 },
              ]}
            >
              {/* Delete — locked mode only */}
              {isLocked && (
                <Pressable
                  onPress={cancelRecording}
                  style={styles.recordBtn}
                  hitSlop={10}
                >
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
                <LiveWaveform
                  metering={metering}
                  isActive={isRecording && !isPaused}
                />
              </View>

              {/* Pause — locked mode only */}
              {isLocked && (
                <Pressable
                  onPress={togglePause}
                  style={styles.recordBtn}
                  hitSlop={10}
                >
                  <Ionicons
                    name={isPaused ? "mic" : "pause"}
                    size={22}
                    color="#FF4F18"
                  />
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
            <Pressable
              onPress={handleSend}
              disabled={disabled}
              style={styles.actionBtn}
            >
              <Ionicons name="send" size={20} color="white" />
            </Pressable>
          ) : isLocked ? (
            /* Locked: pressing sends */
            <Pressable
              onPress={() => stopRecording(true)}
              style={styles.actionBtn}
            >
              <Ionicons name="send" size={20} color="white" />
            </Pressable>
          ) : (
            /* Mic: tap = auto-lock, hold = long-press flow */
            <GestureDetector gesture={gesture}>
              <Animated.View style={micAnimStyle}>
                <View
                  style={[
                    styles.actionBtn,
                    disabled && styles.actionBtnDisabled,
                  ]}
                >
                  <Ionicons name="mic" size={20} color="white" />
                </View>
              </Animated.View>
            </GestureDetector>
          )}
        </View>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  wrapper: { backgroundColor: "#F0F2F5", position: "relative" },

  replyBar: {
    paddingHorizontal: 12,
    backgroundColor: "#F0F2F5",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  replyContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    marginVertical: 4,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF4F18",
  },
  replyName: { fontSize: 13, color: "#FF4F18" },
  replyText: { fontSize: 13, color: "#64748B", marginTop: 2 },
  replyClose: { marginLeft: 8, padding: 4 },

  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: "#F0F2F5",
  },

  inputBubble: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 6,
    minHeight: 48,
  },
  iconBtn: { padding: 6 },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    paddingHorizontal: 8,
    minHeight: 36,
    maxHeight: 150,
    textAlignVertical: "center",
    paddingTop: Platform.OS === "android" ? 0 : 8,
    paddingBottom: Platform.OS === "android" ? 0 : 8,
  },

  recordingRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    gap: 8,
    overflow: "hidden",
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#EF4444",
  },
  timer: { fontSize: 16, fontWeight: "700", color: "#1E293B", minWidth: 45 },
  timerPaused: { opacity: 0.5 },
  recordBtn: { padding: 6 },

  cancelHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  cancelText: { fontSize: 13, color: "#94A3B8" },

  waveformContainer: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    overflow: "hidden",
  },

  lockContainer: {
    position: "absolute",
    bottom: 60,
    alignSelf: "center",
    alignItems: "center",
    zIndex: 10,
  },
  lockTrack: {
    width: 52,
    height: 140,
    borderRadius: 26,
    backgroundColor: "white",
    alignItems: "center",
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },

  micWrapper: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  actionBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF4F18",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#FF4F18",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  actionBtnDisabled: { backgroundColor: "#CBD5E1" },
});
