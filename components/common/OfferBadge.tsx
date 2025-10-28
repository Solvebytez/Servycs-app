import React from "react";
import { View, StyleSheet } from "react-native";
import { ResponsiveText } from "@/components/UI";
import { COLORS, BORDER_RADIUS, PADDING } from "@/constants";

interface OfferBadgeProps {
  discountType: "FIXED" | "PERCENTAGE";
  discountValue: number;
  originalPrice: number;
  discountedPrice: number;
  promotionTitle?: string;
  size?: "small" | "medium" | "large";
}

export const OfferBadge: React.FC<OfferBadgeProps> = ({
  discountType,
  discountValue,
  originalPrice,
  discountedPrice,
  promotionTitle,
  size = "medium",
}) => {
  const savings = originalPrice - discountedPrice;
  const savingsPercentage = Math.round((savings / originalPrice) * 100);

  const getBadgeText = () => {
    if (discountType === "PERCENTAGE") {
      return `${discountValue}% OFF`;
    } else {
      return `$${discountValue} OFF`;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          container: styles.smallContainer,
          text: styles.smallText,
          priceText: styles.smallPriceText,
        };
      case "large":
        return {
          container: styles.largeContainer,
          text: styles.largeText,
          priceText: styles.largePriceText,
        };
      default:
        return {
          container: styles.mediumContainer,
          text: styles.mediumText,
          priceText: styles.mediumPriceText,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View style={[styles.container, sizeStyles.container]}>
      <View style={styles.badgeContent}>
        <ResponsiveText
          variant="caption2"
          weight="bold"
          color={COLORS.white}
          style={[styles.badgeText, sizeStyles.text]}
        >
          {getBadgeText()}
        </ResponsiveText>
        <ResponsiveText
          variant="caption2"
          weight="medium"
          color={COLORS.white}
          style={[styles.priceText, sizeStyles.priceText]}
        >
          ₹{discountedPrice.toFixed(0)}
        </ResponsiveText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.success[500],
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: PADDING.xs,
    paddingVertical: PADDING.xs / 2,
    alignSelf: "flex-start",
  },
  badgeContent: {
    alignItems: "center",
  },
  badgeText: {
    lineHeight: 12,
  },
  priceText: {
    lineHeight: 10,
    opacity: 0.9,
  },
  // Size variants
  smallContainer: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  smallText: {
    fontSize: 8,
    lineHeight: 10,
  },
  smallPriceText: {
    fontSize: 7,
    lineHeight: 8,
  },
  mediumContainer: {
    paddingHorizontal: PADDING.xs,
    paddingVertical: PADDING.xs / 2,
  },
  mediumText: {
    fontSize: 10,
    lineHeight: 12,
  },
  mediumPriceText: {
    fontSize: 9,
    lineHeight: 10,
  },
  largeContainer: {
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
  },
  largeText: {
    fontSize: 12,
    lineHeight: 14,
  },
  largePriceText: {
    fontSize: 11,
    lineHeight: 12,
  },
});
