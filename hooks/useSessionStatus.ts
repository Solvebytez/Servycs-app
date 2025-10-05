import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '@/services/api';

interface SessionStatus {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useSessionStatus = (): SessionStatus => {
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSessionStatus();
  }, []);

  const checkSessionStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if we have a token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setIsValid(false);
        setIsLoading(false);
        return;
      }

      // Make a simple API call to validate the session
      // This will trigger the interceptor if session is invalid
      await api.get('/auth/me'); // Assuming you have a /me endpoint
      
      setIsValid(true);
    } catch (err: any) {
      setIsValid(false);
      setError(err.message || 'Session validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isValid,
    isLoading,
    error,
  };
};
