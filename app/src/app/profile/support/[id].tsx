import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, KeyboardAvoidingView, Platform, FlatList, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '@/components/ui/ScreenHeader';
import MessageBubble from '@/components/chat/MessageBubble';
import ChatInput from '@/components/chat/ChatInput';
import AppText from '@/components/ui/AppText';
import { useReport, useReplyToReport } from '@/hooks/useSupport';
import { useAuthStore } from '@/store/authStore';
import { ChatMessage } from '@/api/types';

export default function SupportTicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  const { data: report, isLoading, refetch } = useReport(id as string);
  const replyMutation = useReplyToReport(id as string);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Map SupportMessages to ChatMessages for reuse of MessageBubble
  const messages = useMemo(() => {
    if (!report?.messages) return [];
    
    // Sort oldest to newest for FlatList (if not inverted)
    // Actually normal chats are inverted, let's keep it consistent
    return [...report.messages].reverse().map(msg => ({
      id: msg.id,
      content: msg.message,
      sender: msg.sender_details || msg.sender,
      message_type: 'text' as const,
      created_at: msg.created_at,
      is_read: true, // Support messages are assumed read for now
      chat: report.id,
      updated_at: msg.created_at,
    })) as ChatMessage[];
  }, [report]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    try {
      await replyMutation.mutateAsync(text);
      refetch();
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#FF4F18" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <ScreenHeader 
        title={report?.report_type === 'support' ? 'Support Ticket' : 'Report Case'}
        subtitle={`ID: ${String(id).slice(0, 8).toUpperCase()}`}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        className="flex-1"
      >
        <FlatList
          data={messages || []}
          keyExtractor={(item) => item.id}
          inverted
          renderItem={({ item, index }) => {
            const prevMsg = index < messages.length - 1 ? messages[index + 1] : null;
            const nextMsg = index > 0 ? messages[index - 1] : null;
            
            const isMe = String(item.sender?.id || item.sender) === String(currentUser?.id);
            
            return (
              <View className="px-4 py-1">
                <MessageBubble
                  message={item}
                  isSameSenderAsPrev={!!(prevMsg && String(prevMsg.sender?.id || prevMsg.sender) === String(item.sender?.id || item.sender))}
                  isSameSenderAsNext={!!(nextMsg && String(nextMsg.sender?.id || nextMsg.sender) === String(item.sender?.id || item.sender))}
                />
              </View>
            );
          }}
          contentContainerStyle={{ paddingVertical: 20 }}
          ListHeaderComponent={
            report?.status === 'resolved' || report?.status === 'dismissed' ? (
              <View className="items-center py-6 px-10">
                <View className="bg-gray-100 px-4 py-2 rounded-full">
                  <AppText className="text-gray-500 text-xs font-bold uppercase">
                    This ticket has been marked as {report.status}
                  </AppText>
                </View>
              </View>
            ) : null
          }
        />

        {report?.status !== 'resolved' && report?.status !== 'dismissed' && (
          <ChatInput 
            onSend={handleSend}
            disabled={replyMutation.isPending}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
