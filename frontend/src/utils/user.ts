import type { User } from '@/api/types'

// Flexible user type for utility functions - accepts partial user objects
export interface FlexibleUser {
  id?: number | string;
  email: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
  avatar?: string | null;
  is_staff?: boolean;
  is_superuser?: boolean;
  is_seller_account_setup?: boolean;
  phone?: string | null;
  location?: string | null;
  // Add other fields as needed for specific contexts
}

export const getUserFullName = (user: FlexibleUser | User) => {
  // Priority: full_name → first_name + last_name → username → email
  if (user.full_name && user.full_name.trim()) {
    return user.full_name.trim()
  }

  const composedName = `${user.first_name || ''} ${user.last_name || ''}`
    .replace(/\s+/g, ' ')
    .trim()

  if (composedName) {
    return composedName
  }

  if (user.username && user.username.trim()) {
    return user.username.trim()
  }

  return user.email
}

export const getUserInitials = (user: FlexibleUser | User) => {
  const fullName = getUserFullName(user)
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)

  return initials.toUpperCase() || 'U'
}

/**
 * Normalize avatar URL to full URL using API media endpoint
 * Handles relative paths, absolute paths, and full URLs
 */
export const normalizeAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl) return undefined
  
  // If already a full URL, return as is
  if (avatarUrl.startsWith('http://') || avatarUrl.startsWith('https://')) {
    return avatarUrl
  }
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  
  // If it starts with /api/media/, it's already properly formatted
  if (avatarUrl.startsWith('/api/media/')) {
    return `${apiUrl}${avatarUrl}`
  }
  
  // If it starts with /media/, convert to API endpoint
  if (avatarUrl.startsWith('/media/')) {
    const path = avatarUrl.replace('/media/', '')
    return `${apiUrl}/api/media/${path}`
  }
  
  // If it starts with /, prepend API URL
  if (avatarUrl.startsWith('/')) {
    return `${apiUrl}${avatarUrl}`
  }
  
  // Relative path (e.g., 'avatars/uuid.jpg'), use API media endpoint
  return `${apiUrl}/api/media/${avatarUrl}`
}
