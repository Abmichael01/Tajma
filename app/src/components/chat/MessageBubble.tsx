import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { View, TouchableOpacity, Linking, StyleSheet, Animated } from "react-native";
import { Image } from "expo-image";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { runOnJS } from 'react-native-reanimated';
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Svg, Path } from 'react-native-svg';
import AppText from "@/components/ui/AppText";
import { ChatMessage } from "@/api/types";
import { useAuthStore } from "@/store/authStore";
import LinkPreview from "./LinkPreview";
import AudioPlayer from "./AudioPlayer";
import { API_BASE_URL } from "@/api/apiClient";
import { resolveImageUrl } from "@/utils/imageUtils";

// Reliable link opener — ensures scheme is always present
const openUrl = async (url: string) => {
  try {
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) finalUrl = `https://${finalUrl}`;
    await Linking.openURL(finalUrl);
  } catch (e) {
    console.warn('Could not open URL:', url, e);
  }
};

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
        d={isMe
          ? "M0 0 L11 0 C11 0 11 3.5 11 3.5 C11 7.5 0 9 0 16 V0 Z"
          : "M11 0 L0 0 C0 0 0 3.5 0 3.5 C0 7.5 11 9 11 16 V0 Z"
        }
        fill={color}
      />
    </Svg>
  </View>
);

const MAX_IMAGE_WIDTH = 240;

const ImageWithAspect = React.memo(({ uri }: { uri: string }) => {
  const [dims, setDims] = useState<{ width: number; height: number } | null>(null);

  const imgWidth = dims ? MAX_IMAGE_WIDTH : MAX_IMAGE_WIDTH;
  const imgHeight = dims ? Math.round((dims.height / dims.width) * MAX_IMAGE_WIDTH) : MAX_IMAGE_WIDTH;

  return (
    <Image
      source={{ uri }}
      style={{
        width: imgWidth,
        height: imgHeight,
        borderRadius: 8,
        marginBottom: 2,
        backgroundColor: '#E5E7EB',
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

const MessageBubble = React.memo(({
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
  onLongPress
}: MessageBubbleProps) => {
  const { user } = useAuthStore();

  // ── FLASH ANIMATION on reply jump ────────────────────────────────────────
  // When isFlashing becomes true, animate background: transparent → highlight → transparent
  const flashAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isFlashing) {
      flashAnim.setValue(0);
      Animated.sequence([
        Animated.timing(flashAnim, { toValue: 1, duration: 150, useNativeDriver: false }),
        Animated.delay(600),
        Animated.timing(flashAnim, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]).start();
    }
  }, [isFlashing]);

  const flashBackground = flashAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255,79,24,0)', 'rgba(255,79,24,0.3)'],
  });

  if (!message || !message.sender) return null;

  const senderId = typeof message.sender === 'object' ? message.sender?.id : message.sender;
  const isMe = String(senderId || '') === String(user?.id || '');

  // ── LINK TAPPING ─────────────────────────────────────────────────────────
  // We track if a link was just tapped so the gesture handler ignores that touch.
  const linkTappedRef = useRef(false);

  const handleLinkPress = useCallback((url: string) => {
    // Mark that a link was tapped — prevents the tap gesture from firing selection
    linkTappedRef.current = true;
    setTimeout(() => { linkTappedRef.current = false; }, 300);
    openUrl(url);
  }, []);

  const renderContent = (content: string) => {
    if (typeof content !== 'string') return null;

    if (searchQuery && content.toLowerCase().includes(searchQuery.toLowerCase())) {
      const parts = content.split(new RegExp(`(${searchQuery})`, 'gi'));
      return (
        <AppText className={`text-[16px] leading-[22px] ${isMe ? 'text-white' : 'text-gray-900'} ${message.attachment ? 'mt-1' : ''}`}>
          {parts.map((part, index) =>
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <AppText key={index} className="bg-yellow-300 text-black font-bold">{part}</AppText>
            ) : (
              <AppText key={index}>{part}</AppText>
            )
          )}
        </AppText>
      );
    }

    const URL_REGEX = /((?:https?:\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*))/gi;
    const parts = content.split(URL_REGEX);

    return (
      <AppText className={`text-[16px] leading-[22px] ${isMe ? 'text-white' : 'text-gray-900'} ${message.attachment ? 'mt-1' : ''}`}>
        {parts.map((part, index) => {
          if (part.match(URL_REGEX)) {
            return (
              <AppText
                key={index}
                onPress={() => handleLinkPress(part)}
                style={{ textDecorationLine: 'underline', color: isMe ? '#60A5FA' : '#2563EB' }}
              >
                {part}
              </AppText>
            );
          }
          return <AppText key={index} className={isMe ? 'text-white' : 'text-gray-900'}>{part}</AppText>;
        })}
      </AppText>
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit', hour12: false,
    });
  };

  const getMessageStatus = (): 'sending' | 'sent' | 'delivered' | 'read' | 'failed' => {
    if (message.send_failed) return 'failed';
    const isOptimistic = typeof message.id === 'string' && message.id.startsWith('temp-');
    if (isOptimistic) return 'sending';
    if (message.is_read) return 'read';
    if (message.delivered_at) return 'delivered';
    return 'sent';
  };

  const renderStatusIcon = () => {
    if (!isMe) return null;
    const status = getMessageStatus();
    const iconProps = {
      sending: { name: 'time-outline' as const, color: 'rgba(255,255,255,0.6)', size: 13 },
      sent: { name: 'checkmark' as const, color: 'rgba(255,255,255,0.6)', size: 13 },
      delivered: { name: 'checkmark-done' as const, color: 'rgba(255,255,255,0.6)', size: 13 },
      read: { name: 'checkmark-done' as const, color: '#34B7F1', size: 13 },
      failed: { name: 'alert-circle' as const, color: '#f87171', size: 13 },
    };
    const icon = iconProps[status];
    return <Ionicons name={icon.name} size={icon.size} color={icon.color} style={styles.statusIcon} />;
  };

  const bubbleStyle = useMemo(() => ([
    styles.bubbleBase,
    {
      backgroundColor: isMe ? '#2D2D2D' : '#FFFFFF',
      borderTopLeftRadius: (!isMe && !isSameSenderAsNext) ? 4 : 18,
      borderTopRightRadius: (isMe && !isSameSenderAsNext) ? 4 : 18,
      borderWidth: isMe ? 0 : 1,
      borderColor: isMe ? 'transparent' : '#f3f4f6',
    }
  ]), [isMe, isSameSenderAsNext]);

  // ── GESTURES ──────────────────────────────────────────────────────────────
  const handleLongPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isSelectionMode) {
      onLongPress?.(message);
    } else {
      onSelect?.(String(message.id));
    }
  }, [isSelectionMode, onLongPress, onSelect, message]);

  const handleTap = useCallback(() => {
    // ── FIX: ignore tap if a link was just pressed ────────────────────────
    if (linkTappedRef.current) return;
    if (isSelectionMode) {
      Haptics.selectionAsync();
      onSelect?.(String(message.id));
    }
  }, [isSelectionMode, onSelect, message.id]);

  const longPressGesture = Gesture.LongPress()
    .minDuration(150)
    .onStart(() => { 'worklet'; runOnJS(handleLongPress)(); });

  const tapGesture = Gesture.Tap()
    .onEnd(() => { 'worklet'; runOnJS(handleTap)(); });

  const combinedGesture = Gesture.Exclusive(longPressGesture, tapGesture);

  let displayContent = message.content;
  if (displayContent && (displayContent.startsWith('{') || displayContent.startsWith('['))) {
    try {
      const parsed = JSON.parse(displayContent);
      if (parsed.message) displayContent = parsed.message;
      else if (parsed.text) displayContent = parsed.text;
    } catch (e) { }
  }

  const showText = message.message_type === 'text' ||
    (message.message_type !== 'audio' && displayContent &&
      !['📷 Photo', '🎤 Audio', '🎤 Voice Message', '📄 Document'].includes(displayContent));

  return (
    <Animated.View
      style={[
        styles.outerRow,
        { justifyContent: 'flex-end' },
        isSameSenderAsNext ? { marginTop: 0 } : { marginTop: 1 },
        isSameSenderAsPrev ? { marginBottom: 0 } : { marginBottom: 2 },
        // Selection highlight — full width tinted row
        isSelected ? styles.selectedRow : undefined,
        // Flash highlight — animated
        { backgroundColor: isSelected ? 'rgba(255,79,24,0.15)' : flashBackground as any },
      ]}
    >
      <View style={styles.bubbleWrapper}>
        <GestureDetector gesture={combinedGesture}>
          <View style={bubbleStyle} className="px-3 py-1.5 flex-col">

            {message.parent_message && (
              <TouchableOpacity
                activeOpacity={0.7}
                disabled={isSelectionMode}
                onPress={() => message.parent_message?.id && onReplyPress?.(message.parent_message.id.toString())}
                className={`mb-1 p-1.5 rounded-lg border-l-4 ${isMe ? 'bg-white/10 border-white/40' : 'bg-gray-50 border-primary'}`}
              >
                <AppText weight="bold" className={`text-[12px] ${isMe ? 'text-white' : 'text-primary'}`}>
                  {message.parent_message.sender?.full_name || message.parent_message.sender?.username || "Reply"}
                </AppText>
                <AppText className={`text-[12px] ${isMe ? 'text-white/70' : 'text-gray-500'}`} numberOfLines={2}>
                  {message.parent_message.message_type === 'image' ? '📷 Photo' :
                    message.parent_message.message_type === 'audio' ? '🎤 Voice Message' :
                      message.parent_message.message_type === 'document' ? '📄 Document' :
                        message.parent_message.content}
                </AppText>
              </TouchableOpacity>
            )}

            {message.message_type === 'image' && message.attachment && (
              <TouchableOpacity
                activeOpacity={0.9}
                disabled={isSelectionMode}
                onPress={() => onImagePress?.(resolveImageUrl(message.attachment!) || '')}
              >
                <ImageWithAspect uri={resolveImageUrl(message.attachment!) || ''} />
              </TouchableOpacity>
            )}

            {message.message_type === 'audio' && message.attachment && (
              <View pointerEvents={isSelectionMode ? 'none' : 'auto'}>
                <AudioPlayer 
                  key={message.attachment} 
                  uri={resolveImageUrl(message.attachment) || ''} 
                  isMe={isMe} 
                />
              </View>
            )}

            {message.message_type === 'document' && message.attachment && (
              <TouchableOpacity
                disabled={isSelectionMode}
                className={`flex-row items-center p-1.5 rounded-xl mb-1 min-w-[200px] ${isMe ? 'bg-white/10' : 'bg-gray-50'}`}
                onPress={() => message.attachment && Linking.openURL(message.attachment)}
              >
                <View className="w-9 h-9 bg-primary/20 rounded-lg items-center justify-center mr-3">
                  <Ionicons name="document-text" size={20} color="#FF4F18" />
                </View>
                <View className="flex-1">
                  <AppText weight="bold" className={`text-sm ${isMe ? 'text-white' : 'text-gray-900'}`} numberOfLines={1}>
                    {message.attachment.split('/').pop()}
                  </AppText>
                  <AppText className={`text-xs ${isMe ? 'text-white/60' : 'text-gray-500'}`}>Document</AppText>
                </View>
              </TouchableOpacity>
            )}

            {message.link_url && (
              <View className="mb-1" pointerEvents={isSelectionMode ? 'none' : 'auto'}>
                <LinkPreview
                  url={message.link_url}
                  title={message.link_title ?? undefined}
                  description={message.link_description ?? undefined}
                  image={message.link_image ?? undefined}
                  isMe={isMe}
                />
              </View>
            )}

            <View style={styles.contentContainer} pointerEvents={isSelectionMode ? 'none' : 'auto'}>
              {showText && (
                <View style={{ marginBottom: 0 }}>
                  <AppText className={`text-[16px] leading-[22px] ${isMe ? 'text-white' : 'text-gray-900'} ${message.attachment ? 'mt-1' : ''}`}>
                    {renderContent(displayContent)}
                    {'   '.repeat(4)}
                  </AppText>
                </View>
              )}
              <View style={styles.metadataContainer}>
                <AppText className={`text-[11px] ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                  {formatTime(message.created_at)}
                </AppText>
                {isMe && renderStatusIcon()}
              </View>
            </View>

          </View>
        </GestureDetector>

        {!isSameSenderAsNext && (
          <MessageTail isMe={isMe} color={isMe ? '#2D2D2D' : '#FFFFFF'} />
        )}
      </View>
    </Animated.View>
  );
}, (prev, next) =>
  prev.message.id === next.message.id &&
  prev.message.content === next.message.content &&
  prev.message.updated_at === next.message.updated_at &&
  prev.message.is_read === next.message.is_read &&
  prev.message.send_failed === next.message.send_failed &&
  prev.isSameSenderAsNext === next.isSameSenderAsNext &&
  prev.isSameSenderAsPrev === next.isSameSenderAsPrev &&
  prev.isFlashing === next.isFlashing &&
  prev.isSelectionMode === next.isSelectionMode &&
  prev.isSelected === next.isSelected
);

const styles = StyleSheet.create({
  outerRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 1,
  },
  bubbleWrapper: {
    position: 'relative',
    maxWidth: '85%',
  },
  bubbleBase: {
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent', // Overridden by logic if needed, but here to maintain structural spacing
  },
  tailRight: {
    position: 'absolute', top: 0, right: -9,
    width: 11, height: 16, zIndex: 10,
  },
  tailLeft: {
    // Other user bubble is on the right, but its tail is on the left of the bubble
    position: 'absolute', top: 0, left: -9,
    width: 11, height: 16, zIndex: 10,
  },
  selectedRow: {
    backgroundColor: 'rgba(255, 79, 24, 0.15)',
    marginHorizontal: -12,
    paddingHorizontal: 12,
  },
  statusIcon: { marginLeft: 3 },
  metadataContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 1,
    backgroundColor: 'transparent',
  },
  contentContainer: { zIndex: 20 },
});

export default MessageBubble;