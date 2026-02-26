import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LeadSource, leadsApi } from '@/api/leads'

export function useLeads() {
    const queryClient = useQueryClient()

    const listQuery = useQuery({
        queryKey: ['leads'],
        queryFn: () => leadsApi.list(),
    })

    const recordInteractionMutation = useMutation({
        mutationFn: (payload: { seller_id: string; source: LeadSource; ad_id?: string }) =>
            leadsApi.recordInteraction(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] })
        },
    })

    const markAsMessagedMutation = useMutation({
        mutationFn: (leadId: string) => leadsApi.markAsMessaged(leadId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['leads'] })
        },
    })

    return {
        leads: listQuery.data || [],
        isLoading: listQuery.isLoading,
        isRefetching: listQuery.isRefetching,
        refetch: listQuery.refetch,
        recordInteraction: recordInteractionMutation.mutateAsync,
        markAsMessaged: markAsMessagedMutation.mutateAsync,
    }
}
