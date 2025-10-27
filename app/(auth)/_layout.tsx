import { Stack } from "expo-router";
import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import {
  checkAuthenticationStatus,
  navigateToDashboard,
} from "@/utils/authUtils";

export default function AuthLayout() {
  const router = useRouter();
  const segments = useSegments();

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Don't redirect if we're on OTP verification screen
        const currentPath = segments.join("/");
        if (currentPath.includes("otp-verification")) {
          return;
        }

        const authStatus = await checkAuthenticationStatus();
        if (authStatus.isAuthenticated && authStatus.userRole) {
          navigateToDashboard(authStatus.userRole);
        }
      } catch (error) {
        console.error("Error checking authentication in auth layout:", error);
      }
    };

    checkAuth();
  }, [segments]);

  return (
    <Stack>
      <Stack.Screen name="login" options={{ title: "Login" }} />
      <Stack.Screen name="role-selection" options={{ headerShown: false }} />
      <Stack.Screen name="auth" options={{ headerShown: false }} />
      <Stack.Screen name="otp-verification" options={{ headerShown: false }} />
    </Stack>
  );
}
