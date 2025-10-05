import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TouchableOpacity,
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
  VendorListCard,
  VendorListFilterBar,
} from "@/components";
import {
  COLORS,
  FONT_SIZE,
  LINE_HEIGHT,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
  LAYOUT,
} from "@/constants";
import { ServiceListing } from "@/services/service";
import {
  useInfiniteMyServiceListings,
  useUpdateServiceListing,
  useDeleteServiceListing,
  flattenInfiniteServiceListings,
  getPaginationInfo,
} from "@/hooks/useServiceListings";

// Import the VendorServiceListing type from VendorListCard
import { VendorServiceListing } from "@/components/vendor/VendorListCard";

export default function MyListScreen() {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "ACTIVE" | "PENDING" | "REJECTED" | "OFF_SERVICE" | "DRAFT"
  >("all");

  // State for custom confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    listing: VendorServiceListing | null;
    action: string;
    newStatus: string;
  }>({
    listing: null,
    action: "",
    newStatus: "",
  });

  // Create filters object for the API
  // Build filters for the query
  const filters = useMemo(() => {
    if (filterStatus === "all") return undefined;
    return { status: filterStatus };
  }, [filterStatus]);

  // Use infinite query hook for vendor's own listings
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
    isRefetching,
  } = useInfiniteMyServiceListings(filters);

  // Mutation hooks for optimistic updates
  const updateListingMutation = useUpdateServiceListing();
  const deleteListingMutation = useDeleteServiceListing();

  // Helper function to get badges based on status
  const getBadgesForStatus = useCallback((status: string): string[] => {
    switch (status) {
      case "ACTIVE":
        return ["Live"];
      case "PENDING":
        return ["Pending Approval"];
      case "REJECTED":
        return ["Rejected"];
      case "OFF_SERVICE":
        return ["Off Service"];
      case "DRAFT":
        return ["Draft"];
      default:
        return [];
    }
  }, []);

  // Helper function to transform ServiceListing to VendorServiceListing format
  const transformListingToVendorFormat = useCallback(
    (listing: ServiceListing): VendorServiceListing => {
      const services = listing.services || [];
      const serviceCount = services.length;

      // Determine current price and original price based on multiple services
      let currentPrice = "₹0";
      let originalPrice: string | undefined = undefined;
      let priceDisplayText = "";

      if (services.length === 0) {
        currentPrice = "N/A";
        priceDisplayText = "No Services";
      } else if (services.length === 1) {
        // Single service - show its price
        const service = services[0];
        const servicePrice =
          typeof service.price === "string"
            ? parseFloat(service.price)
            : service.price;
        const serviceDiscountPrice = service.discountPrice
          ? typeof service.discountPrice === "string"
            ? parseFloat(service.discountPrice)
            : service.discountPrice
          : null;

        // Check if price is null or undefined
        if (
          servicePrice === null ||
          servicePrice === undefined ||
          isNaN(servicePrice)
        ) {
          currentPrice = "N/A";
        } else if (serviceDiscountPrice && serviceDiscountPrice > 0) {
          currentPrice = `₹${serviceDiscountPrice}`;
          originalPrice = `₹${servicePrice}`;
        } else {
          currentPrice = `₹${servicePrice}`;
        }
        priceDisplayText =
          service.name.charAt(0).toUpperCase() + service.name.slice(1);
      } else {
        // Multiple services - show price range
        const prices = services
          .map((service) => {
            const price =
              typeof service.price === "string"
                ? parseFloat(service.price)
                : service.price;
            const discountPrice = service.discountPrice
              ? typeof service.discountPrice === "string"
                ? parseFloat(service.discountPrice)
                : service.discountPrice
              : null;
            return discountPrice && discountPrice > 0 ? discountPrice : price;
          })
          .filter(
            (price) => price !== null && price !== undefined && !isNaN(price)
          ); // Filter out null/undefined prices

        if (prices.length === 0) {
          // All services have null prices
          currentPrice = "N/A";
        } else {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          if (minPrice === maxPrice) {
            currentPrice = `₹${minPrice}`;
          } else {
            currentPrice = `₹${minPrice} - ₹${maxPrice}`;
          }
        }
        priceDisplayText = `${serviceCount} Services`;
      }

      // Handle image URL - ensure it's a proper URL
      let imageUrl = "https://picsum.photos/400/300?random=1";

      if (listing.image) {
        if (listing.image.startsWith("http")) {
          imageUrl = listing.image;
        } else if (listing.image.startsWith("/")) {
          // Relative path - make it absolute
          imageUrl = `http://192.168.0.131:5000${listing.image}`;
        } else {
          // Assume it's a filename
          imageUrl = `http://192.168.0.131:5000/uploads/${listing.image}`;
        }
      }

      return {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: currentPrice,
        originalPrice: originalPrice,
        priceDisplayText: priceDisplayText, // New field to show service info
        serviceCount: serviceCount, // New field to show number of services
        category: listing.categoryPath?.join(" > ") || "Uncategorized",
        categories: (() => {
          // Collect all unique category names from all services
          const allCategories = new Set<string>();

          services.forEach((service) => {
            if (service.categoryPaths && Array.isArray(service.categoryPaths)) {
              service.categoryPaths.forEach((path: string[]) => {
                if (path && path.length > 0) {
                  // Get the last (leaf) category name
                  allCategories.add(path[path.length - 1]);
                }
              });
            }
          });

          // If no service categories, fall back to listing category
          if (
            allCategories.size === 0 &&
            listing.categoryPath &&
            listing.categoryPath.length > 0
          ) {
            allCategories.add(
              listing.categoryPath[listing.categoryPath.length - 1]
            );
          }

          return Array.from(allCategories);
        })(),
        status: (() => {
          switch (listing.status) {
            case "ACTIVE":
              return "active";
            case "OFF_SERVICE":
              return "inactive";
            case "PENDING":
              return "pending";
            case "REJECTED":
              return "rejected";
            case "DRAFT":
              return "draft";
            default:
              return "pending";
          }
        })() as "active" | "inactive" | "pending" | "rejected" | "draft",
        rating: listing.rating,
        reviewCount: listing.totalReviews,
        views: listing.totalBookings, // Using bookings as views for now
        imageUrl: imageUrl,
        badges: getBadgesForStatus(listing.status),
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt,
      };
    },
    [getBadgesForStatus]
  );

  // Transform and flatten the data
  const allListings = useMemo(() => {
    if (!data) return [];
    return flattenInfiniteServiceListings(data).map(
      transformListingToVendorFormat
    );
  }, [data, transformListingToVendorFormat]);

  // Get pagination info
  const paginationInfo = useMemo(() => getPaginationInfo(data), [data]);

  // Event handlers with optimistic updates
  const handleListingPress = useCallback(
    (listing: VendorServiceListing) => {
      // Navigate to service details screen
      router.push(`/(dashboard)/service-details?id=${listing.id}`);
    },
    [router]
  );

  const handleEditListing = useCallback(
    (listing: VendorServiceListing) => {
      router.push(`/(dashboard)/(vendor)/edit-listing?id=${listing.id}`);
    },
    [router]
  );

  const handleToggleStatus = useCallback((listing: VendorServiceListing) => {
    const currentStatus = listing.status;
    let newStatus: string;
    let action: string;

    // Determine new status based on current status
    if (currentStatus === "active") {
      newStatus = "OFF_SERVICE";
      action = "deactivate";
    } else if (currentStatus === "inactive") {
      newStatus = "ACTIVE";
      action = "activate";
    } else {
      // For pending/rejected listings, can't toggle status
      Alert.alert(
        "Cannot Change Status",
        "This listing is pending approval or has been rejected. You cannot change its status.",
        [{ text: "OK" }]
      );
      return;
    }

    // Show custom confirmation modal
    setConfirmAction({
      listing,
      action,
      newStatus,
    });
    setShowConfirmModal(true);
  }, []);

  const handleDeleteListing = useCallback(
    (listing: VendorServiceListing) => {
      Alert.alert(
        "Delete Listing",
        `Are you sure you want to delete "${listing.title}"? This action cannot be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              deleteListingMutation.mutate(listing.id);
            },
          },
        ]
      );
    },
    [deleteListingMutation]
  );

  // Load more function for infinite scroll
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Render item for FlatList
  const renderItem = useCallback(
    ({ item }: { item: VendorServiceListing }) => (
      <VendorListCard
        listing={item}
        onPress={handleListingPress}
        onEdit={handleEditListing}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteListing}
        isDeleting={deleteListingMutation.isPending}
      />
    ),
    [
      handleListingPress,
      handleEditListing,
      handleToggleStatus,
      handleDeleteListing,
      deleteListingMutation.isPending,
    ]
  );

  // Render footer with loading indicator
  const renderFooter = useCallback(() => {
    if (!isFetchingNextPage) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary[500]} />
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.footerText}
        >
          Loading more listings...
        </ResponsiveText>
      </View>
    );
  }, [isFetchingNextPage]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading) return null;

    return (
      <ResponsiveCard variant="elevated" style={styles.emptyCard}>
        <Ionicons
          name="list-outline"
          size={LAYOUT.iconLarge}
          color={COLORS.text.secondary}
        />
        <ResponsiveText
          variant="h6"
          weight="medium"
          color={COLORS.text.secondary}
          style={styles.emptyTitle}
        >
          No Listings Found
        </ResponsiveText>
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.emptyDescription}
        >
          {filterStatus === "all"
            ? "Start by adding your first service listing"
            : `No listings found for the selected filter`}
        </ResponsiveText>
        {filterStatus === "all" && (
          <ResponsiveButton
            title="Add First Listing"
            variant="primary"
            size="medium"
            onPress={() => {
              router.push("/(dashboard)/(vendor)/add-listing");
            }}
            style={styles.addFirstButton}
          />
        )}
      </ResponsiveCard>
    );
  }, [isLoading, filterStatus, router]);

  // Show error state
  if (isError) {
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
            title="My Listings"
            rightActionButton={{
              iconName: "add",
              onPress: () => {
                router.push("/(dashboard)/(vendor)/add-listing");
              },
              backgroundColor: COLORS.primary[300],
              iconColor: COLORS.white,
            }}
          />
          <ResponsiveCard variant="elevated" style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={LAYOUT.iconLarge}
              color={COLORS.error[500]}
            />
            <ResponsiveText
              variant="h6"
              weight="medium"
              color={COLORS.error[500]}
              style={styles.errorTitle}
            >
              Error Loading Listings
            </ResponsiveText>
            <ResponsiveText
              variant="body2"
              color={COLORS.text.secondary}
              style={styles.errorDescription}
            >
              {error?.message || "Something went wrong. Please try again."}
            </ResponsiveText>
            <ResponsiveButton
              title="Retry"
              variant="primary"
              size="medium"
              onPress={() => refetch()}
              style={styles.retryButton}
            />
          </ResponsiveCard>
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
          title="My Listings"
          rightActionButton={{
            iconName: "add",
            onPress: () => {
              router.push("/(dashboard)/(vendor)/add-listing");
            },
            backgroundColor: COLORS.primary[300],
            iconColor: COLORS.white,
          }}
        />

        {/* Filter Bar */}
        <View style={styles.filterBarContainer}>
          <VendorListFilterBar
            totalCount={paginationInfo?.totalItems || allListings.length}
            onStatusChange={setFilterStatus}
            currentStatus={filterStatus}
          />
        </View>

        {/* Loading State */}
        {isLoading ? (
          <ResponsiveCard variant="elevated" style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.primary[500]} />
            <ResponsiveText
              variant="body1"
              color={COLORS.text.secondary}
              style={styles.loadingText}
            >
              Loading your listings...
            </ResponsiveText>
          </ResponsiveCard>
        ) : (
          /* FlatList with Infinite Scroll for Vendor's Listings */
          <FlatList
            data={allListings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                colors={[COLORS.primary[500]]}
                tintColor={COLORS.primary[500]}
              />
            }
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={10}
            updateCellsBatchingPeriod={100}
            getItemLayout={(data, index) => ({
              length: 200, // Approximate height of VendorListCard
              offset: 200 * index,
              index,
            })}
          />
        )}

        {/* Custom Confirmation Modal */}
        <Modal
          visible={showConfirmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <ResponsiveText
                  variant="h5"
                  weight="bold"
                  color={COLORS.text.primary}
                >
                  {confirmAction.action.charAt(0).toUpperCase() +
                    confirmAction.action.slice(1)}{" "}
                  Listing
                </ResponsiveText>
              </View>

              {/* Modal Content */}
              <View style={styles.modalContent}>
                <ResponsiveText
                  variant="body1"
                  color={COLORS.text.secondary}
                  style={styles.modalMessage}
                >
                  Are you sure you want to {confirmAction.action} "
                  {confirmAction.listing?.title}"?
                </ResponsiveText>
              </View>

              {/* Modal Actions */}
              <View style={styles.modalActions}>
                <ResponsiveButton
                  title="Cancel"
                  variant="outline"
                  size="small"
                  onPress={() => setShowConfirmModal(false)}
                  disabled={updateListingMutation.isPending}
                  style={styles.modalCancelButton}
                />

                <ResponsiveButton
                  title={
                    updateListingMutation.isPending
                      ? `${
                          confirmAction.action.charAt(0).toUpperCase() +
                          confirmAction.action.slice(1)
                        }ing...`
                      : confirmAction.action.charAt(0).toUpperCase() +
                        confirmAction.action.slice(1)
                  }
                  variant={
                    confirmAction.action === "deactivate" ? "danger" : "primary"
                  }
                  size="small"
                  loading={updateListingMutation.isPending}
                  onPress={() => {
                    if (confirmAction.listing) {
                      updateListingMutation.mutate(
                        {
                          id: confirmAction.listing.id,
                          data: { status: confirmAction.newStatus },
                        },
                        {
                          onSuccess: () => {
                            setShowConfirmModal(false);
                            setConfirmAction({
                              listing: null,
                              action: "",
                              newStatus: "",
                            });
                          },
                          onError: () => {
                            // Keep modal open on error so user can retry
                          },
                        }
                      );
                    }
                  }}
                  disabled={updateListingMutation.isPending}
                  style={styles.modalConfirmButton}
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
  filterBarContainer: {
    paddingHorizontal: PADDING.screen,
  },
  listContainer: {
    paddingHorizontal: PADDING.screen,
    paddingBottom: 100, // Bottom spacing
  },
  loadingCard: {
    marginTop: MARGIN.lg,
    padding: PADDING.lg,
    alignItems: "center",
  },
  loadingText: {
    textAlign: "center",
    marginTop: MARGIN.sm,
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
  errorCard: {
    marginTop: MARGIN.lg,
    padding: PADDING.xl,
    alignItems: "center",
  },
  errorTitle: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
  },
  errorDescription: {
    textAlign: "center",
    marginBottom: MARGIN.lg,
  },
  retryButton: {
    marginTop: MARGIN.sm,
  },
  footerLoader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PADDING.lg,
  },
  footerText: {
    marginLeft: MARGIN.sm,
  },
  // Modal styles - consistent with app design system
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: PADDING.lg,
  },
  modalContainer: {
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
  modalHeader: {
    paddingHorizontal: PADDING.lg,
    paddingTop: PADDING.lg,
    paddingBottom: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalContent: {
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.lg,
  },
  modalMessage: {
    textAlign: "center",
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    paddingHorizontal: PADDING.lg,
    paddingBottom: PADDING.lg,
    gap: MARGIN.md,
  },
  modalCancelButton: {
    flex: 1,
  },
  modalConfirmButton: {
    flex: 1,
  },
});
