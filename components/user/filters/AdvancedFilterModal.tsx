import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText, ResponsiveButton } from "@/components";
import { FilterSection } from "./FilterSection";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import { AdvancedFilterModalProps } from "./types";
import { useDynamicFilterData } from "@/hooks/useDynamicFilterData";

// Get screen dimensions
const { height: screenHeight } = Dimensions.get("window");

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  visible,
  selectedFilters,
  onClose,
  onFilterChange,
  filterConfig,
  title = "Filter More",
}) => {
  // Store temporary filter state that only gets applied when "Apply Filters" is clicked
  const [tempFilters, setTempFilters] = React.useState(selectedFilters);

  // Update temp filters when selectedFilters change (e.g., when modal opens)
  React.useEffect(() => {
    setTempFilters(selectedFilters);
  }, [selectedFilters]);

  // Get dynamic filter data for sections that need it
  const dynamicSections = filterConfig.sections.filter(
    (section) => section.dynamic
  );

  // Fetch dynamic data for each dynamic section
  const dynamicData = dynamicSections.reduce((acc, section) => {
    if (section.dynamicKey) {
      acc[section.id] = useDynamicFilterData(section.dynamicKey);
    }
    return acc;
  }, {} as Record<string, { options: any[]; isLoading: boolean; error: any }>);

  const handleOptionSelect = (filterType: string, optionId: string) => {
    // Update temporary filters instead of applying immediately
    setTempFilters((prev) => ({
      ...prev,
      [filterType]: optionId,
    }));
  };

  const handleApplyFilters = () => {
    // Apply the temporary filters when "Apply Filters" is clicked
    onFilterChange(tempFilters);
    onClose();
  };

  const handleClearAll = () => {
    onFilterChange(filterConfig.defaultFilters);
  };

  // Get options for a section (either static or dynamic)
  const getSectionOptions = (section: any) => {
    if (section.dynamic && section.dynamicKey && dynamicData[section.id]) {
      return dynamicData[section.id].options;
    }
    return section.options;
  };

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
        <View style={styles.bottomSheetContainer}>
          <SafeAreaView style={styles.bottomSheetContent}>
            <View style={styles.bottomSheetHeader}>
              <ResponsiveText variant="h5" weight="bold">
                {title}
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
              {filterConfig.sections.map((section) => (
                <FilterSection
                  key={section.id}
                  title={section.title}
                  icon={section.icon}
                  options={getSectionOptions(section)}
                  selectedValue={tempFilters[section.id]}
                  onOptionSelect={(optionId) =>
                    handleOptionSelect(section.id, optionId)
                  }
                />
              ))}
            </ScrollView>

            {/* Apply/Clear Buttons */}
            <View style={styles.advancedFilterActions}>
              <ResponsiveButton
                title="Clear All"
                variant="outline"
                size="small"
                onPress={handleClearAll}
                style={styles.clearButton}
              />

              <ResponsiveButton
                title="Apply Filters"
                variant="primary"
                size="small"
                onPress={handleApplyFilters}
                style={styles.applyButton}
              />
            </View>
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
    height: screenHeight * 0.75, // 75% of screen height - dynamic based on device
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
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.neutral[300],
    borderRadius: 2,
    alignSelf: "center" as const,
    marginBottom: PADDING.sm,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.sm,
  },
  advancedFilterActions: {
    flexDirection: "row" as const,
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    gap: MARGIN.sm,
  },
  clearButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
};
