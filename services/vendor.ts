import { api } from "./api";

export interface VendorMetricsResponse {
  success: boolean;
  data: {
    window: "7d" | "30d";
    period: {
      current: { from: string; to: string };
      previous: { from: string; to: string };
    };
    cards: {
      listings: {
        value: number;
        current: number;
        previous: number;
        growthPercent: number;
      };
      enquiries: {
        value: number;
        current: number;
        previous: number;
        growthPercent: number;
      };
      reviews: {
        value: number;
        current: number;
        previous: number;
        growthPercent: number;
      };
      promotions: {
        value: number;
        current: number;
        previous: number;
        growthPercent: number;
      };
    };
  };
}

export const vendorService = {
  getMyMetrics: async (
    window: "7d" | "30d" = "30d"
  ): Promise<VendorMetricsResponse> => {
    const res = await api.get<VendorMetricsResponse>(
      `/vendors/me/metrics?window=${window}`
    );
    return res.data;
  },
};

export default vendorService;
