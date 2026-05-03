"use client"

import React from 'react'
import { cn } from '@/lib/utils'

interface AdInfoProps {
  attributes: Record<string, any>
  className?: string
}

export default function AdInfo({ attributes, className = '' }: AdInfoProps) {
  if (!attributes || Object.keys(attributes).length === 0) {
    return null
  }

  const formatValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-gray-400 font-medium">N/A</span>
    }

    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400 font-medium">None</span>
      }
      
      // Array of objects (e.g., array type fields with sub-fields)
      if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        return (
          <div className="space-y-1.5 mt-1">
            {value.map((item: any, idx: number) => (
              <div key={idx} className="text-xs border-l-[1.5px] border-slate-200 pl-3 py-1.5 bg-slate-50/50 rounded-r-lg">
                {Object.entries(item).map(([k, v]) => {
                  const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                  return (
                    <div key={k} className="flex gap-2">
                      <span className="font-medium text-slate-500">{childLabel}:</span>
                      <span className="text-slate-900 font-medium">{String(v)}</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )
      }
      
      // Simple array (e.g., tags, skills)
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {value.map((item: any, idx: number) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md border border-slate-200/50"
            >
              {String(item)}
            </span>
          ))}
        </div>
      )
    }

    // Handle objects (nested objects)
    if (typeof value === 'object') {
      return (
        <div className="space-y-1 mt-1">
          {Object.entries(value).map(([k, v]) => {
            const childLabel = k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            return (
              <div key={k} className="flex items-start gap-2 text-xs">
                <span className="font-medium text-slate-500 min-w-[80px]">{childLabel}:</span>
                <span className="text-slate-900 font-medium">{String(v)}</span>
              </div>
            )
          })}
        </div>
      )
    }

    // Handle booleans
    if (typeof value === 'boolean') {
      return (
        <span className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-medium border",
          value 
            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
            : "bg-slate-50 text-slate-600 border-slate-100"
        )}>
          {value ? 'Yes' : 'No'}
        </span>
      )
    }

    // Handle numbers with formatting
    if (typeof value === 'number') {
      return <span className="text-slate-900 font-medium">{value >= 1000 ? value.toLocaleString() : String(value)}</span>
    }

    // Handle strings
    return <span className="text-slate-900 font-medium">{String(value)}</span>
  }

  return (
    <div className={cn(
      "bg-white border border-slate-200 rounded-xl p-6 sm:p-8",
      className
    )}>
      <h2 className="text-lg font-medium text-slate-900 mb-6">Ad Information</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
        {Object.entries(attributes).map(([key, value]) => {
          if (key === 'cv_file_name') return null
          
          const formattedKey = key
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase())
          
          return (
            <div key={key} className="group">
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">{formattedKey}</p>
              <div className="text-sm">
                {formatValue(value)}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}


