'use client'

import { Skeleton } from './skeleton'
import { useNavbarHeight } from '@/hooks/useNavbarHeight'
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight'

export function ChatListSkeleton() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* Chat Items Skeleton */}
      <div className="flex-1 overflow-y-auto">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="p-4 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-3 w-32 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChatAreaSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 min-w-0">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <Skeleton className="w-8 h-8 rounded-full" />
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-50">
        {Array.from({ length: 6 }).map((_, index) => {
          const isOwn = index % 3 === 0
          return (
            <div key={index} className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {!isOwn && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
              <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                <Skeleton className={`h-10 ${isOwn ? 'w-32' : 'w-40'} rounded-lg`} />
              </div>
              {isOwn && <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* Input Skeleton */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white">
        <Skeleton className="h-12 w-full rounded-full" />
      </div>
    </div>
  )
}

export default function ChatSkeleton() {
  const navbarHeight = useNavbarHeight()
  const bottomNavHeight = useBottomNavHeight()
  
  // Calculate available height: viewport - navbar - bottom nav
  // bottomNavHeight will be 0 on desktop (since bottom nav is hidden with md:hidden)
  const availableHeight = `calc(100vh - ${navbarHeight}px - ${bottomNavHeight}px)`
  
  return (
    <div
      className="bg-white fixed inset-x-0 container px-0 md:px-0 overflow-hidden"
      style={{
        height: availableHeight,
        top: `${navbarHeight}px`,
        maxHeight: availableHeight,
      }}
    >
      <div className="h-full flex border-x border-gray-200 md:border-x overflow-hidden">
        {/* Chat List Skeleton */}
        <div className="hidden md:flex md:w-80 lg:w-96 bg-white border-r border-gray-200 flex-col h-full overflow-hidden">
          <ChatListSkeleton />
        </div>

        {/* Chat Area Skeleton */}
        <div className="w-full md:flex md:flex-1 flex-col h-full overflow-hidden">
          <ChatAreaSkeleton />
        </div>
      </div>
    </div>
  )
}

