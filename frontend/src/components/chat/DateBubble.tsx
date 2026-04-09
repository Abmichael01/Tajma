"use client"

import React, { memo } from "react"

interface DateBubbleProps {
  date: string
}

const DateBubble = memo(({ date }: DateBubbleProps) => {
  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (d.toDateString() === today.toDateString()) return "Today"
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday"

    return d.toLocaleDateString([], {
      day: 'numeric',
      month: 'long',
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  return (
    <div className="flex justify-center my-4 sticky top-0 z-20">
      <div className="px-4 py-1.5 rounded-full bg-transparent">
        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none opacity-80">
          {formatDate(date)}
        </span>
      </div>
    </div>
  )
})

DateBubble.displayName = 'DateBubble'

export default DateBubble
