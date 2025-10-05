import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, usePathname } from "expo-router";
import { AppState } from "react-native";

export const useBackgroundSessionValidation = (interval = 30000) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const previousPathnameRef = useRef<string | null>(null);

  // Session validation function
  const validateSession = async (trigger: string = "unknown") => {
    try {
      // Don't check session if user is on auth screens
      if (
        pathname?.includes("(auth)") ||
        pathname === "/" ||
        pathname === "/index"
      ) {
        return;
      }

      // Check if user has a token before making API call
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        return; // No token, no need to check
      }

      console.log(`🔐 Session validation triggered by: ${trigger}`);

      // Make a session validation call with cache-busting to ensure fresh validation
      // This is separate from useUser hook which has its own caching strategy
      await api.get("/auth/me", {
        params: { _validate: Date.now() }, // Cache busting for validation
        headers: {
          "X-Session-Validation": "true", // Custom header to identify validation calls
        },
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || "";
        if (
          errorMessage.includes("logged in elsewhere") ||
          errorMessage.includes("Session expired")
        ) {
          console.log(
            `🔐 Session validation (${trigger}) - logged in elsewhere detected`
          );

          // Clear all authentication data
          await AsyncStorage.multiRemove([
            "accessToken",
            "userRole",
            "userEmail",
            "userId",
            "tokenTimestamp",
            "hasCompletedOnboarding",
            "userData",
            "profilePicture",
            "userProfile",
            "currentUser",
            "cachedUser",
            "sessionExpiredMessage",
          ]);

          // Store session expiry message for display
          await AsyncStorage.setItem(
            "sessionExpiredMessage",
            "You have been logged out because you logged in on another device."
          );

          // Clear React Query cache
          queryClient.clear();

          // Navigate to login screen
          router.replace("/(auth)/role-selection");
        }
      }
    }
  };

  // Effect for background interval validation
  useEffect(() => {
    // Start checking every specified interval (default 30 seconds)
    intervalRef.current = setInterval(
      () => validateSession("background"),
      interval
    );

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [queryClient, interval, pathname]);

  // Effect for screen change validation
  useEffect(() => {
    // Skip first render
    if (previousPathnameRef.current === null) {
      previousPathnameRef.current = pathname;
      return;
    }

    // Check if pathname changed
    if (previousPathnameRef.current !== pathname) {
      console.log(
        `🔄 Screen changed: ${previousPathnameRef.current} → ${pathname}`
      );
      previousPathnameRef.current = pathname;

      // Validate session on screen change (with small delay to avoid rapid calls)
      setTimeout(() => validateSession("screen-change"), 500);
    }
  }, [pathname]);

  // Effect for app state change validation (when user returns to app)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active") {
        console.log("📱 App became active - validating session");
        validateSession("app-focus");
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    return () => {
      subscription?.remove();
    };
  }, [pathname]);
};
