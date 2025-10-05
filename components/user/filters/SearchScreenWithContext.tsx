// Example of how to update the search screen to use the new context system
// This is optional - the current search screen works fine without context

import React, { useState } from "react";
import { View } from "react-native";
import {
  MainFilterBar,
  AdvancedFilterModal,
  SortFilterPanel,
  CategoryFilterPanel,
  useAdvancedFilters,
  GLOBAL_SEARCH_FILTER_CONFIG,
} from "./index";

export const SearchScreenWithContext: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string | null>("sort");
  const [showSortPanel, setShowSortPanel] = useState(false);
  const [showCategoryPanel, setShowCategoryPanel] = useState(false);
  const [isAdvancedFilterModalVisible, setIsAdvancedFilterModalVisible] =
    useState(false);

  // Use the new context-based filter system
  const filters = useAdvancedFilters(GLOBAL_SEARCH_FILTER_CONFIG);

  const handleFilterPress = (filterId: string) => {
    if (filterId === "filter-more") {
      setActiveFilter(null);
      setIsAdvancedFilterModalVisible(true);
    } else if (filterId === "sort") {
      setActiveFilter("sort");
      setShowSortPanel(true);
    } else if (filterId === "category") {
      setActiveFilter("category");
      setShowCategoryPanel(true);
    }
  };

  const handleSortSelect = (sortId: string) => {
    filters.updateFilter("sort", sortId);
  };

  const handleCategorySelect = (categoryId: string) => {
    filters.updateFilter("category", categoryId);
  };

  return (
    <View>
      {/* Main Filter Bar */}
      <MainFilterBar
        activeFilter={activeFilter}
        isAdvancedFilterModalVisible={isAdvancedFilterModalVisible}
        onFilterPress={handleFilterPress}
      />

      {/* Sort Filter Panel */}
      <SortFilterPanel
        visible={showSortPanel}
        selectedSort={filters.activeFilters.sort}
        onSortSelect={handleSortSelect}
        onClose={() => setShowSortPanel(false)}
      />

      {/* Category Filter Panel */}
      <CategoryFilterPanel
        visible={showCategoryPanel}
        selectedCategory={filters.activeFilters.category}
        onCategorySelect={handleCategorySelect}
        onClose={() => setShowCategoryPanel(false)}
      />

      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        visible={isAdvancedFilterModalVisible}
        selectedFilters={filters.activeFilters}
        onClose={() => setIsAdvancedFilterModalVisible(false)}
        onFilterChange={filters.updateFilters}
        filterConfig={GLOBAL_SEARCH_FILTER_CONFIG}
        title="Search Filters"
      />

      {/* Filter Status Display */}
      {filters.hasActiveFilters && (
        <View style={{ padding: 16, backgroundColor: "#f0f0f0" }}>
          <Text>Active Filters: {filters.getFilterCount()}</Text>
          <TouchableOpacity onPress={filters.clearFilters}>
            <Text>Clear All Filters</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// Usage in your app:
// 1. Wrap your app or screen with FilterProvider
// 2. Use useAdvancedFilters hook in any component
// 3. All filter state is managed globally
