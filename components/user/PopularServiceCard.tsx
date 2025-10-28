import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS, BORDER_RADIUS, MARGIN } from "@/constants";
import { OfferBadge } from "../common/OfferBadge";

interface PopularServiceCardProps {
  service: {
    id: string;
    title: string;
    image?: string;
    vendorName: string;
    category: string;
    price?: number;
    rating?: number;
    totalReviews?: number;
    promotion?: {
      id: string;
      title: string;
      discountType: string;
      discountValue: number;
    };
  };
  onPress?: () => void;
}

export const PopularServiceCard: React.FC<PopularServiceCardProps> = ({
  service,
  onPress,
}) => {
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
      categoryLower.includes("school") ||
      categoryLower.includes("learning")
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
    if (
      categoryLower.includes("transport") ||
      categoryLower.includes("delivery") ||
      categoryLower.includes("logistics")
    ) {
      return "#607D8B"; // Blue Grey
    }
    if (
      categoryLower.includes("technology") ||
      categoryLower.includes("it") ||
      categoryLower.includes("software")
    ) {
      return "#9C27B0"; // Purple
    }
    if (
      categoryLower.includes("cleaning") ||
      categoryLower.includes("housekeeping")
    ) {
      return "#00BCD4"; // Cyan
    }
    if (
      categoryLower.includes("event") ||
      categoryLower.includes("party") ||
      categoryLower.includes("wedding")
    ) {
      return "#FF9800"; // Orange
    }
    if (
      categoryLower.includes("photography") ||
      categoryLower.includes("photo") ||
      categoryLower.includes("camera")
    ) {
      return "#795548"; // Brown
    }
    if (
      categoryLower.includes("consulting") ||
      categoryLower.includes("business") ||
      categoryLower.includes("specialist")
    ) {
      return COLORS.primary[500]; // Primary Blue
    }
    if (
      categoryLower.includes("pet") ||
      categoryLower.includes("animal") ||
      categoryLower.includes("dog") ||
      categoryLower.includes("cat")
    ) {
      return "#4CAF50"; // Green
    }
    if (
      categoryLower.includes("legal") ||
      categoryLower.includes("law") ||
      categoryLower.includes("attorney")
    ) {
      return "#3F51B5"; // Indigo
    }
    if (
      categoryLower.includes("finance") ||
      categoryLower.includes("accounting") ||
      categoryLower.includes("tax")
    ) {
      return "#009688"; // Teal
    }
    if (
      categoryLower.includes("real estate") ||
      categoryLower.includes("property") ||
      categoryLower.includes("housing")
    ) {
      return "#FFC107"; // Amber
    }

    return COLORS.primary[500]; // Default color
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Ionicons key={i} name="star" size={12} color="#FFD700" />);
    }

    if (hasHalfStar) {
      stars.push(
        <Ionicons key="half" name="star-half" size={12} color="#FFD700" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <Ionicons
          key={`empty-${i}`}
          name="star-outline"
          size={12}
          color="#FFD700"
        />
      );
    }

    return stars;
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.imageContainer}>
        {service.image ? (
          <Image source={{ uri: service.image }} style={styles.image} />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons
              name="image-outline"
              size={32}
              color={COLORS.text.secondary}
            />
            <ResponsiveText
              variant="caption2"
              color={COLORS.text.secondary}
              style={styles.placeholderText}
            >
              No Image
            </ResponsiveText>
          </View>
        )}
        {/* Category Badge */}
        <View
          style={[
            styles.categoryBadge,
            {
              backgroundColor: getCategoryBadgeColor(service.category),
            },
          ]}
        >
          <ResponsiveText
            variant="caption2"
            color={COLORS.white}
            style={styles.categoryText}
          >
            {service.category || "General"}
          </ResponsiveText>
        </View>

        {/* Offer Badge */}
        {service.promotion && service.price && (
          <View style={styles.offerBadgeContainer}>
            <OfferBadge
              discountType={
                service.promotion.discountType as "FIXED" | "PERCENTAGE"
              }
              discountValue={service.promotion.discountValue}
              originalPrice={service.price}
              discountedPrice={
                service.promotion.discountType === "FIXED"
                  ? Math.max(0, service.price - service.promotion.discountValue)
                  : Math.max(
                      0,
                      service.price *
                        (1 - service.promotion.discountValue / 100)
                    )
              }
              promotionTitle={service.promotion.title}
              size="small"
            />
          </View>
        )}
      </View>

      <View style={styles.content}>
        <ResponsiveText
          variant="body2"
          weight="semiBold"
          color={COLORS.text.primary}
          style={styles.title}
          numberOfLines={2}
        >
          {service.title || "Untitled Service"}
        </ResponsiveText>

        <View style={styles.vendorContainer}>
          <Ionicons
            name="business-outline"
            size={12}
            color={COLORS.text.secondary}
          />
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            style={styles.vendorName}
            numberOfLines={1}
          >
            {service.vendorName || "Unknown Vendor"}
          </ResponsiveText>
        </View>

        {/* Rating */}
        {service.rating && (
          <View style={styles.ratingContainer}>
            <View style={styles.starsContainer}>
              {renderStars(service.rating)}
            </View>
            <ResponsiveText
              variant="caption2"
              color={COLORS.text.secondary}
              style={styles.ratingText}
            >
              {service.rating.toFixed(1)}
              {service.totalReviews && ` (${service.totalReviews})`}
            </ResponsiveText>
          </View>
        )}

        {/* Price */}
        {service.price && (
          <View style={styles.priceContainer}>
            <ResponsiveText
              variant="body2"
              weight="bold"
              color={COLORS.primary[600]}
              style={styles.price}
            >
              From ₹{service.price}
            </ResponsiveText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150,
    marginRight: MARGIN.sm,
    marginBottom: MARGIN.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    overflow: "hidden",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.sm,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    padding: MARGIN.sm,
  },
  title: {
    marginBottom: 4,
    lineHeight: 18,
    fontSize: 14,
    fontWeight: "bold",
  },
  vendorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  vendorName: {
    marginLeft: 4,
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
  },
  priceContainer: {
    marginTop: "auto",
  },
  price: {
    fontSize: 12,
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    marginTop: 4,
    fontSize: 10,
  },
  offerBadgeContainer: {
    position: "absolute",
    top: 36, // Position below the category badge with gap (8 + 18 for badge height + 10 gap)
    left: 8, // Align with category badge
  },
});
