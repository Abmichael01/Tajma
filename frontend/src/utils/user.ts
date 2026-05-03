import type { User } from '@/api/types'

// Flexible user type for utility functions - accepts partial user objects
export interface FlexibleUser {
  id?: number | string;
  email?: string | null;
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
  email_notifications?: boolean;
  sms_notifications?: boolean;
  marketing_notifications?: boolean;
  // Add other fields as needed for specific contexts
}

export const getUserFullName = (user: FlexibleUser | User) => {
  // Priority: full_name → first_name + last_name → username → email → id
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

  return user.email || (user.id ? `User ${user.id}` : 'User')
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

import { getMediaUrl } from '@/lib/utils'

/**
 * Normalize avatar URL to full URL using API media endpoint
 * Handles relative paths, absolute paths, and full URLs
 */
export const normalizeAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
  if (!avatarUrl) return undefined
  return getMediaUrl(avatarUrl)
}
