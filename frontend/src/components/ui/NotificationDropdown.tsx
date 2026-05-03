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
  const profileSlug = user ? (user.username || user.id || 'profile') : 'profile'
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
      <div className="relative">
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="w-10 h-10 rounded-full border border-gray-100 hover:border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center p-0"
          >
            <Bell className="w-5 h-5 text-gray-700 relative z-10" />
          </Button>
        </DropdownMenuTrigger>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] min-w-[20px] h-[20px] px-1 flex items-center justify-center font-bold z-10 rounded-full border-2 border-white shadow-sm pointer-events-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </div>
      
      <DropdownMenuContent align="end" className="w-96 p-0 max-h-[400px] flex flex-col border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-gray-100 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-medium shrink-0">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              className="text-[11px] text-primary hover:text-primary/80 font-medium px-2 py-1 rounded-full bg-primary/5 transition-colors disabled:opacity-50"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="flex-1 min-h-0 overflow-y-auto fancy-scrollbar bg-white">
          {displayedNotifications.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-xs text-gray-400 font-medium">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {displayedNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className="group relative"
                >
                  <DropdownMenuItem
                    asChild
                    className="p-0 border-none focus:bg-gray-50/50"
                  >
                    <Link
                      href={notification.link || '#'}
                      onClick={() => {
                        if (!notification.isRead) {
                          markAsReadMutation.mutate(notification.id)
                          useNotificationsStore.getState().markAsRead(notification.id)
                        }
                      }}
                      className="flex gap-3 p-3 hover:bg-gray-50/50 transition-colors w-full uppercase-none"
                    >
                      {/* Icon */}
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center border border-gray-100">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className={`text-sm text-gray-900 ${
                            !notification.isRead ? 'font-medium' : 'font-normal'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-1.5">
                          {notification.message}
                        </p>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {formatTimeAgo(notification.timestamp)}
                        </span>
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
                    className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-all disabled:opacity-50 z-10"
                    aria-label="Delete notification"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="flex-shrink-0 bg-white border-t border-gray-100">
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
