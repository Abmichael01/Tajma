import apiClient from './apiClient';

export const reportsApi = {
  list: async (params?: any) => {
    const response = await apiClient.get('/reports/', { params });
    return response.data;
  },
  get: async (id: string) => {
    const response = await apiClient.get(`/reports/${id}/`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await apiClient.post('/reports/', data);
    return response.data;
  },
  reply: async (reportId: string, message: string) => {
    const response = await apiClient.post(`/reports/${reportId}/reply/`, { message });
    return response.data;
  }
};
