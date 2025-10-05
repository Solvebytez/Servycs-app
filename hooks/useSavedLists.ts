import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  savedListsService,
  SavedList,
  SavedListWithServiceStatus,
  SavedListsResponse,
  SavedListResponse,
  SavedListItemResponse,
  ServiceListStatusResponse,
  SavedListsWithServiceStatusResponse,
  ServiceSavedStatusResponse,
  CreateSavedListRequest,
  AddServiceToListRequest,
} from "../services/savedLists";

// Hook to get user's saved lists
export const useSavedLists = (
  userId: string | null,
  includeItems: boolean = false,
  limit: number = 50,
  page: number = 1
) => {
  return useQuery({
    queryKey: ["savedLists", userId, includeItems, limit, page],
    queryFn: async (): Promise<SavedListsResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return savedListsService.getUserSavedLists(
        userId,
        includeItems,
        limit,
        page
      );
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    networkMode: "offlineFirst",
  });
};

// Hook to get a specific saved list
export const useSavedList = (
  userId: string | null,
  listId: string | null,
  includeItems: boolean = false
) => {
  return useQuery({
    queryKey: ["savedList", userId, listId, includeItems],
    queryFn: async (): Promise<SavedListResponse> => {
      if (!userId || !listId) {
        throw new Error("User ID and List ID are required");
      }
      return savedListsService.getSavedListById(userId, listId, includeItems);
    },
    enabled: !!userId && !!listId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    networkMode: "offlineFirst",
  });
};

// Alias for saved list details (with items included)
export const useSavedListDetails = (
  listId: string | null,
  userId: string | null
) => {
  return useSavedList(userId, listId, true);
};

// Hook to check service list status
export const useServiceListStatus = (
  userId: string | null,
  serviceId: string | null
) => {
  return useQuery({
    queryKey: ["serviceListStatus", userId, serviceId],
    queryFn: async (): Promise<ServiceListStatusResponse> => {
      if (!userId || !serviceId) {
        throw new Error("User ID and Service ID are required");
      }
      return savedListsService.checkServiceListStatus(userId, serviceId);
    },
    enabled: !!userId && !!serviceId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    networkMode: "offlineFirst",
  });
};

// Hook to create a saved list
export const useCreateSavedList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      data,
    }: {
      userId: string;
      data: CreateSavedListRequest;
    }) => {
      return savedListsService.createSavedList(userId, data);
    },
    onSuccess: (data, variables) => {
      const { userId } = variables;

      // Invalidate and refetch saved lists
      queryClient.invalidateQueries({ queryKey: ["savedLists", userId] });
    },
    onError: (error) => {
      console.error("Error creating saved list:", error);
    },
  });
};

// Hook to update a saved list
export const useUpdateSavedList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      listId,
      data,
    }: {
      userId: string;
      listId: string;
      data: Partial<CreateSavedListRequest & { sortOrder?: number }>;
    }) => {
      return savedListsService.updateSavedList(userId, listId, data);
    },
    onSuccess: (data, variables) => {
      const { userId, listId } = variables;

      // Invalidate and refetch saved lists
      queryClient.invalidateQueries({ queryKey: ["savedLists", userId] });
      queryClient.invalidateQueries({
        queryKey: ["savedList", userId, listId],
      });
    },
    onError: (error) => {
      console.error("Error updating saved list:", error);
    },
  });
};

// Hook to delete a saved list
export const useDeleteSavedList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      listId,
    }: {
      userId: string;
      listId: string;
    }) => {
      return savedListsService.deleteSavedList(userId, listId);
    },
    onSuccess: (data, variables) => {
      const { userId, listId } = variables;

      // Invalidate and refetch saved lists
      queryClient.invalidateQueries({ queryKey: ["savedLists", userId] });
      queryClient.removeQueries({ queryKey: ["savedList", userId, listId] });
    },
    onError: (error) => {
      console.error("Error deleting saved list:", error);
    },
  });
};

// Hook to delete a saved list item
export const useDeleteSavedListItem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      return savedListsService.deleteSavedListItem(itemId);
    },
    onSuccess: (data, itemId) => {
      // Invalidate saved lists queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ["savedLists"] });
      queryClient.invalidateQueries({ queryKey: ["savedList"] });
    },
    onError: (error) => {
      console.error("Error deleting saved list item:", error);
    },
  });
};

// Hook to add service to list
export const useAddServiceToList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      listId,
      data,
    }: {
      userId: string;
      listId: string;
      data: AddServiceToListRequest;
    }) => {
      return savedListsService.addServiceToList(userId, listId, data);
    },
    onSuccess: (data, variables) => {
      const { userId, listId } = variables;

      // Invalidate and refetch saved lists
      queryClient.invalidateQueries({ queryKey: ["savedLists", userId] });
      queryClient.invalidateQueries({
        queryKey: ["savedList", userId, listId],
      });
      // Invalidate saved lists with service status cache
      queryClient.invalidateQueries({
        queryKey: ["savedListsWithServiceStatus", userId],
      });
    },
    onError: (error) => {
      console.error("Error adding service to list:", error);
    },
  });
};

// Hook to remove service from list
export const useRemoveServiceFromList = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      listId,
      itemId,
    }: {
      userId: string;
      listId: string;
      itemId: string;
    }) => {
      return savedListsService.removeServiceFromList(userId, listId, itemId);
    },
    onSuccess: (data, variables) => {
      const { userId, listId } = variables;

      // Invalidate and refetch saved lists
      queryClient.invalidateQueries({ queryKey: ["savedLists", userId] });
      queryClient.invalidateQueries({
        queryKey: ["savedList", userId, listId],
      });
      // Invalidate saved lists with service status cache
      queryClient.invalidateQueries({
        queryKey: ["savedListsWithServiceStatus", userId],
      });
    },
    onError: (error) => {
      console.error("Error removing service from list:", error);
    },
  });
};

// Utility hook to get just the saved lists data (without pagination info)
export const useSavedListsData = (
  userId: string | null,
  includeItems: boolean = false,
  limit: number = 50
) => {
  const { data, ...rest } = useSavedLists(userId, includeItems, limit, 1);

  return {
    savedLists: data?.data || [],
    ...rest,
  };
};

// Hook to get user's saved lists with service status
export const useSavedListsWithServiceStatus = (
  userId: string | null,
  serviceId: string | null,
  limit: number = 50,
  page: number = 1
) => {
  return useQuery({
    queryKey: ["savedListsWithServiceStatus", userId, serviceId, limit, page],
    queryFn: async (): Promise<SavedListsWithServiceStatusResponse> => {
      if (!userId || !serviceId) {
        throw new Error("User ID and Service ID are required");
      }
      return savedListsService.getUserSavedListsWithServiceStatus(
        userId,
        serviceId,
        limit,
        page
      );
    },
    enabled: !!userId && !!serviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    networkMode: "offlineFirst",
  });
};

// Hook for infinite scroll with search
export const useSavedListsInfinite = (
  userId: string | null,
  search?: string,
  includeItems: boolean = false,
  limit: number = 10
) => {
  return useInfiniteQuery({
    queryKey: ["savedListsInfinite", userId, search, includeItems, limit],
    queryFn: async ({ pageParam = 1 }): Promise<SavedListsResponse> => {
      if (!userId) {
        throw new Error("User ID is required");
      }
      return savedListsService.getUserSavedLists(
        userId,
        includeItems,
        limit,
        pageParam,
        search
      );
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.page < pagination.pages
        ? pagination.page + 1
        : undefined;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to check if a service is saved by a user
export const useServiceSavedStatus = (
  userId: string | null,
  serviceId: string | null
) => {
  return useQuery({
    queryKey: ["serviceSavedStatus", userId, serviceId],
    queryFn: async (): Promise<ServiceSavedStatusResponse> => {
      if (!userId || !serviceId) {
        throw new Error("User ID and Service ID are required");
      }
      return savedListsService.checkServiceSavedStatus(userId, serviceId);
    },
    enabled: !!userId && !!serviceId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    networkMode: "online",
  });
};

export default {
  useSavedLists,
  useSavedList,
  useSavedListDetails,
  useServiceListStatus,
  useCreateSavedList,
  useUpdateSavedList,
  useDeleteSavedList,
  useDeleteSavedListItem,
  useAddServiceToList,
  useRemoveServiceFromList,
  useSavedListsData,
  useSavedListsWithServiceStatus,
  useSavedListsInfinite,
  useServiceSavedStatus,
};
