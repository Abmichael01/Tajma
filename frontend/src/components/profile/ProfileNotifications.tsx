'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useInitializeNotifications } from '@/hooks/useInitializeNotifications'
import { 
  Bell, 
  MessageSquare, 
  Eye, 
  Heart, 
  DollarSign, 
  Info,
  X,
  Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProfileNotifications() {
  const { 
    notifications, 
    getUnreadCount, 
    markAsRead, 
    markAllAsRead,
    deleteNotification,
    clearAll
  } = useNotificationsStore()
  
  const unreadCount = getUnreadCount()
  
  // Initialize notifications
  useInitializeNotifications()

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />
      case 'view':
        return <Eye className="w-5 h-5 text-green-600" />
      case 'favorite':
        return <Heart className="w-5 h-5 text-red-500" />
      case 'offer':
        return <DollarSign className="w-5 h-5 text-yellow-600" />
      case 'system':
        return <Info className="w-5 h-5 text-gray-600" />
      default:
        return <Bell className="w-5 h-5 text-gray-600" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const past = new Date(timestamp)
    const diffMs = now.getTime() - past.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No notifications yet
        </h3>
        <p className="text-gray-600">
          You'll see notifications here when there's activity on your account
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <p className="text-sm text-gray-500">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              onClick={markAllAsRead}
              size="sm"
            >
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                if (confirm('Are you sure you want to clear all notifications?')) {
                  clearAll()
                }
              }}
              size="sm"
            >
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`bg-white border border-gray-200 p-4 hover:shadow-md transition-shadow group ${
              !notification.isRead ? 'bg-blue-50/30 border-secondary/30' : ''
            }`}
          >
            <Link
              href={notification.link || '#'}
              onClick={() => markAsRead(notification.id)}
              className="block"
            >
              <div className="flex gap-4">
                {/* Icon or Avatar */}
                <div className="flex-shrink-0">
                  {notification.avatar ? (
                    <Image
                      src={notification.avatar}
                      alt=""
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      {getNotificationIcon(notification.type)}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {notification.title}
                    </p>
                    {!notification.isRead && (
                      <span className="w-2 h-2 bg-secondary rounded-full flex-shrink-0 mt-1.5"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {notification.message}
                  </p>
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    deleteNotification(notification.id)
                  }}
                  className="flex-shrink-0 p-2 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete notification"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}

