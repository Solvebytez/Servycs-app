import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../services/api";

// Types
export interface AppReview {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  categories: string[];
  ratings?: Record<string, number>;
  isAnonymous: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  isPublic: boolean;
  helpful: number;
  notHelpful: number;
  deviceInfo?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AppReviewsResponse {
  reviews: AppReview[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  statistics: {
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
  };
}

export interface CreateAppReviewData {
  rating: number;
  title?: string;
  comment?: string;
  categories?: string[];
  ratings?: Record<string, number>;
  isAnonymous?: boolean;
  deviceInfo?: Record<string, any>;
}

export interface UpdateAppReviewData {
  rating?: number;
  title?: string;
  comment?: string;
  categories?: string[];
  ratings?: Record<string, number>;
  isAnonymous?: boolean;
  deviceInfo?: Record<string, any>;
}

// Query Keys
export const appReviewKeys = {
  all: ["appReviews"] as const,
  lists: () => [...appReviewKeys.all, "list"] as const,
  list: (filters: Record<string, any>) =>
    [...appReviewKeys.lists(), filters] as const,
  details: () => [...appReviewKeys.all, "detail"] as const,
  detail: (id: string) => [...appReviewKeys.details(), id] as const,
  myReview: () => [...appReviewKeys.all, "myReview"] as const,
  moderation: (filters: Record<string, any>) =>
    [...appReviewKeys.all, "moderation", filters] as const,
};

// Hooks
export const useAppReviews = (params?: {
  page?: number;
  limit?: number;
  rating?: number;
  status?: string;
  isPublic?: boolean;
  sortBy?: string;
  sortOrder?: string;
}) => {
  return useQuery<AppReviewsResponse>({
    queryKey: appReviewKeys.list(params || {}),
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.rating)
        searchParams.append("rating", params.rating.toString());
      if (params?.status) searchParams.append("status", params.status);
      if (params?.isPublic !== undefined)
        searchParams.append("isPublic", params.isPublic.toString());
      if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await api.get(`/app-reviews?${searchParams.toString()}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const usePublicAppReviews = (limit: number = 5) => {
  return useQuery<AppReviewsResponse>({
    queryKey: appReviewKeys.list({ limit, status: "APPROVED", isPublic: true }),
    queryFn: async () => {
      const response = await api.get(
        `/app-reviews?limit=${limit}&status=APPROVED&isPublic=true`
      );
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};

export const useMyAppReview = () => {
  return useQuery<AppReview>({
    queryKey: appReviewKeys.myReview(),
    queryFn: async () => {
      const response = await api.get("/app-reviews/my-review");
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useCreateAppReview = () => {
  const queryClient = useQueryClient();

  return useMutation<AppReview, Error, CreateAppReviewData>({
    mutationFn: async (data) => {
      const response = await api.post("/app-reviews", data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch app reviews
      queryClient.invalidateQueries({ queryKey: appReviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appReviewKeys.myReview() });
    },
  });
};

export const useUpdateAppReview = () => {
  const queryClient = useQueryClient();

  return useMutation<AppReview, Error, UpdateAppReviewData>({
    mutationFn: async (data) => {
      const response = await api.put("/app-reviews/my-review", data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch app reviews
      queryClient.invalidateQueries({ queryKey: appReviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appReviewKeys.myReview() });
    },
  });
};

export const useDeleteAppReview = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      await api.delete("/app-reviews/my-review");
    },
    onSuccess: () => {
      // Invalidate and refetch app reviews
      queryClient.invalidateQueries({ queryKey: appReviewKeys.lists() });
      queryClient.invalidateQueries({ queryKey: appReviewKeys.myReview() });
    },
  });
};

export const useMarkReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { helpful: number; notHelpful: number },
    Error,
    { reviewId: string; isHelpful: boolean }
  >({
    mutationFn: async ({ reviewId, isHelpful }) => {
      const response = await api.post(`/app-reviews/${reviewId}/helpful`, {
        isHelpful,
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch app reviews
      queryClient.invalidateQueries({ queryKey: appReviewKeys.lists() });
    },
  });
};

// Admin hooks
export const useAppReviewsForModeration = (params?: {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  return useQuery<{ reviews: AppReview[]; pagination: any }>({
    queryKey: appReviewKeys.moderation(params || {}),
    queryFn: async () => {
      const searchParams = new URLSearchParams();

      if (params?.page) searchParams.append("page", params.page.toString());
      if (params?.limit) searchParams.append("limit", params.limit.toString());
      if (params?.status) searchParams.append("status", params.status);
      if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
      if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

      const response = await api.get(
        `/app-reviews/admin/moderation?${searchParams.toString()}`
      );
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateReviewStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AppReview,
    Error,
    { reviewId: string; status: "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN" }
  >({
    mutationFn: async ({ reviewId, status }) => {
      const response = await api.put(`/app-reviews/admin/${reviewId}/status`, {
        status,
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate and refetch moderation data
      queryClient.invalidateQueries({ queryKey: appReviewKeys.all });
    },
  });
};
