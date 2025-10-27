import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../../constants";
import { GlobalStatusBar } from "../../../components/StatusBar";
import { ResponsiveText, UserProfileButton } from "../../../components";
import { SalesmanMetricsCards } from "../../../components/salesman/SalesmanMetricsCards";
import { useUser } from "../../../hooks/useUser";
import { useSalesmanMetrics } from "../../../hooks/useSalesmanMetrics";

export default function SalesmanDashboardScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch user data and salesman metrics using React Query
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
    refetch: refetchUser,
  } = useUser();
  const {
    data: metricsData,
    isLoading: isLoadingMetrics,
    error: metricsError,
    refetch: refetchMetrics,
  } = useSalesmanMetrics();

  // Refetch data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      refetchUser();
      refetchMetrics();
    }, [refetchUser, refetchMetrics])
  );

  // Handle pull to refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchUser(), refetchMetrics()]);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
    } finally {
      setRefreshing(false);
    }
  }, [refetchUser, refetchMetrics]);

  // Handle profile button press
  const handleProfilePress = () => {
    router.push("/(dashboard)/(salesman)/profile");
  };

  // Get salesman data from metrics
  const salesmanData = metricsData?.data;

  // Salesman metrics
  const salesmanMetrics = [
    {
      id: "1",
      title: "Total Vendors",
      value: salesmanData?.vendorsOnboarded?.toString() || "0",
      icon: "business" as const,
      color: "#8B5CF6", // Purple
    },
    {
      id: "2",
      title: "Users Onboarded",
      value: salesmanData?.usersOnboarded?.toString() || "0",
      icon: "people" as const,
      color: "#F59E0B", // Yellow
    },
    {
      id: "3",
      title: "Total Commission",
      value: `₹${salesmanData?.totalCommission?.toLocaleString() || "0"}`,
      growth: (salesmanData?.totalCommission ?? 0) > 0 ? "+12%" : undefined,
      icon: "cash" as const,
      color: "#10B981", // Green
    },
  ];

  // Loading state
  if (isLoadingUser || isLoadingMetrics) {
    return (
      <>
        <GlobalStatusBar />
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={COLORS.primary[200]} />
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={{ marginTop: MARGIN.md }}
          >
            Loading your dashboard...
          </ResponsiveText>
        </View>
      </>
    );
  }

  // Error state
  if (userError || metricsError) {
    return (
      <>
        <GlobalStatusBar />
        <View style={[styles.container, styles.centerContent]}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={COLORS.error[500]}
          />
          <ResponsiveText
            variant="h5"
            color={COLORS.error[600]}
            style={{ marginTop: MARGIN.md, textAlign: "center" }}
          >
            Failed to Load Dashboard
          </ResponsiveText>
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={{ marginTop: MARGIN.sm, textAlign: "center" }}
          >
            Please check your connection and try again.
          </ResponsiveText>
        </View>
      </>
    );
  }

  return (
    <>
      <GlobalStatusBar />
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          {/* Header Section with Gradient */}
          <LinearGradient
            colors={[COLORS.primary[200], COLORS.primary[50], "#fff"]}
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          >
            {/* Logo and Icons */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Image
                  source={require("../../../assets/logo.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconButton}>
                  <Ionicons
                    name="notifications"
                    size={24}
                    color={COLORS.black}
                  />
                </TouchableOpacity>
                <UserProfileButton
                  user={
                    user
                      ? {
                          name: user.name,
                          avatar: user.avatar,
                        }
                      : undefined
                  }
                  size={40}
                  onPress={handleProfilePress}
                />
              </View>
            </View>

            {/* Salesman Info and Growth Message */}
            <View style={styles.salesmanInfo}>
              <View style={styles.salesmanNameContainer}>
                <ResponsiveText
                  variant="h3"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={styles.salesmanName}
                >
                  Hi,{" "}
                  {user?.name
                    ? user.name.charAt(0).toUpperCase() +
                      user.name.slice(1).toLowerCase()
                    : "Sales Representative"}
                </ResponsiveText>
                <ResponsiveText variant="h3" style={styles.celebrationEmoji}>
                  🎯
                </ResponsiveText>
              </View>
              <View style={styles.growthMessage}>
                <Ionicons
                  name="trending-up"
                  size={16}
                  color={COLORS.success[500]}
                />
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.growthText}
                >
                  {salesmanData?.vendorsOnboarded &&
                  salesmanData.vendorsOnboarded > 0
                    ? "Great work on vendor onboarding!"
                    : "Start onboarding vendors to grow your network!"}
                </ResponsiveText>
              </View>
            </View>
          </LinearGradient>

          {/* Main Content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[COLORS.primary[200]]}
                tintColor={COLORS.primary[200]}
              />
            }
          >
            {/* Single Vendor Onboarded Card */}
            <View style={styles.singleCardContainer}>
              <TouchableOpacity
                style={[styles.singleCard, { backgroundColor: "#9747FF" }]}
                onPress={() => {
                  // Navigate to vendor list screen
                  router.push("/(dashboard)/(salesman)/vendor-list");
                }}
              >
                <View style={styles.singleCardContent}>
                  <View style={styles.singleCardHeader}>
                    <View
                      style={[
                        styles.singleCardIcon,
                        { backgroundColor: COLORS.white },
                      ]}
                    >
                      <Ionicons name="business" size={20} color="#9747FF" />
                    </View>
                    <View style={styles.singleCardGrowth}>
                      <Ionicons
                        name="trending-up"
                        size={12}
                        color={COLORS.white}
                      />
                      <ResponsiveText
                        variant="caption2"
                        color={COLORS.white}
                        style={styles.singleCardGrowthText}
                      >
                        Total
                      </ResponsiveText>
                    </View>
                  </View>

                  <View style={styles.singleCardMain}>
                    <ResponsiveText
                      variant="h1"
                      weight="bold"
                      color={COLORS.white}
                      style={styles.singleCardValue}
                    >
                      {salesmanData?.vendorsOnboarded || 0}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="body1"
                      color={COLORS.white}
                      style={styles.singleCardTitle}
                    >
                      Vendors Onboarded
                    </ResponsiveText>
                  </View>

                  <View style={styles.singleCardFooter}>
                    <Ionicons
                      name="chevron-forward"
                      size={16}
                      color={COLORS.white}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* This Week's Highlights */}
            <View style={styles.highlightsSection}>
              <View style={styles.highlightsCard}>
                <ResponsiveText
                  variant="h5"
                  weight="bold"
                  color={COLORS.white}
                  style={styles.highlightsTitle}
                >
                  This Week's Highlights
                </ResponsiveText>

                <View style={styles.highlightsContent}>
                  {/* New Vendors */}
                  <View style={styles.highlightItem}>
                    <ResponsiveText
                      variant="h1"
                      weight="bold"
                      color={COLORS.white}
                      style={styles.highlightNumber}
                    >
                      {salesmanData?.newVendorsThisWeek || 0}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.white}
                      style={styles.highlightLabel}
                    >
                      New vendors this week
                    </ResponsiveText>
                  </View>
                </View>
              </View>
            </View>

            {/* Recent Activity Section */}
            <View style={styles.activitySection}>
              <View style={styles.activityHeader}>
                <View style={styles.titleContainer}>
                  <ResponsiveText
                    variant="h5"
                    weight="bold"
                    color={COLORS.text.primary}
                    style={styles.sectionTitle}
                  >
                    Recent Activity
                  </ResponsiveText>
                </View>
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => {
                    // Handle view all press - navigate to full activity screen
                    console.log("View All Activity pressed");
                  }}
                >
                  <ResponsiveText
                    variant="body2"
                    color={COLORS.primary[200]}
                    weight="medium"
                  >
                    View All
                  </ResponsiveText>
                </TouchableOpacity>
              </View>

              <View style={styles.activityCard}>
                {salesmanData?.recentActivity &&
                salesmanData.recentActivity.length > 0 ? (
                  salesmanData.recentActivity
                    .slice(0, 1)
                    .map((activity, index) => (
                      <View key={index} style={styles.activityItem}>
                        <View style={styles.activityIcon}>
                          <ResponsiveText style={styles.activityEmoji}>
                            {activity.type === "vendor" ? "🏢" : "👥"}
                          </ResponsiveText>
                        </View>

                        <View style={styles.activityContent}>
                          <ResponsiveText
                            variant="body1"
                            weight="bold"
                            color={COLORS.text.primary}
                            style={styles.activityTitle}
                          >
                            {activity.type === "vendor"
                              ? "New Vendor"
                              : "New User"}{" "}
                            Signed Up
                          </ResponsiveText>
                          <ResponsiveText
                            variant="body2"
                            color={COLORS.text.secondary}
                            style={styles.activityDescription}
                          >
                            {activity.name} joined from {activity.location}
                          </ResponsiveText>

                          <View style={styles.activityMetadata}>
                            <View style={styles.metadataItem}>
                              <Ionicons
                                name="time-outline"
                                size={14}
                                color={COLORS.text.secondary}
                              />
                              <ResponsiveText
                                variant="caption1"
                                color={COLORS.text.secondary}
                                style={styles.metadataText}
                              >
                                {activity.timeAgo}
                              </ResponsiveText>
                            </View>

                            <View style={styles.metadataItem}>
                              <Ionicons
                                name="location-outline"
                                size={14}
                                color={COLORS.text.secondary}
                              />
                              <ResponsiveText
                                variant="caption1"
                                color={COLORS.text.secondary}
                                style={styles.metadataText}
                              >
                                {activity.location}
                              </ResponsiveText>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))
                ) : (
                  <View style={styles.activityItem}>
                    <View style={styles.activityIcon}>
                      <ResponsiveText style={styles.activityEmoji}>
                        📊
                      </ResponsiveText>
                    </View>

                    <View style={styles.activityContent}>
                      <ResponsiveText
                        variant="body1"
                        weight="bold"
                        color={COLORS.text.primary}
                        style={styles.activityTitle}
                      >
                        No Recent Activity
                      </ResponsiveText>
                      <ResponsiveText
                        variant="body2"
                        color={COLORS.text.secondary}
                        style={styles.activityDescription}
                      >
                        Start onboarding vendors to see activity here
                      </ResponsiveText>
                    </View>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </ScrollView>

          {/* Floating Action Button */}
          <TouchableOpacity
            style={styles.fab}
            onPress={() => {
              router.push("/(dashboard)/(salesman)/add-vendor");
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerGradient: {
    paddingBottom: MARGIN.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: PADDING.screen,
    paddingTop: MARGIN.md,
  },
  logoContainer: {
    alignItems: "flex-start",
  },
  logoImage: {
    width: 80,
    height: 80,
    tintColor: COLORS.white,
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
  },
  salesmanInfo: {
    paddingHorizontal: PADDING.screen,
    marginTop: MARGIN.sm,
  },
  salesmanNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.xs,
  },
  salesmanName: {
    flex: 1,
  },
  celebrationEmoji: {
    marginLeft: MARGIN.sm,
  },
  territoryContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
    marginBottom: MARGIN.xs,
  },
  territoryText: {
    marginLeft: MARGIN.xs,
  },
  growthMessage: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  growthText: {
    marginLeft: MARGIN.xs,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
  },
  singleCardContainer: {
    marginBottom: MARGIN.lg,
  },
  singleCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  singleCardContent: {
    flex: 1,
  },
  singleCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  singleCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  singleCardGrowth: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
  singleCardGrowthText: {
    marginLeft: MARGIN.xs,
  },
  singleCardMain: {
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  singleCardValue: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: MARGIN.xs,
  },
  singleCardTitle: {
    textAlign: "center",
  },
  singleCardFooter: {
    alignItems: "flex-end",
  },
  highlightsSection: {
    marginBottom: MARGIN.lg,
  },
  highlightsCard: {
    backgroundColor: "#294ADA",
    padding: PADDING.lg,
    borderRadius: BORDER_RADIUS.lg,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  highlightsTitle: {
    textAlign: "center",
    marginBottom: MARGIN.lg,
  },
  highlightsContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  highlightItem: {
    alignItems: "center",
    flex: 1,
  },
  highlightNumber: {
    fontSize: 48,
    lineHeight: 56,
    marginBottom: MARGIN.xs,
  },
  highlightLabel: {
    textAlign: "center",
  },
  activitySection: {
    marginBottom: MARGIN.lg,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllButton: {
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 32, // Match the header height for consistent centering
  },
  activityCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    padding: PADDING.lg,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  activityIcon: {
    marginRight: MARGIN.md,
  },
  activityEmoji: {
    fontSize: 24,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    marginBottom: MARGIN.xs,
  },
  activityDescription: {
    marginBottom: MARGIN.sm,
  },
  activityMetadata: {
    flexDirection: "row",
    gap: MARGIN.lg,
  },
  metadataItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  metadataText: {
    fontSize: 12,
  },
  sectionTitle: {
    // marginBottom removed as it's now handled by titleContainer
  },
  targetSection: {
    marginBottom: MARGIN.lg,
  },
  targetCard: {
    backgroundColor: COLORS.white,
    padding: PADDING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: MARGIN.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  targetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  targetTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  targetLabel: {
    marginLeft: MARGIN.xs,
  },
  targetProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: MARGIN.sm,
  },
  targetSeparator: {
    marginHorizontal: MARGIN.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: COLORS.neutral[100],
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
    marginTop: MARGIN.sm,
  },
  progressBar: {
    height: "100%",
    borderRadius: BORDER_RADIUS.sm,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    padding: PADDING.xl,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 200,
  },
  emptyIconContainer: {
    marginBottom: MARGIN.md,
    opacity: 0.6,
  },
  emptyTitle: {
    textAlign: "center",
    marginBottom: MARGIN.sm,
    fontWeight: "600",
  },
  emptyDescription: {
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 280,
  },
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary[200],
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
