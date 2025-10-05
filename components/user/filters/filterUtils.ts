import { FilterConfig } from "./types";

// API Parameter Types
export interface ServiceListingsParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  vendorId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  state?: string;
  isActive?: boolean;
  excludeUserId?: string;
  sortBy?: "createdAt" | "updatedAt" | "title" | "rating";
  sortOrder?: "asc" | "desc";
  minRating?: number;
}

// Filter conversion utilities
export const filterUtils = {
  // Convert UI filters to API parameters
  convertFiltersToApiParams: (
    filters: Record<string, any>
  ): Partial<ServiceListingsParams> => {
    const params: Partial<ServiceListingsParams> = {};

    // Category filter
    if (filters.category && filters.category !== "all") {
      params.categoryId = filters.category;
    }

    // Price filter
    if (filters.price && filters.price !== "any") {
      const priceRange = getPriceRange(filters.price);
      if (priceRange.min !== undefined) params.minPrice = priceRange.min;
      if (priceRange.max !== undefined) params.maxPrice = priceRange.max;
    }

    // Rating filter
    if (filters.rating && filters.rating !== "any") {
      params.minRating = getMinRating(filters.rating);
    }

    // Sort filter
    if (filters.sort && filters.sort !== "top-rated") {
      const sortConfig = getSortConfig(filters.sort);
      if (sortConfig.sortBy) params.sortBy = sortConfig.sortBy;
      if (sortConfig.sortOrder) params.sortOrder = sortConfig.sortOrder;
    }

    // Business hours filter
    if (filters.hours && filters.hours !== "any") {
      params.businessHours = filters.hours;
    }

    // Features filter (multiple selection)
    if (
      filters.features &&
      Array.isArray(filters.features) &&
      filters.features.length > 0
    ) {
      // This would need to be implemented based on your features system
      // For now, we'll skip features-specific filtering
    }

    return params;
  },

  // Get active filter summary for display
  getActiveFilterSummary: (
    filters: Record<string, any>,
    config: FilterConfig
  ): string[] => {
    const summary: string[] = [];

    Object.keys(filters).forEach((key) => {
      const value = filters[key];
      const defaultValue = config.defaultFilters[key];

      // Skip if it's the default value
      if (value === defaultValue) return;

      // Get display text for the filter
      const displayText = getFilterDisplayText(key, value, config);
      if (displayText) {
        summary.push(displayText);
      }
    });

    return summary;
  },

  // Check if filters have changed from defaults
  hasActiveFilters: (
    filters: Record<string, any>,
    config: FilterConfig
  ): boolean => {
    return Object.keys(config.defaultFilters).some((key) => {
      const defaultValue = config.defaultFilters[key];
      const currentValue = filters[key];

      // Handle arrays
      if (Array.isArray(defaultValue) && Array.isArray(currentValue)) {
        return (
          currentValue.length !== defaultValue.length ||
          !currentValue.every((val) => defaultValue.includes(val))
        );
      }

      // Handle single values
      return currentValue !== defaultValue;
    });
  },

  // Get filter count
  getFilterCount: (
    filters: Record<string, any>,
    config: FilterConfig
  ): number => {
    return Object.keys(config.defaultFilters).filter((key) => {
      const defaultValue = config.defaultFilters[key];
      const currentValue = filters[key];

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
  },
};

// Helper functions
function getPriceRange(priceFilter: string): { min?: number; max?: number } {
  switch (priceFilter) {
    case "under-500":
      return { max: 500 };
    case "500-1000":
      return { min: 500, max: 1000 };
    case "1000-2500":
      return { min: 1000, max: 2500 };
    case "2500-5000":
      return { min: 2500, max: 5000 };
    case "above-5000":
      return { min: 5000 };
    default:
      return {};
  }
}

function getMinRating(ratingFilter: string): number {
  switch (ratingFilter) {
    case "4.5+":
      return 4.5;
    case "4.0+":
      return 4.0;
    case "3.5+":
      return 3.5;
    case "3.0+":
      return 3.0;
    case "below-3":
      return 0; // This would need special handling for below 3 stars
    default:
      return 0;
  }
}

function getSortConfig(sortFilter: string): {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
} {
  switch (sortFilter) {
    case "price-low-high":
      // Use "price" as sortBy to trigger price sorting in backend
      return { sortBy: "price", sortOrder: "asc" };
    case "price-high-low":
      // Use "price" as sortBy to trigger price sorting in backend
      return { sortBy: "price", sortOrder: "desc" };
    case "newest":
      return { sortBy: "createdAt", sortOrder: "desc" };
    case "oldest":
      return { sortBy: "createdAt", sortOrder: "asc" };
    case "top-rated":
      return { sortBy: "rating", sortOrder: "desc" };
    default:
      return { sortBy: "rating", sortOrder: "desc" };
  }
}

function getFilterDisplayText(
  key: string,
  value: any,
  config: FilterConfig
): string | null {
  // Find the section that contains this filter
  const section = config.sections.find((s) => s.id === key);
  if (!section) return null;

  // Find the option that matches the value
  const option = section.options.find((o) => o.id === value);
  if (!option) return null;

  return `${section.title}: ${option.label}`;
}

// Filter persistence utilities
export const filterPersistence = {
  // Save filters to AsyncStorage
  saveFilters: async (
    filters: Record<string, any>,
    key: string = "activeFilters"
  ) => {
    try {
      const AsyncStorage = await import(
        "@react-native-async-storage/async-storage"
      );
      await AsyncStorage.default.setItem(key, JSON.stringify(filters));
    } catch (error) {
      console.error("Failed to save filters:", error);
    }
  },

  // Load filters from AsyncStorage
  loadFilters: async (
    key: string = "activeFilters"
  ): Promise<Record<string, any> | null> => {
    try {
      const AsyncStorage = await import(
        "@react-native-async-storage/async-storage"
      );
      const saved = await AsyncStorage.default.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error("Failed to load filters:", error);
      return null;
    }
  },

  // Clear saved filters
  clearSavedFilters: async (key: string = "activeFilters") => {
    try {
      const AsyncStorage = await import(
        "@react-native-async-storage/async-storage"
      );
      await AsyncStorage.default.removeItem(key);
    } catch (error) {
      console.error("Failed to clear saved filters:", error);
    }
  },
};
