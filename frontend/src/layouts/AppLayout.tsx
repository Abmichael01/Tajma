"use client"

import React from 'react'
import Navbar from '../components/Layouts/Navbar'
import Footer from '../components/Layouts/Footer'
import GlobalChatConnection from '../components/chat/GlobalChatConnection'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GlobalChatConnection />
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      {/* Hide footer on mobile devices - show only on desktop */}
      <Footer className="hidden md:block" />
    </div>
  )
}
