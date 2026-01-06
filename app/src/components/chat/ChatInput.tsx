import { useState, useRef, useEffect } from "react";
import { View, TextInput, Pressable, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ChatInputProps {
  onSend: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, onTypingChange, disabled }: ChatInputProps) {
  const [text, setText] = useState("");
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTextChange = (newText: string) => {
    setText(newText);

    // Send typing indicator if there's content
    if (newText.trim().length > 0) {
      onTypingChange?.(true);
    } else {
      onTypingChange?.(false);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    // Auto-stop typing after 2 seconds of inactivity
    if (newText.trim().length > 0) {
      typingTimeoutRef.current = setTimeout(() => {
        onTypingChange?.(false);
        typingTimeoutRef.current = null;
      }, 2000);
    }
  };

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText("");
      onTypingChange?.(false);
      
      // Clear timeout when sending
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  };

  return (
    <View 
      className="flex-row items-center px-3 py-2 bg-white border-t border-gray-100"
      style={{ 
        elevation: 3, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: -1 }, 
        shadowOpacity: 0.05, 
        shadowRadius: 2 
      }}
    >
      <Pressable className="mr-2" style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}>
        <Ionicons name="add-circle-outline" size={26} color="#9CA3AF" />
      </Pressable>
      
      <View className="flex-1 bg-gray-100 rounded-full px-4 py-2 min-h-[42px] justify-center">
        <TextInput
          value={text}
          onChangeText={handleTextChange}
          placeholder="Type a message..."
          placeholderTextColor="#9CA3AF"
          multiline
          blurOnSubmit={false}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          className="text-base text-gray-900"
          style={{ minHeight: 24 }}
          maxHeight={100}
        />
      </View>

      <Pressable 
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        className={`ml-2 w-11 h-11 rounded-full items-center justify-center ${
          text.trim() && !disabled ? 'bg-primary' : 'bg-gray-200'
        }`}
        style={({ pressed }) => [
          {
            transform: [{ scale: pressed && text.trim() && !disabled ? 0.9 : 1 }],
          },
        ]}
      >
        <Ionicons name="send" size={20} color="white" />
      </Pressable>
    </View>
  );
}
