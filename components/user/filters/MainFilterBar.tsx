import React from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "@/components";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

// Main filter categories (top bar - simplified)
const mainFilterOptions = [
  { id: "sort", label: "Sort Options", icon: "swap-vertical-outline" },
  { id: "category", label: "Category Filters", icon: "grid-outline" },
  { id: "filter-more", label: "Filter More", icon: "options-outline" },
];

interface MainFilterBarProps {
  activeFilter: string | null;
  isAdvancedFilterModalVisible: boolean;
  onFilterPress: (filterId: string) => void;
}

export const MainFilterBar: React.FC<MainFilterBarProps> = ({
  activeFilter,
  isAdvancedFilterModalVisible,
  onFilterPress,
}) => {
  return (
    <View style={styles.filterBarContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterBarContent}
      >
        {mainFilterOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.filterOption,
              (activeFilter === option.id ||
                (option.id === "filter-more" &&
                  isAdvancedFilterModalVisible)) &&
                styles.filterOptionActive,
            ]}
            onPress={() => onFilterPress(option.id)}
          >
            <Ionicons
              name={option.icon as any}
              size={16}
              color={
                activeFilter === option.id ||
                (option.id === "filter-more" && isAdvancedFilterModalVisible)
                  ? COLORS.white
                  : COLORS.text.secondary
              }
            />
            <ResponsiveText
              variant="caption2"
              weight="medium"
              color={
                activeFilter === option.id ||
                (option.id === "filter-more" && isAdvancedFilterModalVisible)
                  ? COLORS.white
                  : COLORS.text.secondary
              }
              style={styles.filterOptionText}
            >
              {option.label}
            </ResponsiveText>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = {
  filterBarContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    paddingVertical: PADDING.sm,
  },
  filterBarContent: {
    paddingHorizontal: PADDING.screen,
    gap: MARGIN.sm,
  },
  filterOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: MARGIN.xs,
    paddingVertical: PADDING.sm,
    paddingHorizontal: PADDING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.neutral[100],
    gap: MARGIN.xs,
    minWidth: 80,
    justifyContent: "center" as const,
  },
  filterOptionActive: {
    backgroundColor: COLORS.primary[200],
  },
  filterOptionText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
};
