import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

const ReviewsScreenSkeleton: React.FC = () => {
  const SkeletonCard = () => (
    <View style={styles.skeletonCard}>
      {/* Header with avatar and name */}
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonHeaderText}>
          <View style={styles.skeletonName} />
          <View style={styles.skeletonTimestamp} />
        </View>
      </View>

      {/* Rating and service type */}
      <View style={styles.skeletonRatingContainer}>
        <View style={styles.skeletonStars} />
        <View style={styles.skeletonServiceType} />
      </View>

      {/* Review message */}
      <View style={styles.skeletonMessageContainer}>
        <View style={styles.skeletonMessageLine} />
        <View style={styles.skeletonMessageLine} />
        <View
          style={[styles.skeletonMessageLine, styles.skeletonMessageLineShort]}
        />
      </View>

      {/* Helpful section */}
      <View style={styles.skeletonHelpfulContainer}>
        <View style={styles.skeletonHelpfulButton} />
      </View>
    </View>
  );

  const RatingBreakdownSkeleton = () => (
    <View style={styles.breakdownSkeleton}>
      <View style={styles.breakdownTitle} />
      {[5, 4, 3, 2, 1].map((rating) => (
        <View key={rating} style={styles.breakdownRow}>
          <View style={styles.breakdownStars} />
          <View style={styles.breakdownBar} />
          <View style={styles.breakdownCount} />
        </View>
      ))}
    </View>
  );

  const OverallRatingSkeleton = () => (
    <View style={styles.overallRatingSkeleton}>
      <View style={styles.ratingHeader}>
        <View style={styles.ratingTitle} />
        <View style={styles.performanceBadge} />
      </View>
      <View style={styles.ratingScore}>
        <View style={styles.scoreNumber} />
        <View style={styles.scoreStars} />
        <View style={styles.customerCount} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Overall Rating Skeleton */}
      <OverallRatingSkeleton />

      {/* Rating Breakdown Skeleton */}
      <RatingBreakdownSkeleton />

      {/* Filter Options Skeleton */}
      <View style={styles.filterSkeleton}>
        {["All Reviews", "5 Star", "4 Star", "3 Star"].map((filter, index) => (
          <View key={index} style={styles.filterOption} />
        ))}
      </View>

      {/* Reviews List Skeleton */}
      <View style={styles.reviewsList}>
        {Array.from({ length: 5 }, (_, index) => (
          <View key={index} style={styles.skeletonWrapper}>
            <SkeletonCard />
            {index < 4 && <View style={styles.skeletonDivider} />}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },

  // Overall Rating Skeleton
  overallRatingSkeleton: {
    backgroundColor: COLORS.white,
    marginHorizontal: PADDING.screen,
    marginBottom: MARGIN.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  ratingTitle: {
    height: 20,
    width: 120,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
  },
  performanceBadge: {
    height: 16,
    width: 80,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 8,
  },
  ratingScore: {
    alignItems: "center",
  },
  scoreNumber: {
    height: 48,
    width: 80,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginBottom: MARGIN.sm,
  },
  scoreStars: {
    height: 28,
    width: 140,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginBottom: MARGIN.sm,
  },
  customerCount: {
    height: 16,
    width: 100,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
  },

  // Rating Breakdown Skeleton
  breakdownSkeleton: {
    backgroundColor: COLORS.white,
    marginHorizontal: PADDING.screen,
    marginBottom: MARGIN.md,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownTitle: {
    height: 20,
    width: 140,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginBottom: MARGIN.md,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  breakdownStars: {
    height: 16,
    width: 60,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginRight: MARGIN.sm,
  },
  breakdownBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginRight: MARGIN.sm,
  },
  breakdownCount: {
    height: 16,
    width: 30,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
  },

  // Filter Options Skeleton
  filterSkeleton: {
    flexDirection: "row",
    paddingHorizontal: PADDING.screen,
    marginBottom: MARGIN.md,
    gap: MARGIN.sm,
  },
  filterOption: {
    height: 32,
    width: 80,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 16,
  },

  // Reviews List Skeleton
  reviewsList: {
    paddingHorizontal: PADDING.screen,
  },
  skeletonWrapper: {
    marginBottom: MARGIN.sm,
  },
  skeletonCard: {
    backgroundColor: COLORS.white,
    padding: PADDING.md,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  skeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutral[200],
    marginRight: MARGIN.sm,
  },
  skeletonHeaderText: {
    flex: 1,
  },
  skeletonName: {
    height: 16,
    width: "60%",
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonTimestamp: {
    height: 12,
    width: "40%",
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
  },
  skeletonRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  skeletonStars: {
    flexDirection: "row",
    marginRight: MARGIN.sm,
  },
  skeletonServiceType: {
    height: 14,
    width: "50%",
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    flex: 1,
  },
  skeletonMessageContainer: {
    marginBottom: MARGIN.sm,
  },
  skeletonMessageLine: {
    height: 14,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
    marginBottom: 4,
  },
  skeletonMessageLineShort: {
    width: "70%",
  },
  skeletonHelpfulContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  skeletonHelpfulButton: {
    height: 20,
    width: 80,
    backgroundColor: COLORS.neutral[200],
    borderRadius: 4,
  },
  skeletonDivider: {
    height: 1,
    backgroundColor: COLORS.neutral[100],
    marginTop: MARGIN.sm,
  },
});

export default ReviewsScreenSkeleton;
