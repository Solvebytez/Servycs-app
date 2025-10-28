import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  SPACING,
  BORDER_RADIUS,
} from "../../../constants";
import { ResponsiveText, ResponsiveCard } from "@/components";
import { usePromotionDetails } from "../../../hooks/usePromotions";
import { PromotionDetails } from "../../../services/promotion";

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function PromotionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [refreshing, setRefreshing] = React.useState(false);

  const {
    data: promotion,
    isLoading,
    error,
    refetch,
  } = usePromotionDetails(id || "");

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing promotion details:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleServicePress = (serviceId: string) => {
    router.push(`/(dashboard)/service-details?id=${serviceId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getDiscountText = (promotion: PromotionDetails) => {
    if (promotion.discountType === "FIXED") {
      return `₹${promotion.discountValue} OFF`;
    } else {
      return `${promotion.discountValue}% OFF`;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Ionicons key={i} name="star" size={12} color={COLORS.warning[500]} />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons
          key="half"
          name="star-half"
          size={12}
          color={COLORS.warning[500]}
        />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={12}
          color={COLORS.neutral[300]}
        />
      );
    }

    return stars;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[500]} />
          <ResponsiveText variant="body1" style={styles.loadingText}>
            Loading promotion details...
          </ResponsiveText>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !promotion) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
        />
        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={64} color={COLORS.error[500]} />
          </View>
          <ResponsiveText variant="h3" weight="bold" style={styles.errorTitle}>
            Promotion Not Found
          </ResponsiveText>
          <ResponsiveText variant="body1" style={styles.errorMessage}>
            This promotion may have expired or is no longer available.
          </ResponsiveText>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
            <ResponsiveText
              variant="body1"
              weight="medium"
              color={COLORS.white}
            >
              Go Back
            </ResponsiveText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary[500]}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary[500]]}
            tintColor={COLORS.primary[500]}
          />
        }
      >
        {/* Hero Section with Banner */}
        <View style={styles.heroContainer}>
          {promotion.bannerImage ? (
            <Image
              source={{ uri: promotion.bannerImage }}
              style={styles.bannerImage}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={[
                COLORS.primary[500],
                COLORS.primary[600],
                COLORS.primary[700],
              ]}
              style={styles.bannerGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="gift" size={48} color={COLORS.white} />
            </LinearGradient>
          )}

          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.white} />
          </TouchableOpacity>

          {/* Discount Badge */}
          <View style={styles.discountBadge}>
            <ResponsiveText
              variant="caption1"
              weight="bold"
              color={COLORS.white}
            >
              {getDiscountText(promotion)}
            </ResponsiveText>
          </View>

          {/* Overlay Gradient */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.3)"]}
            style={styles.overlayGradient}
          />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Promotion Header */}
          <View style={styles.promotionHeader}>
            <ResponsiveText
              variant="h2"
              weight="bold"
              style={styles.promotionTitle}
            >
              {promotion.title}
            </ResponsiveText>

            {promotion.description && (
              <ResponsiveText
                variant="body1"
                style={styles.promotionDescription}
              >
                {promotion.description}
              </ResponsiveText>
            )}

            {/* Validity Period Card */}
            <ResponsiveCard style={styles.validityCard}>
              <View style={styles.validityHeader}>
                <Ionicons name="time" size={20} color={COLORS.primary[500]} />
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  style={styles.validityTitle}
                >
                  Valid Period
                </ResponsiveText>
              </View>
              <View style={styles.validityDates}>
                <View style={styles.validityItem}>
                  <View style={styles.validityIconContainer}>
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={COLORS.success[500]}
                    />
                  </View>
                  <View style={styles.validityTextContainer}>
                    <ResponsiveText
                      variant="caption1"
                      style={styles.validityLabel}
                    >
                      Starts
                    </ResponsiveText>
                    <ResponsiveText variant="body2" weight="medium">
                      {formatDate(promotion.startDate)}
                    </ResponsiveText>
                  </View>
                </View>
                <View style={styles.validityItem}>
                  <View style={styles.validityIconContainer}>
                    <Ionicons
                      name="calendar"
                      size={16}
                      color={COLORS.error[500]}
                    />
                  </View>
                  <View style={styles.validityTextContainer}>
                    <ResponsiveText
                      variant="caption1"
                      style={styles.validityLabel}
                    >
                      Ends
                    </ResponsiveText>
                    <ResponsiveText variant="body2" weight="medium">
                      {formatDate(promotion.endDate)}
                    </ResponsiveText>
                  </View>
                </View>
              </View>
            </ResponsiveCard>

            {/* Vendor Info Card */}
            <ResponsiveCard style={styles.vendorCard}>
              <View style={styles.vendorHeader}>
                <Ionicons
                  name="business"
                  size={20}
                  color={COLORS.primary[500]}
                />
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  style={styles.vendorTitle}
                >
                  Offered by
                </ResponsiveText>
              </View>
              <ResponsiveText
                variant="h5"
                weight="bold"
                color={COLORS.primary[600]}
              >
                {promotion.vendor.businessName}
              </ResponsiveText>
              {promotion.vendor.businessPhone && (
                <View style={styles.vendorContact}>
                  <Ionicons
                    name="call"
                    size={16}
                    color={COLORS.text.secondary}
                  />
                  <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                    {promotion.vendor.businessPhone}
                  </ResponsiveText>
                </View>
              )}
            </ResponsiveCard>
          </View>

          {/* Services Section */}
          <View style={styles.servicesSection}>
            <View style={styles.sectionHeader}>
              <ResponsiveText
                variant="h4"
                weight="bold"
                style={styles.sectionTitle}
              >
                Available Services
              </ResponsiveText>
              <View style={styles.serviceCountBadge}>
                <ResponsiveText
                  variant="caption1"
                  weight="bold"
                  color={COLORS.white}
                >
                  {promotion.serviceListings.length}
                </ResponsiveText>
              </View>
            </View>

            {promotion.serviceListings.map((service) => (
              <TouchableOpacity
                key={service.id}
                style={styles.searchResultCard}
                onPress={() => handleServicePress(service.id)}
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
                  {service.servicesWithDiscount.length > 0 && (
                    <View style={styles.offerBadgeContainer}>
                      <View style={styles.discountBadgeSmall}>
                        <ResponsiveText
                          variant="caption2"
                          weight="bold"
                          color={COLORS.white}
                        >
                          {service.servicesWithDiscount[0].discountText}
                        </ResponsiveText>
                      </View>
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
                    {service.categoryName || "General"}
                  </ResponsiveText>

                  {/* Service Title */}
                  <ResponsiveText
                    variant="body1"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.serviceTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {service.title}
                  </ResponsiveText>

                  {/* Rating */}
                  <View style={styles.ratingContainer}>
                    <View style={styles.starsContainer}>
                      {renderStars(service.rating)}
                    </View>
                    <ResponsiveText
                      variant="caption1"
                      weight="medium"
                      color={COLORS.text.secondary}
                      style={styles.ratingText}
                    >
                      {service.rating.toFixed(1)} ({service.totalReviews})
                    </ResponsiveText>
                  </View>

                  {/* Price */}
                  {service.minPrice && (
                    <View style={styles.priceContainer}>
                      <ResponsiveText
                        variant="caption2"
                        weight="medium"
                        color={COLORS.text.secondary}
                        style={styles.priceLabel}
                      >
                        Start from:
                      </ResponsiveText>
                      {(() => {
                        // Check if there's a discount available
                        const hasDiscount =
                          service.servicesWithDiscount &&
                          service.servicesWithDiscount.length > 0;

                        if (hasDiscount) {
                          const discountedPrice =
                            service.servicesWithDiscount[0].discountedPrice;
                          return (
                            <View style={styles.priceRow}>
                              <ResponsiveText
                                variant="body2"
                                weight="bold"
                                color={COLORS.text.secondary}
                                style={styles.originalPrice}
                              >
                                ₹{service.minPrice.toFixed(0)}
                              </ResponsiveText>
                              <ResponsiveText
                                variant="body2"
                                weight="bold"
                                color={COLORS.primary[500]}
                                style={styles.discountedPrice}
                              >
                                ₹{discountedPrice.toFixed(0)}
                              </ResponsiveText>
                            </View>
                          );
                        } else {
                          // No discount - show original price only
                          return (
                            <ResponsiveText
                              variant="body2"
                              weight="bold"
                              color={COLORS.primary[500]}
                              style={styles.priceValue}
                            >
                              ₹{service.minPrice.toFixed(0)}
                            </ResponsiveText>
                          );
                        }
                      })()}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.screen,
  },
  loadingText: {
    marginTop: MARGIN.md,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.screen,
  },
  errorIconContainer: {
    marginBottom: MARGIN.lg,
  },
  errorTitle: {
    marginBottom: MARGIN.md,
    color: COLORS.text.primary,
    textAlign: "center",
  },
  errorMessage: {
    marginBottom: MARGIN.xl,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  heroContainer: {
    position: "relative",
    height: 280,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  discountBadge: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: COLORS.error[500],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    marginTop: -20,
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  promotionHeader: {
    paddingHorizontal: PADDING.screen,
    marginBottom: MARGIN.xl,
  },
  promotionTitle: {
    color: COLORS.text.primary,
    marginBottom: MARGIN.sm,
    lineHeight: 32,
  },
  promotionDescription: {
    color: COLORS.text.secondary,
    lineHeight: 22,
    marginBottom: MARGIN.lg,
  },
  validityCard: {
    marginBottom: MARGIN.lg,
    padding: PADDING.lg,
  },
  validityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  validityTitle: {
    marginLeft: MARGIN.sm,
    color: COLORS.text.primary,
  },
  validityDates: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  validityItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: MARGIN.md,
  },
  validityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: MARGIN.sm,
  },
  validityTextContainer: {
    flex: 1,
  },
  validityLabel: {
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  vendorCard: {
    marginBottom: MARGIN.lg,
    padding: PADDING.lg,
  },
  vendorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  vendorTitle: {
    marginLeft: MARGIN.sm,
    color: COLORS.text.primary,
  },
  vendorContact: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: MARGIN.sm,
  },
  servicesSection: {
    marginTop: MARGIN.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.lg,
    paddingHorizontal: PADDING.screen,
  },
  sectionTitle: {
    color: COLORS.text.primary,
    flex: 1,
  },
  serviceCountBadge: {
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  // Service card styles matching search screen
  searchResultCard: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: PADDING.screen,
    marginBottom: MARGIN.md,
    height: 140,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: "auto",
  },
  priceLabel: {
    marginRight: 4,
  },
  priceValue: {
    color: COLORS.primary[500],
    fontSize: 14,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    fontSize: 14,
  },
  discountedPrice: {
    fontSize: 14,
  },
  offerBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  discountBadgeSmall: {
    backgroundColor: COLORS.error[500],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});
