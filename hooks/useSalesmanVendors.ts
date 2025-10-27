import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../services/api";

interface VendorFilters {
  status?: "ACTIVE" | "PENDING" | "INACTIVE" | "SUSPENDED";
}

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  businessName?: string;
  businessEmail?: string;
  businessPhone?: string;
  status: "ACTIVE" | "PENDING" | "INACTIVE" | "SUSPENDED";
  isVerified: boolean;
  rating: number;
  totalReviews: number;
  serviceListingsCount: number;
  createdAt: string;
  profilePicture?: string;
}

interface SalesmanVendorsResponse {
  success: boolean;
  data: Vendor[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const fetchSalesmanVendors = async (
  salesmanId: string,
  filters?: VendorFilters,
  page: number = 1,
  limit: number = 10
): Promise<SalesmanVendorsResponse> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.status) {
    params.append("status", filters.status);
  }

  const response = await api.get(`/salesmen/${salesmanId}/vendors?${params}`);
  return response.data;
};

export const useSalesmanVendors = (
  salesmanId: string,
  filters?: VendorFilters,
  limit: number = 10
) => {
  return useInfiniteQuery({
    queryKey: ["salesmanVendors", salesmanId, filters],
    queryFn: ({ pageParam = 1 }) =>
      fetchSalesmanVendors(salesmanId, filters, pageParam, limit),
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    enabled: !!salesmanId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
