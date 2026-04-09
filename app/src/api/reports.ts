import apiClient from "./apiClient";

export const reportsApi = {
  /**
   * Creates a new report for an ad, user, or support request.
   */
  create: async (data: {
    report_type: 'ad' | 'user' | 'support' | 'feedback';
    related_ad?: string;
    reported_user?: string;
    reason: string;
    description: string;
    contact_email?: string;
  }) => {
    const response = await apiClient.post('/reports/', data);
    return response.data;
  },

  /**
   * Gets a list of user's filed reports.
   */
  getReports: async () => {
    const response = await apiClient.get('/reports/');
    return response.data;
  },
};
