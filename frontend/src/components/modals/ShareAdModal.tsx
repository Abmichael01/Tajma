"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Check, 
  Copy, 
  Facebook, 
  MessageCircle, 
  Mail,
  Instagram,
  Linkedin,
  Send,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface ShareAdModalProps {
  isOpen: boolean
  onClose: () => void
  adId: string
  adTitle: string
}

export default function ShareAdModal({ isOpen, onClose, adId, adTitle }: ShareAdModalProps) {
  const [copied, setCopied] = useState(false)
  const [showMore, setShowMore] = useState(false)

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

  const mainShareLinks = [
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
      name: 'X',
      icon: X,
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
  ]

  const moreShareLinks = [
    {
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-blue-700 hover:bg-blue-800',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: 'Telegram',
      icon: Send,
      color: 'bg-sky-500 hover:bg-sky-600',
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 hover:from-purple-700 hover:via-pink-700 hover:to-orange-600',
      url: `https://www.instagram.com/`,
      isCopyOnly: true,
    },
    {
      name: 'Gmail',
      icon: Mail,
      color: 'bg-red-600 hover:bg-red-700',
      url: `https://mail.google.com/mail/?view=cm&fs=1&su=${encodedTitle}&body=${encodedUrl}`,
    },
    {
      name: 'Email',
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      url: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ]

  const handleSocialShare = (platform: typeof mainShareLinks[0] | typeof moreShareLinks[0]) => {
    if (platform.isCopyOnly) {
      copyToClipboard()
      return
    }
    window.open(platform.url, '_blank', 'width=600,height=400')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Share This Ad</DialogTitle>
        </DialogHeader>

        <div className="py-4 overflow-y-auto flex-1 min-h-0 faint-gray-scrollbar">
          {/* Ad Title */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <p className="font-medium text-gray-900 line-clamp-2">{adTitle}</p>
          </div>

          {/* Social Share Buttons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Share on social media</p>
            <div className="grid grid-cols-3 gap-3">
              {mainShareLinks.map((platform) => {
                const Icon = platform.icon
                return (
                  <button
                    key={platform.name}
                    onClick={() => handleSocialShare(platform)}
                    className={`${platform.color} text-white p-4 flex flex-col items-center gap-2 transition-colors rounded-lg`}
                    title={`Share on ${platform.name}`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{platform.name}</span>
                  </button>
                )
              })}
            </div>

            {/* More Options */}
            {showMore && (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {moreShareLinks.map((platform) => {
                  const Icon = platform.icon
                  return (
                    <button
                      key={platform.name}
                      onClick={() => handleSocialShare(platform)}
                      className={`${platform.color} text-white p-4 flex flex-col items-center gap-2 transition-colors rounded-lg`}
                      title={platform.isCopyOnly ? `Click to copy link for ${platform.name}` : `Share on ${platform.name}`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-xs font-medium">{platform.name}</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* Toggle More Button */}
            <button
              onClick={() => setShowMore(!showMore)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {showMore ? (
                <>
                  <ChevronUp className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4" />
                  More options
                </>
              )}
            </button>
          </div>

          {/* Copy Link */}
          <div className="flex-shrink-0">
            <p className="text-sm font-medium text-gray-700 mb-3">Or copy link</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 bg-gray-50 text-sm text-gray-600 rounded-md"
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

