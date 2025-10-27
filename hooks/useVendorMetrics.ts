import { useQuery } from "@tanstack/react-query";
import { vendorService, VendorMetricsResponse } from "@/services/vendor";

export const vendorMetricsKeys = {
  all: ["vendorMetrics"] as const,
  byWindow: (window: "7d" | "30d") =>
    [...vendorMetricsKeys.all, window] as const,
};

export function useVendorMetrics(window: "7d" | "30d" = "30d") {
  return useQuery<VendorMetricsResponse>({
    queryKey: vendorMetricsKeys.byWindow(window),
    queryFn: () => vendorService.getMyMetrics(window),
    staleTime: 60 * 1000, // 1 min
  });
}
