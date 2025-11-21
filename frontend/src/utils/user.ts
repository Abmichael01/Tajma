import type { User } from '@/api/types'

export const getUserFullName = (user: User) => {
  const composedName = `${user.first_name || ''} ${user.last_name || ''}`
    .replace(/\s+/g, ' ')
    .trim()

  return composedName || user.username || user.email
}

export const getUserInitials = (user: User) => {
  const fullName = getUserFullName(user)
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0))
    .join('')
    .slice(0, 2)

  return initials.toUpperCase() || 'U'
}

