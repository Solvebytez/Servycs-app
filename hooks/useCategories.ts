import { useQuery } from "@tanstack/react-query";
import { categoryService, Category } from "../services/category";

// Hook to get primary categories
export const usePrimaryCategories = () => {
  const result = useQuery({
    queryKey: ["categories", "primary"],
    queryFn: categoryService.getPrimaryCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return result;
};

// Hook to get category children
export const useCategoryChildren = (categoryId: string | null) => {
  const result = useQuery({
    queryKey: ["categories", "children", categoryId],
    queryFn: () => categoryService.getCategoryChildren(categoryId!),
    enabled: !!categoryId, // Only run query if categoryId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return result;
};

// Hook to check if category has children
export const useCategoryHasChildren = (categoryId: string | null) => {
  return useQuery({
    queryKey: ["categories", "has-children", categoryId],
    queryFn: () => categoryService.checkCategoryHasChildren(categoryId!),
    enabled: !!categoryId, // Only run query if categoryId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get category by ID
export const useCategoryById = (categoryId: string | null) => {
  return useQuery({
    queryKey: ["categories", "by-id", categoryId],
    queryFn: () => categoryService.getCategoryById(categoryId!),
    enabled: !!categoryId, // Only run query if categoryId exists
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Hook to get full category tree (admin only)
export const useCategoryTree = () => {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: categoryService.getCategoryTree,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Utility hook to get category path (breadcrumb)
export const useCategoryPath = (categoryId: string | null) => {
  const { data: category, isLoading, error } = useCategoryById(categoryId);

  const getCategoryPath = (cat: any, path: string[] = []): string[] => {
    if (!cat) return path;

    const newPath = [cat.name, ...path];

    if (cat.parent) {
      return getCategoryPath(cat.parent, newPath);
    }

    return newPath;
  };

  return {
    path: category ? getCategoryPath(category) : [],
    isLoading,
    error,
  };
};
