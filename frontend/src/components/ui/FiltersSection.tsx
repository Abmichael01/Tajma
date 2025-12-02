"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface FilterOption {
  id: string
  label: string
  action?: string // URL for navigation
  count?: number
  children?: FilterOption[] // For nested filters
}

export interface FilterGroup {
  id: string
  title: string
  type: 'checkbox' | 'radio' | 'range' | 'select' | 'link' | 'nested'
  options: FilterOption[]
  defaultExpanded?: boolean
}

interface FiltersSectionProps {
  filters: FilterGroup[]
  className?: string
  onFilterChange?: (filterId: string, value: string | string[], action?: string) => void
}

export default function FiltersSection({ filters, className = "", onFilterChange }: FiltersSectionProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(filters.filter(f => f.defaultExpanded).map(f => f.id))
  )
  const [selectedValues, setSelectedValues] = useState<Record<string, string | string[]>>({})

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
    
    setSelectedValues(prev => ({ ...prev, [groupId]: newValue }))
    
    if (onFilterChange) {
      onFilterChange(groupId, newValue, action)
    }
  }

  const renderFilterGroup = (group: FilterGroup) => {
    const isExpanded = expandedGroups.has(group.id)
    
    return (
      <div key={group.id} className="border border-gray-200 bg-white">
        <button
          onClick={() => toggleGroup(group.id)}
          className="w-full flex items-center justify-between text-left font-medium text-gray-900 p-3 hover:text-secondary transition-colors border-b border-gray-200"
        >
          <span className="text-xs sm:text-sm">{group.title}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              className="p-3 space-y-1.5 max-h-64 overflow-y-auto custom-scrollbar"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              {group.options.map((option, index) => {
              const isSelected = group.type === 'checkbox' 
                ? (selectedValues[group.id] as string[] || []).includes(option.id)
                : selectedValues[group.id] === option.id

              if (group.type === 'link') {
                return (
                  <Link
                    key={option.id}
                    href={option.action || '#'}
                    className="flex items-center justify-between p-1.5 hover:bg-gray-50 hover:text-secondary transition-colors group"
                  >
                    <span className="text-[11px] sm:text-xs text-gray-600 group-hover:text-secondary">
                      {option.label}
                    </span>
                    {option.count !== undefined && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {option.count.toLocaleString()}
                      </span>
                    )}
                  </Link>
                )
              }

              if (group.type === 'nested' && option.children) {
                return (
                  <div key={option.id} className="ml-2">
                    <div className="font-medium text-[11px] sm:text-xs text-gray-700 mb-1.5">{option.label}</div>
                    <div className="space-y-1">
                      {option.children.map((child) => (
                        <Link
                          key={child.id}
                          href={child.action || '#'}
                          className="flex items-center justify-between p-1.5 hover:bg-gray-50 hover:text-secondary transition-colors group ml-2"
                        >
                          <span className="text-[10px] sm:text-[11px] text-gray-600 group-hover:text-secondary">
                            {child.label}
                          </span>
                          {child.count !== undefined && (
                            <span className="text-[10px] text-gray-400 bg-gray-100 px-1 py-0.5 rounded">
                              {child.count}
                            </span>
                          )}
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
                    "flex items-center gap-2 p-1.5 cursor-pointer hover:bg-gray-50 transition-colors group",
                    isSelected && "bg-secondary/5"
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
                        "w-4 h-4 border-2 flex items-center justify-center transition-colors",
                        group.type === 'checkbox' ? 'rounded' : 'rounded-full',
                        isSelected 
                          ? "border-secondary bg-secondary" 
                          : "border-gray-300 group-hover:border-secondary/50"
                      )}>
                        {isSelected && (
                          group.type === 'checkbox' ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <span className={cn(
                    "text-[11px] sm:text-xs transition-colors",
                    isSelected ? "text-secondary font-medium" : "text-gray-600 group-hover:text-secondary"
                  )}>
                    {option.label}
                  </span>

                  {option.count !== undefined && (
                    <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-auto">
                      {option.count.toLocaleString()}
                    </span>
                  )}
                </label>
              )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn("w-full sm:w-[300px] bg-white h-fit", className)}>
      <div className="flex items-center justify-between mb-2 px-3 pt-2">
        <h3 className="font-medium text-gray-900 text-[11px] sm:text-xs">Filters</h3>
        <button 
          onClick={() => setSelectedValues({})}
          className="text-[10px] sm:text-[11px] text-secondary hover:text-secondary/80 transition-colors"
        >
          Clear All
        </button>
      </div>
      
      <div className="space-y-2 px-3 pb-2">
        {filters.map(renderFilterGroup)}
      </div>
    </div>
  )
}
