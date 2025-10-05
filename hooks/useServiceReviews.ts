import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  serviceReviewApi,
  CreateReviewRequest,
  UpdateReviewRequest,
  GetReviewsResponse,
  ReviewResponse,
  DeleteReviewResponse,
  ToggleHelpfulResponse,
  CheckHelpfulResponse,
} from "@/services/serviceReview";

// Query keys
export const serviceReviewKeys = {
  all: ["serviceReviews"] as const,
  serviceReviews: (
    listingId: string,
    params?: {
      page?: number;
      limit?: number;
      rating?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ) =>
    [
      ...serviceReviewKeys.all,
      "listing",
      listingId,
      params?.page || 1,
      params?.limit || 10,
      params?.sortBy || "createdAt",
      params?.sortOrder || "desc",
    ] as const,
  userReview: (listingId: string) =>
    [...serviceReviewKeys.all, "user", listingId] as const,
  reviewHelpful: (reviewId: string) =>
    [...serviceReviewKeys.all, "reviewHelpful", reviewId] as const,
};

// Hook to get all reviews for a service listing
export const useServiceReviews = (
  listingId: string,
  params?: {
    page?: number;
    limit?: number;
    rating?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) => {
  return useQuery({
    queryKey: serviceReviewKeys.serviceReviews(listingId, params),
    queryFn: () => serviceReviewApi.getServiceReviews(listingId, params),
    enabled: !!listingId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to get user's review for a specific service
export const useUserServiceReview = (listingId: string) => {
  return useQuery({
    queryKey: serviceReviewKeys.userReview(listingId),
    queryFn: () => serviceReviewApi.getUserServiceReview(listingId),
    enabled: !!listingId,
    staleTime: 0, // always stale - triggers refetch
    gcTime: 5 * 60 * 1000, // keep in memory for 5 mins
    refetchOnMount: "always", // fetch fresh data every time
    refetchOnWindowFocus: true, // refresh when switching tabs
  });
};

// Hook to create a new service review
export const useCreateServiceReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewData: CreateReviewRequest) =>
      serviceReviewApi.createReview(reviewData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch service reviews
      queryClient.invalidateQueries({
        queryKey: serviceReviewKeys.serviceReviews(variables.listingId),
      });

      // Invalidate user's review
      queryClient.invalidateQueries({
        queryKey: serviceReviewKeys.userReview(variables.listingId),
      });

      // Update the user's review cache
      queryClient.setQueryData(
        serviceReviewKeys.userReview(variables.listingId),
        data
      );
    },
  });
};

// Hook to update a service review
export const useUpdateServiceReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      updateData,
    }: {
      reviewId: string;
      updateData: UpdateReviewRequest;
    }) => serviceReviewApi.updateReview(reviewId, updateData),
    onSuccess: (data, variables) => {
      // We need to get the listingId from the review data
      const listingId = data.data.listingId;

      // Invalidate and refetch service reviews
      queryClient.invalidateQueries({
        queryKey: serviceReviewKeys.serviceReviews(listingId),
      });

      // Update the user's review cache
      queryClient.setQueryData(serviceReviewKeys.userReview(listingId), data);
    },
  });
};

// Hook to delete a service review
export const useDeleteServiceReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => serviceReviewApi.deleteReview(reviewId),
    onSuccess: (data, reviewId) => {
      // We need to find which listing this review belonged to
      // Since we don't have the listingId in the response, we'll invalidate all review queries
      queryClient.invalidateQueries({
        queryKey: serviceReviewKeys.all,
      });
    },
  });
};

// Hook for toggling helpful vote on a review
export const useToggleReviewHelpful = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => serviceReviewApi.toggleHelpful(reviewId),
    onSuccess: (data, reviewId) => {
      // Invalidate all review queries to refresh the helpful counts
      queryClient.invalidateQueries({
        queryKey: serviceReviewKeys.all,
      });
      // Also invalidate the specific helpful check for this review
      queryClient.invalidateQueries({
        queryKey: serviceReviewKeys.reviewHelpful(reviewId),
      });
    },
  });
};

// Hook for checking if user has marked a review as helpful
export const useCheckReviewHelpful = (reviewId: string) => {
  return useQuery({
    queryKey: serviceReviewKeys.reviewHelpful(reviewId),
    queryFn: () => serviceReviewApi.checkHelpful(reviewId),
    enabled: !!reviewId,
    staleTime: 0, // always fresh
    gcTime: 5 * 60 * 1000, // keep in memory for 5 mins
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
};
