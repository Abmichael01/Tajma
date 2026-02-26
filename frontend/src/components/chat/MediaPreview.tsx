"use client"

import React, { useState } from 'react'
import { X, Send } from 'lucide-react'
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
                >
                    <X className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-sm font-semibold text-gray-900">Send image</h3>
                <div className="w-10" />
            </div>

            {/* Image Preview */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 bg-gray-50">
                <div className="relative w-full h-full flex items-center justify-center">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                </div>
            </div>

            {/* Footer / Caption Area */}
            <div className="p-4 bg-white border-t border-gray-100">
                <div className="max-w-3xl mx-auto flex items-end gap-3">
                    <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 border border-gray-200 focus-within:border-primary/50 transition-colors">
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Add a caption..."
                            className="w-full bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-500 text-sm resize-none py-1 max-h-32 custom-scrollbar"
                            rows={1}
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                            onInput={(e) => {
                                const target = e.target as HTMLTextAreaElement
                                target.style.height = 'auto'
                                target.style.height = `${target.scrollHeight}px`
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSend}
                        className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-primary/90 transition-transform active:scale-95"
                    >
                        <Send className="w-5 h-5 ml-0.5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
