import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

interface SessionExpiryState {
  isSessionExpired: boolean;
  message: string | null;
  clearMessage: () => void;
}

export const useSessionExpiry = (): SessionExpiryState => {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    checkSessionExpiryMessage();
  }, []);

  const checkSessionExpiryMessage = async () => {
    try {
      const sessionMessage = await AsyncStorage.getItem(
        "sessionExpiredMessage"
      );
      if (sessionMessage) {
        setMessage(sessionMessage);
        setIsSessionExpired(true);
        // Clear the message after a delay
        setTimeout(() => {
          clearMessage();
        }, 5000);
      }
    } catch (error) {
      console.error("Error checking session expiry message:", error);
    }
  };

  const clearMessage = async () => {
    try {
      await AsyncStorage.removeItem("sessionExpiredMessage");
      setMessage(null);
      setIsSessionExpired(false);
    } catch (error) {
      console.error("Error clearing session expiry message:", error);
    }
  };

  return {
    isSessionExpired,
    message,
    clearMessage,
  };
};
