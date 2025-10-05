import React from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "@/components";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import { useDynamicFilterData } from "@/hooks/useDynamicFilterData";
import { Category } from "@/services/category";

// Get screen dimensions
const { height: screenHeight } = Dimensions.get("window");

interface CategoryFilterPanelProps {
  visible: boolean;
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  onClose: () => void;
}

export const CategoryFilterPanel: React.FC<CategoryFilterPanelProps> = ({
  visible,
  selectedCategory,
  onCategorySelect,
  onClose,
}) => {
  // Fetch dynamic category options from database (only in normal mode)
  const { options: dynamicCategoryOptions, isLoading: dynamicLoading } =
    useDynamicFilterData("categories");

  // Always show only main categories (no subcategories in modal)
  const categoryOptions = dynamicCategoryOptions;

  // Calculate dynamic height based on content
  const headerHeight = 60; // Approximate header height
  const dragHandleHeight = 20; // Drag handle + margin
  const optionHeight = 56; // Each option height (with padding)
  const optionsCount = categoryOptions.length;
  const totalContentHeight =
    headerHeight + dragHandleHeight + optionHeight * optionsCount;

  // Use dynamic height but with min/max constraints
  const dynamicHeight = Math.min(
    Math.max(totalContentHeight + 40, screenHeight * 0.3), // Min 30% of screen
    screenHeight * 0.8 // Max 80% of screen (categories can have more options)
  );

  const isLoading = dynamicLoading;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.bottomSheetOverlay}>
        <TouchableOpacity
          style={styles.bottomSheetBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.bottomSheetContainer, { height: dynamicHeight }]}>
          <SafeAreaView style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <ResponsiveText variant="h5" weight="bold">
                Category Filters
              </ResponsiveText>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={24} color={COLORS.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Drag Handle */}
            <View style={styles.dragHandle} />

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContentContainer}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                    Loading categories...
                  </ResponsiveText>
                </View>
              ) : (
                categoryOptions.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.filterOption,
                      selectedCategory === option.id &&
                        styles.filterOptionActive,
                    ]}
                    onPress={() => {
                      onCategorySelect(option.id);
                      onClose();
                    }}
                  >
                    <View style={styles.filterOptionContent}>
                      <Ionicons
                        name={option.icon as any}
                        size={16}
                        color={
                          selectedCategory === option.id
                            ? COLORS.primary[500]
                            : COLORS.text.secondary
                        }
                      />
                      <ResponsiveText
                        variant="caption3"
                        weight="medium"
                        style={[
                          styles.filterOptionText,
                          selectedCategory === option.id &&
                            styles.filterOptionTextActive,
                        ]}
                      >
                        {option.label}
                      </ResponsiveText>
                    </View>
                    {selectedCategory === option.id && (
                      <Ionicons
                        name="checkmark"
                        size={16}
                        color={COLORS.primary[500]}
                      />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = {
  bottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheetContainer: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    // Height is now set dynamically in the component
  },
  bottomSheetContent: {
    flex: 1,
  },
  bottomSheetHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.neutral[300],
    borderRadius: 2,
    alignSelf: "center" as const,
    marginBottom: PADDING.sm,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.sm,
  },
  filterOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: PADDING.md,
    paddingHorizontal: PADDING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 1,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary[50],
    borderWidth: 1,
    borderColor: COLORS.primary[200],
    borderRadius: BORDER_RADIUS.sm,
  },
  filterOptionContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flex: 1,
    gap: MARGIN.xs,
  },
  filterOptionText: {
    color: COLORS.text.secondary,
  },
  filterOptionTextActive: {
    color: COLORS.primary[500],
  },
  loadingContainer: {
    padding: PADDING.lg,
    alignItems: "center" as const,
  },
};
