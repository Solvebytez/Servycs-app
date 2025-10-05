import React from "react";
import { View, Image, TouchableOpacity, Dimensions } from "react-native";
import { router } from "expo-router";
import Carousel from "react-native-reanimated-carousel";
import { useActivePromotions } from "../../hooks/usePromotions";
import { Promotion } from "../../services/promotion";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../constants";

const { width: screenWidth } = Dimensions.get("window");

// Simple promotion card component
const PromotionCard: React.FC<{
  promotion: Promotion;
  onImageLoad?: (dimensions: { width: number; height: number }) => void;
}> = ({ promotion, onImageLoad }) => {
  const handlePress = () => {
    if (promotion.serviceListings.length > 0) {
      router.push(
        `/(dashboard)/service-details?id=${promotion.serviceListings[0].id}`
      );
    } else {
      router.push(`/(dashboard)/(user)/search?promotion=${promotion.id}`);
    }
  };

  const handleImageLoad = (event: any) => {
    const { width, height } = event.nativeEvent.source;
    if (onImageLoad) {
      onImageLoad({ width, height });
    }
  };

  return (
    <TouchableOpacity
      style={styles.promotionCard}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: promotion.bannerImage }}
        style={styles.promotionImage}
        resizeMode="contain"
        onLoad={handleImageLoad}
      />
    </TouchableOpacity>
  );
};

// Main search promotion banner component
export const SearchPromotionBanner: React.FC = () => {
  const [carouselHeight, setCarouselHeight] = React.useState(
    (screenWidth - PADDING.screen * 2) * 0.8
  );

  const {
    data: activePromotions,
    isLoading,
    error,
  } = useActivePromotions(true);

  // Show latest 5 promotions (excluding current user)
  const filteredPromotions = React.useMemo(() => {
    if (!activePromotions) return activePromotions;
    return activePromotions.slice(0, 5); // Show latest 5 promotions
  }, [activePromotions]);

  // Update carousel height when image dimensions change
  const handleImageLoad = (imageDimensions: {
    width: number;
    height: number;
  }) => {
    const maxWidth = screenWidth - PADDING.screen * 2;
    const aspectRatio = imageDimensions.width / imageDimensions.height;

    let cardHeight = maxWidth / aspectRatio;

    // If height is too tall, scale down based on height
    if (cardHeight > maxWidth * 0.8) {
      cardHeight = maxWidth * 0.8;
    }

    setCarouselHeight(cardHeight);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard} />
      </View>
    );
  }

  if (error || !filteredPromotions || filteredPromotions.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Carousel
        loop={true}
        width={screenWidth - PADDING.screen * 2}
        height={carouselHeight}
        autoPlay={true}
        data={filteredPromotions}
        scrollAnimationDuration={300}
        autoPlayInterval={3000}
        renderItem={({ item }) => (
          <PromotionCard promotion={item} onImageLoad={handleImageLoad} />
        )}
        style={styles.carousel}
      />
    </View>
  );
};

const styles = {
  container: {},
  carousel: {
    width: screenWidth - PADDING.screen * 2,
  },
  promotionCard: {
    flex: 1,
    borderRadius: 0,
    overflow: "hidden" as const,
  },
  promotionImage: {
    flex: 1,
  },
  loadingContainer: {
    marginTop: MARGIN.md,
    paddingHorizontal: PADDING.screen,
  },
  loadingCard: {
    width: screenWidth - PADDING.screen * 2,
    height: (screenWidth - PADDING.screen * 2) * (3 / 4), // 4:3 aspect ratio like the blue banner
    backgroundColor: COLORS.neutral[100],
    borderRadius: 0,
  },
};
