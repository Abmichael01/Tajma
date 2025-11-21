"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import Navbar from '@/components/Layouts/Navbar'
import Footer from '@/components/Layouts/Footer'
import MobileBottomNav from '@/components/Layouts/MobileBottomNav'
import AccountSetupChecker from '@/components/auth/AccountSetupChecker'
import GlobalChatConnection from '@/components/chat/GlobalChatConnection'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isChatPage = pathname === '/chat'
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Global chat WebSocket connection - stays connected when user is authenticated */}
      <GlobalChatConnection />
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      {!isChatPage && <Footer />}
      <AccountSetupChecker />
      <MobileBottomNav />
    </div>
  )
}

