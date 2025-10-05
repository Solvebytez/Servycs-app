import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS } from "../../constants";
import {
  useOfflineCategories,
  useCategorySearch,
} from "../../hooks/useOfflineCategories";
import { CategoryTreeNode } from "../../utils/categoryTreeUtils";

interface ModernCategorySelectorProps {
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null, categoryPath: string[]) => void;
  error?: string;
  placeholder?: string;
  showSearch?: boolean;
  maxHeight?: number;
}

interface CategoryItemProps {
  node: CategoryTreeNode;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  onSelect: () => void;
  onToggle: () => void;
  maxLevel?: number;
}

const CategoryItem: React.FC<CategoryItemProps> = ({
  node,
  level,
  isSelected,
  isExpanded,
  onSelect,
  onToggle,
  maxLevel = 3, // Limit display depth for better UX
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const canExpand = hasChildren && level < maxLevel;
  const indent = level * 20;

  return (
    <View style={styles.categoryItem}>
      <TouchableOpacity
        style={[
          styles.categoryButton,
          { paddingLeft: 16 + indent },
          isSelected && styles.selectedCategory,
        ]}
        onPress={onSelect}
        activeOpacity={0.7}
      >
        <View style={styles.categoryContent}>
          {canExpand && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={onToggle}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ResponsiveText variant="body1" style={styles.expandIcon}>
                {isExpanded ? "▼" : "▶"}
              </ResponsiveText>
            </TouchableOpacity>
          )}

          <View style={styles.categoryInfo}>
            <ResponsiveText
              variant="body1"
              style={[
                styles.categoryName,
                isSelected && styles.selectedCategoryName,
                level === 0 && styles.primaryCategoryName,
              ]}
            >
              {node.name}
            </ResponsiveText>

            {node.description && (
              <ResponsiveText
                variant="caption1"
                style={styles.categoryDescription}
              >
                {node.description}
              </ResponsiveText>
            )}

            {node._count && node._count.children > 0 && (
              <ResponsiveText variant="caption1" style={styles.childCount}>
                {node._count.children} subcategories
              </ResponsiveText>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export const ModernCategorySelector: React.FC<ModernCategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  error,
  placeholder = "Select a category...",
  showSearch = true,
  maxHeight = 400,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Use offline categories hook
  const {
    data: categoryTree,
    isLoading,
    error: treeError,
  } = useOfflineCategories();

  // Use search hook if search is enabled
  const { data: searchResults } = useCategorySearch(searchTerm);

  // Find the selected category and build its path
  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId || !categoryTree) return null;

    const findCategory = (
      nodes: CategoryTreeNode[],
      targetId: string
    ): CategoryTreeNode | null => {
      for (const node of nodes) {
        if (node.id === targetId) return node;
        if (node.children.length > 0) {
          const found = findCategory(node.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    return findCategory(categoryTree, selectedCategoryId);
  }, [selectedCategoryId, categoryTree]);

  // Build path for selected category
  const buildCategoryPath = (
    node: CategoryTreeNode,
    tree: CategoryTreeNode[]
  ): string[] => {
    const path: string[] = [];

    const findPath = (
      nodes: CategoryTreeNode[],
      targetId: string,
      currentPath: string[]
    ): boolean => {
      for (const n of nodes) {
        const newPath = [...currentPath, n.name];
        if (n.id === targetId) {
          path.push(...newPath);
          return true;
        }
        if (n.children.length > 0 && findPath(n.children, targetId, newPath)) {
          return true;
        }
      }
      return false;
    };

    findPath(tree, node.id, []);
    return path;
  };

  // Handle category selection
  const handleCategorySelect = (node: CategoryTreeNode) => {
    const path = buildCategoryPath(node, categoryTree || []);
    setSelectedPath(path);
    onCategorySelect(node.id, path);
  };

  // Handle expand/collapse
  const handleToggleExpand = (nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Render category tree recursively
  const renderCategoryTree = (
    nodes: CategoryTreeNode[],
    level: number = 0
  ): React.ReactNode[] => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedCategoryId;
      const isExpanded = expandedNodes.has(node.id);
      const hasChildren = node.children && node.children.length > 0;

      return (
        <View key={node.id}>
          <CategoryItem
            node={node}
            level={level}
            isSelected={isSelected}
            isExpanded={isExpanded}
            onSelect={() => handleCategorySelect(node)}
            onToggle={() => handleToggleExpand(node.id)}
          />

          {hasChildren && isExpanded && (
            <View style={styles.childrenContainer}>
              {renderCategoryTree(node.children, level + 1)}
            </View>
          )}
        </View>
      );
    });
  };

  // Render search results
  const renderSearchResults = () => {
    if (!searchResults || searchResults.length === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <ResponsiveText variant="body1" style={styles.noResultsText}>
            No categories found for "{searchTerm}"
          </ResponsiveText>
        </View>
      );
    }

    return searchResults.map((node) => (
      <CategoryItem
        key={node.id}
        node={node}
        level={0}
        isSelected={node.id === selectedCategoryId}
        isExpanded={false}
        onSelect={() => handleCategorySelect(node)}
        onToggle={() => {}}
        maxLevel={1} // Limit search results depth
      />
    ));
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary[500]} />
          <ResponsiveText variant="body1" style={styles.loadingText}>
            Loading categories...
          </ResponsiveText>
        </View>
      </View>
    );
  }

  // Error state
  if (treeError) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <ResponsiveText variant="body1" style={styles.errorText}>
            Failed to load categories: {treeError.message}
          </ResponsiveText>
        </View>
      </View>
    );
  }

  // No data state
  if (!categoryTree || categoryTree.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.noDataContainer}>
          <ResponsiveText variant="body1" style={styles.noDataText}>
            No categories available
          </ResponsiveText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Selected Category Display */}
      {selectedCategory && (
        <View style={styles.selectedContainer}>
          <ResponsiveText variant="body2" style={styles.selectedLabel}>
            Selected:
          </ResponsiveText>
          <ResponsiveText variant="body1" style={styles.selectedPath}>
            {selectedPath.join(" > ")}
          </ResponsiveText>
        </View>
      )}

      {/* Search Input */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor={COLORS.neutral[500]}
          />
        </View>
      )}

      {/* Error Display */}
      {error && (
        <View style={styles.errorMessageContainer}>
          <ResponsiveText variant="caption1" style={styles.errorMessage}>
            {error}
          </ResponsiveText>
        </View>
      )}

      {/* Category Tree */}
      <ScrollView
        style={[styles.treeContainer, { maxHeight }]}
        showsVerticalScrollIndicator={true}
        nestedScrollEnabled={true}
      >
        {searchTerm.trim()
          ? renderSearchResults()
          : renderCategoryTree(categoryTree)}
      </ScrollView>

      {/* Clear Selection Button */}
      {selectedCategoryId && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setSelectedPath([]);
            onCategorySelect(null, []);
          }}
        >
          <ResponsiveText variant="body2" style={styles.clearButtonText}>
            Clear Selection
          </ResponsiveText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.neutral[200],
  },
  selectedContainer: {
    padding: 12,
    backgroundColor: COLORS.primary[50],
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  selectedLabel: {
    color: COLORS.neutral[600],
    marginBottom: 4,
  },
  selectedPath: {
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  searchContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: COLORS.neutral[800],
    backgroundColor: COLORS.white,
  },
  errorMessageContainer: {
    padding: 12,
    backgroundColor: COLORS.error[50],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  errorMessage: {
    color: COLORS.error[600],
  },
  treeContainer: {
    maxHeight: 400,
  },
  categoryItem: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
  },
  categoryButton: {
    paddingVertical: 12,
    paddingRight: 16,
    backgroundColor: COLORS.white,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary[50],
  },
  categoryContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandButton: {
    marginRight: 8,
    padding: 4,
  },
  expandIcon: {
    color: COLORS.neutral[600],
    fontSize: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    color: COLORS.neutral[800],
    fontWeight: "500",
  },
  selectedCategoryName: {
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  primaryCategoryName: {
    fontWeight: "600",
    color: COLORS.primary[600],
  },
  categoryDescription: {
    color: COLORS.neutral[600],
    marginTop: 2,
  },
  childCount: {
    color: COLORS.neutral[500],
    marginTop: 2,
  },
  childrenContainer: {
    backgroundColor: COLORS.neutral[50],
  },
  noResultsContainer: {
    padding: 20,
    alignItems: "center",
  },
  noResultsText: {
    color: COLORS.neutral[600],
    textAlign: "center",
  },
  loadingContainer: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginLeft: 8,
    color: COLORS.neutral[600],
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorText: {
    color: COLORS.error[600],
    textAlign: "center",
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
  },
  noDataText: {
    color: COLORS.neutral[600],
    textAlign: "center",
  },
  clearButton: {
    padding: 12,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    backgroundColor: COLORS.neutral[50],
  },
  clearButtonText: {
    color: COLORS.error[600],
    fontWeight: "500",
  },
});

export default ModernCategorySelector;
