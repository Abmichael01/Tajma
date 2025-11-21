"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Store, X } from 'lucide-react'

interface SellerSetupDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function SellerSetupDialog({ isOpen, onClose }: SellerSetupDialogProps) {
  const router = useRouter()

  const handleYes = () => {
    onClose()
    router.push('/seller/setup')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Become a Seller Today!
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            Set up your seller account to start posting ads and reaching thousands of buyers. 
            It only takes a few minutes!
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          <Button
            onClick={handleYes}
            className="w-full"
            size="lg"
          >
            Yes, Set Up My Account
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            Maybe Later
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          You can set up your seller account anytime from your profile
        </p>
      </DialogContent>
    </Dialog>
  )
}

