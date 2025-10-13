import { Notification } from '@/store/notificationsStore'

// Mock notifications data for testing
export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'message',
    title: 'New Message',
    message: 'Sarah Johnson sent you a message about "iPhone 14 Pro Max"',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    isRead: false,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    link: '/chat',
    adId: '1'
  },
  {
    id: 'notif-2',
    type: 'view',
    title: 'Ad Viewed',
    message: 'Your "MacBook Pro M2" ad has been viewed 15 times today',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
    isRead: false,
    link: '/ads/2',
    adId: '2'
  },
  {
    id: 'notif-3',
    type: 'favorite',
    title: 'New Favorite',
    message: '3 users saved your "Samsung Galaxy S23" ad to favorites',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
    isRead: false,
    link: '/ads/3',
    adId: '3'
  },
  {
    id: 'notif-4',
    type: 'offer',
    title: 'Price Offer',
    message: 'Michael Chen made an offer of ₦400,000 for your PlayStation 5',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    isRead: true,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    link: '/chat',
    adId: '4'
  },
  {
    id: 'notif-5',
    type: 'system',
    title: 'Ad Expiring Soon',
    message: 'Your ad "Dell XPS 13 Laptop" will expire in 3 days',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    isRead: true,
    link: '/ads/5',
    adId: '5'
  },
  {
    id: 'notif-6',
    type: 'message',
    title: 'New Message',
    message: 'You have 2 unread messages',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    isRead: true,
    link: '/chat'
  }
]

