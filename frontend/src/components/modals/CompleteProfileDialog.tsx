"use client"

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { UserCircle, X } from 'lucide-react'

interface CompleteProfileDialogProps {
  isOpen: boolean
  onClose: () => void
}

export default function CompleteProfileDialog({ isOpen, onClose }: CompleteProfileDialogProps) {
  const router = useRouter()

  const handleCompleteProfile = () => {
    onClose()
    router.push('/seller/setup')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-xl">
            Complete Your Profile
          </DialogTitle>
          <DialogDescription className="text-center text-base mt-2">
            To post ads in this category, you need to complete your seller profile. 
            This helps buyers trust you and contact you easily.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-3">
          <Button
            onClick={handleCompleteProfile}
            className="w-full"
            size="lg"
          >
            Complete Profile
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            className="w-full"
            size="lg"
          >
            Cancel
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 mt-4">
          Note: Job postings don't require seller profile setup
        </p>
      </DialogContent>
    </Dialog>
  )
}

