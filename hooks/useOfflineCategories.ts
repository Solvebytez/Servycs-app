import { useQuery } from "@tanstack/react-query";
import {
  CategoryStorage,
  OfflineDataManager,
  NetworkUtils,
} from "../utils/asyncStorageUtils";
import { categoryQueryConfig } from "../utils/queryPersistence";
import {
  buildCategoryTree,
  CategoryTreeNode,
} from "../utils/categoryTreeUtils";
import { categoryService, Category } from "../services/category";

/**
 * Hook for offline-first category browsing
 * This hook prioritizes cached data and works offline
 */
export const useOfflineCategories = () => {
  return useQuery({
    queryKey: ["categories", "offline"],
    queryFn: async () => {
      // Check if we have cached data first
      const cachedTree = await CategoryStorage.getCategoryTree();
      if (cachedTree && !(await CategoryStorage.isCategoryDataCached())) {
        // Return cached data if it's not expired
        return cachedTree;
      }

      // If no cached data or expired, try to fetch fresh data
      if (NetworkUtils.isOnline()) {
        try {
          const freshData = await categoryService.getAllCategoriesFlat();
          const tree = buildCategoryTree(freshData);

          // Store both flat and tree data
          await CategoryStorage.storeCategoryFlat(freshData);
          await CategoryStorage.storeCategoryTree(tree);

          return tree;
        } catch (error) {
          console.warn("Failed to fetch fresh category data:", error);

          // Fall back to cached data if available
          if (cachedTree) {
            return cachedTree;
          }

          throw error;
        }
      } else {
        // Offline mode - return cached data if available
        if (cachedTree) {
          return cachedTree;
        }

        throw new Error("No cached category data available for offline use");
      }
    },
    select: (data: CategoryTreeNode[]) => {
      // Data is already in tree format from our queryFn
      return data;
    },
    ...categoryQueryConfig,
    // Override some settings for offline-first behavior
    networkMode: "offlineFirst",
    refetchOnMount: false, // Don't refetch on mount if we have cached data
    refetchOnReconnect: true, // Refetch when network reconnects
  });
};

/**
 * Hook to get category cache statistics
 */
export const useCategoryCacheStats = () => {
  return useQuery({
    queryKey: ["categories", "cache-stats"],
    queryFn: async () => {
      return await CategoryStorage.getCacheStats();
    },
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook to check if category data is available offline
 */
export const useCategoryOfflineStatus = () => {
  return useQuery({
    queryKey: ["categories", "offline-status"],
    queryFn: async () => {
      const isCached = await CategoryStorage.isCategoryDataCached();
      const cacheStats = await CategoryStorage.getCacheStats();
      const networkInfo = NetworkUtils.getNetworkInfo();

      return {
        isOfflineDataAvailable: isCached,
        isOnline: networkInfo.isOnline,
        cacheStats,
        lastUpdated: cacheStats.lastUpdated,
        ageInHours: cacheStats.ageInHours,
      };
    },
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to manually refresh category data
 */
export const useRefreshCategories = () => {
  return useQuery({
    queryKey: ["categories", "refresh"],
    queryFn: async () => {
      if (!NetworkUtils.isOnline()) {
        throw new Error("Cannot refresh categories while offline");
      }

      // Force fetch fresh data
      const freshData = await categoryService.getAllCategoriesFlat();
      const tree = buildCategoryTree(freshData);

      // Store the fresh data
      await CategoryStorage.storeCategoryFlat(freshData);
      await CategoryStorage.storeCategoryTree(tree);

      return tree;
    },
    enabled: false, // Don't run automatically
    staleTime: 0, // Always consider stale
    gcTime: 0, // Don't cache
  });
};

/**
 * Hook to clear category cache
 */
export const useClearCategoryCache = () => {
  return useQuery({
    queryKey: ["categories", "clear-cache"],
    queryFn: async () => {
      await CategoryStorage.clearCategoryData();
      return true;
    },
    enabled: false, // Don't run automatically
    staleTime: 0,
    gcTime: 0,
  });
};

/**
 * Hook for category search with offline support
 */
export const useCategorySearch = (searchTerm: string) => {
  const { data: tree, ...rest } = useOfflineCategories();

  const searchResults = tree ? searchCategories(tree, searchTerm) : [];

  return {
    ...rest,
    data: searchResults,
    tree,
  };
};

/**
 * Helper function to search categories in the tree
 */
const searchCategories = (
  tree: CategoryTreeNode[],
  searchTerm: string
): CategoryTreeNode[] => {
  if (!searchTerm.trim()) {
    return [];
  }

  const results: CategoryTreeNode[] = [];
  const term = searchTerm.toLowerCase();

  const searchRecursive = (nodes: CategoryTreeNode[]) => {
    nodes.forEach((node) => {
      if (
        node.name.toLowerCase().includes(term) ||
        node.description?.toLowerCase().includes(term) ||
        node.slug.toLowerCase().includes(term)
      ) {
        results.push(node);
      }

      if (node.children.length > 0) {
        searchRecursive(node.children);
      }
    });
  };

  searchRecursive(tree);
  return results;
};

/**
 * Hook to get categories by level with offline support
 */
export const useCategoriesByLevel = (level: number) => {
  const { data: tree, ...rest } = useOfflineCategories();

  const categoriesAtLevel = tree ? getCategoriesAtLevel(tree, level) : [];

  return {
    ...rest,
    data: categoriesAtLevel,
    tree,
  };
};

/**
 * Helper function to get categories at a specific level
 */
const getCategoriesAtLevel = (
  tree: CategoryTreeNode[],
  targetLevel: number
): CategoryTreeNode[] => {
  const result: CategoryTreeNode[] = [];

  const traverse = (nodes: CategoryTreeNode[], currentLevel: number) => {
    nodes.forEach((node) => {
      if (currentLevel === targetLevel) {
        result.push(node);
      } else if (currentLevel < targetLevel) {
        traverse(node.children, currentLevel + 1);
      }
    });
  };

  traverse(tree, 0);
  return result;
};
