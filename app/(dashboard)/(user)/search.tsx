import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Dimensions,
  Modal,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../../constants";
import {
  ResponsiveText,
  ResponsiveButton,
  GlobalStatusBar,
  ServiceCardSkeleton,
} from "@/components";
import { Skeleton } from "moti/skeleton";
// Import SearchPromotionBanner component
import { SearchPromotionBanner } from "@/components/user/SearchPromotionBanner";
// Import OfferBadge component
import { OfferBadge } from "@/components/common/OfferBadge";
import {
  getBestPromotionFromServiceData,
  getPromotionDisplayInfo,
} from "@/utils/promotionUtils";
// Import filter components
import {
  MainFilterBar,
  AdvancedFilterModal,
  SortFilterPanel,
  CategoryFilterPanel,
  GLOBAL_SEARCH_FILTER_CONFIG,
  CATEGORY_FILTER_CONFIG,
} from "@/components/user/filters";
import { SubcategoryFilterChips } from "@/components/user/filters/SubcategoryFilterChips";
import {
  usePopularServices,
  useInfiniteServiceListingsWithExclusion,
  flattenInfiniteServiceListings,
} from "../../../hooks/useServiceListings";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePrimaryCategories,
  useCategoryChildren,
} from "../../../hooks/useCategories";
import {
  useFilterAwareServices,
  useFilteredPopularServices,
} from "../../../hooks/useFilterAwareServices";

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function SearchScreen() {
  const [searchText, setSearchText] = useState("");
  const [debouncedSearchText, setDebouncedSearchText] = useState("");
  const queryClient = useQueryClient();

  // Get URL parameters to detect if coming from category selection
  const searchParams = useLocalSearchParams();
  const categorySlug = searchParams?.category;

  // Get categories for displaying category names in filter chips
  const { data: categoriesData, isLoading: categoriesLoading } =
    usePrimaryCategories();

  // Find the selected category from URL parameter
  const selectedCategory =
    (!categoriesLoading &&
      categoriesData?.find((cat: any) => cat.slug === categorySlug)) ||
    null;

  // Store the original category name from URL parameter to ensure header never changes
  const originalCategoryName = selectedCategory?.name;

  const [activeFilter, setActiveFilter] = useState<string | null>("sort");
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [isAdvancedFilterModalVisible, setIsAdvancedFilterModalVisible] =
    useState(false);

  // Initialize filters based on category browsing mode
  const [selectedFilters, setSelectedFilters] = useState(() => ({
    sort: "top-rated",
    category: selectedCategory?.id || "all",
    ...(GLOBAL_SEARCH_FILTER_CONFIG?.defaultFilters || {}),
  }));

  // Always fetch child categories when a main category is selected
  const {
    data: childCategories,
    isLoading: childCategoriesLoading,
    error: childCategoriesError,
  } = useCategoryChildren(
    selectedFilters?.category !== "all" ? selectedFilters?.category : null
  );

  // State for selected subcategories
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    []
  );

  // Determine if we're in category browsing mode
  // Only stay in browsing mode if we have a category slug AND the selected filter is not "all"
  const isCategoryBrowsingMode =
    !!categorySlug && !!selectedCategory && selectedFilters?.category !== "all";
  const insets = useSafeAreaInsets();

  // Update category filter when selected category changes
  useEffect(() => {
    if (isCategoryBrowsingMode && selectedCategory?.id) {
      setSelectedFilters((prev) => ({
        ...(prev || {}),
        category: selectedCategory.id,
      }));
    }
  }, [selectedCategory?.id, isCategoryBrowsingMode]);

  // Debounce search text to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchText(searchText);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch top-rated services with filters applied
  const {
    data: topRatedServices,
    isLoading: topRatedLoading,
    error: topRatedError,
  } = useFilteredPopularServices(selectedFilters, {
    limit: 10,
    excludeCurrentUser: true,
  });

  // Convert sort filter to API parameters
  const getSortParams = (sortFilter: string) => {
    switch (sortFilter) {
      case "price-low-high":
        return { sortBy: "price", sortOrder: "asc" };
      case "price-high-low":
        return { sortBy: "price", sortOrder: "desc" };
      case "newest":
        return { sortBy: "createdAt", sortOrder: "desc" };
      case "oldest":
        return { sortBy: "createdAt", sortOrder: "asc" };
      case "top-rated":
      default:
        return { sortBy: "rating", sortOrder: "desc" };
    }
  };

  const sortParams = getSortParams(selectedFilters?.sort || "top-rated");

  // Convert filters to API parameters
  const apiParams = useMemo(() => {
    const params: any = {
      limit: 10,
      isActive: true,
      sortBy: sortParams.sortBy as any,
      sortOrder: sortParams.sortOrder as any,
      search: debouncedSearchText.trim() || undefined,
    };

    if (!selectedFilters) return params;
    const filters = selectedFilters as any;

    console.log("🔍 Frontend API Params Debug:");
    console.log("  - selectedFilters:", filters);
    console.log("  - selectedSubcategories:", selectedSubcategories);

    // Category filter
    if (filters?.category && filters.category !== "all") {
      params.categoryId = filters.category;
      console.log("  - Main category ID:", filters.category);
    }

    // Subcategory filter
    if (selectedSubcategories.length > 0) {
      params.subcategoryIds = selectedSubcategories;
      console.log(
        "  - Adding subcategoryIds to params:",
        selectedSubcategories
      );
    }

    // Price filter
    if (filters.price && filters.price !== "any") {
      const priceRanges: Record<string, { min?: number; max?: number }> = {
        "under-100": { max: 100 },
        "under-500": { max: 500 },
        "100-500": { min: 100, max: 500 },
        "500-1000": { min: 500, max: 1000 },
        "1000-2500": { min: 1000, max: 2500 },
        "2500-5000": { min: 2500, max: 5000 },
        "over-1000": { min: 1000 },
        "above-5000": { min: 5000 },
      };
      const priceRange = priceRanges[filters.price];
      if (priceRange) {
        if (priceRange.min !== undefined) params.minPrice = priceRange.min;
        if (priceRange.max !== undefined) params.maxPrice = priceRange.max;
      }
    }

    // Rating filter
    if (filters.rating && filters.rating !== "any") {
      if (filters.rating === "below-3") {
        params.maxRating = 3.0; // Services with rating < 3.0
      } else {
        const ratingMap: Record<string, number> = {
          "4.5+": 4.5,
          "4.0+": 4.0,
          "3.5+": 3.5,
          "3.0+": 3.0,
        };
        params.minRating = ratingMap[filters.rating];
      }
    }

    // Business hours filter
    if (filters.hours && filters.hours !== "any") {
      params.businessHours = filters.hours;
      // Add timezone for "open-now" filter
      if (filters.hours === "open-now") {
        params.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      }
    }

    console.log("  - Final API params:", params);
    return params;
  }, [sortParams, selectedFilters, selectedSubcategories, debouncedSearchText]);

  // Use infinite query for all services with pagination, search, and filters
  const {
    data: infiniteServicesData,
    isLoading: servicesLoading,
    error: servicesError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteServiceListingsWithExclusion(apiParams, true);

  // Flatten infinite query data
  const allServices = flattenInfiniteServiceListings(infiniteServicesData);

  // Always use infinite query data for FlatList to enable infinite scrolling
  const searchResults = allServices || [];

  // Reset infinite query when filters change to start from page 1
  useEffect(() => {
    // Add a small delay to ensure initial query completes before reset
    const timer = setTimeout(() => {
      queryClient.resetQueries({
        queryKey: ["serviceListings", "infinite", "excludeUser"],
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [selectedFilters, selectedSubcategories, queryClient]);

  const handleCloseSearch = () => {
    router.back();
  };

  // Filter handling functions
  const handleFilterPress = (filterId: string) => {
    if (filterId === "filter-more") {
      setActiveFilter(null);
      setIsAdvancedFilterModalVisible(true);
    } else if (filterId === "sort") {
      setActiveFilter("sort");
      setShowSortPanel(true);
    } else if (filterId === "category") {
      setActiveFilter("category");
      setShowCategoryPanel(true);
    }
  };

  const handleSortSelect = (sortId: string) => {
    setSelectedFilters((prev) => ({
      ...(prev || {}),
      sort: sortId,
    }));
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedFilters((prev) => ({
      ...(prev || {}),
      category: categoryId,
    }));
    // Clear subcategories when main category changes
    setSelectedSubcategories([]);
  };

  const handleSubcategorySelect = (subcategoryId: string) => {
    setSelectedSubcategories((prev) => {
      if (prev.includes(subcategoryId)) {
        // Remove if already selected
        return prev.filter((id) => id !== subcategoryId);
      } else {
        // Add if not selected
        return [...prev, subcategoryId];
      }
    });
  };

  const handleAdvancedFilterChange = (filters: Record<string, any>) => {
    setSelectedFilters((prev) => ({
      ...(prev || {}),
      ...filters,
    }));
  };

  // Memoize the service item render function to prevent unnecessary re-renders
  const renderServiceItem = useMemo(
    () =>
      ({ item: service }: { item: any }) => {
        // Get the latest promotion for this service
        const servicePrice = service.services?.[0]?.price;
        const bestPromotion = servicePrice
          ? getBestPromotionFromServiceData(
              service.promotionListings,
              servicePrice
            )
          : null;

        return (
          <View style={styles.cardContainer}>
            <TouchableOpacity
              style={styles.searchResultCard}
              onPress={() => {
                // Navigate to service details
                router.push(`/(dashboard)/service-details?id=${service.id}`);
              }}
              activeOpacity={0.7}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={
                    service.image
                      ? { uri: service.image }
                      : require("../../../assets/user.png")
                  }
                  style={styles.resultImage}
                />

                {/* Offer Badge - Floating Above Image */}
                {bestPromotion && servicePrice && (
                  <View style={styles.offerBadgeContainer}>
                    <OfferBadge
                      discountType={
                        bestPromotion.promotion.discountType as
                          | "FIXED"
                          | "PERCENTAGE"
                      }
                      discountValue={bestPromotion.promotion.discountValue}
                      originalPrice={servicePrice}
                      discountedPrice={
                        bestPromotion.promotion.discountType === "FIXED"
                          ? Math.max(
                              0,
                              servicePrice -
                                bestPromotion.promotion.discountValue
                            )
                          : Math.max(
                              0,
                              servicePrice *
                                (1 -
                                  bestPromotion.promotion.discountValue / 100)
                            )
                      }
                      promotionTitle={bestPromotion.promotion.title}
                      size="small"
                    />
                  </View>
                )}
              </View>

              <View style={styles.resultDetails}>
                {/* Category */}
                <ResponsiveText
                  variant="caption2"
                  weight="medium"
                  color={COLORS.primary[500]}
                  style={styles.categoryText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {(() => {
                    // Try multiple sources for category name
                    if (service.category?.name) {
                      return service.category.name;
                    } else if (
                      service.categoryPath &&
                      service.categoryPath.length > 0
                    ) {
                      return service.categoryPath.join(" > ");
                    } else if (
                      service.services?.[0]?.categoryPaths &&
                      service.services[0].categoryPaths.length > 0
                    ) {
                      // Use the longest/most specific category path
                      const longestPath =
                        service.services[0].categoryPaths.reduce(
                          (longest: any, current: any) => {
                            return current.length > longest.length
                              ? current
                              : longest;
                          },
                          []
                        );
                      // categoryPaths is an array of arrays of strings
                      // Use the last item in the longest path (most specific)
                      return longestPath.length > 0
                        ? longestPath[longestPath.length - 1]
                        : "General";
                    }
                    return "General";
                  })()}
                </ResponsiveText>

                {/* Service Title */}
                <ResponsiveText
                  variant="body2"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.serviceTitle}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {service.title}
                </ResponsiveText>

                {/* Sub Services */}
                {service.services && service.services.length > 0 && (
                  <ResponsiveText
                    variant="caption2"
                    color={COLORS.text.secondary}
                    style={styles.subServicesText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {service.services
                      .map((subService: any) => subService.name)
                      .join(", ")}
                  </ResponsiveText>
                )}

                {/* Rating and Reviews */}
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={12} color={COLORS.warning[500]} />
                  <ResponsiveText
                    variant="caption2"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.ratingText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {service.rating?.toFixed(1) || "0.0"} (
                    {service.totalReviews || 0})
                  </ResponsiveText>
                </View>

                {/* Price Information */}
                {service.services &&
                  service.services.length > 0 &&
                  (() => {
                    // Get valid prices (non-null, non-zero)
                    const validPrices = service.services
                      .map((s: any) => s.price || s.discountPrice)
                      .filter(
                        (price: any) =>
                          price !== null && price !== undefined && price > 0
                      );

                    // Only show price if there are valid prices
                    if (validPrices.length > 0) {
                      const minPrice = Math.min(...validPrices);
                      return (
                        <View style={styles.priceContainer}>
                          <ResponsiveText
                            variant="caption2"
                            weight="medium"
                            color={COLORS.text.secondary}
                            style={styles.priceLabel}
                          >
                            Start from:
                          </ResponsiveText>
                          <ResponsiveText
                            variant="body2"
                            weight="bold"
                            color={COLORS.primary[500]}
                            style={styles.priceValue}
                          >
                            ₹{minPrice.toFixed(0)}
                          </ResponsiveText>
                        </View>
                      );
                    }
                    return null;
                  })()}
              </View>
            </TouchableOpacity>
          </View>
        );
      },
    []
  );

  // Memoize the promotion banner to prevent re-rendering
  const promotionBanner = useMemo(
    () => (
      <View style={styles.promotionContainer}>
        <SearchPromotionBanner />
      </View>
    ),
    []
  );

  // Get active filter display text
  const getActiveFilters = () => {
    const activeFilters: Array<{ key: string; label: string; value: string }> =
      [];
    if (!selectedFilters) return activeFilters;
    const filters = selectedFilters as any;

    // Sort filter
    if (filters.sort && filters.sort !== "top-rated") {
      const sortLabels: Record<string, string> = {
        "price-low-high": "Price: Low to High",
        "price-high-low": "Price: High to Low",
        newest: "Newest First",
        oldest: "Oldest First",
      };
      activeFilters.push({
        key: "sort",
        label: sortLabels[filters.sort] || filters.sort,
        value: filters.sort,
      });
    }

    // Category filter
    if (filters?.category && filters.category !== "all") {
      // Find the category name from the appropriate data source
      let categoryName = filters.category; // fallback to ID

      // First, try to find in main categories data
      const mainCategory = categoriesData?.find(
        (cat: any) => cat.id === filters.category
      );

      if (mainCategory) {
        categoryName = mainCategory.name;
      } else if (isCategoryBrowsingMode && selectedCategory) {
        // If in browsing mode and not found in main categories, use selectedCategory
        if (selectedCategory.id === filters.category) {
          categoryName = selectedCategory.name;
        } else {
          // Check child categories
          const childCategory = childCategories?.find(
            (cat: any) => cat.id === filters.category
          );
          if (childCategory) {
            categoryName = childCategory.name;
          }
        }
      }

      activeFilters.push({
        key: "category",
        label: categoryName,
        value: filters.category,
      });
    }

    // Price filter
    if (filters.price && filters.price !== "any") {
      const priceLabels: Record<string, string> = {
        "under-100": "Under ₹100",
        "100-500": "₹100 - ₹500",
        "500-1000": "₹500 - ₹1000",
        "over-1000": "Over ₹1000",
      };
      activeFilters.push({
        key: "price",
        label: priceLabels[filters.price] || filters.price,
        value: filters.price,
      });
    }

    // Rating filter
    if (filters.rating && filters.rating !== "any") {
      const ratingLabels: Record<string, string> = {
        "4-plus": "4+ Stars",
        "3-plus": "3+ Stars",
        "below-3": "Below 3 Stars",
      };
      activeFilters.push({
        key: "rating",
        label: ratingLabels[filters.rating] || filters.rating,
        value: filters.rating,
      });
    }

    // Business hours filter
    if (filters.hours && filters.hours !== "any") {
      const hoursLabels: Record<string, string> = {
        "open-now": "Open Now",
        "24-7": "24/7 Available",
        weekdays: "Weekdays Only",
      };
      activeFilters.push({
        key: "hours",
        label: hoursLabels[filters.hours] || filters.hours,
        value: filters.hours,
      });
    }

    return activeFilters;
  };

  // Clear specific filter
  const clearFilter = (filterKey: string) => {
    setSelectedFilters((prev) => ({
      ...(prev || {}),
      [filterKey]:
        filterKey === "sort"
          ? "top-rated"
          : filterKey === "category"
          ? "all"
          : "any",
    }));

    // Clear subcategories when main category is cleared
    if (filterKey === "category") {
      setSelectedSubcategories([]);
    }
  };

  // Memoize the list header to prevent unnecessary re-renders
  const renderListHeader = useMemo(() => {
    if (!selectedFilters) return null;
    const activeFilters = getActiveFilters();

    return (
      <>
        {/* Active Filters Display */}
        {activeFilters.length > 0 && (
          <View style={styles.activeFiltersContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.activeFiltersScroll}
            >
              {activeFilters.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  style={styles.activeFilterChip}
                  onPress={() => clearFilter(filter.key)}
                >
                  <ResponsiveText
                    variant="caption2"
                    weight="medium"
                    color={COLORS.primary[500]}
                    style={styles.activeFilterText}
                  >
                    {filter.label}
                  </ResponsiveText>
                  <Ionicons
                    name="close"
                    size={12}
                    color={COLORS.primary[500]}
                    style={styles.activeFilterClose}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Promotion Banner Slider */}
        {promotionBanner}

        {/* Search Results Header */}
        <View style={styles.searchResultsContainer}>
          {servicesLoading ? (
            <View style={styles.resultsCount}>
              <Skeleton
                colorMode="light"
                colors={[COLORS.neutral[200], COLORS.neutral[100]]}
                width={200}
                height={24}
                radius={12}
              />
            </View>
          ) : (
            <ResponsiveText
              variant="h5"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.resultsCount}
            >
              {debouncedSearchText
                ? `${
                    searchResults?.length || 0
                  } results for "${debouncedSearchText}"`
                : `${searchResults?.length || 0} services`}
            </ResponsiveText>
          )}
        </View>
      </>
    );
  }, [
    promotionBanner,
    debouncedSearchText,
    searchResults?.length,
    selectedFilters,
    servicesLoading,
  ]);

  // Memoize the list footer to prevent unnecessary re-renders
  const renderListFooter = useMemo(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.loadingContainer}>
          <ResponsiveText>Loading more services...</ResponsiveText>
        </View>
      );
    }
    return null;
  }, [isFetchingNextPage]);

  // Memoize the empty component for no results
  const renderEmptyComponent = useMemo(() => {
    if (servicesLoading) return null;

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons
            name="search-outline"
            size={64}
            color={COLORS.text.secondary}
          />
        </View>
        <ResponsiveText
          variant="h4"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.emptyTitle}
        >
          {debouncedSearchText ? "No services found" : "No services available"}
        </ResponsiveText>
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.emptySubtitle}
        >
          {debouncedSearchText
            ? `We couldn't find any services matching "${debouncedSearchText}". Try adjusting your search or filters.`
            : "There are no services available at the moment. Please check back later."}
        </ResponsiveText>
        {debouncedSearchText && (
          <TouchableOpacity
            style={styles.clearSearchButton}
            onPress={() => setSearchText("")}
          >
            <ResponsiveText
              variant="body2"
              weight="semiBold"
              color={COLORS.primary[500]}
            >
              Clear Search
            </ResponsiveText>
          </TouchableOpacity>
        )}
      </View>
    );
  }, [servicesLoading, debouncedSearchText]);

  return (
    <>
      <GlobalStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary[500]}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right", "bottom"]}>
        <View style={styles.container}>
          {/* Top Navigation Bar */}
          <View
            style={[
              styles.searchHeader,
              { paddingTop: insets.top + MARGIN.sm },
            ]}
          >
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleCloseSearch}
            >
              <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            </TouchableOpacity>

            {isCategoryBrowsingMode ? (
              // Category browsing mode - show category name
              <View style={styles.categoryHeader}>
                <Ionicons
                  name="grid-outline"
                  size={20}
                  color={COLORS.white}
                  style={styles.categoryIcon}
                />
                <ResponsiveText
                  variant="h5"
                  weight="bold"
                  color={COLORS.white}
                  style={styles.categoryTitle}
                >
                  {originalCategoryName || "Unknown Category"}
                </ResponsiveText>
              </View>
            ) : (
              // Normal search mode - show search input
              <View style={styles.searchBar}>
                <Ionicons
                  name="search"
                  size={20}
                  color={COLORS.text.light}
                  style={styles.searchIcon}
                />
                <TextInput
                  placeholder="Search for service"
                  placeholderTextColor={COLORS.text.light}
                  style={styles.searchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
              </View>
            )}
          </View>

          {/* Horizontal Filter Bar */}
          <MainFilterBar
            activeFilter={activeFilter}
            isAdvancedFilterModalVisible={isAdvancedFilterModalVisible}
            onFilterPress={handleFilterPress}
          />

          {/* Subcategory Filter Chips */}
          {selectedFilters?.category !== "all" &&
            childCategories &&
            childCategories.length > 0 && (
              <SubcategoryFilterChips
                childCategories={childCategories}
                selectedSubcategories={selectedSubcategories}
                onSubcategorySelect={handleSubcategorySelect}
              />
            )}

          {/* Sort Filter Panel */}
          <SortFilterPanel
            visible={showSortPanel}
            selectedSort={selectedFilters.sort}
            onSortSelect={handleSortSelect}
            onClose={() => setShowSortPanel(false)}
          />

          {/* Category Filter Panel */}
          <CategoryFilterPanel
            visible={showCategoryPanel}
            selectedCategory={selectedFilters?.category || "all"}
            onCategorySelect={handleCategorySelect}
            onClose={() => setShowCategoryPanel(false)}
          />

          {/* Advanced Filter Bottom Sheet */}
          <AdvancedFilterModal
            visible={isAdvancedFilterModalVisible}
            selectedFilters={selectedFilters}
            onClose={() => setIsAdvancedFilterModalVisible(false)}
            onFilterChange={handleAdvancedFilterChange}
            filterConfig={GLOBAL_SEARCH_FILTER_CONFIG}
            title="Search Filters"
          />

          {/* Scrollable Content with Infinite Loading */}
          {servicesError ? (
            <View style={styles.loadingContainer}>
              <ResponsiveText>
                Error loading services. Please try again.
              </ResponsiveText>
            </View>
          ) : (
            <FlatList
              style={styles.scrollableContent}
              data={
                servicesLoading && searchResults.length === 0
                  ? Array(6).fill(null)
                  : searchResults
              }
              renderItem={({ item, index }) =>
                servicesLoading && searchResults.length === 0 ? (
                  <ServiceCardSkeleton key={`skeleton-${index}`} />
                ) : (
                  renderServiceItem({ item })
                )
              }
              keyExtractor={(item, index) =>
                servicesLoading && searchResults.length === 0
                  ? `skeleton-${index}`
                  : `${item?.id}-${index}`
              }
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContentContainer}
              ListHeaderComponent={renderListHeader}
              ListFooterComponent={renderListFooter}
              ListEmptyComponent={renderEmptyComponent}
              onEndReached={() => {
                if (hasNextPage && !isFetchingNextPage) {
                  fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.1}
            />
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background.secondary,
  },
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING.screen,
    paddingTop: MARGIN.sm,
    paddingBottom: MARGIN.md,
    backgroundColor: COLORS.primary[200],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xxxl,
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.xs,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 24,
    marginLeft: MARGIN.md,
    marginRight: 0,
  },
  categoryHeader: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: MARGIN.sm,
  },
  categoryIcon: {
    marginRight: MARGIN.sm,
  },
  categoryTitle: {
    textAlign: "center",
  },
  searchIcon: {
    marginRight: MARGIN.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.body2,
    color: COLORS.primary[200],
  },
  promotionContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginHorizontal: PADDING.screen,
    marginTop: MARGIN.md, // Gap at top
    marginBottom: MARGIN.md, // Gap at bottom
    padding: 0, // Remove padding to let banner fill container
    overflow: "hidden", // Ensure banner respects container bounds
  },
  scrollableContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1, // Ensure container takes full height
    paddingBottom: 20, // Add some bottom padding for better UX
  },
  searchResultsContainer: {
    paddingHorizontal: PADDING.screen,
    paddingBottom: MARGIN.sm,
  },
  resultsCount: {
    marginBottom: MARGIN.xs,
  },
  loadingContainer: {
    padding: PADDING.md,
    alignItems: "center",
  },
  searchResultCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: PADDING.screen,
    height: 140,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContainer: {
    backgroundColor: "#F8F9FA",
    paddingVertical: MARGIN.sm,
  },
  imageContainer: {
    position: "relative",
    width: 160,
    height: 140,
  },
  resultImage: {
    width: "100%",
    height: "100%",
  },
  resultDetails: {
    flex: 1,
    padding: PADDING.md,
    justifyContent: "space-between",
  },
  categoryText: {
    marginBottom: 6,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  serviceTitle: {
    marginBottom: 4,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  subServicesText: {
    marginBottom: 6,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  ratingText: {
    marginLeft: 3,
    fontSize: 11,
    letterSpacing: 0.3,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  priceLabel: {
    fontSize: 11,
    letterSpacing: 0.3,
    marginRight: 4,
  },
  priceValue: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  offerBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  discountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary[500],
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountText: {
    marginLeft: 3,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.xl,
    minHeight: 300,
  },
  emptyIconContainer: {
    marginBottom: PADDING.lg,
    opacity: 0.6,
  },
  emptyTitle: {
    marginBottom: PADDING.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: PADDING.lg,
  },
  clearSearchButton: {
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary[500],
    backgroundColor: "transparent",
  },
  activeFiltersContainer: {
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.sm,
    backgroundColor: COLORS.white,
  },
  activeFiltersScroll: {
    paddingRight: PADDING.screen,
  },
  activeFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: PADDING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  activeFilterText: {
    marginRight: PADDING.xs,
    fontSize: 11,
  },
  activeFilterClose: {
    marginLeft: PADDING.xs,
  },
});
