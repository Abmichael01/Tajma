import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { kycApi } from '../api/kyc'

export const useKYC = () => {
    const queryClient = useQueryClient()

    const { data: verifications, isLoading: isLoadingVerifications } = useQuery({
        queryKey: ['kyc-verifications'],
        queryFn: () => kycApi.getVerifications(),
    })

    const initiateMutation = useMutation({
        mutationFn: (payload?: { id_type?: string; country?: string }) => kycApi.initiate(payload ?? {}),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['kyc-verifications'] })
            queryClient.invalidateQueries({ queryKey: ['user-me'] })
        },
    })

    return {
        verifications,
        isLoadingVerifications,
        initiateKYC: initiateMutation.mutateAsync,
        isInitiating: initiateMutation.isPending,
    }
}
