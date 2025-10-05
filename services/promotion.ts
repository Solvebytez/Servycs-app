import { api } from "./api";
import { ENV } from "@/config/env";
import Constants from "expo-constants";

// Types
export interface CreatePromotionRequest {
  title: string;
  serviceListingIds: string[];
  discountType: "percentage" | "fixed";
  discountValue: number;
  originalPrice?: number;
  startDate: string;
  endDate: string;
  bannerImage?: string;
}

export interface Promotion {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  originalPrice?: number;
  startDate: string;
  endDate: string;
  bannerImage?: string;
  status: string;
  isPromotionOn: boolean;
  serviceListings: {
    id: string;
    title: string;
    categoryPath: string[];
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface PromotionApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface UpdatePromotionRequest {
  title?: string;
  serviceListingIds?: string[];
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  originalPrice?: number;
  startDate?: string;
  endDate?: string;
  bannerImage?: string;
  status?: string;
  isPromotionOn?: boolean;
}

// Promotion service
export const promotionService = {
  // Create a new promotion
  createPromotion: async (data: CreatePromotionRequest): Promise<Promotion> => {
    const response = await api.post<PromotionApiResponse<Promotion>>(
      "/promotions",
      data
    );
    return response.data.data;
  },

  // Get vendor's promotions
  getVendorPromotions: async (
    page: number = 1,
    limit: number = 10,
    status?: "active" | "inactive"
  ): Promise<{ promotions: Promotion[]; pagination: any }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) {
      params.append("status", status);
    }

    const response = await api.get<PromotionApiResponse<Promotion[]>>(
      `/promotions?${params.toString()}`
    );

    return {
      promotions: response.data.data,
      pagination: response.data.pagination,
    };
  },

  // Update a promotion
  updatePromotion: async (
    id: string,
    data: UpdatePromotionRequest
  ): Promise<Promotion> => {
    const response = await api.put<PromotionApiResponse<Promotion>>(
      `/promotions/${id}`,
      data
    );
    return response.data.data;
  },

  // Delete a promotion
  deletePromotion: async (id: string): Promise<void> => {
    console.log("🗑️ DELETE PROMOTION - Attempting to delete promotion:", id);
    console.log("🗑️ DELETE PROMOTION - ENV.API_BASE_URL:", ENV.API_BASE_URL);
    console.log("🗑️ DELETE PROMOTION - ENV.API_VERSION:", ENV.API_VERSION);
    console.log(
      "🗑️ DELETE PROMOTION - Raw Constants.extra:",
      Constants.expoConfig?.extra
    );
    console.log(
      "🗑️ DELETE PROMOTION - Raw apiVersion:",
      Constants.expoConfig?.extra?.apiVersion
    );
    console.log(
      "🗑️ DELETE PROMOTION - Full URL will be:",
      `${ENV.API_BASE_URL}/api/${ENV.API_VERSION}/promotions/${id}`
    );

    try {
      // Temporary fix: use direct axios call with correct URL
      const response = await api.delete(`/promotions/${id}`);
      console.log("✅ DELETE PROMOTION - Success:", response.data);
    } catch (error: any) {
      console.error("❌ DELETE PROMOTION - Error:", error);
      console.error(
        "❌ DELETE PROMOTION - Error response:",
        error.response?.data
      );
      console.error(
        "❌ DELETE PROMOTION - Error status:",
        error.response?.status
      );
      console.error("❌ DELETE PROMOTION - Error URL:", error.config?.url);
      throw error;
    }
  },

  // Get a single promotion by ID
  getPromotionById: async (id: string): Promise<Promotion> => {
    const response = await api.get<PromotionApiResponse<Promotion>>(
      `/promotions/${id}`
    );
    return response.data.data;
  },

  // Get active promotions for banner slider (public endpoint)
  getActivePromotions: async (excludeUserId?: string): Promise<Promotion[]> => {
    const params = excludeUserId ? { excludeUserId } : {};
    const response = await api.get<PromotionApiResponse<Promotion[]>>(
      "/promotions/active",
      { params }
    );
    return response.data.data;
  },
};
