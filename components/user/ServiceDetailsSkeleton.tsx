import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Skeleton } from "moti/skeleton";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../constants";

const { width } = Dimensions.get("window");

export const ServiceDetailsSkeleton: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Skeleton
          colorMode="light"
          colors={[COLORS.neutral[200], COLORS.neutral[100]]}
          width={36}
          height={36}
          radius={18}
        />
        <View style={styles.headerSpacer} />
        <Skeleton
          colorMode="light"
          colors={[COLORS.neutral[200], COLORS.neutral[100]]}
          width={36}
          height={36}
          radius={18}
        />
      </View>

      {/* Image Skeleton */}
      <View style={styles.imageContainer}>
        <Skeleton
          colorMode="light"
          colors={[COLORS.neutral[200], COLORS.neutral[100]]}
          width="100%"
          height={250}
        />
      </View>

      {/* Content Container */}
      <View style={styles.contentContainer}>
        {/* Title and Rating */}
        <View style={styles.titleSection}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="80%"
            height={24}
            radius={12}
          />
          <View style={styles.titleSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="20%"
            height={16}
            radius={8}
          />
        </View>

        {/* Price and Category */}
        <View style={styles.priceSection}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="30%"
            height={20}
            radius={10}
          />
          <View style={styles.priceSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="25%"
            height={16}
            radius={8}
          />
        </View>

        {/* Description */}
        <View style={styles.descriptionSection}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="100%"
            height={14}
            radius={7}
          />
          <View style={styles.descriptionSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="90%"
            height={14}
            radius={7}
          />
          <View style={styles.descriptionSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="75%"
            height={14}
            radius={7}
          />
        </View>

        {/* Tabs */}
        <View style={styles.tabsSection}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="25%"
            height={40}
            radius={20}
          />
          <View style={styles.tabSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="25%"
            height={40}
            radius={20}
          />
        </View>

        {/* Tab Content */}
        <View style={styles.tabContentSection}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="100%"
            height={16}
            radius={8}
          />
          <View style={styles.contentSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="95%"
            height={16}
            radius={8}
          />
          <View style={styles.contentSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="85%"
            height={16}
            radius={8}
          />
          <View style={styles.contentSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="90%"
            height={16}
            radius={8}
          />
        </View>

        {/* Business Hours Section */}
        <View style={styles.businessHoursSection}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="40%"
            height={18}
            radius={9}
          />
          <View style={styles.businessHoursSpacer} />
          {[1, 2, 3, 4, 5, 6, 7].map((index) => (
            <View key={index} style={styles.businessHoursItem}>
              <Skeleton
                colorMode="light"
                colors={[COLORS.neutral[200], COLORS.neutral[100]]}
                width="20%"
                height={14}
                radius={7}
              />
              <View style={styles.businessHoursItemSpacer} />
              <Skeleton
                colorMode="light"
                colors={[COLORS.neutral[200], COLORS.neutral[100]]}
                width="30%"
                height={14}
                radius={7}
              />
            </View>
          ))}
        </View>

        {/* Footer Buttons */}
        <View style={styles.footerSection}>
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="45%"
            height={48}
            radius={24}
          />
          <View style={styles.footerSpacer} />
          <Skeleton
            colorMode="light"
            colors={[COLORS.neutral[200], COLORS.neutral[100]]}
            width="45%"
            height={48}
            radius={24}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
    paddingTop: PADDING.md,
    paddingBottom: PADDING.sm,
  },
  headerSpacer: {
    flex: 1,
  },
  imageContainer: {
    height: 250,
    marginHorizontal: PADDING.lg,
    marginBottom: MARGIN.lg,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: PADDING.lg,
  },
  titleSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  titleSpacer: {
    flex: 1,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  priceSpacer: {
    flex: 1,
  },
  descriptionSection: {
    marginBottom: MARGIN.lg,
  },
  descriptionSpacer: {
    height: MARGIN.sm,
  },
  tabsSection: {
    flexDirection: "row",
    marginBottom: MARGIN.lg,
  },
  tabSpacer: {
    width: MARGIN.md,
  },
  tabContentSection: {
    marginBottom: MARGIN.xl,
  },
  contentSpacer: {
    height: MARGIN.sm,
  },
  businessHoursSection: {
    marginBottom: MARGIN.xl,
  },
  businessHoursSpacer: {
    height: MARGIN.md,
  },
  businessHoursItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  businessHoursItemSpacer: {
    flex: 1,
  },
  footerSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: PADDING.xl,
  },
  footerSpacer: {
    width: MARGIN.md,
  },
});
