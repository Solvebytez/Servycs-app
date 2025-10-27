import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/services/api";

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  image?: string;
  status: string;
  isServiceOn: boolean;
  isFeatured: boolean;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  vendor: {
    id: string;
    businessName: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  category: {
    id: string;
    name: string;
    slug: string;
  };
  address: {
    id: string;
    city: string;
    state: string;
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    price: number;
    discountPrice?: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ServiceListingsResponse {
  success: boolean;
  data: {
    listings: ServiceListing[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
      nextCursor?: string;
      previousCursor?: string;
    };
  };
  meta: {
    requestTime: number;
    cacheHit: boolean;
  };
}

interface ServiceListingsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  subcategoryIds?: string[];
  vendorId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  isActive?: boolean;
  excludeUserId?: string;
  sortBy?: "createdAt" | "updatedAt" | "title" | "rating" | "price";
  sortOrder?: "asc" | "desc";
  minRating?: number;
  maxRating?: number;
  status?: "ACTIVE" | "PENDING" | "REJECTED" | "OFF_SERVICE" | "DRAFT";
  businessHours?: string;
  timezone?: string;
}

interface FlexibleUpdateRequest {
  // Basic fields (optional)
  title?: string;
  description?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  image?: string;
  status?: "DRAFT" | "ACTIVE" | "PENDING" | "REJECTED" | "OFF_SERVICE";

  // Address (optional)
  addressId?: string;

  // Business hours (optional) - shop level
  businessHours?: any;

  // Category (optional)
  categoryId?: string;
  categoryPath?: string[];

  // Services (flexible operations)
  services?: {
    add?: {
      name: string;
      description: string;
      price?: number;
      discountPrice?: number;
      duration?: string;
      categoryIds?: string[]; // ✅ Added array support
      categoryPaths?: any; // ✅ Added JSON support
    }[];
    update?: {
      id: string;
      name?: string;
      description?: string;
      price?: number;
      discountPrice?: number;
      duration?: string;
      categoryIds?: string[]; // ✅ Added array support
      categoryPaths?: any; // ✅ Added JSON support
    }[];
    remove?: string[]; // service IDs to remove
    replace?: {
      name: string;
      description: string;
      price?: number;
      discountPrice?: number;
      duration?: string;
      categoryIds?: string[]; // ✅ Added array support
      categoryPaths?: any; // ✅ Added JSON support
    }[]; // replace all services
  };
}

// Hook to fetch service listings
export const useServiceListings = (params: ServiceListingsParams = {}) => {
  return useQuery<ServiceListingsResponse>({
    queryKey: ["serviceListings", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params.page) searchParams.append("page", params.page.toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.categoryId)
        searchParams.append("categoryId", params.categoryId);
      if (params.subcategoryIds && params.subcategoryIds.length > 0) {
        params.subcategoryIds.forEach((id) => {
          searchParams.append("subcategoryIds", id);
        });
      }
      if (params.vendorId) searchParams.append("vendorId", params.vendorId);
      if (params.search) searchParams.append("search", params.search);
      if (params.minPrice)
        searchParams.append("minPrice", params.minPrice.toString());
      if (params.maxPrice)
        searchParams.append("maxPrice", params.maxPrice.toString());
      if (params.city) searchParams.append("city", params.city);
      if (params.state) searchParams.append("state", params.state);
      if (params.isActive !== undefined)
        searchParams.append("isActive", params.isActive.toString());
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await api.get(`/services?${searchParams.toString()}`);
      return response.data as ServiceListingsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch popular/featured services (excluding current user's vendor services)
export const usePopularServices = (
  limit: number = 5,
  excludeCurrentUser: boolean = true
) => {
  return useQuery<ServiceListingsResponse>({
    queryKey: ["popularServices", limit, excludeCurrentUser],
    queryFn: async () => {
      // Get current user ID to exclude their vendor services
      let excludeUserId = "";
      if (excludeCurrentUser) {
        try {
          const AsyncStorage = await import(
            "@react-native-async-storage/async-storage"
          );
          const userData = await AsyncStorage.default.getItem("userData");
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            excludeUserId = parsedUserData.id;
          }
        } catch (error) {
          // Silent error handling
        }
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append("limit", limit.toString());
      params.append("isActive", "true");
      params.append("sortBy", "rating");
      params.append("sortOrder", "desc");
      if (excludeUserId) {
        params.append("excludeUserId", excludeUserId);
      }

      const response = await api.get(`/services?${params.toString()}`);
      return response.data as ServiceListingsResponse;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch a single service listing by ID
export const useServiceListing = (id: string) => {
  return useQuery<{ success: boolean; data: ServiceListing }>({
    queryKey: ["serviceListing", id],
    queryFn: async () => {
      const response = await api.get(`/services/${id}`);
      return response.data as { success: boolean; data: ServiceListing };
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to fetch vendor's own service listings
export const useMyServiceListings = () => {
  return useQuery<ServiceListingsResponse>({
    queryKey: ["myServiceListings"],
    queryFn: async () => {
      console.log("🔄 Fetching vendor listings from API...");
      const response = await api.get("/services/vendor/my-listings");
      console.log("📥 API response received:", response.data);
      return response.data as ServiceListingsResponse;
    },
    staleTime: 0, // Always consider data stale - force fresh fetch
    gcTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Hook to fetch vendor's own service listings with filters
export const useMyServiceListingsFiltered = (filters?: {
  status?: string;
  isServiceOn?: boolean;
}) => {
  return useQuery<ServiceListingsResponse>({
    queryKey: ["myServiceListings", filters],
    queryFn: async () => {
      console.log("🔄 Fetching filtered vendor listings from API...");
      const params = new URLSearchParams();
      if (filters?.status) {
        params.append("status", filters.status);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/services/vendor/my-listings?${queryString}`
        : "/services/vendor/my-listings";

      const response = await api.get(url);
      console.log("📥 Filtered API response received:", response.data);

      // Filter by isServiceOn on the response if needed
      let data = response.data as ServiceListingsResponse;
      if (filters?.isServiceOn !== undefined && data.data?.listings) {
        data = {
          ...data,
          data: {
            ...data.data,
            listings: data.data.listings.filter(
              (listing) => listing.isServiceOn === filters.isServiceOn
            ),
          },
        };
      }

      return data;
    },
    staleTime: 0, // Always consider data stale - force fresh fetch
    gcTime: 0, // Don't cache data
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });
};

// Hook for infinite query of service listings (for pagination)
export const useInfiniteServiceListings = (
  params: ServiceListingsParams = {}
) => {
  return useInfiniteQuery<any>({
    queryKey: ["serviceListings", "infinite", params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      searchParams.append("page", (pageParam as number).toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.categoryId)
        searchParams.append("categoryId", params.categoryId);
      if (params.subcategoryIds && params.subcategoryIds.length > 0) {
        params.subcategoryIds.forEach((id) => {
          searchParams.append("subcategoryIds", id);
        });
      }
      if (params.vendorId) searchParams.append("vendorId", params.vendorId);
      if (params.search) searchParams.append("search", params.search);
      if (params.minPrice)
        searchParams.append("minPrice", params.minPrice.toString());
      if (params.maxPrice)
        searchParams.append("maxPrice", params.maxPrice.toString());
      if (params.city) searchParams.append("city", params.city);
      if (params.state) searchParams.append("state", params.state);
      if (params.isActive !== undefined)
        searchParams.append("isActive", params.isActive.toString());
      if (params.excludeUserId)
        searchParams.append("excludeUserId", params.excludeUserId);
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await api.get(`/services?${searchParams.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { data } = lastPage;
      if (data?.pagination?.hasNextPage) {
        return data.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook for infinite query of service listings with automatic user exclusion
export const useInfiniteServiceListingsWithExclusion = (
  params: ServiceListingsParams = {},
  excludeCurrentUser: boolean = true
) => {
  return useInfiniteQuery<any>({
    queryKey: ["serviceListings", "infinite", "excludeUser", params],
    queryFn: async ({ pageParam = 1 }) => {
      // Get current user ID to exclude their vendor services
      let excludeUserId = "";
      if (excludeCurrentUser) {
        try {
          const AsyncStorage = await import(
            "@react-native-async-storage/async-storage"
          );
          const userData = await AsyncStorage.default.getItem("userData");
          if (userData) {
            const parsedUserData = JSON.parse(userData);
            excludeUserId = parsedUserData.id;
          }
        } catch (error) {
          // Silent error handling
        }
      }

      const searchParams = new URLSearchParams();
      searchParams.append("page", (pageParam as number).toString());
      if (params.limit) searchParams.append("limit", params.limit.toString());
      if (params.categoryId)
        searchParams.append("categoryId", params.categoryId);
      if (params.subcategoryIds && params.subcategoryIds.length > 0) {
        params.subcategoryIds.forEach((id) => {
          searchParams.append("subcategoryIds", id);
        });
      }
      if (params.vendorId) searchParams.append("vendorId", params.vendorId);
      if (params.search) searchParams.append("search", params.search);
      if (params.minPrice)
        searchParams.append("minPrice", params.minPrice.toString());
      if (params.maxPrice)
        searchParams.append("maxPrice", params.maxPrice.toString());
      if (params.city) searchParams.append("city", params.city);
      if (params.state) searchParams.append("state", params.state);
      if (params.isActive !== undefined)
        searchParams.append("isActive", params.isActive.toString());
      if (excludeUserId) searchParams.append("excludeUserId", excludeUserId);
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);
      if (params.minRating !== undefined)
        searchParams.append("minRating", params.minRating.toString());
      if (params.maxRating !== undefined)
        searchParams.append("maxRating", params.maxRating.toString());
      if (params.businessHours)
        searchParams.append("businessHours", params.businessHours);
      if (params.timezone) searchParams.append("timezone", params.timezone);

      const response = await api.get(`/services?${searchParams.toString()}`);
      return response.data;
    },
    getNextPageParam: (lastPage) => {
      const { data } = lastPage;
      if (data?.pagination?.hasNextPage) {
        return data.pagination.currentPage + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Utility function to flatten infinite query data
export const flattenInfiniteServiceListings = (data: any) => {
  if (!data?.pages) {
    return [];
  }

  const result = data.pages.flatMap((page: any) => {
    // Handle both data structures: page.data.listings and page.data directly
    if (page.data?.listings) {
      return page.data.listings;
    } else if (Array.isArray(page.data)) {
      return page.data;
    } else if (page.data) {
      return [page.data];
    }
    return [];
  });

  return result;
};

// Utility function to get pagination info from infinite query
export const getPaginationInfo = (data: any) => {
  if (!data?.pages || data.pages.length === 0) {
    return {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  const lastPage = data.pages[data.pages.length - 1];
  const { pagination } = lastPage || {};

  // Add null checks for pagination object
  if (!pagination) {
    return {
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
  }

  return {
    currentPage: pagination.currentPage || 1,
    totalPages: pagination.totalPages || 1,
    totalItems: pagination.totalCount || 0,
    hasNextPage: pagination.hasNextPage || false,
    hasPreviousPage: pagination.hasPreviousPage || false,
  };
};

// Mutation hook for updating service listings
export const useUpdateServiceListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<ServiceListing>;
    }) => {
      const response = await api.put(`/services/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch service listings
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["myServiceListings"] });
    },
  });
};

// Flexible update hook for complex updates
export const useUpdateServiceListingFlexible = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: FlexibleUpdateRequest;
    }) => {
      const response = await api.put(`/services/${id}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch service listings
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["myServiceListings"] });
      // Invalidate the specific service listing query
      queryClient.invalidateQueries({
        queryKey: ["serviceListing", variables.id],
      });
    },
  });
};

// Mutation hook for creating service listings
export const useCreateServiceListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post("/services", data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch service listings
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["myServiceListings"] });
    },
  });
};

// Mutation hook for deleting service listings
export const useDeleteServiceListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/services/${id}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch service listings
      queryClient.invalidateQueries({ queryKey: ["serviceListings"] });
      queryClient.invalidateQueries({ queryKey: ["myServiceListings"] });
    },
  });
};

// Hook for infinite query of vendor's own service listings with pagination
export const useInfiniteMyServiceListings = (
  params: ServiceListingsParams = {}
) => {
  return useInfiniteQuery<any>({
    queryKey: ["myServiceListings", "infinite", params],
    queryFn: async ({ pageParam = 1 }) => {
      const searchParams = new URLSearchParams();
      searchParams.append("page", (pageParam as number).toString());
      searchParams.append("limit", (params.limit || 10).toString());
      if (params.status) searchParams.append("status", params.status);
      if (params.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await api.get(
        `/services/vendor/my-listings?${searchParams.toString()}`
      );
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      if (pagination && pagination.currentPage < pagination.lastPage) {
        return pagination.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export type { ServiceListing, ServiceListingsParams, ServiceListingsResponse };
