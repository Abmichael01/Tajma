"use client"

import React from 'react'
import Link from 'next/link'
import { useAuthStore } from '@/store/authStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Bell, 
  FileText, 
  Crown, 
  Heart, 
  Settings, 
  LogOut,
  ChevronDown,
  MessageSquare
} from 'lucide-react'

export default function UserDropdown() {
  const { user, logout } = useAuthStore()

  if (!user) return null

  const handleLogout = () => {
    logout()
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden md:block text-sm font-medium text-gray-700">
            {user.name}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-3 p-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 truncate">{user.name}</p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
            {user.isVerified && (
              <span className="inline-flex items-center gap-1 text-xs text-green-600 mt-1">
                <div className="w-2 h-2 bg-green-500"></div>
                Verified
              </span>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.uid}?tab=overview`} className="flex items-center gap-3 p-3 cursor-pointer">
            <User className="w-4 h-4 text-gray-500" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/chat" className="flex items-center gap-3 p-3 cursor-pointer">
            <MessageSquare className="w-4 h-4 text-gray-500" />
            <span>Messages</span>
            <span className="ml-auto bg-secondary text-secondary-foreground text-xs px-2 py-1">
              2
            </span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.uid}?tab=notifications`} className="flex items-center gap-3 p-3 cursor-pointer">
            <Bell className="w-4 h-4 text-gray-500" />
            <span>Notifications</span>
            <span className="ml-auto bg-secondary text-secondary-foreground text-xs px-2 py-1">
              3
            </span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.uid}?tab=ads`} className="flex items-center gap-3 p-3 cursor-pointer">
            <FileText className="w-4 h-4 text-gray-500" />
            <span>My Ads</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.uid}?tab=saved`} className="flex items-center gap-3 p-3 cursor-pointer">
            <Heart className="w-4 h-4 text-gray-500" />
            <span>Saved Ads</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem asChild>
          <Link href="/premium" className="flex items-center gap-3 p-3 cursor-pointer">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-primary font-medium">Premium Services</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href={`/profile/${user.uid}?tab=settings`} className="flex items-center gap-3 p-3 cursor-pointer">
            <Settings className="w-4 h-4 text-gray-500" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-3 p-3 cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
