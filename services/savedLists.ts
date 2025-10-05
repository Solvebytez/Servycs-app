import { api } from "./api";

// Types for Saved Lists
export interface SavedList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic: boolean;
  isDefault: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  serviceImages: Array<{
    id: string;
    title: string;
    image?: string;
  }>;
  items?: SavedListItem[];
}

export interface SavedListWithServiceStatus extends SavedList {
  hasService: boolean;
  serviceAddedAt?: string;
}

export interface SavedListItem {
  id: string;
  savedListId: string;
  serviceListingId: string;
  addedAt: string;
  notes?: string;
  sortOrder: number;
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

export interface SavedListsResponse {
  success: boolean;
  data: SavedList[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  message: string;
}

export interface SavedListResponse {
  success: boolean;
  data: SavedList;
  message: string;
}

export interface SavedListItemResponse {
  success: boolean;
  data: SavedListItem;
  message: string;
}

export interface ServiceListStatusResponse {
  success: boolean;
  data: {
    serviceId: string;
    isInAnyList: boolean;
    lists: Array<{
      listId: string;
      listName: string;
      isDefault: boolean;
      addedAt: string;
      notes?: string;
    }>;
  };
  message: string;
}

export interface SavedListsWithServiceStatusResponse {
  success: boolean;
  data: SavedListWithServiceStatus[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message: string;
}

export interface CreateSavedListRequest {
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  isPublic?: boolean;
}

export interface AddServiceToListRequest {
  serviceListingId: string;
  notes?: string;
}

export interface ServiceSavedStatusResponse {
  success: boolean;
  data: {
    serviceId: string;
    isSaved: boolean;
    savedInLists: {
      itemId: string;
      listId: string;
      listName: string;
      addedAt: string;
    }[];
  };
  message: string;
}

// Saved Lists Service
export const savedListsService = {
  // Get all user's saved lists
  getUserSavedLists: async (
    userId: string,
    includeItems: boolean = false,
    limit: number = 50,
    page: number = 1,
    search?: string
  ): Promise<SavedListsResponse> => {
    const params = new URLSearchParams({
      includeItems: includeItems.toString(),
      limit: limit.toString(),
      page: page.toString(),
    });

    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    const response = await api.get(
      `/users/${userId}/saved-lists?${params.toString()}`
    );
    return {
      success: response.data.success,
      data: response.data.data,
      pagination: response.data.pagination,
      message: response.data.message,
    };
  },

  // Get a specific saved list with its items
  getSavedListById: async (
    userId: string,
    listId: string,
    includeItems: boolean = false
  ): Promise<SavedListResponse> => {
    const response = await api.get(
      `/users/${userId}/saved-lists/${listId}?includeItems=${includeItems}`
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },

  // Create a new saved list
  createSavedList: async (
    userId: string,
    data: CreateSavedListRequest
  ): Promise<SavedListResponse> => {
    const response = await api.post(`/users/${userId}/saved-lists`, data);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },

  // Update a saved list
  updateSavedList: async (
    userId: string,
    listId: string,
    data: Partial<CreateSavedListRequest & { sortOrder?: number }>
  ): Promise<SavedListResponse> => {
    const response = await api.put(
      `/users/${userId}/saved-lists/${listId}`,
      data
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },

  // Delete a saved list
  deleteSavedList: async (
    userId: string,
    listId: string
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await api.delete(`/users/${userId}/saved-lists/${listId}`);
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },

  // Add a service to a saved list
  addServiceToList: async (
    userId: string,
    listId: string,
    data: AddServiceToListRequest
  ): Promise<SavedListItemResponse> => {
    const response = await api.post(
      `/users/${userId}/saved-lists/${listId}/items`,
      data
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },

  // Remove a service from a saved list
  removeServiceFromList: async (
    userId: string,
    listId: string,
    itemId: string
  ): Promise<{ success: boolean; data: any; message: string }> => {
    const response = await api.delete(
      `/users/${userId}/saved-lists/${listId}/items/${itemId}`
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },

  // Delete a saved list item (alias for removeServiceFromList)
  deleteSavedListItem: async (
    itemId: string
  ): Promise<{ success: boolean; data: any; message: string }> => {
    // For now, we'll use a generic endpoint that doesn't require userId and listId
    // This might need to be updated based on your backend API structure
    const response = await api.delete(`/saved-list-items/${itemId}`);
    return response.data as { success: boolean; data: any; message: string };
  },

  // Check which lists contain a specific service
  checkServiceListStatus: async (
    userId: string,
    serviceId: string
  ): Promise<ServiceListStatusResponse> => {
    const response = await api.get(
      `/users/${userId}/saved-lists/status/${serviceId}`
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },

  // Get user's saved lists with service status
  getUserSavedListsWithServiceStatus: async (
    userId: string,
    serviceId: string,
    limit: number = 50,
    page: number = 1
  ): Promise<SavedListsWithServiceStatusResponse> => {
    const response = await api.get(
      `/users/${userId}/saved-lists/with-service-status/${serviceId}?limit=${limit}&page=${page}`
    );
    return {
      success: response.data.success,
      data: response.data.data,
      pagination: response.data.pagination,
      message: response.data.message,
    };
  },

  // Check if a service is saved by a user (simple boolean check)
  checkServiceSavedStatus: async (
    userId: string,
    serviceId: string
  ): Promise<ServiceSavedStatusResponse> => {
    const response = await api.get(
      `/users/${userId}/services/${serviceId}/saved-status`
    );
    return {
      success: response.data.success,
      data: response.data.data,
      message: response.data.message,
    };
  },
};

export default savedListsService;
