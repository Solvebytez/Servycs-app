import { useMemo } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { filterUtils, ServiceListingsParams } from "@/components/user/filters/filterUtils";
import { useUser } from "./useUser";

// Enhanced hook that automatically handles filter conversion and user exclusion
export const useFilterAwareServices = (
  filters: Record<string, any>,
  options: {
    type?: "paginated" | "infinite" | "popular";
    page?: number;
    limit?: number;
    search?: string;
    excludeCurrentUser?: boolean;
    categoryId?: string;
    vendorId?: string;
  } = {}
) => {
  const { user } = useUser();
  
  // Convert UI filters to API parameters
  const apiParams = useMemo(() => {
    return filterUtils.convertFiltersToApiParams(filters);
  }, [filters]);

  // Build query parameters
  const queryParams = useMemo((): ServiceListingsParams => {
    const params: ServiceListingsParams = {
      ...apiParams,
      page: options.page || 1,
      limit: options.limit || 10,
      ...(options.search && { search: options.search }),
      ...(options.categoryId && { categoryId: options.categoryId }),
      ...(options.vendorId && { vendorId: options.vendorId }),
    };

    // Add user exclusion if requested
    if (options.excludeCurrentUser && user?.id) {
      params.excludeUserId = user.id;
    }

    // Set default sorting for popular services
    if (options.type === "popular") {
      params.sortBy = "rating";
      params.sortOrder = "desc";
    }

    return params;
  }, [apiParams, options, user?.id]);

  // Generate query key
  const queryKey = useMemo(() => {
    const baseKey = ["serviceListings"];
    
    if (options.type === "popular") {
      baseKey.push("popular");
    } else if (options.type === "infinite") {
      baseKey.push("infinite");
    }
    
    if (options.categoryId) {
      baseKey.push("category", options.categoryId);
    }
    
    if (options.vendorId) {
      baseKey.push("vendor", options.vendorId);
    }
    
    baseKey.push("filtered", queryParams);
    
    return baseKey;
  }, [options.type, options.categoryId, options.vendorId, queryParams]);

  // Paginated query
  const paginatedQuery = useQuery({
    queryKey: [...queryKey, "paginated"],
    queryFn: async () => {
      const response = await api.get("/services", { params: queryParams });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: options.type !== "infinite",
  });

  // Infinite query
  const infiniteQuery = useInfiniteQuery({
    queryKey: [...queryKey, "infinite"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.get("/services", {
        params: {
          ...queryParams,
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
    enabled: options.type === "infinite",
  });

  // Return the appropriate query based on type
  if (options.type === "infinite") {
    return {
      ...infiniteQuery,
      data: infiniteQuery.data?.pages.flatMap(page => page.data.listings) || [],
      isLoading: infiniteQuery.isLoading,
      isError: infiniteQuery.isError,
      error: infiniteQuery.error,
      refetch: infiniteQuery.refetch,
      fetchNextPage: infiniteQuery.fetchNextPage,
      hasNextPage: infiniteQuery.hasNextPage,
      isFetchingNextPage: infiniteQuery.isFetchingNextPage,
    };
  }

  return {
    ...paginatedQuery,
    data: paginatedQuery.data?.data?.listings || [],
    pagination: paginatedQuery.data?.data?.pagination,
    isLoading: paginatedQuery.isLoading,
    isError: paginatedQuery.isError,
    error: paginatedQuery.error,
    refetch: paginatedQuery.refetch,
  };
};

// Hook for search results with filters
export const useFilteredSearchResults = (
  searchQuery: string,
  filters: Record<string, any>,
  options: {
    limit?: number;
    excludeCurrentUser?: boolean;
  } = {}
) => {
  return useFilterAwareServices(filters, {
    type: "paginated",
    search: searchQuery,
    limit: options.limit || 20,
    excludeCurrentUser: options.excludeCurrentUser ?? true,
  });
};

// Hook for category page with filters
export const useFilteredCategoryPage = (
  categoryId: string,
  filters: Record<string, any>,
  options: {
    limit?: number;
    excludeCurrentUser?: boolean;
  } = {}
) => {
  return useFilterAwareServices(filters, {
    type: "infinite",
    categoryId,
    limit: options.limit || 10,
    excludeCurrentUser: options.excludeCurrentUser ?? true,
  });
};

// Hook for vendor profile with filters
export const useFilteredVendorProfile = (
  vendorId: string,
  filters: Record<string, any>,
  options: {
    limit?: number;
  } = {}
) => {
  return useFilterAwareServices(filters, {
    type: "paginated",
    vendorId,
    limit: options.limit || 10,
    excludeCurrentUser: false, // Don't exclude current user for vendor profile
  });
};

// Hook for home page popular services with filters
export const useFilteredPopularServices = (
  filters: Record<string, any>,
  options: {
    limit?: number;
    excludeCurrentUser?: boolean;
  } = {}
) => {
  return useFilterAwareServices(filters, {
    type: "popular",
    limit: options.limit || 5,
    excludeCurrentUser: options.excludeCurrentUser ?? true,
  });
};
