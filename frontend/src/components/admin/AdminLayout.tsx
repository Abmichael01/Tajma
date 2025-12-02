"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import AdminSidebar from './AdminSidebar'
import AdminHeader from './AdminHeader'
import { AdminRouteGuard } from '@/hooks/useAdminAuth'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const sidebarWidth = isCollapsed ? 70 : 250 // 80px collapsed, 250px expanded

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-white p-4">
        {/* Sidebar - Fixed position */}
        <aside 
          className="fixed left-4 top-4 bottom-4 z-50 transition-all duration-300"
          style={{ width: `${sidebarWidth}px` }}
        >
          <AdminSidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
        </aside>

        {/* Main content area - Takes remaining space with margin for fixed sidebar */}
        <div 
          className="flex flex-col gap-4 h-screen transition-all duration-300 pb-4" 
          style={{ marginLeft: `${sidebarWidth + 16}px`, marginRight: '16px' }}
        >
          {/* Header */}
          <div className="flex-shrink-0">
            <AdminHeader isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
          </div>

          {/* Main content */}
          <main className="flex-1">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 rounded-2xl p-4 min-h-full border border-gray-100 pb-4"
            >
              {children}
            </motion.div>
          </main>
        </div>
      </div>
    </AdminRouteGuard>
  )
}
