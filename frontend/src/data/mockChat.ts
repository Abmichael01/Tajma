export interface ChatUser {
  id: string
  name: string
  avatar?: string
  isOnline: boolean
  lastSeen?: string
}

export interface Message {
  id: string
  senderId: string
  content: string
  timestamp: string
  isRead: boolean
  type: 'text' | 'image' | 'product'
  productId?: string
  imageUrl?: string
}

export interface Conversation {
  id: string
  participants: ChatUser[]
  lastMessage: Message
  unreadCount: number
  isActive: boolean
  productId?: string
  productTitle?: string
  productImage?: string
  productPrice?: string
}

export const mockUsers: ChatUser[] = [
  {
    id: '1',
    name: 'John Doe',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    lastSeen: '2 hours ago'
  },
  {
    id: '3',
    name: 'Michael Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    isOnline: true
  },
  {
    id: '4',
    name: 'Emma Wilson',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    isOnline: false,
    lastSeen: '1 day ago'
  }
]

export const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      senderId: '1',
      content: 'Hi! I saw your iPhone listing. Is it still available?',
      timestamp: '2024-01-20T10:30:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '2',
      senderId: 'current',
      content: 'Yes, it\'s still available! Are you interested?',
      timestamp: '2024-01-20T10:32:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '3',
      senderId: '1',
      content: 'Great! Can you send me more photos of the phone?',
      timestamp: '2024-01-20T10:35:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '4',
      senderId: 'current',
      content: 'Of course! Here are some additional photos.',
      timestamp: '2024-01-20T10:38:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '5',
      senderId: 'current',
      content: '',
      timestamp: '2024-01-20T10:39:00Z',
      isRead: true,
      type: 'image',
      imageUrl: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400'
    },
    {
      id: '6',
      senderId: '1',
      content: 'Perfect! The phone looks great. What\'s your best price?',
      timestamp: '2024-01-20T11:15:00Z',
      isRead: false,
      type: 'text'
    }
  ],
  '2': [
    {
      id: '7',
      senderId: '2',
      content: 'Hello! I\'m interested in your MacBook. Can we meet for inspection?',
      timestamp: '2024-01-19T14:20:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '8',
      senderId: 'current',
      content: 'Hi Sarah! Yes, we can arrange a meeting. Where would you prefer to meet?',
      timestamp: '2024-01-19T14:25:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '9',
      senderId: '2',
      content: 'How about Victoria Island? I can meet you tomorrow afternoon.',
      timestamp: '2024-01-19T14:30:00Z',
      isRead: true,
      type: 'text'
    }
  ],
  '3': [
    {
      id: '10',
      senderId: '3',
      content: 'Is the Samsung Galaxy still available?',
      timestamp: '2024-01-18T09:15:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '11',
      senderId: 'current',
      content: 'Yes, it\'s still available!',
      timestamp: '2024-01-18T09:18:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '12',
      senderId: '3',
      content: 'Great! I\'ll take it. When can we meet?',
      timestamp: '2024-01-18T09:20:00Z',
      isRead: false,
      type: 'text'
    }
  ],
  '4': [
    {
      id: '13',
      senderId: '4',
      content: 'Hi! I saw your PlayStation listing. Is it brand new?',
      timestamp: '2024-01-17T16:45:00Z',
      isRead: true,
      type: 'text'
    },
    {
      id: '14',
      senderId: 'current',
      content: 'Yes, it\'s brand new and still sealed!',
      timestamp: '2024-01-17T16:47:00Z',
      isRead: true,
      type: 'text'
    }
  ]
}

export const mockConversations: Conversation[] = [
  {
    id: '1',
    participants: [mockUsers[0]],
    lastMessage: mockMessages['1'][mockMessages['1'].length - 1],
    unreadCount: 1,
    isActive: true,
    productId: '1',
    productTitle: 'iPhone 14 Pro Max 256GB - Space Black',
    productImage: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400',
    productPrice: '₦850,000'
  },
  {
    id: '2',
    participants: [mockUsers[1]],
    lastMessage: mockMessages['2'][mockMessages['2'].length - 1],
    unreadCount: 0,
    isActive: false,
    productId: '4',
    productTitle: 'MacBook Pro M2 13-inch',
    productImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400',
    productPrice: '₦1,200,000'
  },
  {
    id: '3',
    participants: [mockUsers[2]],
    lastMessage: mockMessages['3'][mockMessages['3'].length - 1],
    unreadCount: 1,
    isActive: true,
    productId: '5',
    productTitle: 'Samsung Galaxy S23 Ultra',
    productImage: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=400',
    productPrice: '₦750,000'
  },
  {
    id: '4',
    participants: [mockUsers[3]],
    lastMessage: mockMessages['4'][mockMessages['4'].length - 1],
    unreadCount: 0,
    isActive: false,
    productId: '11',
    productTitle: 'Sony PlayStation 5 - Brand New',
    productImage: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=400',
    productPrice: '₦450,000'
  }
]
