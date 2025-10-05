import React from "react";
import { View, TouchableOpacity, ScrollView } from "react-native";
import { ResponsiveText } from "@/components";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

interface SubcategoryFilterChipsProps {
  childCategories: any[];
  selectedSubcategories: string[];
  onSubcategorySelect: (subcategoryId: string) => void;
}

export const SubcategoryFilterChips: React.FC<SubcategoryFilterChipsProps> = ({
  childCategories,
  selectedSubcategories,
  onSubcategorySelect,
}) => {
  if (!childCategories || childCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {childCategories.map((subcategory) => {
          const isSelected = selectedSubcategories.includes(subcategory.id);

          return (
            <TouchableOpacity
              key={subcategory.id}
              style={[styles.chip, isSelected && styles.chipActive]}
              onPress={() => onSubcategorySelect(subcategory.id)}
              activeOpacity={0.7}
            >
              <ResponsiveText
                variant="caption2"
                weight="medium"
                color={isSelected ? COLORS.white : COLORS.text.secondary}
                style={styles.chipText}
              >
                {subcategory.name}
              </ResponsiveText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = {
  container: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    paddingVertical: PADDING.xs,
  },
  scrollContent: {
    paddingHorizontal: PADDING.screen,
    gap: MARGIN.sm,
  },
  chip: {
    paddingVertical: 4,
    paddingHorizontal: PADDING.md,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.neutral[100],
    borderWidth: 1,
    borderColor: COLORS.border.light,
    minWidth: 80,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  chipActive: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  chipText: {
    fontSize: 10,
    fontWeight: "500" as const,
  },
};
