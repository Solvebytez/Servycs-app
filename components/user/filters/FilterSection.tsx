import React from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "@/components";
import { FilterOption } from "./FilterOption";
import { COLORS, MARGIN } from "@/constants";

interface FilterSectionProps {
  title: string;
  icon: string;
  options: Array<{
    id: string;
    label: string;
    icon: string;
  }>;
  selectedValue: string;
  onOptionSelect: (optionId: string) => void;
}

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  options,
  selectedValue,
  onOptionSelect,
}) => {
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterSectionHeader}>
        <Ionicons name={icon as any} size={20} color={COLORS.primary[500]} />
        <ResponsiveText
          variant="h6"
          weight="semiBold"
          style={styles.filterSectionTitle}
        >
          {title}
        </ResponsiveText>
      </View>

      <View style={styles.filterSectionOptions}>
        {options.map((option) => (
          <FilterOption
            key={option.id}
            option={option}
            isSelected={selectedValue === option.id}
            onPress={() => onOptionSelect(option.id)}
          />
        ))}
      </View>
    </View>
  );
};

const styles = {
  filterSection: {
    marginBottom: MARGIN.lg,
  },
  filterSectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: MARGIN.sm,
    gap: MARGIN.xs,
  },
  filterSectionTitle: {
    color: COLORS.text.primary,
  },
  filterSectionOptions: {
    gap: MARGIN.xs,
  },
};
