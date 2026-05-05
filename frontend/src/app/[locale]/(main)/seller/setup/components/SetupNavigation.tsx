import React from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react'
import MarketplaceLoader from '@/components/ui/MarketplaceLoader'

interface SetupNavigationProps {
  currentStep: number
  totalSteps: number
  handleBack: () => void
  handleNext?: () => void
  isPending: boolean
}

export default function SetupNavigation({
  currentStep,
  totalSteps,
  handleBack,
  handleNext,
  isPending
}: SetupNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-6">
      {currentStep > 1 && (
        <Button
          type="button"
          variant="ghost"
          onClick={handleBack}
          className="sm:flex-1 min-w-0 h-12 rounded-full"
        >
          <span className="flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </span>
        </Button>
      )}

      {currentStep < totalSteps && (
        <Button
          type="button"
          onClick={handleNext}
          className="sm:flex-1 min-w-0 h-12 rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <span className="flex items-center justify-center font-semibold">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </span>
        </Button>
      )}

      {currentStep === totalSteps && (
        <Button
          type="submit"
          className="sm:flex-1 min-w-0 h-12 rounded-full shadow-lg hover:shadow-xl transition-all"
          disabled={isPending}
        >
          <span className="flex items-center justify-center min-w-0 font-semibold">
            {isPending ? (
              <>
                <MarketplaceLoader inline size="sm" white />
                <span className="truncate ml-2">Finishing setup...</span>
              </>
            ) : (
              <>
                <span className="truncate">Complete Setup</span>
                <CheckCircle className="w-4 h-4 ml-2 flex-shrink-0" />
              </>
            )}
          </span>
        </Button>
      )}
    </div>
  )
}
