"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin, Check, Loader2 } from 'lucide-react'
import { useRegions } from '@/hooks/useRegions'

interface RegionSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedRegion: string
  onSelectRegion: (region: string) => void
}

export default function RegionSelectorModal({ 
  isOpen, 
  onClose, 
  selectedRegion,
  onSelectRegion 
}: RegionSelectorModalProps) {
  const { data: regions, isLoading, error } = useRegions()
  
  const handleSelectRegion = (regionName: string) => {
    onSelectRegion(regionName)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-4xl w-[95vw] p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="p-4 sm:p-6 md:p-8 pb-3 sm:pb-4 flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl md:text-3xl font-semibold text-gray-900">
            Select Region in Niger
          </DialogTitle>
        </DialogHeader>

        <div className="p-4 sm:p-6 md:p-8 pt-0 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-600 mb-2">Failed to load regions</p>
              <p className="text-sm text-gray-500">Please try again later</p>
            </div>
          ) : (
            <>
              {/* All Regions Option */}
              <div
                onClick={() => handleSelectRegion('All Regions')}
                className={`flex items-center justify-between p-3 sm:p-4 md:p-5 border border-gray-200 hover:border-secondary/50 hover:bg-secondary/5 cursor-pointer transition-all mb-4 sm:mb-6 rounded-xl ${
                  selectedRegion === 'All Regions' ? 'bg-secondary/10 border-secondary' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-base sm:text-lg text-gray-900">All Regions</p>
                    <p className="text-xs sm:text-sm text-gray-500">Search everywhere in Niger</p>
                  </div>
                </div>
                {selectedRegion === 'All Regions' && (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-secondary flex-shrink-0" />
                )}
              </div>

              {/* Regions Grid - 2 cols mobile, 3 cols desktop */}
              {regions && regions.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {regions.map((region) => (
                    <div
                      key={region.name}
                      onClick={() => handleSelectRegion(region.name)}
                      className={`flex items-center justify-between p-3 sm:p-4 md:p-5 border border-gray-200 hover:border-secondary/50 hover:bg-secondary/5 cursor-pointer transition-all rounded-xl ${
                        selectedRegion === region.name ? 'bg-secondary/10 border-secondary' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 min-w-0 flex-1">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-secondary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{region.name}</p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            {region.adsCount.toLocaleString()} ads
                          </p>
                        </div>
                      </div>
                      {selectedRegion === region.name && (
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-secondary flex-shrink-0 ml-1 sm:ml-2" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No regions available</p>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

