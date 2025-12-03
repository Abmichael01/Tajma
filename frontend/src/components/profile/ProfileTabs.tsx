"use client"

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { 
  TrendingUp,
  FileText,
  Heart,
  Bell,
  Settings,
  Star
} from 'lucide-react'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProfileTabsProps {
  isOwner?: boolean
}

export default function ProfileTabs({ isOwner = false }: ProfileTabsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  // For visitors, never allow 'overview' tab - default to 'ads'
  const activeTab = tabFromUrl === 'overview' && !isOwner 
    ? 'ads' 
    : (tabFromUrl || (isOwner ? 'overview' : 'ads'))

  const tabs: Tab[] = [
    ...(isOwner ? [
      { id: 'overview', label: 'Overview', icon: TrendingUp },
    ] : []),
    { id: 'ads', label: isOwner ? 'My Ads' : 'Ads', icon: FileText },
    ...(isOwner ? [
      { id: 'saved', label: 'Saved', icon: Heart },
      { id: 'notifications', label: 'Notifications', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings }
    ] : [
      { id: 'reviews', label: 'Reviews', icon: Star }
    ])
  ]

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`?${params.toString()}`, { scroll: false })
    
    // Scroll to top with multiple attempts to ensure it works
    const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
      document.body.scrollTo({ top: 0, behavior: 'smooth' })
    }
    
    // Scroll immediately
    scrollToTop()
    
    // Scroll after navigation
    requestAnimationFrame(() => {
      scrollToTop()
      setTimeout(scrollToTop, 100)
      setTimeout(scrollToTop, 300)
    })
  }

  return (
    <div className="bg-white border border-gray-200">
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
