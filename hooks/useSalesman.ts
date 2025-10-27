import { useQuery } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";

export interface SalesmanData {
  id: string;
  userId: string;
  territory: string;
  targetVendors: number;
  targetUsers: number;
  vendorsOnboarded: number;
  usersOnboarded: number;
  totalCommission: number;
  createdAt: string;
  updatedAt: string;
}

export interface SalesmanUser {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: string;
  status: string;
  phone?: string;
  avatar?: string;
  salesman?: SalesmanData;
}

/**
 * Hook to fetch salesman data from the user profile
 */
export const useSalesman = () => {
  return useQuery<SalesmanUser>({
    queryKey: ["salesman"],
    queryFn: async (): Promise<SalesmanUser> => {
      const response = await api.get("/auth/me", {
        params: { _t: Date.now() },
      });

      if (
        response.data &&
        (response.data as any).success &&
        (response.data as any).data
      ) {
        const userData = (response.data as any).data;

        // Store user data in AsyncStorage
        try {
          await AsyncStorage.setItem("userData", JSON.stringify(userData));
        } catch (storageError) {
          console.error("Error storing userData:", storageError);
        }

        return userData;
      }

      throw new Error("Failed to fetch salesman data");
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export default useSalesman;
