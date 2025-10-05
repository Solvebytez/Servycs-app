import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS } from "../../constants";
import {
  usePrimaryCategories,
  useCategoryHasChildren,
} from "../../hooks/useCategories";
import { Category, categoryService } from "../../services/category";

interface CategorySelectorProps {
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null, categoryPath: string[]) => void;
  error?: string;
}

interface CategoryLevel {
  categories: Category[];
  selectedId: string | null;
  isLoading: boolean;
  hasChildren: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  error,
}) => {
  const [categoryLevels, setCategoryLevels] = useState<CategoryLevel[]>([]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  // Get primary categories
  const {
    data: primaryCategories,
    isLoading: isLoadingPrimary,
    error: primaryError,
  } = usePrimaryCategories();

  // Initialize with primary categories
  useEffect(() => {
    if (primaryCategories && primaryCategories.length > 0) {
      setCategoryLevels([
        {
          categories: primaryCategories,
          selectedId: null,
          isLoading: false,
          hasChildren: false,
        },
      ]);
    }
  }, [primaryCategories]);

  // Handle category selection at any level
  const handleCategorySelect = async (
    levelIndex: number,
    categoryId: string
  ) => {
    const category = categoryLevels[levelIndex].categories.find(
      (c) => c.id === categoryId
    );
    if (!category) return;

    // Update the selected category for this level
    const newLevels = [...categoryLevels];
    newLevels[levelIndex].selectedId = categoryId;

    // Remove all levels after this one
    newLevels.splice(levelIndex + 1);

    // Update path
    const newPath = newLevels
      .slice(0, levelIndex + 1)
      .map((level) => {
        const cat = level.categories.find((c) => c.id === level.selectedId);
        return cat?.name || "";
      })
      .filter(Boolean);

    setSelectedPath(newPath);
    setCategoryLevels(newLevels);

    // Check if this category has children
    const { data: hasChildren } = useCategoryHasChildren(categoryId);

    if (hasChildren) {
      // Add loading state for next level
      newLevels.push({
        categories: [],
        selectedId: null,
        isLoading: true,
        hasChildren: false,
      });
      setCategoryLevels([...newLevels]);

      // Load children
      try {
        const children = await categoryService.getCategoryChildren(categoryId);

        // Update the loading level with actual data
        const updatedLevels = [...newLevels];
        updatedLevels[updatedLevels.length - 1] = {
          categories: children,
          selectedId: null,
          isLoading: false,
          hasChildren: children.length > 0,
        };

        setCategoryLevels(updatedLevels);
      } catch (error) {
        console.error("Error loading category children:", error);
        Alert.alert("Error", "Failed to load subcategories");

        // Remove the loading level
        const updatedLevels = newLevels.slice(0, -1);
        setCategoryLevels(updatedLevels);
      }
    } else {
      // This is a final category, notify parent
      onCategorySelect(categoryId, newPath);
    }
  };

  // Handle "Select Category" option
  const handleSelectCategory = (levelIndex: number) => {
    const newLevels = [...categoryLevels];
    newLevels[levelIndex].selectedId = null;

    // Remove all levels after this one
    newLevels.splice(levelIndex + 1);

    // Update path
    const newPath = newLevels
      .slice(0, levelIndex)
      .map((level) => {
        const cat = level.categories.find((c) => c.id === level.selectedId);
        return cat?.name || "";
      })
      .filter(Boolean);

    setSelectedPath(newPath);
    setCategoryLevels(newLevels);

    // If this is the first level, clear selection
    if (levelIndex === 0) {
      onCategorySelect(null, []);
    }
  };

  if (isLoadingPrimary) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={COLORS.primary[500] as any} />
        <ResponsiveText
          variant="body1"
          color={COLORS.text.secondary}
          style={styles.loadingText}
        >
          Loading categories...
        </ResponsiveText>
      </View>
    );
  }

  if (primaryError) {
    return (
      <View style={styles.errorContainer}>
        <ResponsiveText
          variant="body1"
          color={COLORS.error[500] as any}
          style={styles.errorText}
        >
          Failed to load categories. Please try again.
        </ResponsiveText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ResponsiveText
        variant="inputLabel"
        weight="medium"
        color={COLORS.text.primary}
        style={styles.label}
      >
        Category *
      </ResponsiveText>

      {categoryLevels.map((level, levelIndex) => (
        <View key={levelIndex} style={styles.pickerContainer}>
          <ResponsiveText
            variant="body1"
            color={COLORS.text.secondary}
            style={styles.levelLabel}
          >
            {levelIndex === 0 ? "Main Category" : `Subcategory ${levelIndex}`}
          </ResponsiveText>

          <View style={[styles.pickerWrapper, error && styles.pickerError]}>
            {level.isLoading ? (
              <View style={styles.loadingPicker}>
                <ActivityIndicator
                  size="small"
                  color={COLORS.primary[500] as any}
                />
                <ResponsiveText
                  variant="body1"
                  color={COLORS.text.secondary}
                  style={styles.loadingText}
                >
                  Loading...
                </ResponsiveText>
              </View>
            ) : (
              <Picker
                selectedValue={level.selectedId}
                onValueChange={(value) => {
                  if (value === "select") {
                    handleSelectCategory(levelIndex);
                  } else if (value) {
                    handleCategorySelect(levelIndex, value);
                  }
                }}
                style={styles.picker}
                dropdownIconColor={COLORS.primary[500] as any}
              >
                <Picker.Item
                  label={`Select ${
                    levelIndex === 0 ? "Category" : "Subcategory"
                  }`}
                  value="select"
                  color={COLORS.text.secondary}
                />
                {level.categories.map((category) => (
                  <Picker.Item
                    key={category.id}
                    label={category.name}
                    value={category.id}
                    color={COLORS.text.primary}
                  />
                ))}
              </Picker>
            )}
          </View>
        </View>
      ))}

      {selectedPath.length > 0 && (
        <View style={styles.pathContainer}>
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            style={styles.pathLabel}
          >
            Selected: {selectedPath.join(" > ")}
          </ResponsiveText>
        </View>
      )}

      {error && (
        <ResponsiveText
          variant="caption1"
          color={COLORS.error[500] as any}
          style={styles.errorText}
        >
          {error}
        </ResponsiveText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  pickerContainer: {
    marginBottom: 12,
  },
  levelLabel: {
    marginBottom: 4,
    fontSize: 12,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: COLORS.border.light,
    borderRadius: 8,
    backgroundColor: COLORS.background.light,
  },
  pickerError: {
    borderColor: COLORS.error[500] as any,
  },
  picker: {
    height: 50,
  },
  loadingPicker: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 8,
  },
  errorContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  errorText: {
    marginTop: 4,
  },
  pathContainer: {
    marginTop: 8,
    padding: 8,
    backgroundColor: COLORS.background.secondary,
    borderRadius: 6,
  },
  pathLabel: {
    fontStyle: "italic",
  },
});

export default CategorySelector;
