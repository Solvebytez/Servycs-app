import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../../constants";
import {
  ResponsiveText,
  ResponsiveCard,
  GlobalStatusBar,
  AppHeader,
} from "../../../components";
import { useUser } from "../../../hooks/useUser";
import { useSalesmanVendors } from "../../../hooks/useSalesmanVendors";
import { VendorListFilterBar } from "../../../components/salesman/VendorListFilterBar";
import { VendorCard } from "../../../components/salesman/VendorCard";

export type VendorFilterStatus =
  | "all"
  | "ACTIVE"
  | "PENDING"
  | "INACTIVE"
  | "SUSPENDED";

export default function VendorListScreen() {
  const router = useRouter();
  const { data: user } = useUser();

  const [filterStatus, setFilterStatus] = useState<VendorFilterStatus>("all");
  const [refreshing, setRefreshing] = useState(false);

  // Create filters object for the API
  const filters = useMemo(() => {
    if (filterStatus === "all") return undefined;
    return { status: filterStatus };
  }, [filterStatus]);

  // Fetch vendors created by this salesman
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
  } = useSalesmanVendors(user?.id || "", filters);

  // Flatten the data from infinite query
  const allVendors = useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap((page: any) => page.data || []);
  }, [data]);

  // Get pagination info
  const paginationInfo = useMemo(() => {
    if (!data?.pages?.[0])
      return { totalItems: 0, currentPage: 1, totalPages: 1 };
    const firstPage = data.pages[0] as any;
    return {
      totalItems: firstPage.pagination?.totalItems || allVendors.length,
      currentPage: firstPage.pagination?.currentPage || 1,
      totalPages: firstPage.pagination?.totalPages || 1,
    };
  }, [data, allVendors.length]);

  // Calculate status counts
  const statusCounts = useMemo(() => {
    const counts = {
      all: allVendors.length,
      ACTIVE: 0,
      PENDING: 0,
      INACTIVE: 0,
      SUSPENDED: 0,
    };

    allVendors.forEach((vendor: any) => {
      if (vendor.status === "ACTIVE") counts.ACTIVE++;
      else if (vendor.status === "PENDING") counts.PENDING++;
      else if (vendor.status === "INACTIVE") counts.INACTIVE++;
      else if (vendor.status === "SUSPENDED") counts.SUSPENDED++;
    });

    return counts;
  }, [allVendors]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing vendor list:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Handle vendor press
  const handleVendorPress = useCallback(
    (vendorId: string) => {
      router.push(`/(dashboard)/vendor-details?id=${vendorId}`);
    },
    [router]
  );

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Handle resend OTP
  const handleResendOTP = useCallback(
    async (vendorId: string) => {
      try {
        const { authService } = await import("../../../services/auth");
        await authService.resendVendorOTP(vendorId);

        // After successful OTP send, redirect to verification screen
        // Pass the vendor's email directly to avoid API call in verification screen
        const vendor = allVendors.find((v: any) => v.id === vendorId);
        console.log("Vendor found:", vendor);
        console.log("Vendor email:", vendor?.email);

        if (!vendor?.email) {
          console.error("Vendor email not found for vendorId:", vendorId);
          throw new Error("Vendor email not found");
        }

        router.push(
          `/(auth)/otp-verification?vendorId=${vendorId}&email=${vendor.email}&context=salesman`
        );
      } catch (error) {
        console.error("Error resending OTP:", error);
        throw error;
      }
    },
    [router]
  );

  // Render vendor item
  const renderVendorItem = useCallback(
    ({ item }: { item: any }) => (
      <VendorCard
        vendor={item}
        onPress={() => handleVendorPress(item.id)}
        onResendOTP={handleResendOTP}
      />
    ),
    [handleVendorPress, handleResendOTP]
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
          Loading more vendors...
        </ResponsiveText>
      </View>
    );
  }, [isFetchingNextPage]);

  // Render empty state
  const renderEmpty = useCallback(() => {
    if (isLoading || isRefetching) return null;

    return (
      <ResponsiveCard variant="elevated" style={styles.emptyCard}>
        <Ionicons
          name="business-outline"
          size={64}
          color={COLORS.text.secondary}
        />
        <ResponsiveText
          variant="h6"
          weight="medium"
          color={COLORS.text.secondary}
          style={styles.emptyTitle}
        >
          No Vendors Found
        </ResponsiveText>
        <ResponsiveText
          variant="body2"
          color={COLORS.text.secondary}
          style={styles.emptyDescription}
        >
          {filterStatus === "all"
            ? "Start by adding your first vendor"
            : `No vendors found for the selected filter`}
        </ResponsiveText>
        {filterStatus === "all" && (
          <TouchableOpacity
            style={styles.addFirstButton}
            onPress={() => router.push("/(dashboard)/(salesman)/add-vendor")}
          >
            <ResponsiveText
              variant="buttonSmall"
              weight="medium"
              color={COLORS.white}
            >
              Add First Vendor
            </ResponsiveText>
          </TouchableOpacity>
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
          backgroundColor={COLORS.primary[500]}
          translucent={false}
        />
        <SafeAreaView style={styles.container} edges={["left", "right"]}>
          <AppHeader
            onBackPress={() => router.back()}
            title="My Vendors"
            backgroundColor={COLORS.primary[200]}
            textColor={COLORS.white}
          />
          <ResponsiveCard variant="elevated" style={styles.errorCard}>
            <Ionicons
              name="alert-circle-outline"
              size={48}
              color={COLORS.error[500]}
            />
            <ResponsiveText
              variant="h6"
              weight="medium"
              color={COLORS.error[500]}
              style={styles.errorTitle}
            >
              Error Loading Vendors
            </ResponsiveText>
            <ResponsiveText
              variant="body2"
              color={COLORS.text.secondary}
              style={styles.errorDescription}
            >
              {error?.message || "Something went wrong. Please try again."}
            </ResponsiveText>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => refetch()}
            >
              <ResponsiveText
                variant="buttonSmall"
                weight="medium"
                color={COLORS.white}
              >
                Try Again
              </ResponsiveText>
            </TouchableOpacity>
          </ResponsiveCard>
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
      <SafeAreaView style={styles.container} edges={["left", "right"]}>
        {/* Header */}
        <AppHeader
          onBackPress={() => router.back()}
          title="My Vendors"
          backgroundColor={COLORS.primary[200]}
          textColor={COLORS.white}
          rightActionButton={{
            iconName: "add",
            onPress: () => router.push("/(dashboard)/(salesman)/add-vendor"),
            backgroundColor: COLORS.primary[300],
            iconColor: COLORS.white,
          }}
        />

        {/* Filter Bar */}
        <View style={styles.filterBarContainer}>
          <VendorListFilterBar
            totalCount={paginationInfo.totalItems}
            onStatusChange={setFilterStatus}
            currentStatus={filterStatus}
            statusCounts={statusCounts}
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
              Loading your vendors...
            </ResponsiveText>
          </ResponsiveCard>
        ) : (
          /* FlatList with Infinite Scroll */
          <FlatList
            data={allVendors}
            renderItem={renderVendorItem}
            keyExtractor={(item) => item.id}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
            ListEmptyComponent={renderEmpty}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={handleRefresh}
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
          />
        )}
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  listContainer: {
    paddingHorizontal: PADDING.screen,
    paddingTop: MARGIN.lg, // Top spacing for first card
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
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.md,
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
    backgroundColor: COLORS.primary[500],
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.md,
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
});
