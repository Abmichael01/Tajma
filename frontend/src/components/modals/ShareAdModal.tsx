"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Check, Copy, Facebook, MessageCircle, Twitter } from 'lucide-react'

interface ShareAdModalProps {
  isOpen: boolean
  onClose: () => void
  adId: string
  adTitle: string
}

export default function ShareAdModal({ isOpen, onClose, adId, adTitle }: ShareAdModalProps) {
  const [copied, setCopied] = useState(false)

  // In a real app, this would be the actual URL
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/ads/${adId}` : ''
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(adTitle)

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const shareLinks = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ]

  const handleSocialShare = (url: string) => {
    window.open(url, '_blank', 'width=600,height=400')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-md">
        <DialogHeader>
          <DialogTitle>Share This Ad</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Ad Title */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="font-medium text-gray-900 line-clamp-2">{adTitle}</p>
          </div>

          {/* Social Share Buttons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Share on social media</p>
            <div className="grid grid-cols-3 gap-3">
              {shareLinks.map((platform) => {
                const Icon = platform.icon
                return (
                  <button
                    key={platform.name}
                    onClick={() => handleSocialShare(platform.url)}
                    className={`${platform.color} text-white p-4 flex flex-col items-center gap-2 transition-colors`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{platform.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Or copy link</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 text-sm text-gray-600"
              />
              <Button
                onClick={copyToClipboard}
                variant={copied ? 'primary' : 'outline'}
                className="flex-shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

