import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../constants";
import { ResponsiveText } from "../UI/ResponsiveText";

interface ServiceCardProps {
  service: {
    id: string;
    title: string;
    description?: string;
    image?: string;
    rating?: number;
    totalReviews?: number;
    category?: {
      id: string;
      name: string;
      slug: string;
    };
    vendor?: {
      id: string;
      businessName: string;
    };
    price?: number;
  };
  onPress?: () => void;
  onRemove?: () => void;
  showSaveButton?: boolean;
  showRemoveButton?: boolean;
  isRemoving?: boolean;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onRemove,
  showSaveButton = true,
  showRemoveButton = false,
  isRemoving = false,
}) => {
  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to service details page
      router.push(`/(dashboard)/service-details?id=${service.id}`);
    }
  };

  const handleRemovePress = () => {
    if (onRemove) {
      onRemove();
    }
  };

  const getCategoryBadgeColor = (category: string | undefined | null) => {
    // Handle null/undefined category
    if (!category || typeof category !== "string") {
      return COLORS.primary[500]; // Default color
    }

    // Simple color variations based on category name
    const categoryLower = category.toLowerCase();

    if (
      categoryLower.includes("home") ||
      categoryLower.includes("repair") ||
      categoryLower.includes("maintenance")
    ) {
      return COLORS.warning[500]; // Orange
    }
    if (
      categoryLower.includes("beauty") ||
      categoryLower.includes("salon") ||
      categoryLower.includes("spa")
    ) {
      return "#E91E63"; // Pink
    }
    if (
      categoryLower.includes("fitness") ||
      categoryLower.includes("gym") ||
      categoryLower.includes("health")
    ) {
      return COLORS.success[500]; // Green
    }
    if (
      categoryLower.includes("education") ||
      categoryLower.includes("training") ||
      categoryLower.includes("course")
    ) {
      return COLORS.info[500]; // Blue
    }
    if (
      categoryLower.includes("food") ||
      categoryLower.includes("restaurant") ||
      categoryLower.includes("catering")
    ) {
      return "#FF5722"; // Deep Orange
    }

    return COLORS.primary[500]; // Default
  };

  const renderStars = (rating: number) => {
    // Safety check for rating
    if (!rating || typeof rating !== "number" || isNaN(rating)) {
      return null;
    }

    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons
            key={i}
            name="star"
            size={12}
            color="#FF8C00"
            style={styles.star}
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons
            key={i}
            name="star-half"
            size={12}
            color="#FF8C00"
            style={styles.star}
          />
        );
      } else {
        stars.push(
          <Ionicons
            key={i}
            name="star-outline"
            size={12}
            color={COLORS.neutral[300]}
            style={styles.star}
          />
        );
      }
    }
    return stars;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.9}
    >
      {/* Service Image */}
      <View style={styles.imageContainer}>
        {service.image ? (
          <Image source={{ uri: service.image }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={[COLORS.neutral[100], COLORS.neutral[200]]}
            style={styles.placeholderImage}
          >
            <Ionicons
              name="image-outline"
              size={40}
              color={COLORS.neutral[400]}
            />
          </LinearGradient>
        )}

        {/* Gradient Overlay */}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.3)"]}
          style={styles.imageOverlay}
        />

        {/* Category Badge */}
        {service.category && (
          <View style={styles.categoryBadgeContainer}>
            <LinearGradient
              colors={[
                getCategoryBadgeColor(service.category?.name),
                getCategoryBadgeColor(service.category?.name) + "CC",
              ]}
              style={styles.categoryBadge}
            >
              <ResponsiveText
                variant="caption1"
                weight="semiBold"
                color={COLORS.white}
                style={styles.categoryText}
              >
                {service.category?.name ?? "Category"}
              </ResponsiveText>
            </LinearGradient>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {showRemoveButton && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={handleRemovePress}
              disabled={isRemoving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.error[500], COLORS.error[600]]}
                style={styles.removeButtonGradient}
              >
                <Ionicons
                  name={isRemoving ? "hourglass-outline" : "close"}
                  size={18}
                  color={COLORS.white}
                />
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Service Info */}
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <ResponsiveText
            variant="h6"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.title}
            numberOfLines={2}
          >
            {typeof service.title === "string"
              ? service.title
              : "Untitled Service"}
          </ResponsiveText>
        </View>

        {service.description && (
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={styles.description}
            numberOfLines={2}
          >
            {typeof service.description === "string" ? service.description : ""}
          </ResponsiveText>
        )}

        {service.vendor && (
          <View style={styles.vendorContainer}>
            <Ionicons
              name="business-outline"
              size={12}
              color={COLORS.text.light}
            />
            <ResponsiveText
              variant="caption1"
              color={COLORS.text.light}
              style={styles.vendorName}
              numberOfLines={1}
            >
              {typeof service.vendor.businessName === "string"
                ? service.vendor.businessName
                : "Unknown Vendor"}
            </ResponsiveText>
          </View>
        )}

        {/* Rating and Reviews */}
        {service.rating != null && service.totalReviews != null && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(service.rating)}
            </View>
            <ResponsiveText
              variant="caption1"
              color={COLORS.text.light}
              style={styles.ratingText}
            >
              {`${service.rating.toFixed(1)} (${service.totalReviews} reviews)`}
            </ResponsiveText>
          </View>
        )}

        {/* Price */}
        {service.price != null && (
          <View style={styles.priceContainer}>
            <LinearGradient
              colors={[COLORS.primary[500], COLORS.primary[600]]}
              style={styles.priceBadge}
            >
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.white}
                style={styles.priceText}
              >
                {`$${service.price ?? 0}`}
              </ResponsiveText>
            </LinearGradient>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: MARGIN.sm,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.neutral[100],
  },
  imageContainer: {
    position: "relative",
    height: 180,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  categoryBadgeContainer: {
    position: "absolute",
    top: MARGIN.md,
    left: MARGIN.md,
  },
  categoryBadge: {
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryText: {
    fontSize: FONT_SIZE.caption1,
    fontWeight: "600",
  },
  actionButtons: {
    position: "absolute",
    top: MARGIN.md,
    right: MARGIN.md,
    flexDirection: "row",
    gap: MARGIN.xs,
  },
  removeButton: {
    borderRadius: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  removeButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: PADDING.lg,
    paddingTop: PADDING.md,
    paddingBottom: PADDING.md,
  },
  titleContainer: {
    marginBottom: MARGIN.sm,
  },
  title: {
    lineHeight: 22,
  },
  description: {
    marginBottom: MARGIN.md,
    lineHeight: 20,
    color: COLORS.text.secondary,
  },
  vendorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
    gap: MARGIN.xs,
  },
  vendorName: {
    flex: 1,
    fontSize: FONT_SIZE.caption1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.md,
    paddingVertical: PADDING.xs,
    paddingHorizontal: PADDING.sm,
    backgroundColor: COLORS.neutral[50],
    borderRadius: BORDER_RADIUS.md,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: MARGIN.sm,
  },
  star: {
    marginRight: 2,
  },
  ratingText: {
    marginLeft: MARGIN.xs,
    fontWeight: "500",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceBadge: {
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.full,
    shadowColor: COLORS.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  priceText: {
    fontSize: FONT_SIZE.h6,
  },
});
