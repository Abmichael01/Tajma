import { useCallback, useMemo, useState, useEffect, useRef, memo } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  ViewToken,
  StyleSheet,
  InteractionManager,
  Platform,
} from "react-native";
import MessageBubble from "@/components/chat/MessageBubble";
import SwipeableMessage from "@/components/chat/SwipeableMessage";
import TypingIndicator from "@/components/chat/TypingIndicator";
import DateBubble from "./DateBubble";
import { ChatMessage } from "@/api/types";
import { useAuthStore } from "@/store/authStore";

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: {
    paddingHorizontal: 0,
    paddingTop: 8, // inverted -> gap at visual bottom
    paddingBottom: 14, // inverted -> gap at visual top
  },
  row: { paddingVertical: 1 },
  loaderTop: { paddingVertical: 16, alignItems: "center" },
  typingWrapper: { paddingTop: 4, paddingBottom: 4 },
});

interface MessageListProps {
  /** NEWEST first — index 0 = newest. Pass [...messages].reverse() from parent */
  messages: ChatMessage[];
  isParticipantTyping: boolean;
  otherParticipant: any;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  flatListRef: any;
  onScroll?: (event: any) => void;
  onEndReached: () => void;
  onViewableItemsChanged: ({
    viewableItems,
  }: {
    viewableItems: ViewToken[];
  }) => void;
  onImagePress?: (imageUrl: string) => void;
  onReply?: (message: ChatMessage) => void;
  onLongPress?: (message: ChatMessage) => void;
  searchQuery?: string;
  currentMatchIndex?: number;
  onMatchesFound?: (count: number) => void;
  isSelectionMode?: boolean;
  selectedMessageIds?: Set<string>;
  onSelectionChange?: (messageId: string) => void;
}

const getSenderId = (message: any) => {
  const sender = message?.sender;
  return typeof sender === "object" ? sender?.id : sender;
};

const isSameSender = (a: any, b: any) => {
  if (!a || !b || a.type || b.type) return false;
  const aSender = getSenderId(a);
  const bSender = getSenderId(b);
  return (
    aSender != null && bSender != null && String(aSender) === String(bSender)
  );
};

const MessageRow = memo(
  ({
    item,
    isSameSenderAsPrev,
    isSameSenderAsNext,
    user,
    onReply,
    onImagePress,
    isFlashing,
    searchQuery,
    onReplyPress,
    isSelectionMode,
    isSelected,
    onSelect,
    onLongPress,
  }: any) => {
    if (!item?.sender) return null;

    const senderId = getSenderId(item);
    const isMe = String(senderId ?? "") === String(user?.id ?? "");

    return (
      <View style={styles.row}>
        <SwipeableMessage onSwipe={() => onReply?.(item)} isMe={isMe}>
          <MessageBubble
            message={item}
            isSameSenderAsPrev={isSameSenderAsPrev}
            isSameSenderAsNext={isSameSenderAsNext}
            onImagePress={onImagePress}
            onReply={onReply}
            onReplyPress={onReplyPress}
            searchQuery={searchQuery}
            isFlashing={isFlashing}
            isSelectionMode={isSelectionMode}
            isSelected={isSelected}
            onSelect={onSelect}
            onLongPress={onLongPress}
          />
        </SwipeableMessage>
      </View>
    );
  },
  (prev, next) =>
    prev.item.id === next.item.id &&
    prev.item.updated_at === next.item.updated_at &&
    prev.item.is_read === next.item.is_read &&
    prev.item.send_failed === next.item.send_failed &&
    prev.isSameSenderAsPrev === next.isSameSenderAsPrev &&
    prev.isSameSenderAsNext === next.isSameSenderAsNext &&
    prev.isFlashing === next.isFlashing &&
    prev.searchQuery === next.searchQuery &&
    prev.isSelectionMode === next.isSelectionMode &&
    prev.isSelected === next.isSelected,
);
MessageRow.displayName = "MessageRow";

const MessageList = memo(
  ({
    messages,
    isParticipantTyping,
    hasNextPage,
    isFetchingNextPage,
    flatListRef,
    onScroll,
    onEndReached,
    onViewableItemsChanged,
    onImagePress,
    onReply,
    onLongPress,
    searchQuery,
    currentMatchIndex = 0,
    onMatchesFound,
    isSelectionMode,
    selectedMessageIds,
    onSelectionChange,
  }: MessageListProps) => {
    const { user } = useAuthStore();
    const listRef = useRef<FlatList<any>>(null);
    const [flashingId, setFlashingId] = useState<string | null>(null);
    const matchIndicesRef = useRef<number[]>([]);

    // Sync ref to parent
    useEffect(() => {
      if (flatListRef) (flatListRef as any).current = listRef.current;
    }, [flatListRef]);

    const flash = useCallback((id: string) => {
      setFlashingId(id);
      setTimeout(() => setFlashingId(null), 2000);
    }, []);

    const handleReplyPress = useCallback(
      (messageId: string) => {
        const index = messages.findIndex(
          (m: any) =>
            String(m.id) === String(messageId) ||
            String(m.id) === `temp-${messageId}`,
        );
        if (index === -1 || !listRef.current) return;
        listRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
        flash(String(messageId));
      },
      [messages, flash],
    );

    const handleScrollToIndexFailed = useCallback((info: any) => {
      listRef.current?.scrollToOffset({
        offset: info.averageItemLength * info.index,
        animated: false,
      });
      InteractionManager.runAfterInteractions(() => {
        setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: info.index,
            animated: false,
            viewPosition: 0.5,
          });
        }, 300); // Increased timeout for low-end devices resolving unmounted data
      });
    }, []);

    const handleSelect = useCallback(
      (messageId: string) => {
        onSelectionChange?.(messageId);
      },
      [onSelectionChange],
    );

    // Search
    useEffect(() => {
      if (!searchQuery?.trim()) {
        matchIndicesRef.current = [];
        onMatchesFound?.(0);
        return;
      }
      const q = searchQuery.toLowerCase();
      const indices = messages.reduce<number[]>((acc, item: any, i) => {
        if (item.type !== "date" && item.content?.toLowerCase().includes(q))
          acc.push(i);
        return acc;
      }, []);
      matchIndicesRef.current = indices;
      onMatchesFound?.(indices.length);
    }, [messages, searchQuery, onMatchesFound]);

    useEffect(() => {
      const indices = matchIndicesRef.current;
      if (
        !indices.length ||
        currentMatchIndex < 0 ||
        currentMatchIndex >= indices.length
      )
        return;
      const index = indices[currentMatchIndex];
      listRef.current?.scrollToIndex({
        index,
        animated: false,
        viewPosition: 0.5,
      });
      const item = messages[index] as any;
      if (item?.id) flash(String(item.id));
    }, [currentMatchIndex, searchQuery, flash, messages]);

    const viewabilityConfig = useMemo(
      () => ({
        itemVisiblePercentThreshold: 10,
        minimumViewTime: 100,
      }),
      [],
    );

    const renderItem = useCallback(
      ({ item, index }: { item: any; index: number }) => {
        if (item.type === "date") return <DateBubble date={item.date} />;

        const prevMsg = index > 0 ? messages[index - 1] : null;
        const nextMsg = (messages[index + 1] as any) ?? null;

        return (
          <MessageRow
            item={item}
            isSameSenderAsPrev={isSameSender(item, prevMsg)}
            isSameSenderAsNext={isSameSender(item, nextMsg)}
            user={user}
            onReply={onReply}
            onImagePress={onImagePress}
            isFlashing={flashingId === String(item.id)}
            searchQuery={searchQuery}
            onReplyPress={handleReplyPress}
            isSelectionMode={isSelectionMode}
            isSelected={selectedMessageIds?.has(String(item.id)) ?? false}
            onSelect={handleSelect}
            onLongPress={onLongPress}
          />
        );
      },
      [
        messages,
        user,
        onReply,
        onImagePress,
        flashingId,
        searchQuery,
        handleReplyPress,
        isSelectionMode,
        selectedMessageIds,
        handleSelect,
        onLongPress,
      ],
    );

    // In inverted mode:
    //   ListHeaderComponent = visual BOTTOM → typing indicator
    //   ListFooterComponent = visual TOP    → load older messages spinner
    const ListHeader = useMemo(() => {
      if (!isParticipantTyping) return null;
      return (
        <View style={styles.typingWrapper}>
          <TypingIndicator />
        </View>
      );
    }, [isParticipantTyping]);

    const ListFooter = useMemo(() => {
      if (!hasNextPage || !isFetchingNextPage) return null;
      return (
        <View style={styles.loaderTop}>
          <ActivityIndicator size="small" color="#aaa" />
        </View>
      );
    }, [hasNextPage, isFetchingNextPage]);

    return (
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item: any) => String(item.id)}
        renderItem={renderItem}
        style={styles.list}
        contentContainerStyle={styles.content}
        inverted
        ListHeaderComponent={ListHeader}
        ListFooterComponent={ListFooter}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        maintainVisibleContentPosition={{ minIndexForVisible: 1 }}
        onScrollToIndexFailed={handleScrollToIndexFailed}
        initialNumToRender={30}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === "android"}
        maxToRenderPerBatch={10}
        windowSize={7}
        updateCellsBatchingPeriod={50}
      />
    );
  },
);
MessageList.displayName = "MessageList";

export default MessageList;
