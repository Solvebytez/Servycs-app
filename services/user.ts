import { api, tokenAuthApi } from "./api";

// User service interface
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  phone?: string;
  address?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
}

export interface BusinessAddress {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  description: string;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBusinessAddressData {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  description?: string;
}

// User Favorites interfaces
export interface UserFavorite {
  id: string;
  userId: string;
  serviceListingId: string;
  createdAt: string;
  updatedAt: string;
  serviceListing: {
    id: string;
    title: string;
    description: string;
    image?: string;
    rating: number;
    totalReviews: number;
    category: {
      id: string;
      name: string;
      slug: string;
    };
    vendor: {
      id: string;
      businessName: string;
      businessEmail: string;
      businessPhone: string;
      rating: number;
    };
    address: {
      id: string;
      name: string;
      address: string;
      city: string;
      state: string;
    };
  };
}

export interface UserFavoritesResponse {
  data: UserFavorite[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface FavoriteStatusResponse {
  data: {
    isFavorite: boolean;
    favoriteId: string | null;
    addedAt: string | null;
  };
}

// User service functions
export const userService = {
  // Get user profile
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get<UserProfile>("/users/profile");
    return response.data;
  },

  // Update user profile
  updateProfile: async (data: UpdateProfileData): Promise<UserProfile> => {
    const response = await api.put<UserProfile>("/users/profile", data);
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post("/users/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  // Delete account
  deleteAccount: async (password: string) => {
    const response = await api.delete("/users/account", {
      data: { password },
    });
    return response.data;
  },

  // Switch user role
  switchRole: async (role: string) => {
    const response = await api.post("/users/switch-role", { role });
    return response.data;
  },

  // Get all business addresses
  getBusinessAddresses: async (): Promise<BusinessAddress[]> => {
    const response = await api.get<{ data: BusinessAddress[] }>(
      "/users/business-addresses"
    );
    return response.data.data;
  },

  // Create new business address
  createBusinessAddress: async (
    data: Omit<BusinessAddress, "id" | "createdAt" | "updatedAt">
  ): Promise<BusinessAddress> => {
    const response = await api.post<{ data: BusinessAddress }>(
      "/users/business-addresses",
      data
    );
    return response.data.data;
  },

  // Update business address
  updateBusinessAddress: async (
    addressId: string,
    data: UpdateBusinessAddressData
  ): Promise<BusinessAddress> => {
    const response = await api.put<{ data: BusinessAddress }>(
      `/users/business-addresses/${addressId}`,
      data
    );
    return response.data.data;
  },

  // Delete business address
  deleteBusinessAddress: async (addressId: string) => {
    const response = await api.delete(`/users/business-addresses/${addressId}`);
    return response.data;
  },

  // User Favorites methods
  // Get user's favorite service listings
  getUserFavorites: async (
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<UserFavoritesResponse> => {
    const response = await api.get<{
      success: boolean;
      data: UserFavorite[];
      pagination: any;
    }>(`/users/${userId}/favorites`, {
      params: { page, limit },
    });
    return {
      data: response.data.data,
      pagination: response.data.pagination,
    };
  },

  // Add service to favorites
  addToFavorites: async (
    userId: string,
    serviceId: string
  ): Promise<UserFavorite> => {
    const response = await api.post<{ data: UserFavorite }>(
      `/users/${userId}/favorites/${serviceId}`
    );
    return response.data.data;
  },

  // Remove service from favorites
  removeFromFavorites: async (userId: string, serviceId: string) => {
    const response = await api.delete(
      `/users/${userId}/favorites/${serviceId}`
    );
    return response.data;
  },

  // Check if service is in favorites
  checkFavoriteStatus: async (
    userId: string,
    serviceId: string
  ): Promise<FavoriteStatusResponse> => {
    const response = await api.get<{
      success: boolean;
      data: {
        isFavorite: boolean;
        favoriteId: string | null;
        addedAt: string | null;
      };
    }>(`/users/${userId}/favorites/${serviceId}/status`);
    return {
      data: response.data.data,
    };
  },
};

// Profile picture service functions
export const uploadProfilePicture = async (file: any) => {
  const formData = new FormData();
  formData.append("image", {
    uri: file.uri,
    type: file.type || "image/jpeg",
    name: file.fileName || "profile-picture.jpg",
  } as any);

  const response = await api.post("/upload/profile-picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 30000, // 30 second timeout
  });
  return response.data;
};

export const getProfilePicture = async () => {
  const response = await api.get("/upload/profile-picture");
  return response.data;
};

export const deleteProfilePicture = async () => {
  const response = await api.delete("/upload/profile-picture");
  return response.data;
};
