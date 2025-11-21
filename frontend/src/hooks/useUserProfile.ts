import { useQuery } from '@tanstack/react-query'
import { usersApi } from '@/api/users'
import type { User } from '@/api/types'

export const useUserProfile = (slug?: string) => {
  return useQuery<User, Error>({
    queryKey: ['user-profile', slug],
    queryFn: () => {
      if (!slug) {
        throw new Error('Profile slug is required')
      }
      return usersApi.getProfile(slug)
    },
    enabled: !!slug,
    refetchOnMount: 'always',
    staleTime: 0,
  })
}
