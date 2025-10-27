import React from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import { ResponsiveText } from "@/components/UI";

export type VendorFilterStatus =
  | "all"
  | "ACTIVE"
  | "PENDING"
  | "INACTIVE"
  | "SUSPENDED";

interface VendorListFilterBarProps {
  totalCount: number;
  onStatusChange: (status: VendorFilterStatus) => void;
  currentStatus?: VendorFilterStatus;
  statusCounts?: {
    all: number;
    ACTIVE: number;
    PENDING: number;
    INACTIVE: number;
    SUSPENDED: number;
  };
}

export const VendorListFilterBar: React.FC<VendorListFilterBarProps> = ({
  totalCount,
  onStatusChange,
  currentStatus = "all",
  statusCounts,
}) => {
  const statusOptions = [
    { value: "all" as VendorFilterStatus, label: "All", count: totalCount },
    {
      value: "ACTIVE" as VendorFilterStatus,
      label: "Active",
      count: statusCounts?.ACTIVE || 0,
    },
    {
      value: "PENDING" as VendorFilterStatus,
      label: "Pending",
      count: statusCounts?.PENDING || 0,
    },
    {
      value: "INACTIVE" as VendorFilterStatus,
      label: "Inactive",
      count: statusCounts?.INACTIVE || 0,
    },
    {
      value: "SUSPENDED" as VendorFilterStatus,
      label: "Suspended",
      count: statusCounts?.SUSPENDED || 0,
    },
  ];

  const handleStatusSelect = (status: VendorFilterStatus) => {
    onStatusChange(status);
  };

  return (
    <View style={styles.filterBar}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContainer}
      >
        {statusOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterChip,
              currentStatus === option.value && styles.filterChipActive,
            ]}
            onPress={() => handleStatusSelect(option.value)}
            activeOpacity={0.7}
          >
            <ResponsiveText
              variant="caption1"
              weight="medium"
              color={
                currentStatus === option.value
                  ? COLORS.primary[600]
                  : COLORS.text.secondary
              }
              style={styles.filterChipText}
            >
              {option.label}
            </ResponsiveText>
            {option.count > 0 && (
              <View
                style={[
                  styles.filterCount,
                  currentStatus === option.value
                    ? styles.filterCountActive
                    : styles.filterCountInactive,
                ]}
              >
                <ResponsiveText
                  variant="caption3"
                  weight="medium"
                  color={
                    currentStatus === option.value
                      ? COLORS.white
                      : COLORS.text.secondary
                  }
                >
                  {option.count}
                </ResponsiveText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  filterBar: {
    paddingVertical: PADDING.md,
    backgroundColor: COLORS.white,
  },
  filterScrollContainer: {
    paddingHorizontal: PADDING.screen,
    paddingRight: PADDING.lg,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.xs,
    marginRight: MARGIN.sm,
    backgroundColor: COLORS.background.light,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border.light,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary[100],
    borderColor: COLORS.primary[300],
    shadowColor: COLORS.primary[500],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterChipText: {
    marginRight: MARGIN.xs,
  },
  filterCount: {
    marginLeft: MARGIN.xs,
    paddingHorizontal: PADDING.xs,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    minWidth: 18,
    alignItems: "center",
    height: 16,
  },
  filterCountActive: {
    backgroundColor: COLORS.primary[500],
  },
  filterCountInactive: {
    backgroundColor: COLORS.background.light,
  },
});

export default VendorListFilterBar;
