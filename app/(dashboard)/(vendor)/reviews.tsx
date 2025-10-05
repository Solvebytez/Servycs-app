import React, { useState, useEffect } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../../constants";
import {
  ResponsiveText,
  ResponsiveCard,
  GlobalStatusBar,
  AppHeader,
  ReviewDetailsModal,
} from "../../../components";
import ReviewItem from "../../../components/vendor/ReviewItem";
import { useVendorReviewsWithFilter } from "../../../hooks/useVendorReviews";
import { useUser } from "../../../hooks/useUser";
import ReviewsScreenSkeleton from "../../../components/vendor/ReviewsScreenSkeleton";

interface Review {
  id: string;
  reviewerName: string;
  avatar: string;
  timestamp: string;
  rating: number;
  serviceType: string;
  serviceListing?: {
    id: string;
    name: string;
    category: string;
  };
  message: string;
  helpfulCount: number;
}

export default function ReviewsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [allReviews, setAllReviews] = useState<Review[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);

  // Get user data
  const { data: user } = useUser();

  // Fetch reviews with filtering
  const {
    data: reviewsData,
    isLoading,
    error,
  } = useVendorReviewsWithFilter(
    user?.id || "",
    selectedFilter,
    currentPage,
    10
  );

  // Transform API data to match component interface
  const overallRating = reviewsData?.data?.statistics
    ? {
        score: Math.round(reviewsData.data.statistics.averageRating * 10) / 10, // Round to 1 decimal place
        stars: Math.round(reviewsData.data.statistics.averageRating * 10) / 10, // Round to 1 decimal place
        totalReviews: reviewsData.data.statistics.totalReviews,
        customers: reviewsData.data.statistics.totalCustomers,
        performance: reviewsData.data.statistics.performance,
      }
    : {
        score: 0,
        stars: 0,
        totalReviews: 0,
        customers: 0,
        performance: "No Reviews",
      };

  // Transform rating breakdown from API data
  const ratingBreakdown = reviewsData?.data?.statistics?.ratingDistribution
    ? Object.entries(reviewsData.data.statistics.ratingDistribution)
        .map(([stars, count]) => ({
          stars: parseInt(stars),
          count: count,
          percentage:
            reviewsData.data.statistics.totalReviews > 0
              ? Math.round(
                  (count / reviewsData.data.statistics.totalReviews) * 100 * 10
                ) / 10 // Round to 1 decimal place
              : 0,
        }))
        .sort((a, b) => b.stars - a.stars)
    : [];

  // Use accumulated reviews for display
  const reviews = allReviews;

  // Transform filter options from API data
  const filterOptions = reviewsData?.data?.statistics?.filterCounts
    ? [
        {
          key: "all",
          label: "All Reviews",
          count: reviewsData.data.statistics.filterCounts.all,
        },
        {
          key: "5",
          label: "5 Star",
          count: reviewsData.data.statistics.filterCounts["5"],
        },
        {
          key: "4",
          label: "4 Star",
          count: reviewsData.data.statistics.filterCounts["4"],
        },
        {
          key: "3",
          label: "3 Star",
          count: reviewsData.data.statistics.filterCounts["3"],
        },
        {
          key: "2",
          label: "2 Star",
          count: reviewsData.data.statistics.filterCounts["2"],
        },
        {
          key: "1",
          label: "1 Star",
          count: reviewsData.data.statistics.filterCounts["1"],
        },
      ].filter((option) => option.count > 0)
    : [];

  // Handle service press - navigate to service details
  const handleServicePress = (serviceId: string) => {
    router.push(`/(dashboard)/service-details?id=${serviceId}`);
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
    setAllReviews([]); // Clear existing reviews when filter changes
  };

  // Handle infinite loading
  useEffect(() => {
    if (reviewsData?.data?.reviews) {
      const newReviews = reviewsData.data.reviews.map((review) => ({
        id: review.id,
        reviewerName: review.user?.name || "Anonymous",
        avatar:
          review.user?.uploadedImages?.[0]?.url ||
          "https://via.placeholder.com/48",
        timestamp: new Date(review.createdAt).toLocaleDateString(),
        rating: review.rating,
        serviceType: review.service?.name || "Service",
        serviceListing: review.serviceListing
          ? {
              id: review.serviceListing.id,
              name: review.serviceListing.name,
              category: review.serviceListing.category,
            }
          : undefined,
        message: review.comment || "No comment provided",
        helpfulCount: review.helpful || 0,
      }));

      if (currentPage === 1) {
        // First page - replace all reviews
        setAllReviews(newReviews);
        setIsInitialLoad(false); // Mark initial load as complete
      } else {
        // Subsequent pages - append to existing reviews (prevent duplicates)
        setAllReviews((prev) => {
          const existingIds = new Set(prev.map((review) => review.id));
          const uniqueNewReviews = newReviews.filter(
            (review) => !existingIds.has(review.id)
          );
          return [...prev, ...uniqueNewReviews];
        });
      }
      setIsLoadingMore(false);
      setShowLoadingIndicator(false);
    }
  }, [reviewsData, currentPage]);

  // Load more reviews
  const loadMoreReviews = () => {
    if (!isLoadingMore && reviewsData?.data?.pagination?.hasNext) {
      setIsLoadingMore(true);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const renderStars = (rating: number, size: number = FONT_SIZE.body1) => {
    return Array.from({ length: 5 }, (_, index) => {
      const starIndex = index + 1;
      let iconName = "star-outline";

      if (starIndex <= Math.floor(rating)) {
        // Fully filled star
        iconName = "star";
      } else if (starIndex === Math.ceil(rating) && rating % 1 !== 0) {
        // Half-filled star for decimal ratings
        iconName = "star-half";
      }

      return (
        <Ionicons
          key={index}
          name={iconName as any}
          size={size}
          color="#FF8C00"
          style={{ marginRight: 2 }}
        />
      );
    });
  };

  const renderRatingBar = (percentage: number) => {
    return (
      <View style={styles.ratingBarContainer}>
        <View style={styles.ratingBarBackground}>
          <View style={[styles.ratingBarFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    );
  };

  // Show loading state only on initial load
  if (isLoading && isInitialLoad) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <ReviewsScreenSkeleton />
        </SafeAreaView>
      </>
    );
  }

  // Show error state
  if (error) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <View style={styles.container}>
            <AppHeader
              onBackPress={() => router.back()}
              title="Rating & Reviews"
            />
            <View style={styles.errorContainer}>
              <Ionicons
                name="alert-circle-outline"
                size={48}
                color={COLORS.error[500]}
              />
              <ResponsiveText
                variant="h6"
                color={COLORS.error[600]}
                style={styles.errorTitle}
              >
                Failed to Load Reviews
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.errorDescription}
              >
                Please check your connection and try again.
              </ResponsiveText>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <GlobalStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary[500]}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Header */}
          <AppHeader
            onBackPress={() => router.back()}
            title="Rating & Reviews"
            rightComponent={
              <ResponsiveText
                variant="body2"
                color={COLORS.white}
                style={styles.reviewCount}
              >
                {overallRating.totalReviews} reviews
              </ResponsiveText>
            }
          />

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;
              const isCloseToBottom =
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 100;

              if (
                isCloseToBottom &&
                !isLoadingMore &&
                reviewsData?.data?.pagination?.hasNext
              ) {
                setShowLoadingIndicator(true);
                loadMoreReviews();
              } else if (!isCloseToBottom) {
                setShowLoadingIndicator(false);
              }
            }}
            scrollEventThrottle={16}
          >
            {/* Overall Rating Card */}
            <View style={styles.ratingCardContainer}>
              <View style={styles.ratingCardGradient}>
                <View style={styles.ratingHeader}>
                  <ResponsiveText
                    variant="h6"
                    weight="bold"
                    color={COLORS.text.primary}
                  >
                    Overall Rating
                  </ResponsiveText>
                  <View style={styles.performanceIndicator}>
                    <Ionicons
                      name="trending-up"
                      size={16}
                      color={COLORS.success[500]}
                    />
                    <ResponsiveText
                      variant="caption1"
                      color={COLORS.success[500]}
                      weight="medium"
                    >
                      {overallRating.performance}
                    </ResponsiveText>
                  </View>
                </View>

                <View style={styles.ratingScore}>
                  <ResponsiveText
                    variant="h1"
                    weight="bold"
                    color={COLORS.text.primary}
                  >
                    {overallRating.score}
                  </ResponsiveText>
                  <View style={styles.starsContainer}>
                    {renderStars(overallRating.stars, 28)}
                  </View>
                  <View style={styles.customerCount}>
                    <Ionicons
                      name="people"
                      size={18}
                      color={COLORS.text.secondary}
                    />
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                      style={{ marginLeft: MARGIN.xs }}
                    >
                      {overallRating.customers} customer
                    </ResponsiveText>
                  </View>
                </View>
              </View>
            </View>

            {/* Rating Breakdown Card */}
            <ResponsiveCard variant="elevated" style={styles.breakdownCard}>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.breakdownTitle}
              >
                Rating Breakdown
              </ResponsiveText>

              {ratingBreakdown.map((item) => (
                <View key={item.stars} style={styles.breakdownRow}>
                  <View style={styles.starLabel}>
                    <ResponsiveText
                      variant="caption1"
                      color={COLORS.text.primary}
                      style={styles.starText}
                    >
                      {item.stars}
                    </ResponsiveText>
                    <Ionicons name="star" size={14} color="#FF8C00" />
                  </View>
                  {renderRatingBar(item.percentage)}
                  <View style={styles.breakdownStats}>
                    <ResponsiveText
                      variant="caption2"
                      weight="bold"
                      color={COLORS.text.primary}
                      style={{ fontSize: 15 }}
                    >
                      {item.count}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="caption2"
                      weight="medium"
                      color={COLORS.text.secondary}
                      style={{ fontSize: 15 }}
                    >
                      {item.percentage}%
                    </ResponsiveText>
                  </View>
                </View>
              ))}
            </ResponsiveCard>

            {/* Filter Buttons */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.filterContainer}
            >
              {filterOptions.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={[
                    styles.filterButton,
                    selectedFilter === filter.key && styles.filterButtonActive,
                  ]}
                  onPress={() => handleFilterChange(filter.key)}
                >
                  <ResponsiveText
                    variant="caption1"
                    weight="medium"
                    color={
                      selectedFilter === filter.key
                        ? COLORS.primary[600]
                        : COLORS.text.secondary
                    }
                  >
                    {filter.label}
                  </ResponsiveText>
                  <View
                    style={[
                      styles.filterCount,
                      selectedFilter === filter.key
                        ? styles.filterCountActive
                        : styles.filterCountInactive,
                    ]}
                  >
                    <ResponsiveText
                      variant="caption3"
                      weight="medium"
                      color={
                        selectedFilter === filter.key
                          ? COLORS.white
                          : COLORS.text.secondary
                      }
                    >
                      {filter.count}
                    </ResponsiveText>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Reviews List */}
            <View style={styles.reviewsList}>
              {/* Filter Loading Indicator */}
              {isLoading && !isInitialLoad && reviews.length === 0 && (
                <View style={styles.filterLoadingContainer}>
                  <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                    Loading{" "}
                    {selectedFilter === "all"
                      ? "all"
                      : `${selectedFilter} star`}{" "}
                    reviews...
                  </ResponsiveText>
                </View>
              )}

              {reviews.map((review, index) => (
                <ReviewItem
                  key={review.id}
                  review={review}
                  onPress={(review) => {
                    setSelectedReview(review);
                    setIsModalVisible(true);
                  }}
                  onHelpful={(review) => {
                    // Handle helpful action if needed
                    console.log("Helpful pressed for review:", review.id);
                  }}
                  onServicePress={handleServicePress}
                  showDivider={index < reviews.length - 1}
                />
              ))}

              {/* Loading More Indicator */}
              {(isLoadingMore || showLoadingIndicator) && (
                <View style={styles.loadingMoreContainer}>
                  <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                    Loading more reviews...
                  </ResponsiveText>
                </View>
              )}

              {/* End of Data Indicator */}
              {!reviewsData?.data?.pagination?.hasNext &&
                reviews.length > 0 && (
                  <View style={styles.endOfDataContainer}>
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                    >
                      You've reached the end of reviews
                    </ResponsiveText>
                  </View>
                )}
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>

        {/* Review Detail Modal */}
        <ReviewDetailsModal
          visible={isModalVisible}
          review={selectedReview}
          onClose={() => setIsModalVisible(false)}
          onServicePress={handleServicePress}
        />
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  reviewCount: {
    marginTop: MARGIN.xs,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
  },
  ratingCardContainer: {
    marginTop: MARGIN.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    elevation: 4,
    shadowColor: COLORS.primary[200],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  ratingCardGradient: {
    padding: PADDING.lg,
    backgroundColor: COLORS.white,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  performanceIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success[50],
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  ratingScore: {
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginVertical: MARGIN.sm,
  },
  customerCount: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: MARGIN.xs,
  },
  breakdownCard: {
    marginTop: MARGIN.md,
    padding: PADDING.md,
  },
  breakdownTitle: {
    marginBottom: MARGIN.md,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  starLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 40,
  },
  starText: {
    marginRight: MARGIN.xs,
    textAlign: "left",
  },
  ratingBarContainer: {
    flex: 1,
    marginRight: MARGIN.sm,
  },
  ratingBarBackground: {
    height: 6,
    backgroundColor: COLORS.background.light,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  ratingBarFill: {
    height: "100%",
    backgroundColor: "#FF8C00",
    borderRadius: BORDER_RADIUS.sm,
  },
  breakdownStats: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: 80,
    minWidth: 80,
  },
  singleLineStats: {
    textAlign: "right",
    flexShrink: 0,
  },
  filterContainer: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.md,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    marginRight: MARGIN.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
  },
  filterCount: {
    marginLeft: MARGIN.sm,
    paddingHorizontal: PADDING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 20,
    alignItems: "center",
  },
  filterCountActive: {
    backgroundColor: COLORS.primary[500],
  },
  filterCountInactive: {
    backgroundColor: COLORS.background.light,
  },
  reviewsList: {
    marginTop: MARGIN.md,
    paddingHorizontal: PADDING.screen,
  },
  bottomSpacing: {
    height: 100,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.xl,
  },
  errorTitle: {
    textAlign: "center",
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
    fontWeight: "600",
  },
  errorDescription: {
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  loadingMoreContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: MARGIN.lg,
  },
  endOfDataContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: MARGIN.lg,
  },
  filterLoadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: MARGIN.xl,
  },
});
