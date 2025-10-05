import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../constants";
import { ResponsiveText } from "../UI/ResponsiveText";
import { UserFavorite } from "../../services/user";
import { useRemoveFromFavorites } from "../../hooks/useUserFavorites";

interface FavoriteServiceCardProps {
  favorite: UserFavorite;
  onRemove?: () => void;
  showRemoveButton?: boolean;
}

export const FavoriteServiceCard: React.FC<FavoriteServiceCardProps> = ({
  favorite,
  onRemove,
  showRemoveButton = true,
}) => {
  const removeFromFavorites = useRemoveFromFavorites();

  const handleCardPress = () => {
    // Navigate to service details page
    router.push(
      `/(dashboard)/service-details?id=${favorite.serviceListing.id}`
    );
  };

  const handleRemovePress = () => {
    Alert.alert(
      "Remove from Favorites",
      `Are you sure you want to remove "${favorite.serviceListing.title}" from your favorites?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromFavorites.mutateAsync({
                userId: favorite.userId,
                serviceId: favorite.serviceListingId,
              });
              onRemove?.();
            } catch (error) {
              console.error("Error removing from favorites:", error);
              Alert.alert(
                "Error",
                "Failed to remove from favorites. Please try again."
              );
            }
          },
        },
      ]
    );
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

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      {/* Service Image */}
      <View style={styles.imageContainer}>
        {favorite.serviceListing.image ? (
          <Image
            source={{ uri: favorite.serviceListing.image }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Ionicons
              name="image-outline"
              size={32}
              color={COLORS.neutral[400]}
            />
          </View>
        )}

        {/* Category Badge */}
        <View style={styles.categoryBadge}>
          <ResponsiveText
            variant="caption2"
            weight="medium"
            color={COLORS.white}
          >
            {favorite.serviceListing.category.name}
          </ResponsiveText>
        </View>

        {/* Remove Button */}
        {showRemoveButton && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={handleRemovePress}
            disabled={removeFromFavorites.isPending}
          >
            <Ionicons name="heart" size={16} color={COLORS.error[500]} />
          </TouchableOpacity>
        )}
      </View>

      {/* Service Info */}
      <View style={styles.content}>
        <ResponsiveText
          variant="body2"
          weight="semiBold"
          color={COLORS.text.primary}
          style={styles.title}
          numberOfLines={2}
        >
          {favorite.serviceListing.title}
        </ResponsiveText>

        <ResponsiveText
          variant="caption1"
          color={COLORS.text.secondary}
          style={styles.description}
          numberOfLines={2}
        >
          {favorite.serviceListing.description}
        </ResponsiveText>

        {/* Vendor Info */}
        <View style={styles.vendorInfo}>
          <Ionicons
            name="business-outline"
            size={12}
            color={COLORS.text.secondary}
          />
          <ResponsiveText
            variant="caption2"
            color={COLORS.text.secondary}
            style={styles.vendorName}
            numberOfLines={1}
          >
            {favorite.serviceListing.vendor.businessName}
          </ResponsiveText>
        </View>

        {/* Rating */}
        <View style={styles.ratingContainer}>
          <View style={styles.stars}>
            {renderStars(favorite.serviceListing.rating)}
          </View>
          <ResponsiveText
            variant="caption2"
            color={COLORS.text.secondary}
            style={styles.ratingText}
          >
            {favorite.serviceListing.rating.toFixed(1)} (
            {favorite.serviceListing.totalReviews})
          </ResponsiveText>
        </View>

        {/* Location */}
        <View style={styles.locationInfo}>
          <Ionicons
            name="location-outline"
            size={12}
            color={COLORS.text.secondary}
          />
          <ResponsiveText
            variant="caption2"
            color={COLORS.text.secondary}
            style={styles.locationText}
            numberOfLines={1}
          >
            {favorite.serviceListing.address.city},{" "}
            {favorite.serviceListing.address.state}
          </ResponsiveText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    marginRight: MARGIN.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 100,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: MARGIN.sm,
    left: MARGIN.sm,
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  removeButton: {
    position: "absolute",
    top: MARGIN.sm,
    right: MARGIN.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    padding: PADDING.md,
  },
  title: {
    marginBottom: MARGIN.xs,
  },
  description: {
    marginBottom: MARGIN.sm,
    lineHeight: 16,
  },
  vendorInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  vendorName: {
    marginLeft: MARGIN.xs,
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  stars: {
    flexDirection: "row",
    marginRight: MARGIN.xs,
  },
  ratingText: {
    fontSize: FONT_SIZE.caption2,
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    marginLeft: MARGIN.xs,
    flex: 1,
  },
});

export default FavoriteServiceCard;
