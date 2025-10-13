"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin, Check } from 'lucide-react'
import { nigerStates } from '@/data/nigerStates'

interface StateSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedState: string
  onSelectState: (state: string) => void
}

export default function StateSelectorModal({ 
  isOpen, 
  onClose, 
  selectedState,
  onSelectState 
}: StateSelectorModalProps) {
  const handleSelectState = (stateName: string) => {
    onSelectState(stateName)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl w-[95vw] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-4 sm:p-6 md:p-8 pb-3 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Select State in Niger
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6 md:p-8 pt-0 overflow-y-auto custom-scrollbar">
          {/* All States Option */}
          <div
            onClick={() => handleSelectState('All States')}
            className={`flex items-center justify-between p-3 sm:p-4 md:p-5 border border-gray-200 hover:border-secondary/50 hover:bg-secondary/5 cursor-pointer transition-all mb-4 sm:mb-6 ${
              selectedState === 'All States' ? 'bg-secondary/10 border-secondary' : 'bg-white'
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-secondary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-semibold text-base sm:text-lg text-gray-900">All States</p>
                <p className="text-xs sm:text-sm text-gray-500">Search everywhere in Niger</p>
              </div>
            </div>
            {selectedState === 'All States' && (
              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-secondary flex-shrink-0" />
            )}
          </div>

          {/* States Grid - 2 cols mobile, 3 cols desktop */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            {nigerStates.map((state) => (
              <div
                key={state.name}
                onClick={() => handleSelectState(state.name)}
                className={`flex items-center justify-between p-3 sm:p-4 md:p-5 border border-gray-200 hover:border-secondary/50 hover:bg-secondary/5 cursor-pointer transition-all ${
                  selectedState === state.name ? 'bg-secondary/10 border-secondary' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-secondary flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{state.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {state.adsCount.toLocaleString()} ads
                    </p>
                  </div>
                </div>
                {selectedState === state.name && (
                  <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-secondary flex-shrink-0 ml-1 sm:ml-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

