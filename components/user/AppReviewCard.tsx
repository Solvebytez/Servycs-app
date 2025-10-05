import React from "react";
import { View, StyleSheet } from "react-native";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS } from "../../constants";
import { Ionicons } from "@expo/vector-icons";

interface AppReviewCardProps {
  review: {
    id: string;
    rating: number;
    title?: string;
    comment?: string;
    user: {
      name: string;
    };
    isAnonymous?: boolean;
  };
}

export const AppReviewCard: React.FC<AppReviewCardProps> = ({ review }) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Ionicons
        key={index}
        name={index < rating ? "star" : "star-outline"}
        size={16}
        color="#FFD700" // Golden yellow
        style={styles.star}
      />
    ));
  };

  const displayName = review.isAnonymous ? "Anonymous" : review.user.name;

  return (
    <View style={styles.container}>
      {/* Stars */}
      <View style={styles.starsContainer}>{renderStars(review.rating)}</View>

      {/* Review Text */}
      <ResponsiveText
        variant="body1"
        color={COLORS.white}
        style={styles.reviewText}
      >
        "{review.comment || review.title || "Great experience with this app!"}"
      </ResponsiveText>

      {/* Separator Line */}
      <View style={styles.separator} />

      {/* Reviewer Name */}
      <ResponsiveText
        variant="body2"
        color={COLORS.white}
        style={styles.reviewerName}
        numberOfLines={1}
      >
        {displayName}
      </ResponsiveText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#2D5A5A", // Dark teal/green color
    borderRadius: 16,
    padding: 20,
    paddingLeft: 30, // Add left padding to avoid arrow overlap
    paddingRight: 30, // Add right padding to avoid arrow overlap
    marginHorizontal: 0, // Remove margin since CARD_WIDTH accounts for it
    minHeight: 200,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    alignItems: "center",
  },
  star: {
    marginRight: 4,
  },
  reviewText: {
    lineHeight: 20,
    flex: 1,
    marginBottom: 16,
    textAlign: "left",
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.white,
    opacity: 0.2,
    marginBottom: 12,
    marginTop: 4,
  },
  reviewerName: {
    fontWeight: "600",
    fontSize: 12,
    opacity: 0.9,
  },
});
