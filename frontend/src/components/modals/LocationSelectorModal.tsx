import React, { useState, useEffect } from 'react'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { MapPin, Check, Loader2, ArrowLeft, ChevronRight, Globe, X } from 'lucide-react'
import { useLocations, useCountries } from '@/hooks/useLocations'
import { useTranslations } from 'next-intl'
import { Country, Location } from '@/api/countries'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/hooks/useMediaQuery'

interface LocationSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedLocation: string | null
  onSelectLocation: (location: Location | null, baseCountry: Country | null) => void
}

export default function LocationSelectorModal({ 
  isOpen, 
  onClose, 
  selectedLocation,
  onSelectLocation 
}: LocationSelectorModalProps) {
  const t = useTranslations('common')
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null)
  const [currentLevel, setCurrentLevel] = useState(2)
  const [parentId, setParentId] = useState<number | null>(null)
  const [selectionHistory, setSelectionHistory] = useState<{ id: number | null, name: string, level: number }[]>([])
  
  const { data: countries, isLoading: countriesLoading } = useCountries()
  const { data: response, isLoading: locationsLoading, error } = useLocations({ 
    parent: parentId, 
    level: currentLevel as 1 | 2 | 3 | 'all',
    country: selectedCountry?.id
  })

  const locations = response?.results || []

  useEffect(() => {
    if (isOpen) {
      setCurrentLevel(2)
      setParentId(null)
      setSelectionHistory([])
    }
  }, [isOpen])
  
  const handleSelectCountry = (country: Country) => {
    setSelectedCountry(country)
    setParentId(null)
    setCurrentLevel(2)
  }

  const handleSelectLocation = (location: Location | null) => {
    if (location && location.level && location.level < 2) {
      setSelectionHistory([...selectionHistory, { id: parentId, name: location.name, level: currentLevel }])
      setParentId(location.id)
      setCurrentLevel((location.level as number) + 1)
    } else {
      onSelectLocation(location, selectedCountry)
      onClose()
    }
  }

  const handleBack = () => {
    if (selectionHistory.length > 0) {
      const last = selectionHistory[selectionHistory.length - 1]
      setParentId(last.id)
      setCurrentLevel(last.level)
      setSelectionHistory(selectionHistory.slice(0, -1))
    } else {
      setSelectedCountry(null)
    }
  }

  return (
    <ResponsiveModal 
      isOpen={isOpen} 
      onClose={onClose}
      hideHeader={true}
      className="max-w-4xl"
    >
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
                {!selectedCountry ? t("select_country") : "Select Department"}
            </h2>
            <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 transition-colors"
            >
                <X className="w-4 h-4 text-gray-400" />
            </button>
        </div>

        <div className="py-2 overflow-y-auto custom-scrollbar max-h-[70vh]">
          {/* Navigation & Breadcrumbs */}
          {(selectedCountry || selectionHistory.length > 0) && (
            <div className="flex items-center gap-3 mb-6">
              <button 
                onClick={handleBack}
                className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full transition-all active:scale-95 hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center flex-wrap gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => {
                  setSelectedCountry(null)
                  setParentId(null)
                  setCurrentLevel(2)
                  setSelectionHistory([])
                }}>All Countries</span>
                
                {selectedCountry && (
                  <>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span className="cursor-pointer hover:text-primary transition-colors" onClick={() => {
                      setParentId(null)
                      setCurrentLevel(2)
                      setSelectionHistory([])
                    }}>{selectedCountry.name}</span>
                  </>
                )}

                {selectionHistory.map((item, index) => (
                  <React.Fragment key={index}>
                    <ChevronRight className="w-3 h-3 text-gray-300" />
                    <span 
                      className="cursor-pointer hover:text-primary max-w-[100px] truncate transition-colors"
                      onClick={() => {
                          const newHistory = selectionHistory.slice(0, index)
                          setSelectionHistory(newHistory)
                          setParentId(item.id)
                          setCurrentLevel(item.level)
                      }}
                    >{item.name}</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {!selectedCountry ? (
            /* Step 0: Country Selection */
            <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4")}>
              {countries?.map((country) => (
                <div
                  key={country.id}
                  onClick={() => handleSelectCountry(country)}
                  className={cn(
                    "flex items-center gap-4 p-5 border rounded-[22px] cursor-pointer transition-all active:scale-[0.98] group",
                    "border-gray-100 bg-white hover:border-primary/50 hover:bg-gray-50"
                  )}
                >
                  <span className="text-4xl grayscale-[0.2] group-hover:grayscale-0 transition-all">{country.flag_emoji}</span>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-sm">{country.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{country.code}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                </div>
              ))}
                <div
                  onClick={() => {
                      onSelectLocation(null, null)
                      onClose()
                  }}
                  className={cn(
                    "flex items-center gap-4 p-5 border rounded-[22px] cursor-pointer transition-all active:scale-[0.98]",
                    selectedLocation === 'All Locations' ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                  )}
                >
                    {isDesktop ? (
                      <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border",
                          selectedLocation === 'All Locations' ? "bg-white/10 border-white/20" : "bg-white border-gray-100"
                      )}>
                        <Globe className={cn("w-6 h-6", selectedLocation === 'All Locations' ? "text-white" : "text-gray-400")} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100">
                        <Globe className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className={cn("font-bold text-sm", selectedLocation === 'All Locations' ? "text-white" : "text-gray-900")}>All Countries</p>
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", selectedLocation === 'All Locations' ? "text-white/50" : "text-gray-400")}>Global</p>
                    </div>
                    {selectedLocation === 'All Locations' && (
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                            <Check className="w-4 h-4 text-slate-900" strokeWidth={4} />
                        </div>
                    )}
                </div>
            </div>
          ) : (
            /* Steps 1 & 2: Location/Subdivision Selection */
            <>
              {locationsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div
                    onClick={() => {
                        if (currentLevel === 2) handleSelectLocation(null)
                        else {
                            const parent = selectionHistory[selectionHistory.length-1]
                            handleSelectLocation({ id: parent.id!, name: parent.name, level: parent.level } as Location)
                        }
                    }}
                    className={cn(
                      "flex items-center justify-between p-5 border transition-all cursor-pointer rounded-[22px]",
                      (selectedLocation === 'All Locations' || (selectionHistory.length > 0 && selectedLocation === selectionHistory[selectionHistory.length-1]?.name)) 
                        ? "bg-slate-900 border-slate-900" 
                        : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                          "w-12 h-12 rounded-full flex items-center justify-center border",
                          (selectedLocation === 'All Locations' || (selectionHistory.length > 0 && selectedLocation === selectionHistory[selectionHistory.length-1]?.name)) ? "bg-white/10 border-white/20" : "bg-white border-gray-100"
                      )}>
                        <MapPin className={cn("w-6 h-6", (selectedLocation === 'All Locations' || (selectionHistory.length > 0 && selectedLocation === selectionHistory[selectionHistory.length-1]?.name)) ? "text-white" : "text-primary")} />
                      </div>
                      <div>
                        <p className={cn("font-bold text-sm", (selectedLocation === 'All Locations' || (selectionHistory.length > 0 && selectedLocation === selectionHistory[selectionHistory.length-1]?.name)) ? "text-white" : "text-gray-900")}>
                          {selectionHistory.length === 0 ? `All of ${selectedCountry.name}` : `All of ${selectionHistory[selectionHistory.length-1]?.name}`}
                        </p>
                        <p className={cn("text-[10px] font-bold uppercase", (selectedLocation === 'All Locations' || (selectionHistory.length > 0 && selectedLocation === selectionHistory[selectionHistory.length-1]?.name)) ? "text-white/50" : "text-gray-400")}>
                          Search entire area
                        </p>
                      </div>
                    </div>
                    {selectedLocation === (selectionHistory.length === 0 ? 'All Locations' : selectionHistory[selectionHistory.length-1]?.name) && (
                       <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                          <Check className="w-4 h-4 text-slate-900" strokeWidth={4} />
                       </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {locations.map((location) => {
                      const isSelected = selectedLocation === location.name
                      return (
                        <div
                          key={location.id}
                          onClick={() => handleSelectLocation(location)}
                          className={cn(
                            "flex items-center justify-between p-5 border rounded-[22px] cursor-pointer transition-all active:scale-[0.98] group",
                            isSelected ? "bg-slate-900 border-slate-900" : "bg-white border-gray-100 hover:bg-gray-50 hover:border-primary/50"
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={cn("font-bold text-sm truncate", isSelected ? "text-white" : "text-gray-900 group-hover:text-primary transition-colors")}>{location.name}</p>
                            <p className={cn("text-[10px] font-bold uppercase tracking-tight", isSelected ? "text-white/50" : "text-gray-400")}>
                              {location.subdivision_type || (location.level === 1 ? 'Department' : 'Area')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {location.level && location.level < 2 ? (
                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
                            ) : isSelected ? (
                               <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                                  <Check className="w-4 h-4 text-slate-900" strokeWidth={4} />
                               </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
    </ResponsiveModal>
  )
}
