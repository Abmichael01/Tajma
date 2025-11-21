"use client"

import React from 'react'
import Link from 'next/link'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useAuthStore } from '@/store/authStore'
import { useInitializeNotifications } from '@/hooks/useInitializeNotifications'
import { useMarkNotificationAsRead, useMarkAllNotificationsAsRead, useDeleteNotification } from '@/hooks/useNotifications'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from './button'
import { 
  Bell, 
  MessageSquare, 
  Eye, 
  Heart, 
  DollarSign, 
  Info,
  X,
  Check,
  Phone,
  Star,
  AlertCircle,
  ChevronRight
} from 'lucide-react'

export default function NotificationDropdown() {
  const { user } = useAuthStore()
  const profileSlug = user ? (user.username || user.email?.split('@')[0] || 'profile') : 'profile'
  const { 
    notifications, 
    getUnreadCount
  } = useNotificationsStore()
  
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()
  const deleteNotificationMutation = useDeleteNotification()
  
  const unreadCount = getUnreadCount()
  
  // Initialize notifications and WebSocket
  useInitializeNotifications()
  
  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    markAsReadMutation.mutate(notificationId)
    useNotificationsStore.getState().markAsRead(notificationId)
  }
  
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    markAllAsReadMutation.mutate()
    useNotificationsStore.getState().markAllAsRead()
  }
  
  const handleDeleteNotification = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteNotificationMutation.mutate(notificationId)
    useNotificationsStore.getState().deleteNotification(notificationId)
  }

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-4 h-4"
    switch (type) {
      case 'message':
        return <MessageSquare className={`${iconClass} text-blue-500`} />
      case 'view':
        return <Eye className={`${iconClass} text-green-500`} />
      case 'favorite':
        return <Heart className={`${iconClass} text-red-500`} />
      case 'offer':
        return <Star className={`${iconClass} text-yellow-500`} />
      case 'phone_view':
        return <Phone className={`${iconClass} text-purple-500`} />
      default:
        return <Bell className={`${iconClass} text-gray-500`} />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    const diffWeeks = Math.floor(diffDays / 7)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    return new Date(timestamp).toLocaleDateString()
  }

  // Sort notifications by timestamp (newest first) and take first 8
  const displayedNotifications = [...notifications]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 8)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell className="w-5 h-5 text-gray-700 relative z-10" />
          {unreadCount > 0 && (
            <span className="absolute bottom-[80%] left-[70%] bg-secondary text-white text-xs min-w-[18px] h-[18px] px-1.5 flex items-center justify-center z-20">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 p-0 max-h-[400px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-gray-700" />
            <DropdownMenuLabel className="p-0 font-semibold text-gray-900">
              Notifications
            </DropdownMenuLabel>
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full font-medium">
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 min-h-0 overflow-y-auto fancy-scrollbar">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium mb-1">No notifications</p>
              <p className="text-gray-500 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group relative ${!notification.isRead ? 'bg-blue-50/30' : ''}`}
                >
                  <DropdownMenuItem
                    asChild
                    className="p-0"
                  >
                    <Link
                      href={notification.link || '#'}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsReadMutation.mutate(notification.id)
                          useNotificationsStore.getState().markAsRead(notification.id)
                        }
                      }}
                      className="flex gap-3 p-4 hover:bg-gray-50 transition-colors w-full"
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-200">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className={`text-sm font-medium text-gray-900 ${!notification.isRead ? 'font-semibold' : ''}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          {notification.adId && (
                            <>
                              <span className="text-gray-300">•</span>
                              <span className="text-xs text-primary font-medium">View ad</span>
                            </>
                          )}
                        </div>
                      </div>
                    </Link>
                  </DropdownMenuItem>
                  
                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteNotification(notification.id, e)
                    }}
                    disabled={deleteNotificationMutation.isPending}
                    className="absolute top-4 right-4 p-1.5 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 z-10"
                    aria-label="Delete notification"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex-shrink-0 border-t border-gray-200">
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href={`/profile/${profileSlug}?tab=notifications`}
                className="flex items-center justify-center gap-2 p-3 text-sm text-primary hover:text-primary/80 font-medium"
              >
                View All Notifications
                <ChevronRight className="w-4 h-4" />
              </Link>
            </DropdownMenuItem>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
