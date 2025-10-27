import React from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Text,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import {
  COLORS,
  FONT_SIZE,
  MARGIN,
  PADDING,
  BORDER_RADIUS,
} from "../../constants";
import { ResponsiveText, ResponsiveCard } from "../UI";

// Helper function to get initials from name
const getInitials = (name: string): string => {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

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
  isVerified?: boolean;
}

interface ReviewDetailsModalProps {
  visible: boolean;
  review: Review | null;
  onClose: () => void;
  onHelpful?: (reviewId: string) => void;
  onServicePress?: (serviceId: string) => void;
  isHelpful?: boolean;
  isTogglingHelpful?: boolean;
}

// Render stars for rating display
const renderStars = (rating: number, size: number = 16) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars.push(
      <Ionicons
        key={i}
        name="star"
        size={size}
        color="#FF8C00"
        style={{ marginRight: 2 }}
      />
    );
  }

  if (hasHalfStar) {
    stars.push(
      <Ionicons
        key="half"
        name="star-half"
        size={size}
        color="#FF8C00"
        style={{ marginRight: 2 }}
      />
    );
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push(
      <Ionicons
        key={`empty-${i}`}
        name="star-outline"
        size={size}
        color="#FF8C00"
        style={{ marginRight: 2 }}
      />
    );
  }

  return stars;
};

export const ReviewDetailsModal: React.FC<ReviewDetailsModalProps> = ({
  visible,
  review,
  onClose,
  onHelpful,
  onServicePress,
  isHelpful = false,
  isTogglingHelpful = false,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>
          <ResponsiveText
            variant="h6"
            weight="bold"
            color={COLORS.text.primary}
          >
            Review Details
          </ResponsiveText>
          <View style={styles.modalHeaderPlaceholder} />
        </View>

        {review && (
          <ScrollView
            style={styles.modalContent}
            showsVerticalScrollIndicator={false}
          >
            <ResponsiveCard variant="elevated" style={styles.modalReviewCard}>
              <View style={styles.modalReviewHeader}>
                <View style={styles.modalReviewerInfo}>
                  {review.avatar &&
                  !review.avatar.includes("via.placeholder.com") ? (
                    <Image
                      source={{ uri: review.avatar }}
                      style={styles.modalAvatar}
                    />
                  ) : (
                    <View style={styles.modalAvatarPlaceholder}>
                      <ResponsiveText
                        variant="body1"
                        weight="bold"
                        color={COLORS.primary[500]}
                      >
                        {getInitials(review.reviewerName)}
                      </ResponsiveText>
                    </View>
                  )}
                  <View style={styles.modalReviewerDetails}>
                    <View style={styles.modalReviewerNameRow}>
                      <ResponsiveText
                        variant="body1"
                        weight="bold"
                        color={COLORS.text.primary}
                      >
                        {review.reviewerName}
                      </ResponsiveText>
                      {review.isVerified === false && (
                        <View style={styles.modalPendingBadge}>
                          <Ionicons
                            name="time-outline"
                            size={FONT_SIZE.caption2}
                            color={COLORS.warning[500]}
                            style={{ marginRight: MARGIN.xs }}
                          />
                          <ResponsiveText
                            variant="caption2"
                            color={COLORS.warning[500]}
                            style={{ fontSize: FONT_SIZE.caption2 }}
                          >
                            Unverified
                          </ResponsiveText>
                        </View>
                      )}
                      {review.isVerified === true && (
                        <View style={styles.modalVerifiedBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={FONT_SIZE.caption2}
                            color={COLORS.success[500]}
                            style={{ marginRight: MARGIN.xs }}
                          />
                          <ResponsiveText
                            variant="caption2"
                            color={COLORS.success[500]}
                            style={{ fontSize: FONT_SIZE.caption2 }}
                          >
                            Verified
                          </ResponsiveText>
                        </View>
                      )}
                    </View>
                    <ResponsiveText
                      variant="caption1"
                      color={COLORS.text.secondary}
                    >
                      {review.timestamp}
                    </ResponsiveText>
                  </View>
                </View>
                <View style={styles.modalRatingContainer}>
                  <View style={styles.modalStarsContainer}>
                    {renderStars(review.rating, 20)}
                  </View>
                  {review.serviceListing ? (
                    <TouchableOpacity
                      onPress={() =>
                        onServicePress?.(review.serviceListing!.id)
                      }
                      activeOpacity={0.7}
                      style={{ maxWidth: "100%" }}
                    >
                      <Text
                        style={{
                          color: COLORS.primary[300],
                          textDecorationLine: "underline",
                          fontSize: 14,
                          maxWidth: "100%",
                        }}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {review.serviceListing.name}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <Text
                      style={{
                        color: COLORS.text.secondary,
                        fontSize: 14,
                        maxWidth: "100%",
                      }}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {review.serviceType}
                    </Text>
                  )}
                </View>
              </View>

              <ResponsiveText
                variant="body2"
                color={COLORS.text.primary}
                style={styles.modalReviewMessage}
              >
                {review.message}
              </ResponsiveText>

              <View style={styles.modalReviewActions}>
                <TouchableOpacity
                  style={styles.modalHelpfulButton}
                  onPress={() => onHelpful?.(review.id)}
                  disabled={isTogglingHelpful}
                >
                  <Ionicons
                    name={isHelpful ? "thumbs-up" : "thumbs-up-outline"}
                    size={16}
                    color={
                      isHelpful ? COLORS.primary[500] : COLORS.text.secondary
                    }
                  />
                  <ResponsiveText
                    variant="caption1"
                    color={
                      isHelpful ? COLORS.primary[500] : COLORS.text.secondary
                    }
                    style={{ marginLeft: MARGIN.xs }}
                  >
                    {isTogglingHelpful
                      ? "..."
                      : `Helpful (${review.helpfulCount})`}
                  </ResponsiveText>
                </TouchableOpacity>
              </View>
            </ResponsiveCard>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  modalCloseButton: {
    padding: PADDING.xs,
  },
  modalHeaderPlaceholder: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: PADDING.screen,
  },
  modalReviewCard: {
    marginTop: MARGIN.lg,
    padding: PADDING.lg,
  },
  modalReviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: MARGIN.md,
  },
  modalReviewerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: MARGIN.md,
  },
  modalAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: MARGIN.md,
    backgroundColor: COLORS.primary[50],
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary[200],
  },
  modalReviewerDetails: {
    flex: 1,
  },
  modalReviewerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: MARGIN.xs,
  },
  modalPendingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.warning[50],
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  modalVerifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.success[50],
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.md,
  },
  modalRatingContainer: {
    alignItems: "flex-end",
  },
  modalStarsContainer: {
    flexDirection: "row",
    marginBottom: MARGIN.xs,
  },
  modalReviewMessage: {
    lineHeight: 22,
    marginBottom: MARGIN.md,
  },
  modalReviewActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalHelpfulButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: PADDING.sm,
    paddingVertical: PADDING.xs,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background.light,
  },
});

export default ReviewDetailsModal;
