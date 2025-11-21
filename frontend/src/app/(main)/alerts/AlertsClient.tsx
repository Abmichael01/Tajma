"use client"

import React, { useEffect, useState } from 'react'
import ProfileNotifications from '@/components/profile/ProfileNotifications'

export default function AlertsClient() {
  const [navbarHeight, setNavbarHeight] = useState(64)

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('header')
      if (navbar) {
        const height = navbar.offsetHeight
        setNavbarHeight(height)
      }
    }
    
    updateNavbarHeight()
    window.addEventListener('resize', updateNavbarHeight)
    
    return () => window.removeEventListener('resize', updateNavbarHeight)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Sticky below navbar */}
      <div 
        className="sticky z-40 bg-white border-b border-gray-200 flex items-center py-3 px-4"
        style={{ top: `${navbarHeight}px` }}
      >
        <h2 className="text-lg font-semibold text-gray-900">Alerts</h2>
      </div>

      {/* Content */}
      <div className="container py-4">
        <ProfileNotifications />
      </div>
    </div>
  )
}

