import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../../constants";
import { GlobalStatusBar, AppHeader } from "@/components";
import { ResponsiveText } from "@/components";
import { usePrimaryCategories } from "../../../hooks/useCategories";
import { Category } from "../../../services/category";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "moti/skeleton";

// Get screen dimensions
const { width: screenWidth } = Dimensions.get("window");

// Calculate grid layout - 3 columns per row
const numColumns = 3;
const itemWidth =
  (screenWidth - PADDING.screen * 2 - MARGIN.sm * (numColumns - 1)) /
  numColumns;

// Icon mapping for categories
const getCategoryIcon = (
  categoryName: string
): keyof typeof Ionicons.glyphMap => {
  const name = categoryName.toLowerCase();

  if (
    name.includes("loan") ||
    name.includes("finance") ||
    name.includes("bank")
  )
    return "wallet";
  if (
    name.includes("doctor") ||
    name.includes("medical") ||
    name.includes("health")
  )
    return "medical";
  if (
    name.includes("travel") ||
    name.includes("tourism") ||
    name.includes("vacation")
  )
    return "airplane";
  if (name.includes("beauty") || name.includes("salon") || name.includes("spa"))
    return "person";
  if (
    name.includes("gym") ||
    name.includes("fitness") ||
    name.includes("sport")
  )
    return "fitness";
  if (
    name.includes("repair") ||
    name.includes("service") ||
    name.includes("maintenance")
  )
    return "construct";
  if (
    name.includes("education") ||
    name.includes("school") ||
    name.includes("learning")
  )
    return "school";
  if (
    name.includes("food") ||
    name.includes("restaurant") ||
    name.includes("catering")
  )
    return "restaurant";
  if (
    name.includes("transport") ||
    name.includes("delivery") ||
    name.includes("logistics")
  )
    return "car";
  if (
    name.includes("technology") ||
    name.includes("it") ||
    name.includes("software")
  )
    return "laptop";
  if (
    name.includes("real estate") ||
    name.includes("property") ||
    name.includes("housing")
  )
    return "home";
  if (
    name.includes("legal") ||
    name.includes("law") ||
    name.includes("attorney")
  )
    return "document-text";
  if (
    name.includes("consulting") ||
    name.includes("business") ||
    name.includes("advisory")
  )
    return "briefcase";
  if (
    name.includes("entertainment") ||
    name.includes("event") ||
    name.includes("party")
  )
    return "musical-notes";
  if (
    name.includes("automotive") ||
    name.includes("car") ||
    name.includes("vehicle")
  )
    return "car-sport";
  if (
    name.includes("pet") ||
    name.includes("animal") ||
    name.includes("veterinary")
  )
    return "paw";
  if (
    name.includes("cleaning") ||
    name.includes("housekeeping") ||
    name.includes("maintenance")
  )
    return "sparkles";
  if (
    name.includes("security") ||
    name.includes("safety") ||
    name.includes("protection")
  )
    return "shield";

  return "grid"; // Default icon
};

// Color mapping for categories - more vibrant and modern colors
const getCategoryColor = (index: number): string => {
  const colors = [
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#06B6D4", // Cyan
    "#3B82F6", // Blue
    "#84CC16", // Lime
    "#F97316", // Orange
    "#8B5A2B", // Brown
    "#6B7280", // Gray
  ];
  return colors[index % colors.length];
};

// Category Skeleton Component
const CategorySkeleton = () => (
  <View style={[styles.categoryItem, { width: itemWidth }]}>
    <Skeleton
      colorMode="light"
      colors={[COLORS.neutral[200], COLORS.neutral[100]]}
      width={itemWidth * 0.7}
      height={itemWidth * 0.7}
      radius={BORDER_RADIUS.xl}
    />
    <View style={{ marginTop: MARGIN.xs, alignItems: "center" }}>
      <Skeleton
        colorMode="light"
        colors={[COLORS.neutral[200], COLORS.neutral[100]]}
        width={itemWidth * 0.9}
        height={12}
        radius={6}
      />
    </View>
  </View>
);

export default function CategoriesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const queryClient = useQueryClient();

  // Fetch all primary categories
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = usePrimaryCategories();

  // Pull to refresh function
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchCategories();
    } catch (error) {
      console.error("Error refreshing categories:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    // Navigate to search screen with category filter
    router.push(`/(dashboard)/(user)/search?category=${category.slug}`);
  };

  const renderCategoryItem = ({
    item,
    index,
  }: {
    item: Category;
    index: number;
  }) => (
    <TouchableOpacity
      style={[styles.categoryItem, { width: itemWidth }]}
      onPress={() => handleCategoryPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.categoryCard}>
        <View
          style={[
            styles.categoryIcon,
            {
              backgroundColor: getCategoryColor(index),
              width: itemWidth * 0.7,
              height: itemWidth * 0.7,
            },
          ]}
        >
          <Ionicons
            name={getCategoryIcon(item.name)}
            size={itemWidth * 0.3}
            color={COLORS.white}
          />
        </View>
        <ResponsiveText
          variant="caption1"
          weight="medium"
          color={COLORS.text.primary}
          style={styles.categoryTitle}
          numberOfLines={2}
        >
          {item.name}
        </ResponsiveText>
      </View>
    </TouchableOpacity>
  );

  const renderSkeletonItem = () => <CategorySkeleton />;

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
            title="Service Categories"
            backgroundColor={COLORS.primary[200]}
            textColor={COLORS.white}
          />

          {/* Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary[500]]}
                tintColor={COLORS.primary[500]}
                title="Pull to refresh"
                titleColor={COLORS.text.secondary}
              />
            }
          >
            {/* Categories Grid */}
            <View style={styles.section}>
              {categoriesLoading ? (
                <FlatList
                  data={Array(9).fill(null)}
                  numColumns={numColumns}
                  keyExtractor={(_, index) => `skeleton-${index}`}
                  renderItem={renderSkeletonItem}
                  contentContainerStyle={styles.gridContainer}
                  scrollEnabled={false}
                />
              ) : categoriesError ? (
                <View style={styles.errorContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color={COLORS.error[500]}
                  />
                  <ResponsiveText
                    variant="h6"
                    weight="medium"
                    color={COLORS.error[500]}
                    style={styles.errorTitle}
                  >
                    Failed to Load Categories
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.secondary}
                    style={styles.errorMessage}
                  >
                    Please check your internet connection and try again.
                  </ResponsiveText>
                  <TouchableOpacity
                    style={styles.retryButton}
                    onPress={() => refetchCategories()}
                  >
                    <ResponsiveText
                      variant="buttonSmall"
                      weight="medium"
                      color={COLORS.white}
                    >
                      Try Again
                    </ResponsiveText>
                  </TouchableOpacity>
                </View>
              ) : categories && categories.length > 0 ? (
                <FlatList
                  data={categories}
                  numColumns={numColumns}
                  keyExtractor={(item) => item.id}
                  renderItem={renderCategoryItem}
                  contentContainerStyle={styles.gridContainer}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="grid-outline"
                    size={48}
                    color={COLORS.text.light}
                  />
                  <ResponsiveText
                    variant="h6"
                    weight="medium"
                    color={COLORS.text.secondary}
                    style={styles.emptyTitle}
                  >
                    No Categories Available
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.light}
                    style={styles.emptyMessage}
                  >
                    Categories will appear here once they are added to the
                    system.
                  </ResponsiveText>
                </View>
              )}
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
  },
  section: {
    marginTop: MARGIN.xl,
  },
  gridContainer: {
    paddingBottom: MARGIN.lg,
  },
  categoryItem: {
    alignItems: "center",
    marginBottom: MARGIN.md,
    marginHorizontal: MARGIN.xs,
  },
  categoryCard: {
    alignItems: "center",
    width: "100%",
  },
  categoryIcon: {
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: MARGIN.xs,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryTitle: {
    textAlign: "center",
    lineHeight: 16,
    minHeight: 32,
    paddingHorizontal: 2,
    fontSize: 12,
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PADDING.xxl,
  },
  errorTitle: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
  },
  errorMessage: {
    textAlign: "center",
    marginBottom: MARGIN.lg,
    paddingHorizontal: PADDING.lg,
  },
  retryButton: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PADDING.xxl,
  },
  emptyTitle: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
  },
  emptyMessage: {
    textAlign: "center",
    paddingHorizontal: PADDING.lg,
  },
  bottomSpacing: {
    height: 100,
  },
});
