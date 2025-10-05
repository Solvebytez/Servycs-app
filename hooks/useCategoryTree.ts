import { useQuery } from "@tanstack/react-query";
import { categoryService, Category } from "../services/category";
import {
  buildCategoryTree,
  CategoryTreeNode,
  findCategoryInTree,
  getLeafCategories,
  getCategoriesAtLevel,
  validateCategoryTree,
} from "../utils/categoryTreeUtils";
import {
  CategoryStorage,
  OfflineDataManager,
} from "../utils/asyncStorageUtils";
import { categoryQueryConfig } from "../utils/queryPersistence";

/**
 * Hook to get the complete category tree structure with offline support
 * Uses TanStack Query's select function to transform flat data into tree structure
 * Includes AsyncStorage persistence for offline browsing
 */
export const useCategoryTree = () => {
  return useQuery({
    queryKey: ["categories", "tree"],
    queryFn: async () => {
      // Use offline-first strategy
      const result = await OfflineDataManager.getDataWithOfflineFirst(
        "categories_flat",
        categoryService.getAllCategoriesFlat,
        categoryQueryConfig.staleTime
      );

      if (result.data) {
        // Store the tree structure for offline use
        const tree = buildCategoryTree(result.data);
        await CategoryStorage.storeCategoryTree(tree);
        return result.data;
      }

      throw new Error("Failed to fetch category data");
    },
    select: (data: Category[]) => {
      // Transform flat data into tree structure
      const tree = buildCategoryTree(data);

      // Validate the tree structure (in development)
      if (__DEV__) {
        const validation = validateCategoryTree(tree);
        if (!validation.isValid) {
          console.error("Category tree validation failed:", validation.errors);
        }
        if (validation.warnings.length > 0) {
          console.warn(
            "Category tree validation warnings:",
            validation.warnings
          );
        }
      }

      return tree;
    },
    ...categoryQueryConfig,
  });
};

/**
 * Hook to find a specific category in the tree
 */
export const useCategoryInTree = (categoryId: string | null) => {
  const { data: tree, ...rest } = useCategoryTree();

  const category =
    categoryId && tree ? findCategoryInTree(tree, categoryId) : null;

  return {
    ...rest,
    data: category,
    tree,
  };
};

/**
 * Hook to get all leaf categories (categories with no children)
 */
export const useLeafCategories = () => {
  const { data: tree, ...rest } = useCategoryTree();

  const leafCategories = tree ? getLeafCategories(tree) : [];

  return {
    ...rest,
    data: leafCategories,
    tree,
  };
};

/**
 * Hook to get categories at a specific level
 */
export const useCategoriesAtLevel = (level: number) => {
  const { data: tree, ...rest } = useCategoryTree();

  const categoriesAtLevel = tree ? getCategoriesAtLevel(tree, level) : [];

  return {
    ...rest,
    data: categoriesAtLevel,
    tree,
  };
};

/**
 * Hook to get primary categories (level 0) - alternative to usePrimaryCategories
 */
export const usePrimaryCategoriesFromTree = () => {
  return useCategoriesAtLevel(0);
};

/**
 * Hook to get subcategories of a specific category
 */
export const useCategorySubcategories = (categoryId: string | null) => {
  const { data: category, ...rest } = useCategoryInTree(categoryId);

  const subcategories = category?.children || [];

  return {
    ...rest,
    data: subcategories,
    parentCategory: category,
  };
};

/**
 * Hook to get the full path of a category
 */
export const useCategoryPath = (categoryId: string | null) => {
  const { data: category, ...rest } = useCategoryInTree(categoryId);

  const path = category ? [...category.path, category.name] : [];
  const pathString = category ? path.join(" > ") : "";

  return {
    ...rest,
    data: {
      path,
      pathString,
      category,
    },
  };
};
