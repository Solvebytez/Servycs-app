import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { COLORS } from "../../../constants";
import {
  useMyServiceListings,
  useDeleteServiceListing,
} from "../../../hooks/useServiceListings";
import { useRouter } from "expo-router";
import { ResponsiveText } from "../../../components/UI/ResponsiveText";
import { ResponsiveButton } from "../../../components/UI/ResponsiveButton";

export default function VendorServicesScreen() {
  const router = useRouter();
  const { data, isLoading, error, refetch } = useMyServiceListings();
  const deleteServiceListing = useDeleteServiceListing();

  // Force refresh on component mount to get fresh data
  React.useEffect(() => {
    console.log("🔄 Component mounted, forcing data refresh...");
    refetch();
  }, []);

  const handleAddNewService = () => {
    router.push("/(dashboard)/(vendor)/add-listing");
  };

  const handleEditService = (serviceId: string) => {
    router.push(`/(dashboard)/(vendor)/edit-listing?id=${serviceId}`);
  };

  const handleDeleteService = async (
    serviceId: string,
    serviceTitle: string
  ) => {
    console.log(
      "🗑️ Delete button clicked for service:",
      serviceId,
      serviceTitle
    );
    try {
      console.log("🔄 Calling delete API...");
      await deleteServiceListing.mutateAsync(serviceId);
      console.log("✅ Service deleted successfully");
      // The mutation will automatically refetch the data
    } catch (error) {
      console.error("❌ Failed to delete service:", error);
    }
  };

  // Debug: Log all listings to see what we're receiving
  console.log(
    "🔍 All listings from API:",
    data?.data?.listings?.map((l) => ({
      id: l.id,
      title: l.title,
      status: l.status,
    }))
  );

  // Separate listings by status
  const activeListings =
    data?.data?.listings?.filter(
      (listing) => listing.status === "ACTIVE" || listing.status === "PENDING"
    ) || [];

  const draftListings =
    data?.data?.listings?.filter(
      (listing) =>
        listing.status === "DRAFT" || listing.status === "OFF_SERVICE"
    ) || [];

  console.log(
    "📊 Active listings:",
    activeListings.map((l) => ({ title: l.title, status: l.status }))
  );
  console.log(
    "📋 Draft listings:",
    draftListings.map((l) => ({ title: l.title, status: l.status }))
  );

  const renderServiceCard = (listing: any) => {
    console.log(
      `🎯 Rendering card for "${listing.title}" with status: ${listing.status}`
    );
    return (
      <View key={listing.id} style={styles.serviceCard}>
        <TouchableOpacity
          style={styles.serviceCardContent}
          onPress={() => handleEditService(listing.id)}
        >
          <View style={styles.serviceHeader}>
            <ResponsiveText
              variant="h6"
              weight="bold"
              color={COLORS.text.primary}
            >
              {listing.title}
            </ResponsiveText>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    listing.status === "DRAFT"
                      ? COLORS.warning[100]
                      : listing.status === "PENDING"
                      ? COLORS.info[100]
                      : listing.status === "ACTIVE"
                      ? COLORS.success[100]
                      : COLORS.error[100],
                },
              ]}
            >
              <ResponsiveText
                variant="caption1"
                weight="medium"
                color={
                  listing.status === "DRAFT"
                    ? COLORS.warning[700]
                    : listing.status === "PENDING"
                    ? COLORS.info[700]
                    : listing.status === "ACTIVE"
                    ? COLORS.success[700]
                    : COLORS.error[700]
                }
              >
                {listing.status}
              </ResponsiveText>
            </View>
          </View>

          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={styles.serviceDescription}
          >
            {listing.description}
          </ResponsiveText>

          {listing.category && (
            <ResponsiveText
              variant="caption1"
              color={COLORS.text.secondary}
              style={styles.categoryText}
            >
              Category: {listing.category.name}
            </ResponsiveText>
          )}

          <View style={styles.serviceStats}>
            <ResponsiveText variant="caption1" color={COLORS.text.secondary}>
              {listing.services?.length || 0} services
            </ResponsiveText>
            <ResponsiveText variant="caption1" color={COLORS.text.secondary}>
              {listing.totalBookings || 0} bookings
            </ResponsiveText>
          </View>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteService(listing.id, listing.title)}
        >
          <ResponsiveText
            variant="caption1"
            weight="medium"
            color={COLORS.error[600]}
          >
            🗑️ Delete
          </ResponsiveText>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ResponsiveText
            variant="h4"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.title}
          >
            My Services
          </ResponsiveText>
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={styles.subtitle}
          >
            Manage your offerings
          </ResponsiveText>
        </View>
        <View style={styles.loadingContainer}>
          <ResponsiveText variant="body1" color={COLORS.text.secondary}>
            Loading your services...
          </ResponsiveText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ResponsiveText
            variant="h4"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.title}
          >
            My Services
          </ResponsiveText>
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={styles.subtitle}
          >
            Manage your offerings
          </ResponsiveText>
        </View>
        <View style={styles.errorContainer}>
          <ResponsiveText variant="body1" color={COLORS.error[600]}>
            Error loading services
          </ResponsiveText>
          <ResponsiveButton
            title="Retry"
            variant="outline"
            size="small"
            onPress={() => refetch()}
            style={styles.retryButton}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ResponsiveText
          variant="h4"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.title}
        >
          My Services
        </ResponsiveText>
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.subtitle}
        >
          Manage your offerings
        </ResponsiveText>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
      >
        <ResponsiveButton
          title="➕ Add New Service"
          variant="primary"
          size="large"
          onPress={handleAddNewService}
          style={styles.addButton}
        />

        {/* Active Services Section */}
        <View style={styles.servicesSection}>
          <ResponsiveText
            variant="h6"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.sectionTitle}
          >
            Active Services ({activeListings.length})
          </ResponsiveText>
          {activeListings.length > 0 ? (
            activeListings.map(renderServiceCard)
          ) : (
            <View style={styles.emptyState}>
              <ResponsiveText variant="h3" style={styles.emptyIcon}>
                🛠️
              </ResponsiveText>
              <ResponsiveText
                variant="h6"
                weight="bold"
                color={COLORS.text.primary}
                style={styles.emptyTitle}
              >
                No active services yet
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.emptySubtitle}
              >
                Start by adding your first service
              </ResponsiveText>
            </View>
          )}
        </View>

        {/* Draft Services Section */}
        <View style={styles.servicesSection}>
          <ResponsiveText
            variant="h6"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.sectionTitle}
          >
            Draft & Inactive Services ({draftListings.length})
          </ResponsiveText>
          {draftListings.length > 0 ? (
            draftListings.map(renderServiceCard)
          ) : (
            <View style={styles.emptyState}>
              <ResponsiveText
                variant="body1"
                color={COLORS.text.secondary}
                style={styles.placeholderText}
              >
                No draft or inactive services
              </ResponsiveText>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: COLORS.primary[100],
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    // ResponsiveText handles styling
  },
  content: {
    flex: 1,
  },
  addButton: {
    margin: 20,
  },
  servicesSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  serviceCard: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    overflow: "hidden",
  },
  serviceCardContent: {
    padding: 16,
  },
  deleteButton: {
    backgroundColor: COLORS.error[50],
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    alignItems: "center",
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  serviceDescription: {
    marginBottom: 8,
    lineHeight: 20,
  },
  categoryText: {
    marginBottom: 8,
  },
  serviceStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptySubtitle: {
    textAlign: "center",
  },
  placeholderText: {
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  retryButton: {
    marginTop: 16,
  },
});
