import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

interface ReviewSkeletonProps {
  count?: number;
}

const ReviewSkeleton: React.FC<ReviewSkeletonProps> = ({ count = 3 }) => {
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

  return (
    <View style={styles.container}>
      {Array.from({ length: count }, (_, index) => (
        <View key={index} style={styles.skeletonWrapper}>
          <SkeletonCard />
          {index < count - 1 && <View style={styles.skeletonDivider} />}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.md,
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

export default ReviewSkeleton;
