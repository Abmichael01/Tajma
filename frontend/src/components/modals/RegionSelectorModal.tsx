"use client"

import React, { useState, useEffect } from 'react'
import { ResponsiveModal } from '@/components/ui/responsive-modal'
import { MapPin, Check, Loader2, ArrowLeft, ChevronRight } from 'lucide-react'
import { useRegions, Region } from '@/hooks/useRegions'
import { useTranslations } from 'next-intl'

interface RegionSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  selectedRegion: string
  onSelectRegion: (region: Region | null) => void
}

export default function RegionSelectorModal({ 
  isOpen, 
  onClose, 
  selectedRegion,
  onSelectRegion 
}: RegionSelectorModalProps) {
  const t = useTranslations('common')
  const [currentLevel, setCurrentLevel] = useState(1)
  const [parentId, setParentId] = useState<number | null>(null)
  const [selectionHistory, setSelectionHistory] = useState<{ id: number | null, name: string, level: number }[]>([])
  
  const { data: response, isLoading, error } = useRegions({ 
    parent: parentId, 
    level: currentLevel as 1 | 2 | 3 | 'all',
  })

  const regions = response?.results || []

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentLevel(1)
      setParentId(null)
      setSelectionHistory([])
    }
  }, [isOpen])
  
  const handleSelectRegion = (region: Region | null) => {
    if (region && region.level && region.level < 3) {
      setSelectionHistory([...selectionHistory, { id: parentId, name: region.name, level: currentLevel }])
      setParentId(region.id)
      setCurrentLevel((region.level as number) + 1)
    } else {
      onSelectRegion(region)
      onClose()
    }
  }

  const handleBack = () => {
    if (selectionHistory.length > 0) {
      const last = selectionHistory[selectionHistory.length - 1]
      setParentId(last.id)
      setCurrentLevel(last.level)
      setSelectionHistory(selectionHistory.slice(0, -1))
    }
  }

  return (
    <ResponsiveModal 
      isOpen={isOpen} 
      onClose={onClose}
      title={currentLevel === 1 ? t("select_region_niger") : currentLevel === 2 ? t("select_department") : t("select_commune")}
      className="max-w-4xl"
    >
        <div className="py-2 overflow-y-auto custom-scrollbar max-h-[70vh]">
          {/* Navigation & Breadcrumbs */}
          <div className="flex items-center gap-4 mb-6">
            {selectionHistory.length > 0 && (
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title={t("go_back")}
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
            )}
            
            <div className="flex items-center flex-wrap gap-1 text-sm text-gray-500">
              <span className="cursor-pointer hover:text-secondary" onClick={() => {
                setCurrentLevel(1)
                setParentId(null)
                setSelectionHistory([])
              }}>Niger</span>
              {selectionHistory.map((item, index) => (
                <React.Fragment key={index}>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                  <span 
                    className="cursor-pointer hover:text-secondary max-w-[120px] truncate"
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-secondary animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-600 mb-2">{t('failed_load_locations')}</p>
              <button onClick={() => onClose()} className="text-sm text-secondary hover:underline">{t('try_again_later')}</button>
            </div>
          ) : (
            <>
              {/* Contextual "All" Option */}
              <div
                onClick={() => {
                    if (currentLevel === 1) handleSelectRegion(null)
                    else {
                        const parent = selectionHistory[selectionHistory.length-1]
                        handleSelectRegion({ id: parent.id!, name: parent.name, level: parent.level } as Region)
                    }
                }}
                className={`flex items-center justify-between p-3 sm:p-4 border border-gray-200 hover:border-secondary/50 hover:bg-secondary/5 cursor-pointer transition-all mb-6 rounded-xl ${
                  (currentLevel === 1 && selectedRegion === 'All Regions') || (currentLevel > 1 && selectedRegion === selectionHistory[selectionHistory.length-1]?.name) ? 'bg-secondary/10 border-secondary' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                  <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-secondary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold text-base sm:text-lg text-gray-900">
                      {currentLevel === 1 ? t('all_of_niger') : t('all_of', { name: selectionHistory[selectionHistory.length-1]?.name })}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {currentLevel === 1 ? t('search_entire_country') : t('search_all_areas', { type: currentLevel === 2 ? t('region') : t('department') })}
                    </p>
                  </div>
                </div>
                {((currentLevel === 1 && selectedRegion === 'All Regions') || (currentLevel > 1 && selectedRegion === selectionHistory[selectionHistory.length-1]?.name)) && (
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-secondary flex-shrink-0" />
                )}
              </div>

              {/* Grid - 2 cols mobile, 3 cols desktop */}
              {regions.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {regions.map((region) => (
                    <div
                      key={region.id}
                      onClick={() => handleSelectRegion(region)}
                      className={`flex items-center justify-between p-3 sm:p-4 border border-gray-200 hover:border-secondary/50 hover:bg-secondary/5 cursor-pointer transition-all rounded-xl group ${
                        selectedRegion === region.name ? 'bg-secondary/10 border-secondary' : 'bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <MapPin className="w-4 h-4 sm:w-5 text-secondary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{region.name}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {region.adsCount.toLocaleString()} {t('ads_count')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedRegion === region.name && (
                            <Check className="w-4 h-4 text-secondary flex-shrink-0" />
                        )}
                        {region.level && region.level < 3 && (
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-2xl">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">{t('no_subdivisions_found')}</p>
                </div>
              )}
            </>
          )}
        </div>
    </ResponsiveModal>
  )
}
