import { Promotion } from "@/services/promotion";

export interface PromotionWithService {
  id: string;
  promotion: {
    id: string;
    title: string;
    discountType: string;
    discountValue: number;
    createdAt?: string; // Optional - only available in full promotion data
  };
}

// Interface for service data structure (simpler version)
export interface ServicePromotionListing {
  id: string;
  promotion: {
    id: string;
    title: string;
    discountType: string;
    discountValue: number;
  };
}

/**
 * Calculate the discounted price for a given promotion
 */
export const calculateDiscountedPrice = (
  originalPrice: number,
  discountType: "FIXED" | "PERCENTAGE",
  discountValue: number
): number => {
  if (discountType === "FIXED") {
    return Math.max(0, originalPrice - discountValue);
  } else {
    // PERCENTAGE
    return Math.max(0, originalPrice * (1 - discountValue / 100));
  }
};

/**
 * Calculate the savings amount for a given promotion
 */
export const calculateSavings = (
  originalPrice: number,
  discountType: "FIXED" | "PERCENTAGE",
  discountValue: number
): number => {
  return (
    originalPrice -
    calculateDiscountedPrice(originalPrice, discountType, discountValue)
  );
};

/**
 * Find the best promotion for a service based on the latest creation date
 * This function prioritizes the most recently created promotion
 */
export const getBestPromotionForService = (
  promotionListings: PromotionWithService[] | undefined,
  originalPrice: number
): PromotionWithService | null => {
  if (!promotionListings || promotionListings.length === 0) {
    return null;
  }

  if (promotionListings.length === 1) {
    return promotionListings[0];
  }

  // Sort by creation date (most recent first)
  // If createdAt is not available, fall back to array order (first = most recent)
  const sortedPromotions = [...promotionListings].sort((a, b) => {
    const dateA = a.promotion.createdAt
      ? new Date(a.promotion.createdAt)
      : new Date(0);
    const dateB = b.promotion.createdAt
      ? new Date(b.promotion.createdAt)
      : new Date(0);
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });

  return sortedPromotions[0];
};

/**
 * Find the best promotion for a service from service data (simpler structure)
 * Since service data doesn't include createdAt, we need to sort by creation date
 * We'll use the promotion ID as a fallback since newer IDs are typically higher
 */
export const getBestPromotionFromServiceData = (
  promotionListings: ServicePromotionListing[] | undefined,
  originalPrice: number
): ServicePromotionListing | null => {
  if (!promotionListings || promotionListings.length === 0) {
    return null;
  }

  if (promotionListings.length === 1) {
    return promotionListings[0];
  }

  // Sort by promotion ID (assuming newer IDs are higher)
  // This is a fallback when createdAt is not available
  const sortedPromotions = [...promotionListings].sort((a, b) => {
    // Compare promotion IDs as strings (MongoDB ObjectIds are sortable)
    return b.promotion.id.localeCompare(a.promotion.id);
  });

  return sortedPromotions[0];
};

/**
 * Get promotion display information for UI components
 */
export const getPromotionDisplayInfo = (
  promotionListing: PromotionWithService,
  originalPrice: number
) => {
  const { promotion } = promotionListing;
  const discountedPrice = calculateDiscountedPrice(
    originalPrice,
    promotion.discountType as "FIXED" | "PERCENTAGE",
    promotion.discountValue
  );
  const savings = calculateSavings(
    originalPrice,
    promotion.discountType as "FIXED" | "PERCENTAGE",
    promotion.discountValue
  );

  return {
    promotion,
    discountedPrice,
    savings,
    discountText:
      promotion.discountType === "PERCENTAGE"
        ? `${promotion.discountValue}% OFF`
        : `₹${promotion.discountValue} OFF`,
    savingsText: `Save ₹${savings.toFixed(0)}`,
  };
};
