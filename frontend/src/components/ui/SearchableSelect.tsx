"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Check, Search, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from './input'
import { Button } from './button'

interface Option {
  id: number | string
  name: string
}

interface SearchableSelectProps {
  options: Option[]
  value?: string | number
  onSelect: (value: Option | null) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  error?: string
  label?: string
}

export default function SearchableSelect({
  options,
  value,
  onSelect,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  disabled = false,
  className,
  error,
  label
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedOption = options.find(opt => opt.id.toString() === value?.toString())

  const filteredOptions = options.filter(opt =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (option: Option) => {
    onSelect(option)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect(null)
    setSearchQuery('')
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm bg-white border cursor-pointer transition-all h-12 rounded-full",
          isOpen ? "border-primary ring-2 ring-primary/10" : "border-gray-200",
          disabled && "bg-gray-50 cursor-not-allowed opacity-60",
          error && "border-red-500 ring-red-500/10",
        )}
      >
        <div className="flex items-center gap-2 truncate pr-6">
          <span className={cn("truncate", !selectedOption && "text-gray-400 font-normal")}>
            {selectedOption ? selectedOption.name : placeholder}
          </span>
        </div>
        <div className="flex items-center gap-1 absolute right-3">
            {selectedOption && !disabled && (
                <button 
                  onClick={handleClear}
                  className="p-1 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
                >
                    <X className="w-3.5 h-3.5" />
                </button>
            )}
            <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400 ml-2" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="border-none focus-visible:ring-0 h-9 p-0 bg-transparent text-sm"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50 transition-colors",
                    selectedOption?.id === option.id && "bg-primary/5 text-primary font-medium"
                  )}
                >
                  <span className="truncate">{option.name}</span>
                  {selectedOption?.id === option.id && (
                    <Check className="w-4 h-4 flex-shrink-0" />
                  )}
                </div>
              ))
            ) : (
              <div className="px-3 py-6 text-sm text-gray-500 text-center bg-gray-50/30">
                No results found for "{searchQuery}"
              </div>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
