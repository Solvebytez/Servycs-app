import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Linking,
  Share,
  Dimensions,
  Animated,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ResponsiveText,
  ResponsiveCard,
  ResponsiveButton,
  GlobalStatusBar,
} from "@/components";
import { useUser } from "@/hooks/useUser";
import { serviceService, ServiceListing } from "@/services/service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useServiceSavedStatus,
  useRemoveServiceFromList,
} from "@/hooks/useSavedLists";
import {
  useUserServiceReview,
  useToggleReviewHelpful,
  useCheckReviewHelpful,
} from "@/hooks/useServiceReviews";
import {
  ListPickerModal,
  ServiceDetailsSkeleton,
  EnquiryModal,
  AddReviewModal,
  ReviewsList,
} from "@/components/user";
import { ReviewDetailsModal } from "@/components/vendor";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "@/constants";

const { width: screenWidth } = Dimensions.get("window");

interface ServiceDetailsScreenProps {}

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: user } = useUser();
  const insets = useSafeAreaInsets();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showListPicker, setShowListPicker] = useState(false);
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [showReviewDetailsModal, setShowReviewDetailsModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<
    "services" | "reviews" | "location"
  >("services");

  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const [imageContainerHeight, setImageContainerHeight] = useState(300);

  // Calculate dynamic margin based on actual image container height
  const dynamicMarginTop = imageContainerHeight + 10; // Actual height + 20px gap

  // Fetch service details
  const {
    data: service,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["serviceDetails", id],
    queryFn: () => serviceService.getServiceListingById(id!),
    enabled: !!id,
    staleTime: 0, // always stale - triggers refetch
    gcTime: 5 * 60 * 1000, // keep in memory for 5 mins
    refetchOnMount: "always", // fetch fresh data every time
    refetchOnWindowFocus: true, // refresh when switching tabs
  });

  // Check if user owns this service
  const isOwner = user && service && user.id === service.vendor?.user?.id;
  const isVendor = user?.role === "VENDOR";
  const isUser = user?.role === "USER";

  // Debug logging
  console.log("=== SERVICE DETAILS OWNERSHIP DEBUG ===");
  console.log("User ID:", user?.id);
  console.log("Service Vendor User ID:", service?.vendor?.user?.id);
  console.log("Is Owner:", isOwner);
  console.log("Is Vendor:", isVendor);
  console.log("Is User:", isUser);
  console.log("Service Status:", service?.status);
  console.log("Service IsServiceOn:", service?.isServiceOn);
  console.log("Business Hours:", service?.businessHours);
  console.log("=====================================");

  // Check if user has already reviewed this service
  const { data: userReview, isLoading: isLoadingUserReview } =
    useUserServiceReview(id || "");
  const userHasReviewed = !!(userReview?.data && userReview.data.id);

  // Debug logging for service data
  useEffect(() => {
    if (service) {
      console.log("🔍 Service data received:", {
        title: service.title,
        rating: service.rating,
        totalReviews: service.totalReviews,
        services: service.services?.length,
        firstServiceRating: service.services?.[0]?.rating,
        firstServiceTotalReviews: service.services?.[0]?.totalReviews,
      });
    }
  }, [service]);

  // Debug logging for user review data
  useEffect(() => {
    console.log("🔍 User review data:", {
      userReview: userReview,
      userHasReviewed: userHasReviewed,
      isLoadingUserReview: isLoadingUserReview,
    });
  }, [userReview, userHasReviewed, isLoadingUserReview]);

  // Check if service is saved by user
  const { data: serviceSavedStatus, isLoading: isCheckingSavedStatus } =
    useServiceSavedStatus(user?.id || null, id || null);

  // Remove service from list mutation
  const removeServiceFromList = useRemoveServiceFromList();
  const queryClient = useQueryClient();

  // Update favorite state based on service saved status
  useEffect(() => {
    if (serviceSavedStatus?.data) {
      setIsFavorite(serviceSavedStatus.data.isSaved);
    }
  }, [serviceSavedStatus]);

  // Refresh service data when switching to reviews tab to get updated review count
  useEffect(() => {
    if (activeTab === "reviews") {
      // Invalidate service query to get fresh review statistics
      queryClient.invalidateQueries({
        queryKey: ["serviceDetails", id],
      });
    }
  }, [activeTab, queryClient, id]);

  // Handle favorite toggle
  const handleToggleFavorite = () => {
    if (isFavorite) {
      // If already in lists, show alert to remove
      Alert.alert(
        "Remove from Lists",
        "This service is saved in your lists. Would you like to remove it?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Remove",
            style: "destructive",
            onPress: async () => {
              if (!user?.id || !id || !serviceSavedStatus?.data?.savedInLists) {
                Alert.alert(
                  "Error",
                  "Unable to remove service. Please try again."
                );
                return;
              }

              try {
                // Remove service from all lists it's currently in
                const removalPromises =
                  serviceSavedStatus.data.savedInLists.map((listItem) =>
                    removeServiceFromList.mutateAsync({
                      userId: user.id,
                      listId: listItem.listId,
                      itemId: listItem.itemId,
                    })
                  );

                await Promise.all(removalPromises);

                // Invalidate cache to update heart icon immediately
                queryClient.invalidateQueries({
                  queryKey: ["serviceSavedStatus", user.id, id],
                });
                queryClient.invalidateQueries({
                  queryKey: ["savedLists"],
                });
                queryClient.invalidateQueries({
                  queryKey: ["savedListsWithServiceStatus", user.id, id],
                });

                Alert.alert("Removed", "Service removed from all lists");
              } catch (error) {
                console.error("Error removing service from lists:", error);
                Alert.alert(
                  "Error",
                  "Failed to remove service. Please try again."
                );
              }
            },
          },
        ]
      );
    } else {
      // If not in lists, show list picker
      setShowListPicker(true);
    }
  };

  // Handle share
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this service: ${service?.title}\n${service?.description}`,
        title: service?.title,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Handle edit service (vendor only)
  const handleEditService = () => {
    router.push(`/(dashboard)/(vendor)/edit-listing?id=${id}`);
  };

  // Handle toggle service status (vendor only)
  const handleToggleServiceStatus = () => {
    const isActive = service?.status === "ACTIVE";
    Alert.alert(
      "Toggle Service",
      `Are you sure you want to ${
        isActive ? "turn off" : "turn on"
      } this service?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Confirm",
          onPress: () => {
            // TODO: Implement service status toggle
            Alert.alert("Success", "Service status updated");
          },
        },
      ]
    );
  };

  // Handle add/edit review
  const handleAddReview = () => {
    console.log("🔍 Opening review modal with data:", {
      userHasReviewed,
      existingReview: userReview?.data,
      isEditing: userHasReviewed,
    });
    setShowAddReviewModal(true);
  };

  // Handle review item click
  const handleReviewPress = (review: any) => {
    console.log("🔍 Opening review details for:", review);
    setSelectedReview(review);
    setShowReviewDetailsModal(true);
  };

  // Helpful functionality
  const toggleHelpfulMutation = useToggleReviewHelpful();
  const { data: helpfulData } = useCheckReviewHelpful(selectedReview?.id || "");
  const isHelpful = helpfulData?.data?.isHelpful || false;

  // Handle helpful vote toggle
  const handleHelpfulToggle = (reviewId: string) => {
    if (user) {
      toggleHelpfulMutation.mutate(reviewId, {
        onSuccess: (data) => {
          // Update the selectedReview with new helpful count
          if (selectedReview && selectedReview.id === reviewId) {
            setSelectedReview((prev: any) => ({
              ...prev,
              helpfulCount: data.data.helpfulCount,
            }));
          }
        },
      });
    }
  };

  // Handle review submitted successfully
  const handleReviewSubmitted = () => {
    // Refresh the service data to get updated review count
    queryClient.invalidateQueries({
      queryKey: ["serviceDetails", id],
    });
  };

  // Handle enquiry
  const handleEnquiry = () => {
    setShowEnquiryModal(true);
  };

  // Get price range from services
  const getPriceRange = () => {
    if (!service?.services || service.services.length === 0) return "N/A";

    // Filter out null/undefined prices
    const validPrices = service.services
      .map((s) => s.price)
      .filter(
        (price): price is number =>
          price !== null && price !== undefined && !isNaN(price)
      );

    if (validPrices.length === 0) {
      return "N/A";
    }

    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);

    if (minPrice === maxPrice) {
      return `₹${minPrice}`;
    } else {
      return `₹${minPrice} - ₹${maxPrice}`;
    }
  };

  // Get service count
  const getServiceCount = () => {
    return service?.services?.length || 0;
  };

  // Get status color (matching listing card logic)
  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return COLORS.success[600];
      case "INACTIVE":
        return COLORS.error[600];
      case "PENDING":
        return COLORS.warning[600];
      case "REJECTED":
        return COLORS.error[700];
      default:
        return COLORS.text.secondary;
    }
  };

  // Animation calculations
  const imageScale = scrollY.interpolate({
    inputRange: [0, imageContainerHeight],
    outputRange: [1.2, 1],
    extrapolate: "clamp",
  });

  const imageOpacity = scrollY.interpolate({
    inputRange: [0, imageContainerHeight * 0.7],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const headerBackgroundOpacity = scrollY.interpolate({
    inputRange: [imageContainerHeight - 50, imageContainerHeight],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 0],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [imageContainerHeight - 30, imageContainerHeight],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Loading state
  if (isLoading || !service) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[200]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <ServiceDetailsSkeleton />
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !service) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[200]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <View style={styles.container}>
            <View style={styles.errorContainer}>
              <ResponsiveText variant="h6" color={COLORS.error[600]}>
                Failed to load service details
              </ResponsiveText>
              <ResponsiveButton
                title="Try Again"
                variant="primary"
                onPress={() => router.back()}
                style={styles.retryButton}
              />
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
        backgroundColor={COLORS.primary[200]}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Fixed Header Overlay */}
          <Animated.View
            style={[
              styles.fixedHeaderOverlay,
              {
                backgroundColor: headerBackgroundOpacity.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["transparent", COLORS.primary[200]],
                  extrapolate: "clamp",
                }),
                transform: [{ translateY: headerTranslateY }],
                paddingTop: insets.top + MARGIN.md,
                paddingBottom: MARGIN.xs + 5,
              },
            ]}
          >
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={20} color={COLORS.white} />
              </TouchableOpacity>

              <Animated.View
                style={[styles.headerTitleContainer, { opacity: titleOpacity }]}
              >
                <ResponsiveText
                  variant="h5"
                  weight="bold"
                  color={COLORS.white}
                  numberOfLines={1}
                >
                  {service?.title || "Service Details"}
                </ResponsiveText>
              </Animated.View>
            </View>

            <View style={styles.headerRight}>
              {/* <TouchableOpacity
                style={styles.headerIconButton}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={20} color={COLORS.white} />
              </TouchableOpacity> */}
              {!isOwner && (
                <TouchableOpacity
                  style={styles.headerIconButton}
                  onPress={handleToggleFavorite}
                  disabled={
                    !user ||
                    isCheckingSavedStatus ||
                    removeServiceFromList.isPending
                  }
                >
                  {isCheckingSavedStatus || removeServiceFromList.isPending ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={20}
                      color={isFavorite ? COLORS.error[500] : COLORS.white}
                    />
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>

          {/* Fixed Image Container */}
          {service.image && (
            <View
              style={styles.fixedImageContainer}
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setImageContainerHeight(height);
              }}
            >
              <Animated.Image
                source={{ uri: service.image }}
                style={[
                  styles.serviceImage,
                  {
                    transform: [{ scale: imageScale }],
                    opacity: imageOpacity,
                  },
                ]}
              />
            </View>
          )}

          {/* Conditional Content Based on Active Tab */}
          {activeTab === "reviews" ? (
            // Reviews tab - use same ScrollView structure as other tabs
            <Animated.ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
              onScrollEndDrag={(event) => {
                // This will be handled by ReviewsList component internally
              }}
            >
              {/* Service Details Card */}
              <View
                style={[styles.detailsCard, { marginTop: dynamicMarginTop }]}
              >
                {/* Title and Price Range */}
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <ResponsiveText variant="h3" style={styles.serviceTitle}>
                      {service.title}
                    </ResponsiveText>
                    {/* Service Status - Owner Only */}
                    {isOwner && (
                      <View
                        style={[
                          styles.statusContainer,
                          {
                            backgroundColor:
                              getStatusColor(service.status) + "80",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: getStatusColor(service.status),
                            },
                          ]}
                        />
                        <ResponsiveText
                          variant="caption2"
                          weight="medium"
                          color={COLORS.white}
                          style={styles.statusText}
                        >
                          {service.status.charAt(0).toUpperCase() +
                            service.status.slice(1).toLowerCase()}
                        </ResponsiveText>
                      </View>
                    )}
                  </View>
                  <View style={styles.priceRangeContainer}>
                    <ResponsiveText variant="h5" style={styles.priceRange}>
                      {getPriceRange()}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="caption1"
                      style={styles.priceRangeLabel}
                    >
                      Price Range
                    </ResponsiveText>
                  </View>
                </View>

                {/* Rating and Status */}
                <View style={styles.ratingRow}>
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name="star"
                          size={16}
                          color={
                            star <= (service.rating || 0)
                              ? "#FF8C00"
                              : COLORS.neutral[300]
                          }
                        />
                      ))}
                    </View>
                    <ResponsiveText variant="body2" style={styles.ratingText}>
                      {service.rating?.toFixed(1) || "0.0"} (
                      {service.totalReviews || 0} reviews)
                    </ResponsiveText>
                  </View>
                  <View style={styles.statsContainer}>
                    <ResponsiveText variant="body2" style={styles.statusText}>
                      {service.status === "ACTIVE" ? "Open Now" : "Closed"}
                    </ResponsiveText>
                  </View>
                </View>

                {/* Description */}
                <ResponsiveText variant="body1" style={styles.description}>
                  {service.description}
                </ResponsiveText>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      (activeTab as any) === "services" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("services")}
                  >
                    <ResponsiveText
                      variant="body2"
                      style={[
                        styles.tabText,
                        (activeTab as any) === "services" &&
                          styles.activeTabText,
                      ]}
                    >
                      Services {getServiceCount()}
                    </ResponsiveText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      (activeTab as any) === "reviews" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("reviews")}
                  >
                    <ResponsiveText
                      variant="body2"
                      style={[
                        styles.tabText,
                        (activeTab as any) === "reviews" &&
                          styles.activeTabText,
                      ]}
                    >
                      Reviews ({service.totalReviews || 0})
                    </ResponsiveText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      (activeTab as any) === "location" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("location")}
                  >
                    <ResponsiveText
                      variant="body2"
                      style={[
                        styles.tabText,
                        (activeTab as any) === "location" &&
                          styles.activeTabText,
                      ]}
                    >
                      Location
                    </ResponsiveText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Reviews List - Now inside ScrollView */}
              <ReviewsList
                listingId={id || ""}
                onReviewSubmitted={handleReviewSubmitted}
                onReviewPress={handleReviewPress}
              />
            </Animated.ScrollView>
          ) : (
            // Other tabs - use existing ScrollView
            <Animated.ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { y: scrollY } } }],
                { useNativeDriver: true }
              )}
              scrollEventThrottle={16}
            >
              {/* Service Details Card */}
              <View
                style={[styles.detailsCard, { marginTop: dynamicMarginTop }]}
              >
                {/* Title and Price Range */}
                <View style={styles.titleRow}>
                  <View style={styles.titleContainer}>
                    <ResponsiveText variant="h3" style={styles.serviceTitle}>
                      {service.title}
                    </ResponsiveText>
                    {/* Service Status - Owner Only */}
                    {isOwner && (
                      <View
                        style={[
                          styles.statusContainer,
                          {
                            backgroundColor:
                              getStatusColor(service.status) + "80",
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: getStatusColor(service.status),
                            },
                          ]}
                        />
                        <ResponsiveText
                          variant="caption2"
                          weight="medium"
                          color={COLORS.white}
                          style={styles.statusText}
                        >
                          {service.status.charAt(0).toUpperCase() +
                            service.status.slice(1).toLowerCase()}
                        </ResponsiveText>
                      </View>
                    )}
                  </View>
                  <View style={styles.priceRangeContainer}>
                    <ResponsiveText variant="h5" style={styles.priceRange}>
                      {getPriceRange()}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="caption1"
                      style={styles.priceRangeLabel}
                    >
                      Price Range
                    </ResponsiveText>
                  </View>
                </View>

                {/* Rating and Status */}
                <View style={styles.ratingRow}>
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsContainer}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name="star"
                          size={16}
                          color={
                            star <= (service.rating || 0)
                              ? "#FF8C00"
                              : COLORS.neutral[300]
                          }
                          style={styles.star}
                        />
                      ))}
                    </View>
                    <ResponsiveText variant="body2" style={styles.ratingText}>
                      {service.rating?.toFixed(1) || "0.0"} (
                      {service.totalReviews || 0} reviews)
                    </ResponsiveText>
                  </View>
                  <ResponsiveText variant="body2" style={styles.statusText}>
                    {service.status === "ACTIVE" ? "Open Now" : "Closed"}
                  </ResponsiveText>
                </View>

                {/* Description */}
                <ResponsiveText variant="body1" style={styles.description}>
                  {service.description}
                </ResponsiveText>

                {/* Tabs */}
                <View style={styles.tabsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tab,
                      (activeTab as any) === "services" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("services")}
                  >
                    <ResponsiveText
                      variant="body2"
                      style={[
                        styles.tabText,
                        (activeTab as any) === "services" &&
                          styles.activeTabText,
                      ]}
                    >
                      Services {getServiceCount()}
                    </ResponsiveText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      (activeTab as any) === "reviews" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("reviews")}
                  >
                    <ResponsiveText
                      variant="body2"
                      style={[
                        styles.tabText,
                        (activeTab as any) === "reviews" &&
                          styles.activeTabText,
                      ]}
                    >
                      Reviews ({service.totalReviews || 0})
                    </ResponsiveText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tab,
                      (activeTab as any) === "location" && styles.activeTab,
                    ]}
                    onPress={() => setActiveTab("location")}
                  >
                    <ResponsiveText
                      variant="body2"
                      style={[
                        styles.tabText,
                        (activeTab as any) === "location" &&
                          styles.activeTabText,
                      ]}
                    >
                      Location
                    </ResponsiveText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Services List */}
              {activeTab === "services" && (
                <View style={styles.servicesList}>
                  {service.services?.map((serviceItem, index) => (
                    <View key={serviceItem.id} style={styles.serviceItem}>
                      <View style={styles.serviceInfo}>
                        <ResponsiveText variant="h6" style={styles.serviceName}>
                          {serviceItem.name}
                        </ResponsiveText>
                        <ResponsiveText
                          variant="body2"
                          style={styles.serviceDescription}
                        >
                          {serviceItem.description}
                        </ResponsiveText>

                        <View style={styles.serviceMeta}>
                          <View style={styles.metaItem}>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={COLORS.text.secondary}
                            />
                            <ResponsiveText
                              variant="caption1"
                              style={styles.metaText}
                            >
                              {serviceItem.duration || "N/A"} min.
                            </ResponsiveText>
                          </View>
                          {/* Categories */}
                          {serviceItem.categoryPaths &&
                          serviceItem.categoryPaths.length > 0 ? (
                            <View style={styles.categoriesContainer}>
                              {serviceItem.categoryPaths.map(
                                (categoryPath: string[], index: number) => (
                                  <View key={index} style={styles.categoryItem}>
                                    <View style={styles.categoryDot} />
                                    <ResponsiveText
                                      variant="caption1"
                                      style={styles.metaText}
                                    >
                                      {categoryPath?.join(" > ") || "Service"}
                                    </ResponsiveText>
                                  </View>
                                )
                              )}
                            </View>
                          ) : (
                            <View style={styles.metaItem}>
                              <View style={styles.categoryDot} />
                              <ResponsiveText
                                variant="caption1"
                                style={styles.metaText}
                              >
                                Service
                              </ResponsiveText>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.servicePriceContainer}>
                        <ResponsiveText
                          variant="h6"
                          style={styles.servicePrice}
                        >
                          {serviceItem.price !== null &&
                          serviceItem.price !== undefined &&
                          !isNaN(serviceItem.price)
                            ? `₹${serviceItem.price}`
                            : "N/A"}
                        </ResponsiveText>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Location Tab Content */}
              {activeTab === "location" && (
                <View style={styles.tabContent}>
                  {service.address && (
                    <View style={styles.locationContent}>
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color={COLORS.primary[600]}
                      />
                      <ResponsiveText
                        variant="body2"
                        style={styles.addressText}
                      >
                        {service.address.address}
                      </ResponsiveText>
                    </View>
                  )}
                </View>
              )}

              {/* Additional Service Information */}
              {service.description && service.description.length > 100 && (
                <View style={styles.additionalContent}>
                  <ResponsiveText variant="h5" style={styles.sectionTitle}>
                    About This Service
                  </ResponsiveText>
                  <ResponsiveText variant="body1" style={styles.contentText}>
                    {service.description}
                  </ResponsiveText>
                </View>
              )}

              {/* Vendor Information */}
              {service.vendor &&
                (service.vendor.businessPhone ||
                  service.vendor.businessEmail) && (
                  <View style={styles.additionalContent}>
                    <ResponsiveText variant="h5" style={styles.sectionTitle}>
                      About {service.vendor.businessName}
                    </ResponsiveText>
                    {service.vendor.businessPhone && (
                      <ResponsiveText
                        variant="body1"
                        style={styles.contentText}
                      >
                        Contact: {service.vendor.businessPhone}
                      </ResponsiveText>
                    )}
                    {service.vendor.businessEmail && (
                      <ResponsiveText
                        variant="body1"
                        style={styles.contentText}
                      >
                        Email: {service.vendor.businessEmail}
                      </ResponsiveText>
                    )}
                  </View>
                )}

              {/* Business Hours */}
              {service.businessHours && (
                <View style={styles.additionalContent}>
                  <ResponsiveText variant="h5" style={styles.sectionTitle}>
                    Business Hours
                  </ResponsiveText>
                  <View style={styles.businessHoursContainer}>
                    {Object.entries(service.businessHours).map(
                      ([day, hours]) => (
                        <View key={day} style={styles.businessHourItem}>
                          <ResponsiveText
                            variant="body2"
                            style={styles.dayText}
                          >
                            {day.charAt(0).toUpperCase() + day.slice(1)}
                          </ResponsiveText>
                          <ResponsiveText
                            variant="body2"
                            style={[
                              styles.hoursText,
                              {
                                color: hours.isOpen
                                  ? COLORS.text.primary
                                  : COLORS.text.secondary,
                              },
                            ]}
                          >
                            {hours.isOpen
                              ? `${hours.openTime} - ${hours.closeTime}`
                              : "Closed"}
                          </ResponsiveText>
                        </View>
                      )
                    )}
                  </View>
                </View>
              )}

              {/* Service Statistics */}
              <View style={styles.additionalContent}>
                <ResponsiveText variant="h5" style={styles.sectionTitle}>
                  Service Statistics
                </ResponsiveText>
                <View style={styles.statsContainer}>
                  <View style={styles.statItem}>
                    <ResponsiveText variant="h6" style={styles.statNumber}>
                      {service.totalBookings || 0}
                    </ResponsiveText>
                    <ResponsiveText variant="body2" style={styles.statLabel}>
                      Total Bookings
                    </ResponsiveText>
                  </View>
                  <View style={styles.statItem}>
                    <ResponsiveText variant="h6" style={styles.statNumber}>
                      {service.totalReviews || 0}
                    </ResponsiveText>
                    <ResponsiveText variant="body2" style={styles.statLabel}>
                      Reviews
                    </ResponsiveText>
                  </View>
                  <View style={styles.statItem}>
                    <ResponsiveText variant="h6" style={styles.statNumber}>
                      {service.rating?.toFixed(1) || "0.0"}
                    </ResponsiveText>
                    <ResponsiveText variant="body2" style={styles.statLabel}>
                      Rating
                    </ResponsiveText>
                  </View>
                </View>
              </View>

              {/* Bottom Spacing */}
            </Animated.ScrollView>
          )}

          {/* Bottom Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            {/* Owner Actions - Own Service (regardless of current role) */}
            {isOwner && (
              <View style={styles.actionButtons}>
                {/* Turn On/Off button - only for ACTIVE services */}
                {service.status === "ACTIVE" && (
                  <ResponsiveButton
                    title={service.isServiceOn ? "Turn Off" : "Turn On"}
                    variant="outline"
                    size="small"
                    onPress={handleToggleServiceStatus}
                    style={styles.enquiryButton}
                  />
                )}
                {/* Edit Service button - available for ACTIVE and PENDING services */}
                {(service.status === "ACTIVE" ||
                  service.status === "PENDING") && (
                  <ResponsiveButton
                    title="Edit Service"
                    variant="primary"
                    size="small"
                    onPress={handleEditService}
                    style={styles.bookButton}
                  />
                )}
              </View>
            )}

            {/* User Actions - Other's Service */}
            {!isOwner && isUser && (
              <View style={styles.actionButtons}>
                <ResponsiveButton
                  title="Enquiry Now"
                  variant="outline"
                  size="small"
                  onPress={handleEnquiry}
                  style={styles.enquiryButton}
                />
                <ResponsiveButton
                  title={userHasReviewed ? "Edit Review" : "Add Review"}
                  variant="primary"
                  size="small"
                  onPress={handleAddReview}
                  style={styles.bookButton}
                />
              </View>
            )}

            {/* Vendor Actions - Other's Service */}
            {!isOwner && isVendor && (
              <View style={styles.actionButtons}>
                <ResponsiveButton
                  title="Enquiry Now"
                  variant="outline"
                  size="small"
                  onPress={handleEnquiry}
                  style={styles.enquiryButton}
                />
                <ResponsiveButton
                  title={userHasReviewed ? "Edit Review" : "Add Review"}
                  variant="primary"
                  size="small"
                  onPress={handleAddReview}
                  style={styles.bookButton}
                />
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* List Picker Modal */}
      {user && id && (
        <ListPickerModal
          visible={showListPicker}
          onClose={() => setShowListPicker(false)}
          serviceId={id}
          serviceTitle={service?.title || "Service"}
          userId={user.id}
        />
      )}

      {/* Enquiry Modal */}
      <EnquiryModal
        visible={showEnquiryModal}
        onClose={() => setShowEnquiryModal(false)}
        serviceTitle={service?.title || "Service"}
        contactNumber={service?.vendor?.businessPhone || service?.contactNumber}
        whatsappNumber={
          service?.vendor?.businessPhone || service?.whatsappNumber
        }
      />

      {/* Add/Edit Review Modal */}
      {user && service && (
        <AddReviewModal
          visible={showAddReviewModal}
          onClose={() => setShowAddReviewModal(false)}
          serviceTitle={service.title}
          serviceId={service.services?.[0]?.id || ""}
          listingId={service.id}
          vendorId={service.vendorId}
          userId={user.id}
          onReviewSubmitted={handleReviewSubmitted}
          existingReview={userReview?.data}
          isEditing={userHasReviewed}
        />
      )}

      {/* Review Details Modal */}
      <ReviewDetailsModal
        visible={showReviewDetailsModal}
        review={selectedReview}
        onClose={() => {
          setShowReviewDetailsModal(false);
          setSelectedReview(null);
        }}
        onHelpful={handleHelpfulToggle}
        isHelpful={isHelpful}
        isTogglingHelpful={toggleHelpfulMutation.isPending}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.lg,
  },
  retryButton: {
    marginTop: MARGIN.md,
  },
  scrollView: {
    flex: 1,
    zIndex: 2,
  },
  scrollContent: {
    paddingBottom: 20, // Small bottom spacing
  },

  // Image Section
  imageContainer: {
    position: "relative",
    height: 300,
  },
  fixedImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 0,
  },
  fixedHeaderOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING.screen,
    zIndex: 3,
    backgroundColor: "transparent",
  },
  serviceImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: 12,
    marginRight: 12,
  },
  headerRight: {
    flexDirection: "row",
    gap: 10,
    flexShrink: 0,
  },
  headerIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDots: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  activeDot: {
    backgroundColor: COLORS.black,
  },

  // Details Card
  detailsCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  titleContainer: {
    flex: 1,
    marginRight: 20,
  },
  serviceTitle: {
    color: COLORS.text.primary,
    fontWeight: "bold",
    fontSize: 24,
    lineHeight: 28,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  statusLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.white,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priceRangeContainer: {
    alignItems: "flex-end",
  },
  priceRange: {
    color: COLORS.primary[200],
    fontWeight: "bold",
    fontSize: 18,
  },
  priceRangeLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 8,
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    color: COLORS.text.secondary,
    fontSize: 14,
  },
  description: {
    color: COLORS.text.secondary,
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 20,
  },

  // Tabs
  tabsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
    backgroundColor: COLORS.white,
  },
  activeTab: {
    backgroundColor: COLORS.primary[200],
  },
  tabText: {
    color: COLORS.primary[200],
    fontSize: 14,
    fontWeight: "500",
  },
  activeTabText: {
    color: COLORS.white,
  },

  // Services List
  servicesList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  serviceInfo: {
    flex: 1,
    marginRight: 16,
  },
  serviceName: {
    color: COLORS.text.primary,
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 4,
  },
  serviceDescription: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 8,
  },
  serviceMeta: {
    flexDirection: "row",
    gap: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary[200],
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  servicePriceContainer: {
    alignItems: "flex-end",
  },
  servicePrice: {
    color: COLORS.primary[200],
    fontWeight: "bold",
    fontSize: 16,
  },

  // Tab Content
  tabContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tabPlaceholder: {
    color: COLORS.text.secondary,
    textAlign: "center",
    paddingVertical: 40,
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 20,
  },
  addressText: {
    flex: 1,
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Additional Content
  additionalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
    marginTop: 20,
  },
  contentText: {
    color: COLORS.text.secondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  reviewItem: {
    backgroundColor: COLORS.neutral[50],
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  reviewerName: {
    color: COLORS.text.primary,
    fontWeight: "600",
    fontSize: 16,
  },
  reviewStars: {
    flexDirection: "row",
    gap: 2,
  },
  reviewText: {
    color: COLORS.text.secondary,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
  reviewDate: {
    color: COLORS.text.light,
    fontSize: 12,
    marginTop: 4,
  },

  // Business Hours
  businessHoursContainer: {
    marginTop: MARGIN.sm,
  },
  businessHourItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: MARGIN.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  dayText: {
    color: COLORS.text.primary,
    fontWeight: "500",
    fontSize: 14,
    minWidth: 80,
  },
  hoursText: {
    fontSize: 14,
    fontWeight: "400",
  },

  // Stats Container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: MARGIN.md,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    color: COLORS.primary[200],
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 4,
  },
  statLabel: {
    color: COLORS.text.secondary,
    fontSize: 12,
    textAlign: "center",
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 20,
  },

  // Reviews Container
  reviewsContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },

  // Action Buttons
  actionButtonsContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.md,
    paddingBottom: 34, // Safe area bottom
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  actionButtons: {
    flexDirection: "row",
    gap: MARGIN.sm,
  },
  enquiryButton: {
    flex: 1,
  },
  bookButton: {
    flex: 1,
  },
});
