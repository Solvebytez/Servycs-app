// Export all filter components
export { MainFilterBar } from "./MainFilterBar";
export { AdvancedFilterModal } from "./AdvancedFilterModal";
export { FilterSection } from "./FilterSection";
export { FilterOption } from "./FilterOption";
export { SortFilterPanel } from "./SortFilterPanel";
export { CategoryFilterPanel } from "./CategoryFilterPanel";
export { SubcategoryFilterChips } from "./SubcategoryFilterChips";

// Export context and hooks
export {
  FilterProvider,
  useFilterContext,
  useAdvancedFilters,
} from "./FilterContext";

// Export utilities
export { filterUtils, filterPersistence } from "./filterUtils";

// Export types and configurations
export type {
  FilterOption as FilterOptionType,
  FilterSectionConfig,
  FilterConfig,
  AdvancedFilterModalProps,
} from "./types";

export {
  GLOBAL_SEARCH_FILTER_CONFIG,
  CATEGORY_FILTER_CONFIG,
  VENDOR_FILTER_CONFIG,
} from "./types";
