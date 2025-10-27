import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  SPACING,
  BORDER_RADIUS,
} from "../../../constants";
import { GlobalStatusBar } from "../../../components/StatusBar";
import {
  ResponsiveText,
  ResponsiveCard,
  VendorMetricsCards,
  LatestReviews,
  UserProfileButton,
  ReviewDetailsModal,
} from "../../../components";
import { userService, UserProfile } from "../../../services/user";
import { serviceService } from "../../../services/service";
import { useUser } from "../../../hooks/useUser";
import { useVendorLatestReviews } from "../../../hooks/useVendorReviews";
import { useVendorMetrics } from "@/hooks/useVendorMetrics";
import ReviewSkeleton from "../../../components/vendor/ReviewSkeleton";

export default function VendorDashboardScreen() {
  const router = useRouter();
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Use React Query to fetch user data
  const { data: user, isLoading: isLoadingUser, error } = useUser();

  // Fetch vendor's latest reviews
  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    error: reviewsError,
  } = useVendorLatestReviews(user?.id || "");

  // Handle profile button press
  const handleProfilePress = () => {
    router.push("/(dashboard)/(vendor)/profile");
  };

  // Handle service press - navigate to service details
  const handleServicePress = (serviceId: string) => {
    router.push(`/(dashboard)/service-details?id=${serviceId}`);
  };

  // Vendor metrics (from API)
  const { data: metricsData } = useVendorMetrics("7d");
  const cards = metricsData?.data?.cards;
  // Compute composite growth for header tagline
  const growthValues: number[] = [
    cards?.listings?.growthPercent,
    cards?.enquiries?.growthPercent,
    cards?.reviews?.growthPercent,
    cards?.promotions?.growthPercent,
  ].filter((v) => typeof v === "number" && !isNaN(v as any)) as number[];
  const compositeGrowth =
    growthValues.length > 0
      ? Math.round(
          (growthValues.reduce((sum, v) => sum + v, 0) / growthValues.length) *
            10
        ) / 10
      : undefined;

  const toTitleCase = (value: string): string => {
    if (!value) return value as any;
    return value
      .split(" ")
      .filter((w) => w.length > 0)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const rawBusinessName =
    (user as any)?.vendor?.businessName ||
    (user as any)?.name ||
    "Your Business";
  const businessName = toTitleCase(String(rawBusinessName));

  // Determine top-performing service/listing title (lifetime fallback)
  const [topServiceTitle, setTopServiceTitle] = useState<string | undefined>(
    undefined
  );

  useEffect(() => {
    let isMounted = true;
    const loadTopService = async () => {
      try {
        const listings = await serviceService.getMyServiceListings();
        if (!listings || listings.length === 0) {
          if (isMounted) setTopServiceTitle(undefined);
          return;
        }
        // Prefer highest totalBookings; tie-break by totalReviews; then most recent
        const sorted = [...listings].sort((a: any, b: any) => {
          const byBookings = (b.totalBookings || 0) - (a.totalBookings || 0);
          if (byBookings !== 0) return byBookings;
          const byReviews = (b.totalReviews || 0) - (a.totalReviews || 0);
          if (byReviews !== 0) return byReviews;
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        });
        const title = sorted[0]?.title || undefined;
        if (isMounted)
          setTopServiceTitle(title ? toTitleCase(title) : undefined);
      } catch (e) {
        if (isMounted) setTopServiceTitle(undefined);
      }
    };
    loadTopService();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const headerMessage = (() => {
    // Milestone overrides
    if (cards?.listings?.value === 1 && (cards?.listings?.current || 0) > 0) {
      return { emoji: "🎉", text: "Your first listing is live!" };
    }
    if (cards?.promotions?.value === 1) {
      return { emoji: "🎯", text: "Your first promotion is active!" };
    }
    if (cards?.reviews?.value === 1) {
      return { emoji: "⭐", text: "You received your first review!" };
    }

    // Growth-based messages
    if (compositeGrowth === undefined) {
      return { emoji: "👋", text: "Welcome to your dashboard." };
    }
    if (compositeGrowth >= 20) {
      return { emoji: "🎉", text: "Your business is growing fast!" };
    }
    if (compositeGrowth >= 5) {
      return { emoji: "📈", text: "Your business is growing up!" };
    }
    if (compositeGrowth > -5) {
      return { emoji: "⚖️", text: "Steady performance this week." };
    }
    if (compositeGrowth >= -15) {
      return { emoji: "🧭", text: "Small dip; let’s keep momentum." };
    }
    return { emoji: "🔧", text: "Performance down; consider new promotions." };
  })();
  const vendorMetrics = [
    {
      id: "1",
      title: "My Listing",
      value: String(cards?.listings?.value ?? 0),
      growth: `${cards?.listings?.growthPercent ?? 0}%`,
      icon: "list",
      color: "#8B5CF6", // Purple
    },
    {
      id: "2",
      title: "Enquiries",
      value: String(cards?.enquiries?.value ?? 0),
      growth: `${cards?.enquiries?.growthPercent ?? 0}%`,
      icon: "chatbubble",
      color: "#F59E0B", // Yellow
    },
    {
      id: "3",
      title: "Total reviews",
      value: String(cards?.reviews?.value ?? 0),
      growth: `${cards?.reviews?.growthPercent ?? 0}%`,
      icon: "star",
      color: "#F97316", // Orange
    },
    {
      id: "4",
      title: "Your Promotions",
      value: String(cards?.promotions?.value ?? 0),
      growth: `${cards?.promotions?.growthPercent ?? 0}%`,
      icon: "megaphone",
      color: "#3B82F6", // Blue
    },
  ];

  // Transform API data to match component interface
  const latestReviews =
    reviewsData?.data?.reviews?.map((review) => ({
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
    })) || [];

  return (
    <>
      <GlobalStatusBar />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Header Section with Gradient */}
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
                <UserProfileButton
                  user={
                    user
                      ? {
                          name: (user as any).name,
                          avatar: (user as any).avatar,
                        }
                      : undefined
                  }
                  size={40}
                  onPress={handleProfilePress}
                />
              </View>
            </View>

            {/* Business Name and Growth Message */}
            <View style={styles.businessInfo}>
              <View style={styles.businessNameContainer}>
                <ResponsiveText
                  variant="h3"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.businessName}
                >
                  {topServiceTitle || businessName}
                </ResponsiveText>
                <ResponsiveText variant="h3" style={styles.celebrationEmoji}>
                  {headerMessage.emoji}
                </ResponsiveText>
              </View>
              <View style={styles.growthMessage}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={COLORS.success[500]}
                />
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.growthText}
                >
                  {headerMessage.text}
                </ResponsiveText>
              </View>
            </View>
          </LinearGradient>

          {/* Main Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Metrics Cards Grid */}
            <VendorMetricsCards
              metrics={vendorMetrics}
              onMetricPress={(metric) => {
                if (metric.id === "1") {
                  // Navigate to My List screen when "My Listing" card is pressed
                  router.push("/(dashboard)/(vendor)/my-list");
                } else if (metric.id === "4") {
                  // Navigate to My Promotions screen when "Your Promotions" card is pressed
                  router.push("/(dashboard)/(vendor)/my-promotions");
                }
              }}
            />

            {/* Latest Reviews */}
            {isLoadingReviews ? (
              <ReviewSkeleton count={3} />
            ) : reviewsError ? (
              <View style={styles.errorContainer}>
                <View style={styles.errorIconContainer}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={48}
                    color={COLORS.error[500]}
                  />
                </View>
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
            ) : latestReviews.length > 0 ? (
              <LatestReviews
                reviews={latestReviews}
                onViewAll={() => router.push("/(dashboard)/(vendor)/reviews")}
                onReviewPress={(review) => {
                  setSelectedReview(review);
                  setIsModalVisible(true);
                }}
                onHelpful={(review) => {
                  // Handle helpful action
                }}
                onServicePress={handleServicePress}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconContainer}>
                  <Ionicons
                    name="star-outline"
                    size={48}
                    color={COLORS.neutral[300]}
                  />
                </View>
                <ResponsiveText
                  variant="h6"
                  color={COLORS.text.primary}
                  style={styles.emptyTitle}
                >
                  No Reviews Yet
                </ResponsiveText>
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.emptyDescription}
                >
                  Reviews will appear here once customers start reviewing your
                  services.
                </ResponsiveText>
              </View>
            )}

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
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  businessInfo: {
    paddingHorizontal: PADDING.screen,
    marginTop: MARGIN.sm,
  },
  businessNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  businessName: {
    flex: 1,
  },
  celebrationEmoji: {
    marginLeft: MARGIN.sm,
  },
  growthMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  growthText: {
    marginLeft: MARGIN.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
  },
  bottomSpacing: {
    height: 100,
  },
  errorContainer: {
    backgroundColor: COLORS.white,
    padding: PADDING.xl,
    marginHorizontal: PADDING.screen,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: MARGIN.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
  },
  errorIconContainer: {
    marginBottom: MARGIN.md,
    opacity: 0.8,
  },
  errorTitle: {
    textAlign: "center",
    marginBottom: MARGIN.sm,
    fontWeight: "600",
  },
  errorDescription: {
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    padding: PADDING.xl,
    marginHorizontal: PADDING.screen,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: MARGIN.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
  },
  emptyIconContainer: {
    marginBottom: MARGIN.md,
    opacity: 0.6,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: MARGIN.sm,
    fontWeight: "600",
  },
  emptyDescription: {
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  bottomNavigation: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: PADDING.sm,
    paddingHorizontal: PADDING.screen,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: {
    alignItems: "center",
    paddingVertical: PADDING.xs,
    paddingHorizontal: PADDING.sm,
    flex: 1,
  },
  activeNavItem: {
    // Active state styling is handled by icon and text colors
  },
});
