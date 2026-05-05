"use client"

import React, { useState } from 'react'
import { Link } from '@/i18n/routing'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
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
  type: 'checkbox' | 'radio' | 'range' | 'select' | 'link' | 'nested'
  options: FilterOption[]
  defaultExpanded?: boolean
}

export { FilterGroupItem, RangeFilter }
export type { FilterGroupItemProps }

interface FiltersSectionProps {
  filters: FilterGroup[]
  className?: string
  selectedValues?: Record<string, string | string[]>
  onFilterChange?: (filterId: string, value: string | string[], action?: string) => void
  filterId?: string // Optional: only render this specific filter group
  hideHeader?: boolean // New: hide the top filter title and reset button
}

export default function FiltersSection({ 
  filters, 
  className = "", 
  selectedValues: externalSelectedValues,
  onFilterChange,
  filterId,
  hideHeader = false
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
      const current = selectedValues[groupId] as string[] || []
      newValue = current.includes(optionId) 
        ? current.filter(id => id !== optionId)
        : [...current, optionId]
    } else {
      newValue = optionId
    }
    
    setInternalSelectedValues(prev => ({ ...prev, [groupId]: newValue }))
    
    if (onFilterChange) {
      onFilterChange(groupId, newValue, action)
    }
  }

  return (
    <div className={cn("bg-white border border-gray-200 rounded-[3rem] overflow-hidden", className)}>
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 px-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900 text-sm uppercase tracking-widest">Filters</h3>
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
      
      <div className="py-0">
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
            />
          ))}
      </div>
    </div>
  )
}

interface FilterGroupItemProps {
  group: FilterGroup
  isExpanded: boolean
  toggleGroup: () => void
  selectedValues: Record<string, string | string[]>
  handleFilterChange: (groupId: string, optionId: string, action?: string, type?: string) => void
}

function FilterGroupItem({ 
  group, 
  isExpanded, 
  toggleGroup, 
  selectedValues, 
  handleFilterChange 
}: FilterGroupItemProps) {
  return (
    <div className="border-b border-gray-100 last:border-none">
      <button
        onClick={toggleGroup}
        className="w-full flex items-center justify-between text-left font-bold text-gray-900 p-4 px-5 hover:bg-gray-50/50 transition-all"
      >
        <span className="text-xs uppercase tracking-wider text-gray-500">{group.title}</span>
        <div className={cn("transition-transform duration-300", isExpanded ? "rotate-180" : "")}>
          <ChevronDown className="w-4 h-4 text-primary" />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-5 pb-4 space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
              {group.type === 'range' ? (
                <RangeFilter 
                  groupId={group.id} 
                  selectedValue={selectedValues[group.id] as string} 
                  onChange={(val) => handleFilterChange(group.id, val, undefined, 'range')}
                />
              ) : (
                group.options.map((option) => {
                const isSelected = group.type === 'checkbox' 
                  ? (selectedValues[group.id] as string[] || []).includes(option.id)
                  : selectedValues[group.id] === option.id

                if (group.type === 'link') {
                  return (
                    <Link
                      key={option.id}
                      href={option.action || '#'}
                      className="flex items-center justify-between p-2.5 rounded-xl hover:bg-primary/5 hover:text-primary transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        {option.icon && <div className="flex-shrink-0 text-gray-400 group-hover:text-primary transition-colors">{option.icon}</div>}
                        <span className="text-[13px] text-gray-600 font-medium group-hover:text-primary">
                          {option.label}
                        </span>
                      </div>
                    </Link>
                  )
                }

                if (group.type === 'nested' && option.children) {
                  return (
                    <div key={option.id} className="pt-2">
                      <div className="font-bold text-[11px] text-gray-400 uppercase tracking-tighter ml-2 mb-2">{option.label}</div>
                      <div className="space-y-1 border-l-2 border-gray-50 ml-2 pl-2">
                        {option.children.map((child) => (
                          <Link
                            key={child.id}
                            href={child.action || '#'}
                            className="flex items-center justify-between p-2 rounded-xl hover:bg-secondary/5 hover:text-secondary transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              {child.icon && <div className="flex-shrink-0 text-gray-400 group-hover:text-secondary transition-colors">{child.icon}</div>}
                              <span className="text-[12px] text-gray-600 font-medium group-hover:text-secondary">
                                {child.label}
                              </span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )
                }

                return (
                  <label
                    key={option.id}
                    className={cn(
                      "flex items-center gap-3 p-2.5 cursor-pointer rounded-xl transition-all group",
                      isSelected ? "bg-primary/5" : "hover:bg-gray-50"
                    )}
                  >
                    {(group.type === 'checkbox' || group.type === 'radio') && (
                      <div className="relative">
                        <input
                          type={group.type}
                          name={group.type === 'radio' ? group.id : undefined}
                          checked={isSelected}
                          onChange={() => handleFilterChange(group.id, option.id, option.action, group.type)}
                          className="sr-only"
                        />
                        <div className={cn(
                          "w-5 h-5 border-2 flex items-center justify-center transition-all duration-300",
                          group.type === 'checkbox' ? 'rounded-lg' : 'rounded-full',
                          isSelected 
                            ? "border-primary bg-primary scale-110" 
                            : "border-gray-200 bg-white group-hover:border-primary/40"
                        )}>
                          {isSelected && (
                            group.type === 'checkbox' ? (
                              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                            ) : (
                              <div className="w-2.5 h-2.5 bg-white rounded-full" />
                            )
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex-1 flex items-center gap-3">
                      {option.icon && <div className={cn("flex-shrink-0 transition-colors", isSelected ? "text-primary" : "text-gray-400 group-hover:text-primary")}>{option.icon}</div>}
                      <span className={cn(
                        "text-[13px] transition-colors",
                        isSelected ? "text-primary font-bold" : "text-gray-600 font-medium group-hover:text-primary"
                      )}>
                        {option.label}
                      </span>
                    </div>
                  </label>
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

  // Update local state when selectedValue changes from outside
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
    <div className="space-y-4 pt-2">
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 z-10">XOF</span>
          <Input 
            type="number" 
            placeholder="Min" 
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className="pl-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
          />
        </div>
        <div className="w-2 h-[2px] bg-gray-200" />
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 z-10">XOF</span>
          <Input 
            type="number" 
            placeholder="Max" 
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className="pl-12 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
        </div>
      </div>
      <Button 
        onClick={handleApply}
        variant="primary"
        className="w-full text-xs"
      >
        Apply Price
      </Button>
    </div>
  )
}
