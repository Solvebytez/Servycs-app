import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  FlatList,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../constants";
import { ResponsiveText } from "../UI/ResponsiveText";
import { ResponsiveButton } from "../UI/ResponsiveButton";
import { SavedList, SavedListItem } from "../../services/savedLists";
import {
  useUpdateSavedList,
  useSavedList,
  useRemoveServiceFromList,
} from "../../hooks/useSavedLists";
import { useQueryClient } from "@tanstack/react-query";
import {
  SAVED_LIST_COLORS,
  SAVED_LIST_ICONS,
  DEFAULT_SAVED_LIST_COLOR,
  DEFAULT_SAVED_LIST_ICON,
} from "../../constants/savedLists";

interface EditSavedListModalProps {
  visible: boolean;
  savedList: SavedList | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditSavedListModal: React.FC<EditSavedListModalProps> = ({
  visible,
  savedList,
  onClose,
  onSuccess,
}) => {
  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(
    DEFAULT_SAVED_LIST_COLOR
  );
  const [selectedIcon, setSelectedIcon] = useState<string>(
    DEFAULT_SAVED_LIST_ICON
  );
  const [isPublic, setIsPublic] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(
    null
  );

  const updateSavedList = useUpdateSavedList();
  const removeServiceFromList = useRemoveServiceFromList();
  const queryClient = useQueryClient();

  // Fetch full list data with services when modal opens
  const {
    data: fullListData,
    isLoading: isLoadingList,
    error: listError,
  } = useSavedList(
    savedList?.userId || null,
    savedList?.id || null,
    true // includeItems = true to get services
  );

  // Debug logging
  useEffect(() => {
    if (fullListData) {
      console.log("Full list data:", fullListData);
      console.log("Services count:", fullListData.data?.items?.length || 0);
    }
    if (listError) {
      console.error("Error fetching list data:", listError);
    }
  }, [fullListData, listError]);

  // Initialize form with saved list data
  useEffect(() => {
    if (savedList) {
      setListName(savedList.name);
      setDescription(savedList.description || "");
      setSelectedColor(savedList.color || COLORS.primary[200]);
      setSelectedIcon(savedList.icon || "list");
      setIsPublic(savedList.isPublic);
    }
  }, [savedList]);

  const handleSave = async () => {
    if (!listName.trim()) {
      Alert.alert("Required Field", "Please enter a list name.");
      return;
    }

    if (!savedList?.userId || !savedList?.id) {
      Alert.alert("Error", "Invalid list data. Please try again.");
      return;
    }

    try {
      await updateSavedList.mutateAsync({
        userId: savedList.userId,
        listId: savedList.id,
        data: {
          name: listName.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon,
          isPublic,
        },
      });

      // Invalidate cache to ensure immediate updates
      queryClient.invalidateQueries({ queryKey: ["savedLists"] });
      queryClient.invalidateQueries({ queryKey: ["savedList"] });
      queryClient.invalidateQueries({
        queryKey: ["savedListsWithServiceStatus", savedList.userId],
      });

      Alert.alert("Success", "List updated successfully!", [
        {
          text: "OK",
          onPress: () => {
            onSuccess?.();
            onClose();
          },
        },
      ]);
    } catch (error) {
      console.error("Error updating saved list:", error);
      Alert.alert("Error", "Failed to update list. Please try again.");
    }
  };

  const handleRemoveService = async (serviceItem: SavedListItem) => {
    if (!savedList?.userId || !savedList?.id) {
      Alert.alert("Error", "Invalid list data. Please try again.");
      return;
    }

    Alert.alert(
      "Remove Service",
      `Are you sure you want to remove "${serviceItem.serviceListing.title}" from this list?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingServiceId(serviceItem.id);
              await removeServiceFromList.mutateAsync({
                userId: savedList.userId,
                listId: savedList.id,
                itemId: serviceItem.id,
              });

              // Invalidate cache to ensure immediate updates
              queryClient.invalidateQueries({ queryKey: ["savedLists"] });
              queryClient.invalidateQueries({ queryKey: ["savedList"] });
              queryClient.invalidateQueries({
                queryKey: [
                  "serviceSavedStatus",
                  savedList.userId,
                  serviceItem.serviceListingId,
                ],
              });
              queryClient.invalidateQueries({
                queryKey: ["savedListsWithServiceStatus", savedList.userId],
              });

              // Refresh the list data
              onSuccess?.();
            } catch (error) {
              console.error("Error removing service:", error);
              Alert.alert(
                "Error",
                "Failed to remove service. Please try again."
              );
            } finally {
              setDeletingServiceId(null);
            }
          },
        },
      ]
    );
  };

  const handleClose = () => {
    // Reset form
    setListName("");
    setDescription("");
    setSelectedColor(COLORS.primary[200]);
    setSelectedIcon("list");
    setIsPublic(false);
    onClose();
  };

  // Render individual service item
  const renderServiceItem = ({ item }: { item: SavedListItem }) => (
    <View style={styles.serviceItem}>
      <View style={styles.serviceInfo}>
        {item.serviceListing.image ? (
          <Image
            source={{ uri: item.serviceListing.image }}
            style={styles.serviceImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.serviceImage, styles.serviceImagePlaceholder]}>
            <Ionicons
              name="image-outline"
              size={20}
              color={COLORS.text.light}
            />
          </View>
        )}
        <View style={styles.serviceDetails}>
          <ResponsiveText
            variant="body2"
            weight="medium"
            color={COLORS.text.primary}
            numberOfLines={1}
          >
            {item.serviceListing.title}
          </ResponsiveText>
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            numberOfLines={1}
          >
            {item.serviceListing.category.name}
          </ResponsiveText>
        </View>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveService(item)}
        disabled={deletingServiceId === item.id}
      >
        {deletingServiceId === item.id ? (
          <ActivityIndicator size="small" color={COLORS.error[500]} />
        ) : (
          <Ionicons name="trash-outline" size={18} color={COLORS.error[500]} />
        )}
      </TouchableOpacity>
    </View>
  );

  if (!savedList) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <ResponsiveText
            variant="h4"
            weight="semiBold"
            color={COLORS.text.primary}
          >
            Edit Favorite Group
          </ResponsiveText>
          <View style={styles.placeholder} />
        </View>

        <KeyboardAwareScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          enableAutomaticScroll={true}
          extraScrollHeight={20}
          keyboardShouldPersistTaps="handled"
        >
          {/* List Preview */}
          <View style={styles.previewSection}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={COLORS.text.secondary}
              style={styles.sectionTitle}
            >
              Preview
            </ResponsiveText>
            <View
              style={[styles.previewCard, { backgroundColor: selectedColor }]}
            >
              <View style={styles.previewHeader}>
                <View style={styles.previewIconContainer}>
                  <Ionicons
                    name={selectedIcon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.previewText}>
                  <ResponsiveText
                    variant="body1"
                    weight="semiBold"
                    color={COLORS.white}
                    numberOfLines={1}
                  >
                    {listName || "List Name"}
                  </ResponsiveText>
                  <ResponsiveText
                    variant="caption1"
                    color={COLORS.white}
                    style={styles.previewCount}
                  >
                    {fullListData?.data?.items?.length || 0} Services
                  </ResponsiveText>
                </View>
              </View>
            </View>
          </View>

          {/* List Name */}
          <View style={styles.inputSection}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.sectionTitle}
            >
              List Name *
            </ResponsiveText>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                value={listName}
                onChangeText={setListName}
                placeholder="Enter list name..."
                placeholderTextColor={COLORS.text.light}
                maxLength={50}
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.inputSection}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.sectionTitle}
            >
              Description
            </ResponsiveText>
            <View style={styles.textInputContainer}>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter description..."
                placeholderTextColor={COLORS.text.light}
                multiline
                numberOfLines={3}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.inputSection}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.sectionTitle}
            >
              Color
            </ResponsiveText>
            <View style={styles.colorGrid}>
              {SAVED_LIST_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.selectedColorOption,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <Ionicons name="checkmark" size={16} color={COLORS.white} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Icon Selection */}
          <View style={styles.inputSection}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.sectionTitle}
            >
              Icon
            </ResponsiveText>
            <View style={styles.iconGrid}>
              {SAVED_LIST_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[
                    styles.iconOption,
                    selectedIcon === icon && styles.selectedIconOption,
                  ]}
                  onPress={() => setSelectedIcon(icon)}
                >
                  <Ionicons
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={
                      selectedIcon === icon
                        ? COLORS.primary[200]
                        : COLORS.text.secondary
                    }
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy Setting - Commented out for now */}
          {/* <View style={styles.inputSection}>
            <ResponsiveText
              variant="body2"
              weight="medium"
              color={COLORS.text.primary}
              style={styles.sectionTitle}
            >
              Privacy
            </ResponsiveText>
            <TouchableOpacity
              style={styles.privacyOption}
              onPress={() => setIsPublic(!isPublic)}
            >
              <View style={styles.privacyInfo}>
                <Ionicons
                  name={isPublic ? "globe-outline" : "lock-closed-outline"}
                  size={20}
                  color={COLORS.text.primary}
                />
                <View style={styles.privacyText}>
                  <ResponsiveText
                    variant="body2"
                    weight="medium"
                    color={COLORS.text.primary}
                  >
                    {isPublic ? "Public" : "Private"}
                  </ResponsiveText>
                  <ResponsiveText
                    variant="caption1"
                    color={COLORS.text.secondary}
                  >
                    {isPublic
                      ? "Anyone can see this list"
                      : "Only you can see this list"}
                  </ResponsiveText>
                </View>
              </View>
              <View style={[styles.toggle, isPublic && styles.toggleActive]}>
                <View
                  style={[
                    styles.toggleThumb,
                    isPublic && styles.toggleThumbActive,
                  ]}
                />
              </View>
            </TouchableOpacity>
          </View> */}

          {/* Services Section */}
          <View style={styles.inputSection}>
            <View style={styles.servicesHeader}>
              <ResponsiveText
                variant="body2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Services ({fullListData?.data?.items?.length || 0})
              </ResponsiveText>
              {/* TODO: Implement Option 1 - Navigate to Search Screen
                  - Navigate to search screen with filter to show only services NOT already in this list
                  - User can browse and select services to add
                  - After selection, automatically add them to the current list */}
              {/* <TouchableOpacity style={styles.addServiceButton}>
                <Ionicons
                  name="add-circle-outline"
                  size={20}
                  color={COLORS.primary[200]}
                />
                <ResponsiveText
                  variant="caption1"
                  color={COLORS.primary[200]}
                  style={styles.addServiceText}
                >
                  Add More
                </ResponsiveText>
              </TouchableOpacity> */}
            </View>

            {isLoadingList ? (
              <View style={styles.loadingContainer}>
                <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                  Loading services...
                </ResponsiveText>
              </View>
            ) : listError ? (
              <View style={styles.loadingContainer}>
                <ResponsiveText variant="body2" color={COLORS.error[500]}>
                  Error loading services
                </ResponsiveText>
              </View>
            ) : fullListData?.data?.items &&
              fullListData.data.items.length > 0 ? (
              <FlatList
                data={fullListData.data.items}
                renderItem={renderServiceItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                style={styles.servicesList}
              />
            ) : (
              <View style={styles.emptyServicesContainer}>
                <Ionicons
                  name="list-outline"
                  size={32}
                  color={COLORS.neutral[300]}
                />
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.emptyServicesText}
                >
                  No services in this list yet
                </ResponsiveText>
              </View>
            )}
          </View>
        </KeyboardAwareScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <ResponsiveButton
            title="Cancel"
            variant="outline"
            size="small"
            onPress={handleClose}
            style={styles.cancelButton}
          />
          <ResponsiveButton
            title="Save Changes"
            variant="primary"
            size="small"
            onPress={handleSave}
            loading={updateSavedList.isPending}
            disabled={updateSavedList.isPending}
            style={styles.saveButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    paddingHorizontal: PADDING.lg,
  },
  previewSection: {
    marginTop: MARGIN.lg,
    marginBottom: MARGIN.md,
  },
  sectionTitle: {
    marginBottom: MARGIN.sm,
  },
  previewCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.md,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: MARGIN.sm,
  },
  previewText: {
    flex: 1,
  },
  previewCount: {
    opacity: 0.9,
    marginTop: 2,
  },
  inputSection: {
    marginBottom: MARGIN.lg,
  },
  textInputContainer: {
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.white,
  },
  textInput: {
    padding: PADDING.md,
    fontSize: FONT_SIZE.body2,
    color: COLORS.text.primary,
    minHeight: 48,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.sm,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedColorOption: {
    borderColor: COLORS.primary[200],
    borderWidth: 3,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.sm,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedIconOption: {
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
  },
  privacyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: PADDING.md,
    backgroundColor: COLORS.neutral[50],
    borderRadius: BORDER_RADIUS.md,
  },
  privacyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  privacyText: {
    marginLeft: MARGIN.sm,
    flex: 1,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.neutral[300],
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: COLORS.primary[200],
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 20 }],
  },
  footer: {
    flexDirection: "row",
    padding: PADDING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[100],
    gap: MARGIN.md,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 2,
  },
  // Service management styles
  servicesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: MARGIN.sm,
  },
  addServiceButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    backgroundColor: COLORS.primary[50],
    borderRadius: BORDER_RADIUS.sm,
  },
  addServiceText: {
    marginLeft: MARGIN.xs,
  },
  loadingContainer: {
    padding: PADDING.lg,
    alignItems: "center",
  },
  servicesList: {
    maxHeight: 200,
  },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: PADDING.md,
    backgroundColor: COLORS.neutral[50],
    borderRadius: BORDER_RADIUS.md,
    marginBottom: MARGIN.sm,
  },
  serviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  serviceImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: MARGIN.sm,
  },
  serviceImagePlaceholder: {
    backgroundColor: COLORS.neutral[200],
    justifyContent: "center",
    alignItems: "center",
  },
  serviceDetails: {
    flex: 1,
  },
  removeButton: {
    padding: PADDING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.error[50],
  },
  emptyServicesContainer: {
    padding: PADDING.xl,
    alignItems: "center",
    backgroundColor: COLORS.neutral[50],
    borderRadius: BORDER_RADIUS.md,
  },
  emptyServicesText: {
    marginTop: MARGIN.sm,
    textAlign: "center",
  },
});

export default EditSavedListModal;
