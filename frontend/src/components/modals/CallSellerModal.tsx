"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Phone, Copy, CheckCircle } from 'lucide-react'

interface CallSellerModalProps {
  isOpen: boolean
  onClose: () => void
  phoneNumber: string
  sellerName: string
  sellerId: number
  adId: string
  adTitle: string
}

export default function CallSellerModal({ 
  isOpen, 
  onClose, 
  phoneNumber,
  sellerName,
  sellerId,
  adId,
  adTitle
}: CallSellerModalProps) {
  const [copied, setCopied] = useState(false)

  const handleCall = () => {
    window.location.href = `tel:${phoneNumber}`
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(phoneNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClose = () => {
    setCopied(false)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="!max-w-md">
        <DialogHeader>
          <DialogTitle>Contact Number</DialogTitle>
          <DialogDescription>
            Contact the seller directly using the phone number below
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="bg-gray-50 border border-gray-200 p-6 rounded-lg mb-6 text-center">
            <p className="text-sm text-gray-600 mb-2">Phone Number</p>
            <p className="text-2xl font-bold text-gray-900">{phoneNumber}</p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={handleCall}
              className="w-full"
              size="lg"
            >
              <Phone className="w-5 h-5 mr-2" />
              Call Now
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="w-full"
              size="lg"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 mr-2" />
                  Copy Number
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

