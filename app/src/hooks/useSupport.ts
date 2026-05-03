import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/apiClient";
import { Report, SupportMessage } from "@/api/types";

export const supportApi = {
  listReports: async () => {
    const response = await apiClient.get<Report[]>("/reports/");
    return response.data;
  },
  getReport: async (id: string) => {
    const response = await apiClient.get<Report>(`/reports/${id}/`);
    return response.data;
  },
  createReport: async (data: Partial<Report>) => {
    const response = await apiClient.post<Report>("/reports/", data);
    return response.data;
  },
  reply: async (id: string, message: string) => {
    const response = await apiClient.post<SupportMessage>(`/reports/${id}/reply/`, { message });
    return response.data;
  },
};

export const useReports = () => {
  return useQuery({
    queryKey: ["reports"],
    queryFn: supportApi.listReports,
  });
};

export const useReport = (id: string) => {
  return useQuery({
    queryKey: ["reports", id],
    queryFn: () => supportApi.getReport(id),
    enabled: !!id,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supportApi.createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
};

export const useReplyToReport = (reportId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => supportApi.reply(reportId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports", reportId] });
    },
  });
};
