import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Alert,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";
import { ResponsiveText, ResponsiveButton } from "@/components/UI";
import { usePrimaryCategories } from "@/hooks/useCategories";
import { categoryService } from "@/services/category";
import { useQuery } from "@tanstack/react-query";

export interface Category {
  id: string;
  name: string;
  slug: string;
  path?: string; // Full category path like "Beauty > Hair > Haircut"
  parentId?: string; // Parent category ID for hierarchy
  children?: Category[]; // Child categories
  hasChildren?: boolean; // Whether this category has children
}

interface MultiSelectCategorySearchProps {
  selectedCategories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
  maxSelections?: number;
  placeholder?: string;
  error?: string;
  disabled?: boolean;
}

export const MultiSelectCategorySearch: React.FC<
  MultiSelectCategorySearchProps
> = ({
  selectedCategories = [],
  onCategoriesChange,
  maxSelections = 4,
  placeholder = "Search categories...",
  error: errorProp,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [childrenCache, setChildrenCache] = useState<Map<string, Category[]>>(
    new Map()
  );
  const [allAvailableCategories, setAllAvailableCategories] = useState<
    Category[]
  >([]);

  // Debounce search query to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch all categories flat when modal opens (no search query)
  const {
    data: allCategoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery({
    queryKey: ["categories", "all-flat"],
    queryFn: categoryService.getAllCategoriesFlat,
    enabled: debouncedSearchQuery.length === 0 && isModalVisible,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Dynamic search - only fetch when user types (with debouncing)
  const {
    data: searchCategoriesData,
    isLoading: isLoadingSearch,
    error: searchError,
  } = useQuery({
    queryKey: ["categories", "search", debouncedSearchQuery],
    queryFn: () => categoryService.searchCategories(debouncedSearchQuery),
    enabled: debouncedSearchQuery.length > 0, // Only search when user has typed something
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Debug logging for API response
  useEffect(() => {
    console.log("🔍 Category Search Debug:");
    console.log("  - searchQuery:", searchQuery);
    console.log("  - debouncedSearchQuery:", debouncedSearchQuery);
    console.log("  - isLoadingCategories:", isLoadingCategories);
    console.log("  - isLoadingSearch:", isLoadingSearch);
    console.log("  - allCategoriesData:", allCategoriesData);
    console.log("  - searchCategoriesData:", searchCategoriesData);
    if (allCategoriesData) {
      console.log("  - allCategoriesData length:", allCategoriesData.length);
    }
    if (searchCategoriesData) {
      console.log(
        "  - searchCategoriesData length:",
        searchCategoriesData.length
      );
    }
  }, [
    searchQuery,
    debouncedSearchQuery,
    isLoadingCategories,
    isLoadingSearch,
    allCategoriesData,
    searchCategoriesData,
  ]);

  // Process categories data (primary or search results)
  useEffect(() => {
    if (debouncedSearchQuery.length > 0 && searchCategoriesData) {
      // Search API returns categories with their full paths
      const processedCategories: Category[] = searchCategoriesData.map(
        (category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          path: category.path || category.name,
        })
      );
      setCategoryTree(processedCategories);
      setAllAvailableCategories(processedCategories);
    } else if (
      debouncedSearchQuery.length === 0 &&
      allCategoriesData &&
      isModalVisible
    ) {
      // Process all categories and build tree
      const processed: Category[] = allCategoriesData.map((category: any) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        path: category.path,
        parentId: category.parentId || null,
        children: [],
        hasChildren: category._count?.children > 0 || false,
      }));
      setAllAvailableCategories(processed);

      // Build tree structure (only root categories)
      const rootCategories = processed.filter((cat) => !cat.parentId);
      setCategoryTree(rootCategories);
    }
  }, [
    debouncedSearchQuery,
    allCategoriesData,
    searchCategoriesData,
    isModalVisible,
  ]);

  // Fetch children for a category
  const fetchCategoryChildren = useCallback(
    async (categoryId: string) => {
      if (!childrenCache.has(categoryId)) {
        console.log(`🔍 Fetching children for category ID: ${categoryId}`);
        try {
          const children = await categoryService.getCategoryChildren(
            categoryId
          );
          console.log(
            `✅ Received ${children.length} children for category ${categoryId}`,
            children.map((c: any) => ({ name: c.name, _count: c._count }))
          );
          const processedChildren = children.map((child: any) => ({
            id: child.id,
            name: child.name,
            slug: child.slug,
            path: child.path || child.name,
            parentId: child.parentId || categoryId,
            children: [],
            hasChildren: child._count?.children > 0 || false,
          }));
          setChildrenCache((prev) => {
            const newCache = new Map(prev).set(categoryId, processedChildren);
            console.log(
              `📦 Updated cache for ${categoryId} with ${processedChildren.length} children`
            );
            return newCache;
          });
        } catch (error) {
          console.error("❌ Error fetching children:", error);
        }
      } else {
        console.log(`✅ Children already cached for ${categoryId}`);
      }
    },
    [childrenCache]
  );

  // Reset expanded categories when modal closes
  useEffect(() => {
    if (!isModalVisible) {
      setExpandedCategories(new Set());
    }
  }, [isModalVisible]);

  // Helper to check if a category is a root category
  const isRootCategory = useCallback(
    (categoryId: string): boolean => {
      const category = allAvailableCategories.find(
        (cat) => cat.id === categoryId
      );
      return category ? !category.parentId : false;
    },
    [allAvailableCategories]
  );

  // Handle category expand/collapse
  const handleCategoryExpand = useCallback(
    async (categoryId: string) => {
      const isExpanded = expandedCategories.has(categoryId);
      let newExpanded = new Set(expandedCategories);

      if (isExpanded) {
        // If clicking to collapse, just collapse this category
        newExpanded.delete(categoryId);
      } else {
        // If clicking to expand
        // Check if this is a root category
        const isRoot = isRootCategory(categoryId);

        if (isRoot) {
          // If expanding a root category, collapse all other root categories
          console.log("Expanding root category, collapsing others");
          const allRootIds = categoryTree.map((cat) => cat.id);
          newExpanded = new Set([categoryId]); // Only keep the newly expanded root
        } else {
          // If expanding a child category, just add it
          newExpanded.add(categoryId);
        }

        // Fetch children if not cached
        await fetchCategoryChildren(categoryId);
      }
      setExpandedCategories(newExpanded);
    },
    [expandedCategories, fetchCategoryChildren, isRootCategory, categoryTree]
  );

  // Helper to get root category ID
  const getRootCategoryId = useCallback(
    (category: Category): string => {
      // Try to extract from path first
      if (category.path && category.path.includes(" > ")) {
        const parts = category.path.split(" > ");
        const rootName = parts[0];
        const rootCategory = allAvailableCategories.find(
          (cat) => cat.name === rootName && !cat.parentId
        );
        if (rootCategory) return rootCategory.id;
      }

      // Traverse up the tree to find root
      let currentCategory = category;
      const visited = new Set<string>();

      while (currentCategory.parentId) {
        if (visited.has(currentCategory.id)) break; // Prevent infinite loops
        visited.add(currentCategory.id);

        const parent = allAvailableCategories.find(
          (cat) => cat.id === currentCategory.parentId
        );
        if (!parent) break;

        currentCategory = parent;
      }

      return currentCategory.id;
    },
    [allAvailableCategories]
  );

  const handleCategorySelect = (category: Category) => {
    const isAlreadySelected = selectedCategories.some(
      (cat) => cat.id === category.id
    );

    if (isAlreadySelected) {
      // Deselect the category
      const newCategories = selectedCategories.filter(
        (cat) => cat.id !== category.id
      );
      onCategoriesChange(newCategories);
    } else {
      // Select the category (if under limit)
      if (selectedCategories.length >= maxSelections) {
        Alert.alert(
          "Maximum Categories Reached",
          `You can select a maximum of ${maxSelections} categories per service.`
        );
        return;
      }

      if (selectedCategories.length === 0) {
        // First selection
        onCategoriesChange([category]);
      } else {
        // Check if same root
        const firstSelectedCategory = allAvailableCategories.find(
          (cat) => cat.id === selectedCategories[0].id
        );
        const currentRootId = getRootCategoryId(category);
        const firstRootId = firstSelectedCategory
          ? getRootCategoryId(firstSelectedCategory)
          : null;

        console.log("=== SELECTION DEBUG ===");
        console.log("Current category:", category.name);
        console.log("Current root ID:", currentRootId);
        console.log("First selected category:", firstSelectedCategory?.name);
        console.log("First root ID:", firstRootId);
        console.log("Is same root?", currentRootId === firstRootId);

        if (currentRootId === firstRootId) {
          // Same root - add to selection
          onCategoriesChange([...selectedCategories, category]);
        } else {
          // Different root - clear and select only this one
          console.log("Different root detected, clearing previous selections");
          setExpandedCategories(new Set()); // Collapse all accordions
          onCategoriesChange([category]);
        }
      }
    }
  };

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleCategoryRemove = (categoryId: string) => {
    const newCategories = selectedCategories.filter(
      (cat) => cat.id !== categoryId
    );
    onCategoriesChange(newCategories);
  };

  // Render category item with children
  const renderCategoryItem = (
    category: Category,
    depth: number = 0
  ): React.ReactElement => {
    const isSelected = selectedCategories.some((cat) => cat.id === category.id);
    const isExpanded = expandedCategories.has(category.id);
    const children = childrenCache.get(category.id) || [];

    console.log(`📂 Rendering category: ${category.name}`, {
      isExpanded,
      childrenCount: children.length,
      depth,
      hasCache: childrenCache.has(category.id),
    });

    return (
      <View>
        <TouchableOpacity
          style={[
            styles.categoryItem,
            isSelected && styles.selectedCategoryItem,
            {
              paddingLeft: PADDING.md + depth * 20, // Indentation based on depth
              paddingVertical: depth > 0 ? PADDING.sm : PADDING.md, // Smaller padding for children
            },
          ]}
          onPress={() => handleCategorySelect(category)}
          disabled={disabled}
        >
          <View style={styles.categoryInfo}>
            <ResponsiveText
              variant={depth > 0 ? "body2" : "body1"}
              weight={depth > 0 ? "regular" : "medium"}
              color={COLORS.text.primary}
            >
              {category.name}
            </ResponsiveText>
            {category.path && category.path !== category.name && (
              <ResponsiveText variant="caption1" color={COLORS.text.secondary}>
                {category.path}
              </ResponsiveText>
            )}
          </View>
          <View style={styles.categoryActions}>
            {/* Show chevron if category has children (from DB count or cached children) */}
            {(category.hasChildren || children.length > 0) && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleCategoryExpand(category.id);
                }}
                style={styles.expandButton}
              >
                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={COLORS.text.secondary}
                />
              </TouchableOpacity>
            )}
            {isSelected ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.primary[600]}
              />
            ) : (
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={COLORS.primary[500]}
              />
            )}
          </View>
        </TouchableOpacity>

        {/* Render children if expanded and children exist */}
        {isExpanded && (
          <View>
            {children.length > 0 ? (
              children.map((child) => (
                <React.Fragment key={child.id}>
                  {renderCategoryItem(child, depth + 1)}
                </React.Fragment>
              ))
            ) : (
              <View
                style={{ paddingLeft: PADDING.lg, paddingVertical: PADDING.sm }}
              >
                <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                  Loading...
                </ResponsiveText>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderSelectedCategory = (category: Category) => (
    <View key={category.id} style={styles.selectedCategoryBadge}>
      <ResponsiveText
        variant="caption2"
        weight="medium"
        color={COLORS.primary[500]}
        style={styles.badgeText}
      >
        {category.name}
      </ResponsiveText>
      <TouchableOpacity
        onPress={() => handleCategoryRemove(category.id)}
        disabled={disabled}
        style={styles.removeButton}
      >
        <Ionicons name="close" size={16} color={COLORS.primary[500]} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Selected Categories Display */}
      {selectedCategories.length > 0 && (
        <View style={styles.selectedCategoriesContainer}>
          <View style={styles.selectedCategoriesList}>
            {selectedCategories.map(renderSelectedCategory)}
          </View>
        </View>
      )}

      {/* Search Input */}
      <TouchableOpacity
        style={[styles.searchInput, disabled && styles.disabled]}
        onPress={() => !disabled && setIsModalVisible(true)}
      >
        <Ionicons name="search" size={20} color={COLORS.text.secondary} />
        <ResponsiveText
          variant="body1"
          color={COLORS.text.secondary}
          style={styles.placeholder}
        >
          {placeholder}
        </ResponsiveText>
        <Ionicons name="chevron-down" size={20} color={COLORS.text.secondary} />
      </TouchableOpacity>

      {/* Error Message */}
      {errorProp && (
        <ResponsiveText
          variant="body2"
          color={COLORS.error[500]}
          style={styles.errorText}
        >
          {errorProp}
        </ResponsiveText>
      )}

      {/* Category Selection Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View
          style={[
            styles.modalContainer,
            selectedCategories.length > 0 && styles.modalContainerWithButton,
          ]}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={COLORS.white} />
            </TouchableOpacity>
            <ResponsiveText
              variant="h5"
              weight="bold"
              color={COLORS.white}
              style={styles.headerTitle}
            >
              Select Categories
            </ResponsiveText>
            <View style={styles.placeholder} />
          </View>

          {/* Search Input */}
          <View style={styles.modalSearchContainer}>
            <Ionicons name="search" size={20} color={COLORS.text.secondary} />
            <TextInput
              style={styles.modalSearchInput}
              placeholder="Search categories..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              placeholderTextColor={COLORS.text.secondary}
            />
          </View>

          {/* Debouncing Indicator */}
          {searchQuery.length > 0 && searchQuery !== debouncedSearchQuery && (
            <View style={styles.debouncingContainer}>
              <ResponsiveText variant="body2" color={COLORS.text.secondary}>
                Typing...
              </ResponsiveText>
            </View>
          )}

          {/* Categories List */}
          {isLoadingCategories || isLoadingSearch ? (
            <View style={styles.loadingContainer}>
              <ResponsiveText variant="body1" color={COLORS.text.secondary}>
                {isLoadingSearch ? "Searching..." : "Loading categories..."}
              </ResponsiveText>
            </View>
          ) : (
            <ScrollView
              style={styles.categoriesList}
              showsVerticalScrollIndicator={false}
            >
              {categoryTree.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="search"
                    size={48}
                    color={COLORS.text.secondary}
                  />
                  <ResponsiveText
                    variant="body1"
                    color={COLORS.text.secondary}
                    style={styles.emptyText}
                  >
                    {searchQuery
                      ? `No categories found for "${searchQuery}"`
                      : !isLoadingCategories
                      ? "No categories available"
                      : "No categories match your search"}
                  </ResponsiveText>
                  {searchQuery && (
                    <ResponsiveText
                      variant="body2"
                      color={COLORS.text.secondary}
                      style={styles.emptySubText}
                    >
                      Try searching for different keywords
                    </ResponsiveText>
                  )}
                </View>
              ) : (
                categoryTree.map((category) => (
                  <React.Fragment key={category.id}>
                    {renderCategoryItem(category, 0)}
                  </React.Fragment>
                ))
              )}
            </ScrollView>
          )}

          {/* Floating Confirm Button */}
          {selectedCategories.length > 0 && (
            <View style={styles.floatingButtonContainer}>
              <ResponsiveButton
                variant="primary"
                size="medium"
                shape="rounded"
                title={`Confirm (${selectedCategories.length}/${maxSelections})`}
                onPress={() => setIsModalVisible(false)}
                fullWidth
              />
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: MARGIN.md,
  },
  label: {
    marginBottom: MARGIN.xs,
  },
  selectedCategoriesContainer: {
    marginBottom: MARGIN.sm,
  },
  selectedCategoriesList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: MARGIN.xs,
  },
  selectedCategoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary[50],
    borderColor: COLORS.primary[200],
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: PADDING.sm,
    paddingVertical: 2,
    gap: MARGIN.xs,
  },
  removeButton: {
    padding: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background.primary,
    borderColor: COLORS.black,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.input,
    paddingHorizontal: PADDING.inputLarge,
    paddingVertical: 12,
    gap: MARGIN.sm,
    minHeight: 48,
  },
  disabled: {
    backgroundColor: COLORS.background.secondary,
    opacity: 0.6,
  },
  placeholder: {
    flex: 1,
    fontSize: 16,
  },
  errorText: {
    marginTop: MARGIN.xs,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
    paddingBottom: 0,
  },
  modalContainerWithButton: {
    paddingBottom: 80, // Space for floating button when visible
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.screen,
    paddingTop: PADDING.lg + PADDING.md - 5,
    paddingBottom: PADDING.lg - 10,
    backgroundColor: COLORS.primary[200],
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  closeButton: {
    padding: PADDING.xs,
  },
  headerTitle: {
    textAlignVertical: "center",
    lineHeight: 24,
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background.secondary,
    marginHorizontal: PADDING.lg,
    marginVertical: PADDING.md,
    borderRadius: 30,
    paddingHorizontal: PADDING.md,
    gap: MARGIN.sm,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text.primary,
    paddingVertical: PADDING.sm,
  },
  categoriesList: {
    flex: 1,
    paddingHorizontal: PADDING.sm,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: PADDING.md,
    paddingHorizontal: PADDING.md,
    borderRadius: 8,
    marginHorizontal: PADDING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  selectedCategoryItem: {
    backgroundColor: COLORS.primary[50],
  },
  categoryInfo: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PADDING.xl * 2,
  },
  emptyText: {
    marginTop: MARGIN.md,
    textAlign: "center",
  },
  emptySubText: {
    marginTop: MARGIN.xs,
    textAlign: "center",
    fontStyle: "italic",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: PADDING.xl,
  },
  debouncingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: PADDING.sm,
    backgroundColor: COLORS.primary[50],
    marginHorizontal: PADDING.md,
    borderRadius: 8,
  },
  floatingButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  categoryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: MARGIN.xs,
  },
  expandButton: {
    padding: PADDING.xs,
  },
});
