import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  uploadProfilePicture,
  getProfilePicture,
  deleteProfilePicture,
} from "@/services/user";

export interface ProfilePictureData {
  imageId: string;
  url: string;
  filename: string;
  size: number;
  width?: number;
  height?: number;
  uploadedAt: string;
}

export interface ProfilePictureResponse {
  success: boolean;
  message: string;
  data?: ProfilePictureData;
}

// Hook to get current profile picture
export const useProfilePicture = () => {
  return useQuery({
    queryKey: ["profile-picture"],
    queryFn: getProfilePicture,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};

// Hook to upload profile picture
export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: () => {
      // Invalidate and refetch profile picture
      queryClient.invalidateQueries({ queryKey: ["profile-picture"] });
      // Also invalidate profile data to update avatar
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      // Invalidate user data to update avatar in profile screen
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (error) => {
      console.error("Profile picture upload error:", error);
    },
  });
};

// Hook to delete profile picture
export const useDeleteProfilePicture = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProfilePicture,
    onSuccess: () => {
      // Invalidate and refetch profile picture
      queryClient.invalidateQueries({ queryKey: ["profile-picture"] });
      // Also invalidate profile data to update avatar
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (error) => {
      console.error("Profile picture delete error:", error);
    },
  });
};
