import { api } from "./api";

// Upload service for handling image uploads and deletions

export interface UploadResponse {
  success: boolean;
  message: string;
  data: {
    imageId: string;
    imageUrl: string;
    filename: string;
    size: number;
    width?: number;
    height?: number;
  };
}

export interface DeleteImageResponse {
  success: boolean;
  message: string;
}

export const uploadService = {
  // Upload promotion banner image
  uploadPromotionBanner: async (imageUri: string): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append("image", {
      uri: imageUri,
      type: "image/jpeg",
      name: "promotion-banner.jpg",
    } as any);

    const response = await api.post<UploadResponse>("/upload/promotion-banner", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  },

  // Delete image from Cloudinary and database
  deleteImage: async (imageUrl: string): Promise<DeleteImageResponse> => {
    const response = await api.delete<DeleteImageResponse>("/upload/image", {
      data: { imageUrl },
    });

    return response.data;
  },
};
