import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "moti/skeleton";
import { COLORS, MARGIN } from "../../constants";

interface ServiceCardSkeletonProps {
  style?: any;
}

export const ServiceCardSkeleton: React.FC<ServiceCardSkeletonProps> = ({
  style,
}) => {
  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.searchResultCard}>
        <View style={styles.imageContainer}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="100%"
            height="100%"
          />
        </View>
        <View style={styles.resultDetails}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="60%"
            height={12}
            radius={6}
          />
          <View style={{ height: 4 }} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="80%"
            height={16}
            radius={8}
          />
          <View style={{ height: 4 }} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="70%"
            height={12}
            radius={6}
          />
          <View style={{ height: 4 }} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="40%"
            height={12}
            radius={6}
          />
          <View style={{ height: 4 }} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="30%"
            height={12}
            radius={6}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.background.secondary,
    paddingVertical: MARGIN.sm,
  },
  searchResultCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: MARGIN.md,
    height: 140,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.neutral[100],
  },
  resultDetails: {
    flex: 1,
    padding: MARGIN.md,
    justifyContent: "space-between",
  },
});
