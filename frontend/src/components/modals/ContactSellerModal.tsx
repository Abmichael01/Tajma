"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MessageSquare, Send } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'
import { useLanguage, getDefaultMessages } from '@/hooks/useLanguage'

interface ContactSellerModalProps {
  isOpen: boolean
  onClose: () => void
  adId: string
  adTitle: string
  sellerName: string
}

export default function ContactSellerModal({ 
  isOpen, 
  onClose, 
  adId, 
  adTitle,
  sellerName 
}: ContactSellerModalProps) {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const currentLang = useLanguage()
  const defaultMessages = getDefaultMessages(currentLang)

  const handleDefaultMessage = (defaultMsg: string) => {
    setMessage(defaultMsg)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!message.trim()) {
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      setIsSuccess(true)
      
      // Reset and close after success
      setTimeout(() => {
        setIsSuccess(false)
        setMessage('')
        onClose()
      }, 2000)
    }, 1500)
  }

  const handleClose = () => {
    if (!isLoading) {
      setMessage('')
      setIsSuccess(false)
      onClose()
    }
  }

  if (isSuccess) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="!max-w-md">
          <div className="py-8 text-center">
            <div className="bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-4 rounded-full">
              <MessageSquare className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Message Sent!
            </h3>
            <p className="text-gray-600">
              Your message has been sent to {sellerName}. They will respond soon.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contact Seller</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-6 bg-gray-50 p-4 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">About:</p>
            <p className="font-medium text-gray-900">{adTitle}</p>
          </div>

          {/* Default Messages */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3">Quick messages:</p>
            <div className="flex flex-wrap gap-2">
              {defaultMessages.map((msg, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDefaultMessage(msg)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-primary transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Message Box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Message *
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                placeholder="Type your message here..."
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                {message.length} / 1000 characters
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <MarketplaceLoader inline size="sm" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}

