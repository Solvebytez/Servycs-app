import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
  Image,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ResponsiveText,
  ResponsiveCard,
  ResponsiveButton,
  GlobalStatusBar,
  AppHeader,
} from "@/components";
import {
  useVendorPromotionsInfinite,
  flattenInfinitePromotions,
  useDeletePromotion,
  useUpdatePromotion,
} from "@/hooks/usePromotions";
import {
  COLORS,
  FONT_SIZE,
  LINE_HEIGHT,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "@/constants";

// Promotion interface
export interface VendorPromotion {
  id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  originalPrice?: string;
  discountedPrice?: string;
  category: string;
  status: "active" | "inactive" | "pending" | "expired";
  isPromotionOn: boolean; // Quick on/off toggle for active promotions
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  conversions: number;
  imageUrl: string;
  badges: string[];
  createdAt: string;
  updatedAt: string;
}

export default function MyPromotionsScreen() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "pending" | "inactive" | "expired"
  >("all");

  // Dropdown menu state
  const [showMenu, setShowMenu] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<any>(null);

  // State for custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    promotion: any | null;
    action: string;
    newToggle?: boolean;
  }>({
    promotion: null,
    action: "",
    newToggle: false,
  });

  // Use infinite scroll hook for promotions
  const {
    data: infiniteData,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isFetching,
  } = useVendorPromotionsInfinite(
    filterStatus === "all" ? undefined : (filterStatus as "active" | "inactive")
  );

  // Flatten the infinite query data
  const promotions = flattenInfinitePromotions(infiniteData);

  // Delete promotion mutation
  const deletePromotionMutation = useDeletePromotion();

  // Update promotion mutation
  const updatePromotionMutation = useUpdatePromotion();

  // Handle error state
  useEffect(() => {
    if (isError && error) {
      console.error("Error fetching promotions:", error);
      Alert.alert("Error", "Failed to load your promotions. Please try again.");
    }
  }, [isError, error]);

  // Filter promotions
  const filteredPromotions = React.useMemo(() => {
    let filtered = promotions;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((promotion) => {
        switch (filterStatus) {
          case "active":
            return promotion.status === "ACTIVE";
          case "pending":
            return promotion.status === "PENDING";
          case "expired":
            return promotion.status === "EXPIRED";
          case "inactive":
            return promotion.status === "INACTIVE";
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [promotions, filterStatus]);

  const handlePromotionPress = (promotion: any) => {
    // Navigate to promotion details screen
    router.push(`/(dashboard)/(vendor)/promotion-details?id=${promotion.id}`);
  };

  const handleEditPromotion = (promotion: any) => {
    router.push(`/(dashboard)/(vendor)/edit-promotion?id=${promotion.id}`);
  };

  const handleToggleStatus = (promotion: any) => {
    const newStatus = promotion.isPromotionOn ? "inactive" : "active";
    const action = newStatus === "active" ? "activate" : "deactivate";

    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Promotion`,
      `Are you sure you want to ${action} "${promotion.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: () => {
            // TODO: Implement update promotion API call
            console.log("Toggle promotion status:", promotion.id, newStatus);
          },
        },
      ]
    );
  };

  const handleDeletePromotion = (promotion: any) => {
    // Show custom confirmation modal
    setConfirmAction({
      promotion,
      action: "delete",
    });
    setShowConfirmModal(true);
  };

  const handleTogglePromotionStatus = (promotion: any) => {
    const currentStatus = promotion.status;
    const currentToggle = promotion.isPromotionOn;
    let newToggle: boolean;
    let action: string;

    // Check if promotion can be toggled (only ACTIVE promotions)
    if (currentStatus !== "ACTIVE") {
      Alert.alert(
        "Cannot Change Status",
        "This promotion is not active. You can only toggle active promotions.",
        [{ text: "OK" }]
      );
      return;
    }

    // Determine new toggle status based on current isPromotionOn value
    if (currentToggle === true) {
      newToggle = false;
      action = "turn off";
    } else {
      newToggle = true;
      action = "turn on";
    }

    // Show custom confirmation modal
    setConfirmAction({
      promotion,
      action,
      newToggle,
    });
    setShowConfirmModal(true);
  };

  // Dropdown menu functions
  const openMenu = (promotion: any) => {
    setSelectedPromotion(promotion);
    setShowMenu(true);
  };

  const closeMenu = () => {
    setShowMenu(false);
    setSelectedPromotion(null);
  };

  const handleMenuAction = (action: string) => {
    if (!selectedPromotion) return;

    closeMenu();
    switch (action) {
      case "edit":
        handleEditPromotion(selectedPromotion);
        break;
      case "toggle":
        handleTogglePromotionStatus(selectedPromotion);
        break;
      case "delete":
        handleDeletePromotion(selectedPromotion);
        break;
    }
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return COLORS.text.secondary;
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return COLORS.success[500];
      case "PENDING":
        return COLORS.warning[500];
      case "INACTIVE":
        return COLORS.error[500];
      case "EXPIRED":
        return COLORS.text.secondary;
      case "REJECTED":
        return COLORS.error[600];
      default:
        return COLORS.text.secondary;
    }
  };

  const getStatusText = (status: string | undefined) => {
    if (!status) return "Unknown";
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "Active";
      case "PENDING":
        return "Pending";
      case "INACTIVE":
        return "Inactive";
      case "EXPIRED":
        return "Expired";
      case "REJECTED":
        return "Rejected";
      default:
        return "Unknown";
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge.toLowerCase()) {
      case "live":
        return COLORS.success[500];
      case "popular":
        return COLORS.primary[300];
      case "summer special":
        return COLORS.warning[600];
      case "new customer":
        return COLORS.success[400];
      case "pending approval":
        return COLORS.warning[500];
      case "holiday special":
        return COLORS.primary[300];
      case "expired":
        return COLORS.text.secondary;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPromotionCard = (promotion: any) => {
    const cardContent = (
      <ResponsiveCard variant="outlined" style={styles.card}>
        {/* Image Header with Badges */}
        <View style={styles.imageContainer}>
          {promotion.bannerImage ? (
            <Image
              source={{
                uri: promotion.bannerImage.startsWith("file://")
                  ? promotion.bannerImage
                  : promotion.bannerImage,
              }}
              style={styles.promotionImage}
              onError={(error) => {
                console.log("Image load error:", error);
                console.log("Image URI:", promotion.bannerImage);
              }}
            />
          ) : (
            <View style={styles.serviceImagePlaceholder}>
              <Ionicons
                name="megaphone"
                size={40}
                color={COLORS.primary[300]}
              />
            </View>
          )}

          {/* Three-dot Menu */}
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => openMenu(promotion)}
            activeOpacity={0.7}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={COLORS.white} />
          </TouchableOpacity>

          {/* Status Badges Overlay */}
          <View style={styles.badgesContainer}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: getStatusColor(promotion.status) + "80",
                },
              ]}
            >
              <ResponsiveText
                variant="caption2"
                weight="medium"
                color={COLORS.white}
                style={styles.badgeText}
              >
                {getStatusText(promotion.status)}
              </ResponsiveText>
            </View>
          </View>
        </View>

        {/* Promotion Details */}
        <View style={styles.detailsContainer}>
          {/* Title and Category */}
          <View style={styles.titleSection}>
            <ResponsiveText
              variant="h5"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.promotionTitle}
            >
              {promotion.title}
            </ResponsiveText>
            <View style={styles.categoryContainer}>
              <Ionicons name="pricetag" size={12} color={COLORS.primary[300]} />
              <ResponsiveText
                variant="caption1"
                weight="medium"
                color={COLORS.primary[300]}
                style={styles.category}
              >
                {promotion.serviceListings?.[0]?.categoryPath?.[0] || "General"}
              </ResponsiveText>
            </View>
          </View>

          {/* Associated Services */}
          {promotion.serviceListings &&
            promotion.serviceListings.length > 0 && (
              <View style={styles.servicesSection}>
                <View style={styles.servicesHeader}>
                  <Ionicons
                    name="list"
                    size={14}
                    color={COLORS.text.secondary}
                  />
                  <ResponsiveText
                    variant="caption1"
                    weight="medium"
                    color={COLORS.text.secondary}
                    style={styles.servicesLabel}
                  >
                    Services ({promotion.serviceListings.length})
                  </ResponsiveText>
                </View>
                <View style={styles.servicesList}>
                  {promotion.serviceListings
                    .slice(0, 3)
                    .map((service: any, index: number) => (
                      <View key={service.id} style={styles.serviceItem}>
                        <View style={styles.serviceBullet} />
                        <ResponsiveText
                          variant="caption2"
                          color={COLORS.text.primary}
                          style={styles.serviceTitle}
                          numberOfLines={1}
                        >
                          {service.title}
                        </ResponsiveText>
                      </View>
                    ))}
                  {promotion.serviceListings.length > 3 && (
                    <ResponsiveText
                      variant="caption2"
                      color={COLORS.text.secondary}
                      style={styles.moreServices}
                    >
                      +{promotion.serviceListings.length - 3} more services
                    </ResponsiveText>
                  )}
                </View>
              </View>
            )}

          {/* Discount Info */}
          <View style={styles.discountSection}>
            <View style={styles.discountContainer}>
              <View style={styles.discountValueContainer}>
                <ResponsiveText
                  variant="h4"
                  weight="bold"
                  color={COLORS.success[500]}
                  style={styles.discountValue}
                >
                  {promotion.discountType === "percentage" ||
                  promotion.discountType === "PERCENTAGE"
                    ? `${promotion.discountValue}% OFF`
                    : `₹${promotion.discountValue} OFF`}
                </ResponsiveText>
                {promotion.originalPrice && (
                  <View style={styles.priceContainer}>
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                      style={styles.originalPrice}
                    >
                      ₹{promotion.originalPrice}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="h6"
                      weight="bold"
                      color={COLORS.primary[300]}
                      style={styles.discountedPrice}
                    >
                      ₹{promotion.originalPrice - promotion.discountValue}
                    </ResponsiveText>
                  </View>
                )}
              </View>
              <View style={styles.statusIndicator}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: getStatusColor(promotion.status),
                    },
                  ]}
                />
                <ResponsiveText
                  variant="caption2"
                  weight="medium"
                  color={getStatusColor(promotion.status)}
                  style={styles.statusText}
                >
                  {getStatusText(promotion.status)}
                </ResponsiveText>
              </View>
            </View>
          </View>

          {/* Date Range */}
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateItem}>
              <Ionicons
                name="calendar"
                size={12}
                color={COLORS.text.secondary}
              />
              <ResponsiveText
                variant="caption2"
                color={COLORS.text.secondary}
                style={styles.dateText}
              >
                {formatDate(promotion.startDate)} -{" "}
                {formatDate(promotion.endDate)}
              </ResponsiveText>
            </View>
          </View>

          {/* Update Time */}
          <View style={styles.updateTimeContainer}>
            <Ionicons name="time" size={10} color={COLORS.text.secondary} />
            <ResponsiveText
              variant="caption2"
              color={COLORS.text.secondary}
              style={styles.updateTime}
            >
              {formatTimeAgo(promotion.updatedAt)}
            </ResponsiveText>
          </View>
        </View>
      </ResponsiveCard>
    );

    return (
      <TouchableOpacity
        key={promotion.id}
        onPress={() => handlePromotionPress(promotion)}
        activeOpacity={0.8}
        style={styles.cardWrapper}
      >
        {cardContent}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <GlobalStatusBar
        barStyle="light-content"
        backgroundColor="rgba(0, 0, 0, 0.3)"
        translucent={true}
      />
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        {/* Header */}
        <AppHeader
          onBackPress={() => router.back()}
          title="My Promotions"
          rightActionButton={{
            iconName: "add",
            onPress: () => {
              router.push("/(dashboard)/(vendor)/create-promotion");
            },
            backgroundColor: COLORS.primary[300],
            iconColor: COLORS.white,
          }}
        />

        <FlatList
          data={filteredPromotions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => renderPromotionCard(item)}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListHeaderComponent={() => (
            <View>
              {/* Filter Bar */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterContainer}
              >
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "all" && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterStatus("all")}
                >
                  <ResponsiveText
                    variant="caption1"
                    weight="medium"
                    color={
                      filterStatus === "all"
                        ? COLORS.primary[600]
                        : COLORS.text.secondary
                    }
                  >
                    All
                  </ResponsiveText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "active" && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterStatus("active")}
                >
                  <ResponsiveText
                    variant="caption1"
                    weight="medium"
                    color={
                      filterStatus === "active"
                        ? COLORS.primary[600]
                        : COLORS.text.secondary
                    }
                  >
                    Active
                  </ResponsiveText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "pending" && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterStatus("pending")}
                >
                  <ResponsiveText
                    variant="caption1"
                    weight="medium"
                    color={
                      filterStatus === "pending"
                        ? COLORS.primary[600]
                        : COLORS.text.secondary
                    }
                  >
                    Pending
                  </ResponsiveText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.filterButton,
                    filterStatus === "expired" && styles.filterButtonActive,
                  ]}
                  onPress={() => setFilterStatus("expired")}
                >
                  <ResponsiveText
                    variant="caption1"
                    weight="medium"
                    color={
                      filterStatus === "expired"
                        ? COLORS.primary[600]
                        : COLORS.text.secondary
                    }
                  >
                    Expired
                  </ResponsiveText>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}
          ListEmptyComponent={() => (
            <ResponsiveCard variant="elevated" style={styles.emptyCard}>
              <Ionicons
                name="megaphone-outline"
                size={LAYOUT.iconLarge}
                color={COLORS.text.secondary}
              />
              <ResponsiveText
                variant="h6"
                weight="medium"
                color={COLORS.text.secondary}
                style={styles.emptyTitle}
              >
                No Promotions Found
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.emptyDescription}
              >
                {filterStatus === "all"
                  ? "Start by creating your first promotion"
                  : `No promotions found for the selected filter`}
              </ResponsiveText>
              {filterStatus === "all" && (
                <ResponsiveButton
                  title="Create First Promotion"
                  variant="primary"
                  size="medium"
                  onPress={() => {
                    router.push("/(dashboard)/(vendor)/create-promotion");
                  }}
                  style={styles.addFirstButton}
                />
              )}
            </ResponsiveCard>
          )}
          ListFooterComponent={() => (
            <View style={styles.bottomSpacing}>
              {isFetchingNextPage && (
                <View style={styles.loadingFooter}>
                  <ActivityIndicator size="small" color={COLORS.primary[500]} />
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.secondary}
                    style={styles.loadingFooterText}
                  >
                    Loading more promotions...
                  </ResponsiveText>
                </View>
              )}
            </View>
          )}
          refreshing={isFetching}
          onRefresh={refetch}
        />

        {/* Action Menu Modal */}
        <Modal
          visible={showMenu}
          transparent={true}
          animationType="fade"
          onRequestClose={closeMenu}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeMenu}
          >
            <View style={styles.menuModal}>
              <View style={styles.menuHeader}>
                <ResponsiveText
                  variant="h6"
                  weight="medium"
                  color={COLORS.text.primary}
                >
                  {selectedPromotion?.title}
                </ResponsiveText>
                <TouchableOpacity
                  onPress={closeMenu}
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
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handleMenuAction("edit")}
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
                    Edit Promotion
                  </ResponsiveText>
                </TouchableOpacity>

                {/* Toggle Status Option */}
                {selectedPromotion && selectedPromotion.status === "ACTIVE" && (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => handleMenuAction("toggle")}
                  >
                    <View style={styles.menuItemIcon}>
                      <Ionicons
                        name={
                          selectedPromotion.isPromotionOn
                            ? "pause-outline"
                            : "play-outline"
                        }
                        size={20}
                        color={
                          selectedPromotion.isPromotionOn
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
                      {selectedPromotion.isPromotionOn
                        ? "Turn Off Promotion"
                        : "Turn On Promotion"}
                    </ResponsiveText>
                  </TouchableOpacity>
                )}

                {/* Delete Option */}
                <TouchableOpacity
                  style={[styles.menuItem, styles.deleteMenuItem]}
                  onPress={() => handleMenuAction("delete")}
                >
                  <View style={[styles.menuItemIcon, styles.deleteIcon]}>
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={COLORS.error[500]}
                    />
                  </View>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={COLORS.error[500]}
                  >
                    Delete Promotion
                  </ResponsiveText>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Custom Confirmation Modal */}
        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.confirmModalOverlay}>
            <View style={styles.confirmModalContainer}>
              {/* Modal Header */}
              <View style={styles.confirmModalHeader}>
                <ResponsiveText
                  variant="h5"
                  weight="bold"
                  color={COLORS.text.primary}
                >
                  {confirmAction.action === "delete"
                    ? "Delete Promotion"
                    : `${
                        confirmAction.action.charAt(0).toUpperCase() +
                        confirmAction.action.slice(1)
                      } Promotion`}
                </ResponsiveText>
              </View>

              {/* Modal Content */}
              <View style={styles.confirmModalContent}>
                <ResponsiveText
                  variant="body1"
                  color={COLORS.text.secondary}
                  style={styles.confirmModalMessage}
                >
                  {confirmAction.action === "delete"
                    ? `Are you sure you want to delete "${confirmAction.promotion?.title}"? This action cannot be undone.`
                    : `Are you sure you want to ${confirmAction.action} "${confirmAction.promotion?.title}"?`}
                </ResponsiveText>
              </View>

              {/* Modal Actions */}
              <View style={styles.confirmModalActions}>
                <ResponsiveButton
                  title="Cancel"
                  variant="outline"
                  size="small"
                  onPress={() => setShowConfirmModal(false)}
                  disabled={
                    updatePromotionMutation.isPending ||
                    deletePromotionMutation.isPending
                  }
                  style={styles.confirmModalCancelButton}
                />

                <ResponsiveButton
                  title={
                    confirmAction.action === "delete"
                      ? deletePromotionMutation.isPending
                        ? "Deleting..."
                        : "Delete"
                      : updatePromotionMutation.isPending
                      ? `${
                          confirmAction.action.charAt(0).toUpperCase() +
                          confirmAction.action.slice(1)
                        }ing...`
                      : confirmAction.action.charAt(0).toUpperCase() +
                        confirmAction.action.slice(1)
                  }
                  variant={
                    confirmAction.action === "delete" ||
                    confirmAction.action === "turn off"
                      ? "danger"
                      : "primary"
                  }
                  size="small"
                  loading={
                    confirmAction.action === "delete"
                      ? deletePromotionMutation.isPending
                      : updatePromotionMutation.isPending
                  }
                  onPress={() => {
                    if (confirmAction.promotion) {
                      if (confirmAction.action === "delete") {
                        // Handle delete
                        deletePromotionMutation.mutate(
                          confirmAction.promotion.id,
                          {
                            onSuccess: () => {
                              setShowConfirmModal(false);
                              setConfirmAction({
                                promotion: null,
                                action: "",
                                newToggle: false,
                              });
                            },
                            onError: () => {
                              // Keep modal open on error so user can retry
                            },
                          }
                        );
                      } else {
                        // Handle toggle
                        updatePromotionMutation.mutate(
                          {
                            id: confirmAction.promotion.id,
                            data: { isPromotionOn: confirmAction.newToggle },
                          },
                          {
                            onSuccess: () => {
                              setShowConfirmModal(false);
                              setConfirmAction({
                                promotion: null,
                                action: "",
                                newToggle: false,
                              });
                            },
                            onError: () => {
                              // Keep modal open on error so user can retry
                            },
                          }
                        );
                      }
                    }
                  }}
                  disabled={
                    updatePromotionMutation.isPending ||
                    deletePromotionMutation.isPending
                  }
                  style={styles.confirmModalConfirmButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
  },
  filterContainer: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.md,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    marginRight: MARGIN.sm,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
  },
  loadingCard: {
    marginTop: MARGIN.lg,
    padding: PADDING.lg,
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
  },
  emptyCard: {
    marginTop: MARGIN.lg,
    padding: PADDING.xl,
    alignItems: "center",
  },
  emptyTitle: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
  },
  emptyDescription: {
    textAlign: "center",
    marginBottom: MARGIN.lg,
  },
  addFirstButton: {
    marginTop: MARGIN.sm,
  },
  bottomSpacing: {
    height: 100,
  },
  loadingFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PADDING.lg,
    gap: MARGIN.sm,
  },
  loadingFooterText: {
    textAlign: "center",
  },
  // Promotion Card Styles
  cardWrapper: {
    marginBottom: MARGIN.md,
  },
  card: {
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    height: 120,
    marginTop: -PADDING.lg,
    marginHorizontal: -PADDING.lg,
  },
  serviceImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  promotionImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
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
    borderRadius: BORDER_RADIUS.xl,
  },
  badgeText: {
    fontSize: 12,
  },
  detailsContainer: {
    paddingTop: PADDING.md,
    paddingHorizontal: PADDING.xs,
    paddingBottom: PADDING.sm,
  },
  titleSection: {
    marginBottom: MARGIN.md,
  },
  promotionTitle: {
    marginBottom: MARGIN.sm,
    lineHeight: 24,
  },
  categoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  category: {
    // Category styling
  },
  servicesSection: {
    marginBottom: MARGIN.md,
    paddingVertical: PADDING.sm,
    paddingHorizontal: PADDING.md,
    backgroundColor: COLORS.background.light,
    borderRadius: BORDER_RADIUS.sm,
  },
  servicesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
    gap: MARGIN.xs,
  },
  servicesLabel: {
    // Services label styling
  },
  servicesList: {
    gap: MARGIN.xs,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  serviceBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary[300],
  },
  serviceTitle: {
    flex: 1,
    // Service title styling
  },
  moreServices: {
    fontStyle: "italic",
    marginTop: MARGIN.xs,
  },
  discountSection: {
    marginBottom: MARGIN.lg,
    paddingVertical: PADDING.sm,
    paddingHorizontal: PADDING.md,
    backgroundColor: COLORS.success[50],
    borderRadius: BORDER_RADIUS.md,
  },
  discountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  discountValueContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.md,
  },
  discountValue: {
    // Discount value styling
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  discountedPrice: {
    // Discounted price styling
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    // Status text styling
  },
  dateRangeContainer: {
    marginBottom: MARGIN.md,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  dateText: {
    fontSize: 12,
  },
  updateTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
    paddingTop: PADDING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  updateTime: {
    fontSize: 12,
  },
  // Menu button styles
  menuButton: {
    position: "absolute",
    top: MARGIN.sm,
    right: MARGIN.sm,
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
    overflow: "hidden",
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
  },
  deleteIcon: {
    backgroundColor: COLORS.error[50],
    borderColor: COLORS.error[200],
  },
  // Confirmation Modal styles
  confirmModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
  },
  confirmModalContainer: {
    backgroundColor: COLORS.background.primary,
    borderRadius: BORDER_RADIUS.lg,
    width: "100%",
    maxWidth: 400,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmModalHeader: {
    paddingHorizontal: PADDING.lg,
    paddingTop: PADDING.lg,
    paddingBottom: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  confirmModalContent: {
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.lg,
  },
  confirmModalMessage: {
    textAlign: "center",
    lineHeight: LINE_HEIGHT.body1,
  },
  confirmModalActions: {
    flexDirection: "row",
    paddingHorizontal: PADDING.lg,
    paddingBottom: PADDING.lg,
    gap: MARGIN.md,
  },
  confirmModalCancelButton: {
    flex: 1,
  },
  confirmModalConfirmButton: {
    flex: 1,
  },
});
