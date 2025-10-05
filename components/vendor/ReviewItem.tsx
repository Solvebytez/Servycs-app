import React from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "@/components/UI";
import { COLORS, MARGIN, PADDING, FONT_SIZE, BORDER_RADIUS } from "@/constants";

interface Review {
  id: string;
  reviewerName: string;
  avatar: string;
  timestamp: string;
  rating: number;
  serviceType: string;
  serviceListing?: {
    id: string;
    name: string;
    category: string;
  };
  message: string;
  helpfulCount: number;
}

interface ReviewItemProps {
  review: Review;
  onPress?: (review: Review) => void;
  onHelpful?: (reviewId: string) => void;
  onServicePress?: (serviceId: string) => void;
  showDivider?: boolean;
  isHelpful?: boolean;
  isTogglingHelpful?: boolean;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  onPress,
  onHelpful,
  onServicePress,
  showDivider = true,
  isHelpful = false,
  isTogglingHelpful = false,
}) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={FONT_SIZE.caption1}
        color="#FF8C00"
        style={{ marginRight: 2 }}
      />
    ));
  };

  return (
    <>
      <TouchableOpacity
        style={styles.reviewItem}
        onPress={() => onPress?.(review)}
        activeOpacity={0.7}
      >
        {/* Avatar and Main Content */}
        <View style={styles.reviewContent}>
          <Image source={{ uri: review.avatar }} style={styles.avatar} />

          <View style={styles.reviewDetails}>
            {/* Name and Timestamp Row */}
            <View style={styles.topRow}>
              <View style={{ flex: 1 }}>
                <ResponsiveText
                  variant="body1"
                  weight="bold"
                  color={COLORS.text.primary}
                  style={{ fontSize: FONT_SIZE.body1 }}
                >
                  {review.reviewerName}
                </ResponsiveText>
              </View>
              <View style={styles.timestampContainer}>
                <Ionicons
                  name="time-outline"
                  size={FONT_SIZE.caption2}
                  color={COLORS.text.secondary}
                  style={{ marginRight: MARGIN.xs }}
                />
                <ResponsiveText
                  variant="caption2"
                  color={COLORS.text.secondary}
                  style={{ fontSize: FONT_SIZE.caption2 }}
                >
                  {review.timestamp}
                </ResponsiveText>
              </View>
            </View>

            {/* Rating and Service Type */}
            <View style={styles.ratingContainer}>
              <View style={styles.starsContainer}>
                {renderStars(review.rating)}
              </View>
              <View style={styles.serviceTypeContainer}>
                {review.serviceListing ? (
                  <TouchableOpacity
                    onPress={() => onServicePress?.(review.serviceListing!.id)}
                    activeOpacity={0.7}
                    style={styles.serviceTypeTouchable}
                  >
                    <Text
                      style={[styles.serviceType, styles.clickableService]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      for {review.serviceListing.name}
                    </Text>
                  </TouchableOpacity>
                ) : review.serviceType ? (
                  <Text
                    style={styles.serviceType}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    for {review.serviceType}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Review Message Preview */}
            <ResponsiveText
              variant="caption1"
              color={COLORS.text.secondary}
              style={styles.messagePreview}
              numberOfLines={2}
            >
              {review.message}
            </ResponsiveText>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  isHelpful && styles.helpfulButtonActive,
                ]}
                onPress={() => onHelpful?.(review.id)}
                activeOpacity={0.7}
                disabled={isTogglingHelpful}
              >
                <Ionicons
                  name={isHelpful ? "thumbs-up" : "thumbs-up-outline"}
                  size={FONT_SIZE.caption1}
                  color={
                    isHelpful ? COLORS.primary.main : COLORS.text.secondary
                  }
                  style={{ marginRight: MARGIN.xs }}
                />
                <ResponsiveText
                  variant="caption2"
                  color={
                    isHelpful ? COLORS.primary.main : COLORS.text.secondary
                  }
                  style={{ fontSize: FONT_SIZE.caption2 }}
                >
                  {isTogglingHelpful
                    ? "..."
                    : `Helpful (${review.helpfulCount})`}
                </ResponsiveText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      {/* Divider between items */}
      {showDivider && <View style={styles.itemDivider} />}
    </>
  );
};

const styles = StyleSheet.create({
  reviewItem: {
    paddingVertical: PADDING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginVertical: MARGIN.xs,
  },
  reviewContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.xxl,
    marginRight: MARGIN.lg,
    backgroundColor: COLORS.background.light,
    borderWidth: 2,
    borderColor: COLORS.background.light,
  },
  reviewDetails: {
    flex: 1,
    paddingTop: MARGIN.xs,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  timestampContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background.secondary,
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: MARGIN.sm,
  },
  starsContainer: {
    flexDirection: "row",
    marginRight: MARGIN.sm,
  },
  serviceTypeContainer: {
    flex: 1,
    minWidth: 0, // This is crucial for text truncation to work
    maxWidth: "100%", // Ensure it doesn't exceed container
  },
  serviceTypeTouchable: {
    flex: 1,
    minWidth: 0,
    maxWidth: "100%",
  },
  serviceType: {
    fontWeight: "600",
    fontSize: FONT_SIZE.body2,
    color: COLORS.primary[300],
    flex: 1,
    minWidth: 0, // This is crucial for text truncation to work
    maxWidth: "100%", // Ensure it doesn't exceed container
  },
  clickableService: {
    textDecorationLine: "underline",
  },
  messagePreview: {
    lineHeight: 20,
    color: COLORS.text.secondary,
    fontSize: FONT_SIZE.caption1,
    marginBottom: MARGIN.sm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: MARGIN.lg,
  },
  helpfulButtonActive: {
    // Only change color, no extra padding or margin
  },
  itemDivider: {
    height: 1,
    backgroundColor: COLORS.background.light,
    marginTop: PADDING.lg,
    marginLeft: 56, // Align with text content (avatar width + margin)
    marginRight: PADDING.lg,
  },
});

export default ReviewItem;
