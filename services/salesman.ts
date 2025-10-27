import { api } from "./api";

export interface SalesmanMetricsResponse {
  success: boolean;
  data: {
    vendorsOnboarded: number;
    usersOnboarded: number;
    totalCommission: number;
    newVendorsThisWeek: number;
    newUsersThisWeek: number;
    recentActivity: Array<{
      type: "vendor" | "user";
      count: number;
      location: string;
      timeAgo: string;
      name: string;
    }>;
    territory: string;
  };
}

export const salesmanService = {
  getMyMetrics: async (): Promise<SalesmanMetricsResponse> => {
    const res = await api.get<SalesmanMetricsResponse>("/salesmen/me/metrics");
    return res.data;
  },
};

export default salesmanService;
