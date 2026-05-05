'use client'

import React from 'react'
import { Link } from '@/i18n/routing'
import { useNotificationsStore } from '@/store/notificationsStore'
import { useInitializeNotifications } from '@/hooks/useInitializeNotifications'
import { 
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearAllNotifications
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
  const clearAllMutation = useClearAllNotifications()

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
      clearAllMutation.mutate(undefined, {
        onSuccess: () => {
          useNotificationsStore.getState().clearAll()
          toast.success('All notifications cleared')
        },
        onError: () => {
          toast.error('Failed to clear all notifications')
        }
      })
    }
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-[32px] p-6 sm:p-10 max-w-4xl mx-auto">
        <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
          <div className="relative w-24 h-24 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm border border-gray-100 transition-transform hover:scale-105 duration-300">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/5 to-transparent opacity-50" />
            <Bell className="w-10 h-10 text-gray-300 relative z-10" />
            <div className="absolute -top-1 -right-1 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xs font-bold border-2 border-white">
              0
            </div>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">
            No notifications yet
          </h3>
          <p className="text-gray-500 max-w-xs leading-relaxed text-sm">
            You'll see notifications here when there's activity on your account, like messages, views, or favorites.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-[32px] p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <h3 className="text-xl font-medium text-gray-900 tracking-tight">Notifications</h3>
          <p className="text-sm font-medium text-gray-500">
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
              className="gap-2 rounded-full border-gray-200 font-medium h-9 px-4 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              Mark all read
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleClearAll}
              disabled={clearAllMutation.isPending}
              size="sm"
              className="gap-2 text-destructive hover:text-destructive rounded-full border-gray-200 font-medium h-9 px-4 text-xs"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className="group transition-all border-b border-gray-100 pb-2.5 last:border-0"
          >
            <div className="flex gap-3 p-0.5">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-50 border border-gray-100">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-0.5">
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
                      <p className={`text-sm text-gray-900 ${
                        !notification.isRead ? 'font-medium' : 'font-normal'
                      }`}>
                        {notification.title}
                      </p>
                    </Link>
                  </div>
                  {!notification.isRead && (
                    <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-1.5 line-clamp-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-400 font-normal">
                    {formatTimeAgo(notification.timestamp)}
                  </span>
                  <div className="flex items-center gap-2 transition-opacity">
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleMarkAsRead(notification.id, e)}
                        disabled={markAsReadMutation.isPending}
                        className="h-7 px-3 text-[10px] font-medium rounded-full bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                        Mark read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteNotification(notification.id, e)}
                      disabled={deleteNotificationMutation.isPending}
                      className="h-7 w-7 p-0 flex items-center justify-center rounded-full bg-gray-50 border border-gray-100 hover:bg-red-50 hover:border-red-100 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
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

