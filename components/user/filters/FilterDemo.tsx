import React from "react";
import { View, TouchableOpacity } from "react-native";
import { ResponsiveText, ResponsiveButton } from "@/components";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import {
  AdvancedFilterModal,
  useAdvancedFilters,
  GLOBAL_SEARCH_FILTER_CONFIG,
  CATEGORY_FILTER_CONFIG,
  VENDOR_FILTER_CONFIG,
} from "./index";

// Demo component showing how easy it is to use the new filter system
export const FilterDemo: React.FC = () => {
  const [showGlobalFilters, setShowGlobalFilters] = React.useState(false);
  const [showCategoryFilters, setShowCategoryFilters] = React.useState(false);
  const [showVendorFilters, setShowVendorFilters] = React.useState(false);

  // Global search filters
  const globalFilters = useAdvancedFilters(GLOBAL_SEARCH_FILTER_CONFIG);

  // Category filters
  const categoryFilters = useAdvancedFilters(CATEGORY_FILTER_CONFIG);

  // Vendor filters
  const vendorFilters = useAdvancedFilters(VENDOR_FILTER_CONFIG);

  return (
    <View style={styles.container}>
      <ResponsiveText variant="h4" weight="bold" style={styles.title}>
        Filter System Demo
      </ResponsiveText>

      {/* Global Search Filters */}
      <View style={styles.filterSection}>
        <ResponsiveText
          variant="h6"
          weight="semiBold"
          style={styles.sectionTitle}
        >
          Global Search Filters
        </ResponsiveText>
        <ResponsiveText variant="body2" color={COLORS.text.secondary}>
          Active Filters: {globalFilters.getFilterCount()}
        </ResponsiveText>
        <ResponsiveButton
          title="Open Global Filters"
          variant="primary"
          size="small"
          onPress={() => setShowGlobalFilters(true)}
          style={styles.button}
        />
        {globalFilters.hasActiveFilters && (
          <ResponsiveButton
            title="Clear Filters"
            variant="outline"
            size="small"
            onPress={globalFilters.clearFilters}
            style={styles.button}
          />
        )}
      </View>

      {/* Category Filters */}
      <View style={styles.filterSection}>
        <ResponsiveText
          variant="h6"
          weight="semiBold"
          style={styles.sectionTitle}
        >
          Category Filters
        </ResponsiveText>
        <ResponsiveText variant="body2" color={COLORS.text.secondary}>
          Active Filters: {categoryFilters.getFilterCount()}
        </ResponsiveText>
        <ResponsiveButton
          title="Open Category Filters"
          variant="primary"
          size="small"
          onPress={() => setShowCategoryFilters(true)}
          style={styles.button}
        />
        {categoryFilters.hasActiveFilters && (
          <ResponsiveButton
            title="Clear Filters"
            variant="outline"
            size="small"
            onPress={categoryFilters.clearFilters}
            style={styles.button}
          />
        )}
      </View>

      {/* Vendor Filters */}
      <View style={styles.filterSection}>
        <ResponsiveText
          variant="h6"
          weight="semiBold"
          style={styles.sectionTitle}
        >
          Vendor Filters
        </ResponsiveText>
        <ResponsiveText variant="body2" color={COLORS.text.secondary}>
          Active Filters: {vendorFilters.getFilterCount()}
        </ResponsiveText>
        <ResponsiveButton
          title="Open Vendor Filters"
          variant="primary"
          size="small"
          onPress={() => setShowVendorFilters(true)}
          style={styles.button}
        />
        {vendorFilters.hasActiveFilters && (
          <ResponsiveButton
            title="Clear Filters"
            variant="outline"
            size="small"
            onPress={vendorFilters.clearFilters}
            style={styles.button}
          />
        )}
      </View>

      {/* Filter Modals */}
      <AdvancedFilterModal
        visible={showGlobalFilters}
        selectedFilters={globalFilters.activeFilters}
        onClose={() => setShowGlobalFilters(false)}
        onFilterChange={globalFilters.updateFilters}
        filterConfig={GLOBAL_SEARCH_FILTER_CONFIG}
        title="Global Search Filters"
      />

      <AdvancedFilterModal
        visible={showCategoryFilters}
        selectedFilters={categoryFilters.activeFilters}
        onClose={() => setShowCategoryFilters(false)}
        onFilterChange={categoryFilters.updateFilters}
        filterConfig={CATEGORY_FILTER_CONFIG}
        title="Category Filters"
      />

      <AdvancedFilterModal
        visible={showVendorFilters}
        selectedFilters={vendorFilters.activeFilters}
        onClose={() => setShowVendorFilters(false)}
        onFilterChange={vendorFilters.updateFilters}
        filterConfig={VENDOR_FILTER_CONFIG}
        title="Vendor Filters"
      />
    </View>
  );
};

const styles = {
  container: {
    flex: 1,
    padding: PADDING.screen,
    backgroundColor: COLORS.background.primary,
  },
  title: {
    marginBottom: MARGIN.lg,
    textAlign: "center" as const,
  },
  filterSection: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: PADDING.lg,
    marginBottom: MARGIN.md,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    marginBottom: MARGIN.sm,
  },
  button: {
    marginTop: MARGIN.sm,
  },
};
