import React, { useEffect, useState } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppText from "@/components/ui/AppText";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import {
  FlipType,
  manipulateAsync,
  SaveFormat,
  type Action,
} from "expo-image-manipulator";

type EditAction = "crop" | "rotate" | "flip";

const MAX_EDIT_EDGE = 1800;
const EDIT_TIMEOUT_MS = 15000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Image edit timed out"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

interface MediaPreviewModalProps {
  visible: boolean;
  media: {
    type: "image" | "document";
    asset: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset;
  } | null;
  onClose: () => void;
  onSend: (
    caption: string,
    media?: ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset,
  ) => void;
}

export default function MediaPreviewModal({
  visible,
  media,
  onClose,
  onSend,
}: MediaPreviewModalProps) {
  const [caption, setCaption] = useState("");
  const [previewAsset, setPreviewAsset] = useState<
    ImagePicker.ImagePickerAsset | DocumentPicker.DocumentPickerAsset | null
  >(media?.asset ?? null);
  const [activeEditAction, setActiveEditAction] = useState<EditAction | null>(
    null,
  );

  useEffect(() => {
    setPreviewAsset(media?.asset ?? null);
    if (!visible) {
      setCaption("");
      setActiveEditAction(null);
    }
  }, [media, visible]);

  if (!media || !previewAsset) return null;

  const handleSend = () => {
    onSend(caption, previewAsset);
    setCaption("");
  };

  const isImage = media.type === "image";
  const asset = previewAsset;
  const imageAsset = asset as ImagePicker.ImagePickerAsset;

  const canEditImage = isImage && Boolean(imageAsset.uri);
  const isEditing = activeEditAction !== null;

  const renderEditButton = (
    action: EditAction,
    icon: keyof typeof Ionicons.glyphMap,
  ) => (
    <TouchableOpacity
      className="p-2 rounded-full"
      onPress={() => runImageEdit(action)}
      disabled={isEditing}
      activeOpacity={0.75}
    >
      {activeEditAction === action ? (
        <ActivityIndicator size="small" color="white" />
      ) : (
        <Ionicons
          name={icon}
          size={24}
          color={isEditing ? "rgba(255,255,255,0.35)" : "white"}
        />
      )}
    </TouchableOpacity>
  );

  const updateImageAsset = (
    result: { uri: string; width: number; height: number },
    suffix: string,
  ) => {
    setPreviewAsset({
      ...imageAsset,
      uri: result.uri,
      width: result.width,
      height: result.height,
      fileName: `${suffix}-${Date.now()}.jpg`,
      mimeType: "image/jpeg",
    });
  };

  const getImageSize = () =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      if (imageAsset.width > 0 && imageAsset.height > 0) {
        resolve({
          width: Math.floor(imageAsset.width),
          height: Math.floor(imageAsset.height),
        });
        return;
      }

      Image.getSize(
        imageAsset.uri,
        (width, height) => resolve({ width, height }),
        reject,
      );
    });

  const buildEditActions = (
    action: EditAction,
    dimensions: { width: number; height: number },
  ): Action[] => {
    const maxEdge = Math.max(dimensions.width, dimensions.height);
    const scale = maxEdge > MAX_EDIT_EDGE ? MAX_EDIT_EDGE / maxEdge : 1;
    const width = Math.max(1, Math.floor(dimensions.width * scale));
    const height = Math.max(1, Math.floor(dimensions.height * scale));
    const actions: Action[] = [];

    if (scale < 1) {
      actions.push({ resize: { width, height } });
    }

    if (action === "crop") {
      const size = Math.max(1, Math.min(width, height));
      actions.push({
        crop: {
          originX: Math.max(0, Math.floor((width - size) / 2)),
          originY: Math.max(0, Math.floor((height - size) / 2)),
          width: size,
          height: size,
        },
      });
      return actions;
    }

    actions.push(
      action === "rotate" ? { rotate: 90 } : { flip: FlipType.Horizontal },
    );
    return actions;
  };

  const runImageEdit = async (action: EditAction) => {
    if (!isImage || !canEditImage) {
      Alert.alert("Image not ready", "This image cannot be edited yet.");
      return;
    }

    setActiveEditAction(action);
    try {
      const dimensions = await getImageSize();
      const result = await withTimeout(
        manipulateAsync(imageAsset.uri, buildEditActions(action, dimensions), {
          compress: 0.88,
          format: SaveFormat.JPEG,
        }),
        EDIT_TIMEOUT_MS,
      );
      updateImageAsset(result, action);
    } catch (error) {
      console.warn("Image edit failed:", error);
      Alert.alert(
        "Edit failed",
        "Could not edit this image. Please try another photo.",
      );
    } finally {
      setActiveEditAction(null);
    }
  };

  const replaceCurrentMedia = async () => {
    try {
      if (isImage) {
        const permission =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("Permission Required", "Camera roll access is needed.");
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.9,
          allowsMultipleSelection: false,
          selectionLimit: 1,
        });

        if (!result.canceled && result.assets?.length) {
          setPreviewAsset(result.assets[0]);
        }
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets?.length) {
        setPreviewAsset(result.assets[0]);
      }
    } catch (error) {
      console.warn("Media replacement failed:", error);
      Alert.alert("Upload failed", "Could not pick a new file.");
    }
  };

  // Format file size
  const formatSize = (bytes?: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-black">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 z-10">
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>

            {isImage && (
              <View className="flex-row gap-4">
                {renderEditButton("crop", "crop-outline")}
                {renderEditButton("rotate", "refresh-outline")}
                {renderEditButton("flip", "swap-horizontal-outline")}
              </View>
            )}
          </View>

          {/* Main Content */}
          <View className="flex-1 justify-center items-center">
            {isImage ? (
              <>
                <Image
                  source={{ uri: asset.uri }}
                  className="w-full h-full"
                  resizeMode="contain"
                />
                {isEditing && (
                  <View className="absolute inset-0 bg-black/45 items-center justify-center">
                    <ActivityIndicator size="large" color="#FF4F18" />
                    <AppText className="text-white mt-3">
                      {`Applying ${activeEditAction}...`}
                    </AppText>
                  </View>
                )}
              </>
            ) : (
              <View className="items-center bg-gray-900/50 p-8 rounded-3xl border border-gray-800">
                <Ionicons name="document-text" size={80} color="#FF4F18" />
                <AppText
                  weight="bold"
                  className="text-white mt-4 text-center px-4"
                  numberOfLines={2}
                >
                  {(asset as DocumentPicker.DocumentPickerAsset).name}
                </AppText>
                <AppText className="text-gray-400 mt-2">
                  {formatSize(
                    (asset as DocumentPicker.DocumentPickerAsset).size,
                  )}
                </AppText>
              </View>
            )}
          </View>

          {/* Bottom Caption Bar */}
          <View className="p-4 bg-black/50">
            <View className="flex-row items-end bg-gray-900 rounded-3xl px-4 py-2 border border-gray-800">
              <TouchableOpacity
                className="p-2"
                onPress={replaceCurrentMedia}
                disabled={isEditing}
              >
                <Ionicons name="add" size={24} color="#FF4F18" />
              </TouchableOpacity>

              <TextInput
                value={caption}
                onChangeText={setCaption}
                placeholder="Add a caption..."
                placeholderTextColor="#9ca3af"
                multiline
                className="flex-1 text-white text-[16px] px-2 min-h-[40px] max-h-[120px]"
                style={{ textAlignVertical: "center" }}
              />

              <TouchableOpacity
                onPress={handleSend}
                disabled={isEditing}
                className="bg-[#FF4F18] w-12 h-12 rounded-full items-center justify-center ml-2"
              >
                <Ionicons name="send" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
