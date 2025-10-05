import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
  AxiosError,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ENV, getApiUrl } from "@/config/env";

// Create axios instance for v1 API routes
const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${ENV.API_BASE_URL}/api/v1`, // Hardcoded to fix v11 issue
  timeout: ENV.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Create axios instance for token-based auth routes (no version)
const tokenAuthInstance: AxiosInstance = axios.create({
  baseURL: `${ENV.API_BASE_URL}/api`,
  timeout: ENV.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request interceptor to add auth token with automatic refresh
const addAuthInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
      try {
        // Import getValidAccessToken dynamically to avoid circular imports
        const { getValidAccessToken } = await import("@/utils/tokenUtils");

        // Get valid access token (will refresh if needed)
        const token = await getValidAccessToken();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log("🔑 Added valid access token to request");
        } else {
          console.log("⚠️ No valid access token available for request");
        }
      } catch (error) {
        console.error("Error getting valid token:", error);
      }
      return config;
    },
    (error: AxiosError) => {
      return Promise.reject(error);
    }
  );
};

// Add auth interceptor to both instances
addAuthInterceptor(axiosInstance);
addAuthInterceptor(tokenAuthInstance);

// Response interceptor to handle 401 errors
const addResponseInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error: AxiosError) => {
      // If 401, token is expired, clear it and redirect to login
      if (error.response?.status === 401) {
        try {
          // Check if it's a session expiry due to login elsewhere
          const errorMessage = (error.response?.data as any)?.message || "";
          const isSessionExpiredElsewhere =
            errorMessage.includes("logged in elsewhere") ||
            errorMessage.includes("Session expired");

          // Check if it's a refresh token failure
          const isRefreshTokenFailure =
            errorMessage.includes("Refresh token expired") ||
            errorMessage.includes("Invalid refresh token") ||
            errorMessage.includes("Please login again");

          console.log("🔍 401 Error Details:", {
            errorMessage,
            isSessionExpiredElsewhere,
            isRefreshTokenFailure,
            url: error.config?.url,
          });

          // Clear all authentication data including refresh attempts
          await AsyncStorage.multiRemove([
            "accessToken",
            "refreshToken", // Also clear refresh token
            "userRole",
            "userEmail",
            "userId",
            "userData",
            "tokenTimestamp",
            "hasCompletedOnboarding",
            "refreshAttempts", // Clear refresh attempts counter
          ]);

          // Navigate to login screen with appropriate message
          const { router } = await import("expo-router");

          if (isSessionExpiredElsewhere) {
            // Store session expiry message for display
            await AsyncStorage.setItem(
              "sessionExpiredMessage",
              "You have been logged out because you logged in on another device."
            );
          } else if (isRefreshTokenFailure) {
            // Store refresh token expiry message
            await AsyncStorage.setItem(
              "sessionExpiredMessage",
              "Your session has expired. Please log in again."
            );
          }

          router.replace("/(auth)/role-selection");
        } catch (clearError) {
          console.error("Error clearing authentication data:", clearError);
        }
      }

      return Promise.reject(error);
    }
  );
};

// Add response interceptor to both instances
addResponseInterceptor(axiosInstance);
addResponseInterceptor(tokenAuthInstance);

// API helper functions
export const api = {
  // GET request
  get: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.get(url, config);
  },

  // POST request
  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.post(url, data, config);
  },

  // PUT request
  put: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.put(url, data, config);
  },

  // DELETE request
  delete: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.delete(url, config);
  },

  // PATCH request
  patch: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return axiosInstance.patch(url, data, config);
  },
};

// Token auth API helper (for /api/login and /api/register)
export const tokenAuthApi = {
  // GET request
  get: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return tokenAuthInstance.get(url, config);
  },

  // POST request
  post: <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return tokenAuthInstance.post(url, data, config);
  },

  // DELETE request
  delete: <T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<T>> => {
    return tokenAuthInstance.delete(url, config);
  },
};

export default axiosInstance;
