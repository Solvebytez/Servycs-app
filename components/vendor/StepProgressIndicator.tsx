import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS, MARGIN, PADDING, BORDER_RADIUS } from "@/constants";

interface StepProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
}

export const StepProgressIndicator: React.FC<StepProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepTitles,
}) => {
  const renderStep = (
    stepNumber: number,
    title: string,
    isActive: boolean,
    isCompleted: boolean
  ) => {
    const getStepIcon = () => {
      if (isCompleted) {
        return (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={COLORS.success[500]}
          />
        );
      }
      if (isActive) {
        return (
          <Ionicons name="ellipse" size={24} color={COLORS.primary[500]} />
        );
      }
      return (
        <Ionicons
          name="ellipse-outline"
          size={24}
          color={COLORS.neutral[400]}
        />
      );
    };

    const getStepColor = () => {
      if (isCompleted) return COLORS.success[500];
      if (isActive) return COLORS.primary[500];
      return COLORS.neutral[400];
    };

    return (
      <View key={stepNumber} style={styles.stepContainer}>
        <View style={styles.stepIconContainer}>{getStepIcon()}</View>
        <ResponsiveText
          variant="caption2"
          color={getStepColor()}
          style={styles.stepNumber}
        >
          Step {stepNumber}
        </ResponsiveText>
      </View>
    );
  };

  const renderConnector = (index: number) => {
    const isCompleted = index < currentStep - 1;
    return (
      <View
        key={`connector-${index}`}
        style={[styles.connector, isCompleted && styles.connectorCompleted]}
      />
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
        {stepTitles.map((title, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <React.Fragment key={stepNumber}>
              {renderStep(stepNumber, title, isActive, isCompleted)}
              {index < stepTitles.length - 1 && renderConnector(index)}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: PADDING.lg,
    backgroundColor: COLORS.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border.light,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: MARGIN.sm,
  },
  stepContainer: {
    alignItems: "center",
    flex: 1,
  },
  stepIconContainer: {
    marginBottom: MARGIN.xs,
  },
  stepNumber: {
    textAlign: "center",
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.neutral[300],
    marginHorizontal: MARGIN.sm,
    marginTop: -12, // Align with center of step icons
  },
  connectorCompleted: {
    backgroundColor: COLORS.success[500],
  },
});
