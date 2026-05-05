"use client"

import React from 'react'
import { useRouter, usePathname } from '@/i18n/routing'
import { useSearchParams } from 'next/navigation'
import { 
  TrendingUp,
  FileText,
  Heart,
  Bell,
  Settings,
  Star,
  Users,
  HelpCircle
} from 'lucide-react'
import { useTranslations } from 'next-intl'

interface Tab {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

interface ProfileTabsProps {
  isOwner?: boolean
}

export default function ProfileTabs({ isOwner = false }: ProfileTabsProps) {
  const t = useTranslations('user')
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const tabFromUrl = searchParams.get('tab')
  // For visitors, never allow 'overview' tab - default to 'ads'
  const activeTab = tabFromUrl === 'overview' && !isOwner 
    ? 'ads' 
    : (tabFromUrl || (isOwner ? 'overview' : 'ads'))

  const tabs: Tab[] = [
    ...(isOwner ? [
      { id: 'overview', label: t('overview'), icon: TrendingUp },
    ] : []),
    { id: 'ads', label: isOwner ? t('my_ads') : t('ads'), icon: FileText },
    ...(isOwner ? [
      { id: 'leads', label: t('leads'), icon: Users },
      { id: 'saved', label: t('saved'), icon: Heart },
      { id: 'notifications', label: t('notifications'), icon: Bell },
      { id: 'support', label: t('support'), icon: HelpCircle },
      { id: 'settings', label: t('settings'), icon: Settings }
    ] : [
      { id: 'reviews', label: t('reviews'), icon: Star }
    ])
  ]

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', tabId)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    
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
    <div className="border border-gray-200 bg-white rounded-md overflow-hidden">
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
