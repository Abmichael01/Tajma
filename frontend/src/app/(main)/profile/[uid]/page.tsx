import React from 'react'
import { notFound } from 'next/navigation'
import ProfileClient from './ProfileClient'

interface ProfilePageProps {
  params: Promise<{
    uid: string
  }>
}

export async function generateMetadata({ params }: ProfilePageProps) {
  const { uid } = await params
  
  // In real app, fetch user data based on uid
  const userName = uid.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  
  return {
    title: `${userName} - Tajma Marketplace`,
    description: `View ${userName}'s profile, ads, and reviews on Tajma Marketplace.`,
    keywords: `profile, ${userName}, marketplace, ads, reviews`,
    openGraph: {
      title: `${userName} - Tajma Marketplace`,
      description: `View ${userName}'s profile, ads, and reviews on Tajma Marketplace.`,
      type: 'profile',
    },
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { uid } = await params
  
  // Validate uid format (basic validation)
  if (!uid || uid.length < 3) {
    notFound()
  }
  
  return <ProfileClient uid={uid} />
}
