import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService, BusinessAddress } from "../services/user";

// Hook for fetching business addresses
export const useBusinessAddresses = () => {
  return useQuery({
    queryKey: ["businessAddresses"],
    queryFn: userService.getBusinessAddresses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Hook for creating a new business address
export const useCreateBusinessAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<BusinessAddress, 'id' | 'createdAt' | 'updatedAt'>) =>
      userService.createBusinessAddress(data),
    onSuccess: () => {
      // Invalidate and refetch business addresses
      queryClient.invalidateQueries({ queryKey: ["businessAddresses"] });
      // Also invalidate profile data since it includes business addresses
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Error creating business address:", error);
    },
  });
};

// Hook for updating a business address
export const useUpdateBusinessAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addressId, data }: { addressId: string; data: Partial<BusinessAddress> }) =>
      userService.updateBusinessAddress(addressId, data),
    onSuccess: () => {
      // Invalidate and refetch business addresses
      queryClient.invalidateQueries({ queryKey: ["businessAddresses"] });
      // Also invalidate profile data since it includes business addresses
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Error updating business address:", error);
    },
  });
};

// Hook for deleting a business address
export const useDeleteBusinessAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (addressId: string) => userService.deleteBusinessAddress(addressId),
    onSuccess: () => {
      // Invalidate and refetch business addresses
      queryClient.invalidateQueries({ queryKey: ["businessAddresses"] });
      // Also invalidate profile data since it includes business addresses
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Error deleting business address:", error);
    },
  });
};

export default useBusinessAddresses;
