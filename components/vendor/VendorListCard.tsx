import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import { ResponsiveText, ResponsiveCard } from "@/components/UI";

// Extended ServiceListing interface for the new design
export interface VendorServiceListing {
  id: string;
  title: string;
  description: string;
  price: string;
  originalPrice?: string; // For showing strikethrough original price
  priceDisplayText?: string; // Additional info about the price (e.g., "3 services", "Standard Service")
  serviceCount?: number; // Number of services in this listing
  category: string; // Keep for backward compatibility
  categories: string[]; // Array of category names for badges
  status: "active" | "inactive" | "pending" | "rejected" | "draft";
  rating: number;
  reviewCount: number;
  views: number;
  imageUrl: string;
  badges: string[]; // Array of badge labels like ["Live", "Best Seller", "Popular"]
  createdAt: string;
  updatedAt: string;
}

interface VendorListCardProps {
  listing: VendorServiceListing;
  onPress?: (listing: VendorServiceListing) => void;
  onEdit?: (listing: VendorServiceListing) => void;
  onToggleStatus?: (listing: VendorServiceListing) => void;
  onDelete?: (listing: VendorServiceListing) => void;
  isDeleting?: boolean;
}

export const VendorListCard: React.FC<VendorListCardProps> = ({
  listing,
  onPress,
  onEdit,
  onToggleStatus,
  onDelete,
  isDeleting = false,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return COLORS.success[500];
      case "inactive":
        return COLORS.error[500];
      case "pending":
        return COLORS.warning[500];
      case "rejected":
        return COLORS.error[600];
      case "draft":
        return COLORS.primary[500];
      default:
        return COLORS.text.secondary;
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case "live":
        return COLORS.success[500];
      case "best seller":
        return COLORS.primary[300];
      case "popular":
        return COLORS.warning[600];
      case "trending":
        return COLORS.primary[300];
      case "pending approval":
        return COLORS.warning[500];
      case "draft":
        return COLORS.primary[500];
      case "new":
        return COLORS.success[400];
      default:
        return COLORS.primary[300];
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return "Updated just now";
    if (diffInHours < 24)
      return `Updated ${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `Updated ${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  };

  const cardContent = (
    <ResponsiveCard variant="outlined" style={styles.card}>
      {/* Image Header with Badges */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: listing.imageUrl }}
          style={styles.serviceImage}
          onError={(error) => {
            console.log("Image load error:", error.nativeEvent.error);
            console.log("Failed URL:", listing.imageUrl);
          }}
          onLoad={() => {
            console.log("Image loaded successfully:", listing.imageUrl);
          }}
        />

        {/* Black Transparent Overlay */}
        <View style={styles.imageOverlay} />

        {/* Status Badges Overlay */}
        <View style={styles.badgesContainer}>
          {listing.badges.map((badge, index) => (
            <View
              key={index}
              style={[
                styles.badge,
                { backgroundColor: getBadgeColor(badge) + "80" },
              ]}
            >
              <ResponsiveText
                variant="caption2"
                weight="medium"
                color={COLORS.white}
                style={styles.badgeText}
              >
                {badge}
              </ResponsiveText>
            </View>
          ))}
        </View>

        {/* Three Dots Menu */}
        <View style={styles.menuContainer}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setShowMenu(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Service Details */}
      <View style={styles.detailsContainer}>
        {/* Title and Category */}
        <View style={styles.titleSection}>
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.serviceTitle}
          >
            {listing.title.charAt(0).toUpperCase() + listing.title.slice(1)}
          </ResponsiveText>
          <View style={styles.categoriesContainer}>
            {listing.categories && listing.categories.length > 0 ? (
              listing.categories.slice(0, 3).map((category, index) => (
                <View key={index} style={styles.categoryBadge}>
                  <ResponsiveText
                    variant="caption2"
                    weight="medium"
                    color={COLORS.primary[500]}
                    style={styles.categoryBadgeText}
                  >
                    {category}
                  </ResponsiveText>
                </View>
              ))
            ) : (
              <View style={styles.categoryBadge}>
                <ResponsiveText
                  variant="caption2"
                  weight="medium"
                  color={COLORS.primary[500]}
                  style={styles.categoryBadgeText}
                >
                  {listing.category}
                </ResponsiveText>
              </View>
            )}
            {listing.categories && listing.categories.length > 3 && (
              <View style={styles.categoryBadge}>
                <ResponsiveText
                  variant="caption2"
                  weight="medium"
                  color={COLORS.primary[500]}
                  style={styles.categoryBadgeText}
                >
                  +{listing.categories.length - 3}
                </ResponsiveText>
              </View>
            )}
          </View>
        </View>

        {/* Pricing */}
        <View style={styles.pricingSection}>
          <View style={styles.priceContainer}>
            {listing.originalPrice && (
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.originalPrice}
              >
                {listing.originalPrice}
              </ResponsiveText>
            )}
            <ResponsiveText
              variant="h5"
              weight="bold"
              color={COLORS.primary[300]}
              style={styles.currentPrice}
            >
              {listing.price}
            </ResponsiveText>
          </View>
          <View style={styles.statusIndicator}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(listing.status) },
              ]}
            />
            <ResponsiveText
              variant="caption2"
              weight="medium"
              color={getStatusColor(listing.status)}
              style={styles.statusText}
            >
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </ResponsiveText>
          </View>
        </View>

        {/* Metrics Row */}
        <View style={styles.metricsRow}>
          {/* Views */}
          <View style={styles.metricItem}>
            <View style={styles.metricIconContainer}>
              <Ionicons name="eye" size={14} color={COLORS.primary[300]} />
            </View>
            <ResponsiveText
              variant="caption1"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.metricText}
              numberOfLines={1}
            >
              {listing.views} views
            </ResponsiveText>
          </View>

          {/* Service Count - Right side */}
          {listing.serviceCount !== undefined &&
            listing.serviceCount !== null && (
              <View style={styles.metricItem}>
                <View style={styles.metricIconContainer}>
                  <Ionicons
                    name="list"
                    size={14}
                    color={COLORS.text.secondary}
                  />
                </View>
                <ResponsiveText
                  variant="caption1"
                  weight="medium"
                  color={COLORS.text.secondary}
                  style={styles.metricText}
                  numberOfLines={1}
                >
                  {listing.serviceCount} Service
                  {listing.serviceCount !== 1 ? "s" : ""}
                </ResponsiveText>
              </View>
            )}

          {/* Rating */}
          {listing.rating !== undefined && listing.rating !== null && (
            <View style={styles.metricItem}>
              <View style={styles.metricIconContainer}>
                <Ionicons name="star" size={14} color="#FF8C00" />
              </View>
              <ResponsiveText
                variant="caption1"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.metricText}
                numberOfLines={1}
              >
                {listing.rating > 0 ? `${listing.rating}/5` : "No rating"}
              </ResponsiveText>
            </View>
          )}

          {/* Review Count */}
          {listing.reviewCount > 0 && (
            <View style={styles.metricItem}>
              <View style={styles.metricIconContainer}>
                <Ionicons
                  name="chatbubble"
                  size={14}
                  color={COLORS.primary[300]}
                />
              </View>
              <ResponsiveText
                variant="caption1"
                weight="medium"
                color={COLORS.text.secondary}
                style={styles.metricText}
                numberOfLines={1}
              >
                {listing.reviewCount} reviews
              </ResponsiveText>
            </View>
          )}
        </View>

        {/* Update Time */}
        <View style={styles.updateTimeContainer}>
          <Ionicons name="time" size={10} color={COLORS.text.secondary} />
          <ResponsiveText
            variant="caption2"
            color={COLORS.text.secondary}
            style={styles.updateTime}
          >
            {formatTimeAgo(listing.updatedAt)}
          </ResponsiveText>
        </View>
      </View>

      {/* Action Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        >
          <View style={styles.menuModal}>
            <View style={styles.menuHeader}>
              <ResponsiveText
                variant="h6"
                weight="medium"
                color={COLORS.text.primary}
              >
                {listing.title.charAt(0).toUpperCase() + listing.title.slice(1)}
              </ResponsiveText>
              <TouchableOpacity
                onPress={() => setShowMenu(false)}
                style={styles.closeButton}
              >
                <Ionicons
                  name="close"
                  size={20}
                  color={COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.menuItems}>
              {/* Edit Option */}
              {onEdit && (
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    onEdit(listing);
                  }}
                >
                  <View style={styles.menuItemIcon}>
                    <Ionicons
                      name="create-outline"
                      size={20}
                      color={COLORS.primary[500]}
                    />
                  </View>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={COLORS.text.primary}
                  >
                    Edit Listing
                  </ResponsiveText>
                </TouchableOpacity>
              )}

              {/* Toggle Status Option */}
              {onToggleStatus &&
                (listing.status === "active" ||
                  listing.status === "inactive") && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => {
                      setShowMenu(false);
                      onToggleStatus(listing);
                    }}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons
                        name={
                          listing.status === "active"
                            ? "pause-outline"
                            : "play-outline"
                        }
                        size={20}
                        color={
                          listing.status === "active"
                            ? COLORS.warning[500]
                            : COLORS.success[500]
                        }
                      />
                    </View>
                    <ResponsiveText
                      variant="body1"
                      weight="medium"
                      color={COLORS.text.primary}
                    >
                      {listing.status === "active"
                        ? "Turn Off Service"
                        : "Turn On Service"}
                    </ResponsiveText>
                  </TouchableOpacity>
                )}

              {/* Delete Option */}
              {onDelete && (
                <TouchableOpacity
                  style={[styles.menuItem, styles.deleteMenuItem]}
                  onPress={() => {
                    setShowMenu(false);
                    onDelete(listing);
                  }}
                  disabled={isDeleting}
                >
                  <View style={[styles.menuItemIcon, styles.deleteIcon]}>
                    {isDeleting ? (
                      <ActivityIndicator
                        size="small"
                        color={COLORS.error[500]}
                      />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={20}
                        color={COLORS.error[500]}
                      />
                    )}
                  </View>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={COLORS.error[500]}
                  >
                    {isDeleting ? "Deleting..." : "Delete Listing"}
                  </ResponsiveText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </ResponsiveCard>
  );

  // Wrap with TouchableOpacity if onPress is provided
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={() => onPress(listing)}
        activeOpacity={0.8}
        style={styles.cardWrapper}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return <View style={styles.cardWrapper}>{cardContent}</View>;
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: MARGIN.lg,
  },
  card: {
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: "relative",
    height: 200,
    marginTop: -PADDING.lg,
    marginHorizontal: -PADDING.lg,
  },
  serviceImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
  },
  badgesContainer: {
    position: "absolute",
    top: MARGIN.md,
    left: MARGIN.md,
    right: MARGIN.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.xs,
  },
  badge: {
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  detailsContainer: {
    paddingTop: PADDING.md,
    paddingHorizontal: PADDING.xs,
    paddingBottom: PADDING.sm,
  },
  titleSection: {
    marginBottom: MARGIN.md,
  },
  serviceTitle: {
    marginBottom: MARGIN.sm,
    lineHeight: 24,
    letterSpacing: 0.1,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.sm,
    alignSelf: "flex-start",
  },
  category: {
    fontSize: 12,
    fontWeight: "500",
  },
  categoriesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.xs,
    marginTop: MARGIN.xs,
  },
  categoryBadge: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: PADDING.xs,
    paddingVertical: 2,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pricingSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: MARGIN.md,
    paddingVertical: PADDING.md,
    paddingHorizontal: PADDING.sm,
    backgroundColor: COLORS.neutral[50],
    borderRadius: BORDER_RADIUS.md,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.6,
    fontSize: 14,
  },
  currentPrice: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
    backgroundColor: COLORS.white,
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 0.5,
    borderColor: COLORS.border.light,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: MARGIN.sm,
    flexWrap: "wrap",
    gap: MARGIN.sm,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
    flexShrink: 0,
    maxWidth: "48%",
  },
  metricIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  metricText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.text.secondary,
    flexShrink: 1,
  },
  updateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
    paddingTop: PADDING.sm,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border.light,
    marginHorizontal: -PADDING.xs,
    paddingHorizontal: PADDING.xs,
    paddingBottom: PADDING.xs,
  },
  updateTime: {
    fontSize: 11,
    color: COLORS.text.secondary,
  },
  // Three dots menu styles
  menuContainer: {
    position: "absolute",
    top: MARGIN.md,
    right: MARGIN.md,
  },
  menuButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  menuModal: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginHorizontal: PADDING.lg,
    minWidth: 300,
    maxWidth: 340,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
    overflow: "hidden", // Ensure border radius is applied properly
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    backgroundColor: COLORS.neutral[50],
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.neutral[100],
    alignItems: "center",
    justifyContent: "center",
  },
  menuItems: {
    paddingVertical: PADDING.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.lg,
  },
  menuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutral[50],
    alignItems: "center",
    justifyContent: "center",
    marginRight: MARGIN.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    marginTop: MARGIN.xs,
    backgroundColor: COLORS.error[50],
    borderBottomLeftRadius: BORDER_RADIUS.xl,
    borderBottomRightRadius: BORDER_RADIUS.xl,
  },
  deleteIcon: {
    backgroundColor: COLORS.error[50],
    borderColor: COLORS.error[200],
  },
});

export default VendorListCard;
