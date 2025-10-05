import React, { useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS, MARGIN, PADDING } from "../../constants";
import { Ionicons } from "@expo/vector-icons";
import { AppReviewCard } from "./AppReviewCard";

interface AppReview {
  id: string;
  rating: number;
  title?: string;
  comment?: string;
  user: {
    name: string;
  };
  isAnonymous?: boolean;
}

interface AppReviewsSectionProps {
  reviews: AppReview[];
  isLoading?: boolean;
  error?: string;
}

const { width: screenWidth } = Dimensions.get("window");
const CARD_WIDTH = screenWidth - 32; // Account for card margins (16px each side)

export const AppReviewsSection: React.FC<AppReviewsSectionProps> = ({
  reviews,
  isLoading = false,
  error,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * CARD_WIDTH,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < reviews.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      scrollViewRef.current?.scrollTo({
        x: newIndex * CARD_WIDTH,
        animated: true,
      });
    }
  };

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / CARD_WIDTH);
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.titleText}
          >
            Trusted by people
          </ResponsiveText>
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            style={styles.subtitleText}
          >
            Ratings & Reviews
          </ResponsiveText>
        </View>
        <View style={styles.loadingContainer}>
          <ResponsiveText variant="body2" color={COLORS.text.secondary}>
            Loading reviews...
          </ResponsiveText>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.titleText}
          >
            Trusted by people
          </ResponsiveText>
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            style={styles.subtitleText}
          >
            Ratings & Reviews
          </ResponsiveText>
        </View>
        <View style={styles.errorContainer}>
          <ResponsiveText variant="body2" color={COLORS.error[500]}>
            {error}
          </ResponsiveText>
        </View>
      </View>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <ResponsiveText
            variant="h5"
            weight="bold"
            color={COLORS.text.primary}
            style={styles.titleText}
          >
            Trusted by people
          </ResponsiveText>
          <ResponsiveText
            variant="caption1"
            color={COLORS.text.secondary}
            style={styles.subtitleText}
          >
            Ratings & Reviews
          </ResponsiveText>
        </View>
        <View style={styles.emptyContainer}>
          <ResponsiveText variant="body2" color={COLORS.text.secondary}>
            No reviews available yet
          </ResponsiveText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <ResponsiveText
          variant="h5"
          weight="bold"
          color={COLORS.text.primary}
          style={styles.titleText}
        >
          Trusted by people
        </ResponsiveText>
        <ResponsiveText
          variant="caption1"
          color={COLORS.text.secondary}
          style={styles.subtitleText}
        >
          Ratings & Reviews
        </ResponsiveText>
      </View>

      {/* Reviews Carousel */}
      <View style={styles.carouselContainer}>
        {/* Reviews ScrollView - Full Width */}
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          decelerationRate="fast"
        >
          {reviews.map((review, index) => (
            <View key={review.id} style={styles.reviewCardContainer}>
              <AppReviewCard review={review} />
            </View>
          ))}
        </ScrollView>

        {/* Previous Button - Absolute Positioned */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.prevButton,
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons
            name="chevron-back"
            size={20}
            color={
              currentIndex === 0 ? COLORS.text.disabled : COLORS.text.primary
            }
          />
        </TouchableOpacity>

        {/* Next Button - Absolute Positioned */}
        <TouchableOpacity
          style={[
            styles.navButton,
            styles.nextButton,
            currentIndex === reviews.length - 1 && styles.navButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={currentIndex === reviews.length - 1}
        >
          <Ionicons
            name="chevron-forward"
            size={20}
            color={
              currentIndex === reviews.length - 1
                ? COLORS.text.disabled
                : COLORS.text.primary
            }
          />
        </TouchableOpacity>
      </View>

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {reviews.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              index === currentIndex && styles.paginationDotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: MARGIN.xl,
    paddingHorizontal: 0,
  },
  header: {
    marginBottom: MARGIN.lg,
    paddingHorizontal: PADDING.screen,
  },
  titleText: {
    textAlign: "center",
  },
  subtitleText: {
    textAlign: "center",
    marginTop: 4,
  },
  carouselContainer: {
    position: "relative",
    marginBottom: MARGIN.sm,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    marginTop: -18, // Half of button height to center vertically
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 10,
  },
  prevButton: {
    left: 0, // Positioned at container edge, not overlapping device edge
  },
  nextButton: {
    right: 0, // Positioned at container edge, not overlapping device edge
  },
  navButtonDisabled: {
    backgroundColor: COLORS.background.secondary,
  },
  scrollView: {
    width: "100%",
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  reviewCardContainer: {
    width: CARD_WIDTH,
    paddingHorizontal: 16, // Add padding to create space for border radius
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.text.disabled,
    marginHorizontal: 6,
  },
  paginationDotActive: {
    backgroundColor: COLORS.text.primary,
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  loadingContainer: {
    padding: MARGIN.lg,
    alignItems: "center",
  },
  errorContainer: {
    padding: MARGIN.lg,
    alignItems: "center",
  },
  emptyContainer: {
    padding: MARGIN.lg,
    alignItems: "center",
  },
});
