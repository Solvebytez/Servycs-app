import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
import { useSavedListsInfinite } from "../../../hooks/useSavedLists";
// import { useNetworkStatus } from "../../../hooks/useNetworkStatus";
import { SavedListCard, SavedListCardSkeleton } from "../../../components/user";
import { OfflinePlaceholder } from "../../../components/user/OfflinePlaceholder";
import { EditSavedListModal } from "../../../components/user/EditSavedListModal";
import { SavedList } from "../../../services/savedLists";

export default function SavedListsScreen() {
  const { data: user } = useUser();
  // const { isOffline } = useNetworkStatus();
  const isOffline = false; // Temporarily disable network status

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedListForEdit, setSelectedListForEdit] =
    useState<SavedList | null>(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch saved lists with infinite scroll and search
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useSavedListsInfinite(
    user?.id || null,
    debouncedSearchQuery.trim() || undefined,
    false,
    10
  );

  // Flatten the pages data
  const savedLists = data?.pages.flatMap((page: any) => page.data) || [];

  // Auto-refetch when screen comes into focus (if online)
  useFocusEffect(
    useCallback(() => {
      if (!isOffline && user?.id) {
        refetch();
      }
    }, [isOffline, user?.id, refetch])
  );

  // No need for client-side filtering since we're using server-side search

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (error) {
      console.error("Error refreshing saved lists:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle reconnect
  const handleReconnect = () => {
    // Trigger a refetch to check network status
    refetch();
  };

  // Handle create new list
  const handleCreateList = () => {
    router.push("/(dashboard)/create-saved-list");
  };

  // Handle list press
  const handleListPress = (list: SavedList) => {
    router.push(`/(dashboard)/saved-list-details?id=${list.id}`);
  };

  // Handle edit list
  const handleEditList = (list: SavedList) => {
    setSelectedListForEdit(list);
    setEditModalVisible(true);
  };

  // Handle edit modal close
  const handleEditModalClose = () => {
    setEditModalVisible(false);
    setSelectedListForEdit(null);
  };

  // Handle edit success
  const handleEditSuccess = () => {
    refetch(); // Refresh the lists
  };

  // Render list item
  const renderSavedListItem = ({ item }: { item: SavedList }) => (
    <SavedListCard
      savedList={item}
      onPress={() => handleListPress(item)}
      onEdit={() => handleEditList(item)}
      showDeleteButton={!isOffline}
    />
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
        No Saved Lists Yet
      </ResponsiveText>
      <ResponsiveText
        variant="body2"
        color={COLORS.text.secondary}
        style={styles.emptyMessage}
      >
        Create your first list to organize your favorite services
      </ResponsiveText>
    </View>
  );

  // Show offline placeholder if offline
  if (isOffline) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["left", "right"]}>
        <View style={styles.container}>
          <GlobalStatusBar
            barStyle="light-content"
            backgroundColor={COLORS.primary[500]}
            translucent={false}
          />

          {/* Header */}
          <AppHeader
            onBackPress={() => router.back()}
            title="My Saved Lists"
            backgroundColor={COLORS.primary[200]}
            textColor={COLORS.white}
          />

          {/* Offline Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <OfflinePlaceholder
              onReconnect={handleReconnect}
              availableListsCount={savedLists.length}
              savedLists={savedLists.map((list) => ({
                id: list.id,
                name: list.name,
                itemCount: list.itemCount,
                color: list.color,
                icon: list.icon,
              }))}
            />
          </ScrollView>
        </View>
      </SafeAreaView>
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
            title="My Saved Lists"
            backgroundColor={COLORS.primary[200]}
            textColor={COLORS.white}
          />

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons
                name="search"
                size={20}
                color={COLORS.text.light}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search saved lists..."
                placeholderTextColor={COLORS.text.light}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {isLoading ? (
              <View style={styles.skeletonContainer}>
                {[1, 2, 3, 4].map((index) => (
                  <SavedListCardSkeleton key={`skeleton-${index}`} />
                ))}
              </View>
            ) : error && !savedLists ? (
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
                  Failed to load your saved lists
                </ResponsiveText>
                <ResponsiveButton
                  title="Try Again"
                  variant="outline"
                  size="medium"
                  onPress={handleRefresh}
                  style={styles.retryButton}
                  leftIcon={
                    <Ionicons
                      name="refresh"
                      size={16}
                      color={COLORS.primary[200]}
                    />
                  }
                />
              </View>
            ) : savedLists.length === 0 ? (
              renderEmptyState()
            ) : (
              <FlatList
                data={savedLists}
                renderItem={renderSavedListItem}
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
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.1}
                ListFooterComponent={() => {
                  if (isFetchingNextPage) {
                    return (
                      <View style={styles.loadingFooter}>
                        {[1, 2, 3].map((index) => (
                          <SavedListCardSkeleton key={`skeleton-${index}`} />
                        ))}
                      </View>
                    );
                  }
                  return null;
                }}
              />
            )}
          </View>

          {/* Floating Action Button */}
          {!isOffline && (
            <TouchableOpacity
              style={styles.fab}
              onPress={handleCreateList}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Edit Modal */}
      <EditSavedListModal
        visible={editModalVisible}
        savedList={selectedListForEdit}
        onClose={handleEditModalClose}
        onSuccess={handleEditSuccess}
      />
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
  searchContainer: {
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xxxl,
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.xs,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    minHeight: 40,
  },
  searchIcon: {
    marginRight: MARGIN.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZE.body2,
    color: COLORS.text.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  listContainer: {
    padding: PADDING.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.xl,
  },
  skeletonContainer: {
    padding: PADDING.lg,
  },
  loadingFooter: {
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
  retryButtonText: {
    marginLeft: MARGIN.xs,
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
  fab: {
    position: "absolute",
    bottom: MARGIN.xl,
    right: MARGIN.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary[200],
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
