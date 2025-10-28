import { api } from "./api";

// Enquiry Channel Enum (matching backend)
export enum EnquiryChannel {
  APP = "APP",
  WHATSAPP = "WHATSAPP",
  PHONE = "PHONE",
  EMAIL = "EMAIL",
  OTHER = "OTHER",
}

// Enquiry Status Enum (matching backend)
export enum EnquiryStatus {
  PENDING = "PENDING",
  RESPONDED = "RESPONDED",
  CLOSED = "CLOSED",
}

// Create Enquiry Request Interface
export interface CreateEnquiryRequest {
  vendorId: string;
  listingId: string;
  serviceId?: string;
  userId: string;
  channel: EnquiryChannel;
  message?: string;
}

// Enquiry Response Interface
export interface Enquiry {
  id: string;
  vendorId: string;
  listingId: string;
  serviceId?: string;
  userId: string;
  message?: string;
  channel: EnquiryChannel;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
  vendor?: {
    id: string;
    businessName: string;
    businessEmail: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  listing?: {
    id: string;
    title: string;
    description: string;
  };
  service?: {
    id: string;
    name: string;
    description: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

// API Response Interface
export interface EnquiryApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    count: number;
    limit: number;
    offset: number;
  };
}

// Get Enquiries Options
export interface GetEnquiriesOptions {
  vendorId?: string;
  userId?: string;
  listingId?: string;
  status?: EnquiryStatus;
  channel?: EnquiryChannel;
  limit?: number;
  offset?: number;
  startDate?: string;
  endDate?: string;
}

// Enquiry Statistics Interface
export interface EnquiryStats {
  total: number;
  pending: number;
  responded: number;
  closed: number;
  byChannel: Record<string, number>;
}

// Enquiry Service Class
export class EnquiryService {
  /**
   * Create a new enquiry
   */
  async createEnquiry(data: CreateEnquiryRequest): Promise<Enquiry> {
    try {
      const response = await api.post<EnquiryApiResponse<Enquiry>>(
        "/enquiries",
        data
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to create enquiry:", error);
      throw error;
    }
  }

  /**
   * Get enquiries with filtering and pagination
   */
  async getEnquiries(options: GetEnquiriesOptions = {}): Promise<Enquiry[]> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get<EnquiryApiResponse<Enquiry[]>>(
        `/enquiries?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to get enquiries:", error);
      throw error;
    }
  }

  /**
   * Get enquiries for a specific vendor
   */
  async getVendorEnquiries(
    vendorId: string,
    options: Omit<GetEnquiriesOptions, "vendorId"> = {}
  ): Promise<Enquiry[]> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get<EnquiryApiResponse<Enquiry[]>>(
        `/enquiries/vendor/${vendorId}?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to get vendor enquiries:", error);
      throw error;
    }
  }

  /**
   * Get enquiries for a specific user
   */
  async getUserEnquiries(
    userId: string,
    options: Omit<GetEnquiriesOptions, "userId"> = {}
  ): Promise<Enquiry[]> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get<EnquiryApiResponse<Enquiry[]>>(
        `/enquiries/user/${userId}?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to get user enquiries:", error);
      throw error;
    }
  }

  /**
   * Update enquiry status
   */
  async updateEnquiryStatus(
    enquiryId: string,
    status: EnquiryStatus
  ): Promise<Enquiry> {
    try {
      const response = await api.patch<EnquiryApiResponse<Enquiry>>(
        `/enquiries/${enquiryId}/status`,
        { status }
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to update enquiry status:", error);
      throw error;
    }
  }

  /**
   * Get enquiry statistics
   */
  async getEnquiryStats(
    options: {
      vendorId?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<EnquiryStats> {
    try {
      const queryParams = new URLSearchParams();

      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });

      const response = await api.get<EnquiryApiResponse<EnquiryStats>>(
        `/enquiries/stats?${queryParams.toString()}`
      );
      return response.data.data;
    } catch (error) {
      console.error("Failed to get enquiry stats:", error);
      throw error;
    }
  }

  /**
   * Create enquiry in background (non-blocking)
   * This is the main function that will be used in the UI
   */
  async createEnquiryInBackground(data: CreateEnquiryRequest): Promise<void> {
    try {
      // Don't await - let it run in background
      this.createEnquiry(data).catch((error) => {
        console.log("Background enquiry creation failed:", error);
        // Silent fail - don't throw error to user
      });
    } catch (error) {
      console.log("Failed to start background enquiry creation:", error);
      // Silent fail - don't throw error to user
    }
  }
}

// Export singleton instance
export const enquiryService = new EnquiryService();

// Export default
export default enquiryService;
