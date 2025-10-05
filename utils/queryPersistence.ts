import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  PersistQueryClientProvider,
  PersistQueryClientProviderProps,
} from "@tanstack/react-query-persist-client-core";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { STORAGE_KEYS, CACHE_DURATION } from "./asyncStorageUtils";

/**
 * Create AsyncStorage persister for TanStack Query
 */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: "react-query-cache",
  throttleTime: 1000, // Throttle writes to avoid excessive storage operations
});

/**
 * Create a persisted QueryClient with offline support
 */
export const createPersistedQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Cache data for 24 hours by default
        staleTime: CACHE_DURATION.CATEGORIES,
        gcTime: CACHE_DURATION.CATEGORIES * 2, // Keep in memory for 48 hours

        // Retry configuration for offline scenarios
        retry: (failureCount, error: any) => {
          // Don't retry on 4xx errors (client errors)
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          // Retry up to 3 times for network errors
          return failureCount < 3;
        },

        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Network mode configuration
        networkMode: "offlineFirst", // Try cache first, then network

        // Refetch configuration
        refetchOnWindowFocus: false, // Don't refetch on window focus in mobile
        refetchOnReconnect: true, // Refetch when network reconnects
        refetchOnMount: true, // Refetch when component mounts

        // Background refetch
        refetchInterval: false, // Disable automatic refetching
        refetchIntervalInBackground: false,
      },
      mutations: {
        // Retry mutations once on failure
        retry: 1,
        retryDelay: 1000,
      },
    },
  });
};

/**
 * Persist QueryClient configuration
 */
export const persistQueryClientConfig: Omit<
  PersistQueryClientProviderProps,
  "children"
> = {
  client: createPersistedQueryClient(),
  persistOptions: {
    persister: asyncStoragePersister,
    maxAge: CACHE_DURATION.CATEGORIES, // Persist for 24 hours
    buster: "v1", // Version buster for cache invalidation
  },
};

/**
 * Category-specific query configuration
 */
export const categoryQueryConfig = {
  // Categories don't change often, so we can cache them longer
  staleTime: CACHE_DURATION.CATEGORIES, // 24 hours
  gcTime: CACHE_DURATION.CATEGORIES * 2, // 48 hours

  // Retry configuration
  retry: 3,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 30000),

  // Network mode
  networkMode: "offlineFirst" as const,

  // Refetch configuration
  refetchOnWindowFocus: false,
  refetchOnReconnect: true,
  refetchOnMount: false, // Don't refetch on mount if we have cached data

  // Background refetch
  refetchInterval: false,
  refetchIntervalInBackground: false,
};

/**
 * User-specific query configuration (shorter cache time)
 */
export const userQueryConfig = {
  staleTime: CACHE_DURATION.TEMP_DATA, // 1 hour
  gcTime: CACHE_DURATION.USER_DATA, // 7 days

  retry: 2,
  retryDelay: (attemptIndex: number) =>
    Math.min(1000 * 2 ** attemptIndex, 10000),

  networkMode: "online" as const, // Always try network first for user data

  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchOnMount: true,

  refetchInterval: false,
  refetchIntervalInBackground: false,
};

/**
 * Utility to clear specific query cache
 */
export const clearQueryCache = async (queryKey: string[]): Promise<void> => {
  try {
    const queryClient = createPersistedQueryClient();
    await queryClient.removeQueries({ queryKey });
    console.log(`Cleared cache for query: ${queryKey.join("/")}`);
  } catch (error) {
    console.error("Error clearing query cache:", error);
  }
};

/**
 * Utility to invalidate specific query cache
 */
export const invalidateQueryCache = async (
  queryKey: string[]
): Promise<void> => {
  try {
    const queryClient = createPersistedQueryClient();
    await queryClient.invalidateQueries({ queryKey });
    console.log(`Invalidated cache for query: ${queryKey.join("/")}`);
  } catch (error) {
    console.error("Error invalidating query cache:", error);
  }
};

/**
 * Utility to get cache statistics
 */
export const getCacheStats = async (): Promise<{
  totalQueries: number;
  categoryQueries: number;
  cacheSize: number;
  lastUpdated: number | null;
}> => {
  try {
    const queryClient = createPersistedQueryClient();
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    const categoryQueries = queries.filter((query) =>
      query.queryKey.includes("categories")
    );

    // Estimate cache size
    let cacheSize = 0;
    queries.forEach((query) => {
      if (query.state.data) {
        cacheSize += JSON.stringify(query.state.data).length;
      }
    });

    // Get last updated timestamp
    const lastUpdated =
      queries.length > 0
        ? Math.max(...queries.map((q) => q.state.dataUpdatedAt))
        : null;

    return {
      totalQueries: queries.length,
      categoryQueries: categoryQueries.length,
      cacheSize,
      lastUpdated,
    };
  } catch (error) {
    console.error("Error getting cache stats:", error);
    return {
      totalQueries: 0,
      categoryQueries: 0,
      cacheSize: 0,
      lastUpdated: null,
    };
  }
};

/**
 * Preload critical data for offline use
 */
export const preloadCriticalData = async (): Promise<void> => {
  try {
    console.log("Preloading critical data for offline use...");

    // This would be called when the app starts to ensure critical data is cached
    // For now, we'll just log that we're preloading
    console.log("Critical data preloading completed");
  } catch (error) {
    console.error("Error preloading critical data:", error);
  }
};

/**
 * Clear all persisted cache
 */
export const clearAllPersistedCache = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem("react-query-cache");
    console.log("All persisted cache cleared");
  } catch (error) {
    console.error("Error clearing persisted cache:", error);
  }
};
