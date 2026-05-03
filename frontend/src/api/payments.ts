import apiClient from "./apiClient";

export interface InitiatePromotionResponse {
  checkout_url: string;
  reference: string;
  transaction_id: string;
}

export const paymentsApi = {
  /**
   * Initializes a Paystack transaction for an ad promotion.
   */
  initiatePromotion: async (adId: string, promotionType: 'boost' | 'featured', days: number = 7) => {
    const response = await apiClient.post<InitiatePromotionResponse>('/payments/initiate-promotion/', {
      ad_id: adId,
      promotion_type: promotionType,
      days: days,
    });
    return response.data;
  },

  /**
   * Gets a list of user transactions.
   */
  getTransactions: async () => {
    const response = await apiClient.get('/payments/');
    return response.data;
  },

  /**
   * Gets all available promotion packages.
   */
  getPromotionPackages: async () => {
    const response = await apiClient.get<any[]>('/promotion-packages/');
    return response.data;
  },
};
