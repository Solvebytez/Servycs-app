import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import {
  useCategoryTree,
  usePrimaryCategoriesFromTree,
} from "../../hooks/useCategoryTree";
import { CategoryTreeNode } from "../../utils/categoryTreeUtils";
import { COLORS } from "../../constants";
import { ResponsiveText } from "../UI/ResponsiveText";

/**
 * Test component to verify the category tree functionality
 * This component displays the tree structure in a readable format
 */
const CategoryTreeTest: React.FC = () => {
  const { data: tree, isLoading, error } = useCategoryTree();
  const { data: primaryCategories } = usePrimaryCategoriesFromTree();

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ResponsiveText variant="h3" style={styles.title}>
          Loading Category Tree...
        </ResponsiveText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <ResponsiveText variant="h3" style={styles.title}>
          Error Loading Categories
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.error}>
          {error.message}
        </ResponsiveText>
      </View>
    );
  }

  const renderCategoryNode = (
    node: CategoryTreeNode,
    level: number = 0
  ): React.ReactNode => {
    const indent = "  ".repeat(level);
    const hasChildren = node.children.length > 0;

    return (
      <View key={node.id} style={styles.nodeContainer}>
        <ResponsiveText
          variant="body1"
          style={[
            styles.nodeText,
            { marginLeft: level * 20 },
            level === 0 && styles.primaryCategory,
            hasChildren && styles.hasChildren,
          ]}
        >
          {indent}
          {hasChildren ? "📁" : "📄"} {node.name}
          {node._count && node._count.children > 0 && (
            <Text style={styles.childCount}>
              {" "}
              ({node._count.children} children)
            </Text>
          )}
        </ResponsiveText>

        {node.children.map((child) => renderCategoryNode(child, level + 1))}
      </View>
    );
  };

  const renderTreeStats = () => {
    if (!tree) return null;

    const totalCategories = tree.reduce((count, node) => {
      const countChildren = (n: CategoryTreeNode): number => {
        return (
          1 + n.children.reduce((sum, child) => sum + countChildren(child), 0)
        );
      };
      return count + countChildren(node);
    }, 0);

    const maxDepth = Math.max(
      ...tree.map((node) => {
        const getMaxDepth = (n: CategoryTreeNode): number => {
          if (n.children.length === 0) return 0;
          return 1 + Math.max(...n.children.map(getMaxDepth));
        };
        return getMaxDepth(node);
      })
    );

    return (
      <View style={styles.statsContainer}>
        <ResponsiveText variant="h4" style={styles.statsTitle}>
          Tree Statistics
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Total Categories: {totalCategories}
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Primary Categories: {primaryCategories?.length || 0}
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Max Depth: {maxDepth + 1} levels
        </ResponsiveText>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <ResponsiveText variant="h3" style={styles.title}>
        Category Tree Test
      </ResponsiveText>

      {renderTreeStats()}

      <ResponsiveText variant="h4" style={styles.sectionTitle}>
        Tree Structure
      </ResponsiveText>

      {tree?.map((node) => renderCategoryNode(node))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    color: COLORS.primary[500],
    fontWeight: "bold",
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 10,
    color: COLORS.primary[600],
    fontWeight: "600",
  },
  statsContainer: {
    backgroundColor: COLORS.neutral[50],
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  statsTitle: {
    color: COLORS.primary[600],
    fontWeight: "600",
    marginBottom: 8,
  },
  stat: {
    color: COLORS.neutral[700],
    marginBottom: 4,
  },
  nodeContainer: {
    marginBottom: 4,
  },
  nodeText: {
    color: COLORS.neutral[800],
    lineHeight: 20,
  },
  primaryCategory: {
    fontWeight: "600",
    color: COLORS.primary[600],
  },
  hasChildren: {
    fontWeight: "500",
  },
  childCount: {
    color: COLORS.neutral[500],
    fontSize: 12,
  },
  error: {
    color: COLORS.error[500],
    textAlign: "center",
  },
});

export default CategoryTreeTest;
