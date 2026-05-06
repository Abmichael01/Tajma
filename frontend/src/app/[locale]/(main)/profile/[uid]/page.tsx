import React from 'react'
import { notFound } from 'next/navigation'
import ProfileClient from './ProfileClient'

interface ProfilePageProps {
  params: Promise<{
    uid: string
  }>
}

const EXTERNAL_DATA_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export async function generateMetadata({ params }: ProfilePageProps) {
  const { uid } = await params
  
  let userName = uid.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  let userDescription = `View ${userName}'s profile, ads, and reviews on Tajma Marketplace.`

  try {
    const res = await fetch(`${EXTERNAL_DATA_URL}/api/auth/profile/${uid}/`, { next: { revalidate: 3600 } })
    if (res.ok) {
      const userData = await res.json()
      if (userData.full_name) {
        userName = userData.full_name
        userDescription = `Explore ${userName}'s store on Tajma. View their latest listings, verified reviews, and contact them directly.`
      }
    }
  } catch (error) {
    console.error('Profile Metadata Fetch Error:', error)
  }
  
  return {
    title: `${userName} - Seller Profile | Tajma`,
    description: userDescription,
    keywords: `profile, ${userName}, marketplace, ads, reviews, seller, gambia`,
    openGraph: {
      title: `${userName} - Seller Profile | Tajma`,
      description: userDescription,
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${userName} - Seller Profile | Tajma`,
      description: userDescription,
    }
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { uid } = await params
  
  // Validate uid exists
  if (!uid) {
    notFound()
  }
  
  return <ProfileClient uid={uid} />
}
