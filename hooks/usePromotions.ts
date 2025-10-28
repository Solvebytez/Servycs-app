import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  promotionService,
  CreatePromotionRequest,
  UpdatePromotionRequest,
  Promotion,
  PromotionDetails,
} from "@/services/promotion";

// Query keys
export const promotionKeys = {
  all: ["promotions"] as const,
  vendorPromotions: (page?: number, limit?: number, status?: string) =>
    [...promotionKeys.all, "vendor", { page, limit, status }] as const,
  vendorPromotionsInfinite: (status?: string) =>
    [...promotionKeys.all, "vendor", "infinite", { status }] as const,
  promotion: (id: string) => [...promotionKeys.all, "detail", id] as const,
  activePromotions: (excludeUserId?: string) =>
    [...promotionKeys.all, "active", { excludeUserId }] as const,
  promotionDetails: (id: string) =>
    [...promotionKeys.all, "details", id] as const,
};

// Hook for getting vendor's promotions
export const useVendorPromotions = (
  page: number = 1,
  limit: number = 10,
  status?: "active" | "inactive"
) => {
  return useQuery({
    queryKey: promotionKeys.vendorPromotions(page, limit, status),
    queryFn: () => promotionService.getVendorPromotions(page, limit, status),
    staleTime: 0, // Always consider data stale - allows pull-to-refresh to work
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for faster loading
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook for infinite scroll vendor promotions
export const useVendorPromotionsInfinite = (status?: "active" | "inactive") => {
  return useInfiniteQuery({
    queryKey: promotionKeys.vendorPromotionsInfinite(status),
    queryFn: ({ pageParam = 1 }) => {
      return promotionService.getVendorPromotions(pageParam, 10, status);
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination?.hasNextPage) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 0, // Always consider data stale - allows pull-to-refresh to work
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache for faster loading
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Hook for getting a single promotion
export const usePromotion = (id: string) => {
  return useQuery({
    queryKey: promotionKeys.promotion(id),
    queryFn: async () => {
      const result = await promotionService.getPromotionById(id);
      return result;
    },
    enabled: !!id,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

// Hook for getting a single vendor promotion (alias for usePromotion)
export const useVendorPromotion = (id: string) => {
  return usePromotion(id);
};

// Hook for creating a promotion
export const useCreatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePromotionRequest) =>
      promotionService.createPromotion(data),
    onSuccess: () => {
      // Invalidate and refetch vendor promotions
      queryClient.invalidateQueries({
        queryKey: promotionKeys.vendorPromotions(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.vendorPromotionsInfinite(),
      });
    },
    onError: (error) => {
      console.error("Error creating promotion:", error);
    },
  });
};

// Hook for updating a promotion
export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePromotionRequest }) =>
      promotionService.updatePromotion(id, data),
    onSuccess: (updatedPromotion) => {
      console.log(
        "🔄 UPDATE SUCCESS - Updated promotion data:",
        updatedPromotion
      );
      console.log(
        "🔄 UPDATE SUCCESS - Service listings:",
        updatedPromotion.serviceListings
      );

      // Update the specific promotion in cache
      const cacheKey = promotionKeys.promotion(updatedPromotion.id);
      console.log("🔄 UPDATE SUCCESS - Cache key:", cacheKey);

      queryClient.setQueryData(cacheKey, updatedPromotion);

      // Also invalidate the specific promotion query to force refetch
      queryClient.invalidateQueries({
        queryKey: cacheKey,
      });

      // Invalidate vendor promotions list
      queryClient.invalidateQueries({
        queryKey: promotionKeys.vendorPromotions(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.vendorPromotionsInfinite(),
      });
    },
    onError: (error) => {
      console.error("Error updating promotion:", error);
    },
  });
};

// Hook for deleting a promotion
export const useDeletePromotion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promotionService.deletePromotion(id),
    onSuccess: (_, deletedId) => {
      // Remove the promotion from cache
      queryClient.removeQueries({
        queryKey: promotionKeys.promotion(deletedId),
      });

      // Invalidate vendor promotions list
      queryClient.invalidateQueries({
        queryKey: promotionKeys.vendorPromotions(),
      });
      queryClient.invalidateQueries({
        queryKey: promotionKeys.vendorPromotionsInfinite(),
      });
    },
    onError: (error) => {
      console.error("Error deleting promotion:", error);
    },
  });
};

// Hook for getting active promotions for banner slider
export const useActivePromotions = (excludeCurrentUser: boolean = false) => {
  return useQuery({
    queryKey: promotionKeys.activePromotions(
      excludeCurrentUser ? "current" : undefined
    ),
    queryFn: async () => {
      try {
        let excludeUserId: string | undefined;

        if (excludeCurrentUser) {
          // Get current user ID from AsyncStorage
          const userData = await AsyncStorage.getItem("userData");

          if (userData) {
            const parsedUserData = JSON.parse(userData);
            excludeUserId = parsedUserData.id;
          }
        }

        const result = await promotionService.getActivePromotions(
          excludeUserId
        );
        return result;
      } catch (error) {
        console.error(
          "🎯 FRONTEND DEBUG - Error fetching active promotions:",
          error
        );
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache
    retry: 2, // Retry failed requests 2 times
    refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
    refetchOnMount: false, // Don't refetch when component mounts (use cache)
    networkMode: "offlineFirst", // Use cache when offline
  });
};

// Hook for getting promotion details with all attached services
export const usePromotionDetails = (id: string) => {
  return useQuery({
    queryKey: promotionKeys.promotionDetails(id),
    queryFn: () => promotionService.getPromotionDetails(id),
    enabled: !!id, // Only run query if id is provided
    staleTime: 5 * 60 * 1000, // 5 minutes - consider data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache for 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Helper function to flatten infinite query data
export const flattenInfinitePromotions = (data: any): Promotion[] => {
  if (!data?.pages) return [];
  return data.pages.flatMap((page: any) => page.promotions || []);
};
