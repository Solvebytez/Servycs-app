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

// Get screen dimensions
const { height: screenHeight } = Dimensions.get("window");

// Sort options
const sortOptions = [
  { id: "top-rated", label: "Top Rated", icon: "star" },
  { id: "price-low-high", label: "Price: Low to High", icon: "arrow-up" },
  { id: "price-high-low", label: "Price: High to Low", icon: "arrow-down" },
  { id: "newest", label: "Newest First", icon: "time" },
];

interface SortFilterPanelProps {
  visible: boolean;
  selectedSort: string;
  onSortSelect: (sortId: string) => void;
  onClose: () => void;
}

export const SortFilterPanel: React.FC<SortFilterPanelProps> = ({
  visible,
  selectedSort,
  onSortSelect,
  onClose,
}) => {
  // Calculate dynamic height based on content
  const headerHeight = 60; // Approximate header height
  const dragHandleHeight = 20; // Drag handle + margin
  const optionHeight = 56; // Each option height (with padding)
  const optionsCount = sortOptions.length;
  const totalContentHeight =
    headerHeight + dragHandleHeight + optionHeight * optionsCount;

  // Use dynamic height but with min/max constraints
  const dynamicHeight = Math.min(
    Math.max(totalContentHeight + 40, screenHeight * 0.3), // Min 30% of screen
    screenHeight * 0.7 // Max 70% of screen
  );

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
                Sort Options
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
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.filterOption,
                    selectedSort === option.id && styles.filterOptionActive,
                  ]}
                  onPress={() => {
                    onSortSelect(option.id);
                    onClose();
                  }}
                >
                  <View style={styles.filterOptionContent}>
                    <Ionicons
                      name={option.icon as any}
                      size={16}
                      color={
                        selectedSort === option.id
                          ? COLORS.primary[500]
                          : COLORS.text.secondary
                      }
                    />
                    <ResponsiveText
                      variant="caption3"
                      weight="medium"
                      style={[
                        styles.filterOptionText,
                        selectedSort === option.id &&
                          styles.filterOptionTextActive,
                      ]}
                    >
                      {option.label}
                    </ResponsiveText>
                  </View>
                  {selectedSort === option.id && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={COLORS.primary[500]}
                    />
                  )}
                </TouchableOpacity>
              ))}
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
};
