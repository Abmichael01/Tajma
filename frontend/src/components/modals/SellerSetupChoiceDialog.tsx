"use client"

import { Store } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { ResponsiveModal } from '@/components/ui/responsive-modal'

interface SellerSetupChoiceDialogProps {
  isOpen: boolean
  onClose: () => void
  onSetupHere: () => void
  onGoToSetup: () => void
}

export default function SellerSetupChoiceDialog({
  isOpen,
  onClose,
  onSetupHere,
  onGoToSetup,
}: SellerSetupChoiceDialogProps) {
  const t = useTranslations('setup')

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={t('title')}
      description={t('description')}
      className="!max-w-md"
    >
      <div className="mt-2">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <Store className="h-8 w-8 text-primary" />
        </div>

        <div className="space-y-3 pb-2">
          <Button onClick={onSetupHere} className="w-full rounded-full" size="lg">
            {t('setup_here')}
          </Button>
          <Button
            onClick={onGoToSetup}
            variant="outline"
            className="w-full rounded-full border-gray-200"
            size="lg"
          >
            {t('go_to_setup')}
          </Button>
          <Button onClick={onClose} variant="ghost" className="w-full rounded-full" size="lg">
            {t('maybe_later')}
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  )
}
