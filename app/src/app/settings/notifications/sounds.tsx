import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import AppText from "@/components/ui/AppText";
import ScreenHeader from "@/components/ui/ScreenHeader";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Note: Sound files must be placed in app/assets/sounds/ to be resolved.
// We use placeholders here to prevent build errors if the files are missing.
const SOUNDS = [
  { id: "default", name: "Default Tajma", file: null },
  { id: "zest", name: "OneFood Zest", file: null },
  { id: "modern", name: "Modern Pop", file: null },
  { id: "minimal", name: "Minimal Tick", file: null },
  { id: "sweet", name: "Sweet Melody", file: null },
];

const NOTIFICATION_SOUND_KEY = "@notification_sound_id";

export default function NotificationSoundsScreen() {
  const router = useRouter();
  const [selectedSoundId, setSelectedSoundId] = useState("default");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSavedSound();
  }, []);

  const loadSavedSound = async () => {
    try {
      const saved = await AsyncStorage.getItem(NOTIFICATION_SOUND_KEY);
      if (saved) setSelectedSoundId(saved);
    } catch (e) {
      console.error("Failed to load sound preference", e);
    } finally {
      setIsLoading(false);
    }
  };

  const playSound = async (soundFile: any, id: string) => {
    try {
      // Selected sound logic - in a real app with files, we'd use useAudioPlayer
      // but since these are placeholders we just update state
      setSelectedSoundId(id);
      await AsyncStorage.setItem(NOTIFICATION_SOUND_KEY, id);
      console.log("Playing sound:", id);
    } catch (error) {
      console.warn("Sound preview failed", error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#FF4F18" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F9F9F9]">
      <Stack.Screen
        options={{ title: "Notification Sounds", headerShown: false }}
      />

      <ScreenHeader
        title="Alert Sounds"
        subtitle="Choose your preferred notification tone"
        onBackPress={() => router.back()}
      />

      <ScrollView
        className="flex-1 mt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View className="px-4 gap-2">
          {SOUNDS.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => playSound(item.file, item.id)}
              className={`px-5 py-4 flex-row items-center justify-between rounded-full border ${
                selectedSoundId === item.id
                  ? "bg-primary/5 border-primary/20"
                  : "bg-white border-gray-100"
              }`}
            >
              <View className="flex-row items-center gap-4">
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center ${
                    selectedSoundId === item.id
                      ? "bg-primary/10"
                      : "bg-gray-100"
                  }`}
                >
                  <Ionicons
                    name={
                      selectedSoundId === item.id
                        ? "volume-high"
                        : "volume-medium-outline"
                    }
                    size={20}
                    color={selectedSoundId === item.id ? "#FF4F18" : "#9ca3af"}
                  />
                </View>
                <AppText
                  weight={selectedSoundId === item.id ? "bold" : "medium"}
                  className={
                    selectedSoundId === item.id
                      ? "text-primary text-base"
                      : "text-gray-700 text-base"
                  }
                >
                  {item.name}
                </AppText>
              </View>

              {selectedSoundId === item.id && (
                <Ionicons name="checkmark-circle" size={24} color="#FF4F18" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View className="p-6">
          <AppText className="text-gray-500 text-sm leading-5">
            <Ionicons name="information-circle-outline" size={14} /> Note:
            System sounds are limited by iOS/Android permissions. Tajma uses
            high-quality custom alerts to ensure you never miss a message.
          </AppText>
        </View>
      </ScrollView>
    </View>
  );
}
