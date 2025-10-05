import { Category } from "../services/category";

/**
 * Category tree node interface for the nested structure
 */
export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[];
  level: number; // Depth level in the tree (0 for root, 1 for first level, etc.)
  path: string[]; // Full path from root to this node
}

/**
 * Transforms a flat list of categories into a nested tree structure
 *
 * @param categories - Flat array of categories from the API
 * @returns Nested tree structure with children arrays
 *
 * Time Complexity: O(n) - Single pass through categories
 * Space Complexity: O(n) - Creates new tree structure
 */
export const buildCategoryTree = (
  categories: Category[]
): CategoryTreeNode[] => {
  // Create a map for O(1) lookups
  const categoryMap = new Map<string, CategoryTreeNode>();

  // First pass: Create all nodes with empty children arrays
  categories.forEach((category) => {
    categoryMap.set(category.id, {
      ...category,
      children: [],
      level: 0, // Will be calculated in second pass
      path: [], // Will be calculated in second pass
    });
  });

  // Second pass: Build parent-child relationships and calculate levels/paths
  const rootNodes: CategoryTreeNode[] = [];

  categories.forEach((category) => {
    const node = categoryMap.get(category.id)!;

    if (category.parentId) {
      // Has a parent - add to parent's children
      const parent = categoryMap.get(category.parentId);
      if (parent) {
        parent.children.push(node);
        node.level = parent.level + 1;
        node.path = [...parent.path, parent.name];
      } else {
        // Parent not found - treat as root (data inconsistency)
        console.warn(
          `Parent category ${category.parentId} not found for category ${category.id}`
        );
        rootNodes.push(node);
        node.level = 0;
        node.path = [];
      }
    } else {
      // No parent - this is a root node
      rootNodes.push(node);
      node.level = 0;
      node.path = [];
    }
  });

  // Sort children at each level
  const sortChildren = (nodes: CategoryTreeNode[]): void => {
    nodes.sort((a, b) => {
      // First by sortOrder, then by name
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return a.name.localeCompare(b.name);
    });

    // Recursively sort children
    nodes.forEach((node) => {
      if (node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(rootNodes);
  return rootNodes;
};

/**
 * Finds a category node by ID in the tree structure
 *
 * @param tree - The category tree
 * @param categoryId - ID to search for
 * @returns The category node if found, null otherwise
 */
export const findCategoryInTree = (
  tree: CategoryTreeNode[],
  categoryId: string
): CategoryTreeNode | null => {
  for (const node of tree) {
    if (node.id === categoryId) {
      return node;
    }

    // Search in children recursively
    const found = findCategoryInTree(node.children, categoryId);
    if (found) {
      return found;
    }
  }

  return null;
};

/**
 * Gets all leaf nodes (categories with no children) from the tree
 *
 * @param tree - The category tree
 * @returns Array of leaf category nodes
 */
export const getLeafCategories = (
  tree: CategoryTreeNode[]
): CategoryTreeNode[] => {
  const leaves: CategoryTreeNode[] = [];

  const traverse = (nodes: CategoryTreeNode[]): void => {
    nodes.forEach((node) => {
      if (node.children.length === 0) {
        leaves.push(node);
      } else {
        traverse(node.children);
      }
    });
  };

  traverse(tree);
  return leaves;
};

/**
 * Gets the full path string for a category (e.g., "Health Care > Doctors > General Physician")
 *
 * @param node - The category node
 * @returns Full path string
 */
export const getCategoryPathString = (node: CategoryTreeNode): string => {
  return [...node.path, node.name].join(" > ");
};

/**
 * Gets all categories at a specific level in the tree
 *
 * @param tree - The category tree
 * @param level - The level to extract (0 for root, 1 for first level, etc.)
 * @returns Array of category nodes at the specified level
 */
export const getCategoriesAtLevel = (
  tree: CategoryTreeNode[],
  level: number
): CategoryTreeNode[] => {
  const result: CategoryTreeNode[] = [];

  const traverse = (nodes: CategoryTreeNode[], currentLevel: number): void => {
    nodes.forEach((node) => {
      if (currentLevel === level) {
        result.push(node);
      } else if (currentLevel < level) {
        traverse(node.children, currentLevel + 1);
      }
    });
  };

  traverse(tree, 0);
  return result;
};

/**
 * Validates that the tree structure is correct (no circular references, etc.)
 *
 * @param tree - The category tree to validate
 * @returns Object with validation results
 */
export const validateCategoryTree = (
  tree: CategoryTreeNode[]
): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const visitedIds = new Set<string>();

  const traverse = (nodes: CategoryTreeNode[], path: string[] = []): void => {
    nodes.forEach((node) => {
      // Check for circular references
      if (visitedIds.has(node.id)) {
        errors.push(
          `Circular reference detected: ${path.join(" > ")} > ${node.name}`
        );
        return;
      }

      visitedIds.add(node.id);

      // Check level consistency
      const expectedLevel = path.length;
      if (node.level !== expectedLevel) {
        warnings.push(
          `Level mismatch for ${node.name}: expected ${expectedLevel}, got ${node.level}`
        );
      }

      // Check path consistency
      const expectedPath = [...path];
      if (JSON.stringify(node.path) !== JSON.stringify(expectedPath)) {
        warnings.push(
          `Path mismatch for ${node.name}: expected ${expectedPath.join(
            " > "
          )}, got ${node.path.join(" > ")}`
        );
      }

      // Recursively check children
      traverse(node.children, [...path, node.name]);

      visitedIds.delete(node.id);
    });
  };

  traverse(tree);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Flattens a tree structure back to a flat array (useful for debugging)
 *
 * @param tree - The category tree
 * @returns Flat array of all category nodes
 */
export const flattenCategoryTree = (
  tree: CategoryTreeNode[]
): CategoryTreeNode[] => {
  const result: CategoryTreeNode[] = [];

  const traverse = (nodes: CategoryTreeNode[]): void => {
    nodes.forEach((node) => {
      result.push(node);
      traverse(node.children);
    });
  };

  traverse(tree);
  return result;
};
