import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../constants";
import { ResponsiveText } from "../UI/ResponsiveText";
import { SavedList } from "../../services/savedLists";
import { useDeleteSavedList } from "../../hooks/useSavedLists";

interface SavedListCardProps {
  savedList: SavedList;
  onDelete?: () => void;
  onEdit?: () => void;
  showDeleteButton?: boolean;
  onPress?: () => void;
}

export const SavedListCard: React.FC<SavedListCardProps> = ({
  savedList,
  onDelete,
  onEdit,
  showDeleteButton = true,
  onPress,
}) => {
  const deleteSavedList = useDeleteSavedList();

  const handleCardPress = () => {
    if (onPress) {
      onPress();
    } else {
      // Navigate to saved list details page
      router.push(`/(dashboard)/saved-list-details?id=${savedList.id}`);
    }
  };

  const handleEditPress = () => {
    if (onEdit) {
      onEdit();
    }
  };

  const handleDeletePress = () => {
    if (savedList.isDefault) {
      Alert.alert(
        "Cannot Delete",
        "The default favorites list cannot be deleted."
      );
      return;
    }

    Alert.alert(
      "Delete List",
      `Are you sure you want to delete "${savedList.name}"? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSavedList.mutateAsync({
                userId: savedList.userId,
                listId: savedList.id,
              });
              onDelete?.();
            } catch (error) {
              console.error("Error deleting saved list:", error);
              Alert.alert("Error", "Failed to delete list. Please try again.");
            }
          },
        },
      ]
    );
  };

  const getListIcon = (iconName?: string) => {
    if (iconName) {
      return iconName as keyof typeof Ionicons.glyphMap;
    }

    // Default icons based on list name
    const name = savedList.name.toLowerCase();
    if (name.includes("favorite") || name.includes("favourite")) return "heart";
    if (name.includes("restaurant") || name.includes("food"))
      return "restaurant";
    if (name.includes("fitness") || name.includes("gym")) return "fitness";
    if (name.includes("beauty") || name.includes("spa")) return "sparkles";
    if (name.includes("travel") || name.includes("getaway")) return "airplane";
    if (name.includes("health") || name.includes("medical")) return "medical";
    if (name.includes("education") || name.includes("learning"))
      return "school";
    if (name.includes("entertainment") || name.includes("fun"))
      return "musical-notes";

    return "list"; // Default icon
  };

  const getListColor = () => {
    if (savedList.color) {
      return savedList.color;
    }

    // Default colors based on list name
    const name = savedList.name.toLowerCase();
    if (name.includes("favorite") || name.includes("favourite"))
      return COLORS.primary[200];
    if (name.includes("restaurant") || name.includes("food")) return "#FF6B6B";
    if (name.includes("fitness") || name.includes("gym")) return "#4ECDC4";
    if (name.includes("beauty") || name.includes("spa")) return "#FFE66D";
    if (name.includes("travel") || name.includes("getaway")) return "#A8E6CF";
    if (name.includes("health") || name.includes("medical")) return "#FFB3BA";
    if (name.includes("education") || name.includes("learning"))
      return "#B19CD9";
    if (name.includes("entertainment") || name.includes("fun"))
      return "#FFD93D";

    return COLORS.primary[200]; // Default color
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const listColor = getListColor();
  const listIcon = getListIcon(savedList.icon);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleCardPress}
      activeOpacity={0.7}
    >
      {/* List Header with Color */}
      <View style={[styles.header, { backgroundColor: listColor }]}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons name={listIcon} size={24} color={COLORS.white} />
          </View>

          <View style={styles.headerText}>
            <ResponsiveText
              variant="body1"
              weight="semiBold"
              color={COLORS.white}
              style={styles.listName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {savedList.name}
            </ResponsiveText>

            <ResponsiveText
              variant="caption1"
              color={COLORS.white}
              style={styles.itemCount}
            >
              {savedList.itemCount}{" "}
              {savedList.itemCount === 1 ? "Service" : "Services"}
            </ResponsiveText>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Edit Button */}
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEditPress}
            >
              <Ionicons name="create-outline" size={16} color={COLORS.white} />
            </TouchableOpacity>

            {/* Delete Button */}
            {showDeleteButton && !savedList.isDefault && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeletePress}
                disabled={deleteSavedList.isPending}
              >
                <Ionicons name="trash-outline" size={16} color={COLORS.white} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* List Content */}
      <View style={styles.content}>
        {/* Service Thumbnails */}
        {savedList.serviceImages && savedList.serviceImages.length > 0 && (
          <View style={styles.thumbnailsContainer}>
            <View style={styles.thumbnailsGrid}>
              {savedList.serviceImages.slice(0, 4).map((service, index) => {
                const totalImages = Math.min(savedList.serviceImages.length, 4);
                const dynamicWidth = `${100 / totalImages}%`;
                const isLastImage = index === totalImages - 1;

                return (
                  <View
                    key={service.id}
                    style={[
                      styles.thumbnailWrapper,
                      {
                        width: dynamicWidth,
                        marginRight: isLastImage ? 0 : MARGIN.xs,
                      },
                    ]}
                  >
                    {service.image ? (
                      <Image
                        source={{ uri: service.image }}
                        style={styles.thumbnail}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={[styles.thumbnail, styles.thumbnailPlaceholder]}
                      >
                        <Ionicons
                          name="image-outline"
                          size={16}
                          color={COLORS.text.light}
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Overflow indicator */}
            {savedList.itemCount > 4 && (
              <View style={styles.overflowIndicator}>
                <ResponsiveText
                  variant="caption2"
                  color={COLORS.white}
                  weight="medium"
                >
                  +{savedList.itemCount - 4}
                </ResponsiveText>
              </View>
            )}
          </View>
        )}

        {/* Description */}
        {savedList.description && (
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            style={styles.description}
            numberOfLines={2}
          >
            {savedList.description}
          </ResponsiveText>
        )}

        {/* List Info */}
        <View style={styles.infoContainer}>
          <View style={styles.infoItem}>
            <Ionicons
              name="calendar-outline"
              size={10}
              color={COLORS.text.light}
            />
            <ResponsiveText
              variant="caption2"
              color={COLORS.text.light}
              style={[styles.infoText, styles.dateText]}
            >
              Created {formatDate(savedList.createdAt)}
            </ResponsiveText>
          </View>

          <View style={styles.infoItem}>
            <Ionicons name="time-outline" size={10} color={COLORS.text.light} />
            <ResponsiveText
              variant="caption2"
              color={COLORS.text.light}
              style={[styles.infoText, styles.dateText]}
            >
              Updated {formatDate(savedList.updatedAt)}
            </ResponsiveText>
          </View>

          {savedList.isPublic && (
            <View style={styles.infoItem}>
              <Ionicons
                name="globe-outline"
                size={12}
                color={COLORS.text.secondary}
              />
              <ResponsiveText
                variant="caption2"
                color={COLORS.text.secondary}
                style={styles.infoText}
              >
                Public
              </ResponsiveText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.xl,
    marginBottom: MARGIN.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.neutral[100],
  },
  header: {
    padding: PADDING.lg,
    paddingBottom: PADDING.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: MARGIN.sm,
  },
  headerText: {
    flex: 1,
  },
  listName: {
    marginBottom: MARGIN.xs,
  },
  itemCount: {
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  editButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: PADDING.lg,
    paddingTop: PADDING.md,
  },
  description: {
    marginBottom: MARGIN.sm,
    lineHeight: 18,
    color: COLORS.text.secondary,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: MARGIN.sm,
    paddingTop: MARGIN.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[100],
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: MARGIN.md,
  },
  infoText: {
    marginLeft: MARGIN.xs,
  },
  dateText: {
    fontSize: 10,
    opacity: 0.8,
  },
  sampleImages: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.xs,
  },
  sampleImageContainer: {
    position: "relative",
  },
  sampleImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
  },
  placeholderImage: {
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  moreImagesOverlay: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.neutral[600],
    justifyContent: "center",
    alignItems: "center",
  },
  // New thumbnail styles
  thumbnailsContainer: {
    marginBottom: MARGIN.md,
    position: "relative",
  },
  thumbnailsGrid: {
    flexDirection: "row",
    width: "100%",
  },
  thumbnailWrapper: {
    height: 70,
    borderRadius: BORDER_RADIUS.md,
    overflow: "hidden",
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailPlaceholder: {
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  overflowIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SavedListCard;
