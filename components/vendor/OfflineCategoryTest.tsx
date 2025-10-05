import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  useOfflineCategories,
  useCategoryCacheStats,
  useCategoryOfflineStatus,
} from "../../hooks/useOfflineCategories";
import {
  useRefreshCategories,
  useClearCategoryCache,
} from "../../hooks/useOfflineCategories";
import { CategoryTreeNode } from "../../utils/categoryTreeUtils";
import { COLORS } from "../../constants";
import { ResponsiveText } from "../UI/ResponsiveText";
import { ResponsiveButton } from "../UI/ResponsiveButton";

/**
 * Test component to demonstrate offline category functionality
 */
const OfflineCategoryTest: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Offline category hooks
  const { data: tree, isLoading, error, refetch } = useOfflineCategories();
  const { data: cacheStats } = useCategoryCacheStats();
  const { data: offlineStatus } = useCategoryOfflineStatus();
  const { refetch: refreshCategories } = useRefreshCategories();
  const { refetch: clearCache } = useClearCategoryCache();

  const handleRefresh = async () => {
    try {
      await refreshCategories();
      Alert.alert("Success", "Categories refreshed successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to refresh categories");
    }
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      Alert.alert("Success", "Category cache cleared!");
    } catch (error) {
      Alert.alert("Error", "Failed to clear cache");
    }
  };

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

  const renderCacheStats = () => {
    if (!cacheStats) return null;

    return (
      <View style={styles.statsContainer}>
        <ResponsiveText variant="h4" style={styles.statsTitle}>
          Cache Statistics
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Cached: {cacheStats.isCached ? "✅ Yes" : "❌ No"}
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Expired: {cacheStats.isExpired ? "⚠️ Yes" : "✅ No"}
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Age:{" "}
          {cacheStats.ageInHours ? `${cacheStats.ageInHours} hours` : "Unknown"}
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Data Size: {Math.round(cacheStats.dataSize / 1024)} KB
        </ResponsiveText>
      </View>
    );
  };

  const renderOfflineStatus = () => {
    if (!offlineStatus) return null;

    return (
      <View style={styles.statusContainer}>
        <ResponsiveText variant="h4" style={styles.statusTitle}>
          Offline Status
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Online: {offlineStatus.isOnline ? "🌐 Yes" : "📱 No"}
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Offline Data:{" "}
          {offlineStatus.isOfflineDataAvailable
            ? "✅ Available"
            : "❌ Not Available"}
        </ResponsiveText>
        <ResponsiveText variant="body1" style={styles.stat}>
          Last Updated:{" "}
          {offlineStatus.lastUpdated
            ? new Date(offlineStatus.lastUpdated).toLocaleString()
            : "Never"}
        </ResponsiveText>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ResponsiveText variant="h3" style={styles.title}>
          Loading Offline Categories...
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
        <ResponsiveButton
          title="Retry"
          onPress={() => refetch()}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <ResponsiveText variant="h3" style={styles.title}>
        Offline Category Test
      </ResponsiveText>

      {renderCacheStats()}
      {renderOfflineStatus()}

      <View style={styles.buttonContainer}>
        <ResponsiveButton
          title="Refresh Categories"
          onPress={handleRefresh}
          style={styles.actionButton}
        />
        <ResponsiveButton
          title="Clear Cache"
          onPress={handleClearCache}
          style={[styles.actionButton, styles.clearButton]}
        />
      </View>

      <ResponsiveText variant="h4" style={styles.sectionTitle}>
        Category Tree (Offline Support)
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
    marginBottom: 16,
  },
  statsTitle: {
    color: COLORS.primary[600],
    fontWeight: "600",
    marginBottom: 8,
  },
  statusContainer: {
    backgroundColor: COLORS.info[50],
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusTitle: {
    color: COLORS.info[600],
    fontWeight: "600",
    marginBottom: 8,
  },
  stat: {
    color: COLORS.neutral[700],
    marginBottom: 4,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  clearButton: {
    backgroundColor: COLORS.error[500],
  },
  retryButton: {
    marginTop: 16,
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
    marginTop: 16,
  },
});

export default OfflineCategoryTest;
