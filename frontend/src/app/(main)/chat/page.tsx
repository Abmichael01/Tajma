import { Metadata } from 'next'
import { Suspense } from 'react'
import ChatClient from './ChatClient'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import ChatSkeleton from '@/components/ui/ChatSkeleton'

export const metadata: Metadata = {
  title: 'Messages - Tajma Marketplace',
  description: 'Chat with sellers and buyers on Tajma Marketplace',
  openGraph: {
    title: 'Messages - Tajma Marketplace',
    description: 'Chat with sellers and buyers on Tajma Marketplace',
  },
  robots: {
    index: false,
    follow: false,
  },
}

export default function ChatPage() {
  return (
    <ProtectedRoute>
      <Suspense fallback={<ChatSkeleton />}>
        <ChatClient />
      </Suspense>
    </ProtectedRoute>
  )
}