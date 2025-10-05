import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { FilterConfig } from "./types";

// Filter Context Types
interface FilterContextType {
  activeFilters: Record<string, any>;
  updateFilter: (key: string, value: any) => void;
  updateFilters: (filters: Record<string, any>) => void;
  clearFilters: () => void;
  resetToDefaults: () => void;
  applyFilters: () => void;
  filterConfig: FilterConfig | null;
  setFilterConfig: (config: FilterConfig) => void;
  hasActiveFilters: boolean;
  getFilterCount: () => number;
}

// Create Context
const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Filter Provider Props
interface FilterProviderProps {
  children: ReactNode;
  initialConfig?: FilterConfig;
}

// Filter Provider Component
export const FilterProvider: React.FC<FilterProviderProps> = ({
  children,
  initialConfig,
}) => {
  const [filterConfig, setFilterConfig] = useState<FilterConfig | null>(
    initialConfig || null
  );
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>(
    initialConfig?.defaultFilters || {}
  );

  // Update single filter
  const updateFilter = useCallback((key: string, value: any) => {
    setActiveFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Update multiple filters
  const updateFilters = useCallback((filters: Record<string, any>) => {
    setActiveFilters((prev) => ({
      ...prev,
      ...filters,
    }));
  }, []);

  // Clear all filters to default values
  const clearFilters = useCallback(() => {
    if (filterConfig) {
      setActiveFilters(filterConfig.defaultFilters);
    }
  }, [filterConfig]);

  // Reset to default configuration
  const resetToDefaults = useCallback(() => {
    if (filterConfig) {
      setActiveFilters(filterConfig.defaultFilters);
    }
  }, [filterConfig]);

  // Apply filters (placeholder for future API integration)
  const applyFilters = useCallback(() => {
    // This will be used to trigger API calls with current filters
    console.log("Applying filters:", activeFilters);
  }, [activeFilters]);

  // Check if any filters are active (not default values)
  const hasActiveFilters = useCallback(() => {
    if (!filterConfig) return false;

    return Object.keys(filterConfig.defaultFilters).some((key) => {
      const defaultValue = filterConfig.defaultFilters[key];
      const currentValue = activeFilters[key];

      // Handle arrays (for multiple selection)
      if (Array.isArray(defaultValue) && Array.isArray(currentValue)) {
        return (
          currentValue.length !== defaultValue.length ||
          !currentValue.every((val) => defaultValue.includes(val))
        );
      }

      // Handle single values
      return currentValue !== defaultValue;
    });
  }, [activeFilters, filterConfig]);

  // Get count of active filters
  const getFilterCount = useCallback(() => {
    if (!filterConfig) return 0;

    return Object.keys(filterConfig.defaultFilters).filter((key) => {
      const defaultValue = filterConfig.defaultFilters[key];
      const currentValue = activeFilters[key];

      // Handle arrays
      if (Array.isArray(defaultValue) && Array.isArray(currentValue)) {
        return (
          currentValue.length !== defaultValue.length ||
          !currentValue.every((val) => defaultValue.includes(val))
        );
      }

      // Handle single values
      return currentValue !== defaultValue;
    }).length;
  }, [activeFilters, filterConfig]);

  const contextValue: FilterContextType = {
    activeFilters,
    updateFilter,
    updateFilters,
    clearFilters,
    resetToDefaults,
    applyFilters,
    filterConfig,
    setFilterConfig,
    hasActiveFilters: hasActiveFilters(),
    getFilterCount,
  };

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
};

// Custom hook to use filter context
export const useFilterContext = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error("useFilterContext must be used within a FilterProvider");
  }
  return context;
};

// Hook for easy filter integration
export const useAdvancedFilters = (config: FilterConfig) => {
  const context = useFilterContext();

  // Set config if it's different
  React.useEffect(() => {
    if (context.filterConfig !== config) {
      context.setFilterConfig(config);
      context.resetToDefaults();
    }
  }, [config, context]);

  return {
    activeFilters: context.activeFilters,
    updateFilter: context.updateFilter,
    updateFilters: context.updateFilters,
    clearFilters: context.clearFilters,
    resetToDefaults: context.resetToDefaults,
    applyFilters: context.applyFilters,
    hasActiveFilters: context.hasActiveFilters,
    getFilterCount: context.getFilterCount,
    filterConfig: context.filterConfig,
  };
};
