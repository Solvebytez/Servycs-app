import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS } from "../../constants";
import { useOfflineCategories } from "../../hooks/useOfflineCategories";
import { CategoryTreeNode } from "../../utils/categoryTreeUtils";

interface CascadingCategorySelectorProps {
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null, categoryPath: string[]) => void;
  error?: string;
  maxLevels?: number;
}

interface CategoryLevel {
  categories: CategoryTreeNode[];
  selectedId: string | null;
  isLoading: boolean;
}

export const CascadingCategorySelector: React.FC<
  CascadingCategorySelectorProps
> = ({ selectedCategoryId, onCategorySelect, error, maxLevels = 4 }) => {
  const [categoryLevels, setCategoryLevels] = useState<CategoryLevel[]>([]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Get category tree data
  const {
    data: categoryTree,
    isLoading,
    error: treeError,
  } = useOfflineCategories();

  // Initialize with root categories
  useEffect(() => {
    if (categoryTree && categoryTree.length > 0) {
      setCategoryLevels([
        {
          categories: categoryTree,
          selectedId: null,
          isLoading: false,
        },
      ]);
    }
  }, [categoryTree]);

  // Handle category selection at any level
  const handleCategorySelect = (category: CategoryTreeNode, level: number) => {
    const newLevels = [...categoryLevels];

    // Update the selected category at this level
    newLevels[level] = {
      ...newLevels[level],
      selectedId: category.id,
    };

    // Remove all levels after this one
    newLevels.splice(level + 1);

    // If this category has children, add a new level
    if (
      category.children &&
      category.children.length > 0 &&
      level < maxLevels - 1
    ) {
      newLevels.push({
        categories: category.children,
        selectedId: null,
        isLoading: false,
      });
    }

    setCategoryLevels(newLevels);

    // Build the category path
    const path: string[] = [];
    for (let i = 0; i <= level; i++) {
      const selectedCategory = newLevels[i].categories.find(
        (cat) => cat.id === newLevels[i].selectedId
      );
      if (selectedCategory) {
        path.push(selectedCategory.name);
      }
    }

    setSelectedPath(path);
    onCategorySelect(category.id, path);
  };

  // Handle "None" selection (clear selection)
  const handleNoneSelect = (level: number) => {
    const newLevels = [...categoryLevels];

    // Clear selection at this level
    newLevels[level] = {
      ...newLevels[level],
      selectedId: null,
    };

    // Remove all levels after this one
    newLevels.splice(level + 1);

    setCategoryLevels(newLevels);

    // Build the category path
    const path: string[] = [];
    for (let i = 0; i < level; i++) {
      const selectedCategory = newLevels[i].categories.find(
        (cat) => cat.id === newLevels[i].selectedId
      );
      if (selectedCategory) {
        path.push(selectedCategory.name);
      }
    }

    setSelectedPath(path);

    // If this is the first level, clear everything
    if (level === 0) {
      onCategorySelect(null, []);
    } else {
      // Find the parent category ID
      const parentCategory = newLevels[level - 1].categories.find(
        (cat) => cat.id === newLevels[level - 1].selectedId
      );
      onCategorySelect(parentCategory?.id || null, path);
    }
  };

  // Render category level
  const renderCategoryLevel = (level: number) => {
    const categoryLevel = categoryLevels[level];
    if (!categoryLevel) return null;

    const levelName = level === 0 ? "Main Category" : `Subcategory ${level}`;

    return (
      <View key={level} style={styles.levelContainer}>
        <ResponsiveText variant="body2" style={styles.levelLabel}>
          {levelName}:
        </ResponsiveText>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScrollView}
        >
          <View style={styles.categoryContainer}>
            {/* None option */}
            <TouchableOpacity
              style={[
                styles.categoryButton,
                categoryLevel.selectedId === null && styles.selectedCategory,
              ]}
              onPress={() => handleNoneSelect(level)}
            >
              <ResponsiveText
                variant="body2"
                style={[
                  styles.categoryText,
                  categoryLevel.selectedId === null &&
                    styles.selectedCategoryText,
                ]}
              >
                None
              </ResponsiveText>
            </TouchableOpacity>

            {/* Category options */}
            {categoryLevel.categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  categoryLevel.selectedId === category.id &&
                    styles.selectedCategory,
                ]}
                onPress={() => handleCategorySelect(category, level)}
              >
                <ResponsiveText
                  variant="body2"
                  style={[
                    styles.categoryText,
                    categoryLevel.selectedId === category.id &&
                      styles.selectedCategoryText,
                  ]}
                >
                  {category.name}
                </ResponsiveText>
                {category.children && category.children.length > 0 && (
                  <ResponsiveText variant="caption1" style={styles.childCount}>
                    ({category.children.length})
                  </ResponsiveText>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
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
      {/* Selected Path Display */}
      {selectedPath.length > 0 && (
        <View style={styles.selectedPathContainer}>
          <ResponsiveText variant="body2" style={styles.selectedPathLabel}>
            Selected: {selectedPath.join(" > ")}
          </ResponsiveText>
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

      {/* Category Levels */}
      <ScrollView
        style={styles.levelsContainer}
        showsVerticalScrollIndicator={false}
      >
        {categoryLevels.map((_, index) => renderCategoryLevel(index))}
      </ScrollView>

      {/* Clear All Button */}
      {selectedCategoryId && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={() => {
            setCategoryLevels([
              {
                categories: categoryTree,
                selectedId: null,
                isLoading: false,
              },
            ]);
            setSelectedPath([]);
            onCategorySelect(null, []);
          }}
        >
          <ResponsiveText variant="body2" style={styles.clearButtonText}>
            Clear All Selections
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
  selectedPathContainer: {
    padding: 12,
    backgroundColor: COLORS.primary[50],
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  selectedPathLabel: {
    color: COLORS.primary[600],
    fontWeight: "600",
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
  levelsContainer: {
    maxHeight: 300,
  },
  levelContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
  },
  levelLabel: {
    color: COLORS.neutral[700],
    fontWeight: "600",
    marginBottom: 8,
  },
  categoryScrollView: {
    flexGrow: 0,
  },
  categoryContainer: {
    flexDirection: "row",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
    backgroundColor: COLORS.white,
    alignItems: "center",
    minWidth: 80,
  },
  selectedCategory: {
    backgroundColor: COLORS.primary[500],
    borderColor: COLORS.primary[500],
  },
  categoryText: {
    color: COLORS.neutral[700],
    fontWeight: "500",
    textAlign: "center",
  },
  selectedCategoryText: {
    color: COLORS.white,
    fontWeight: "600",
  },
  childCount: {
    color: COLORS.neutral[500],
    fontSize: 10,
    marginTop: 2,
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

export default CascadingCategorySelector;
