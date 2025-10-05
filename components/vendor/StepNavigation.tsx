import React from "react";
import { View, StyleSheet, Alert } from "react-native";
import { ResponsiveButton } from "../UI/ResponsiveButton";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS, MARGIN, PADDING } from "@/constants";

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  isNextDisabled?: boolean;
  isNextLoading?: boolean;
  isPreviousDisabled?: boolean;
  nextButtonText?: string;
}

export const StepNavigation: React.FC<StepNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  isNextDisabled = false,
  isNextLoading = false,
  isPreviousDisabled = false,
  nextButtonText,
}) => {
  const getNextButtonText = () => {
    if (nextButtonText) return nextButtonText;
    if (currentStep === totalSteps) return "Submit for Review";
    return "Save & Next";
  };

  const handleNext = () => {
    if (currentStep === totalSteps) {
      Alert.alert(
        "Complete Listing",
        "Are you ready to submit your listing for review? This will make it visible to customers.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Submit", onPress: onNext },
        ]
      );
    } else {
      onNext();
    }
  };

  return (
    <View style={styles.container}>
      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {/* Previous Button */}
        <ResponsiveButton
          title="Previous"
          variant="outline"
          size="medium"
          onPress={onPrevious}
          disabled={isPreviousDisabled}
          style={[
            styles.navigationButton,
            styles.previousButton,
            isPreviousDisabled && styles.disabledButton,
          ]}
        />

        {/* Next Button */}
        <ResponsiveButton
          title={getNextButtonText()}
          variant="primary"
          size="medium"
          onPress={handleNext}
          disabled={isNextDisabled}
          loading={isNextLoading}
          style={[
            styles.navigationButton,
            styles.nextButton,
            isNextDisabled && styles.disabledButton,
          ]}
        />
      </View>

      {/* Step Info */}
      <View style={styles.stepInfo}>
        <ResponsiveText
          variant="caption2"
          color={COLORS.text.secondary}
          style={styles.stepInfoText}
        >
          Step {currentStep} of {totalSteps}
        </ResponsiveText>
        {currentStep < totalSteps && (
          <ResponsiveText
            variant="caption2"
            color={COLORS.text.secondary}
            style={styles.stepInfoText}
          >
            • Complete all steps to publish
          </ResponsiveText>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background.primary,
    borderTopWidth: 1,
    borderTopColor: COLORS.border.light,
    paddingHorizontal: PADDING.screen,
    paddingVertical: PADDING.lg,
  },
  navigationContainer: {
    flexDirection: "row",
    gap: MARGIN.md,
    marginBottom: MARGIN.md,
  },
  navigationButton: {
    flex: 1,
  },
  previousButton: {
    borderColor: COLORS.neutral[400],
  },
  nextButton: {
    // Primary button styling
  },
  disabledButton: {
    opacity: 0.5,
  },
  stepInfo: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: MARGIN.sm,
  },
  stepInfoText: {
    textAlign: "center",
  },
});
