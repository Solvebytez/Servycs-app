import { api } from "./api";

// Business Hours Interface
export interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

// Service Listing Interface
export interface ServiceListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  categoryId: string;
  categoryPath: string[];
  contactNumber: string;
  whatsappNumber: string;
  image?: string;
  addressId: string;
  businessHours: BusinessHours | null;
  status: "DRAFT" | "ACTIVE" | "PENDING" | "REJECTED" | "OFF_SERVICE";
  isServiceOn: boolean;
  isFeatured: boolean;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    businessName: string;
    businessEmail: string;
    businessPhone: string;
    user: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  address?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    description?: string;
    isPrimary: boolean;
  };
  services?: Service[];
  reviews?: Review[];
  _count?: {
    bookings: number;
    reviews: number;
  };
}

// Individual Service Interface
export interface Service {
  id: string;
  listingId: string;
  name: string;
  description: string;
  price?: number;
  discountPrice?: number;
  currency: string;
  duration?: number;
  businessHours?: BusinessHours;
  status: "DRAFT" | "ACTIVE" | "PENDING" | "REJECTED" | "OFF_SERVICE";
  rating: number;
  totalReviews: number;
  totalBookings: number;
  categoryIds?: string[]; // Array of category IDs
  categoryPaths?: string[][]; // Array of category paths for easy filtering
  createdAt: string;
  updatedAt: string;
}

// Review Interface
export interface Review {
  id: string;
  userId: string;
  listingId: string;
  serviceId?: string;
  vendorId: string;
  rating: number;
  comment?: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// Create Service Listing Request Interface
export interface CreateServiceListingRequest {
  title: string;
  description: string;
  categoryId?: string; // Made optional since categories are now per-service
  categoryPath?: string[]; // Made optional since categories are now per-service
  contactNumber: string;
  whatsappNumber: string;
  image?: string;
  selectedAddressId: string;
  businessHours?: BusinessHours;
  services: {
    name: string;
    description: string;
    price?: number;
    discountPrice?: number;
    duration?: string;
  }[];
}

// Flexible Update Request Interface (matches backend)
export interface FlexibleUpdateRequest {
  // Basic fields (optional)
  title?: string;
  description?: string;
  contactNumber?: string;
  whatsappNumber?: string;
  image?: string;

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

// Pagination Parameters for API calls
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
  status?: "ACTIVE" | "PENDING" | "REJECTED" | "OFF_SERVICE";
}

// Service Listing Filters
export interface ServiceListingFilters {
  status?: "ACTIVE" | "PENDING" | "REJECTED" | "OFF_SERVICE";
  categoryId?: string;
  search?: string;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

// Get Service Listings Query Parameters (for public listings)
export interface GetServiceListingsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  vendorId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  isActive?: boolean;
}

// Service API Response
export interface ServiceApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: any;
}

// Paginated Response (matches backend structure)
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextCursor?: string;
    previousCursor?: string;
  };
  meta: {
    requestTime: number;
    cacheHit: boolean;
  };
}

// Service API functions
export const serviceService = {
  // Create a new service listing
  createServiceListing: async (
    data: CreateServiceListingRequest
  ): Promise<ServiceListing> => {
    const response = await api.post<ServiceApiResponse<ServiceListing>>(
      "/services",
      data
    );
    return response.data.data;
  },

  // Get all service listings with optional filters
  getServiceListings: async (
    params?: GetServiceListingsParams
  ): Promise<PaginatedResponse<ServiceListing>> => {
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get<
      ServiceApiResponse<PaginatedResponse<ServiceListing>>
    >(`/services?${queryParams.toString()}`);
    return response.data.data;
  },

  // Get a single service listing by ID
  getServiceListingById: async (id: string): Promise<ServiceListing> => {
    const response = await api.get<ServiceApiResponse<ServiceListing>>(
      `/services/${id}`
    );
    return response.data.data;
  },

  // Get service listings by current vendor (legacy - returns all)
  getMyServiceListings: async (): Promise<ServiceListing[]> => {
    const response = await api.get<ServiceApiResponse<ServiceListing[]>>(
      "/services/vendor/my-listings"
    );
    return response.data.data;
  },

  // Get paginated service listings by current vendor
  getMyServiceListingsPaginated: async (
    page: number = 1,
    limit: number = 20,
    filters?: ServiceListingFilters
  ): Promise<PaginatedResponse<ServiceListing>> => {
    const queryParams = new URLSearchParams();

    queryParams.append("page", page.toString());
    queryParams.append("limit", limit.toString());

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get<PaginatedResponse<ServiceListing>>(
      `/services/vendor/my-listings?${queryParams.toString()}`
    );
    return response.data;
  },

  // Get infinite scroll service listings by current vendor
  getMyServiceListingsInfinite: async (
    cursor?: string,
    limit: number = 20,
    filters?: ServiceListingFilters
  ): Promise<PaginatedResponse<ServiceListing>> => {
    const queryParams = new URLSearchParams();

    queryParams.append("limit", limit.toString());

    if (cursor) {
      queryParams.append("cursor", cursor);
    }

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const response = await api.get<PaginatedResponse<ServiceListing>>(
      `/services/vendor/my-listings?${queryParams.toString()}`
    );
    return response.data;
  },

  // Update a service listing (legacy - basic update)
  updateServiceListing: async (
    id: string,
    data: Partial<CreateServiceListingRequest>
  ): Promise<ServiceListing> => {
    const response = await api.put<ServiceApiResponse<ServiceListing>>(
      `/services/${id}`,
      data
    );
    return response.data.data;
  },

  // Flexible update a service listing (new - supports partial updates)
  updateServiceListingFlexible: async (
    id: string,
    data: FlexibleUpdateRequest
  ): Promise<ServiceListing> => {
    const response = await api.put<ServiceApiResponse<ServiceListing>>(
      `/services/${id}`,
      data
    );
    return response.data.data;
  },

  // Delete a service listing (soft delete)
  deleteServiceListing: async (id: string): Promise<void> => {
    await api.delete<ServiceApiResponse<void>>(`/services/${id}`);
  },

  // Upload service image
  uploadServiceImage: async (file: any): Promise<{ imageUrl: string }> => {
    console.log("=== FRONTEND UPLOAD START ===");
    console.log("File object:", file);
    console.log("File URI:", file.uri);
    console.log("File type:", file.type);
    console.log("File name:", file.fileName);

    const formData = new FormData();
    formData.append("image", {
      uri: file.uri,
      type: file.type || "image/jpeg",
      name: file.fileName || "service-image.jpg",
    } as any);

    console.log("FormData created, sending request...");

    try {
      const response = await api.post<ServiceApiResponse<{ imageUrl: string }>>(
        "/upload/service-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000, // Increased to 60 seconds
        }
      );

      console.log("=== UPLOAD SUCCESS ===");
      console.log("Response:", response.data);
      return response.data.data;
    } catch (error) {
      console.error("=== UPLOAD ERROR ===");
      console.error("Error:", error);
      console.error("Error response:", (error as any)?.response?.data);
      throw error;
    }
  },
};

export default serviceService;
