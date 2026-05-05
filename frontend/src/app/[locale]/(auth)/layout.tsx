"use client"

import React from 'react'
import AuthLeftSection from '@/components/auth/AuthLeftSection'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left section with animated ads slideshow - hidden on mobile, fixed position */}
      <AuthLeftSection />
      
      {/* Right section with auth forms - bg-white */}
      <div className="flex-1 lg:ml-[50%] lg:w-1/2 flex flex-col justify-center bg-white">
        <div className="w-full">
          {children}
        </div>
      </div>
    </div>
  )
}

