import apiClient from './apiClient'

export interface KYCInitiateResponse {
    token: string
    job_id: string
    user_id: string
    partner_id: string
    is_sandbox: boolean
}

export const kycApi = {
    initiate: async (payload: { id_type?: string; country?: string } = {}): Promise<KYCInitiateResponse> => {
        const response = await apiClient.post<KYCInitiateResponse>('/kyc/initiate/', payload)
        return response.data
    },

    getVerifications: async () => {
        const response = await apiClient.get('/kyc/')
        return response.data
    }
}
