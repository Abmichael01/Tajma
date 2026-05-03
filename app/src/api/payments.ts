import apiClient from "./apiClient";

export interface InitiatePromotionResponse {
  checkout_url: string;
  authorization_url?: string;
  reference: string;
  transaction_id: string;
}

export interface PromotionPackage {
  id: string;
  name: string;
  description?: string | null;
  promotion_type: "boost" | "featured";
  price: string;
  discount_price?: string | null;
  duration_days: number;
  is_active: boolean;
}

type PaginatedResponse<T> = {
  results?: T[];
};

const unwrapList = <T>(data: T[] | PaginatedResponse<T>): T[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};

export const paymentsApi = {
  /**
   * Initializes a Paystack transaction for an ad promotion.
   */
  initiatePromotion: async (
    adId: string,
    promotionType: "boost" | "featured",
    days: number = 7,
  ) => {
    const response = await apiClient.post<InitiatePromotionResponse>(
      "/payments/initiate-promotion/",
      {
        ad_id: adId,
        promotion_type: promotionType,
        days,
      },
    );
    return {
      ...response.data,
      checkout_url:
        response.data.checkout_url || response.data.authorization_url,
    };
  },

  /**
   * Gets all available promotion packages.
   */
  getPromotionPackages: async () => {
    const response = await apiClient.get<
      PromotionPackage[] | PaginatedResponse<PromotionPackage>
    >("/promotion-packages/");
    return unwrapList(response.data);
  },

  /**
   * Gets a list of user transactions.
   */
  getTransactions: async () => {
    const response = await apiClient.get("/payments/");
    return response.data;
  },
};
