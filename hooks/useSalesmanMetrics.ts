import { useQuery } from "@tanstack/react-query";
import { salesmanService, SalesmanMetricsResponse } from "../services/salesman";

export const salesmanMetricsKeys = {
  all: ["salesmanMetrics"] as const,
};

export function useSalesmanMetrics() {
  return useQuery<SalesmanMetricsResponse>({
    queryKey: salesmanMetricsKeys.all,
    queryFn: () => salesmanService.getMyMetrics(),
    staleTime: 60 * 1000, // 1 min
  });
}
