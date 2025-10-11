import { Metadata } from 'next'
import ChatClient from './ChatClient'

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
  return <ChatClient />
}