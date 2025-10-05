import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
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
import { ResponsiveText, ResponsiveButton } from "../UI";
import { SavedListWithServiceStatus } from "../../services/savedLists";
import {
  useSavedListsWithServiceStatus,
  useAddServiceToList,
} from "../../hooks/useSavedLists";
import { useQueryClient } from "@tanstack/react-query";

interface ListPickerModalProps {
  visible: boolean;
  onClose: () => void;
  serviceId: string;
  serviceTitle: string;
  userId: string;
}

export const ListPickerModal: React.FC<ListPickerModalProps> = ({
  visible,
  onClose,
  serviceId,
  serviceTitle,
  userId,
}) => {
  const [selectedListId, setSelectedListId] = useState<string | null>(null);

  // Fetch user's saved lists with service status
  const { data: savedListsResponse, isLoading } =
    useSavedListsWithServiceStatus(userId, serviceId, 50, 1);
  const savedLists = savedListsResponse?.data || [];

  // Add service to list mutation
  const addServiceToList = useAddServiceToList();
  const queryClient = useQueryClient();

  const handleAddToList = async () => {
    if (!selectedListId) {
      Alert.alert(
        "Select a List",
        "Please select a list to add this service to."
      );
      return;
    }

    try {
      await addServiceToList.mutateAsync({
        userId,
        listId: selectedListId,
        data: {
          serviceListingId: serviceId,
        },
      });

      // Invalidate cache to update heart icon immediately
      queryClient.invalidateQueries({
        queryKey: ["serviceSavedStatus", userId, serviceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["savedLists"],
      });

      Alert.alert(
        "Added to List",
        `"${serviceTitle}" has been added to your list.`,
        [
          {
            text: "OK",
            onPress: onClose,
          },
        ]
      );
    } catch (error) {
      console.error("Error adding service to list:", error);
      Alert.alert("Error", "Failed to add service to list. Please try again.");
    }
  };

  const handleCreateNewList = () => {
    onClose();
    // Navigate to create new list screen with serviceId parameter
    router.push(`/(dashboard)/(user)/create-saved-list?serviceId=${serviceId}`);
  };

  const renderListItem = ({ item }: { item: SavedListWithServiceStatus }) => {
    const isSelected = selectedListId === item.id;
    const isDisabled = item.hasService;

    return (
      <TouchableOpacity
        style={[
          styles.listItem,
          isSelected && styles.selectedListItem,
          isDisabled && styles.disabledListItem,
        ]}
        onPress={() => !isDisabled && setSelectedListId(item.id)}
        activeOpacity={isDisabled ? 1 : 0.7}
        disabled={isDisabled}
      >
        <View style={styles.listItemContent}>
          <View
            style={[
              styles.listIcon,
              { backgroundColor: item.color || COLORS.primary[200] },
              isDisabled && styles.disabledListIcon,
            ]}
          >
            <Ionicons
              name={(item.icon as keyof typeof Ionicons.glyphMap) || "list"}
              size={20}
              color={isDisabled ? COLORS.text.light : COLORS.white}
            />
          </View>

          <View style={styles.listInfo}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={isDisabled ? COLORS.text.light : COLORS.text.primary}
              numberOfLines={1}
            >
              {item.name}
            </ResponsiveText>
            <ResponsiveText
              variant="caption2"
              color={isDisabled ? COLORS.text.light : COLORS.text.secondary}
            >
              {item.itemCount} {item.itemCount === 1 ? "item" : "items"}
              {item.hasService && " • Already Added"}
            </ResponsiveText>
          </View>

          {isSelected && !isDisabled && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={COLORS.primary[200]}
            />
          )}

          {isDisabled && (
            <Ionicons
              name="checkmark-circle"
              size={24}
              color={COLORS.success[500]}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>

          <ResponsiveText
            variant="h6"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.headerTitle}
          >
            Add to Favorite
          </ResponsiveText>

          <View style={styles.headerRight} />
        </View>

        {/* Service Info */}
        <View style={styles.serviceInfo}>
          <ResponsiveText
            variant="body2"
            color={COLORS.text.secondary}
            style={styles.serviceInfoText}
          >
            Adding to your lists:
          </ResponsiveText>
          <ResponsiveText
            variant="body1"
            weight="medium"
            color={COLORS.text.primary}
            numberOfLines={2}
          >
            {serviceTitle}
          </ResponsiveText>
        </View>

        {/* Lists */}
        <View style={styles.listsContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                Loading your lists...
              </ResponsiveText>
            </View>
          ) : savedLists.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="list-outline"
                size={48}
                color={COLORS.neutral[300]}
              />
              <ResponsiveText
                variant="h6"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.emptyTitle}
              >
                No Lists Yet
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                color={COLORS.text.secondary}
                style={styles.emptyMessage}
              >
                Create your first list to organize your favorite services
              </ResponsiveText>
            </View>
          ) : (
            <FlatList
              data={savedLists}
              renderItem={renderListItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listsContent}
            />
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <ResponsiveButton
            title="Create Favorite"
            variant="outline"
            size="small"
            onPress={handleCreateNewList}
            style={styles.createButton}
            leftIcon={
              <Ionicons name="add" size={16} color={COLORS.primary[200]} />
            }
          />

          <ResponsiveButton
            title={addServiceToList.isPending ? "Adding..." : "Add to Existing"}
            variant="primary"
            size="small"
            onPress={handleAddToList}
            disabled={
              !selectedListId ||
              addServiceToList.isPending ||
              savedLists.find((list) => list.id === selectedListId)?.hasService
            }
            style={styles.addButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 36,
  },
  serviceInfo: {
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    backgroundColor: COLORS.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  serviceInfoText: {
    marginBottom: MARGIN.xs,
  },
  listsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.xl,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: PADDING.xl,
  },
  emptyTitle: {
    marginTop: MARGIN.md,
    marginBottom: MARGIN.sm,
  },
  emptyMessage: {
    textAlign: "center",
    lineHeight: 20,
  },
  listsContent: {
    padding: PADDING.lg,
  },
  listItem: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: MARGIN.sm,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedListItem: {
    borderColor: COLORS.primary[200],
    backgroundColor: COLORS.primary[50],
  },
  disabledListItem: {
    backgroundColor: COLORS.neutral[100],
    borderColor: COLORS.neutral[200],
    opacity: 0.6,
  },
  disabledListIcon: {
    backgroundColor: COLORS.neutral[300],
  },
  listItemContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: PADDING.md,
  },
  listIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: MARGIN.md,
  },
  listInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    padding: PADDING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    gap: MARGIN.md,
  },
  createButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
});

export default ListPickerModal;
