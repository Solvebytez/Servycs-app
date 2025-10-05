import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys for different data types
export const STORAGE_KEYS = {
  CATEGORIES_TREE: "categories_tree",
  CATEGORIES_FLAT: "categories_flat",
  CATEGORIES_LAST_UPDATED: "categories_last_updated",
  USER_PREFERENCES: "user_preferences",
  OFFLINE_DATA: "offline_data",
} as const;

// Cache duration constants (in milliseconds)
export const CACHE_DURATION = {
  CATEGORIES: 24 * 60 * 60 * 1000, // 24 hours
  USER_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  TEMP_DATA: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Generic storage utility functions
 */
export class AsyncStorageUtils {
  /**
   * Store data in AsyncStorage with error handling
   */
  static async setItem<T>(key: string, value: T): Promise<boolean> {
    try {
      const jsonValue = JSON.stringify({
        data: value,
        timestamp: Date.now(),
      });
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Retrieve data from AsyncStorage with error handling
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        return null;
      }

      const parsed = JSON.parse(jsonValue);
      return parsed.data;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Retrieve data with timestamp information
   */
  static async getItemWithTimestamp<T>(key: string): Promise<{
    data: T | null;
    timestamp: number | null;
    isExpired: boolean;
  }> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue === null) {
        return {
          data: null,
          timestamp: null,
          isExpired: true,
        };
      }

      const parsed = JSON.parse(jsonValue);
      const now = Date.now();
      const isExpired =
        !parsed.timestamp || now - parsed.timestamp > CACHE_DURATION.CATEGORIES;

      return {
        data: parsed.data,
        timestamp: parsed.timestamp,
        isExpired,
      };
    } catch (error) {
      console.error(
        `Error retrieving data with timestamp for key ${key}:`,
        error
      );
      return {
        data: null,
        timestamp: null,
        isExpired: true,
      };
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  static async removeItem(key: string): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing data for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all AsyncStorage data
   */
  static async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error("Error clearing AsyncStorage:", error);
      return false;
    }
  }

  /**
   * Get all keys from AsyncStorage
   */
  static async getAllKeys(): Promise<string[]> {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error("Error getting all keys:", error);
      return [];
    }
  }

  /**
   * Get storage size information
   */
  static async getStorageInfo(): Promise<{
    totalKeys: number;
    categoryKeys: string[];
    totalSize: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const categoryKeys = keys.filter(
        (key) => key.includes("categories") || key.includes("CATEGORIES")
      );

      // Estimate size (rough calculation)
      let totalSize = 0;
      for (const key of keys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }

      return {
        totalKeys: keys.length,
        categoryKeys,
        totalSize,
      };
    } catch (error) {
      console.error("Error getting storage info:", error);
      return {
        totalKeys: 0,
        categoryKeys: [],
        totalSize: 0,
      };
    }
  }
}

/**
 * Category-specific storage utilities
 */
export class CategoryStorage {
  /**
   * Store category tree data
   */
  static async storeCategoryTree(treeData: any[]): Promise<boolean> {
    const success = await AsyncStorageUtils.setItem(
      STORAGE_KEYS.CATEGORIES_TREE,
      treeData
    );

    if (success) {
      // Also store the timestamp
      await AsyncStorageUtils.setItem(
        STORAGE_KEYS.CATEGORIES_LAST_UPDATED,
        Date.now()
      );
    }

    return success;
  }

  /**
   * Store flat category data
   */
  static async storeCategoryFlat(flatData: any[]): Promise<boolean> {
    return await AsyncStorageUtils.setItem(
      STORAGE_KEYS.CATEGORIES_FLAT,
      flatData
    );
  }

  /**
   * Retrieve category tree data
   */
  static async getCategoryTree(): Promise<any[] | null> {
    const result = await AsyncStorageUtils.getItemWithTimestamp<any[]>(
      STORAGE_KEYS.CATEGORIES_TREE
    );
    return result.data;
  }

  /**
   * Retrieve flat category data
   */
  static async getCategoryFlat(): Promise<any[] | null> {
    const result = await AsyncStorageUtils.getItemWithTimestamp<any[]>(
      STORAGE_KEYS.CATEGORIES_FLAT
    );
    return result.data;
  }

  /**
   * Check if category data is cached and not expired
   */
  static async isCategoryDataCached(): Promise<boolean> {
    const result = await AsyncStorageUtils.getItemWithTimestamp<any[]>(
      STORAGE_KEYS.CATEGORIES_TREE
    );
    return result.data !== null && !result.isExpired;
  }

  /**
   * Get last update timestamp for categories
   */
  static async getLastUpdateTimestamp(): Promise<number | null> {
    const result = await AsyncStorageUtils.getItemWithTimestamp<number>(
      STORAGE_KEYS.CATEGORIES_LAST_UPDATED
    );
    return result.timestamp;
  }

  /**
   * Clear all category data
   */
  static async clearCategoryData(): Promise<boolean> {
    const results = await Promise.all([
      AsyncStorageUtils.removeItem(STORAGE_KEYS.CATEGORIES_TREE),
      AsyncStorageUtils.removeItem(STORAGE_KEYS.CATEGORIES_FLAT),
      AsyncStorageUtils.removeItem(STORAGE_KEYS.CATEGORIES_LAST_UPDATED),
    ]);

    return results.every((result) => result);
  }

  /**
   * Get category cache statistics
   */
  static async getCacheStats(): Promise<{
    isCached: boolean;
    isExpired: boolean;
    lastUpdated: number | null;
    ageInHours: number | null;
    dataSize: number;
  }> {
    const treeResult = await AsyncStorageUtils.getItemWithTimestamp<any[]>(
      STORAGE_KEYS.CATEGORIES_TREE
    );

    const lastUpdateResult =
      await AsyncStorageUtils.getItemWithTimestamp<number>(
        STORAGE_KEYS.CATEGORIES_LAST_UPDATED
      );

    const now = Date.now();
    const ageInHours = lastUpdateResult.timestamp
      ? Math.round((now - lastUpdateResult.timestamp) / (1000 * 60 * 60))
      : null;

    // Estimate data size
    let dataSize = 0;
    if (treeResult.data) {
      dataSize = JSON.stringify(treeResult.data).length;
    }

    return {
      isCached: treeResult.data !== null,
      isExpired: treeResult.isExpired,
      lastUpdated: lastUpdateResult.timestamp,
      ageInHours,
      dataSize,
    };
  }
}

/**
 * Network status utilities
 */
export class NetworkUtils {
  /**
   * Check if device is online (simplified check)
   */
  static isOnline(): boolean {
    // This is a simplified check - in a real app you'd use NetInfo
    return navigator.onLine !== false;
  }

  /**
   * Get network status info
   */
  static getNetworkInfo(): {
    isOnline: boolean;
    connectionType?: string;
  } {
    return {
      isOnline: this.isOnline(),
      // In a real app, you'd get more detailed network info
    };
  }
}

/**
 * Offline-first data management
 */
export class OfflineDataManager {
  /**
   * Get data with offline-first strategy
   */
  static async getDataWithOfflineFirst<T>(
    key: string,
    fetchFunction: () => Promise<T>,
    cacheDuration: number = CACHE_DURATION.CATEGORIES
  ): Promise<{
    data: T | null;
    source: "cache" | "network" | "error";
    isStale: boolean;
  }> {
    try {
      // First, try to get cached data
      const cachedResult = await AsyncStorageUtils.getItemWithTimestamp<T>(key);

      // If we have cached data and it's not expired, return it
      if (cachedResult.data && !cachedResult.isExpired) {
        return {
          data: cachedResult.data,
          source: "cache",
          isStale: false,
        };
      }

      // If we're online, try to fetch fresh data
      if (NetworkUtils.isOnline()) {
        try {
          const freshData = await fetchFunction();

          // Store the fresh data
          await AsyncStorageUtils.setItem(key, freshData);

          return {
            data: freshData,
            source: "network",
            isStale: false,
          };
        } catch (networkError) {
          console.warn(
            "Network fetch failed, falling back to cache:",
            networkError
          );

          // If network fails but we have stale cache, return it
          if (cachedResult.data) {
            return {
              data: cachedResult.data,
              source: "cache",
              isStale: true,
            };
          }
        }
      }

      // If we're offline or network failed, return cached data if available
      if (cachedResult.data) {
        return {
          data: cachedResult.data,
          source: "cache",
          isStale: true,
        };
      }

      // No data available
      return {
        data: null,
        source: "error",
        isStale: false,
      };
    } catch (error) {
      console.error("Error in offline-first data fetch:", error);
      return {
        data: null,
        source: "error",
        isStale: false,
      };
    }
  }
}
