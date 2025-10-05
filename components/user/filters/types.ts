// Filter configuration types for flexible filter system

export interface FilterOption {
  id: string;
  label: string;
  icon: string;
}

export interface FilterSectionConfig {
  id: string;
  title: string;
  icon: string;
  options: FilterOption[];
  type: "single" | "multiple" | "range";
  dynamic?: boolean; // Flag to indicate if options should be fetched dynamically
  dynamicKey?: string; // Key to identify which dynamic data to fetch
}

export interface FilterConfig {
  sections: FilterSectionConfig[];
  defaultFilters: Record<string, any>;
}

export interface AdvancedFilterModalProps {
  visible: boolean;
  selectedFilters: Record<string, any>;
  onClose: () => void;
  onFilterChange: (filters: Record<string, any>) => void;
  filterConfig: FilterConfig;
  title?: string;
}

// Filter presets for different screens
export const GLOBAL_SEARCH_FILTER_CONFIG: FilterConfig = {
  sections: [
    {
      id: "price",
      title: "Price Range Filters",
      icon: "cash-outline",
      type: "single",
      options: [
        { id: "any", label: "Any Price", icon: "cash" },
        { id: "under-500", label: "Under ₹500", icon: "cash" },
        { id: "500-1000", label: "₹500 - ₹1000", icon: "cash" },
        { id: "1000-2500", label: "₹1000 - ₹2500", icon: "cash" },
        { id: "2500-5000", label: "₹2500 - ₹5000", icon: "cash" },
        { id: "above-5000", label: "Above ₹5000", icon: "cash" },
      ],
    },
    {
      id: "rating",
      title: "Rating Filters",
      icon: "star-outline",
      type: "single",
      options: [
        { id: "any", label: "Any Rating", icon: "star-outline" },
        { id: "4.5+", label: "4.5+ Stars", icon: "star" },
        { id: "4.0+", label: "4.0+ Stars", icon: "star" },
        { id: "3.5+", label: "3.5+ Stars", icon: "star" },
        { id: "3.0+", label: "3.0+ Stars", icon: "star" },
        { id: "below-3", label: "Below 3 Stars", icon: "star-outline" },
      ],
    },
    {
      id: "hours",
      title: "Business Hours",
      icon: "business-outline",
      type: "single",
      options: [
        { id: "any", label: "Any Hours", icon: "time" },
        { id: "open-now", label: "Open Now", icon: "checkmark-circle" },
        { id: "24-7", label: "24/7 Available", icon: "moon" },
        { id: "weekdays", label: "Weekdays Only", icon: "business" },
        { id: "weekends", label: "Weekends Only", icon: "calendar" },
      ],
    },
  ],
  defaultFilters: {
    price: "any",
    rating: "any",
    hours: "any",
  },
};

export const CATEGORY_FILTER_CONFIG: FilterConfig = {
  sections: [
    {
      id: "category",
      title: "Category",
      icon: "grid-outline",
      type: "single",
      dynamic: true,
      dynamicKey: "categories",
      options: [], // Will be populated dynamically
    },
    {
      id: "price",
      title: "Price Range",
      icon: "cash-outline",
      type: "single",
      options: [
        { id: "any", label: "Any Price", icon: "cash" },
        { id: "under-500", label: "Under ₹500", icon: "cash" },
        { id: "500-1000", label: "₹500 - ₹1000", icon: "cash" },
        { id: "1000-2500", label: "₹1000 - ₹2500", icon: "cash" },
        { id: "2500-5000", label: "₹2500 - ₹5000", icon: "cash" },
        { id: "above-5000", label: "Above ₹5000", icon: "cash" },
      ],
    },
    {
      id: "rating",
      title: "Rating",
      icon: "star-outline",
      type: "single",
      options: [
        { id: "any", label: "Any Rating", icon: "star-outline" },
        { id: "4.5+", label: "4.5+ Stars", icon: "star" },
        { id: "4.0+", label: "4.0+ Stars", icon: "star" },
        { id: "3.5+", label: "3.5+ Stars", icon: "star" },
        { id: "3.0+", label: "3.0+ Stars", icon: "star" },
        { id: "below-3", label: "Below 3 Stars", icon: "star-outline" },
      ],
    },
    {
      id: "location",
      title: "Location",
      icon: "location-outline",
      type: "single",
      options: [
        { id: "any", label: "Any Location", icon: "location-outline" },
        { id: "nearby", label: "Nearby (5km)", icon: "location" },
        { id: "city", label: "Same City", icon: "business" },
        { id: "state", label: "Same State", icon: "map" },
      ],
    },
    {
      id: "features",
      title: "Special Features",
      icon: "checkmark-outline",
      type: "multiple",
      options: [
        { id: "home-service", label: "Home Service", icon: "home" },
        { id: "online-booking", label: "Online Booking", icon: "calendar" },
        { id: "instant-booking", label: "Instant Booking", icon: "flash" },
        { id: "group-discount", label: "Group Discount", icon: "people" },
        { id: "loyalty-program", label: "Loyalty Program", icon: "gift" },
      ],
    },
  ],
  defaultFilters: {
    category: "all",
    price: "any",
    rating: "any",
    location: "any",
    features: [],
  },
};

export const VENDOR_FILTER_CONFIG: FilterConfig = {
  sections: [
    {
      id: "status",
      title: "Service Status",
      icon: "checkmark-circle-outline",
      type: "single",
      options: [
        { id: "all", label: "All Services", icon: "list" },
        { id: "active", label: "Active Only", icon: "checkmark-circle" },
        { id: "pending", label: "Pending Review", icon: "time" },
        { id: "off-service", label: "Off Service", icon: "pause-circle" },
      ],
    },
    {
      id: "category",
      title: "Category",
      icon: "grid-outline",
      type: "single",
      options: [
        { id: "all", label: "All Categories", icon: "grid" },
        { id: "beauty", label: "Beauty & Wellness", icon: "flower" },
        { id: "fitness", label: "Fitness & Sports", icon: "fitness" },
        { id: "education", label: "Education & Training", icon: "school" },
        { id: "technology", label: "Technology", icon: "laptop" },
      ],
    },
    {
      id: "sort",
      title: "Sort By",
      icon: "swap-vertical-outline",
      type: "single",
      options: [
        { id: "newest", label: "Newest First", icon: "time" },
        { id: "oldest", label: "Oldest First", icon: "time-outline" },
        { id: "most-booked", label: "Most Booked", icon: "trending-up" },
        { id: "highest-rated", label: "Highest Rated", icon: "star" },
      ],
    },
  ],
  defaultFilters: {
    status: "all",
    category: "all",
    sort: "newest",
  },
};
