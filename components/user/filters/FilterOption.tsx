import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "@/components";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

interface FilterOptionProps {
  option: {
    id: string;
    label: string;
    icon: string;
  };
  isSelected: boolean;
  onPress: () => void;
}

export const FilterOption: React.FC<FilterOptionProps> = ({
  option,
  isSelected,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={[styles.filterOption, isSelected && styles.filterOptionActive]}
      onPress={onPress}
    >
      <View style={styles.filterOptionContent}>
        <Ionicons
          name={option.icon as any}
          size={16}
          color={isSelected ? COLORS.primary[500] : COLORS.text.secondary}
        />
        <ResponsiveText
          variant="caption3"
          weight="medium"
          style={[
            styles.filterOptionText,
            isSelected && styles.filterOptionTextActive,
          ]}
        >
          {option.label}
        </ResponsiveText>
      </View>
      {isSelected && (
        <Ionicons name="checkmark" size={16} color={COLORS.primary[500]} />
      )}
    </TouchableOpacity>
  );
};

const styles = {
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
