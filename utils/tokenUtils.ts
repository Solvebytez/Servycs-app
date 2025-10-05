import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "@/services/auth";

// Mutex to prevent concurrent refresh attempts
let refreshMutex: Promise<string | null> | null = null;

/**
 * Clear authentication data from AsyncStorage
 */
const clearAuthData = async () => {
  try {
    console.log("🧹 Clearing authentication data...");
    await AsyncStorage.multiRemove([
      "accessToken",
      "refreshToken",
      "userRole",
      "userEmail",
      "userId",
      "tokenTimestamp",
      "hasCompletedOnboarding",
      "userData",
    ]);

    // Clear React Query cache
    try {
      const { queryClient } = await import("@/providers/QueryProvider");
      queryClient.clear();
    } catch (queryError) {
      console.error("Could not clear React Query cache:", queryError);
    }

    // Navigate to login
    const { router } = await import("expo-router");
    router.replace("/(auth)/role-selection");
  } catch (error) {
    console.error("Error clearing auth data:", error);
  }
};

/**
 * Check if a JWT token is expired (without validating signature)
 * @param token - JWT token string
 * @returns true if token is expired or invalid, false if still valid
 */
export const isTokenExpired = (token: string | null): boolean => {
  if (!token) return true;

  try {
    // Decode JWT payload (no secret needed - just reading expiration)
    const payload = JSON.parse(atob(token.split(".")[1]));
    const currentTime = Math.floor(Date.now() / 1000);

    // Add 30 second buffer to refresh before actual expiration
    const bufferTime = 30;
    return payload.exp < currentTime + bufferTime;
  } catch (error) {
    console.log("Token decode error:", error);
    return true; // If can't decode, consider expired
  }
};

/**
 * Get a valid access token, refreshing if necessary
 * @returns valid access token or null if refresh fails
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  try {
    const currentToken = await AsyncStorage.getItem("accessToken");
    const refreshToken = await AsyncStorage.getItem("refreshToken");
    const refreshAttempts = await AsyncStorage.getItem("refreshAttempts");
    const attemptCount = refreshAttempts ? parseInt(refreshAttempts) : 0;

    console.log("🔍 Checking token validity...");

    // If no current token, return null
    if (!currentToken) {
      console.log("❌ No access token found");
      return null;
    }

    // Check if current token is expired
    if (!isTokenExpired(currentToken)) {
      console.log("✅ Access token is still valid");
      // Reset refresh attempts counter on successful token
      if (attemptCount > 0) {
        await AsyncStorage.removeItem("refreshAttempts");
      }
      return currentToken;
    }

    // Prevent infinite refresh loops
    if (attemptCount >= 3) {
      console.log("❌ Too many refresh attempts, logging out");
      await clearAuthData();
      return null;
    }

    console.log("⏰ Access token expired, attempting refresh...");

    // Token is expired, try to refresh
    if (!refreshToken) {
      console.log("❌ No refresh token available");
      await clearAuthData();
      return null;
    }

    // Check if there's already a refresh in progress
    if (refreshMutex) {
      console.log("🔄 Refresh already in progress, waiting...");
      return await refreshMutex;
    }

    // Create refresh promise and store it in mutex
    refreshMutex = performTokenRefresh(refreshToken, attemptCount);

    try {
      const result = await refreshMutex;
      return result;
    } finally {
      // Clear mutex when done
      refreshMutex = null;
    }
  } catch (error) {
    console.error("Error in getValidAccessToken:", error);
    refreshMutex = null; // Clear mutex on error
    return null;
  }
};

/**
 * Perform the actual token refresh with proper error handling
 */
const performTokenRefresh = async (
  refreshToken: string,
  attemptCount: number
): Promise<string | null> => {
  try {
    // Increment refresh attempt counter
    await AsyncStorage.setItem(
      "refreshAttempts",
      (attemptCount + 1).toString()
    );

    console.log("🔄 Calling refresh token endpoint...");
    console.log(
      "🔍 Refresh token being used:",
      refreshToken ? "EXISTS" : "MISSING"
    );

    // Add timeout to prevent hanging
    const refreshPromise = authService.refreshToken(refreshToken);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error("Refresh token request timeout")),
        10000
      )
    );

    const refreshResponse = (await Promise.race([
      refreshPromise,
      timeoutPromise,
    ])) as any;

    console.log("🔍 Refresh response received:", {
      success: refreshResponse?.success,
      hasData: !!refreshResponse?.data,
      hasAccessToken: !!refreshResponse?.data?.accessToken,
      hasRefreshToken: !!refreshResponse?.data?.refreshToken,
    });

    if (refreshResponse.success && refreshResponse.data) {
      const newAccessToken = refreshResponse.data.accessToken;
      const newRefreshToken = refreshResponse.data.refreshToken;

      // Store new tokens and reset attempt counter
      await AsyncStorage.multiSet([
        ["accessToken", newAccessToken],
        ["refreshToken", newRefreshToken || refreshToken], // Use new refresh token if provided, otherwise keep current
      ]);
      await AsyncStorage.removeItem("refreshAttempts");

      console.log("✅ Token refreshed successfully");
      return newAccessToken;
    } else {
      console.log("❌ Refresh response invalid");
      await clearAuthData();
      return null;
    }
  } catch (refreshError: any) {
    console.log(
      "❌ Token refresh failed:",
      refreshError?.message || refreshError
    );

    // If refresh fails, clear auth data and return null
    await clearAuthData();
    return null;
  }
};
