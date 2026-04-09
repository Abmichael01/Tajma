"use client"

import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Store } from 'lucide-react'

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
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title="Become a Seller Today!"
      description="Set up your seller account to start posting ads and reaching thousands of buyers. It only takes a few minutes!"
      className="!max-w-md"
    >
        <div className="mt-4">
          <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-6">
            <Store className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-3 pb-4">
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
        </div>
    </ResponsiveModal>
  )
}
