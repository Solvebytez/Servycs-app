import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  ResponsiveText,
  ResponsiveCard,
  ResponsiveButton,
  GlobalStatusBar,
  AppHeader,
} from "@/components";
import {
  usePromotion,
  useUpdatePromotion,
  useDeletePromotion,
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

export default function PromotionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // State for confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    action: string;
    newToggle?: boolean;
  }>({
    action: "",
    newToggle: false,
  });

  // Fetch promotion details
  const { data: promotion, isLoading, isError, error } = usePromotion(id || "");

  // Mutations
  const updatePromotionMutation = useUpdatePromotion();
  const deletePromotionMutation = useDeletePromotion();

  // Handle service press - navigate to service details
  const handleServicePress = (serviceId: string) => {
    router.push(`/(dashboard)/service-details?id=${serviceId}`);
  };

  // Handle edit promotion
  const handleEditPromotion = () => {
    if (promotion) {
      router.push(`/(dashboard)/(vendor)/edit-promotion?id=${promotion.id}`);
    }
  };

  // Handle toggle promotion status
  const handleTogglePromotionStatus = () => {
    if (!promotion) return;

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

    // Show confirmation modal
    setConfirmAction({
      action,
      newToggle,
    });
    setShowConfirmModal(true);
  };

  // Handle delete promotion
  const handleDeletePromotion = () => {
    if (!promotion) return;

    setConfirmAction({
      action: "delete",
    });
    setShowConfirmModal(true);
  };

  // Handle confirmation modal actions
  const handleConfirmAction = () => {
    if (!promotion) return;

    if (confirmAction.action === "delete") {
      deletePromotionMutation.mutate(promotion.id, {
        onSuccess: () => {
          setShowConfirmModal(false);
          router.back(); // Go back to promotions list
        },
        onError: (error) => {
          console.error("Error deleting promotion:", error);
          Alert.alert("Error", "Failed to delete promotion. Please try again.");
        },
      });
    } else {
      // Handle toggle
      updatePromotionMutation.mutate(
        {
          id: promotion.id,
          data: { isPromotionOn: confirmAction.newToggle },
        },
        {
          onSuccess: () => {
            setShowConfirmModal(false);
            setConfirmAction({
              action: "",
              newToggle: false,
            });
          },
          onError: (error) => {
            console.error("Error updating promotion:", error);
            Alert.alert(
              "Error",
              "Failed to update promotion. Please try again."
            );
          },
        }
      );
    }
  };

  // Helper functions
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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

  // Loading state
  if (isLoading) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor="rgba(0, 0, 0, 0.3)"
          translucent={true}
        />
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
          <AppHeader
            onBackPress={() => router.back()}
            title="Promotion Details"
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary[500]} />
            <ResponsiveText
              variant="body1"
              color={COLORS.text.secondary}
              style={styles.loadingText}
            >
              Loading promotion details...
            </ResponsiveText>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // Error state
  if (isError || !promotion) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor="rgba(0, 0, 0, 0.3)"
          translucent={true}
        />
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
          <AppHeader
            onBackPress={() => router.back()}
            title="Promotion Details"
          />
          <View style={styles.errorContainer}>
            <Ionicons
              name="alert-circle-outline"
              size={64}
              color={COLORS.error[500]}
            />
            <ResponsiveText
              variant="h5"
              weight="bold"
              color={COLORS.error[600]}
              style={styles.errorTitle}
            >
              Promotion Not Found
            </ResponsiveText>
            <ResponsiveText
              variant="body1"
              color={COLORS.text.secondary}
              style={styles.errorDescription}
            >
              The promotion you're looking for doesn't exist or has been
              removed.
            </ResponsiveText>
            <ResponsiveButton
              title="Go Back"
              variant="primary"
              size="medium"
              onPress={() => router.back()}
              style={styles.errorButton}
            />
          </View>
        </SafeAreaView>
      </>
    );
  }

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
          title="Promotion Details"
          rightActionButton={{
            iconName: "create-outline",
            onPress: handleEditPromotion,
            backgroundColor: COLORS.primary[500],
            iconColor: COLORS.white,
          }}
        />

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Banner Image */}
          <View style={styles.bannerContainer}>
            {promotion.bannerImage ? (
              <Image
                source={{
                  uri: promotion.bannerImage.startsWith("file://")
                    ? promotion.bannerImage
                    : promotion.bannerImage,
                }}
                style={styles.bannerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.bannerPlaceholder}>
                <Ionicons
                  name="megaphone"
                  size={64}
                  color={COLORS.primary[300]}
                />
                <ResponsiveText
                  variant="h6"
                  weight="medium"
                  color={COLORS.text.secondary}
                  style={styles.bannerPlaceholderText}
                >
                  No Banner Image
                </ResponsiveText>
              </View>
            )}

            {/* Status Badge */}
            <View style={styles.statusBadgeContainer}>
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: getStatusColor(promotion.status) + "90",
                  },
                ]}
              >
                <ResponsiveText
                  variant="caption1"
                  weight="bold"
                  color={COLORS.white}
                  style={styles.statusBadgeText}
                >
                  {getStatusText(promotion.status)}
                </ResponsiveText>
              </View>
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Title and Description */}
            <ResponsiveCard variant="elevated" style={styles.titleCard}>
              <ResponsiveText
                variant="h4"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.promotionTitle}
              >
                {promotion.title}
              </ResponsiveText>

              {promotion.description && (
                <ResponsiveText
                  variant="body1"
                  color={COLORS.text.secondary}
                  style={styles.promotionDescription}
                >
                  {promotion.description}
                </ResponsiveText>
              )}

              {/* Toggle Status Indicator */}
              {promotion.status === "ACTIVE" && (
                <View style={styles.toggleStatusContainer}>
                  <View
                    style={[
                      styles.toggleIndicator,
                      {
                        backgroundColor: promotion.isPromotionOn
                          ? COLORS.success[500]
                          : COLORS.warning[500],
                      },
                    ]}
                  />
                  <ResponsiveText
                    variant="body2"
                    weight="medium"
                    color={
                      promotion.isPromotionOn
                        ? COLORS.success[600]
                        : COLORS.warning[600]
                    }
                    style={styles.toggleStatusText}
                  >
                    {promotion.isPromotionOn
                      ? "Currently Active"
                      : "Currently Paused"}
                  </ResponsiveText>
                </View>
              )}
            </ResponsiveCard>

            {/* Discount Information */}
            <ResponsiveCard variant="elevated" style={styles.discountCard}>
              <View style={styles.discountHeader}>
                <Ionicons
                  name="pricetag"
                  size={24}
                  color={COLORS.success[500]}
                />
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.discountHeaderText}
                >
                  Discount Details
                </ResponsiveText>
              </View>

              <View style={styles.discountContent}>
                <View style={styles.discountValueContainer}>
                  <ResponsiveText
                    variant="h3"
                    weight="bold"
                    color={COLORS.success[500]}
                    style={styles.discountValue}
                  >
                    {promotion.discountType === "percentage"
                      ? `${promotion.discountValue}% OFF`
                      : `$${promotion.discountValue} OFF`}
                  </ResponsiveText>

                  {promotion.originalPrice && (
                    <View style={styles.priceContainer}>
                      <ResponsiveText
                        variant="body1"
                        color={COLORS.text.secondary}
                        style={styles.originalPrice}
                      >
                        Original: ${promotion.originalPrice}
                      </ResponsiveText>
                      <ResponsiveText
                        variant="h6"
                        weight="bold"
                        color={COLORS.primary[500]}
                        style={styles.discountedPrice}
                      >
                        After Discount: $
                        {promotion.originalPrice - promotion.discountValue}
                      </ResponsiveText>
                    </View>
                  )}
                </View>

                <View style={styles.discountTypeContainer}>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.secondary}
                    style={styles.discountTypeLabel}
                  >
                    Discount Type:
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    weight="medium"
                    color={COLORS.text.primary}
                    style={styles.discountTypeValue}
                  >
                    {promotion.discountType === "percentage"
                      ? "Percentage"
                      : "Fixed Amount"}
                  </ResponsiveText>
                </View>
              </View>
            </ResponsiveCard>

            {/* Date Range */}
            <ResponsiveCard variant="elevated" style={styles.dateCard}>
              <View style={styles.dateHeader}>
                <Ionicons
                  name="calendar"
                  size={24}
                  color={COLORS.primary[500]}
                />
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.dateHeaderText}
                >
                  Promotion Period
                </ResponsiveText>
              </View>

              <View style={styles.dateContent}>
                <View style={styles.dateItem}>
                  <View style={styles.dateItemHeader}>
                    <Ionicons
                      name="play-circle"
                      size={20}
                      color={COLORS.success[500]}
                    />
                    <ResponsiveText
                      variant="body2"
                      weight="medium"
                      color={COLORS.text.primary}
                      style={styles.dateItemLabel}
                    >
                      Start Date
                    </ResponsiveText>
                  </View>
                  <ResponsiveText
                    variant="body1"
                    color={COLORS.text.secondary}
                    style={styles.dateItemValue}
                  >
                    {formatDate(promotion.startDate)}
                  </ResponsiveText>
                </View>

                <View style={styles.dateItem}>
                  <View style={styles.dateItemHeader}>
                    <Ionicons
                      name="stop-circle"
                      size={20}
                      color={COLORS.error[500]}
                    />
                    <ResponsiveText
                      variant="body2"
                      weight="medium"
                      color={COLORS.text.primary}
                      style={styles.dateItemLabel}
                    >
                      End Date
                    </ResponsiveText>
                  </View>
                  <ResponsiveText
                    variant="body1"
                    color={COLORS.text.secondary}
                    style={styles.dateItemValue}
                  >
                    {formatDate(promotion.endDate)}
                  </ResponsiveText>
                </View>
              </View>
            </ResponsiveCard>

            {/* Associated Services */}
            {promotion.serviceListings &&
              promotion.serviceListings.length > 0 && (
                <ResponsiveCard variant="elevated" style={styles.servicesCard}>
                  <View style={styles.servicesHeader}>
                    <Ionicons
                      name="list"
                      size={24}
                      color={COLORS.primary[500]}
                    />
                    <ResponsiveText
                      variant="h6"
                      weight="bold"
                      color={COLORS.text.primary}
                      style={styles.servicesHeaderText}
                    >
                      Associated Services ({promotion.serviceListings.length})
                    </ResponsiveText>
                  </View>

                  <View style={styles.servicesList}>
                    {promotion.serviceListings.map((service, index) => (
                      <TouchableOpacity
                        key={service.id}
                        style={styles.serviceItem}
                        onPress={() => handleServicePress(service.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.serviceItemContent}>
                          <View style={styles.serviceItemHeader}>
                            <View style={styles.serviceBullet} />
                            <ResponsiveText
                              variant="body1"
                              weight="medium"
                              color={COLORS.text.primary}
                              style={styles.serviceTitle}
                              numberOfLines={2}
                            >
                              {service.title}
                            </ResponsiveText>
                          </View>

                          {service.categoryPath &&
                            service.categoryPath.length > 0 && (
                              <View style={styles.serviceCategoryContainer}>
                                <Ionicons
                                  name="pricetag"
                                  size={12}
                                  color={COLORS.primary[300]}
                                />
                                <ResponsiveText
                                  variant="caption1"
                                  color={COLORS.primary[300]}
                                  style={styles.serviceCategory}
                                >
                                  {service.categoryPath[0]}
                                </ResponsiveText>
                              </View>
                            )}
                        </View>

                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={COLORS.text.secondary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </ResponsiveCard>
              )}

            {/* Promotion Metadata */}
            <ResponsiveCard variant="elevated" style={styles.metadataCard}>
              <View style={styles.metadataHeader}>
                <Ionicons
                  name="information-circle"
                  size={24}
                  color={COLORS.primary[500]}
                />
                <ResponsiveText
                  variant="h6"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.metadataHeaderText}
                >
                  Promotion Information
                </ResponsiveText>
              </View>

              <View style={styles.metadataContent}>
                <View style={styles.metadataItem}>
                  <ResponsiveText
                    variant="body2"
                    weight="medium"
                    color={COLORS.text.secondary}
                    style={styles.metadataLabel}
                  >
                    Created:
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.primary}
                    style={styles.metadataValue}
                  >
                    {formatDate(promotion.createdAt)}
                  </ResponsiveText>
                </View>

                <View style={styles.metadataItem}>
                  <ResponsiveText
                    variant="body2"
                    weight="medium"
                    color={COLORS.text.secondary}
                    style={styles.metadataLabel}
                  >
                    Last Updated:
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.primary}
                    style={styles.metadataValue}
                  >
                    {formatTimeAgo(promotion.updatedAt)}
                  </ResponsiveText>
                </View>

                <View style={styles.metadataItem}>
                  <ResponsiveText
                    variant="body2"
                    weight="medium"
                    color={COLORS.text.secondary}
                    style={styles.metadataLabel}
                  >
                    Promotion ID:
                  </ResponsiveText>
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.primary}
                    style={styles.metadataValue}
                  >
                    {promotion.id}
                  </ResponsiveText>
                </View>
              </View>
            </ResponsiveCard>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              {/* Edit Button */}
              <ResponsiveButton
                title="Edit Promotion"
                variant="primary"
                size="large"
                onPress={handleEditPromotion}
                iconName="create-outline"
                style={styles.actionButton}
              />

              {/* Toggle Status Button (only for ACTIVE promotions) */}
              {promotion.status === "ACTIVE" && (
                <ResponsiveButton
                  title={
                    promotion.isPromotionOn
                      ? "Pause Promotion"
                      : "Resume Promotion"
                  }
                  variant={promotion.isPromotionOn ? "warning" : "success"}
                  size="large"
                  onPress={handleTogglePromotionStatus}
                  iconName={
                    promotion.isPromotionOn ? "pause-outline" : "play-outline"
                  }
                  style={styles.actionButton}
                  loading={updatePromotionMutation.isPending}
                />
              )}

              {/* Delete Button */}
              <ResponsiveButton
                title="Delete Promotion"
                variant="danger"
                size="large"
                onPress={handleDeletePromotion}
                iconName="trash-outline"
                style={styles.actionButton}
                loading={deletePromotionMutation.isPending}
              />
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </View>
        </ScrollView>

        {/* Confirmation Modal */}
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
                    ? `Are you sure you want to delete "${promotion.title}"? This action cannot be undone and will also delete the banner image.`
                    : `Are you sure you want to ${confirmAction.action} "${promotion.title}"?`}
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
                  onPress={handleConfirmAction}
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
  },
  scrollContent: {
    paddingBottom: PADDING.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
  },
  loadingText: {
    marginTop: MARGIN.md,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
  },
  errorTitle: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.md,
    textAlign: "center",
  },
  errorDescription: {
    textAlign: "center",
    marginBottom: MARGIN.xl,
    lineHeight: LINE_HEIGHT.body1,
  },
  errorButton: {
    marginTop: MARGIN.md,
  },
  bannerContainer: {
    position: "relative",
    height: 200,
    marginBottom: MARGIN.lg,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  bannerPlaceholderText: {
    marginTop: MARGIN.sm,
  },
  statusBadgeContainer: {
    position: "absolute",
    top: MARGIN.md,
    right: MARGIN.md,
  },
  statusBadge: {
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.xl,
  },
  statusBadgeText: {
    fontSize: 12,
  },
  contentContainer: {
    paddingHorizontal: PADDING.screen,
  },
  titleCard: {
    marginBottom: MARGIN.lg,
    padding: PADDING.lg,
  },
  promotionTitle: {
    marginBottom: MARGIN.md,
    lineHeight: LINE_HEIGHT.h4,
  },
  promotionDescription: {
    lineHeight: LINE_HEIGHT.body1,
    marginBottom: MARGIN.lg,
  },
  toggleStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: PADDING.sm,
    paddingHorizontal: PADDING.md,
    backgroundColor: COLORS.background.light,
    borderRadius: BORDER_RADIUS.md,
  },
  toggleIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: MARGIN.sm,
  },
  toggleStatusText: {
    fontSize: 14,
  },
  discountCard: {
    marginBottom: MARGIN.lg,
    padding: PADDING.lg,
  },
  discountHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  discountHeaderText: {
    marginLeft: MARGIN.sm,
  },
  discountContent: {
    gap: MARGIN.lg,
  },
  discountValueContainer: {
    alignItems: "center",
  },
  discountValue: {
    marginBottom: MARGIN.md,
  },
  priceContainer: {
    alignItems: "center",
    gap: MARGIN.xs,
  },
  originalPrice: {
    textDecorationLine: "line-through",
    opacity: 0.7,
  },
  discountedPrice: {
    // Discounted price styling
  },
  discountTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: PADDING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
  },
  discountTypeLabel: {
    // Label styling
  },
  discountTypeValue: {
    // Value styling
  },
  dateCard: {
    marginBottom: MARGIN.lg,
    padding: PADDING.lg,
  },
  dateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  dateHeaderText: {
    marginLeft: MARGIN.sm,
  },
  dateContent: {
    gap: MARGIN.lg,
  },
  dateItem: {
    // Date item styling
  },
  dateItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  dateItemLabel: {
    marginLeft: MARGIN.xs,
  },
  dateItemValue: {
    // Date value styling
  },
  servicesCard: {
    marginBottom: MARGIN.lg,
    padding: PADDING.lg,
  },
  servicesHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  servicesHeaderText: {
    marginLeft: MARGIN.sm,
  },
  servicesList: {
    gap: MARGIN.md,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: PADDING.sm,
    paddingHorizontal: PADDING.md,
    backgroundColor: COLORS.background.light,
    borderRadius: BORDER_RADIUS.md,
  },
  serviceItemContent: {
    flex: 1,
    marginRight: MARGIN.sm,
  },
  serviceItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  serviceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary[500],
    marginRight: MARGIN.sm,
  },
  serviceTitle: {
    flex: 1,
    lineHeight: LINE_HEIGHT.body1,
  },
  serviceCategoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  serviceCategory: {
    fontSize: 12,
  },
  metadataCard: {
    marginBottom: MARGIN.lg,
    padding: PADDING.lg,
  },
  metadataHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  metadataHeaderText: {
    marginLeft: MARGIN.sm,
  },
  metadataContent: {
    gap: MARGIN.md,
  },
  metadataItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metadataLabel: {
    // Label styling
  },
  metadataValue: {
    // Value styling
  },
  actionButtonsContainer: {
    gap: MARGIN.md,
  },
  actionButton: {
    // Action button styling
  },
  bottomSpacing: {
    height: 100,
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
