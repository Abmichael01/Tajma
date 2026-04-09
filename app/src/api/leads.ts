import apiClient from './apiClient'

export type LeadSource = 'phone_view' | 'profile_view' | 'save_ad'

export interface Lead {
    id: string
    seller: string
    client: string
    client_detail?: {
        id: string
        email: string
        first_name: string
        last_name: string
        avatar: string | null
        phone: string
    }
    ad?: string
    ad_detail?: {
        id: string
        title: string
        price: string
        images: string[]
    }
    first_source: LeadSource
    first_source_display: string
    last_source: LeadSource
    last_source_display: string
    sources_used: LeadSource[]   // all unique actions: ["save_ad", "phone_view"]
    interaction_count: number
    messaged: boolean
    ignored: boolean
    created_at: string
    last_interacted_at: string
}

export interface LeadMonthlyStats {
    month: string           // "2026-03"
    new_leads: number
    total_interactions: number
}

const basePath = '/leads/'

export const leadsApi = {
    list: async (): Promise<Lead[]> => {
        try {
            const response = await apiClient.get<Lead[] | { results: Lead[] }>(basePath)
            if (!response.data) return []
            if (typeof response.data === 'object' && 'results' in response.data) {
                return response.data.results
            }
            if (Array.isArray(response.data)) return response.data
            return []
        } catch (error) {
            console.error('leadsApi.list error:', error)
            return []
        }
    },

    monthlyStats: async (): Promise<LeadMonthlyStats[]> => {
        try {
            const response = await apiClient.get<LeadMonthlyStats[]>(`${basePath}monthly-stats/`)
            return response.data || []
        } catch {
            return []
        }
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

    markIgnored: async (leadId: string): Promise<void> => {
        await apiClient.patch(`${basePath}${leadId}/mark_ignored/`)
    },
}
