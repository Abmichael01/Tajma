"use client"

import React from 'react'
import { useRouter } from '@/i18n/routing'
import { useAuthStore } from '@/store/authStore'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ChevronLeft } from '@/components/icons/icons/ChevronLeft'
import { ChevronRight } from '@/components/icons/icons/ChevronRight'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { LogOut, ChevronDown } from 'lucide-react'
import { getUserFullName, getUserInitials } from '@/utils/user'
import { useTranslations } from 'next-intl'

interface AdminHeaderProps {
  isCollapsed: boolean
  onToggle: () => void
}

export default function AdminHeader({ isCollapsed, onToggle }: AdminHeaderProps) {
  const t_header = useTranslations('admin.header')
  const t_sidebar = useTranslations('admin.sidebar')
  const { user, logout } = useAuthStore()
  const router = useRouter()
  
  const displayName = user ? getUserFullName(user) : t_header('admin')
  const userInitials = user ? getUserInitials(user) : 'A'

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header 
      className="h-16 bg-gray-50 flex items-center justify-between px-6 rounded-2xl border border-gray-100 w-full"
    >
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          aria-label={isCollapsed ? t_header('expand_sidebar') : t_header('collapse_sidebar')}
        >
          {isCollapsed ? (
            <ChevronRight
              width={20}
              height={20}
              stroke="#6b7280"
              strokeWidth={2}
            />
          ) : (
            <ChevronLeft
              width={20}
              height={20}
              stroke="#6b7280"
              strokeWidth={2}
            />
          )}
        </button>
        <div className="flex-1">
          {/* Can add breadcrumbs or page title here */}
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 transition-colors"
            >
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar || undefined} alt={displayName} />
                <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900">
                  {displayName}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="flex items-center gap-3 p-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user?.avatar || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{displayName}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-3 p-3 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{t_sidebar('logout')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
