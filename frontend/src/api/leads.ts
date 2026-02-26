import apiClient from './apiClient'
import { Lead } from './types' // I'll add this to types.ts

export type LeadSource = 'phone_view' | 'profile_view' | 'save_ad'

const basePath = '/leads/'

export const leadsApi = {
    list: async (): Promise<Lead[]> => {
        const response = await apiClient.get<Lead[] | { results: Lead[] }>(basePath)
        if (typeof response.data === 'object' && 'results' in response.data) {
            return response.data.results
        }
        return response.data as Lead[]
    },

    recordInteraction: async (payload: {
        seller_id: string
        source: LeadSource
        ad_id?: string
    }): Promise<Lead> => {
        const response = await apiClient.post<Lead>(`${basePath}record-interaction/`, payload)
        return response.data
    },

    markAsMessaged: async (leadId: string): Promise<void> => {
        await apiClient.patch(`${basePath}${leadId}/mark_messaged/`)
    },
}
