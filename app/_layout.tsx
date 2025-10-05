import "react-native-gesture-handler";
import "react-native-reanimated";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useBackgroundSessionValidation } from "../hooks/useSessionValidation";

// If you have a custom QueryProvider, you can still wrap QueryClient inside it
import { QueryProvider } from "../providers/QueryProvider";

const queryClient = new QueryClient();

// Component that runs inside QueryProvider
function AppWithSessionValidation() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
    </Stack>
  );
}

// Component that uses React Query hooks
function AppWithSessionValidationWrapper() {
  // Run background session validation every 60 seconds for the entire app
  useBackgroundSessionValidation(60000);

  return <AppWithSessionValidation />;
}

export default function RootLayout() {
  useEffect(() => {
    console.log("RootLayout: Component mounted");
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <QueryProvider>
          <AppWithSessionValidationWrapper />
        </QueryProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
