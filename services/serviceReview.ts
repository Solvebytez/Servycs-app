import { api } from "./api";

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
  helpful: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
    uploadedImages?: {
      url: string;
    }[];
  };
  listing?: {
    id: string;
    title: string;
  };
  service?: {
    id: string;
    name: string;
  };
  vendor?: {
    id: string;
    businessName: string;
  };
}

// Create Review Request
export interface CreateReviewRequest {
  rating: number;
  comment: string;
  listingId: string;
  serviceId?: string;
  vendorId: string;
}

// Update Review Request
export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
}

// Get Reviews Response
export interface GetReviewsResponse {
  success: boolean;
  data: {
    reviews: Review[];
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
  };
}

// Create/Update Review Response
export interface ReviewResponse {
  success: boolean;
  message: string;
  data: Review;
}

// Delete Review Response
export interface DeleteReviewResponse {
  success: boolean;
  message: string;
}

export interface ToggleHelpfulResponse {
  success: boolean;
  data: {
    isHelpful: boolean;
    helpfulCount: number;
  };
  message: string;
}

export interface CheckHelpfulResponse {
  success: boolean;
  data: {
    isHelpful: boolean;
  };
}

// Service Review API functions
export const serviceReviewApi = {
  // Create a new service review
  createReview: async (
    reviewData: CreateReviewRequest
  ): Promise<ReviewResponse> => {
    const response = await api.post("/service-reviews", reviewData);
    return response.data;
  },

  // Get all reviews for a specific service listing
  getServiceReviews: async (
    listingId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ): Promise<GetReviewsResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append("page", params.page.toString());
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.rating) queryParams.append("rating", params.rating.toString());
    if (params?.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params?.sortOrder) queryParams.append("sortOrder", params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/service-reviews/listing/${listingId}${
      queryString ? `?${queryString}` : ""
    }`;

    const response = await api.get(url);
    return response.data;
  },

  // Get user's review for a specific service
  getUserServiceReview: async (listingId: string): Promise<ReviewResponse> => {
    const response = await api.get(
      `/service-reviews/listing/${listingId}/my-review`
    );
    return response.data;
  },

  // Update user's service review
  updateReview: async (
    reviewId: string,
    updateData: UpdateReviewRequest
  ): Promise<ReviewResponse> => {
    const response = await api.put(`/service-reviews/${reviewId}`, updateData);
    return response.data;
  },

  // Delete user's service review
  deleteReview: async (reviewId: string): Promise<DeleteReviewResponse> => {
    const response = await api.delete(`/service-reviews/${reviewId}`);
    return response.data;
  },

  // Toggle helpful vote for a review
  toggleHelpful: async (reviewId: string): Promise<ToggleHelpfulResponse> => {
    const response = await api.post(`/service-reviews/${reviewId}/helpful`);
    return response.data;
  },

  // Check if user has marked review as helpful
  checkHelpful: async (reviewId: string): Promise<CheckHelpfulResponse> => {
    const response = await api.get(`/service-reviews/${reviewId}/helpful`);
    return response.data;
  },
};
