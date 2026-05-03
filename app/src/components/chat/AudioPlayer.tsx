import React, { useMemo, useEffect, useCallback } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useAudioPlayer,
  useAudioPlayerStatus,
  setAudioModeAsync,
} from "expo-audio";
import AppText from "@/components/ui/AppText";
import { useAudioStore } from "@/store/audioStore";
import { API_BASE_URL } from "@/api/apiClient";

interface AudioPlayerProps {
  uri: string;
  isMe: boolean;
}

// ─── AudioPlayer ─────────────────────────────────────────────────────────────
const AudioPlayer = ({ uri, isMe }: AudioPlayerProps) => {
  // Build full URL from relative or absolute URI
  const audioSource = useMemo(() => {
    if (!uri) return null;
    if (uri.startsWith("http") || uri.startsWith("file://")) return uri;
    const cleanUri = uri.startsWith("/") ? uri : `/${uri}`;
    return `${API_BASE_URL}${cleanUri}`;
  }, [uri]);

  // expo-audio accepts a string URL directly — no wrapper object needed
  const player = useAudioPlayer(audioSource as any, { updateInterval: 50 });
  const status = useAudioPlayerStatus(player);
  const { activeAudioUri, setActiveAudioUri } = useAudioStore();

  const handlePlayPause = useCallback(async () => {
    if (!audioSource || !player) return;

    // Ensure playback mode is set (recording may have locked it)
    await setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      interruptionMode: "mixWithOthers",
    }).catch(() => {});

    if (status.playing) {
      player.pause();
      setActiveAudioUri(null);
    } else {
      setActiveAudioUri(uri);
      if (status.didJustFinish) player.seekTo(0);
      player.play();
    }
  }, [
    audioSource,
    uri,
    status.playing,
    status.didJustFinish,
    player,
    setActiveAudioUri,
  ]);

  // Auto-pause if another audio starts
  useEffect(() => {
    if (activeAudioUri !== uri && status.playing) {
      player.pause();
    }
  }, [activeAudioUri, uri, status.playing, player]);

  // ── Time format ──
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ── Progress ──
  const progress =
    status.duration > 0 ? status.currentTime / status.duration : 0;
  const progressPercent = `${Math.min(progress * 100, 100)}%`;

  const primaryColor = isMe ? "white" : "#FF4F18";
  const dimColor = isMe ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.15)";

  return (
    <View style={styles.container}>
      {/* Play / Pause */}
      <Pressable
        onPress={handlePlayPause}
        style={[
          styles.playBtn,
          {
            backgroundColor: isMe
              ? "rgba(255,255,255,0.2)"
              : "rgba(255,79,24,0.1)",
          },
        ]}
      >
        <Ionicons
          name={
            status.playing ? "pause" : status.didJustFinish ? "refresh" : "play"
          }
          size={22}
          color={primaryColor}
        />
      </Pressable>

      {/* Line UI + time */}
      <View style={styles.rightCol}>
        <View style={styles.trackContainer}>
          {/* Background inactive track line */}
          <View
            style={[
              styles.trackLine,
              { backgroundColor: dimColor, width: "100%" },
            ]}
          />

          {/* Active progress fill line */}
          <View
            style={[
              styles.trackLine,
              styles.trackActive,
              { backgroundColor: primaryColor, width: progressPercent as any },
            ]}
          />

          {/* Scrub knob trailing the active line */}
          <View
            style={[
              styles.knob,
              {
                backgroundColor: primaryColor,
                left: progressPercent as any,
              },
            ]}
          />
        </View>

        <AppText
          style={[
            styles.time,
            { color: isMe ? "rgba(255,255,255,0.75)" : "#6B7280" },
          ]}
        >
          {formatTime(
            status.playing || status.currentTime > 0
              ? status.currentTime
              : status.duration,
          )}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: 240,
    paddingVertical: 0,
    paddingHorizontal: 2,
  },
  playBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  rightCol: {
    flex: 1,
    justifyContent: "center",
  },
  trackContainer: {
    height: 18,
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  trackLine: {
    position: "absolute",
    left: 0,
    height: 3,
    borderRadius: 1.5,
  },
  trackActive: {
    zIndex: 1,
  },
  knob: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6, // Centers the knob over the exact percentage point
    zIndex: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
  },
  time: {
    fontSize: 10,
    marginTop: 0,
  },
});

export default React.memo(AudioPlayer);
