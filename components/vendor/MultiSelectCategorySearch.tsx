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
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce search query to prevent too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // 300ms delay

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch primary categories when modal opens (no search query)
  const {
    data: primaryCategoriesData,
    isLoading: isLoadingPrimary,
    error: primaryError,
  } = useQuery({
    queryKey: ["categories", "primary"],
    queryFn: categoryService.getPrimaryCategories,
    enabled: debouncedSearchQuery.length === 0, // Only fetch primary when no search
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
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
    console.log("  - isLoadingPrimary:", isLoadingPrimary);
    console.log("  - isLoadingSearch:", isLoadingSearch);
    console.log("  - primaryCategoriesData:", primaryCategoriesData);
    console.log("  - searchCategoriesData:", searchCategoriesData);
    if (primaryCategoriesData) {
      console.log(
        "  - primaryCategoriesData length:",
        primaryCategoriesData.length
      );
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
    isLoadingPrimary,
    isLoadingSearch,
    primaryCategoriesData,
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
          path: category.path || category.name, // Use path from API or fallback to name
        })
      );
      setAllCategories(processedCategories);
    } else if (debouncedSearchQuery.length === 0 && primaryCategoriesData) {
      // Primary categories (no paths needed, just names)
      const processedCategories: Category[] = primaryCategoriesData.map(
        (category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
          path: category.name, // Primary categories have no parent path
        })
      );
      setAllCategories(processedCategories);
    } else if (debouncedSearchQuery.length === 0) {
      // Clear categories when no data available
      setAllCategories([]);
    }
  }, [debouncedSearchQuery, primaryCategoriesData, searchCategoriesData]);

  // Use search results directly (API already filters)
  const filteredCategories = useMemo(() => {
    return allCategories; // API already returns filtered results
  }, [allCategories]);

  // Show all filtered categories (including selected ones for deselection)
  const availableCategories = useMemo(() => {
    return filteredCategories;
  }, [filteredCategories]);

  // Debug logging
  useEffect(() => {
    console.log("🔍 MultiSelectCategorySearch Debug:");
    console.log("  - allCategories length:", allCategories.length);
    console.log("  - searchQuery:", searchQuery);
    console.log("  - filteredCategories length:", filteredCategories.length);
    console.log("  - availableCategories length:", availableCategories.length);
    console.log("  - selectedCategories length:", selectedCategories.length);

    if (searchQuery && filteredCategories.length === 0) {
      console.log("  - No matches found for query:", searchQuery);
      console.log(
        "  - Sample category names:",
        allCategories.slice(0, 5).map((c) => c.name)
      );
    }
  }, [
    allCategories,
    searchQuery,
    filteredCategories,
    availableCategories,
    selectedCategories,
  ]);

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

      const newCategories = [...selectedCategories, category];
      onCategoriesChange(newCategories);
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

  const renderCategoryItem = ({ item }: { item: Category }) => {
    const isSelected = selectedCategories.some((cat) => cat.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.categoryItem, isSelected && styles.selectedCategoryItem]}
        onPress={() => handleCategorySelect(item)}
        disabled={disabled}
      >
        <View style={styles.categoryInfo}>
          <ResponsiveText
            variant="body1"
            weight="medium"
            color={COLORS.text.primary}
          >
            {item.name}
          </ResponsiveText>
          {item.path && item.path !== item.name && (
            <ResponsiveText variant="body2" color={COLORS.text.secondary}>
              {item.path}
            </ResponsiveText>
          )}
        </View>
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
      </TouchableOpacity>
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
          {isLoadingPrimary || isLoadingSearch ? (
            <View style={styles.loadingContainer}>
              <ResponsiveText variant="body1" color={COLORS.text.secondary}>
                {isLoadingSearch ? "Searching..." : "Loading categories..."}
              </ResponsiveText>
            </View>
          ) : (
            <FlatList
              data={availableCategories}
              keyExtractor={(item) => item.id}
              renderItem={renderCategoryItem}
              style={styles.categoriesList}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
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
                      : allCategories.length === 0
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
              }
            />
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
});
