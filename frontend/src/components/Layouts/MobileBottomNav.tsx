"use client"

import type React from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Bell, Home, MessageSquare, Plus, UserRound } from 'lucide-react'
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
      icon: MessageSquare,
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
    // Special handling for notifications - check if we're on alerts page
    if (key === 'notifications') {
      return pathname === '/alerts'
    }
    return pathname?.startsWith(href)
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 border-t border-gray-200 bg-white shadow-2xl shadow-black/5 md:hidden z-50" id="mobile-bottom-nav">
      <div className="max-w-md mx-auto px-3">
        <div className="grid grid-cols-5 items-center h-16">
          <div className="flex justify-center">
            <MobileNavLink item={navItems[0]} active={isActive(navItems[0].href, navItems[0].key)} />
          </div>
          <div className="flex justify-center">
            <MobileNavLink item={navItems[1]} active={isActive(navItems[1].href, navItems[1].key)} />
          </div>

          <div className="flex justify-center items-center h-full">
            <Link
              href="/create-ad"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-md hover:shadow-lg transition-shadow"
              aria-label="Post Ad"
            >
              <Plus className="h-5 w-5" />
            </Link>
          </div>

          <div className="flex justify-center relative">
            <div className="relative">
            <MobileNavLink item={navItems[2]} active={isActive(navItems[2].href, navItems[2].key)} />
              {totalUnreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 bg-secondary text-white text-[10px] min-w-[16px] h-4 px-1 flex items-center justify-center font-semibold z-10">
                  {totalUnreadMessages > 9 ? '9+' : totalUnreadMessages}
                </span>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <MobileNavLink item={navItems[3]} active={isActive(navItems[3].href, navItems[3].key)} />
          </div>
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
        navBase,
        active ? 'text-secondary' : 'text-gray-500 hover:text-gray-800'
      )}
    >
      <Icon className={cn('h-5 w-5 mb-1', active && 'fill-secondary/10')} />
      {item.label}
    </Link>
  )
}

