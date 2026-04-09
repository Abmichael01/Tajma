"use client"

import React from 'react'
import { X, Copy, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SelectionBarProps {
  selectedCount: number
  canDelete: boolean
  onCancel: () => void
  onCopy: () => void
  onDelete: () => void
}

export default function SelectionBar({
  selectedCount,
  canDelete,
  onCancel,
  onCopy,
  onDelete
}: SelectionBarProps) {
  return (
    <div className="h-[72px] bg-white border-t border-gray-200 flex items-center justify-between px-4 animate-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-4">
        <button 
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Cancel selection"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-900">
          {selectedCount} {selectedCount === 1 ? 'message' : 'messages'} selected
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onCopy}
          className="rounded-full text-gray-600 hover:text-primary hover:bg-primary/5 hover:border-primary/20 gap-2 border-gray-200"
          disabled={selectedCount === 0}
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copy</span>
        </Button>
        {canDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 hover:border-red-200 gap-2 border-gray-200"
            disabled={selectedCount === 0}
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        )}
      </div>
    </div>
  )
}
