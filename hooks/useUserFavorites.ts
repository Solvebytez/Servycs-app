import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  UserFavorite,
  UserFavoritesResponse,
  FavoriteStatusResponse,
} from "../services/user";

// Hook to get user's favorite service listings
export const useUserFavorites = (
  userId: string | null,
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ["userFavorites", userId, page, limit],
    queryFn: async (): Promise<UserFavoritesResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return userService.getUserFavorites(userId, page, limit);
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 5 * 60 * 1000, // 5 minutes - data stays fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache
    retry: 2, // Retry failed requests 2 times
    refetchOnWindowFocus: false, // Don't refetch when app comes to foreground
    refetchOnMount: false, // Don't refetch when component mounts (use cache)
    networkMode: "offlineFirst", // Use cache when offline
  });
};

// Hook to check if a service is in user's favorites
export const useFavoriteStatus = (
  userId: string | null,
  serviceId: string | null
) => {
  return useQuery({
    queryKey: ["favoriteStatus", userId, serviceId],
    queryFn: async (): Promise<FavoriteStatusResponse> => {
      if (!userId || !serviceId) {
        throw new Error("User ID and Service ID are required");
      }
      return userService.checkFavoriteStatus(userId, serviceId);
    },
    enabled: !!userId && !!serviceId, // Only run query if both IDs exist
    staleTime: 1 * 60 * 1000, // 1 minute - data stays fresh
    gcTime: 5 * 60 * 1000, // 5 minutes - data stays in cache
    retry: 1, // Retry failed requests 1 time
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    networkMode: "offlineFirst", // Use cache when offline
  });
};

// Hook to add service to favorites
export const useAddToFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      serviceId,
    }: {
      userId: string;
      serviceId: string;
    }) => {
      return userService.addToFavorites(userId, serviceId);
    },
    onSuccess: (data, variables) => {
      const { userId, serviceId } = variables;

      // Invalidate and refetch user favorites
      queryClient.invalidateQueries({ queryKey: ["userFavorites", userId] });

      // Update favorite status for this specific service
      queryClient.setQueryData(["favoriteStatus", userId, serviceId], {
        data: {
          isFavorite: true,
          favoriteId: data.id,
          addedAt: data.createdAt,
        },
      });

      // Optimistically update the favorites list
      queryClient.setQueryData(
        ["userFavorites", userId, 1, 10], // Assuming page 1, limit 10
        (oldData: UserFavoritesResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: [data, ...oldData.data], // Add new favorite at the beginning
            pagination: {
              ...oldData.pagination,
              totalCount: oldData.pagination.totalCount + 1,
            },
          };
        }
      );
    },
    onError: (error) => {
      console.error("Error adding to favorites:", error);
    },
  });
};

// Hook to remove service from favorites
export const useRemoveFromFavorites = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      serviceId,
    }: {
      userId: string;
      serviceId: string;
    }) => {
      return userService.removeFromFavorites(userId, serviceId);
    },
    onSuccess: (data, variables) => {
      const { userId, serviceId } = variables;

      // Invalidate and refetch user favorites
      queryClient.invalidateQueries({ queryKey: ["userFavorites", userId] });

      // Update favorite status for this specific service
      queryClient.setQueryData(["favoriteStatus", userId, serviceId], {
        data: {
          isFavorite: false,
          favoriteId: null,
          addedAt: null,
        },
      });

      // Optimistically update the favorites list
      queryClient.setQueryData(
        ["userFavorites", userId, 1, 10], // Assuming page 1, limit 10
        (oldData: UserFavoritesResponse | undefined) => {
          if (!oldData) return oldData;

          return {
            ...oldData,
            data: oldData.data.filter(
              (fav) => fav.serviceListingId !== serviceId
            ),
            pagination: {
              ...oldData.pagination,
              totalCount: Math.max(0, oldData.pagination.totalCount - 1),
            },
          };
        }
      );
    },
    onError: (error) => {
      console.error("Error removing from favorites:", error);
    },
  });
};

// Hook to toggle favorite status (add if not favorite, remove if favorite)
export const useToggleFavorite = () => {
  const addToFavorites = useAddToFavorites();
  const removeFromFavorites = useRemoveFromFavorites();

  return {
    toggleFavorite: async (
      userId: string,
      serviceId: string,
      isCurrentlyFavorite: boolean
    ) => {
      if (isCurrentlyFavorite) {
        return removeFromFavorites.mutateAsync({ userId, serviceId });
      } else {
        return addToFavorites.mutateAsync({ userId, serviceId });
      }
    },
    isAdding: addToFavorites.isPending,
    isRemoving: removeFromFavorites.isPending,
    isPending: addToFavorites.isPending || removeFromFavorites.isPending,
    error: addToFavorites.error || removeFromFavorites.error,
  };
};

// Hook to get favorites count for a user
export const useFavoritesCount = (userId: string | null) => {
  return useQuery({
    queryKey: ["favoritesCount", userId],
    queryFn: async (): Promise<number> => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      const response = await userService.getUserFavorites(userId, 1, 1); // Just get count
      return response.pagination.totalCount;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - count doesn't change often
    gcTime: 10 * 60 * 1000, // 10 minutes - data stays in cache
    retry: 1,
    refetchOnWindowFocus: false,
    networkMode: "offlineFirst",
  });
};

// Utility hook to get just the favorites data (without pagination info)
export const useUserFavoritesData = (
  userId: string | null,
  limit: number = 10
) => {
  const { data, ...rest } = useUserFavorites(userId, 1, limit);

  return {
    favorites: data?.data || [],
    ...rest,
  };
};

export default {
  useUserFavorites,
  useFavoriteStatus,
  useAddToFavorites,
  useRemoveFromFavorites,
  useToggleFavorite,
  useFavoritesCount,
  useUserFavoritesData,
};
