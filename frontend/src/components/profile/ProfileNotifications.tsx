'use client'

import React from 'react'
import Link from 'next/link'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useInitializeNotifications } from '@/hooks/useInitializeNotifications'
import { 
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification
} from '@/hooks/useNotifications'
import { 
  Bell, 
  MessageSquare, 
  Eye, 
  Heart, 
  DollarSign, 
  Info,
  X,
  Check,
  CheckCircle2,
  Trash2,
  Phone,
  Star
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export default function ProfileNotifications() {
  const { 
    getNotifications,
    getUnreadCount
  } = useNotificationsStore()
  
  // Get sorted notifications (newest first)
  const notifications = getNotifications()
  const unreadCount = getUnreadCount()
  
  // Initialize notifications
  useInitializeNotifications()
  
  // Mutation hooks
  const markAsReadMutation = useMarkNotificationAsRead()
  const markAllAsReadMutation = useMarkAllNotificationsAsRead()
  const deleteNotificationMutation = useDeleteNotification()

  const getNotificationIcon = (type: string) => {
    const iconClass = "w-5 h-5"
    switch (type) {
      case 'message':
        return <MessageSquare className={`${iconClass} text-blue-600`} />
      case 'view':
        return <Eye className={`${iconClass} text-green-600`} />
      case 'phone_view':
        return <Phone className={`${iconClass} text-purple-600`} />
      case 'favorite':
        return <Heart className={`${iconClass} text-red-500`} />
      case 'offer':
      case 'review':
        return <Star className={`${iconClass} text-yellow-600`} />
      case 'system':
        return <Info className={`${iconClass} text-gray-600`} />
      default:
        return <Bell className={`${iconClass} text-gray-600`} />
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

    if (diffMs < 60000) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffWeeks < 4) return `${diffWeeks}w ago`
    return new Date(timestamp).toLocaleDateString()
  }

  const handleMarkAsRead = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    markAsReadMutation.mutate(notificationId, {
      onSuccess: () => {
        useNotificationsStore.getState().markAsRead(notificationId)
        toast.success('Notification marked as read')
      },
      onError: () => {
        toast.error('Failed to mark notification as read')
      }
    })
  }

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate(undefined, {
      onSuccess: () => {
        useNotificationsStore.getState().markAllAsRead()
        toast.success('All notifications marked as read')
      },
      onError: () => {
        toast.error('Failed to mark all notifications as read')
      }
    })
  }

  const handleDeleteNotification = (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteNotificationMutation.mutate(notificationId, {
      onSuccess: () => {
        useNotificationsStore.getState().deleteNotification(notificationId)
        toast.success('Notification deleted')
      },
      onError: () => {
        toast.error('Failed to delete notification')
      }
    })
  }

  const handleClearAll = () => {
    if (confirm('Are you sure you want to clear all notifications? This will delete all notifications.')) {
      // Delete all notifications one by one
      const deletePromises = notifications.map(notif => 
        deleteNotificationMutation.mutateAsync(notif.id)
      )
      
      Promise.all(deletePromises)
        .then(() => {
          useNotificationsStore.getState().clearAll()
          toast.success('All notifications cleared')
        })
        .catch(() => {
          toast.error('Failed to clear some notifications')
        })
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-16">
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
              variant="outline"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
              size="sm"
              className="gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={deleteNotificationMutation.isPending}
              size="sm"
              className="gap-2 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
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
            className={`bg-white border rounded-lg p-4 transition-all group ${
              !notification.isRead 
                ? 'border-primary/30 bg-primary/5 shadow-sm' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  !notification.isRead ? 'bg-primary/10' : 'bg-gray-100'
                }`}>
                  {getNotificationIcon(notification.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1">
                    <Link
                      href={notification.link || '#'}
                      className="block"
                      onClick={(e) => {
                        if (!notification.isRead) {
                          markAsReadMutation.mutate(notification.id, {
                            onSuccess: () => {
                              useNotificationsStore.getState().markAsRead(notification.id)
                            }
                          })
                        }
                      }}
                    >
                      <p className={`text-sm font-medium text-gray-900 ${
                        !notification.isRead ? 'font-semibold' : ''
                      }`}>
                        {notification.title}
                      </p>
                    </Link>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        disabled={markAsReadMutation.isPending}
                        className="h-7 px-2 text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Mark read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      disabled={deleteNotificationMutation.isPending}
                      className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

