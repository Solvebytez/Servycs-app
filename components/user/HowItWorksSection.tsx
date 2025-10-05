import React from "react";
import { View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ResponsiveText } from "../UI/ResponsiveText";
import { COLORS, MARGIN, PADDING } from "@/constants";

interface HowItWorksStep {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const steps: HowItWorksStep[] = [
  {
    icon: "shield-checkmark",
    title: "Browse verified",
    description: "service providers",
  },
  {
    icon: "calendar",
    title: "Book instantly or",
    description: "schedule",
  },
  {
    icon: "heart",
    title: "Relax while pro",
    description: "handle it",
  },
];

const iconColors = [
  "#4CAF50", // Green for verified services
  "#2196F3", // Blue for booking
  "#FF9800", // Orange for heart/relax
];

export const HowItWorksSection: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Title */}
      <ResponsiveText
        variant="h5"
        weight="bold"
        color={COLORS.text.primary}
        style={styles.title}
      >
        How Listro works ?
      </ResponsiveText>

      {/* Steps */}
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <View key={index} style={styles.stepContainer}>
            {/* Icon Circle */}
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: iconColors[index] },
              ]}
            >
              <Ionicons name={step.icon} size={24} color={COLORS.white} />
            </View>

            {/* Text Content */}
            <View style={styles.textContainer}>
              <ResponsiveText
                variant="body2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.stepTitle}
              >
                {step.title}
              </ResponsiveText>
              <ResponsiveText
                variant="body2"
                weight="medium"
                color={COLORS.text.primary}
                style={styles.stepDescription}
              >
                {step.description}
              </ResponsiveText>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: MARGIN.md,
    paddingHorizontal: PADDING.screen,
    paddingVertical: MARGIN.lg,
    backgroundColor: COLORS.background.primary,
  },
  title: {
    textAlign: "center",
    marginBottom: MARGIN.xl,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: PADDING.sm,
  },
  stepContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: PADDING.xs,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: MARGIN.md,
  },
  textContainer: {
    alignItems: "center",
  },
  stepTitle: {
    textAlign: "center",
    marginBottom: 2,
    lineHeight: 16,
    fontSize: 12,
  },
  stepDescription: {
    textAlign: "center",
    lineHeight: 16,
    fontSize: 12,
  },
});
