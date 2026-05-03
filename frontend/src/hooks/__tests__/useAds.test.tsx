import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useAdDetails, useAdsList } from '../useAds'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import type { Ad } from '@/api/types'

// Mock the API
vi.mock('@/api/ads', () => ({
  adsApi: {
    get: vi.fn(),
    list: vi.fn(),
  },
}))

import { adsApi } from '@/api/ads'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAds hooks', () => {
  describe('useAdDetails', () => {
    it('fetches ad details correctly', async () => {
      const mockAd = { id: 'test-ad', slug: 'test-ad', title: 'Test Ad' } as Ad
      vi.mocked(adsApi.get).mockResolvedValue(mockAd)

      const { result } = renderHook(() => useAdDetails('test-ad'), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockAd)
      expect(adsApi.get).toHaveBeenCalledWith('test-ad')
    })
  })

  describe('useAdsList', () => {
    it('fetches ads list with params', async () => {
      const mockAds = [{ id: 'ad-1', slug: 'ad-1', title: 'Ad 1' } as Ad]
      vi.mocked(adsApi.list).mockResolvedValue(mockAds)

      const params = { category: 5 }
      const { result } = renderHook(() => useAdsList(params), {
        wrapper: createWrapper(),
      })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(mockAds)
      expect(adsApi.list).toHaveBeenCalledWith(params)
    })
  })
})
