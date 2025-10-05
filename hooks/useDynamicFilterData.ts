import { usePrimaryCategories } from "./useCategories";
import { FilterOption } from "@/components/user/filters/types";

// Hook to get dynamic filter data based on the dynamicKey
export const useDynamicFilterData = (
  dynamicKey: string
): {
  options: FilterOption[];
  isLoading: boolean;
  error: any;
} => {
  // Fetch primary categories for category filter
  const { data: categories, isLoading, error } = usePrimaryCategories();

  const getDynamicOptions = (key: string): FilterOption[] => {
    switch (key) {
      case "categories":
        if (!categories) {
          return [];
        }

        // Convert categories to filter options
        const filterOptions = [
          { id: "all", label: "All Categories", icon: "grid" },
          ...categories.map((category) => ({
            id: category.id,
            label: category.name,
            icon: getCategoryIcon(category.name),
          })),
        ];

        return filterOptions;

      // Add more dynamic data sources here in the future
      default:
        return [];
    }
  };

  // Helper function to get appropriate icon for category
  const getCategoryIcon = (categoryName: string): string => {
    const name = categoryName.toLowerCase();

    if (name.includes("beauty") || name.includes("wellness")) return "flower";
    if (name.includes("fitness") || name.includes("sport")) return "fitness";
    if (name.includes("education") || name.includes("training"))
      return "school";
    if (name.includes("technology") || name.includes("tech")) return "laptop";
    if (name.includes("home") || name.includes("garden")) return "home";
    if (name.includes("automotive") || name.includes("car")) return "car";
    if (name.includes("health") || name.includes("medical")) return "medical";
    if (name.includes("food") || name.includes("restaurant"))
      return "restaurant";
    if (name.includes("entertainment") || name.includes("music"))
      return "musical-notes";
    if (name.includes("business") || name.includes("professional"))
      return "business";
    if (name.includes("travel") || name.includes("tourism")) return "airplane";
    if (name.includes("fashion") || name.includes("clothing")) return "shirt";
    if (name.includes("photography") || name.includes("photo")) return "camera";
    if (name.includes("legal") || name.includes("law")) return "library";
    if (name.includes("finance") || name.includes("money")) return "card";
    if (name.includes("real estate") || name.includes("property"))
      return "business";
    if (name.includes("consulting") || name.includes("advice")) return "people";
    if (name.includes("cleaning") || name.includes("maintenance"))
      return "construct";
    if (name.includes("security") || name.includes("safety")) return "shield";
    if (name.includes("logistics") || name.includes("shipping"))
      return "car-sport";

    // Default icon for unknown categories
    return "grid";
  };

  return {
    options: getDynamicOptions(dynamicKey),
    isLoading,
    error,
  };
};
