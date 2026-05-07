import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  View,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Svg, Path } from "react-native-svg";
import AppText from "@/components/ui/AppText";
import { ChatMessage } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import LinkPreview from "./LinkPreview";
import AudioPlayer from "./AudioPlayer";
import { resolveImageUrl } from "@/utils/imageUtils";

// Reliable link opener — ensures scheme is always present
const openUrl = async (url: string) => {
  try {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    await Linking.openURL(finalUrl);
  } catch (e) {
    console.warn("Could not open URL:", url, e);
  }
};

const CHAT_COLORS = {
  sentBubble: "#262626",
  sentBorder: "transparent",
  receivedBubble: "#FFFFFF",
  receivedBorder: "#E5E7EB",
  receivedText: "#1F2937",
  sentText: "#FFFFFF",
  receivedMeta: "#9CA3AF",
  sentMeta: "rgba(255,255,255,0.50)",
  brandAccent: "#FF4F18",
  readReceipt: "#38BDF8",
};

const BUBBLE_RADIUS = 14;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

interface MessageBubbleProps {
  message: ChatMessage;
  isSameSenderAsNext?: boolean;
  isSameSenderAsPrev?: boolean;
  onReply?: (message: ChatMessage) => void;
  onReplyPress?: (messageId: string) => void;
  onImagePress?: (imageUrl: string) => void;
  searchQuery?: string;
  isFlashing?: boolean;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: (messageId: string) => void;
  onLongPress?: (message: ChatMessage) => void;
}

const MessageTail = ({ isMe, color }: { isMe: boolean; color: string }) => (
  <View style={isMe ? styles.tailRight : styles.tailLeft}>
    <Svg width="11" height="16" viewBox="0 0 11 16" fill="none">
      <Path
        d={
          isMe
            ? "M0 0 L11 0 C11 0 11 3.5 11 3.5 C11 7.5 0 9 0 16 V0 Z"
            : "M11 0 L0 0 C0 0 0 3.5 0 3.5 C0 7.5 11 9 11 16 V0 Z"
        }
        fill={color}
      />
    </Svg>
  </View>
);

const MAX_IMAGE_WIDTH = 260;

const ImageWithAspect = React.memo(({ uri }: { uri: string }) => {
  const [dims, setDims] = useState<{ width: number; height: number } | null>(
    null,
  );

  const imgWidth = MAX_IMAGE_WIDTH;
  const imgHeight = dims
    ? Math.round((dims.height / dims.width) * MAX_IMAGE_WIDTH)
    : 180;

  return (
    <Image
      source={{ uri }}
      style={{
        width: imgWidth,
        height: Math.min(imgHeight, 350),
        borderRadius: 14,
        marginBottom: 2,
        backgroundColor: "#F3F4F6",
      }}
      contentFit="cover"
      transition={200}
      onLoad={(e) => {
        const { width, height } = (e as any).source ?? {};
        if (width && height) setDims({ width, height });
      }}
    />
  );
});
ImageWithAspect.displayName = "ImageWithAspect";

const MessageBubble = React.memo(
  ({
    message,
    isSameSenderAsNext,
    isSameSenderAsPrev,
    onReply,
    onReplyPress,
    onImagePress,
    searchQuery,
    isFlashing,
    isSelectionMode,
    isSelected,
    onSelect,
    onLongPress,
  }: MessageBubbleProps) => {
    const { user } = useAuthStore();
    const { width: windowWidth } = useWindowDimensions();

    const flashAnim = useRef(new Animated.Value(0)).current;
    const linkTappedRef = useRef(false);
    useEffect(() => {
      if (isFlashing) {
        flashAnim.setValue(0);
        Animated.sequence([
          Animated.timing(flashAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: false,
          }),
          Animated.delay(600),
          Animated.timing(flashAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }, [flashAnim, isFlashing]);

    const flashBackground = flashAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(255,79,24,0)", "rgba(255,79,24,0.3)"],
    });

    const senderId =
      typeof message.sender === "object" ? message.sender?.id : message.sender;
    const isMe = String(senderId || "") === String(user?.id || "");
    const messageTextStyle = [
      styles.messageText,
      { color: isMe ? CHAT_COLORS.sentText : CHAT_COLORS.receivedText },
    ];
    const linkTextStyle = [
      styles.messageLink,
      { color: isMe ? "#93C5FD" : "#2563EB" },
    ];

    const handleLinkPress = useCallback((url: string) => {
      linkTappedRef.current = true;
      setTimeout(() => {
        linkTappedRef.current = false;
      }, 300);
      openUrl(url);
    }, []);

    const renderContent = (content: string) => {
      if (typeof content !== "string") return null;

      if (
        searchQuery &&
        content.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        const parts = content.split(
          new RegExp(`(${escapeRegExp(searchQuery)})`, "gi"),
        );
        return (
          <AppText style={messageTextStyle}>
            {parts.map((part, index) =>
              part.toLowerCase() === searchQuery.toLowerCase() ? (
                <AppText key={index} style={styles.searchHighlight}>
                  {part}
                </AppText>
              ) : (
                <AppText key={index} style={messageTextStyle}>
                  {part}
                </AppText>
              ),
            )}
          </AppText>
        );
      }

      const URL_REGEX =
        /((?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;
      const parts = content.split(URL_REGEX);

      return (
        <AppText style={messageTextStyle}>
          {parts.map((part, index) => {
            if (part.match(URL_REGEX)) {
              return (
                <AppText
                  key={index}
                  onPress={() => handleLinkPress(part)}
                  style={linkTextStyle}
                >
                  {part}
                </AppText>
              );
            }
            return (
              <AppText key={index} style={messageTextStyle}>
                {part}
              </AppText>
            );
          })}
        </AppText>
      );
    };

    const formatTime = (timestamp: string) => {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    };

    const getMessageStatus = ():
      | "sending"
      | "sent"
      | "delivered"
      | "read"
      | "failed" => {
      if (message.send_failed) return "failed";
      const isOptimistic =
        typeof message.id === "string" && message.id.startsWith("temp-");
      if (isOptimistic) return "sending";
      if (message.is_read) return "read";
      if (message.delivered_at) return "delivered";
      return "sent";
    };

    const renderStatusIcon = () => {
      if (!isMe) return null;
      const status = getMessageStatus();
      const iconProps = {
        sending: {
          name: "time-outline" as const,
          color: CHAT_COLORS.sentMeta,
          size: 12,
        },
        sent: {
          name: "checkmark" as const,
          color: CHAT_COLORS.sentMeta,
          size: 12,
        },
        delivered: {
          name: "checkmark-done" as const,
          color: CHAT_COLORS.sentMeta,
          size: 13,
        },
        read: {
          name: "checkmark-done" as const,
          color: CHAT_COLORS.readReceipt,
          size: 13,
        },
        failed: { name: "alert-circle" as const, color: "#F87171", size: 12 },
      };
      const icon = iconProps[status];
      return (
        <Ionicons
          name={icon.name}
          size={icon.size}
          color={icon.color}
          style={styles.statusIcon}
        />
      );
    };

    const isTextBubble = message.message_type === "text";
    const textBubbleMinWidth = Math.round(windowWidth / 3);
    const bubbleStyle = useMemo(
      () => [
        styles.bubbleBase,
        {
          minWidth: isTextBubble ? textBubbleMinWidth : undefined,
          backgroundColor: isMe
            ? CHAT_COLORS.sentBubble
            : CHAT_COLORS.receivedBubble,
          borderTopLeftRadius: !isMe && !isSameSenderAsNext ? 4 : BUBBLE_RADIUS,
          borderTopRightRadius: isMe && !isSameSenderAsNext ? 4 : BUBBLE_RADIUS,
          borderWidth: 0.5,
          borderColor: isMe
            ? CHAT_COLORS.sentBorder
            : CHAT_COLORS.receivedBorder,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        },
      ],
      [isMe, isSameSenderAsNext, isTextBubble, textBubbleMinWidth],
    );

    const handleLongPress = useCallback(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!isSelectionMode) {
        onLongPress?.(message);
      } else {
        onSelect?.(String(message.id));
      }
    }, [isSelectionMode, onLongPress, onSelect, message]);

    const handleTap = useCallback(() => {
      if (linkTappedRef.current) return;
      if (isSelectionMode) {
        Haptics.selectionAsync();
        onSelect?.(String(message.id));
      }
    }, [isSelectionMode, onSelect, message.id]);

    const longPressGesture = Gesture.LongPress()
      .minDuration(180)
      .onStart(() => {
        "worklet";
        runOnJS(handleLongPress)();
      });

    const tapGesture = Gesture.Tap().onEnd(() => {
      "worklet";
      runOnJS(handleTap)();
    });

    const combinedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

    let displayContent = message.content;
    if (
      displayContent &&
      (displayContent.startsWith("{") || displayContent.startsWith("["))
    ) {
      try {
        const parsed = JSON.parse(displayContent);
        if (parsed.message) displayContent = parsed.message;
        else if (parsed.text) displayContent = parsed.text;
      } catch {}
    }

    const showText =
      message.message_type === "text" ||
      (message.message_type !== "audio" &&
        displayContent &&
        !["📷 Photo", "🎤 Audio", "🎤 Voice Message", "📄 Document"].includes(
          displayContent,
        ));

    return (
      <Animated.View
        style={[
          styles.outerRow,
          { justifyContent: isMe ? "flex-end" : "flex-start" },
          isSameSenderAsNext ? { marginTop: 0 } : { marginTop: 1 },
          isSameSenderAsPrev ? { marginBottom: 0 } : { marginBottom: 3 },
          isSelected ? styles.selectedRow : undefined,
          {
            backgroundColor: isSelected
              ? "rgba(255,79,24,0.12)"
              : (flashBackground as any),
          },
        ]}
      >
        <View style={styles.bubbleWrapper}>
          <GestureDetector gesture={combinedGesture}>
            <View style={bubbleStyle} className="flex-col">
              {message.parent_message && (
                <TouchableOpacity
                  activeOpacity={0.6}
                  disabled={isSelectionMode}
                  onPress={() =>
                    message.parent_message?.id &&
                    onReplyPress?.(message.parent_message.id.toString())
                  }
                  style={[
                    styles.replyPreview,
                    {
                      backgroundColor: isMe
                        ? "rgba(255,255,255,0.10)"
                        : "#F6F8FA",
                      borderLeftColor: isMe
                        ? "rgba(255,255,255,0.35)"
                        : CHAT_COLORS.brandAccent,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <AppText
                      weight="bold"
                      style={[
                        styles.replyPreviewName,
                        {
                          color: isMe
                            ? CHAT_COLORS.sentText
                            : CHAT_COLORS.brandAccent,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {message.parent_message.sender?.full_name ||
                        message.parent_message.sender?.username ||
                        "Reply"}
                    </AppText>
                    <AppText
                      style={[
                        styles.replyPreviewText,
                        {
                          color: isMe
                            ? "rgba(255,255,255,0.70)"
                            : CHAT_COLORS.receivedMeta,
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {message.parent_message.message_type === "image"
                        ? "📷 Photo"
                        : message.parent_message.message_type === "audio"
                          ? "🎤 Voice Message"
                          : message.parent_message.message_type === "document"
                            ? "📄 Document"
                            : message.parent_message.content}
                    </AppText>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={
                      isMe
                        ? "rgba(255,255,255,0.55)"
                        : CHAT_COLORS.receivedMeta
                    }
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              )}

              {message.message_type === "image" && message.attachment && (
                <TouchableOpacity
                  activeOpacity={0.9}
                  disabled={isSelectionMode}
                  onPress={() =>
                    onImagePress?.(resolveImageUrl(message.attachment!) || "")
                  }
                >
                  <ImageWithAspect
                    uri={resolveImageUrl(message.attachment!) || ""}
                  />
                </TouchableOpacity>
              )}

              {message.message_type === "audio" && message.attachment && (
                <View
                  pointerEvents={isSelectionMode ? "none" : "auto"}
                  style={styles.audioBlock}
                >
                  <AudioPlayer
                    key={message.attachment}
                    uri={resolveImageUrl(message.attachment) || ""}
                    isMe={isMe}
                  />
                </View>
              )}

              {message.message_type === "document" && message.attachment && (
                <TouchableOpacity
                  disabled={isSelectionMode}
                  style={[
                    styles.documentPreview,
                    {
                      backgroundColor: isMe
                        ? "rgba(255,255,255,0.10)"
                        : "#F6F8FA",
                    },
                  ]}
                  onPress={() =>
                    message.attachment && Linking.openURL(message.attachment)
                  }
                >
                  <View className="w-10 h-10 bg-primary/10 rounded-xl items-center justify-center mr-3">
                    <Ionicons name="document-text" size={22} color="#FF4F18" />
                  </View>
                  <View className="flex-1">
                    <AppText
                      weight="bold"
                      style={[
                        styles.documentTitle,
                        {
                          color: isMe
                            ? CHAT_COLORS.sentText
                            : CHAT_COLORS.receivedText,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {message.attachment.split("/").pop()}
                    </AppText>
                    <AppText
                      style={[
                        styles.documentMeta,
                        {
                          color: isMe
                            ? "rgba(255,255,255,0.55)"
                            : CHAT_COLORS.receivedMeta,
                        },
                      ]}
                    >
                      Document
                    </AppText>
                  </View>
                </TouchableOpacity>
              )}

              {message.link_url && (
                <View
                  className="mb-2"
                  pointerEvents={isSelectionMode ? "none" : "auto"}
                >
                  <LinkPreview
                    url={message.link_url}
                    title={message.link_title ?? undefined}
                    description={message.link_description ?? undefined}
                    image={message.link_image ?? undefined}
                    isMe={isMe}
                  />
                </View>
              )}

              <View
                style={styles.contentContainer}
                pointerEvents={isSelectionMode ? "none" : "auto"}
              >
                {showText && (
                  <View style={styles.textBlock}>
                    {renderContent(displayContent)}
                  </View>
                )}
                <View
                  style={[
                    styles.metadataContainer,
                    showText
                      ? styles.metadataAfterText
                      : styles.metadataStandalone,
                  ]}
                >
                  <AppText
                    style={[
                      styles.metadataText,
                      {
                        color: isMe
                          ? CHAT_COLORS.sentMeta
                          : CHAT_COLORS.receivedMeta,
                      },
                    ]}
                  >
                    {formatTime(message.created_at)}
                  </AppText>
                  {isMe && renderStatusIcon()}
                </View>
              </View>
            </View>
          </GestureDetector>

          {!isSameSenderAsNext && (
            <MessageTail
              isMe={isMe}
              color={isMe ? CHAT_COLORS.sentBubble : CHAT_COLORS.receivedBubble}
            />
          )}
        </View>
      </Animated.View>
    );
  },
  (prev, next) =>
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.updated_at === next.message.updated_at &&
    prev.message.is_read === next.message.is_read &&
    prev.message.send_failed === next.message.send_failed &&
    prev.isSameSenderAsNext === next.isSameSenderAsNext &&
    prev.isSameSenderAsPrev === next.isSameSenderAsPrev &&
    prev.isFlashing === next.isFlashing &&
    prev.isSelectionMode === next.isSelectionMode &&
    prev.isSelected === next.isSelected,
);

const styles = StyleSheet.create({
  outerRow: {
    flexDirection: "row",
    paddingHorizontal: 14,
  },
  bubbleWrapper: {
    position: "relative",
    maxWidth: "82%",
  },
  bubbleBase: {
    borderBottomLeftRadius: BUBBLE_RADIUS,
    borderBottomRightRadius: BUBBLE_RADIUS,
    paddingHorizontal: 8,
    paddingVertical: 7,
  },
  tailRight: {
    position: "absolute",
    top: 0,
    right: -8,
    width: 11,
    height: 16,
    zIndex: 10,
  },
  tailLeft: {
    position: "absolute",
    top: 0,
    left: -8,
    width: 11,
    height: 16,
    zIndex: 10,
  },
  selectedRow: {
    backgroundColor: "rgba(255, 79, 24, 0.12)",
    marginHorizontal: -14,
    paddingHorizontal: 14,
  },
  statusIcon: { marginLeft: 3 },
  messageText: {
    fontSize: 15.5,
    lineHeight: 20,
  },
  messageLink: {
    textDecorationLine: "underline",
  },
  searchHighlight: {
    backgroundColor: "#FFF3B0",
    color: CHAT_COLORS.receivedText,
    fontSize: 15.5,
    lineHeight: 20,
  },
  textBlock: {
    marginBottom: 0,
    paddingHorizontal: 4,
    paddingVertical: 0,
  },
  replyPreview: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: 8,
    borderLeftWidth: 3,
  },
  replyPreviewName: {
    fontSize: 12,
  },
  replyPreviewText: {
    fontSize: 12,
    marginTop: 2,
  },
  documentPreview: {
    flexDirection: "row",
    alignItems: "center",
    padding: 7,
    borderRadius: 16,
    marginBottom: 4,
    minWidth: 220,
  },
  documentTitle: {
    fontSize: 13,
  },
  documentMeta: {
    fontSize: 11,
    textTransform: "uppercase",
  },
  metadataContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  metadataAfterText: {
    marginTop: -3,
  },
  metadataStandalone: {
    marginTop: 0,
  },
  metadataText: {
    fontSize: 10,
    fontWeight: "700",
  },
  contentContainer: {
    zIndex: 20,
    minWidth: 40,
    paddingHorizontal: 2,
    paddingVertical: 1,
  },
  audioBlock: {
    paddingVertical: 0,
  },
});
MessageBubble.displayName = "MessageBubble";

export default MessageBubble;
