import { useQuery } from '@tanstack/react-query'
import { usersApi, type UserWithReviewStats } from '@/api/users'

export const useUserProfile = (slug?: string) => {
  return useQuery<UserWithReviewStats, Error>({
    queryKey: ['user-profile', slug],
    queryFn: () => {
      if (!slug) {
        throw new Error('Profile slug is required')
      }

      // If slug is numeric, treat as ID
      if (/^\d+$/.test(slug)) {
        return usersApi.getById(Number(slug))
      }

      return usersApi.getProfile(slug)
    },
    enabled: !!slug,
    refetchOnMount: 'always',
    staleTime: 0,
  })
}

