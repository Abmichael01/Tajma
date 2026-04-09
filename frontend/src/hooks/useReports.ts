import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { reportsApi } from '@/api/reports';
import { toast } from 'sonner';

export interface ReportMessage {
  id: string;
  report: string;
  sender: string | null;
  sender_details: any;
  message: string;
  is_admin_reply: boolean;
  created_at: string;
}

export interface Report {
  id: string;
  report_type: 'ad' | 'user' | 'support' | 'feedback';
  related_ad?: string;
  related_ad_details?: any;
  reported_user?: string;
  reported_user_details?: any;
  reason: string;
  description: string;
  contact_email?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  messages: ReportMessage[];
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export const useCreateReport = () => {
  return useMutation({
    mutationFn: (data: Partial<Report>) => reportsApi.create(data),
    onSuccess: () => {
      toast.success('Your request has been submitted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit request.');
    }
  });
};

export const useUserReports = (params?: any) => {
  return useQuery({
    queryKey: ['user-reports', params],
    queryFn: () => reportsApi.list(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useReportDetail = (id: string) => {
  return useQuery({
    queryKey: ['report', id],
    queryFn: () => reportsApi.get(id),
    enabled: !!id
  });
};

export const useAddReportMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, message }: { reportId: string, message: string }) => 
        reportsApi.reply(reportId, message),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['user-reports'] });
    }
  });
};
