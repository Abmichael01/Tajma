"use client"

import React, { useState } from 'react'
import { Link } from '@/i18n/routing'
import { ChevronDown, Check, MapPin, ChevronRight, LayoutGrid, Tag, List, Image as ImageIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Button } from './button'

export interface FilterOption {
  id: string
  label: string
  action?: string // URL for navigation
  count?: number
  icon?: React.ReactNode
  children?: FilterOption[] // For nested filters
}

export interface FilterGroup {
  id: string
  title: string
  type: 'checkbox' | 'radio' | 'range' | 'select' | 'link' | 'nested' | 'action'
  options: FilterOption[]
  defaultExpanded?: boolean
}

interface FiltersSectionProps {
  filters: FilterGroup[]
  className?: string
  selectedValues?: Record<string, string | string[]>
  onFilterChange?: (filterId: string, value: string | string[], action?: string) => void
  filterId?: string // Optional: only render this specific filter group
  hideHeader?: boolean // New: hide the top filter title and reset button
  variant?: 'default' | 'mobile-app'
}

export default function FiltersSection({ 
  filters, 
  className = "", 
  selectedValues: externalSelectedValues,
  onFilterChange,
  filterId,
  hideHeader = false,
  variant = 'default'
}: FiltersSectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filters.map(f => f.id))
  )
  const [internalSelectedValues, setInternalSelectedValues] = useState<Record<string, string | string[]>>({})

  // Auto-expand new filter groups when filters list changes
  React.useEffect(() => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      filters.forEach(f => next.add(f.id))
      return next
    })
  }, [filters])

  const selectedValues = externalSelectedValues || internalSelectedValues

  const toggleGroup = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const handleFilterChange = (groupId: string, optionId: string, action?: string, type: string = 'checkbox') => {
    let newValue: string | string[]
    
    if (type === 'checkbox') {
      const current = (selectedValues[groupId] as string[] || []).map(String)
      newValue = current.includes(String(optionId)) 
        ? current.filter(id => id !== String(optionId))
        : [...current, String(optionId)]
    } else {
      // Toggle off if same option is clicked, otherwise select new one
      newValue = String(selectedValues[groupId]) === String(optionId) ? '' : String(optionId)
    }
    
    setInternalSelectedValues(prev => ({ ...prev, [groupId]: newValue }))
    
    if (onFilterChange) {
      onFilterChange(groupId, newValue, action)
    }
  }

  // If variant is mobile-app, we use the mobile app design (already split style)
  if (variant === 'mobile-app') {
    return (
      <div className={cn("space-y-6", className)}>
        {filters
          .filter(group => !filterId || group.id === filterId)
          .map((group) => (
            <div key={group.id} className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.15em] text-gray-400 font-bold px-1">{group.title}</span>
              <div className="space-y-3">
                {group.type === 'range' ? (
                  <RangeFilterMobile 
                    selectedValue={selectedValues[group.id] as string} 
                    onChange={(val) => handleFilterChange(group.id, val, undefined, 'range')}
                  />
                ) : group.type === 'action' ? (
                  <button
                    onClick={() => handleFilterChange(group.id, 'trigger', undefined, 'action')}
                    className={cn(
                      "w-full flex flex-row items-center justify-between rounded-[22px] p-4 border transition-all",
                      selectedValues[group.id] ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100"
                    )}
                  >
                    <div className="flex flex-row items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className={cn("font-bold text-sm truncate", selectedValues[group.id] ? "text-white" : "text-gray-900")}>
                          {selectedValues[group.id] || "All Locations"}
                        </p>
                        <p className={cn("text-[10px] uppercase font-bold text-gray-400", selectedValues[group.id] && "text-white/50")}>
                          Location
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                  </button>
                ) : (
                  group.options.map((option) => {
                    const isSelected = group.type === 'checkbox' 
                      ? (selectedValues[group.id] as string[] || []).map(String).includes(String(option.id))
                      : String(selectedValues[group.id]) === String(option.id)

                    return (
                      <div
                        key={option.id}
                        onClick={() => handleFilterChange(group.id, option.id, option.action, group.type)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-[22px] border cursor-pointer transition-all gap-3",
                          isSelected ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                           <div className={cn(
                             "w-10 h-10 rounded-full flex items-center justify-center border overflow-hidden shrink-0",
                             isSelected ? "bg-white border-white" : "bg-white border-gray-200"
                           )}>
                             {option.icon || <Tag className="w-5 h-5 text-primary" />}
                           </div>
                           <span className={cn("text-xs font-bold truncate", isSelected ? "text-white" : "text-gray-700")}>
                             {option.label}
                           </span>
                        </div>
                        <div className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-all shrink-0",
                          isSelected ? "bg-white border-white" : "bg-white border-gray-200"
                        )}>
                          {isSelected && <Check className="w-3 h-3 text-slate-900" strokeWidth={4} />}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          ))}
      </div>
    )
  }

  // Default Desktop view (Split Containers, No Shadow, Reduced Padding, Original Text Size)
  return (
    <div className={cn("space-y-[8px] bg-transparent border-none shadow-none", className)}>
      {!hideHeader && (
        <div className="bg-white border border-gray-200 rounded-[22px] overflow-hidden flex items-center justify-between p-3 px-4">
          <h3 className="font-bold text-gray-900 text-lg">Filters</h3>
          <Button 
            variant="link"
            size="sm"
            onClick={() => {
              setInternalSelectedValues({})
              if (onFilterChange) {
                onFilterChange('reset', '')
              }
            }}
            className="h-auto p-0 font-bold hover:scale-105"
          >
            Reset
          </Button>
        </div>
      )}
      
      {filters
        .filter(group => !filterId || group.id === filterId)
        .map((group) => (
          <FilterGroupItem 
            key={group.id} 
            group={group} 
            isExpanded={filterId === group.id || expandedGroups.has(group.id)}
            toggleGroup={() => toggleGroup(group.id)}
            selectedValues={selectedValues}
            handleFilterChange={handleFilterChange}
            isStandalone={!!filterId}
          />
        ))}
    </div>
  )
}

function FilterGroupItem({ 
  group, 
  isExpanded, 
  toggleGroup, 
  selectedValues, 
  handleFilterChange,
  isStandalone = false
}: { 
  group: FilterGroup, 
  isExpanded: boolean, 
  toggleGroup: () => void, 
  selectedValues: Record<string, string | string[]>, 
  handleFilterChange: (groupId: string, optionId: string, action?: string, type?: string) => void,
  isStandalone?: boolean 
}) {
  const showHeader = !isStandalone;

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-[22px] overflow-hidden transition-all shadow-none",
      isStandalone && "border-none"
    )}>
      {showHeader && (
        <button
          onClick={toggleGroup}
          className="w-full flex items-center justify-between text-left font-bold text-gray-900 p-3 px-4 hover:bg-gray-50/50 transition-all"
        >
          <span className="text-[13px] text-gray-500 font-bold">{group.title}</span>
          <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")}>
            <ChevronDown className="w-4 h-4 text-gray-300" />
          </div>
        </button>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div 
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-4 pb-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {group.type === 'range' ? (
                <RangeFilter 
                  groupId={group.id} 
                  selectedValue={selectedValues[group.id] as string} 
                  onChange={(val) => handleFilterChange(group.id, val, undefined, 'range')}
                />
              ) : group.type === 'action' ? (
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl justify-between h-10 px-3 group border-gray-100 bg-gray-50 hover:bg-gray-100"
                    onClick={() => handleFilterChange(group.id, 'trigger', undefined, 'action')}
                  >
                    <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                       <MapPin className="w-4 h-4 text-primary shrink-0" />
                       <span className="truncate text-[13px] text-gray-700 font-bold flex-1 text-left">
                          {selectedValues[group.id] || "All Locations"}
                       </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors shrink-0" />
                  </Button>
                </div>
              ) : (
                group.options.map((option) => {
                const isSelected = group.type === 'checkbox' 
                  ? (selectedValues[group.id] as string[] || []).map(String).includes(String(option.id))
                  : String(selectedValues[group.id]) === String(option.id)

                return (
                  <div
                    key={option.id}
                    onClick={() => handleFilterChange(group.id, option.id, option.action, group.type)}
                    className={cn(
                      "flex items-center justify-between p-2 cursor-pointer rounded-xl transition-all group border gap-2",
                      isSelected ? "bg-primary/5 border-primary" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                       <div className={cn(
                         "w-8 h-8 rounded-full flex items-center justify-center border overflow-hidden shrink-0",
                         isSelected ? "bg-white border-primary" : "bg-white border-gray-100"
                       )}>
                         {option.icon || <Tag className="w-4 h-4 text-primary" />}
                       </div>
                       <span className={cn(
                         "text-[13px] transition-colors truncate flex-1",
                         isSelected ? "text-primary font-bold" : "text-gray-600 font-bold group-hover:text-primary"
                       )}>
                         {option.label}
                       </span>
                    </div>
                    {isSelected && (
                       <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 text-white" strokeWidth={5} />
                       </div>
                    )}
                  </div>
                )
              })
            )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function RangeFilter({ 
  selectedValue, 
  onChange 
}: { 
  groupId: string, 
  selectedValue: string, 
  onChange: (val: string) => void 
}) {
  const [min, setMin] = React.useState('')
  const [max, setMax] = React.useState('')

  React.useEffect(() => {
    if (!selectedValue || selectedValue === 'any') {
      setMin('')
      setMax('')
      return
    }

    if (selectedValue.includes('-')) {
      const [vMin, vMax] = selectedValue.split('-')
      setMin(vMin || '')
      setMax(vMax || '')
    } else if (selectedValue.endsWith('+')) {
      setMin(selectedValue.replace('+', ''))
      setMax('')
    }
  }, [selectedValue])

  const handleApply = () => {
    if (!min && !max) {
      onChange('any')
      return
    }
    
    if (min && max) {
      onChange(`${min}-${max}`)
    } else if (min) {
      onChange(`${min}+`)
    } else if (max) {
      onChange(`0-${max}`)
    }
  }

  return (
    <div className="space-y-3 pt-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative min-w-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 z-10">XOF</span>
          <Input 
            type="number" 
            placeholder="Min" 
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="pl-12 rounded-lg h-9 text-xs border-gray-100 bg-gray-50 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        </div>
        <div className="w-1.5 h-[1.5px] bg-gray-200 shrink-0" />
        <div className="flex-1 relative min-w-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400 z-10">XOF</span>
          <Input 
            type="number" 
            placeholder="Max" 
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="pl-12 rounded-lg h-9 text-xs border-gray-100 bg-gray-50 focus:bg-white transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
      <Button 
        onClick={handleApply}
        variant="primary"
        className="w-full h-9 rounded-lg text-xs font-bold uppercase tracking-widest shadow-sm"
      >
        Apply Price
      </Button>
    </div>
  )
}

function RangeFilterMobile({ 
  selectedValue, 
  onChange 
}: { 
  selectedValue: string, 
  onChange: (val: string) => void 
}) {
  const [min, setMin] = React.useState('')
  const [max, setMax] = React.useState('')

  React.useEffect(() => {
    if (!selectedValue || selectedValue === 'any') {
      setMin('')
      setMax('')
      return
    }

    if (selectedValue.includes('-')) {
      const [vMin, vMax] = selectedValue.split('-')
      setMin(vMin || '')
      setMax(vMax || '')
    } else if (selectedValue.endsWith('+')) {
      setMin(selectedValue.replace('+', ''))
      setMax('')
    }
  }, [selectedValue])

  const handleApply = () => {
    if (!min && !max) {
      onChange('any')
      return
    }
    
    if (min && max) {
      onChange(`${min}-${max}`)
    } else if (min) {
      onChange(`${min}+`)
    } else if (max) {
      onChange(`0-${max}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row gap-3">
        <div className={cn(
          "flex-1 border rounded-[22px] p-4 transition-all min-w-0",
          min ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100"
        )}>
          <p className={cn("text-[10px] font-bold uppercase mb-1 truncate", min ? "text-white/50" : "text-gray-400")}>
            Min (XOF)
          </p>
          <input 
            type="number" 
            placeholder="0" 
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className={cn(
              "w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              min ? "text-white" : "text-gray-900"
            )}
          />
        </div>
        <div className={cn(
          "flex-1 border rounded-[22px] p-4 transition-all min-w-0",
          max ? "bg-slate-900 border-slate-900" : "bg-gray-50 border-gray-100"
        )}>
          <p className={cn("text-[10px] font-bold uppercase mb-1 truncate", max ? "text-white/50" : "text-gray-400")}>
            Max (XOF)
          </p>
          <input 
            type="number" 
            placeholder="Any" 
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className={cn(
              "w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-bold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
              max ? "text-white" : "text-gray-900"
            )}
          />
        </div>
      </div>
      <Button 
        onClick={handleApply}
        variant="primary"
        className="w-full h-12 rounded-full text-xs font-bold uppercase tracking-widest shadow-sm"
      >
        Apply Price
      </Button>
    </div>
  )
}
