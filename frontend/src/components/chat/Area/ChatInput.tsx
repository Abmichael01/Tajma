"use client"

import React from 'react'
import { 
  PlusCircle, 
  Smile, 
  Camera, 
  Mic, 
  StopCircle, 
  SendHorizontal, 
  Trash2, 
  X 
} from 'lucide-react'
import EmojiPicker from '../EmojiPicker'
import { getUserFullName } from '@/utils/user'
import type { ChatMessage, ChatSummary, User } from '@/api/types'

interface ChatInputProps {
  inputValue: string
  setInputValue: (value: string) => void
  replyTo: ChatMessage | null
  onCancelReply: () => void
  onSendMessage: (event: React.FormEvent) => void
  onTypingChange: (value: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  imageInputRef: React.RefObject<HTMLInputElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  isRecording: boolean
  recordingDuration: number
  startRecording: () => void
  stopRecording: () => void
  formatDuration: (seconds: number) => string
  user: User | null
  onAttachmentChange: (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => void
}

export default function ChatInput({
  inputValue,
  setInputValue,
  replyTo,
  onCancelReply,
  onSendMessage,
  onTypingChange,
  fileInputRef,
  imageInputRef,
  textareaRef,
  isRecording,
  recordingDuration,
  startRecording,
  stopRecording,
  formatDuration,
  user,
  onAttachmentChange,
}: ChatInputProps) {
  return (
    <div className="p-2 sm:p-2 bg-[#F5F5F5] border-t border-gray-200 relative group/input">
      {/* Reply Preview Bar */}
      {replyTo && (
        <div className="absolute bottom-full left-0 right-0 p-2 bg-[#F0F2F5] border-t border-gray-200 flex items-center gap-3 animate-in slide-in-from-bottom-2 duration-200 z-30">
          <div className="flex-1 border-l-4 border-primary pl-3 py-1 overflow-hidden bg-white/50 rounded-r-md">
            <p className="text-primary text-[11px] font-bold truncate">
              {replyTo.sender?.id === user?.id ? 'You' : getUserFullName(replyTo.sender)}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {replyTo.message_type === 'image' && '📷 Photo'}
              {replyTo.message_type === 'audio' && '🎤 Voice message'}
              {replyTo.content}
            </p>
          </div>
          <button 
            type="button"
            onClick={onCancelReply}
            className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      <form onSubmit={onSendMessage} className="flex items-center gap-1 max-w-5xl mx-auto">
        {/* Outer Attachment Button (Plus) */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-primary hover:bg-gray-200/50 rounded-full transition-colors flex-shrink-0 flex items-center justify-center"
          title="Attach file"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        {/* Input Bubble */}
        <div className="flex-1 flex items-center bg-white rounded-[22px] border border-[#E5E7EB] px-1 py-0 min-h-[40px] shadow-sm transition-all focus-within:shadow-md">
          
          {/* Emoji Button */}
          <EmojiPicker
            onEmojiSelect={(emoji) => {
              setInputValue(inputValue + emoji)
            }}
            trigger={
              <button
                type="button"
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors flex items-center justify-center"
              >
                <Smile className="w-5 h-5" />
              </button>
            }
          />

          {/* Main Input or Recording UI */}
          <div className="flex-1 relative min-w-0 mx-0.5 flex items-center">
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between px-2 h-7 bg-red-50/50 rounded-full">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-[12px] font-medium text-gray-700">{formatDuration(recordingDuration)}</span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="flex items-center gap-1 text-[9px] text-red-500 font-bold uppercase hover:bg-red-100/50 px-2 py-0.5 rounded-full transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Discard
                </button>
              </div>
            ) : (
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(event) => {
                  onTypingChange(event.target.value)
                  const textarea = event.target as HTMLTextAreaElement
                  textarea.style.height = 'auto'
                  textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
                }}
                placeholder="Message..."
                className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 text-gray-900 text-[14px] py-[9px] px-1 max-h-[150px] custom-scrollbar placeholder-gray-400 leading-normal"
                rows={1}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault()
                    onSendMessage(event)
                  }
                }}
              />
            )}
          </div>

          {/* Camera/Image Button (inside bubble) */}
          {!isRecording && (
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full transition-colors flex items-center justify-center"
              title="Attach image"
            >
              <Camera className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Action Button (Mic or Send) */}
        <div className="flex-shrink-0 flex items-center">
          {!inputValue.trim() && !isRecording ? (
            <button
              type="button"
              onMouseDown={startRecording}
              className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-all active:scale-90"
            >
              <Mic className="w-5 h-5" />
            </button>
          ) : (
            <button
              type={isRecording ? "button" : "submit"}
              onClick={isRecording ? stopRecording : undefined}
              className={`w-10 h-10 ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-primary'} text-white rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-all active:scale-90`}
            >
              {isRecording ? <StopCircle className="w-5 h-5" /> : <SendHorizontal className="w-5 h-5" />}
            </button>
          )}
        </div>
      </form>

      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip" onChange={(e) => onAttachmentChange(e, 'file')} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => onAttachmentChange(e, 'image')} className="hidden" />
    </div>
  )
}
