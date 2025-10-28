import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  Dimensions,
  RefreshControl,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  SPACING,
  BORDER_RADIUS,
} from "../../../constants";
import { GlobalStatusBar } from "../../../components/StatusBar";
import { ResponsiveText, ResponsiveCard } from "@/components";
import { useUser } from "../../../hooks/useUser";
import { useSavedListsData } from "../../../hooks/useSavedLists";
import { usePrimaryCategories } from "../../../hooks/useCategories";
import { Category } from "../../../services/category";
import { PromotionBannerSlider } from "../../../components/common/PromotionBannerSlider";
import {
  getBestPromotionFromServiceData,
  getPromotionDisplayInfo,
} from "@/utils/promotionUtils";
import {
  MyFavoriteServicesSection,
  PopularServicesSection,
  HowItWorksSection,
  AppReviewsSection,
} from "../../../components/user";
import { usePopularServices } from "../../../hooks/useServiceListings";
import { useQueryClient } from "@tanstack/react-query";
import { usePublicAppReviews } from "../../../hooks/useAppReviews";
import { Skeleton } from "moti/skeleton";

// Get screen dimensions
const { width: screenWidth } = Dimensions.get("window");

// Utility function to chunk array into pairs of 2
const chunkArray = (arr: Category[], size: number): Category[][] => {
  let result: Category[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
};

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

// Color mapping for categories
const getCategoryColor = (index: number): string => {
  const colors = [
    "#20B2AA",
    "#87CEEB",
    "#9370DB",
    "#FFA500",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
  ];
  return colors[index % colors.length];
};

// Category Skeleton Component
const CategorySkeleton = () => (
  <View style={styles.categoryColumn}>
    {/* First skeleton category */}
    <View style={styles.categoryItem}>
      <Skeleton
        colorMode="light"
        colors={[COLORS.neutral[200], COLORS.neutral[100]]}
        width={60}
        height={60}
        radius={14}
      />
      <View style={{ marginTop: MARGIN.xs }}>
        <Skeleton
          colorMode="light"
          colors={[COLORS.neutral[200], COLORS.neutral[100]]}
          width={50}
          height={12}
          radius={6}
        />
      </View>
    </View>

    {/* Second skeleton category */}
    <View style={styles.categoryItem}>
      <Skeleton
        colorMode="light"
        colors={[COLORS.neutral[200], COLORS.neutral[100]]}
        width={60}
        height={60}
        radius={14}
      />
      <View style={{ marginTop: MARGIN.xs }}>
        <Skeleton
          colorMode="light"
          colors={[COLORS.neutral[200], COLORS.neutral[100]]}
          width={45}
          height={12}
          radius={6}
        />
      </View>
    </View>
  </View>
);

export default function UserHomeScreen() {
  // Pull to refresh state
  const [refreshing, setRefreshing] = useState(false);

  // Query client for cache invalidation
  const queryClient = useQueryClient();

  // Use React Query to fetch user data
  const { data: user, isLoading, error, refetch: refetchUser } = useUser();

  // Fetch popular services
  const {
    data: popularServicesData,
    isLoading: popularServicesLoading,
    error: popularServicesError,
    refetch: refetchPopularServices,
  } = usePopularServices(5, true);

  // Transform API data to component format
  const transformedPopularServices =
    (popularServicesData as any)?.data?.listings?.map((service: any) => {
      // Debug logging for category extraction
      console.log("🔍 POPULAR SERVICES DEBUG - Service:", service.title);
      console.log("  - service.category:", service.category);
      console.log("  - service.categoryPath:", service.categoryPath);
      console.log(
        "  - service.services[0]?.categoryIds:",
        service.services?.[0]?.categoryIds
      );
      console.log(
        "  - service.services[0]?.categoryPaths:",
        service.services?.[0]?.categoryPaths
      );

      // Try multiple sources for category name
      let categoryName = "General";
      if (service.category?.name) {
        categoryName = service.category.name;
      } else if (service.categoryPath && service.categoryPath.length > 0) {
        // Use the root category from categoryPath
        categoryName = service.categoryPath[0]?.name || categoryName;
      } else if (
        service.services?.[0]?.categoryPaths &&
        service.services[0].categoryPaths.length > 0
      ) {
        // Use the longest/most specific category path
        const longestPath = service.services[0].categoryPaths.reduce(
          (longest: any, current: any) => {
            return current.length > longest.length ? current : longest;
          },
          []
        );
        // categoryPaths is an array of arrays of strings
        // Use the last item in the longest path (most specific)
        categoryName =
          longestPath.length > 0
            ? longestPath[longestPath.length - 1]
            : categoryName;
      }

      console.log("  - Final categoryName:", categoryName);

      // Get the latest promotion for this service
      const servicePrice = service.services?.[0]?.price;
      const bestPromotion = servicePrice
        ? getBestPromotionFromServiceData(
            service.promotionListings,
            servicePrice
          )
        : null;

      return {
        id: service.id || "",
        title: service.title || "",
        image: service.image || undefined,
        vendorName:
          service.services?.[0]?.name || service.title || "Unknown Service",
        category: categoryName,
        price: servicePrice || undefined,
        rating: service.rating || undefined,
        totalReviews: service.totalReviews || undefined,
        // Add promotion data
        promotion: bestPromotion
          ? {
              id: bestPromotion.promotion.id,
              title: bestPromotion.promotion.title,
              discountType: bestPromotion.promotion.discountType,
              discountValue: bestPromotion.promotion.discountValue,
            }
          : undefined,
      };
    }) || [];

  // Fetch user's favorite services (limit to 10 for home screen)
  const {
    savedLists,
    isLoading: savedListsLoading,
    error: savedListsError,
    refetch: refetchSavedLists,
    isFetching: savedListsFetching,
    isStale: savedListsStale,
    dataUpdatedAt: savedListsDataUpdatedAt,
  } = useSavedListsData(user?.id || null, false, 10);

  // Fetch primary categories from API
  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
    refetch: refetchCategories,
  } = usePrimaryCategories();

  // Fetch public app reviews
  const {
    data: appReviewsData,
    isLoading: appReviewsLoading,
    error: appReviewsError,
    refetch: refetchAppReviews,
  } = usePublicAppReviews(5);

  // Process categories for display (limit to 12 for home screen)
  const displayCategories = categories ? categories.slice(0, 12) : [];
  const groupedCategories = chunkArray(displayCategories, 2);

  // Pull to refresh function
  const onRefresh = async () => {
    console.log("🔄 Pull to refresh triggered");
    setRefreshing(true);
    try {
      console.log("🔄 Starting data refresh...");

      // Invalidate promotions cache to force refetch
      await queryClient.invalidateQueries({
        queryKey: ["promotions", "active"],
      });
      console.log("✅ Promotions cache invalidated");

      // Refetch all data
      const results = await Promise.all([
        refetchUser(),
        refetchPopularServices(),
        refetchSavedLists(),
        refetchCategories(),
        refetchAppReviews(),
      ]);
      console.log("✅ All data refetched successfully:", results.length);
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    } finally {
      setRefreshing(false);
      console.log("🔄 Pull to refresh completed");
    }
  };

  const handleSearchPress = () => {
    router.push("/(dashboard)/(user)/search");
  };

  // Animated header logic
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, -87],
    extrapolate: "clamp",
  });

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  return (
    <>
      <GlobalStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary[500]}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Header Section with Gradient - Animated */}
          <Animated.View
            style={[
              styles.animatedHeaderContainer,
              { transform: [{ translateY: headerTranslateY }] },
            ]}
          >
            <LinearGradient
              colors={[COLORS.primary[200], COLORS.primary[50], "#fff"]}
              style={styles.headerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            >
              {/* Logo and Icons */}
              <View style={styles.header}>
                <View style={styles.logoContainer}>
                  <Image
                    source={require("../../../assets/logo.png")}
                    style={styles.logoImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.headerIcons}>
                  <TouchableOpacity style={styles.iconButton}>
                    <Ionicons
                      name="notifications"
                      size={24}
                      color={COLORS.black}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.profileButton}
                    onPress={() => {
                      router.push("/(dashboard)/(user)/profile");
                    }}
                  >
                    {user?.avatar ? (
                      <Image
                        source={{ uri: (user as any).avatar }}
                        style={styles.profileImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <ResponsiveText
                        variant="buttonSmall"
                        weight="bold"
                        color={COLORS.black}
                      >
                        {(user as any)?.name
                          ? (user as any).name
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </ResponsiveText>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              {/* Search Bar */}
              <View style={styles.searchContainer}>
                <TouchableOpacity
                  style={styles.searchBar}
                  onPress={handleSearchPress}
                >
                  <Ionicons
                    name="search"
                    size={20}
                    color={COLORS.text.light}
                    style={styles.searchIcon}
                  />
                  <ResponsiveText
                    variant="caption2"
                    color={COLORS.text.light}
                    style={{ fontSize: 12 }}
                  >
                    Search & Shop Anywhere
                  </ResponsiveText>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Main Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            bounces={true} // Enable bouncing for pull-to-refresh
            alwaysBounceVertical={true} // Always allow vertical bounce
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary[500]]} // Android
                tintColor={COLORS.primary[500]} // iOS
                title="Pull to refresh" // iOS
                titleColor={COLORS.text.secondary} // iOS
                progressBackgroundColor={COLORS.white} // Android
              />
            }
          >
            {/* My Saved Lists Section */}
            <MyFavoriteServicesSection
              savedLists={savedLists || []}
              isLoading={savedListsLoading}
              isInitialLoading={!user?.id || savedListsLoading}
              error={savedListsError?.message}
              onViewMore={() => {
                // Navigate to saved lists screen
                router.push("/(dashboard)/(user)/saved-lists");
              }}
              onSavedListPress={(savedList) => {
                // Navigate to saved list details
                router.push(
                  `/(dashboard)/(user)/saved-list-details?id=${savedList.id}`
                );
              }}
              onCreateSavedList={() => {
                // Navigate to create saved list screen
                router.push("/(dashboard)/(user)/create-saved-list");
              }}
            />

            {/* Service Categories Grid */}
            <View style={styles.categoriesSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.titleContainer}>
                  <Ionicons
                    name="grid-outline"
                    size={20}
                    color={COLORS.warning[500]}
                    style={styles.titleIcon}
                  />
                  <ResponsiveText
                    variant="h5"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.sectionTitle}
                  >
                    Service Categories
                  </ResponsiveText>
                </View>
              </View>

              {categoriesLoading ? (
                <FlatList
                  data={Array(6).fill(null)} // Show 6 skeleton items (3 columns x 2 rows)
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => `skeleton-${index}`}
                  contentContainerStyle={styles.categoriesFlatListContainer}
                  renderItem={() => <CategorySkeleton />}
                />
              ) : categoriesError ? (
                <View style={styles.errorContainer}>
                  <ResponsiveText variant="body2" color={COLORS.error[500]}>
                    Failed to load categories
                  </ResponsiveText>
                </View>
              ) : groupedCategories.length > 0 ? (
                <FlatList
                  data={groupedCategories}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(_, index) => index.toString()}
                  contentContainerStyle={styles.categoriesFlatListContainer}
                  renderItem={({ item: categoryPair, index }) => (
                    <View style={styles.categoryColumn}>
                      {categoryPair.map((category, categoryIndex) => (
                        <TouchableOpacity
                          key={category.id}
                          style={styles.categoryItem}
                          onPress={() => {
                            // Navigate to category-specific service listings
                            router.push(
                              `/(dashboard)/(user)/search?category=${category.slug}`
                            );
                          }}
                        >
                          <View
                            style={[
                              styles.categoryIcon,
                              {
                                backgroundColor: getCategoryColor(
                                  index * 2 + categoryIndex
                                ),
                              },
                            ]}
                          >
                            <Ionicons
                              name={getCategoryIcon(category.name)}
                              size={28}
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
                            {category.name}
                          </ResponsiveText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                    No categories available
                  </ResponsiveText>
                </View>
              )}
            </View>

            {/* View More Button */}
            <View style={styles.viewMoreContainer}>
              <TouchableOpacity
                style={styles.viewMoreButton}
                onPress={() => {
                  // Navigate to full categories screen
                  router.push("/(dashboard)/(user)/categories");
                }}
              >
                <ResponsiveText
                  variant="body2"
                  weight="medium"
                  color={COLORS.text.secondary}
                >
                  View more
                </ResponsiveText>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Promotion Banner Slider */}
            <PromotionBannerSlider customMarginTop={MARGIN.md} />

            {/* Popular Services Section */}
            <PopularServicesSection
              services={transformedPopularServices}
              isLoading={popularServicesLoading}
              error={popularServicesError?.message}
              onViewMore={() => {
                // Navigate to search screen
                router.push("/(dashboard)/(user)/search");
              }}
              onServicePress={(service) => {
                // Navigate to service details
                router.push(`/(dashboard)/service-details?id=${service.id}`);
              }}
            />

            {/* How It Works Section */}
            <HowItWorksSection />

            {/* App Reviews Section */}
            <AppReviewsSection
              reviews={appReviewsData?.reviews || []}
              isLoading={appReviewsLoading}
              error={appReviewsError?.message}
            />

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

  animatedHeaderContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  headerGradient: {
    paddingBottom: MARGIN.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING.screen,
    paddingTop: MARGIN.md,
  },
  logoContainer: {
    alignItems: "flex-start",
  },
  logoImage: {
    width: 80,
    height: 80,
    tintColor: COLORS.white,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  searchContainer: {
    paddingHorizontal: PADDING.screen,
    marginTop: MARGIN.md,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xxxl,
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 46,
  },
  searchIcon: {
    marginRight: MARGIN.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.body2,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
    paddingTop: 180, // Reduced padding to show bottom section properly
  },
  section: {
    marginTop: MARGIN.xl,
  },
  categoriesSection: {
    marginTop: MARGIN.md,
    paddingHorizontal: PADDING.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    marginRight: 8,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: MARGIN.md,
  },
  categoryItem: {
    width: "100%",
    alignItems: "center",
    marginBottom: MARGIN.sm,
    paddingHorizontal: PADDING.xs,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  categoryTitle: {
    textAlign: "center",
    fontSize: FONT_SIZE.caption1,
    lineHeight: 16,
    minHeight: 32, // Increased height
    paddingHorizontal: 2, // Small padding to prevent text overflow
  },
  viewMoreContainer: {
    alignItems: "center",
    marginTop: MARGIN.xs,
    marginBottom: MARGIN.sm,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  sectionTitle: {
    lineHeight: 24,
  },
  activityItem: {
    marginBottom: MARGIN.sm,
  },
  featureText: {
    lineHeight: 22,
  },
  bottomSpacing: {
    height: 250,
  },
  loadingContainer: {
    padding: PADDING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    padding: PADDING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: PADDING.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  // New styles for horizontal categories layout
  categoriesFlatListContainer: {
    paddingRight: PADDING.screen,
  },
  categoryColumn: {
    width: screenWidth * 0.28, // 28% of screen width for each column (narrower columns)
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: MARGIN.xs,
  },
});
