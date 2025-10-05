import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { SafeAreaView } from "react-native-safe-area-context";
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
import {
  useCreateSavedList,
  useAddServiceToList,
} from "../../../hooks/useSavedLists";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  SAVED_LIST_COLORS,
  SAVED_LIST_ICONS,
  DEFAULT_SAVED_LIST_COLOR,
  DEFAULT_SAVED_LIST_ICON,
} from "../../../constants/savedLists";

export default function CreateSavedListScreen() {
  const { data: user } = useUser();
  const { serviceId } = useLocalSearchParams<{ serviceId?: string }>();
  const createSavedList = useCreateSavedList();
  const addServiceToList = useAddServiceToList();
  const queryClient = useQueryClient();

  const [listName, setListName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(DEFAULT_SAVED_LIST_COLOR);
  const [selectedIcon, setSelectedIcon] = useState(DEFAULT_SAVED_LIST_ICON);
  const [isPublic, setIsPublic] = useState(false);

  const handleCreateList = async () => {
    if (!listName.trim()) {
      Alert.alert("Required Field", "Please enter a list name.");
      return;
    }

    if (!user?.id) {
      Alert.alert("Error", "User not found. Please try again.");
      return;
    }

    try {
      // Create the new group
      const newList = await createSavedList.mutateAsync({
        userId: user.id,
        data: {
          name: listName.trim(),
          description: description.trim() || undefined,
          color: selectedColor,
          icon: selectedIcon,
          isPublic,
        },
      });

      // If serviceId is provided, automatically add the service to the new group
      if (serviceId && newList?.data?.id) {
        try {
          await addServiceToList.mutateAsync({
            userId: user.id,
            listId: newList.data.id,
            data: {
              serviceListingId: serviceId,
            },
          });

          // Invalidate cache to update heart icon immediately
          queryClient.invalidateQueries({
            queryKey: ["serviceSavedStatus", user.id, serviceId],
          });
          queryClient.invalidateQueries({
            queryKey: ["savedLists"],
          });

          Alert.alert(
            "Group Created & Service Added",
            `"${listName}" has been created and the service has been added to it!`,
            [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]
          );
        } catch (addError) {
          console.error("Error adding service to list:", addError);
          Alert.alert(
            "Group Created",
            `"${listName}" has been created successfully, but failed to add the service. You can add it manually later.`,
            [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]
          );
        }
      } else {
        // No serviceId provided, just create the group
        Alert.alert(
          "Group Created",
          `"${listName}" has been created successfully!`,
          [
            {
              text: "OK",
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Error creating saved list:", error);
      Alert.alert("Error", "Failed to create group. Please try again.");
    }
  };

  const renderColorOption = (color: string) => (
    <TouchableOpacity
      key={color}
      style={[
        styles.colorOption,
        { backgroundColor: color },
        selectedColor === color && styles.selectedColorOption,
      ]}
      onPress={() => setSelectedColor(color)}
      activeOpacity={0.7}
    >
      {selectedColor === color && (
        <Ionicons name="checkmark" size={20} color={COLORS.white} />
      )}
    </TouchableOpacity>
  );

  const renderIconOption = (icon: string) => (
    <TouchableOpacity
      key={icon}
      style={[
        styles.iconOption,
        selectedIcon === icon && styles.selectedIconOption,
      ]}
      onPress={() => setSelectedIcon(icon)}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={24}
        color={selectedIcon === icon ? COLORS.white : COLORS.text.secondary}
      />
    </TouchableOpacity>
  );

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
            title="Create Favorite List"
            backgroundColor={COLORS.primary[200]}
            textColor={COLORS.white}
          />

          <KeyboardAwareScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            enableOnAndroid={true}
            enableAutomaticScroll={true}
            extraScrollHeight={20}
            keyboardShouldPersistTaps="handled"
          >
            {/* List Name */}
            <View style={styles.section}>
              <ResponsiveText
                variant="h6"
                weight="semiBold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Group Name *
              </ResponsiveText>
              <View style={styles.inputContainer}>
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.inputLabel}
                >
                  Give your group a memorable name
                </ResponsiveText>
                <View style={styles.textInputContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={listName}
                    onChangeText={setListName}
                    placeholder="Enter group name..."
                    placeholderTextColor={COLORS.text.light}
                    maxLength={50}
                  />
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <ResponsiveText
                variant="h6"
                weight="semiBold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Description
              </ResponsiveText>
              <View style={styles.inputContainer}>
                <ResponsiveText
                  variant="body2"
                  color={COLORS.text.secondary}
                  style={styles.inputLabel}
                >
                  Optional description for your group
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
                  />
                </View>
              </View>
            </View>

            {/* Color Selection */}
            <View style={styles.section}>
              <ResponsiveText
                variant="h6"
                weight="semiBold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Choose Color
              </ResponsiveText>
              <View style={styles.colorGrid}>
                {SAVED_LIST_COLORS.map(renderColorOption)}
              </View>
            </View>

            {/* Icon Selection */}
            <View style={styles.section}>
              <ResponsiveText
                variant="h6"
                weight="semiBold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Choose Icon
              </ResponsiveText>
              <View style={styles.iconGrid}>
                {SAVED_LIST_ICONS.map(renderIconOption)}
              </View>
            </View>

            {/* Privacy Setting */}
            <View style={styles.section}>
              <ResponsiveText
                variant="h6"
                weight="semiBold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Privacy
              </ResponsiveText>
              <TouchableOpacity
                style={styles.privacyOption}
                onPress={() => setIsPublic(!isPublic)}
                activeOpacity={0.7}
              >
                <View style={styles.privacyInfo}>
                  <Ionicons
                    name={isPublic ? "globe" : "lock-closed"}
                    size={24}
                    color={COLORS.text.primary}
                  />
                  <View style={styles.privacyText}>
                    <ResponsiveText
                      variant="body1"
                      weight="medium"
                      color={COLORS.text.primary}
                    >
                      {isPublic ? "Public List" : "Private List"}
                    </ResponsiveText>
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                    >
                      {isPublic
                        ? "Others can see this list"
                        : "Only you can see this list"}
                    </ResponsiveText>
                  </View>
                </View>
                <Ionicons
                  name={isPublic ? "radio-button-on" : "radio-button-off"}
                  size={24}
                  color={isPublic ? COLORS.primary[200] : COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Preview */}
            <View style={styles.section}>
              <ResponsiveText
                variant="h6"
                weight="semiBold"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Preview
              </ResponsiveText>
              <View style={styles.previewContainer}>
                <View
                  style={[
                    styles.previewIcon,
                    { backgroundColor: selectedColor },
                  ]}
                >
                  <Ionicons
                    name={selectedIcon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={COLORS.white}
                  />
                </View>
                <View style={styles.previewInfo}>
                  <ResponsiveText
                    variant="body1"
                    weight="medium"
                    color={COLORS.text.primary}
                  >
                    {listName || "Group Name"}
                  </ResponsiveText>
                  <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                    {description || "List description"}
                  </ResponsiveText>
                </View>
                <Ionicons
                  name={isPublic ? "globe" : "lock-closed"}
                  size={16}
                  color={COLORS.text.secondary}
                />
              </View>
            </View>
          </KeyboardAwareScrollView>

          {/* Create Button */}
          <View style={styles.createButtonContainer}>
            <ResponsiveButton
              title="Create Group"
              variant="primary"
              size="large"
              onPress={handleCreateList}
              loading={createSavedList.isPending}
              disabled={!listName.trim() || createSavedList.isPending}
              fullWidth
            />
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: PADDING.lg,
    paddingBottom: 100, // Space for create button
  },
  section: {
    marginBottom: MARGIN.xl,
  },
  sectionTitle: {
    marginBottom: MARGIN.md,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  inputLabel: {
    marginBottom: MARGIN.sm,
  },
  textInputContainer: {
    minHeight: 48,
    justifyContent: "center",
  },
  textInput: {
    fontSize: FONT_SIZE.body1,
    color: COLORS.text.primary,
    padding: 0,
    margin: 0,
  },
  multilineInput: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.md,
  },
  colorOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "transparent",
  },
  selectedColorOption: {
    borderColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.md,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedIconOption: {
    backgroundColor: COLORS.primary[200],
    borderColor: COLORS.primary[300],
  },
  privacyOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  privacyInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  privacyText: {
    marginLeft: MARGIN.md,
    flex: 1,
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  previewIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: MARGIN.md,
  },
  previewInfo: {
    flex: 1,
  },
  createButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.primary,
    padding: PADDING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
});
