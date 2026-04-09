"use client"

import React, { useState } from 'react'
import { X, SendHorizontal } from 'lucide-react'
import Image from 'next/image'

interface MediaPreviewProps {
    file: File
    onClose: () => void
    onSend: (caption: string) => void
}

export default function MediaPreview({ file, onClose, onSend }: MediaPreviewProps) {
    const [caption, setCaption] = useState('')
    const previewUrl = React.useMemo(() => URL.createObjectURL(file), [file])

    // Cleanup URL on unmount
    React.useEffect(() => {
        return () => URL.revokeObjectURL(previewUrl)
    }, [previewUrl])

    const handleSend = () => {
        onSend(caption)
    }

    return (
        <div className="absolute inset-0 z-50 flex flex-col bg-white animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-100">
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Close preview"
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-sm font-semibold text-gray-900">Send image</h3>
                <div className="w-10" />
            </div>

            {/* Image Preview */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 bg-[#F0F2F5]">
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                        style={{ display: 'block' }}
                        onError={(e) => {
                            console.error("Image preview failed to load");
                            (e.target as HTMLImageElement).src = ""; // Clear broken src
                        }}
                    />
                </div>
            </div>

            {/* Footer / Caption Area - Styled to match ChatInput */}
            <div className="p-2 sm:p-2 bg-[#F5F5F5] border-t border-gray-200">
                <div className="max-w-5xl mx-auto flex items-center gap-1">
                    {/* Input Bubble */}
                    <div className="flex-1 flex items-center bg-white rounded-[22px] border border-[#E5E7EB] px-3 py-0 min-h-[40px] shadow-sm transition-all focus-within:shadow-md">
                        <textarea
                            value={caption}
                            onChange={(e) => {
                                setCaption(e.target.value)
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = 'auto'
                                target.style.height = `${Math.min(target.scrollHeight, 150)}px`
                            }}
                            placeholder="Add a caption..."
                            className="w-full bg-transparent resize-none border-none outline-none focus:ring-0 text-gray-900 text-[14px] py-[9px] px-1 max-h-[150px] custom-scrollbar placeholder-gray-400 leading-normal"
                            rows={1}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />
                    </div>

                    {/* Send Button */}
                    <div className="flex-shrink-0 flex items-center">
                        <button
                            onClick={handleSend}
                            className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:opacity-90 transition-all active:scale-90"
                            title="Send image"
                        >
                            <SendHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
