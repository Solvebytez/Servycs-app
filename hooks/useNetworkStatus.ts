import { useState, useEffect } from "react";
import * as Network from "expo-network";

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isOffline: boolean;
}

export const useNetworkStatus = () => {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
    isOffline: false,
  });

  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setNetworkStatus({
          isConnected: networkState.isConnected ?? false,
          isInternetReachable: networkState.isInternetReachable,
          type: networkState.type,
          isOffline:
            !networkState.isConnected ||
            networkState.isInternetReachable === false,
        });
      } catch (error) {
        console.error("Error checking network status:", error);
        // Default to offline if we can't check
        setNetworkStatus({
          isConnected: false,
          isInternetReachable: false,
          type: null,
          isOffline: true,
        });
      }
    };

    // Check initial network status
    checkNetworkStatus();

    // Set up interval to check network status periodically
    const interval = setInterval(checkNetworkStatus, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, []);

  return networkStatus;
};

export default useNetworkStatus;
