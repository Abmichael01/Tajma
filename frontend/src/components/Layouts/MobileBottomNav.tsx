"use client"

import type React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Bell, Home, MessageCircleMore, Plus, UserRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useChats } from '@/hooks/useChat'

const navBase =
  'flex flex-col items-center justify-center text-[11px] font-medium transition-colors'

export default function MobileBottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated, user } = useAuthStore()
  const { data: chats = [] } = useChats()
  const profileSlug = user ? user.username || user.email?.split('@')[0] || 'profile' : 'profile'

  // Calculate total unread messages from all chats
  const totalUnreadMessages = chats.reduce((total, chat) => total + (chat.unread_count || 0), 0)

  const profileHref = isAuthenticated ? `/profile/${profileSlug}` : '/login'
  const notificationsHref = isAuthenticated ? '/alerts' : '/login'
  const chatsHref = isAuthenticated ? '/chat' : '/login'

  const navItems = [
    {
      key: 'home',
      label: 'Home',
      href: '/',
      icon: Home,
    },
    {
      key: 'notifications',
      label: 'Alerts',
      href: notificationsHref,
      icon: Bell,
    },
    {
      key: 'chats',
      label: 'Chats',
      href: chatsHref,
      icon: MessageCircleMore,
    },
    {
      key: 'profile',
      label: 'Profile',
      href: profileHref,
      icon: UserRound,
    },
  ]

  const isActive = (href: string, key: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    if (key === 'notifications') {
      return pathname === '/alerts'
    }
    return pathname === href || pathname?.startsWith(`${href}/`)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 bg-white border-t border-gray-100 rounded-t-[32px] md:hidden z-50 shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)]" id="mobile-bottom-nav">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-between h-[70px]">
          {/* Home */}
          <MobileNavLink item={navItems[0]} active={isActive(navItems[0].href, navItems[0].key)} />
          
          {/* Alerts */}
          <MobileNavLink item={navItems[1]} active={isActive(navItems[1].href, navItems[1].key)} />

          {/* Post - Central Button */}
          <div className="flex flex-col items-center justify-center -mt-6">
            <Link
              href="/create-ad"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg shadow-primary/30 hover:shadow-xl transition-all active:scale-95"
              aria-label="Post Ad"
            >
              <Plus className="h-6 w-6 stroke-[3px]" />
            </Link>
            <span className="text-[10px] font-bold text-gray-400 mt-1">Post</span>
          </div>

          {/* Chats */}
          <div className="relative">
            <MobileNavLink item={navItems[2]} active={isActive(navItems[2].href, navItems[2].key)} />
            {totalUnreadMessages > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-white text-[10px] min-w-[20px] h-[20px] rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm z-10">
                {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
              </span>
            )}
          </div>

          {/* Profile */}
          <MobileNavLink item={navItems[3]} active={isActive(navItems[3].href, navItems[3].key)} />
        </div>
      </div>
    </nav>
  )
}

type NavItem = {
  key: string
  label: string
  href: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

function MobileNavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  return (
    <Link
      href={item.href}
      className={cn(
        "flex flex-col items-center justify-center transition-all duration-200",
        active ? 'text-primary' : 'text-gray-400'
      )}
    >
      <div className={cn(
        "w-9 h-9 rounded-full flex items-center justify-center mb-0.5 transition-all",
        active ? 'bg-primary/10 border border-primary/20' : 'bg-transparent'
      )}>
        <Icon className={cn('h-[22px] w-[22px]', active && 'stroke-[2.5px]')} />
      </div>
      <span className={cn("text-[10px]", active ? "font-bold" : "font-medium")}>
        {item.label}
      </span>
    </Link>
  )
}

