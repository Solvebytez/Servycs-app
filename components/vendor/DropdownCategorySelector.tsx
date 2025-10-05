import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS } from "../../constants";
import { useOfflineCategories } from "../../hooks/useOfflineCategories";
import { useFreshCategories } from "../../hooks/useFreshCategories";
import { CategoryTreeNode } from "../../utils/categoryTreeUtils";

interface DropdownCategorySelectorProps {
  selectedCategoryId: string | null;
  onCategorySelect: (categoryId: string | null, categoryPath: string[]) => void;
  error?: string;
  maxLevels?: number;
  useFreshData?: boolean; // If true, always fetch fresh categories from server
  autoClose?: boolean; // If true, closes after each selection (default: true)
}

interface CategoryLevel {
  categories: CategoryTreeNode[];
  selectedId: string | null;
  selectedName: string | null;
}

interface DropdownModalProps {
  visible: boolean;
  onClose: () => void;
  categories: CategoryTreeNode[];
  selectedId: string | null;
  onSelect: (category: CategoryTreeNode) => void;
  title: string;
}

const DropdownModal: React.FC<DropdownModalProps> = ({
  visible,
  onClose,
  categories,
  selectedId,
  onSelect,
  title,
}) => {
  const renderCategoryItem = ({ item }: { item: CategoryTreeNode }) => (
    <TouchableOpacity
      style={[
        styles.modalItem,
        selectedId === item.id && styles.selectedModalItem,
      ]}
      onPress={() => {
        console.log("=== MODAL ITEM PRESSED ===");
        console.log("Item:", item.name);
        console.log("Item children:", item.children?.length || 0);
        console.log("Calling onSelect...");
        onSelect(item);
        console.log("Calling onClose...");
        onClose();
        console.log("========================");
      }}
    >
      <ResponsiveText
        variant="body1"
        style={[
          styles.modalItemText,
          selectedId === item.id && styles.selectedModalItemText,
        ]}
      >
        {item.name}
      </ResponsiveText>
      {item.children && item.children.length > 0 && (
        <ResponsiveText variant="caption1" style={styles.modalItemCount}>
          {item.children.length} subcategories
        </ResponsiveText>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <ResponsiveText variant="h6" style={styles.modalTitle}>
              {title}
            </ResponsiveText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ResponsiveText variant="h6" style={styles.closeButtonText}>
                ×
              </ResponsiveText>
            </TouchableOpacity>
          </View>

          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            style={styles.modalList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export const DropdownCategorySelector: React.FC<
  DropdownCategorySelectorProps
> = ({
  selectedCategoryId,
  onCategorySelect,
  error,
  maxLevels = 4,
  useFreshData = false,
  autoClose = true,
}) => {
  const [categoryLevels, setCategoryLevels] = useState<CategoryLevel[]>([]);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [activeModal, setActiveModal] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(true); // Start in editing mode by default

  // Get category tree data - use fresh data if requested, otherwise use cached
  const {
    data: categoryTree,
    isLoading,
    error: treeError,
    refetch: refetchCategories,
  } = useFreshData ? useFreshCategories() : useOfflineCategories();

  // Initialize with root categories
  useEffect(() => {
    if (categoryTree && categoryTree.length > 0) {
      setCategoryLevels([
        {
          categories: categoryTree,
          selectedId: null,
          selectedName: null,
        },
      ]);
    }
  }, [categoryTree]);

  // Pre-populate category levels if selectedCategoryId is provided
  useEffect(() => {
    if (selectedCategoryId && categoryTree && categoryTree.length > 0) {
      console.log("=== PRE-POPULATING CATEGORY SELECTOR ===");
      console.log("Selected Category ID:", selectedCategoryId);
      console.log("This is being called from useEffect - pre-population");

      // Find the selected category in the tree
      const findCategoryInTree = (
        categories: CategoryTreeNode[],
        targetId: string
      ): CategoryTreeNode | null => {
        for (const category of categories) {
          if (category.id === targetId) {
            return category;
          }
          if (category.children && category.children.length > 0) {
            const found = findCategoryInTree(category.children, targetId);
            if (found) return found;
          }
        }
        return null;
      };

      const selectedCategory = findCategoryInTree(
        categoryTree,
        selectedCategoryId
      );
      console.log("Found Selected Category:", selectedCategory);

      if (selectedCategory) {
        // Build the category path by traversing up the tree
        const buildCategoryPath = (
          categories: CategoryTreeNode[],
          targetId: string,
          path: CategoryTreeNode[] = []
        ): CategoryTreeNode[] => {
          for (const category of categories) {
            const currentPath = [...path, category];
            if (category.id === targetId) {
              return currentPath;
            }
            if (category.children && category.children.length > 0) {
              const found = buildCategoryPath(
                category.children,
                targetId,
                currentPath
              );
              if (found.length > 0) return found;
            }
          }
          return [];
        };

        const categoryPath = buildCategoryPath(
          categoryTree,
          selectedCategoryId
        );
        console.log("Category Path:", categoryPath);

        // Build category levels from the path
        const newLevels: CategoryLevel[] = [];
        let currentCategories = categoryTree;

        for (let i = 0; i < categoryPath.length; i++) {
          const category = categoryPath[i];
          newLevels.push({
            categories: currentCategories,
            selectedId: category.id,
            selectedName: category.name,
          });

          // Move to next level if category has children
          if (
            category.children &&
            category.children.length > 0 &&
            i < categoryPath.length - 1
          ) {
            currentCategories = category.children;
          }
        }

        // If the last selected category has children, add a subcategory level
        const lastCategory = categoryPath[categoryPath.length - 1];
        if (
          lastCategory &&
          lastCategory.children &&
          lastCategory.children.length > 0 &&
          newLevels.length < maxLevels
        ) {
          console.log(
            "Adding subcategory level for selected category with",
            lastCategory.children.length,
            "children"
          );
          newLevels.push({
            categories: lastCategory.children,
            selectedId: null,
            selectedName: null,
          });
        }

        console.log("Built Category Levels:", newLevels);
        setCategoryLevels(newLevels);
        setSelectedPath(categoryPath.map((cat) => cat.name));
        console.log("Category selector pre-populated successfully");
        console.log("==========================================");
      }
    }
  }, [selectedCategoryId, categoryTree]);

  // Handle category selection at any level
  const handleCategorySelect = (category: CategoryTreeNode, level: number) => {
    console.log("=== CATEGORY SELECTION ===");
    console.log("Selected category:", category.name, "at level:", level);
    console.log("Has children:", category.children?.length || 0);
    console.log("Max levels:", maxLevels);
    console.log("Auto close:", autoClose);

    const newLevels = [...categoryLevels];

    // Update the selected category at this level
    newLevels[level] = {
      ...newLevels[level],
      selectedId: category.id,
      selectedName: category.name,
    };

    // Remove all levels after this one
    newLevels.splice(level + 1);

    // Check if this category has children and we can add more levels
    const hasChildren = category.children && category.children.length > 0;
    const canAddMoreLevels = level < maxLevels - 1;
    const willAddSubcategory = hasChildren && canAddMoreLevels;

    // If this category has children, add a new level immediately
    if (willAddSubcategory) {
      console.log(
        "Adding subcategory level with",
        category.children.length,
        "children"
      );
      newLevels.push({
        categories: category.children,
        selectedId: null,
        selectedName: null,
      });
    }

    // Build the category path
    const path: string[] = [];
    for (let i = 0; i <= level; i++) {
      if (newLevels[i].selectedName) {
        path.push(newLevels[i].selectedName);
      }
    }

    console.log("New levels count:", newLevels.length);
    console.log("Category path:", path);
    console.log("Will add subcategory:", willAddSubcategory);

    // Update all states in a single batch to ensure immediate UI update
    setCategoryLevels(newLevels);
    setSelectedPath(path);
    onCategorySelect(category.id, path);

    // Auto-exit editing mode when a category is selected (if autoClose is enabled)
    // But only if there are no subcategories to show
    if (autoClose && !willAddSubcategory) {
      console.log("Auto-closing editing mode - no subcategories");
      setIsEditing(false);
    } else if (autoClose && willAddSubcategory) {
      console.log("Keeping editing mode open - subcategories available");
    }
    console.log("=========================");
  };

  // Handle "None" selection (clear selection)
  const handleNoneSelect = (level: number) => {
    const newLevels = [...categoryLevels];

    // Clear selection at this level
    newLevels[level] = {
      ...newLevels[level],
      selectedId: null,
      selectedName: null,
    };

    // Remove all levels after this one
    newLevels.splice(level + 1);

    setCategoryLevels(newLevels);

    // Build the category path
    const path: string[] = [];
    for (let i = 0; i < level; i++) {
      if (newLevels[i].selectedName) {
        path.push(newLevels[i].selectedName);
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

  // Render dropdown level
  const renderDropdownLevel = (level: number) => {
    const categoryLevel = categoryLevels[level];
    if (!categoryLevel) return null;

    const levelName = level === 0 ? "Main Category" : `Subcategory ${level}`;
    const displayText = categoryLevel.selectedName || "Select...";

    return (
      <View key={level} style={styles.dropdownContainer}>
        {/* Remove the level name label */}

        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => setActiveModal(level)}
        >
          <ResponsiveText
            variant="body1"
            style={[
              styles.dropdownText,
              !categoryLevel.selectedName && styles.placeholderText,
            ]}
          >
            {displayText}
          </ResponsiveText>
          <ResponsiveText variant="body1" style={styles.dropdownArrow}>
            ▼
          </ResponsiveText>
        </TouchableOpacity>

        {/* Dropdown Modal */}
        <DropdownModal
          visible={activeModal === level}
          onClose={() => setActiveModal(null)}
          categories={categoryLevel.categories}
          selectedId={categoryLevel.selectedId}
          onSelect={(category) => handleCategorySelect(category, level)}
          title={levelName}
        />
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.inputGroup}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={COLORS.primary[500]} />
          <ResponsiveText variant="body1" style={styles.loadingText}>
            {useFreshData
              ? "Fetching latest categories..."
              : "Loading categories..."}
          </ResponsiveText>
        </View>
      </View>
    );
  }

  // Error state
  if (treeError) {
    return (
      <View style={styles.inputGroup}>
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
      <View style={styles.inputGroup}>
        <View style={styles.noDataContainer}>
          <ResponsiveText variant="body1" style={styles.noDataText}>
            No categories available
          </ResponsiveText>
        </View>
      </View>
    );
  }

  // Debug current state
  console.log("=== DROPDOWN CATEGORY SELECTOR RENDER ===");
  console.log("isEditing:", isEditing);
  console.log("categoryLevels.length:", categoryLevels.length);
  console.log("selectedPath:", selectedPath);
  console.log("autoClose:", autoClose);
  console.log("=========================================");

  return (
    <View style={styles.inputGroup}>
      {/* Category Label */}
      <ResponsiveText variant="inputLabel" style={styles.categoryLabel}>
        Category:
      </ResponsiveText>

      {/* Category Breadcrumb Display - Show when not actively selecting */}
      {selectedPath.length > 0 && !isEditing && (
        <View style={styles.breadcrumbContainer}>
          <View style={styles.breadcrumbContent}>
            <ResponsiveText variant="body2" style={styles.breadcrumbText}>
              {selectedPath.join(" > ")}
            </ResponsiveText>
          </View>
          <TouchableOpacity
            style={styles.editIcon}
            onPress={() => setIsEditing(true)}
          >
            <ResponsiveText variant="body2" style={styles.editIconText}>
              Edit
            </ResponsiveText>
          </TouchableOpacity>
        </View>
      )}

      {/* Show breadcrumb while editing if there's a selection */}
      {selectedPath.length > 0 && isEditing && (
        <View style={styles.breadcrumbContainer}>
          <View style={styles.breadcrumbContent}>
            <ResponsiveText variant="body2" style={styles.breadcrumbText}>
              {selectedPath.join(" > ")}
            </ResponsiveText>
          </View>
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

      {/* Dropdown Levels - Only show when editing */}
      {isEditing && (
        <View style={styles.dropdownsContainer}>
          {console.log(
            "Rendering dropdown levels:",
            categoryLevels.length,
            "levels"
          )}
          {categoryLevels.map((level, index) => {
            console.log(
              `Level ${index}:`,
              level.selectedName,
              "has",
              level.categories.length,
              "categories"
            );
            return renderDropdownLevel(index);
          })}
        </View>
      )}

      {/* Action Buttons - Only show Refresh and Clear All */}
      {isEditing && (
        <View style={styles.actionButtonsContainer}>
          {useFreshData && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={() => {
                // Force refresh categories
                refetchCategories();
              }}
            >
              <ResponsiveText variant="body2" style={styles.refreshButtonText}>
                Refresh
              </ResponsiveText>
            </TouchableOpacity>
          )}

          {selectedCategoryId && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setCategoryLevels([
                  {
                    categories: categoryTree,
                    selectedId: null,
                    selectedName: null,
                  },
                ]);
                setSelectedPath([]);
                onCategorySelect(null, []);
              }}
            >
              <ResponsiveText variant="body2" style={styles.clearButtonText}>
                Clear All
              </ResponsiveText>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* No "Select Category" button needed - start in editing mode */}
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    marginBottom: 16,
  },
  categoryLabel: {
    color: COLORS.text.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  breadcrumbContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    backgroundColor: COLORS.primary[50],
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  breadcrumbContent: {
    flex: 1,
    alignItems: "center",
  },
  breadcrumbText: {
    color: COLORS.primary[700],
    fontWeight: "500",
    fontSize: 12,
  },
  editIcon: {
    padding: 2,
    marginLeft: 6,
  },
  editIconText: {
    fontSize: 12,
  },
  selectCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 6,
    backgroundColor: COLORS.background.primary,
  },
  selectCategoryText: {
    color: COLORS.text.secondary,
    fontStyle: "italic",
    fontSize: 12,
  },
  selectCategoryIcon: {
    color: COLORS.text.secondary,
    fontSize: 10,
  },
  selectedPathContainer: {
    padding: 12,
    backgroundColor: COLORS.primary[50],
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  selectedPathLabel: {
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  errorMessageContainer: {
    padding: 12,
    backgroundColor: COLORS.error[50],
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.error[200],
  },
  errorMessage: {
    color: COLORS.error[600],
  },
  dropdownsContainer: {
    // Remove padding to match form styling
  },
  dropdownContainer: {
    marginBottom: 16,
  },
  dropdownLabel: {
    color: COLORS.text.primary,
    fontWeight: "600",
    marginBottom: 8,
    fontSize: 14,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 8,
    backgroundColor: COLORS.background.primary,
  },
  dropdownText: {
    color: COLORS.text.primary,
    fontWeight: "500",
    flex: 1,
    fontSize: 14,
  },
  placeholderText: {
    color: COLORS.text.secondary,
  },
  dropdownArrow: {
    color: COLORS.text.secondary,
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    margin: 20,
    maxHeight: "70%",
    minWidth: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  modalTitle: {
    color: COLORS.neutral[800],
    fontWeight: "600",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.neutral[200],
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    color: COLORS.neutral[600],
    fontSize: 18,
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[100],
  },
  selectedModalItem: {
    backgroundColor: COLORS.primary[50],
  },
  modalItemText: {
    color: COLORS.neutral[800],
    fontWeight: "500",
  },
  selectedModalItemText: {
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  modalItemCount: {
    color: COLORS.neutral[500],
    marginTop: 4,
  },
  loadingContainer: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 8,
    backgroundColor: COLORS.background.primary,
  },
  loadingText: {
    marginLeft: 8,
    color: COLORS.text.secondary,
  },
  errorContainer: {
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.error[300],
    borderRadius: 8,
    backgroundColor: COLORS.error[50],
  },
  errorText: {
    color: COLORS.error[600],
    textAlign: "center",
  },
  noDataContainer: {
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: 8,
    backgroundColor: COLORS.background.primary,
  },
  noDataText: {
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  refreshButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.primary[400],
    borderRadius: 8,
    backgroundColor: COLORS.primary[100],
    minHeight: 40,
  },
  refreshButtonText: {
    color: COLORS.primary[700],
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.neutral[400],
    borderRadius: 8,
    backgroundColor: COLORS.neutral[100],
    minHeight: 40,
  },
  cancelButtonText: {
    color: COLORS.neutral[700],
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  clearButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.error[400],
    borderRadius: 8,
    backgroundColor: COLORS.error[100],
    minHeight: 40,
  },
  clearButtonText: {
    color: COLORS.error[700],
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
  doneButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.success[400],
    borderRadius: 8,
    backgroundColor: COLORS.success[100],
    minHeight: 40,
  },
  doneButtonText: {
    color: COLORS.success[700],
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
  },
});

export default DropdownCategorySelector;
