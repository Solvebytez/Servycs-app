import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../../constants";
import {
  ResponsiveText,
  ResponsiveButton,
  GlobalStatusBar,
  AppHeader,
} from "@/components";
import { useUser } from "../../../hooks/useUser";
import {
  useSavedListDetails,
  useDeleteSavedListItem,
} from "../../../hooks/useSavedLists";
// import { useNetworkStatus } from "../../../hooks/useNetworkStatus";
import { ServiceCard } from "../../../components/user/ServiceCard";
import { ServiceCardSkeleton } from "../../../components/common/ServiceCardSkeleton";
import { SavedList } from "../../../services/savedLists";

export default function SavedListDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: user } = useUser();
  // const { isOffline } = useNetworkStatus();
  const isOffline = false; // Temporarily disable network status

  const [refreshing, setRefreshing] = useState(false);

  // Fetch saved list details
  const {
    data: savedList,
    isLoading,
    error,
    refetch,
  } = useSavedListDetails(id || "", user?.id || null);

  const deleteSavedListItem = useDeleteSavedListItem();

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing saved list:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle service press
  const handleServicePress = (serviceId: string) => {
    router.push(`/(dashboard)/service-details?id=${serviceId}`);
  };

  // Handle remove service from list
  const handleRemoveService = (itemId: string, serviceTitle: string) => {
    Alert.alert(
      "Remove Service",
      `Are you sure you want to remove "${serviceTitle}" from this list?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            deleteSavedListItem.mutate(itemId, {
              onSuccess: () => {
                refetch(); // Refresh the list
              },
              onError: (error) => {
                console.error("Error removing service:", error);
                Alert.alert("Error", "Failed to remove service from list");
              },
            });
          },
        },
      ]
    );
  };

  // Render service item
  const renderServiceItem = ({ item }: { item: any }) => (
    <View style={styles.serviceItemContainer}>
      <ServiceCard
        service={item.serviceListing}
        onPress={() => handleServicePress(item.serviceListing.id)}
        showSaveButton={false}
        showRemoveButton={!isOffline}
        onRemove={() => handleRemoveService(item.id, item.serviceListing.title)}
        isRemoving={deleteSavedListItem.isPending}
      />
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Ionicons name="list-outline" size={64} color={COLORS.neutral[300]} />
      </View>
      <ResponsiveText
        variant="h5"
        weight="semiBold"
        color={COLORS.text.primary}
        style={styles.emptyTitle}
      >
        No Services Yet
      </ResponsiveText>
      <ResponsiveText
        variant="body2"
        color={COLORS.text.secondary}
        style={styles.emptyMessage}
      >
        Start adding services to this list to see them here
      </ResponsiveText>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorContainer}>
      <Ionicons
        name="alert-circle-outline"
        size={48}
        color={COLORS.error[500]}
      />
      <ResponsiveText
        variant="h6"
        weight="medium"
        color={COLORS.text.primary}
        style={styles.errorTitle}
      >
        Something went wrong
      </ResponsiveText>
      <ResponsiveText
        variant="body2"
        color={COLORS.text.secondary}
        style={styles.errorMessage}
      >
        Failed to load saved list details
      </ResponsiveText>
      <ResponsiveButton
        title="Try Again"
        variant="outline"
        size="medium"
        onPress={handleRefresh}
        style={styles.retryButton}
        leftIcon={
          <Ionicons name="refresh" size={16} color={COLORS.primary[200]} />
        }
      />
    </View>
  );

  if (isLoading) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <View style={styles.container}>
            {/* Header */}
            <AppHeader
              onBackPress={() => router.back()}
              title="Loading..."
              backgroundColor={COLORS.primary[200]}
              textColor={COLORS.white}
            />

            {/* Loading Content */}
            <View style={styles.content}>
              <View style={styles.skeletonContainer}>
                {[1, 2, 3, 4].map((index) => (
                  <ServiceCardSkeleton key={`skeleton-${index}`} />
                ))}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (error || !savedList) {
    return (
      <>
        <GlobalStatusBar
          barStyle="light-content"
          backgroundColor={COLORS.primary[500]}
          translucent={false}
        />
        <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
          <View style={styles.container}>
            {/* Header */}
            <AppHeader
              onBackPress={() => router.back()}
              title="Saved List"
              backgroundColor={COLORS.primary[200]}
              textColor={COLORS.white}
            />

            {/* Error Content */}
            <View style={styles.content}>{renderErrorState()}</View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <GlobalStatusBar
        barStyle="light-content"
        backgroundColor={COLORS.primary[500]}
        translucent={false}
      />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Header */}
          <AppHeader
            onBackPress={() => router.back()}
            title={savedList.data.name}
            backgroundColor={COLORS.primary[200]}
            textColor={COLORS.white}
          />

          {/* List Info */}
          <LinearGradient
            colors={[COLORS.white, COLORS.neutral[50]]}
            style={styles.listInfoContainer}
          >
            <View style={styles.listInfo}>
              <View style={styles.listIconContainer}>
                <LinearGradient
                  colors={[
                    savedList.data.color || COLORS.primary[200],
                    (savedList.data.color || COLORS.primary[200]) + "CC",
                  ]}
                  style={styles.listIconGradient}
                >
                  <Ionicons
                    name={(savedList.data.icon as any) || "list"}
                    size={22}
                    color={COLORS.white}
                  />
                </LinearGradient>
              </View>
              <View style={styles.listDetails}>
                <ResponsiveText
                  variant="h5"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.listTitle}
                >
                  {savedList.data.name}
                </ResponsiveText>
                {savedList.data.description && (
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.text.secondary}
                    style={styles.listDescription}
                    numberOfLines={3}
                  >
                    {savedList.data.description}
                  </ResponsiveText>
                )}
                <View style={styles.listStatsContainer}>
                  <View style={styles.statsBadge}>
                    <Ionicons
                      name="list-outline"
                      size={16}
                      color={COLORS.primary[500]}
                    />
                    <ResponsiveText
                      variant="caption1"
                      weight="semiBold"
                      color={COLORS.primary[500]}
                      style={styles.statsText}
                    >
                      {savedList.data.itemCount}{" "}
                      {savedList.data.itemCount === 1 ? "service" : "services"}
                    </ResponsiveText>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {savedList.data.items && savedList.data.items.length > 0 ? (
              <FlatList
                data={savedList.data.items}
                renderItem={renderServiceItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    colors={[COLORS.primary[200]]}
                    tintColor={COLORS.primary[200]}
                  />
                }
              />
            ) : (
              renderEmptyState()
            )}
          </View>
        </View>
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
  listInfoContainer: {
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  listInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  listIconContainer: {
    marginRight: MARGIN.md,
  },
  listIconGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  listDetails: {
    flex: 1,
    paddingTop: MARGIN.xs,
  },
  listTitle: {
    marginBottom: MARGIN.sm,
    lineHeight: 28,
  },
  listDescription: {
    marginBottom: MARGIN.lg,
    lineHeight: 20,
  },
  listStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary[50],
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.primary[100],
  },
  statsText: {
    marginLeft: MARGIN.xs,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  listContainer: {
    padding: PADDING.lg,
    paddingTop: PADDING.md,
  },
  serviceItemContainer: {
    marginBottom: MARGIN.sm,
  },
  skeletonContainer: {
    padding: PADDING.lg,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.xl,
  },
  errorTitle: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
  },
  errorMessage: {
    textAlign: "center",
    marginBottom: MARGIN.lg,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    marginBottom: MARGIN.lg,
  },
  emptyTitle: {
    marginBottom: MARGIN.sm,
    textAlign: "center",
  },
  emptyMessage: {
    textAlign: "center",
    lineHeight: 20,
    marginBottom: MARGIN.xl,
  },
});
