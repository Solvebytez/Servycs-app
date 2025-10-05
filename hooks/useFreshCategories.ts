import { useQuery } from "@tanstack/react-query";
import {
  buildCategoryTree,
  CategoryTreeNode,
} from "../utils/categoryTreeUtils";
import { categoryService, Category } from "../services/category";

/**
 * Hook for fetching fresh categories (no cache)
 * This hook always fetches the latest categories from the server
 * Used in add-listing screen to ensure we have the most up-to-date category data
 */
export const useFreshCategories = () => {
  return useQuery({
    queryKey: ["categories", "fresh"],
    queryFn: async () => {
      // Always fetch fresh data from server
      const freshData = await categoryService.getAllCategoriesFlat();
      const tree = buildCategoryTree(freshData);
      return tree;
    },
    staleTime: 0, // Always consider stale
    gcTime: 0, // Don't cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window focuses
    retry: 2, // Retry on failure
    retryDelay: 1000, // Wait 1 second between retries
  });
};

export default useFreshCategories;
