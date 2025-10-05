import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText, ResponsiveButton } from "../UI";
import { FavoriteServiceCard } from "./FavoriteServiceCard";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import { SavedList } from "@/services/savedLists";
import { Skeleton } from "moti/skeleton";

interface MyFavoriteServicesSectionProps {
  savedLists: SavedList[];
  onViewMore?: () => void;
  onSavedListPress?: (savedList: SavedList) => void;
  onCreateSavedList?: () => void;
  isLoading?: boolean;
  error?: string;
  isInitialLoading?: boolean;
}

export const MyFavoriteServicesSection: React.FC<
  MyFavoriteServicesSectionProps
> = ({
  savedLists,
  onViewMore,
  onSavedListPress,
  onCreateSavedList,
  isLoading = false,
  error,
  isInitialLoading = false,
}) => {
  // Show skeleton during initial loading or when it's the first time loading
  if (isLoading || isInitialLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Ionicons
              name="bookmark"
              size={20}
              color={COLORS.primary[500]}
              style={styles.titleIcon}
            />
            <ResponsiveText
              variant="h5"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.sectionTitle}
            >
              My Saved Lists
            </ResponsiveText>
          </View>
        </View>
        {/* Skeleton Loading */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.savedListsContainer}
        >
          {[1, 2, 3].map((index) => (
            <View key={index} style={styles.savedListCard}>
              <Skeleton
                colorMode="light"
                colors={[COLORS.background.light, COLORS.background.secondary]}
                width="100%"
                height={120}
              >
                <View style={styles.imageContainer}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: COLORS.background.light },
                    ]}
                  >
                    <View />
                  </View>
                </View>
              </Skeleton>

              <View style={styles.content}>
                <Skeleton
                  colorMode="light"
                  colors={[
                    COLORS.background.light,
                    COLORS.background.secondary,
                  ]}
                  width="80%"
                  height={16}
                >
                  <View />
                </Skeleton>

                <View style={styles.itemCountContainer}>
                  <Skeleton
                    colorMode="light"
                    colors={[
                      COLORS.background.light,
                      COLORS.background.secondary,
                    ]}
                    width="60%"
                    height={12}
                  >
                    <View />
                  </Skeleton>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.sectionHeader}>
          <View style={styles.titleContainer}>
            <Ionicons
              name="bookmark"
              size={20}
              color={COLORS.primary[500]}
              style={styles.titleIcon}
            />
            <ResponsiveText
              variant="h5"
              weight="bold"
              color={COLORS.text.primary}
              style={styles.sectionTitle}
            >
              My Saved Lists
            </ResponsiveText>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <ResponsiveText variant="body2" color={COLORS.error[500]}>
            {error}
          </ResponsiveText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.titleContainer}>
          <Ionicons
            name="bookmark"
            size={20}
            color={COLORS.primary[500]}
            style={styles.titleIcon}
          />
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.sectionTitle}
          >
            My Saved Lists
          </ResponsiveText>
        </View>
        <TouchableOpacity style={styles.seeMoreButton} onPress={onViewMore}>
          <ResponsiveText
            variant="body2"
            weight="medium"
            color={COLORS.text.secondary}
            style={styles.seeMoreText}
          >
            View more
          </ResponsiveText>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.text.secondary}
          />
        </TouchableOpacity>
      </View>

      {/* Content based on state - only show empty state if not loading and not initial loading */}
      {!isLoading && !isInitialLoading && savedLists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="bookmark-outline"
            size={48}
            color={COLORS.text.disabled}
            style={styles.emptyIcon}
          />
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={styles.emptyText}
          >
            No saved lists yet
          </ResponsiveText>
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.light}
            style={styles.emptySubtext}
          >
            Create your first saved list to organize your favorite services
          </ResponsiveText>
          <ResponsiveButton
            variant="outline"
            size="small"
            shape="rounded"
            title="Create Saved List"
            onPress={onCreateSavedList}
            leftIcon={
              <Ionicons name="add" size={14} color={COLORS.primary[500]} />
            }
            style={styles.createButton}
          />
        </View>
      ) : (
        /* Saved Lists */
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.savedListsContainer}
        >
          {/* Add to Favorite Card - Always First */}
          <TouchableOpacity
            style={[
              styles.savedListCard,
              styles.addToFavoriteCard,
              {
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
            onPress={onCreateSavedList}
            activeOpacity={0.8}
          >
            <View style={styles.addToFavoriteContent}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: COLORS.primary[100], marginBottom: 8 },
                ]}
              >
                <Ionicons name="add" size={32} color={COLORS.primary[500]} />
              </View>

              <ResponsiveText
                variant="body2"
                weight="semiBold"
                color={COLORS.primary[500]}
                style={[
                  styles.cardTitle,
                  { textAlign: "center", marginBottom: 4 },
                ]}
                numberOfLines={2}
              >
                Add to Favorite
              </ResponsiveText>

              <View
                style={[
                  styles.itemCountContainer,
                  { justifyContent: "center" },
                ]}
              >
                <Ionicons
                  name="heart-outline"
                  size={12}
                  color={COLORS.text.secondary}
                />
                <ResponsiveText
                  variant="caption1"
                  color={COLORS.text.secondary}
                  style={styles.itemCountLabel}
                  numberOfLines={1}
                >
                  Create new list
                </ResponsiveText>
              </View>
            </View>
          </TouchableOpacity>

          {savedLists.slice(0, 4).map((savedList) => (
            <TouchableOpacity
              key={savedList.id}
              style={styles.savedListCard}
              onPress={() => onSavedListPress?.(savedList)}
              activeOpacity={0.8}
            >
              <View style={styles.imageContainer}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: savedList.color || COLORS.primary[500] },
                  ]}
                >
                  <Ionicons
                    name={(savedList.icon as any) || "bookmark"}
                    size={32}
                    color={COLORS.white}
                  />
                </View>
                {/* Item Count Badge */}
                <View style={styles.itemCountBadge}>
                  <ResponsiveText
                    variant="caption2"
                    color={COLORS.white}
                    style={styles.itemCountText}
                  >
                    {savedList.itemCount}
                  </ResponsiveText>
                </View>
              </View>

              <View style={styles.content}>
                <ResponsiveText
                  variant="body2"
                  weight="semiBold"
                  color={COLORS.text.primary}
                  style={styles.cardTitle}
                  numberOfLines={2}
                >
                  {savedList.name}
                </ResponsiveText>

                <View style={styles.itemCountContainer}>
                  <Ionicons
                    name="list-outline"
                    size={12}
                    color={COLORS.text.secondary}
                  />
                  <ResponsiveText
                    variant="caption1"
                    color={COLORS.text.secondary}
                    style={styles.itemCountLabel}
                    numberOfLines={1}
                  >
                    {savedList.itemCount === 1
                      ? "1 item"
                      : `${savedList.itemCount} items`}
                  </ResponsiveText>
                </View>

                {/* Description if available */}
                {savedList.description && (
                  <ResponsiveText
                    variant="caption2"
                    color={COLORS.text.light}
                    style={styles.description}
                    numberOfLines={2}
                  >
                    {savedList.description}
                  </ResponsiveText>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: MARGIN.md,
    paddingHorizontal: PADDING.xs,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    lineHeight: 24,
  },
  seeMoreButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  seeMoreText: {
    marginRight: 4,
    fontSize: 12,
  },
  savedListsContainer: {
    paddingRight: PADDING.screen,
  },
  savedListCard: {
    width: 150,
    marginRight: MARGIN.sm,
    marginBottom: MARGIN.md,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    overflow: "hidden",
    elevation: 2,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  imageContainer: {
    width: "100%",
    height: 120,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  itemCountBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: COLORS.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  itemCountText: {
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    padding: MARGIN.sm,
    paddingTop: 0,
  },
  cardTitle: {
    marginBottom: 4,
    lineHeight: 18,
    fontSize: 14,
    fontWeight: "bold",
  },
  itemCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  itemCountLabel: {
    marginLeft: 4,
    fontSize: 12,
  },
  description: {
    marginTop: 4,
    fontSize: 10,
    lineHeight: 14,
  },
  loadingContainer: {
    paddingVertical: MARGIN.xl,
    alignItems: "center",
  },
  errorContainer: {
    paddingVertical: MARGIN.xl,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: MARGIN.xl,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  emptyIcon: {
    marginBottom: MARGIN.sm,
  },
  emptyText: {
    marginBottom: MARGIN.xs,
    textAlign: "center",
  },
  emptySubtext: {
    textAlign: "center",
    paddingHorizontal: PADDING.lg,
    marginBottom: MARGIN.md,
  },
  createButton: {
    marginTop: MARGIN.sm,
  },
  addToFavoriteCard: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: COLORS.primary[200],
    backgroundColor: COLORS.primary[50],
    justifyContent: "center",
  },
  addToFavoriteContent: {
    alignItems: "center",
    justifyContent: "center",
  },
});
