import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { ResponsiveText } from "@/components";
import { COLORS } from "@/constants";
import {
  useServiceReviews,
  useToggleReviewHelpful,
  useCheckReviewHelpful,
} from "@/hooks/useServiceReviews";
import { Review } from "@/services/serviceReview";
import { ReviewItem } from "@/components/vendor/ReviewItem";
import { useUser } from "@/hooks/useUser";

interface ReviewsListProps {
  listingId: string;
  onReviewSubmitted?: () => void;
  onReviewPress?: (review: any) => void;
}

const ReviewsList: React.FC<ReviewsListProps> = ({
  listingId,
  onReviewPress,
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const pageSize = 10;
  const { data: user } = useUser();
  const toggleHelpfulMutation = useToggleReviewHelpful();

  // Component to handle helpful validation for each review
  const ReviewItemWithHelpful = ({
    item,
    index,
  }: {
    item: Review;
    index: number;
  }) => {
    const { data: helpfulData } = useCheckReviewHelpful(item.id);
    const isHelpful = helpfulData?.data?.isHelpful || false;

    const reviewData = {
      id: item.id,
      reviewerName: item.user?.name || "Anonymous",
      avatar:
        item.user?.uploadedImages?.[0]?.url || "https://via.placeholder.com/48",
      timestamp: new Date(item.createdAt).toLocaleDateString(),
      rating: item.rating,
      serviceType: "",
      message: item.comment || "No comment provided",
      helpfulCount: item.helpful || 0,
    };

    return (
      <ReviewItem
        key={`${item.id}-${index}`}
        review={reviewData}
        showDivider
        onPress={
          onReviewPress || ((review) => console.log("Review pressed:", review))
        }
        onHelpful={handleHelpfulToggle}
        isHelpful={isHelpful}
        isTogglingHelpful={toggleHelpfulMutation.isPending}
      />
    );
  };

  // Get reviews for current page
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    error: reviewsError,
  } = useServiceReviews(listingId, {
    page: currentPage,
    limit: pageSize,
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Handle new reviews data
  useEffect(() => {
    if (reviewsData?.data?.reviews) {
      const newReviews = reviewsData.data.reviews;
      console.log(`Page ${currentPage}: Received ${newReviews.length} reviews`);

      if (currentPage === 1) {
        // First page - replace all reviews
        setAllReviews(newReviews);
        setIsInitialLoad(false);
      } else {
        // Subsequent pages - append to existing reviews (prevent duplicates)
        setAllReviews((prev) => {
          const existingIds = new Set(prev.map((review) => review.id));
          const uniqueNewReviews = newReviews.filter(
            (review) => !existingIds.has(review.id)
          );
          console.log(
            `Appending ${uniqueNewReviews.length} unique reviews to existing ${prev.length}`
          );
          return [...prev, ...uniqueNewReviews];
        });
      }

      // Check if there's more data
      setHasMoreData(newReviews.length === pageSize);
      setIsLoadingMore(false);
    }
  }, [reviewsData, currentPage, pageSize]);

  // Load more reviews
  const loadMoreReviews = useCallback(() => {
    if (!isLoadingMore && hasMoreData && !isInitialLoad) {
      console.log("Loading more reviews, current page:", currentPage);
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  }, [isLoadingMore, hasMoreData, isInitialLoad, currentPage]);

  // Load more button handler
  const handleLoadMore = useCallback(() => {
    loadMoreReviews();
  }, [loadMoreReviews]);

  // Handle helpful vote toggle
  const handleHelpfulToggle = useCallback(
    (reviewId: string) => {
      if (user) {
        toggleHelpfulMutation.mutate(reviewId);
      }
    },
    [user, toggleHelpfulMutation]
  );

  if (isLoadingReviews && isInitialLoad) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary[500]} />
        <ResponsiveText variant="body2" style={styles.loadingText}>
          Loading reviews...
        </ResponsiveText>
      </View>
    );
  }

  if (reviewsError) {
    return (
      <View style={styles.errorContainer}>
        <ResponsiveText variant="body1" style={styles.errorText}>
          Failed to load reviews. Please try again.
        </ResponsiveText>
      </View>
    );
  }

  if (!allReviews.length) {
    return (
      <View style={styles.emptyContainer}>
        <ResponsiveText variant="body1" style={styles.emptyText}>
          No reviews yet. Be the first to review this service!
        </ResponsiveText>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      {allReviews.map((item, index) => (
        <ReviewItemWithHelpful
          key={`${item.id}-${index}`}
          item={item}
          index={index}
        />
      ))}

      {/* Load More Button */}
      {hasMoreData && !isLoadingMore && allReviews.length > 0 && (
        <TouchableOpacity
          style={styles.loadMoreButton}
          onPress={handleLoadMore}
        >
          <ResponsiveText variant="body2" style={styles.loadMoreButtonText}>
            Load More Reviews
          </ResponsiveText>
        </TouchableOpacity>
      )}

      {/* Loading more indicator */}
      {isLoadingMore && (
        <View style={styles.loadingMoreContainer}>
          <ActivityIndicator size="small" color={COLORS.primary[500]} />
          <ResponsiveText variant="body2" style={styles.loadingMoreText}>
            Loading more reviews...
          </ResponsiveText>
        </View>
      )}

      {/* End of data indicator */}
      {!hasMoreData && allReviews.length > 0 && (
        <View style={styles.endOfDataContainer}>
          <ResponsiveText variant="body2" style={styles.endOfDataText}>
            You've reached the end of reviews
          </ResponsiveText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    color: COLORS.neutral[600],
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    color: COLORS.neutral[600],
    textAlign: "center",
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    color: COLORS.error[500],
    textAlign: "center",
  },
  loadingMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    color: COLORS.neutral[600],
  },
  endOfDataContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  endOfDataText: {
    color: COLORS.neutral[500],
    textAlign: "center",
    fontStyle: "italic",
  },
  loadMoreButton: {
    backgroundColor: COLORS.primary[100],
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 16,
    alignSelf: "center",
  },
  loadMoreButtonText: {
    color: COLORS.primary[600],
    fontWeight: "600",
  },
});

export default ReviewsList;
