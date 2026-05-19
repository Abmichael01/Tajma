import apiClient from "./apiClient";
import type {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordChangeRequest,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
} from "./types";

// Auth API functions
export const authApi = {
  // Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>("/auth/login/", data);
    return response.data;
  },

  // Register
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>(
      "/auth/register/",
      data,
    );
    return response.data;
  },

  // Logout
  logout: async (): Promise<void> => {
    await apiClient.post("/auth/logout/");
  },

  // Get current user
  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<{ user: User }>("/auth/user/");
    return response.data.user;
  },

  // Change password
  changePassword: async (
    data: PasswordChangeRequest,
  ): Promise<{ message: string }> => {
    const response = await apiClient.post<{ message: string }>(
      "/auth/password/change/",
      data,
    );
    return response.data;
  },

  // Google OAuth
  getGoogleAuthUrl: async (
    redirectUri?: string,
    options?: { mobileApp?: boolean },
  ): Promise<{ authorization_url: string }> => {
    const queryParams: string[] = [];
    if (redirectUri) {
      queryParams.push(`redirect_uri=${encodeURIComponent(redirectUri)}`);
    }
    if (options?.mobileApp) {
      queryParams.push("mobile_app=true");
    }
    const params = queryParams.length ? `?${queryParams.join("&")}` : "";
    const response = await apiClient.get<{ authorization_url: string }>(
      `/auth/google/${params}`,
    );
    return response.data;
  },

  exchangeGoogleMobileToken: async (
    mobileExchangeToken: string,
  ): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/google/callback/",
      {
        mobile_exchange_token: mobileExchangeToken,
      },
    );
    return response.data;
  },

  googleCallback: async (
    code: string,
    redirectUri: string,
  ): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>(
      "/auth/google/callback/",
      {
        code,
        redirect_uri: redirectUri,
      },
    );
    return response.data;
  },

  // Update user profile
  updateProfile: async (
    data: ProfileUpdateRequest,
  ): Promise<ProfileUpdateResponse> => {
    const response = await apiClient.patch<ProfileUpdateResponse>(
      "/auth/profile/update/",
      data,
    );
    return response.data;
  },

};
