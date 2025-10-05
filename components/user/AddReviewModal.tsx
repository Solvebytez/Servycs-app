import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Alert,
  TextInput,
  Text,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "../../constants";
import { ResponsiveText, ResponsiveButton } from "../UI";
import {
  useCreateServiceReview,
  useUpdateServiceReview,
} from "../../hooks/useServiceReviews";

interface AddReviewModalProps {
  visible: boolean;
  onClose: () => void;
  serviceTitle: string;
  serviceId: string;
  listingId: string;
  vendorId: string;
  userId: string;
  onReviewSubmitted?: () => void; // Optional callback for when review is successfully submitted
  existingReview?: any; // Existing review data for editing
  isEditing?: boolean; // Whether we're editing an existing review
}

export const AddReviewModal: React.FC<AddReviewModalProps> = ({
  visible,
  onClose,
  serviceTitle,
  serviceId,
  listingId,
  vendorId,
  userId,
  onReviewSubmitted,
  existingReview,
  isEditing = false,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  // Use the API hooks
  const createReviewMutation = useCreateServiceReview();
  const updateReviewMutation = useUpdateServiceReview();

  // Update form fields when modal opens or existing review data changes
  useEffect(() => {
    console.log("🔍 AddReviewModal - existingReview data:", {
      existingReview,
      isEditing,
      rating: existingReview?.rating,
      comment: existingReview?.comment,
    });

    if (existingReview && isEditing) {
      console.log("🔍 Pre-populating form with:", {
        rating: existingReview.rating,
        comment: existingReview.comment,
      });
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || "");
    } else {
      // Reset form for new review
      console.log("🔍 Resetting form for new review");
      setRating(0);
      setComment("");
    }
  }, [existingReview, isEditing, visible]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert(
        "Rating Required",
        "Please select a rating before submitting your review."
      );
      return;
    }

    if (!comment.trim()) {
      Alert.alert(
        "Required Field",
        "Please provide a comment about your experience."
      );
      return;
    }

    if (comment.trim().length < 10) {
      Alert.alert(
        "Comment Too Short",
        "Please provide a more detailed comment (at least 10 characters)."
      );
      return;
    }

    try {
      if (isEditing && existingReview) {
        // Update existing review
        await updateReviewMutation.mutateAsync({
          reviewId: existingReview.id,
          updateData: {
            rating,
            comment: comment.trim(),
          },
        });

        // Success
        Alert.alert("Success", "Your review has been updated successfully!", [
          {
            text: "OK",
            onPress: () => {
              onClose();
              // Call optional callback
              onReviewSubmitted?.();
            },
          },
        ]);
      } else {
        // Create new review
        await createReviewMutation.mutateAsync({
          rating,
          comment: comment.trim(),
          listingId,
          serviceId,
          vendorId,
        });

        // Success
        Alert.alert("Success", "Your review has been submitted successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Reset form
              setRating(0);
              setComment("");
              onClose();
              // Call optional callback
              onReviewSubmitted?.();
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error submitting review:", error);

      // Handle specific error messages
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        "Failed to submit review. Please try again.";

      Alert.alert("Error", errorMessage);
    }
  };

  const handleClose = () => {
    if (rating > 0 || comment.trim().length > 0) {
      Alert.alert(
        "Discard Review",
        "You have unsaved changes. Are you sure you want to close?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Discard",
            style: "destructive",
            onPress: () => {
              setRating(0);
              setComment("");
              onClose();
            },
          },
        ]
      );
    } else {
      onClose();
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setRating(star)}
            style={styles.starButton}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= rating ? "star" : "star-outline"}
              size={32}
              color={star <= rating ? "#FFD700" : COLORS.neutral[300]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color={COLORS.text.primary} />
          </TouchableOpacity>

          <ResponsiveText
            variant="h6"
            weight="semiBold"
            color={COLORS.text.primary}
            style={styles.headerTitle}
          >
            {isEditing ? "Edit Review" : "Add Review"}
          </ResponsiveText>

          <View style={styles.headerRight} />
        </View>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            <ResponsiveText
              variant="h6"
              color={COLORS.text.primary}
              style={styles.serviceTitle}
            >
              Reviewing: {serviceTitle}
            </ResponsiveText>

            <View style={styles.ratingSection}>
              <ResponsiveText
                variant="body1"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                How was your experience?
              </ResponsiveText>
              {renderStars()}
            </View>

            <View style={styles.commentSection}>
              <ResponsiveText
                variant="body1"
                color={COLORS.text.primary}
                style={styles.sectionTitle}
              >
                Tell us more *
              </ResponsiveText>
              <View style={styles.commentContainer}>
                <TextInput
                  style={styles.commentInput}
                  value={comment}
                  onChangeText={setComment}
                  placeholder="Share your experience with this service..."
                  placeholderTextColor={COLORS.text.secondary}
                  multiline
                  maxLength={500}
                  textAlignVertical="top"
                />
                <ResponsiveText
                  variant="caption1"
                  color={COLORS.text.light}
                  style={styles.characterCount}
                >
                  {comment.length}/500 characters
                </ResponsiveText>
              </View>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <ResponsiveButton
            title="Cancel"
            variant="outline"
            size="small"
            onPress={handleClose}
            style={styles.cancelButton}
          />
          <ResponsiveButton
            title={
              createReviewMutation.isPending || updateReviewMutation.isPending
                ? isEditing
                  ? "Updating..."
                  : "Submitting..."
                : isEditing
                ? "Update Review"
                : "Submit Review"
            }
            variant="primary"
            size="small"
            onPress={handleSubmit}
            disabled={
              rating === 0 ||
              createReviewMutation.isPending ||
              updateReviewMutation.isPending
            }
            style={styles.submitButton}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: PADDING.lg,
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.neutral[100],
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: PADDING.lg,
    justifyContent: "center",
  },
  formContainer: {
    justifyContent: "center",
  },
  serviceTitle: {
    marginBottom: PADDING.lg,
    textAlign: "center",
  },
  ratingSection: {
    marginBottom: PADDING.lg,
    paddingVertical: PADDING.lg,
    alignItems: "center",
  },
  sectionTitle: {
    marginBottom: PADDING.sm,
    fontWeight: "600",
    textAlign: "center",
  },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: MARGIN.sm,
  },
  starButton: {
    padding: MARGIN.xs,
  },
  ratingText: {
    textAlign: "center",
    fontStyle: "italic",
  },
  commentSection: {
    flex: 1,
    paddingVertical: PADDING.lg,
  },
  commentContainer: {
    marginBottom: PADDING.md,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: COLORS.black,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: PADDING.md,
    paddingVertical: PADDING.sm,
    fontSize: 16,
    color: COLORS.text.primary,
    backgroundColor: COLORS.background.primary,
    textAlignVertical: "top",
    minHeight: 100,
  },
  characterCount: {
    textAlign: "right",
    marginTop: PADDING.xs,
  },
  serviceInfo: {
    paddingVertical: PADDING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  serviceInfoText: {
    marginBottom: MARGIN.xs,
  },
  footer: {
    flexDirection: "row",
    padding: PADDING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
    gap: MARGIN.md,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
});

export default AddReviewModal;
