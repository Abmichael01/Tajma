import { Platform } from "react-native";
import apiClient from "./apiClient";

export type DevicePlatform = "expo" | "web" | "fcm";

interface RegisterResponse {
  id: string;
  created: boolean;
}

interface UnregisterResponse {
  deleted: number;
}

export const deviceTokensApi = {
  /** Register or refresh a push token for the current user. Idempotent —
   *  the backend reuses the same row for an existing (user, token) pair. */
  register: async (
    token: string,
    platform: DevicePlatform = "expo",
  ): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>("/device-tokens/", {
      token,
      platform,
      user_agent: `${Platform.OS}/${Platform.Version}`,
    });
    return response.data;
  },

  /** Detach a token from the current user (e.g. on logout). */
  unregister: async (token: string): Promise<UnregisterResponse> => {
    const response = await apiClient.delete<UnregisterResponse>(
      "/device-tokens/",
      { data: { token } },
    );
    return response.data;
  },
};
