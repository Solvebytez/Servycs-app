import { useQuery } from "@tanstack/react-query";
import { serviceService } from "@/services/service";
import { serviceReviewApi, Review } from "@/services/serviceReview";

// Helper function to calculate performance indicator
const calculatePerformance = (averageRating: number): string => {
  if (averageRating >= 4.5) return "Excellent";
  if (averageRating >= 4.0) return "Very Good";
  if (averageRating >= 3.5) return "Good";
  if (averageRating >= 3.0) return "Average";
  return "Needs Improvement";
};

// Query keys for vendor reviews
export const vendorReviewKeys = {
  all: ["vendorReviews"] as const,
  vendorReviews: (
    vendorId: string,
    params?: {
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: "asc" | "desc";
    }
  ) =>
    [
      ...vendorReviewKeys.all,
      "vendor",
      vendorId,
      params?.page || 1,
      params?.limit || 10,
      params?.sortBy || "createdAt",
      params?.sortOrder || "desc",
    ] as const,
};

// Interface for aggregated vendor review
export interface VendorReview extends Review {
  serviceListing?: {
    id: string;
    name: string;
    category: string;
  };
}

// Interface for vendor reviews response
export interface VendorReviewsResponse {
  success: boolean;
  data: {
    reviews: VendorReview[];
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
      totalCustomers: number;
      performance: string;
      ratingDistribution: Record<number, number>;
      filterCounts: Record<string, number>;
    };
  };
}

// Hook to get all reviews for vendor's services
export const useVendorReviews = (
  vendorId: string,
  params?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }
) => {
  return useQuery({
    queryKey: vendorReviewKeys.vendorReviews(vendorId, params),
    queryFn: async (): Promise<VendorReviewsResponse> => {
      // First, get all vendor's service listings
      let vendorServices;
      try {
        vendorServices = await serviceService.getMyServiceListings();
      } catch (error) {
        // Treat upstream listing fetch errors as empty state for dashboard UX
        return {
          success: true,
          data: {
            reviews: [],
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: 0,
              pages: 0,
              hasNext: false,
              hasPrev: false,
            },
            statistics: {
              averageRating: 0,
              totalReviews: 0,
              totalCustomers: 0,
              performance: "No Reviews",
              ratingDistribution: {},
              filterCounts: {
                all: 0,
                "5": 0,
                "4": 0,
                "3": 0,
                "2": 0,
                "1": 0,
              },
            },
          },
        };
      }

      if (!vendorServices || vendorServices.length === 0) {
        // Return empty response if no services
        return {
          success: true,
          data: {
            reviews: [],
            pagination: {
              page: params?.page || 1,
              limit: params?.limit || 10,
              total: 0,
              pages: 0,
              hasNext: false,
              hasPrev: false,
            },
            statistics: {
              averageRating: 0,
              totalReviews: 0,
              totalCustomers: 0,
              performance: "No Reviews",
              ratingDistribution: {},
              filterCounts: {
                all: 0,
                "5": 0,
                "4": 0,
                "3": 0,
                "2": 0,
                "1": 0,
              },
            },
          },
        };
      }

      // Get reviews for each service listing
      const reviewPromises = vendorServices.map(async (service) => {
        try {
          const reviewsResponse = await serviceReviewApi.getServiceReviews(
            service.id,
            {
              page: 1,
              limit: 100, // Get all reviews for each service
              sortBy: params?.sortBy || "createdAt",
              sortOrder: params?.sortOrder || "desc",
            }
          );

          // Transform reviews to include service listing info
          const transformedReviews: VendorReview[] =
            reviewsResponse.data.reviews.map((review) => ({
              ...review,
              serviceListing: {
                id: service.id,
                name: service.title,
                category: service.category?.name || "Service",
              },
            }));

          return transformedReviews;
        } catch (error) {
          console.error(
            `Error fetching reviews for service ${service.id}:`,
            error
          );
          return [];
        }
      });

      // Wait for all review requests to complete
      const allReviewsArrays = await Promise.all(reviewPromises);

      // Flatten all reviews into a single array
      const allReviews = allReviewsArrays.flat();

      // Sort all reviews by the specified criteria
      const sortBy = params?.sortBy || "createdAt";
      const sortOrder = params?.sortOrder || "desc";

      allReviews.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case "createdAt":
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
            break;
          case "rating":
            aValue = a.rating;
            bValue = b.rating;
            break;
          case "helpful":
            aValue = a.helpful;
            bValue = b.helpful;
            break;
          default:
            aValue = new Date(a.createdAt).getTime();
            bValue = new Date(b.createdAt).getTime();
        }

        if (sortOrder === "asc") {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });

      // Apply pagination
      const page = params?.page || 1;
      const limit = params?.limit || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReviews = allReviews.slice(startIndex, endIndex);

      // Calculate statistics
      const totalReviews = allReviews.length;
      const averageRating =
        totalReviews > 0
          ? Math.round(
              (allReviews.reduce((sum, review) => sum + review.rating, 0) /
                totalReviews) *
                10
            ) / 10
          : 0;

      // Calculate total customers (unique users who reviewed)
      const uniqueCustomers = new Set(allReviews.map((review) => review.userId))
        .size;
      const totalCustomers = uniqueCustomers;

      // Calculate performance indicator
      const performance = calculatePerformance(averageRating);

      // Calculate rating distribution
      const ratingDistribution: Record<number, number> = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = allReviews.filter(
          (review) => review.rating === i
        ).length;
      }

      // Calculate filter counts
      const filterCounts: Record<string, number> = {
        all: totalReviews,
        "5": ratingDistribution[5] || 0,
        "4": ratingDistribution[4] || 0,
        "3": ratingDistribution[3] || 0,
        "2": ratingDistribution[2] || 0,
        "1": ratingDistribution[1] || 0,
      };

      // Calculate pagination info
      const totalPages = Math.ceil(totalReviews / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        success: true,
        data: {
          reviews: paginatedReviews,
          pagination: {
            page,
            limit,
            total: totalReviews,
            pages: totalPages,
            hasNext,
            hasPrev,
          },
          statistics: {
            averageRating,
            totalReviews,
            totalCustomers,
            performance,
            ratingDistribution,
            filterCounts,
          },
        },
      };
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get latest reviews for vendor dashboard (limited to 3)
export const useVendorLatestReviews = (vendorId: string) => {
  return useVendorReviews(vendorId, {
    page: 1,
    limit: 3,
    sortBy: "createdAt",
    sortOrder: "desc",
  });
};

// Hook to get vendor reviews with filtering for the reviews screen
export const useVendorReviewsWithFilter = (
  vendorId: string,
  filter: string = "all",
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: [
      ...vendorReviewKeys.vendorReviews(vendorId),
      "filtered",
      filter,
      page,
      limit,
    ],
    queryFn: async (): Promise<VendorReviewsResponse> => {
      // First, get all vendor's service listings
      let vendorServices;
      try {
        vendorServices = await serviceService.getMyServiceListings();
      } catch (error) {
        // Treat upstream listing fetch errors as empty state for dashboard UX
        return {
          success: true,
          data: {
            reviews: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
              hasNext: false,
              hasPrev: false,
            },
            statistics: {
              averageRating: 0,
              totalReviews: 0,
              totalCustomers: 0,
              performance: "No Reviews",
              ratingDistribution: {},
              filterCounts: {
                all: 0,
                "5": 0,
                "4": 0,
                "3": 0,
                "2": 0,
                "1": 0,
              },
            },
          },
        };
      }

      if (!vendorServices || vendorServices.length === 0) {
        // Return empty response if no services
        return {
          success: true,
          data: {
            reviews: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
              hasNext: false,
              hasPrev: false,
            },
            statistics: {
              averageRating: 0,
              totalReviews: 0,
              totalCustomers: 0,
              performance: "No Reviews",
              ratingDistribution: {},
              filterCounts: {
                all: 0,
                "5": 0,
                "4": 0,
                "3": 0,
                "2": 0,
                "1": 0,
              },
            },
          },
        };
      }

      // Get reviews for each service listing
      const reviewPromises = vendorServices.map(async (service) => {
        try {
          const reviewsResponse = await serviceReviewApi.getServiceReviews(
            service.id,
            {
              page: 1,
              limit: 100, // Get all reviews for each service
              sortBy: "createdAt",
              sortOrder: "desc",
            }
          );

          // Transform reviews to include service listing info
          const transformedReviews: VendorReview[] =
            reviewsResponse.data.reviews.map((review) => ({
              ...review,
              serviceListing: {
                id: service.id,
                name: service.title,
                category: service.category?.name || "Service",
              },
            }));

          return transformedReviews;
        } catch (error) {
          console.error(
            `Error fetching reviews for service ${service.id}:`,
            error
          );
          return [];
        }
      });

      // Wait for all review requests to complete
      const allReviewsArrays = await Promise.all(reviewPromises);

      // Flatten all reviews into a single array
      let allReviews = allReviewsArrays.flat();

      // Apply filter if not "all"
      if (filter !== "all") {
        const ratingFilter = parseInt(filter);
        if (!isNaN(ratingFilter)) {
          allReviews = allReviews.filter(
            (review) => review.rating === ratingFilter
          );
        }
      }

      // Sort all reviews by creation date (newest first)
      allReviews.sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime();
        const bTime = new Date(b.createdAt).getTime();
        return bTime - aTime;
      });

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedReviews = allReviews.slice(startIndex, endIndex);

      // Calculate statistics (use all reviews, not filtered ones for overall stats)
      const allReviewsForStats = allReviewsArrays.flat();
      const totalReviews = allReviewsForStats.length;
      const averageRating =
        totalReviews > 0
          ? Math.round(
              (allReviewsForStats.reduce(
                (sum, review) => sum + review.rating,
                0
              ) /
                totalReviews) *
                10
            ) / 10
          : 0;

      // Calculate total customers (unique users who reviewed)
      const uniqueCustomers = new Set(
        allReviewsForStats.map((review) => review.userId)
      ).size;
      const totalCustomers = uniqueCustomers;

      // Calculate performance indicator
      const performance = calculatePerformance(averageRating);

      // Calculate rating distribution
      const ratingDistribution: Record<number, number> = {};
      for (let i = 1; i <= 5; i++) {
        ratingDistribution[i] = allReviewsForStats.filter(
          (review) => review.rating === i
        ).length;
      }

      // Calculate filter counts
      const filterCounts: Record<string, number> = {
        all: totalReviews,
        "5": ratingDistribution[5] || 0,
        "4": ratingDistribution[4] || 0,
        "3": ratingDistribution[3] || 0,
        "2": ratingDistribution[2] || 0,
        "1": ratingDistribution[1] || 0,
      };

      // Calculate pagination info for filtered results
      const totalFilteredReviews = allReviews.length;
      const totalPages = Math.ceil(totalFilteredReviews / limit);
      const hasNext = page < totalPages;
      const hasPrev = page > 1;

      return {
        success: true,
        data: {
          reviews: paginatedReviews,
          pagination: {
            page,
            limit,
            total: totalFilteredReviews,
            pages: totalPages,
            hasNext,
            hasPrev,
          },
          statistics: {
            averageRating,
            totalReviews,
            totalCustomers,
            performance,
            ratingDistribution,
            filterCounts,
          },
        },
      };
    },
    enabled: !!vendorId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
