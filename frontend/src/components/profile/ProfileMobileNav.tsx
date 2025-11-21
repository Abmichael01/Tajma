"use client"

import React from 'react'
import { Heart, Star, TrendingUp, Settings } from 'lucide-react'

interface ProfileMobileNavProps {
  isOwner: boolean
  onNavigate: (section: string) => void
  currentView?: string | null
}

export default function ProfileMobileNav({ isOwner, onNavigate, currentView }: ProfileMobileNavProps) {

  const navItems = isOwner
    ? [
        { id: 'overview', label: 'Overview', icon: TrendingUp },
        { id: 'saved', label: 'Saved', icon: Heart },
        { id: 'reviews', label: 'Reviews', icon: Star },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    : [
        { id: 'overview', label: 'Overview', icon: TrendingUp },
        { id: 'reviews', label: 'Reviews', icon: Star },
      ]

  return (
    <div className="lg:hidden bg-white border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-200">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-colors ${
                isActive 
                  ? 'bg-secondary/10 text-secondary' 
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-secondary' : 'text-gray-600'}`} />
              <span className={`text-sm font-medium ${isActive ? 'text-secondary' : 'text-gray-900'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

