import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { filterUtils, ServiceListingsParams } from "@/components/user/filters/filterUtils";

// Hook for filtered service listings with pagination
export const useFilteredServiceListings = (
  filters: Record<string, any>,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    excludeUserId?: string;
  } = {}
) => {
  // Convert UI filters to API parameters
  const apiParams = filterUtils.convertFiltersToApiParams(filters);
  
  // Merge with additional options
  const queryParams: ServiceListingsParams = {
    ...apiParams,
    page: options.page || 1,
    limit: options.limit || 10,
    ...(options.search && { search: options.search }),
    ...(options.excludeUserId && { excludeUserId: options.excludeUserId }),
  };

  return useQuery({
    queryKey: ["serviceListings", "filtered", queryParams],
    queryFn: async () => {
      const response = await api.get("/services", { params: queryParams });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
};

// Hook for infinite scroll with filters
export const useInfiniteFilteredServiceListings = (
  filters: Record<string, any>,
  options: {
    search?: string;
    excludeUserId?: string;
    limit?: number;
  } = {}
) => {
  // Convert UI filters to API parameters
  const apiParams = filterUtils.convertFiltersToApiParams(filters);
  
  // Base query parameters
  const baseParams: ServiceListingsParams = {
    ...apiParams,
    limit: options.limit || 10,
    ...(options.search && { search: options.search }),
    ...(options.excludeUserId && { excludeUserId: options.excludeUserId }),
  };

  return useInfiniteQuery({
    queryKey: ["serviceListings", "infinite", "filtered", baseParams],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get("/services", {
        params: {
          ...baseParams,
          page: pageParam,
        },
      });
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage.data;
      return pagination.hasNextPage ? pagination.currentPage + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: true,
  });
};

// Hook for popular services with filters
export const useFilteredPopularServices = (
  filters: Record<string, any>,
  options: {
    limit?: number;
    excludeUserId?: string;
  } = {}
) => {
  // Convert UI filters to API parameters
  const apiParams = filterUtils.convertFiltersToApiParams(filters);
  
  // For popular services, we typically want to sort by rating and limit results
  const queryParams: ServiceListingsParams = {
    ...apiParams,
    limit: options.limit || 5,
    sortBy: "rating",
    sortOrder: "desc",
    ...(options.excludeUserId && { excludeUserId: options.excludeUserId }),
  };

  return useQuery({
    queryKey: ["serviceListings", "popular", "filtered", queryParams],
    queryFn: async () => {
      const response = await api.get("/services", { params: queryParams });
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes (popular services change less frequently)
    enabled: true,
  });
};

// Hook for category-specific filtered services
export const useFilteredCategoryServices = (
  categoryId: string,
  filters: Record<string, any>,
  options: {
    page?: number;
    limit?: number;
    search?: string;
    excludeUserId?: string;
  } = {}
) => {
  // Convert UI filters to API parameters
  const apiParams = filterUtils.convertFiltersToApiParams(filters);
  
  // Add category filter
  const queryParams: ServiceListingsParams = {
    ...apiParams,
    categoryId,
    page: options.page || 1,
    limit: options.limit || 10,
    ...(options.search && { search: options.search }),
    ...(options.excludeUserId && { excludeUserId: options.excludeUserId }),
  };

  return useQuery({
    queryKey: ["serviceListings", "category", categoryId, "filtered", queryParams],
    queryFn: async () => {
      const response = await api.get("/services", { params: queryParams });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!categoryId,
  });
};

// Hook for vendor-specific filtered services
export const useFilteredVendorServices = (
  vendorId: string,
  filters: Record<string, any>,
  options: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}
) => {
  // Convert UI filters to API parameters
  const apiParams = filterUtils.convertFiltersToApiParams(filters);
  
  // Add vendor filter
  const queryParams: ServiceListingsParams = {
    ...apiParams,
    vendorId,
    page: options.page || 1,
    limit: options.limit || 10,
    ...(options.search && { search: options.search }),
  };

  return useQuery({
    queryKey: ["serviceListings", "vendor", vendorId, "filtered", queryParams],
    queryFn: async () => {
      const response = await api.get("/services", { params: queryParams });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!vendorId,
  });
};
