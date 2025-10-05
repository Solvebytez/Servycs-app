import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "moti/skeleton";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../constants";

interface SavedListCardSkeletonProps {
  style?: any;
}

export const SavedListCardSkeleton: React.FC<SavedListCardSkeletonProps> = ({
  style,
}) => {
  return (
    <View style={[styles.card, style]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width={24}
            height={24}
            radius={12}
          />
          <View style={styles.headerText}>
            <Skeleton
              colorMode="light"
              colors={[COLORS.neutral[200], COLORS.neutral[100]]}
              width="70%"
              height={16}
              radius={8}
            />
            <View style={{ height: 4 }} />
            <Skeleton
              colorMode="light"
              colors={[COLORS.neutral[200], COLORS.neutral[100]]}
              width="40%"
              height={12}
              radius={6}
            />
          </View>
        </View>
        <Skeleton
          colorMode="light"
          colors={[COLORS.neutral[200], COLORS.neutral[100]]}
          width={20}
          height={20}
          radius={10}
        />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Thumbnails */}
        <View style={styles.thumbnailsContainer}>
          <View style={styles.thumbnailsGrid}>
            {[1, 2, 3, 4].map((index) => (
              <View key={index} style={styles.thumbnailWrapper}>
                <Skeleton
                  colorMode="light"
                  colors={[COLORS.neutral[200], COLORS.neutral[100]]}
                  width="100%"
                  height="100%"
                  radius={8}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Description */}
        <View style={styles.description}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="90%"
            height={12}
            radius={6}
          />
          <View style={{ height: 4 }} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="60%"
            height={12}
            radius={6}
          />
        </View>

        {/* Info Container */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Skeleton
              colorMode="light"
              colors={[COLORS.neutral[200], COLORS.neutral[100]]}
              width={10}
              height={10}
              radius={5}
            />
            <View style={{ width: 4 }} />
            <Skeleton
              colorMode="light"
              colors={[COLORS.neutral[200], COLORS.neutral[100]]}
              width="40%"
              height={10}
              radius={5}
            />
          </View>
          <View style={styles.infoItem}>
            <Skeleton
              colorMode="light"
              colors={[COLORS.neutral[200], COLORS.neutral[100]]}
              width={10}
              height={10}
              radius={5}
            />
            <View style={{ width: 4 }} />
            <Skeleton
              colorMode="light"
              colors={[COLORS.neutral[200], COLORS.neutral[100]]}
              width="35%"
              height={10}
              radius={5}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: PADDING.lg,
    marginVertical: MARGIN.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.neutral[100],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: PADDING.lg,
    paddingBottom: PADDING.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  headerText: {
    marginLeft: MARGIN.sm,
    flex: 1,
  },
  content: {
    padding: PADDING.lg,
    paddingTop: PADDING.md,
  },
  thumbnailsContainer: {
    marginBottom: MARGIN.md,
  },
  thumbnailsGrid: {
    flexDirection: "row",
    gap: MARGIN.xs,
  },
  thumbnailWrapper: {
    flex: 1,
    height: 70,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.neutral[100],
  },
  description: {
    marginBottom: MARGIN.md,
  },
  infoContainer: {
    marginTop: MARGIN.sm,
    paddingTop: MARGIN.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[100],
    gap: MARGIN.xs,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
